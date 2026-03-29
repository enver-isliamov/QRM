import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Shield, Settings, BarChart3, ChevronLeft, Edit, Trash2, Plus, X, Check, Save, BookOpen, ToggleRight, ChevronRight, ArrowUp, ArrowDown, AlertTriangle } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import useSWR from 'swr'
import { toast } from 'sonner'

type Tab = 'stats' | 'users' | 'events' | 'help' | 'meetings' | 'rituals' | 'settings' | 'moderation'
type UserRow = { id: string; name: string; avatar_url?: string; role: string; provider: string; created_at: string }
type EventRow = { id: string; event_date: string; title: string; title_crh?: string; description?: string; description_crh?: string; type: string }
type HelpRow  = { id: string; title: string; type: string; urgency: string; status: string; location: string; created_at: string; responses_count?: number; author_id?: string; author_name?: string; description?: string; contact_phone?: string }
type MeetRow  = { id: string; village: string; organizer: string; meeting_date: string; status: string; attendees_count?: number; author_id?: string; fund_goal?: number; fund_current?: number; fund_purpose?: string; location?: string }
type RitualRow = { id: string; title: string; title_crh?: string; subtitle?: string; subtitle_crh?: string; icon?: string; sort_order?: number }
type RitualStepRow = { id: number; ritual_id: string; step_order: number; title: string; title_crh?: string; description?: string; description_crh?: string }
type ReportRow = { id: string; reporter_id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string }
type AuditLogRow = { id: string; admin_id: string; action: string; target_type: string; target_id: string; created_at: string; admin?: { name: string } }

interface DeleteConfirm {
  id: string | number
  type: 'event' | 'ritual' | 'step' | 'help_request' | 'meeting'
  title: string
}

const fetcher = async (key: string) => {
  const [table, pageStr, limitStr] = key.split(':')
  const page = parseInt(pageStr, 10)
  const limit = parseInt(limitStr, 10)
  const from = (page - 1) * limit
  const to = from + limit - 1
  const { data, count } = await supabase.from(table).select('*', { count: 'exact' }).order('created_at', { ascending: false }).range(from, to)
  return { data, count }
}

export default function Admin() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { featureToggles, setFeatureToggle } = useStore()
  const isModerator = profile?.role === 'moderator'
  const [tab, setTab] = useState<Tab>(isModerator ? 'moderation' : 'stats')
  const [stats, setStats] = useState<Record<string, number>>({})
  const [helpStats, setHelpStats] = useState<{blood:number;money:number;other:number;urgent:number;normal:number;completed:number;pending:number;rejected:number}>({blood:0,money:0,other:0,urgent:0,normal:0,completed:0,pending:0,rejected:0})
  const [events, setEvents] = useState<EventRow[]>([])
  const [helpReqs, setHelpReqs] = useState<HelpRow[]>([])
  const [meetingList, setMeetingList] = useState<MeetRow[]>([])
  const [rituals, setRituals] = useState<RitualRow[]>([])
  const [ritualSteps, setRitualSteps] = useState<RitualStepRow[]>([])
  const [selectedRitual, setSelectedRitual] = useState<RitualRow | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editEvent, setEditEvent] = useState<Partial<EventRow> | null>(null)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editRitual, setEditRitual] = useState<Partial<RitualRow> | null>(null)
  const [editStep, setEditStep] = useState<Partial<RitualStepRow> | null>(null)
  const [viewHelp, setViewHelp] = useState<HelpRow | null>(null)
  const [deleteConfirm, setDeleteConfirm] = useState<DeleteConfirm | null>(null)
  const [helpFilter, setHelpFilter] = useState<'all'|'active'|'pending'|'completed'|'rejected'>('all')
  const [meetingFilter, setMeetingFilter] = useState<'all'|'upcoming'|'completed'|'cancelled'>('all')
  const [usersPage, setUsersPage] = useState(1)
  const usersLimit = 10

  const { data: usersData, mutate: mutateUsers } = useSWR(
    tab === 'users' && !isModerator ? `profiles:${usersPage}:${usersLimit}` : null,
    fetcher
  )

  useEffect(() => { loadTab(tab) }, [tab, helpFilter, meetingFilter])

  const loadTab = async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'stats' && !isModerator) {
        const [statsRes, bloodRes, moneyRes, otherRes, urgentRes, normalRes, completedRes, pendingRes, rejectedRes] = await Promise.all([
          supabase.from('admin_stats').select('*').single(),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('type', 'blood').eq('status', 'active'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('type', 'money').eq('status', 'active'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('type', 'other').eq('status', 'active'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('urgency', 'urgent').eq('status', 'active'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('urgency', 'normal').eq('status', 'active'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'completed'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'pending'),
          supabase.from('help_requests').select('*', { count: 'exact', head: true }).eq('status', 'rejected'),
        ])
        if (statsRes.data) setStats(statsRes.data as any)
        setHelpStats({
          blood: bloodRes.count || 0,
          money: moneyRes.count || 0,
          other: otherRes.count || 0,
          urgent: urgentRes.count || 0,
          normal: normalRes.count || 0,
          completed: completedRes.count || 0,
          pending: pendingRes.count || 0,
          rejected: rejectedRes.count || 0,
        })
      }
      if (t === 'events') {
        const { data } = await supabase.from('ethno_events').select('*').order('event_date')
        if (data) setEvents(data as EventRow[])
      }
      if (t === 'help') {
        let q = supabase.from('help_requests_with_count').select('*').order('created_at', { ascending: false })
        if (helpFilter !== 'all') q = q.eq('status', helpFilter)
        const { data } = await q
        if (data) setHelpReqs(data as HelpRow[])
      }
      if (t === 'moderation') {
        const [pendingRes, reportsRes, auditRes] = await Promise.all([
          supabase.from('help_requests_with_count').select('*').eq('status', 'pending').order('created_at', { ascending: false }),
          supabase.from('reports').select('*').order('created_at', { ascending: false }),
          supabase.from('audit_logs').select('*, admin:profiles!audit_logs_admin_id_fkey(name)').order('created_at', { ascending: false }).limit(50),
        ])
        if (pendingRes.data) setHelpReqs(pendingRes.data as HelpRow[])
        if (reportsRes.data) setReports(reportsRes.data as ReportRow[])
        if (auditRes.data) setAuditLogs(auditRes.data as AuditLogRow[])
      }
      if (t === 'meetings') {
        let q = supabase.from('meetings_with_stats').select('*').order('meeting_date', { ascending: false })
        if (meetingFilter !== 'all') q = q.eq('status', meetingFilter)
        const { data } = await q
        if (data) setMeetingList(data as MeetRow[])
      }
      if (t === 'rituals') {
        const { data } = await supabase.from('rituals').select('*').order('sort_order')
        if (data) setRituals(data as RitualRow[])
        if (!selectedRitual) { setRitualSteps([]) }
      }
    } catch (error) {
      console.error('Error loading tab:', error)
      toast.error('Ошибка загрузки данных')
    } finally {
      setLoading(false)
    }
  }

  const logAudit = async (action: string, target_type: string, target_id: string) => {
    await supabase.rpc('log_admin_action', { p_action: action, p_target_type: target_type, p_target_id: target_id }).catch(console.error)
  }

  const handleDelete = async () => {
    if (!deleteConfirm) return
    const { id, type } = deleteConfirm
    try {
      if (type === 'event') {
        await supabase.from('ethno_events').delete().eq('id', id)
        await logAudit('delete', 'ethno_events', String(id))
        loadTab('events')
      } else if (type === 'help_request') {
        await supabase.from('help_requests').delete().eq('id', id)
        await logAudit('delete', 'help_requests', String(id))
        loadTab('help')
      } else if (type === 'meeting') {
        await supabase.from('meetings').delete().eq('id', id)
        await logAudit('delete', 'meetings', String(id))
        loadTab('meetings')
      } else if (type === 'ritual') {
        await supabase.from('rituals').delete().eq('id', id)
        await logAudit('delete', 'rituals', String(id))
        loadTab('rituals')
      } else if (type === 'step') {
        await supabase.from('ritual_steps').delete().eq('id', id)
        await logAudit('delete', 'ritual_steps', String(id))
        if (selectedRitual) loadRitualSteps(selectedRitual.id)
      }
      toast.success('Удалено')
    } catch { toast.error('Ошибка при удалении') }
    finally { setDeleteConfirm(null) }
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
    setEditEvent(null); loadTab('events'); toast.success('Сохранено')
  }

  const loadRitualSteps = async (ritualId: string) => {
    const { data } = await supabase.from('ritual_steps').select('*').eq('ritual_id', ritualId).order('step_order')
    if (data) setRitualSteps(data as RitualStepRow[])
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
    setEditRitual(null); loadTab('rituals'); toast.success('Сохранено')
  }

  const saveStep = async () => {
    if (!editStep || !selectedRitual) return
    const stepData = { ...editStep, ritual_id: selectedRitual.id }
    if (editStep.id) {
      await supabase.from('ritual_steps').update(stepData).eq('id', editStep.id)
    } else {
      await supabase.from('ritual_steps').insert(stepData)
    }
    setEditStep(null); loadRitualSteps(selectedRitual.id); toast.success('Шаг сохранён')
  }

  const moveStep = async (step: RitualStepRow, direction: 'up' | 'down') => {
    if (!selectedRitual) return
    const index = ritualSteps.findIndex(s => s.id === step.id)
    if (direction === 'up' && index === 0) return
    if (direction === 'down' && index === ritualSteps.length - 1) return
    const other = direction === 'up' ? ritualSteps[index - 1] : ritualSteps[index + 1]
    await supabase.from('ritual_steps').update({ step_order: other.step_order }).eq('id', step.id)
    await supabase.from('ritual_steps').update({ step_order: step.step_order }).eq('id', other.id)
    loadRitualSteps(selectedRitual.id)
  }

  const updateUserRole = async (uid: string, role: string) => {
    if (isModerator) return
    let { error } = await supabase.from('profiles').update({ role }).eq('id', uid)
    if (error) {
      const { error: rpcError } = await supabase.rpc('set_user_role', { target_user_id: uid, new_role: role })
      error = rpcError
    }
    if (error) { toast.error('Ошибка смены роли'); return }
    await logAudit('update_role', 'profiles', uid)
    mutateUsers(); setEditUser(null); toast.success('Роль изменена')
  }

  const changeMeetingStatus = async (id: string, status: string) => {
    await supabase.from('meetings').update({ status }).eq('id', id)
    await logAudit(`set_status_${status}`, 'meetings', id)
    loadTab('meetings'); toast.success('Статус обновлён')
  }

  const changeHelpStatus = async (id: string, status: string, authorId?: string, title?: string) => {
    await supabase.from('help_requests').update({ status }).eq('id', id)
    await logAudit(`set_status_${status}`, 'help_requests', id)
    if (authorId && (status === 'active' || status === 'rejected')) {
      await supabase.from('user_notifications').insert({
        user_id: authorId,
        type: 'system',
        title: status === 'active' ? 'Ваше обращение одобрено' : 'Ваше обращение отклонено',
        body: status === 'active' ? `Обращение "${title}" опубликовано.` : `Обращение "${title}" отклонено модератором.`,
      })
    }
    loadTab(tab); toast.success('Статус обновлён')
  }

  const allTabs = [
    { id: 'stats'      as Tab, label: 'Статистика',   icon: BarChart3,   show: !isModerator },
    { id: 'users'      as Tab, label: 'Пользователи', icon: Users,       show: !isModerator },
    { id: 'moderation' as Tab, label: 'Модерация',    icon: Shield,      show: true },
    { id: 'events'     as Tab, label: 'Календарь',    icon: Settings,    show: true },
    { id: 'help'       as Tab, label: 'Ярдым',        icon: Shield,      show: true },
    { id: 'meetings'   as Tab, label: 'Встречи',      icon: Settings,    show: true },
    { id: 'rituals'    as Tab, label: 'Обряды',       icon: BookOpen,    show: true },
    { id: 'settings'   as Tab, label: 'Настройки',    icon: ToggleRight, show: !isModerator },
  ].filter(t => t.show)

  const statCards = [
    { key: 'total_users', label: 'Пользователей', color: 'text-purple-600', bg: 'bg-purple-50' },
    { key: 'new_users_week', label: 'За неделю', color: 'text-blue-600', bg: 'bg-blue-50' },
    { key: 'active_help', label: 'Активных обращений', color: 'text-rose-600', bg: 'bg-rose-50' },
    { key: 'urgent_help', label: 'Срочных', color: 'text-orange-600', bg: 'bg-orange-50' },
    { key: 'upcoming_meetings', label: 'Предстоящих встреч', color: 'text-amber-600', bg: 'bg-amber-50' },
    { key: 'prayers_today', label: 'Намазов сегодня', color: 'text-emerald-600', bg: 'bg-emerald-50' },
  ]

  const helpStatusBadge = (status: string) => {
    const map: Record<string, string> = { active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700', completed: 'bg-gray-100 text-gray-600', rejected: 'bg-rose-100 text-rose-700' }
    const labels: Record<string, string> = { active: 'Активно', pending: 'Модерация', completed: 'Закрыто', rejected: 'Отклонено' }
    return <span className={`text-xs px-2 py-0.5 rounded-full ${map[status] || 'bg-gray-100 text-gray-500'}`}>{labels[status] || status}</span>
  }

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
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

      {/* Tabs */}
      <div className="bg-white border-b border-gray-200 overflow-x-auto">
        <div className="flex hide-scrollbar">
          {allTabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${tab === id ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              <Icon className="w-4 h-4" />{label}
            </button>
          ))}
        </div>
      </div>

      <div className="p-4 pb-24">
        {loading && <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-16 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>}

        {/* ===== STATS ===== */}
        {!loading && tab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {statCards.map(({ key, label, color, bg }) => (
                <div key={key} className={`${bg} rounded-xl p-4`}>
                  <div className={`text-3xl font-bold ${color}`}>{stats[key] ?? '—'}</div>
                  <div className="text-sm text-gray-600 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">Детальная статистика Ярдым</h3>
              <div className="grid grid-cols-3 gap-2 mb-3">
                <div className="bg-rose-50 rounded-lg p-3 text-center"><div className="text-xl font-bold text-rose-600">{helpStats.blood}</div><div className="text-xs text-gray-500">Кровь</div></div>
                <div className="bg-blue-50 rounded-lg p-3 text-center"><div className="text-xl font-bold text-blue-600">{helpStats.money}</div><div className="text-xs text-gray-500">Финансы</div></div>
                <div className="bg-gray-50 rounded-lg p-3 text-center"><div className="text-xl font-bold text-gray-600">{helpStats.other}</div><div className="text-xs text-gray-500">Другое</div></div>
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div className="bg-orange-50 rounded-lg p-2 flex items-center justify-between px-3"><span className="text-sm text-gray-600">🔴 Срочные</span><span className="font-bold text-orange-600">{helpStats.urgent}</span></div>
                <div className="bg-emerald-50 rounded-lg p-2 flex items-center justify-between px-3"><span className="text-sm text-gray-600">Обычные</span><span className="font-bold text-emerald-600">{helpStats.normal}</span></div>
                <div className="bg-amber-50 rounded-lg p-2 flex items-center justify-between px-3"><span className="text-sm text-gray-600">⏳ Модерация</span><span className="font-bold text-amber-600">{helpStats.pending}</span></div>
                <div className="bg-gray-50 rounded-lg p-2 flex items-center justify-between px-3"><span className="text-sm text-gray-600">✅ Закрыто</span><span className="font-bold text-gray-600">{helpStats.completed}</span></div>
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-700">Данные Supabase в реальном времени. <a href="https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq" target="_blank" rel="noreferrer" className="font-medium underline">Dashboard →</a></p>
            </div>
          </div>
        )}

        {/* ===== USERS ===== */}
        {!loading && tab === 'users' && !isModerator && (
          <div className="space-y-3">
            {!usersData ? <div className="text-center py-4 text-gray-500">Загрузка...</div> : (
              <>
                {usersData.data?.map(u => (
                  <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-semibold text-purple-600">{u.name?.[0]?.toUpperCase() ?? '?'}</div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.name || 'Без имени'}</p>
                          <p className="text-xs text-gray-400">{u.provider} · {new Date(u.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'moderator' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? 'Админ' : u.role === 'moderator' ? 'Мод.' : 'Польз.'}
                        </span>
                        <button onClick={() => setEditUser(u as UserRow)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                      </div>
                    </div>
                  </div>
                ))}
                {usersData.count && usersData.count > usersLimit && (
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1} className="p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-5 h-5 text-gray-600" /></button>
                    <span className="text-sm text-gray-600 font-medium">Стр. {usersPage} из {Math.ceil(usersData.count / usersLimit)}</span>
                    <button onClick={() => setUsersPage(p => p + 1)} disabled={usersPage >= Math.ceil(usersData.count / usersLimit)} className="p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-5 h-5 text-gray-600" /></button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ===== MODERATION ===== */}
        {!loading && tab === 'moderation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Ожидают модерации</h2>
              {helpReqs.length === 0 ? <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border">Очередь пуста.</p> : (
                <div className="space-y-3">
                  {helpReqs.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-amber-200">
                      <p className="font-semibold text-gray-800">{r.title}</p>
                      <p className="text-sm text-gray-500 mb-3">{r.location}</p>
                      <div className="flex gap-2">
                        <button onClick={() => changeHelpStatus(r.id, 'active', r.author_id, r.title)} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-600">Одобрить</button>
                        <button onClick={() => changeHelpStatus(r.id, 'rejected', r.author_id, r.title)} className="flex-1 bg-rose-100 text-rose-700 py-2 rounded-xl text-sm font-medium hover:bg-rose-200">Отклонить</button>
                        <button onClick={() => setDeleteConfirm({ id: r.id, type: 'help_request', title: r.title })} className="p-2 bg-gray-100 rounded-xl hover:bg-rose-100"><Trash2 className="w-4 h-4 text-gray-500" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Жалобы</h2>
              {reports.length === 0 ? <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border">Нет жалоб.</p> : (
                <div className="space-y-3">
                  {reports.filter(r => r.status === 'pending').map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-rose-200">
                      <p className="font-medium text-gray-800">Причина: {r.reason}</p>
                      <p className="text-xs text-gray-400 mb-3">{r.target_type} / {r.target_id.slice(0,8)}...</p>
                      <div className="flex gap-2">
                        <button onClick={async () => { await supabase.from('reports').update({ status: 'reviewed' }).eq('id', r.id); await logAudit('review', 'reports', r.id); loadTab('moderation'); toast.success('Рассмотрено') }} className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-sm font-medium">Рассмотрено</button>
                        <button onClick={async () => { await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id); await logAudit('dismiss', 'reports', r.id); loadTab('moderation'); toast.success('Отклонено') }} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm font-medium">Отклонить</button>
                      </div>
                    </div>
                  ))}
                  {reports.filter(r => r.status === 'pending').length === 0 && <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border">Нет активных жалоб.</p>}
                </div>
              )}
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Журнал действий</h2>
              {auditLogs.length === 0 ? <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border">Журнал пуст.</p> : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-x-auto">
                  <table className="w-full text-sm text-left">
                    <thead className="bg-gray-50 text-gray-500 font-medium">
                      <tr><th className="px-4 py-3">Дата</th><th className="px-4 py-3">Модератор</th><th className="px-4 py-3">Действие</th><th className="px-4 py-3">Объект</th></tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {auditLogs.map(log => (
                        <tr key={log.id} className="hover:bg-gray-50">
                          <td className="px-4 py-3 text-gray-500 whitespace-nowrap">{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                          <td className="px-4 py-3 font-medium text-gray-800">{log.admin?.name || '—'}</td>
                          <td className="px-4 py-3 text-gray-600">{log.action}</td>
                          <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.target_type}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ===== EVENTS ===== */}
        {!loading && tab === 'events' && (
          <div>
            <button onClick={() => setEditEvent({ type: 'holiday' })} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4 hover:bg-emerald-600"><Plus className="w-4 h-4" />Добавить событие</button>
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{e.event_date}</p>
                      <p className="font-semibold text-gray-800">{e.title}</p>
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${e.type === 'holiday' ? 'bg-emerald-100 text-emerald-700' : e.type === 'memorial' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {e.type === 'holiday' ? 'Праздник' : e.type === 'memorial' ? 'Памятная дата' : 'Другое'}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-2 flex-shrink-0">
                      <button onClick={() => setEditEvent(e)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                      <button onClick={() => setDeleteConfirm({ id: e.id, type: 'event', title: e.title })} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ===== HELP REQUESTS (FULL ADMIN) ===== */}
        {!loading && tab === 'help' && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(['all','active','pending','completed','rejected'] as const).map(f => (
                <button key={f} onClick={() => { setHelpFilter(f); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${helpFilter === f ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {f === 'all' ? 'Все' : f === 'active' ? 'Активные' : f === 'pending' ? 'Модерация' : f === 'completed' ? 'Закрытые' : 'Отклонённые'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {helpReqs.map(r => (
                <div key={r.id} className={`rounded-xl p-4 shadow-sm border ${r.urgency === 'urgent' ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'}`}>
                  <div className="flex items-start justify-between mb-1">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{r.title}</p>
                      <p className="text-xs text-gray-500">{r.location}</p>
                      {r.author_name && <p className="text-xs text-gray-400 mt-0.5">Автор: {r.author_name}</p>}
                    </div>
                    <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                      {helpStatusBadge(r.status)}
                    </div>
                  </div>
                  <div className="flex items-center justify-between mt-2">
                    <span className="text-xs text-gray-400">Откликов: {r.responses_count ?? 0} · {r.type === 'blood' ? '🩸' : r.type === 'money' ? '💰' : '🤝'} {r.urgency === 'urgent' ? '🔴' : ''}</span>
                    <div className="flex gap-1">
                      <button onClick={() => setViewHelp(r)} className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50">Детали</button>
                      {r.status === 'active' && (
                        <button onClick={() => changeHelpStatus(r.id, 'completed')} className="text-xs text-gray-500 border border-gray-200 px-2 py-1 rounded-lg hover:bg-gray-50">Закрыть</button>
                      )}
                      {r.status === 'pending' && (
                        <>
                          <button onClick={() => changeHelpStatus(r.id, 'active', r.author_id, r.title)} className="text-xs text-emerald-600 border border-emerald-200 px-2 py-1 rounded-lg hover:bg-emerald-50">Одобрить</button>
                          <button onClick={() => changeHelpStatus(r.id, 'rejected', r.author_id, r.title)} className="text-xs text-rose-600 border border-rose-200 px-2 py-1 rounded-lg hover:bg-rose-50">Отклонить</button>
                        </>
                      )}
                      <button onClick={() => setDeleteConfirm({ id: r.id, type: 'help_request', title: r.title })} className="p-1 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-rose-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
              {helpReqs.length === 0 && <div className="text-center py-8 text-gray-400">Нет обращений</div>}
            </div>
          </div>
        )}

        {/* ===== MEETINGS (FULL ADMIN) ===== */}
        {!loading && tab === 'meetings' && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {(['all','upcoming','completed','cancelled'] as const).map(f => (
                <button key={f} onClick={() => { setMeetingFilter(f); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${meetingFilter === f ? 'bg-purple-500 text-white' : 'bg-white text-gray-600 border border-gray-200 hover:bg-gray-50'}`}>
                  {f === 'all' ? 'Все' : f === 'upcoming' ? 'Предстоящие' : f === 'completed' ? 'Завершённые' : 'Отменённые'}
                </button>
              ))}
            </div>
            <div className="space-y-3">
              {meetingList.map(m => (
                <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="font-semibold text-gray-800 truncate">{m.village}</p>
                      <p className="text-sm text-gray-500">{m.organizer} · {new Date(m.meeting_date).toLocaleDateString('ru-RU')}</p>
                      {m.location && <p className="text-xs text-gray-400">{m.location}</p>}
                      {m.fund_purpose && <p className="text-xs text-emerald-600 mt-0.5">💰 {m.fund_purpose} · {m.fund_current?.toLocaleString('ru') ?? 0} / {m.fund_goal?.toLocaleString('ru') ?? 0} ₽</p>}
                    </div>
                    <div className="flex flex-col items-end gap-1 ml-2 flex-shrink-0">
                      <span className={`text-xs px-2 py-0.5 rounded-full ${m.status === 'upcoming' ? 'bg-amber-100 text-amber-700' : m.status === 'completed' ? 'bg-gray-100 text-gray-500' : 'bg-rose-100 text-rose-600'}`}>
                        {m.status === 'upcoming' ? 'Предстоит' : m.status === 'completed' ? 'Завершена' : 'Отменена'}
                      </span>
                      <span className="text-xs text-gray-400">{m.attendees_count ?? 0} чел.</span>
                    </div>
                  </div>
                  <div className="flex gap-2 mt-3">
                    <button onClick={() => navigate(`/meetings/${m.id}`)} className="flex-1 text-xs text-gray-600 border border-gray-200 py-1.5 rounded-lg hover:bg-gray-50">Просмотр</button>
                    <button onClick={() => navigate(`/meetings/${m.id}/edit`)} className="flex-1 text-xs text-emerald-600 border border-emerald-200 py-1.5 rounded-lg hover:bg-emerald-50">Редактировать</button>
                    {m.status === 'upcoming' && <button onClick={() => changeMeetingStatus(m.id, 'completed')} className="text-xs text-gray-500 border border-gray-200 px-2 py-1.5 rounded-lg hover:bg-gray-50">✓ Завершить</button>}
                    {m.status === 'upcoming' && <button onClick={() => changeMeetingStatus(m.id, 'cancelled')} className="text-xs text-rose-500 border border-rose-200 px-2 py-1.5 rounded-lg hover:bg-rose-50">✕</button>}
                    <button onClick={() => setDeleteConfirm({ id: m.id, type: 'meeting', title: m.village })} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-rose-400" /></button>
                  </div>
                </div>
              ))}
              {meetingList.length === 0 && <div className="text-center py-8 text-gray-400">Нет встреч</div>}
            </div>
          </div>
        )}

        {/* ===== RITUALS ===== */}
        {!loading && tab === 'rituals' && (
          <div>
            {!selectedRitual ? (
              <>
                <button onClick={() => setEditRitual({})} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4 hover:bg-emerald-600"><Plus className="w-4 h-4" />Добавить обряд</button>
                <div className="space-y-3">
                  {rituals.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-emerald-200" onClick={() => { setSelectedRitual(r); loadRitualSteps(r.id) }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{r.icon || '📖'}</span>
                          <div><p className="font-semibold text-gray-800">{r.title}</p><p className="text-sm text-gray-500">{r.subtitle}</p></div>
                        </div>
                        <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                          <button onClick={() => setEditRitual(r)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                          <button onClick={() => setDeleteConfirm({ id: r.id, type: 'ritual', title: r.title })} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div>
                <div className="flex items-center justify-between mb-4">
                  <button onClick={() => setSelectedRitual(null)} className="flex items-center gap-1 text-gray-600"><ChevronLeft className="w-5 h-5" />Назад</button>
                  <h2 className="font-bold text-gray-800">{selectedRitual.title} — шаги</h2>
                </div>
                <button onClick={() => setEditStep({ step_order: ritualSteps.length + 1 })} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4 hover:bg-emerald-600"><Plus className="w-4 h-4" />Добавить шаг</button>
                <div className="space-y-3">
                  {ritualSteps.map((s, idx) => (
                    <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{idx + 1}</div>
                        <div className="flex-1 min-w-0">
                          <p className="font-semibold text-gray-800">{s.title}</p>
                          {s.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button onClick={() => moveStep(s, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp className="w-4 h-4 text-gray-400" /></button>
                            <button onClick={() => moveStep(s, 'down')} disabled={idx === ritualSteps.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown className="w-4 h-4 text-gray-400" /></button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditStep(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                            <button onClick={() => setDeleteConfirm({ id: s.id, type: 'step', title: s.title })} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                  {ritualSteps.length === 0 && <div className="text-center py-8 text-gray-400 border border-dashed border-gray-200 rounded-xl">Шаги не добавлены</div>}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ===== SETTINGS ===== */}
        {!loading && tab === 'settings' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Feature Toggles</h2>
            <div className="space-y-3">
              {([['meetings','Встречи сёл'],['yardym','Микро-Ярдым'],['calendar','Этно-календарь'],['rituals','Обряды'],['preModeration','Премодерация Ярдым']] as const).map(([id, label]) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <button onClick={() => setFeatureToggle(id, !featureToggles[id])} className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${featureToggles[id] ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${featureToggles[id] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ===== DELETE CONFIRM MODAL ===== */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white w-[90%] max-w-sm rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-16 h-16 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4"><AlertTriangle className="w-8 h-8 text-rose-600" /></div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Удалить навсегда?</h3>
              <p className="text-sm text-gray-500 mb-6">«{deleteConfirm.title}»<br/>Это действие нельзя отменить.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium">Отмена</button>
                <button onClick={handleDelete} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-medium hover:bg-rose-600">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ===== HELP REQUEST DETAILS MODAL ===== */}
      {viewHelp && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setViewHelp(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[80vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-gray-800">Детали обращения</h2>
              <button onClick={() => setViewHelp(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-3 text-sm">
              <div><span className="text-gray-500 font-medium">Заголовок:</span><p className="text-gray-800 mt-0.5">{viewHelp.title}</p></div>
              <div><span className="text-gray-500 font-medium">Место:</span><p className="text-gray-800 mt-0.5">{viewHelp.location}</p></div>
              {viewHelp.description && <div><span className="text-gray-500 font-medium">Описание:</span><p className="text-gray-800 mt-0.5">{viewHelp.description}</p></div>}
              {viewHelp.contact_phone && <div><span className="text-gray-500 font-medium">Телефон:</span><p className="text-gray-800 mt-0.5">{viewHelp.contact_phone}</p></div>}
              <div className="flex gap-3 pt-2">
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewHelp.urgency === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-600'}`}>{viewHelp.urgency === 'urgent' ? '🔴 Срочно' : 'Обычное'}</span>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${viewHelp.type === 'blood' ? 'bg-red-100 text-red-700' : viewHelp.type === 'money' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>{viewHelp.type === 'blood' ? '🩸 Кровь' : viewHelp.type === 'money' ? '💰 Финансы' : '🤝 Другое'}</span>
                {helpStatusBadge(viewHelp.status)}
              </div>
              <div><span className="text-gray-500 font-medium">Откликов:</span><span className="ml-2 font-bold text-emerald-600">{viewHelp.responses_count ?? 0}</span></div>
              <p className="text-xs text-gray-400">ID: {viewHelp.id}</p>
            </div>
            <div className="flex gap-2 mt-4">
              {viewHelp.status === 'pending' && <>
                <button onClick={() => { changeHelpStatus(viewHelp.id, 'active', viewHelp.author_id, viewHelp.title); setViewHelp(null) }} className="flex-1 bg-emerald-500 text-white py-2.5 rounded-xl text-sm font-medium">Одобрить</button>
                <button onClick={() => { changeHelpStatus(viewHelp.id, 'rejected', viewHelp.author_id, viewHelp.title); setViewHelp(null) }} className="flex-1 bg-rose-100 text-rose-700 py-2.5 rounded-xl text-sm font-medium">Отклонить</button>
              </>}
              {viewHelp.status === 'active' && <button onClick={() => { changeHelpStatus(viewHelp.id, 'completed'); setViewHelp(null) }} className="flex-1 bg-gray-100 text-gray-700 py-2.5 rounded-xl text-sm font-medium">Закрыть</button>}
              <button onClick={() => { setDeleteConfirm({ id: viewHelp.id, type: 'help_request', title: viewHelp.title }); setViewHelp(null) }} className="px-4 bg-rose-50 text-rose-600 py-2.5 rounded-xl text-sm font-medium"><Trash2 className="w-4 h-4" /></button>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT EVENT ===== */}
      {editEvent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditEvent(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editEvent.id ? 'Редактировать' : 'Добавить'} событие</h2>
              <button onClick={() => setEditEvent(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Дата</label><input type="date" value={editEvent.event_date ?? ''} onChange={e => setEditEvent(v => ({ ...v, event_date: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
              {(['title','title_crh','description','description_crh'] as const).map(f => (
                <div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{{title:'Название (рус)',title_crh:'Название (крымтат)',description:'Описание (рус)',description_crh:'Описание (крымтат)'}[f]}</label><input value={(editEvent as any)[f] ?? ''} onChange={e => setEditEvent(v => ({ ...v, [f]: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" /></div>
              ))}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Тип</label><select value={editEvent.type ?? 'holiday'} onChange={e => setEditEvent(v => ({ ...v, type: e.target.value }))} className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent"><option value="holiday">Праздник</option><option value="memorial">Памятная дата</option><option value="custom">Другое</option></select></div>
              <div className="flex gap-3"><button onClick={() => setEditEvent(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button><button onClick={saveEvent} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 flex items-center justify-center gap-2"><Save className="w-4 h-4" />Сохранить</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT USER ROLE ===== */}
      {editUser && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditUser(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-gray-800">Изменить роль</h2><button onClick={() => setEditUser(null)}><X className="w-6 h-6 text-gray-400" /></button></div>
            <p className="text-gray-600 mb-4">{editUser.name}</p>
            <div className="space-y-2">
              {(['user','moderator','admin'] as const).map(role => (
                <button key={role} onClick={() => updateUserRole(editUser.id, role)} className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${editUser.role === role ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <span>{{user:'Пользователь',moderator:'Модератор',admin:'Администратор'}[role]}</span>
                  {editUser.role === role && <Check className="w-5 h-5" />}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT RITUAL ===== */}
      {editRitual !== null && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditRitual(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-gray-800">{editRitual.id ? 'Редактировать обряд' : 'Новый обряд'}</h2><button onClick={() => setEditRitual(null)}><X className="w-6 h-6 text-gray-400" /></button></div>
            <div className="space-y-4">
              {(['title','title_crh','subtitle','subtitle_crh'] as const).map(f => (<div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{{title:'Название (RU)',title_crh:'Название (CRH)',subtitle:'Подзаголовок (RU)',subtitle_crh:'Подзаголовок (CRH)'}[f]}</label><input type="text" value={(editRitual as any)[f] || ''} onChange={e => setEditRitual({...editRitual,[f]:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>))}
              <div className="grid grid-cols-2 gap-4">
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Иконка</label><input type="text" value={editRitual.icon || ''} onChange={e => setEditRitual({...editRitual,icon:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
                <div><label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label><input type="number" value={editRitual.sort_order || 0} onChange={e => setEditRitual({...editRitual,sort_order:parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              </div>
              <div className="flex gap-3 pt-2"><button onClick={() => setEditRitual(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button><button onClick={saveRitual} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2"><Save className="w-5 h-5" />Сохранить</button></div>
            </div>
          </div>
        </div>
      )}

      {/* ===== EDIT STEP ===== */}
      {editStep !== null && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditStep(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4"><h2 className="text-xl font-bold text-gray-800">{editStep.id ? 'Редактировать шаг' : 'Новый шаг'}</h2><button onClick={() => setEditStep(null)}><X className="w-6 h-6 text-gray-400" /></button></div>
            <div className="space-y-4">
              {(['title','title_crh'] as const).map(f => (<div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{{title:'Заголовок (RU)',title_crh:'Заголовок (CRH)'}[f]}</label><input type="text" value={(editStep as any)[f] || ''} onChange={e => setEditStep({...editStep,[f]:e.target.value})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>))}
              {(['description','description_crh'] as const).map(f => (<div key={f}><label className="block text-sm font-medium text-gray-700 mb-1">{{description:'Описание (RU)',description_crh:'Описание (CRH)'}[f]}</label><textarea value={(editStep as any)[f] || ''} onChange={e => setEditStep({...editStep,[f]:e.target.value})} rows={3} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" /></div>))}
              <div><label className="block text-sm font-medium text-gray-700 mb-1">Порядок</label><input type="number" value={editStep.step_order || 0} onChange={e => setEditStep({...editStep,step_order:parseInt(e.target.value)})} className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" /></div>
              <div className="flex gap-3 pt-2"><button onClick={() => setEditStep(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button><button onClick={saveStep} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold hover:bg-emerald-600 flex items-center justify-center gap-2"><Save className="w-5 h-5" />Сохранить</button></div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
