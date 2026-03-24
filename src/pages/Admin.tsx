import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { Users, Shield, Settings, BarChart3, ChevronLeft, Edit, Trash2, Plus, X, Check, Save } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'

type Tab = 'stats' | 'users' | 'events' | 'help' | 'meetings'
type UserRow = { id: string; name: string; avatar_url?: string; role: string; provider: string; created_at: string }
type EventRow = { id: string; event_date: string; title: string; title_crh?: string; description?: string; description_crh?: string; type: string }
type HelpRow  = { id: string; title: string; type: string; urgency: string; status: string; location: string; created_at: string; responses_count?: number }
type MeetRow  = { id: string; village: string; organizer: string; meeting_date: string; status: string; attendees_count?: number }

export default function Admin() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [tab, setTab] = useState<Tab>('stats')
  const [stats, setStats] = useState<Record<string, number>>({})
  const [users, setUsers] = useState<UserRow[]>([])
  const [events, setEvents] = useState<EventRow[]>([])
  const [helpReqs, setHelpReqs] = useState<HelpRow[]>([])
  const [meetingList, setMeetingList] = useState<MeetRow[]>([])
  const [loading, setLoading] = useState(false)
  const [editEvent, setEditEvent] = useState<Partial<EventRow> | null>(null)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [toast, setToast] = useState('')

  const showToast = (msg: string) => { setToast(msg); setTimeout(() => setToast(''), 2500) }

  useEffect(() => { loadTab(tab) }, [tab])

  const loadTab = async (t: Tab) => {
    setLoading(true)
    if (t === 'stats') {
      const { data } = await supabase.from('admin_stats').select('*').single()
      if (data) setStats(data as any)
    }
    if (t === 'users') {
      const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false })
      if (data) setUsers(data as UserRow[])
    }
    if (t === 'events') {
      const { data } = await supabase.from('ethno_events').select('*').order('event_date')
      if (data) setEvents(data as EventRow[])
    }
    if (t === 'help') {
      const { data } = await supabase.from('help_requests_with_count').select('*').order('created_at', { ascending: false })
      if (data) setHelpReqs(data as HelpRow[])
    }
    if (t === 'meetings') {
      const { data } = await supabase.from('meetings_with_stats').select('*').order('meeting_date', { ascending: false })
      if (data) setMeetingList(data as MeetRow[])
    }
    setLoading(false)
  }

  const saveEvent = async () => {
    if (!editEvent) return
    if (editEvent.id) await supabase.from('ethno_events').update(editEvent).eq('id', editEvent.id)
    else await supabase.from('ethno_events').insert(editEvent)
    setEditEvent(null); loadTab('events'); showToast('Сохранено ✓')
  }

  const deleteEvent = async (id: string) => {
    if (!confirm('Удалить событие?')) return
    await supabase.from('ethno_events').delete().eq('id', id)
    loadTab('events'); showToast('Удалено')
  }

  const updateUserRole = async (uid: string, role: string) => {
    await supabase.from('profiles').update({ role }).eq('id', uid)
    setUsers(prev => prev.map(u => u.id === uid ? { ...u, role } : u))
    setEditUser(null); showToast('Роль изменена ✓')
  }

  const closeHelpRequest = async (id: string) => {
    await supabase.from('help_requests').update({ status: 'completed' }).eq('id', id)
    loadTab('help'); showToast('Обращение закрыто')
  }

  const tabs = [
    { id: 'stats'    as Tab, label: 'Статистика',   icon: BarChart3 },
    { id: 'users'    as Tab, label: 'Пользователи', icon: Users },
    { id: 'events'   as Tab, label: 'Календарь',    icon: Settings },
    { id: 'help'     as Tab, label: 'Ярдым',         icon: Shield },
    { id: 'meetings' as Tab, label: 'Встречи',       icon: Settings },
  ]

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
        {!loading && tab === 'users' && (
          <div className="space-y-3">
            {users.map(u => (
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
                    <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                      <Edit className="w-4 h-4 text-gray-400" />
                    </button>
                  </div>
                </div>
              </div>
            ))}
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
      </div>

      {/* Edit Event Modal */}
      {editEvent && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditEvent(null)}>
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
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditUser(null)}>
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

      {toast && (
        <div className="fixed bottom-20 left-1/2 -translate-x-1/2 bg-gray-800 text-white px-4 py-2 rounded-full text-sm flex items-center gap-2 shadow-lg z-50">
          <Check className="w-4 h-4 text-emerald-400" />{toast}
        </div>
      )}
    </div>
  )
}
