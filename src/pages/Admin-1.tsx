import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Shield, Settings, BarChart3, ChevronLeft, Edit, Trash2, Plus, X, Check, Save, BookOpen, ToggleRight, ChevronRight } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import useSWR from 'swr'

type Tab = 'stats' | 'users' | 'events' | 'help' | 'meetings' | 'rituals' | 'settings' | 'moderation'
type UserRow = { id: string; name: string; avatar_url?: string; role: string; provider: string; created_at: string }
type EventRow = { id: string; event_date: string; title: string; title_crh?: string; description?: string; description_crh?: string; type: string }
type HelpRow  = { id: string; title: string; type: string; urgency: string; status: string; location: string; created_at: string; responses_count?: number; author_id?: string }
type MeetRow  = { id: string; village: string; organizer: string; meeting_date: string; status: string; attendees_count?: number }
type RitualRow = { id: string; title: string; title_crh?: string; subtitle?: string; subtitle_crh?: string; icon?: string; sort_order?: number }
type ReportRow = { id: string; reporter_id: string; target_type: string; target_id: string; reason: string; description?: string; status: string; created_at: string }
type AuditLogRow = { id: string; admin_id: string; action: string; target_type: string; target_id: string; created_at: string; admin?: { name: string; email: string } }

const fetcher = async (key: string) => {
  const [table, pageStr, limitStr] = key.split(':');
  const page = parseInt(pageStr, 10);
  const limit = parseInt(limitStr, 10);
  const from = (page - 1) * limit;
  const to = from + limit - 1;

  const { data, count } = await supabase
    .from(table)
    .select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range(from, to);
    
  return { data, count };
};

export default function Admin() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { featureToggles, setFeatureToggle } = useStore()
  const isModerator = profile?.role === 'moderator'
  const [tab, setTab] = useState<Tab>(isModerator ? 'moderation' : 'stats')
  const [stats, setStats] = useState<Record<string, number>>({})
  const [events, setEvents] = useState<EventRow[]>([])
  const [helpReqs, setHelpReqs] = useState<HelpRow[]>([])
  const [meetingList, setMeetingList] = useState<MeetRow[]>([])
  const [rituals, setRituals] = useState<RitualRow[]>([])
  const [reports, setReports] = useState<ReportRow[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editEvent, setEditEvent] = useState<Partial<EventRow> | null>(null)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editRitual, setEditRitual] = useState<Partial<RitualRow> | null>(null)
  const [toast, setToast] = useState('')

  // Pagination state for users
  const [usersPage, setUsersPage] = useState(1);
  const usersLimit = 10;
  
  const { data: usersData, mutate: mutateUsers } = useSWR(
    tab === 'users' && !isModerator ? `profiles:${usersPage}:${usersLimit}` : null,
    fetcher
  );

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { loadTab(tab) }, [tab])

  const loadTab = async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'stats' && !isModerator) {
        const { data } = await supabase.from('admin_stats').select('*').single()
        if (data) setStats(data as any)
      }
      if (t === 'events') {
        const { data } = await supabase.from('ethno_events').select('*').order('event_date')
        if (data) setEvents(data as EventRow[])
      }
      if (t === 'help') {
        const { data } = await supabase.from('help_requests_with_count').select('*').order('created_at', { ascending: false })
        if (data) setHelpReqs(data as HelpRow[])
      }
      if (t === 'moderation') {
        const { data } = await supabase.from('help_requests_with_count').select('*').eq('status', 'pending').order('created_at', { ascending: false })
        if (data) setHelpReqs(data as HelpRow[])
        const { data: reportsData } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
        if (reportsData) setReports(reportsData as ReportRow[])
        const { data: auditData } = await supabase.from('audit_logs').select('*, admin:profiles!audit_logs_admin_id_fkey(name, email)').order('created_at', { ascending: false }).limit(50)
        if (auditData) setAuditLogs(auditData as AuditLogRow[])
      }
      if (t === 'meetings') {
        const { data } = await supabase.from('meetings_with_stats').select('*').order('meeting_date', { ascending: false })
        if (data) setMeetingList(data as MeetRow[])
      }
      if (t === 'rituals') {
        const { data } = await supabase.from('rituals').select('*').order('sort_order')
        if (data) setRituals(data as RitualRow[])
      }
    } catch (error) {
      console.error('Error loading tab data:', error)
      showToast('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const logAudit = async (action: string, target_type: string, target_id: string) => {
    if (!profile) return
    await supabase.from('audit_logs').insert({
      admin_id: profile.id,
      action,
      target_type,
      target_id
    })
  }

  const saveEvent = async () => {
    if (!editEvent) return
    if (editEvent.id) {
      await supabase.from('ethno_events').update(editEvent).eq('id', editEvent.id)
      await logAudit('update', 'ethno_events', editEvent.id)
    } else {
      const { data } = await supabase.from('ethno_events').insert(editEvent).select().single()
      if (data) await logAudit('create', 'ethno_events', data.id)
    }
    setEditEvent(null); loadTab('events'); showToast('Сохранено ✓')
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Удалить событие?')) return
    await supabase.from('ethno_events').delete().eq('id', id)
    await logAudit('delete', 'ethno_events', id)
    loadTab('events'); showToast('Удалено')
  }

  const saveRitual = async () => {
    if (!editRitual) return
    if (editRitual.id) {
      await supabase.from('rituals').update(editRitual).eq('id', editRitual.id)
      await logAudit('update', 'rituals', editRitual.id)
    } else {
      const { data } = await supabase.from('rituals').insert(editRitual).select().single()
      if (data) await logAudit('create', 'rituals', data.id)
    }
    setEditRitual(null); loadTab('rituals'); showToast('Обряд сохранен ✓')
  }

  const deleteRitual = async (id: string) => {
    if (!confirm('Удалить обряд?')) return
    await supabase.from('rituals').delete().eq('id', id)
    await logAudit('delete', 'rituals', id)
    loadTab('rituals'); showToast('Удалено')
  }

  const updateUserRole = async (uid: string, role: string) => {
    if (isModerator) return
    
    // Try direct update first (in case RLS allows it)
    let { error } = await supabase.from('profiles').update({ role }).eq('id', uid)
    
    // Fallback to RPC if direct update fails due to RLS
    if (error) {
      console.log('Direct update failed, trying RPC fallback...', error)
      const { error: rpcError } = await supabase.rpc('set_user_role', { target_user_id: uid, new_role: role })
      error = rpcError
    }

    if (error) {
      console.error('Error updating role:', error)
      showToast('Ошибка при изменении роли')
      return
    }
    await logAudit('update_role', 'profiles', uid)
    if (usersData) {
      mutateUsers()
    }
    setEditUser(null); showToast('Роль изменена ✓')
  }

  const closeHelpRequest = async (id: string) => {
    await supabase.from('help_requests').update({ status: 'completed' }).eq('id', id)
    await logAudit('close', 'help_requests', id)
    loadTab('help'); showToast('Обращение закрыто')
  }

  const allTabs = [
    { id: 'stats'    as Tab, label: 'Статистика',   icon: BarChart3, show: !isModerator },
    { id: 'users'    as Tab, label: 'Пользователи', icon: Users,     show: !isModerator },
    { id: 'moderation' as Tab, label: 'Модерация', icon: Shield,    show: true },
    { id: 'events'   as Tab, label: 'Календарь',    icon: Settings,  show: true },
    { id: 'help'     as Tab, label: 'Ярдым',         icon: Shield,    show: true },
    { id: 'meetings' as Tab, label: 'Встречи',       icon: Settings,  show: true },
    { id: 'rituals'  as Tab, label: 'Обряды',        icon: BookOpen,  show: true },
    { id: 'settings' as Tab, label: 'Настройки',     icon: ToggleRight, show: !isModerator },
  ]
  const tabs = allTabs.filter(t => t.show)

  const statCards = [
    { key: 'total_users',     label: 'Пользователей',    color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'new_users_week',  label: 'За неделю',        color: 'text-blue-600',   bg: 'bg-blue-50' },
    { key: 'active_help',     label: 'Обращений',        color: 'text-rose-600',   bg: 'bg-rose-50' },
    { key: 'urgent_help',     label: 'Срочных',          color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'upcoming_meetings', label: 'Встреч',         color: 'text-amber-600',  bg: 'bg-amber-50' },
    { key: 'prayers_today',   label: 'Намазов сегодня',  color: 'text-emerald-600',bg: 'bg-emerald-50' },
  ]

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/sections')} className="flex items-center gap-2 text-gray-600 mb-2">
          <ChevronLeft className="w-5 h-5" /><span>Разделы</span>
        </button>
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Админ-панель</h1>
            <p className="text-sm text-gray-500">{profile?.name}</p>
          </div>
          <div className="w-10 h-10 bg-purple-100 rounded-xl flex items-center justify-center">
            <Shield className="w-5 h-5 text-purple-600" />
          </div>
        </div>
      </div>

      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex hide-scrollbar">
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-24">
        {loading && (
          <div className="space-y-3">
            {[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}
          </div>
        )}

        {/* STATS */}
        {!loading && tab === 'stats' && (
          <div>
            <div className="grid grid-cols-2 gap-3 mb-4">
              {statCards.map(({ key, label, color, bg }) => (
                <div key={key} className={`${bg} rounded-xl p-4 border border-white`}>
                  <div className={`text-3xl font-bold ${color}`}>{stats[key] ?? '—'}</div>
                  <div className="text-sm text-gray-600 mt-1">{label}</div>
                </div>
              ))}
            </div>
            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-700">
                Данные из базы Supabase в реальном времени.{' '}
                <a href="https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq"
                  target="_blank" rel="noreferrer" className="font-medium underline">Dashboard →</a>
              </p>
            </div>
          </div>
        )}

        {/* USERS */}
        {!loading && tab === 'users' && !isModerator && (
          <div className="space-y-3">
            {!usersData ? (
              <div className="text-center py-4 text-gray-500">Загрузка...</div>
            ) : (
              <>
                {usersData.data?.map(u => (
                  <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-semibold text-purple-600">
                          {u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.name || 'Без имени'}</p>
                          <p className="text-xs text-gray-400">{u.provider} · {new Date(u.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          u.role === 'admin' ? 'bg-purple-100 text-purple-700'
                            : u.role === 'moderator' ? 'bg-blue-100 text-blue-700'
                            : 'bg-gray-100 text-gray-600'
                        }`}>{u.role === 'admin' ? 'Админ' : u.role === 'moderator' ? 'Мод.' : 'Польз.'}</span>
                        <button onClick={() => setEditUser(u as UserRow)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                
                {/* Pagination Controls */}
                {usersData.count && usersData.count > usersLimit && (
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100 mt-4">
                    <button 
                      onClick={() => setUsersPage(p => Math.max(1, p - 1))}
                      disabled={usersPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronLeft className="w-5 h-5 text-gray-600" />
                    </button>
                    <span className="text-sm text-gray-600 font-medium">
                      Страница {usersPage} из {Math.ceil(usersData.count / usersLimit)}
                    </span>
                    <button 
                      onClick={() => setUsersPage(p => p + 1)}
                      disabled={usersPage >= Math.ceil(usersData.count / usersLimit)}
                      className="p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <ChevronRight className="w-5 h-5 text-gray-600" />
                    </button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* MODERATION */}
        {!loading && tab === 'moderation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Ожидают модерации (Ярдым)</h2>
              {helpReqs.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100">Нет обращений на модерации.</p>
              ) : (
                <div className="space-y-3">
                  {helpReqs.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-amber-200">
                      <div className="flex items-start justify-between mb-2">
                        <p className="font-semibold text-gray-800 flex-1 min-w-0">{r.title}</p>
                        <span className="text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 bg-amber-100 text-amber-700">На модерации</span>
                      </div>
                      <p className="text-sm text-gray-500 mb-3">{r.location}</p>
                      <div className="flex items-center gap-2">
                        <button onClick={async () => {
                          await supabase.from('help_requests').update({ status: 'active' }).eq('id', r.id)
                          await logAudit('approve', 'help_requests', r.id)
                          if (r.author_id) {
                            await supabase.from('user_notifications').insert({
                              user_id: r.author_id,
                              type: 'system',
                              title: 'Ваше обращение одобрено',
                              body: `Ваше обращение "${r.title}" прошло модерацию и опубликовано.`,
                              link: `/yardym/${r.id}`
                            })
                          }
                          loadTab('moderation'); showToast('Одобрено')
                        }} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-600">
                          Одобрить
                        </button>
                        <button onClick={async () => {
                          await supabase.from('help_requests').update({ status: 'rejected' }).eq('id', r.id)
                          await logAudit('reject', 'help_requests', r.id)
                          if (r.author_id) {
                            await supabase.from('user_notifications').insert({
                              user_id: r.author_id,
                              type: 'system',
                              title: 'Ваше обращение отклонено',
                              body: `Ваше обращение "${r.title}" не прошло модерацию.`
                            })
                          }
                          loadTab('moderation'); showToast('Отклонено')
                        }} className="flex-1 bg-rose-100 text-rose-700 py-2 rounded-xl text-sm font-medium hover:bg-rose-200">
                          Отклонить
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Жалобы пользователей</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100">Нет активных жалоб.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-rose-200">
                      <div className="flex items-start justify-between mb-2">
                        <div>
                          <span className="text-xs font-bold text-rose-600 uppercase tracking-wider">{r.target_type === 'help_request' ? 'Обращение' : 'Комментарий'}</span>
                          <p className="font-medium text-gray-800 mt-1">Причина: {r.reason}</p>
                        </div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${r.status === 'pending' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.status === 'pending' ? 'Новая' : 'Рассмотрена'}
                        </span>
                      </div>
                      <p className="text-xs text-gray-400 mb-3">ID: {r.target_id}</p>
                      {r.status === 'pending' && (
                        <div className="flex items-center gap-2">
                          <button onClick={async () => {
                            await supabase.from('reports').update({ status: 'reviewed' }).eq('id', r.id)
                            await logAudit('review', 'reports', r.id)
                            loadTab('moderation'); showToast('Отмечено как рассмотренное')
                          }} className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-sm font-medium hover:bg-emerald-100">
                            Рассмотрено
                          </button>
                          <button onClick={async () => {
                            await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id)
                            await logAudit('dismiss', 'reports', r.id)
                            loadTab('moderation'); showToast('Жалоба отклонена')
                          }} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium hover:bg-gray-200">
                            Отклонить
                          </button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Журнал действий (Audit Log)</h2>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100">Журнал пуст.</p>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm text-left">
                      <thead className="bg-gray-50 text-gray-500 font-medium">
                        <tr>
                          <th className="px-4 py-3">Дата</th>
                          <th className="px-4 py-3">Модератор</th>
                          <th className="px-4 py-3">Действие</th>
                          <th className="px-4 py-3">Объект</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{log.admin?.name || 'Неизвестно'}</td>
                            <td className="px-4 py-3 text-gray-600">{log.action}</td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.target_type} ({log.target_id.slice(0, 8)}...)</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* EVENTS */}
        {!loading && tab === 'events' && (
          <div>
            <button onClick={() => setEditEvent({ type: 'holiday' })}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4 hover:bg-emerald-600">
              <Plus className="w-4 h-4" />Добавить событие
            </button>
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{e.event_date}</p>
                      <p className="font-semibold text-gray-800">{e.title}</p>
                      {e.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{e.description}</p>}
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${
                        e.type === 'holiday' ? 'bg-emerald-100 text-emerald-700'
                          : e.type === 'memorial' ? 'bg-rose-100 text-rose-700'
                          : 'bg-amber-100 text-amber-700'
                      }`}>{e.type === 'holiday' ? 'Праздник' : e.type === 'memorial' ? 'Памятная дата' : 'Другое'}</span>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button onClick={() => setEditEvent(e)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button onClick={() => deleteEvent(e.id)} className="p-1.5 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* HELP */}
        {!loading && tab === 'help' && (
          <div className="space-y-3">
            {helpReqs.map(r => (
              <div key={r.id} className={`rounded-xl p-4 shadow-sm border ${r.urgency === 'urgent' ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'}`}>
                <div className="flex items-start justify-between mb-1">
                  <p className="font-semibold text-gray-800 flex-1 min-w-0 truncate">{r.title}</p>
                  <span className={`text-xs px-2 py-0.5 rounded-full ml-2 flex-shrink-0 ${r.status === 'active' ? 'bg-green-100 text-green-700' : 'bg-gray-100 text-gray-500'}`}>
                    {r.status === 'active' ? 'Активно' : 'Закрыто'}
                  </span>
                </div>
                <p className="text-sm text-gray-500">{r.location}</p>
                <div className="flex items-center justify-between mt-2">
                  <span className="text-xs text-gray-400">Откликов: {r.responses_count ?? 0}</span>
                  {r.status === 'active' && (
                    <button onClick={() => closeHelpRequest(r.id)}
                      className="text-xs text-gray-500 border border-gray-200 px-3 py-1 rounded-lg hover:bg-gray-50">
                      Закрыть
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* MEETINGS */}
        {!loading && tab === 'meetings' && (
          <div className="space-y-3">
            {meetingList.map(m => (
              <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-emerald-200"
                onClick={() => navigate(`/meetings/${m.id}`)}>
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800 truncate">{m.village}</p>
                    <p className="text-sm text-gray-500">{m.organizer} · {new Date(m.meeting_date).toLocaleDateString('ru-RU')}</p>
                  </div>
                  <div className="text-right ml-2 flex-shrink-0">
                    <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : 'bg-gray-100 text-gray-500'}`}>
                      {m.status === 'upcoming' ? 'Предстоит' : m.status}
                    </span>
                    <p className="text-xs text-gray-400 mt-0.5">{m.attendees_count ?? 0} чел.</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* RITUALS */}
        {!loading && tab === 'rituals' && (
          <div>
            <button onClick={() => setEditRitual({})}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4 hover:bg-emerald-600">
              <Plus className="w-4 h-4" />Добавить обряд
            </button>
            <div className="space-y-3">
              {rituals.map(r => (
                <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0 flex items-center gap-3">
                      <div className="text-2xl">{r.icon || '📖'}</div>
                      <div>
                        <p className="font-semibold text-gray-800">{r.title}</p>
                        {r.subtitle && <p className="text-sm text-gray-500 mt-0.5">{r.subtitle}</p>}
                      </div>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button onClick={() => setEditRitual(r)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                        <Edit className="w-4 h-4 text-gray-400" />
                      </button>
                      <button onClick={() => deleteRitual(r.id)} className="p-1.5 hover:bg-rose-50 rounded-lg">
                        <Trash2 className="w-4 h-4 text-rose-400" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* SETTINGS / FEATURE TOGGLES */}
        {!loading && tab === 'settings' && (
          <div className="space-y-4">
            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h2 className="font-semibold text-gray-800 mb-4">Управление разделами (Feature Toggles)</h2>
              <p className="text-sm text-gray-500 mb-4">
                Включайте и отключайте разделы в приложении. Это полезно для безопасного тестирования новых функций на проде.
              </p>
              <div className="space-y-3">
                {([
                  { id: 'meetings', label: 'Встречи сёл' },
                  { id: 'yardym', label: 'Микро-Ярдым' },
                  { id: 'calendar', label: 'Этно-календарь' },
                  { id: 'rituals', label: 'Обряды' },
                  { id: 'preModeration', label: 'Премодерация Ярдым' }
                ] as const).map(({ id, label }) => (
                  <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                    <span className="text-gray-700 font-medium">{label}</span>
                    <button
                      onClick={() => setFeatureToggle(id, !featureToggles[id])}
                      className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                        featureToggles[id] ? 'bg-emerald-500' : 'bg-gray-200'
                      }`}
                    >
                      <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                        featureToggles[id] ? 'translate-x-6' : 'translate-x-1'
                      }`} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Edit Event Modal */}
      {editEvent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditEvent(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editEvent.id ? 'Редактировать' : 'Добавить'} событие</h2>
              <button onClick={() => setEditEvent(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input type="date" value={editEvent.event_date ?? ''}
                  onChange={e => setEditEvent(v => ({ ...v, event_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              {([['title','Название (рус)'],['title_crh','Название (крымтат)'],['description','Описание (рус)'],['description_crh','Описание (крымтат)']] as [keyof EventRow, string][]).map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input value={(editEvent as any)[f] ?? ''}
                    onChange={e => setEditEvent(v => ({ ...v, [f]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                <select value={editEvent.type ?? 'holiday'}
                  onChange={e => setEditEvent(v => ({ ...v, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="holiday">Праздник</option>
                  <option value="memorial">Памятная дата</option>
                  <option value="custom">Другое</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditEvent(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={saveEvent} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit User Role Modal */}
      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditUser(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Изменить роль</h2>
              <button onClick={() => setEditUser(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <p className="text-gray-600 mb-4">{editUser.name}</p>
            <div className="space-y-2">
              {([['user','Пользователь'],['moderator','Модератор'],['admin','Администратор']] as [string,string][]).map(([role, label]) => (
                <button key={role} onClick={() => updateUserRole(editUser.id, role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${
                    editUser.role === role ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'
                  }`}>
                  <span>{label}</span>
                  {editUser.role === role && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Edit Ritual Modal */}
      {editRitual && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditRitual(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editRitual.id ? 'Редактировать обряд' : 'Новый обряд'}</h2>
              <button onClick={() => setEditRitual(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название (RU)</label>
                <input type="text" value={editRitual.title || ''} onChange={e => setEditRitual({...editRitual, title: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Название (CRH)</label>
                <input type="text" value={editRitual.title_crh || ''} onChange={e => setEditRitual({...editRitual, title_crh: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок (RU)</label>
                <input type="text" value={editRitual.subtitle || ''} onChange={e => setEditRitual({...editRitual, subtitle: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Подзаголовок (CRH)</label>
                <input type="text" value={editRitual.subtitle_crh || ''} onChange={e => setEditRitual({...editRitual, subtitle_crh: e.target.value})}
                  className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Иконка (Emoji)</label>
                  <input type="text" value={editRitual.icon || ''} onChange={e => setEditRitual({...editRitual, icon: e.target.value})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Порядок сортировки</label>
                  <input type="number" value={editRitual.sort_order || 0} onChange={e => setEditRitual({...editRitual, sort_order: parseInt(e.target.value)})}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditRitual(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={saveRitual} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" /> Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg z-[100]">
          <Check className="w-4 h-4 text-emerald-400" />{toast}
        </div>
      )}
    </div>
  )
}
