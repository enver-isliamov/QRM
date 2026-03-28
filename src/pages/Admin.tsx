import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Users, Shield, Settings, BarChart3, ChevronLeft, Edit, Trash2, Plus, X, Check, Save,
  BookOpen, ToggleRight, ChevronRight, ArrowUp, ArrowDown, MapPin, Calendar, Phone,
  AlertCircle, Droplets, Banknote, HelpCircle, XCircle
} from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import useSWR from 'swr'
import { toast } from 'sonner'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'

type Tab = 'stats' | 'users' | 'events' | 'help' | 'meetings' | 'rituals' | 'settings' | 'moderation'
type UserRow = { id: string; name: string; avatar_url?: string; role: string; provider: string; created_at: string }
type EventRow = { id: string; event_date: string; title: string; title_crh?: string; description?: string; description_crh?: string; type: string }
type HelpRow = {
  id: string; title: string; type: string; urgency: string; status: string
  location: string; description: string; created_at: string; responses_count?: number
  author_id?: string; contact_phone?: string; cloudtips_url?: string
}
type MeetRow = {
  id: string; village: string; organizer: string; meeting_date: string; status: string
  attendees_count?: number; location?: string; description?: string; author_id?: string
  fund_purpose?: string; fund_goal?: number; fund_current?: number; fund_progress?: number
  organizer_phone?: string; meeting_time?: string
}
type RitualRow = { id: string; title: string; title_crh?: string; subtitle?: string; subtitle_crh?: string; icon?: string; sort_order?: number }
type RitualStepRow = { id: number; ritual_id: string; step_order: number; title: string; title_crh?: string; description?: string; description_crh?: string }
type ReportRow = { id: string; reporter_id: string; target_type: string; target_id: string; reason: string; status: string; created_at: string }
type AuditLogRow = { id: string; admin_id: string; action: string; target_type: string; target_id: string; created_at: string; admin?: { name: string; email: string } }

const fetcher = async (key: string) => {
  const [table, pageStr, limitStr] = key.split(':')
  const page = parseInt(pageStr, 10)
  const limit = parseInt(limitStr, 10)
  const { data, count } = await supabase
    .from(table).select('*', { count: 'exact' })
    .order('created_at', { ascending: false })
    .range((page - 1) * limit, page * limit - 1)
  return { data, count }
}

export default function Admin() {
  const navigate = useNavigate()
  const { profile } = useAuth()
  const { featureToggles, setFeatureToggle } = useStore()
  const isModerator = profile?.role === 'moderator'
  const [tab, setTab] = useState<Tab>(isModerator ? 'moderation' : 'stats')

  // Data state
  const [stats, setStats] = useState<Record<string, number>>({})
  const [events, setEvents] = useState<EventRow[]>([])
  const [helpReqs, setHelpReqs] = useState<HelpRow[]>([])
  const [helpFilter, setHelpFilter] = useState<string>('all')
  const [meetingList, setMeetingList] = useState<MeetRow[]>([])
  const [meetingFilter, setMeetingFilter] = useState<string>('upcoming')
  const [rituals, setRituals] = useState<RitualRow[]>([])
  const [ritualSteps, setRitualSteps] = useState<RitualStepRow[]>([])
  const [selectedRitual, setSelectedRitual] = useState<RitualRow | null>(null)
  const [reports, setReports] = useState<ReportRow[]>([])
  const [auditLogs, setAuditLogs] = useState<AuditLogRow[]>([])
  const [loading, setLoading] = useState(false)

  // Edit state
  const [editEvent, setEditEvent] = useState<Partial<EventRow> | null>(null)
  const [editUser, setEditUser] = useState<UserRow | null>(null)
  const [editRitual, setEditRitual] = useState<Partial<RitualRow> | null>(null)
  const [editStep, setEditStep] = useState<Partial<RitualStepRow> | null>(null)
  const [editMeeting, setEditMeeting] = useState<Partial<MeetRow> | null>(null)

  // Confirm delete
  const [deleteConfirm, setDeleteConfirm] = useState<{
    id: string | number; type: 'event' | 'ritual' | 'step' | 'help' | 'meeting'; title: string
  } | null>(null)

  // Users pagination
  const [usersPage, setUsersPage] = useState(1)
  const { data: usersData, mutate: mutateUsers } = useSWR(
    tab === 'users' && !isModerator ? `profiles:${usersPage}:10` : null, fetcher
  )

  useEffect(() => { loadTab(tab) }, [tab, helpFilter, meetingFilter])

  const loadTab = async (t: Tab) => {
    setLoading(true)
    try {
      if (t === 'stats') {
        const { data } = await supabase.from('admin_stats').select('*').single()
        if (data) setStats(data as any)
      }
      if (t === 'events') {
        const { data } = await supabase.from('ethno_events').select('*').order('event_date')
        if (data) setEvents(data as EventRow[])
      }
      if (t === 'help') {
        let query = supabase.from('help_requests_with_count').select('*').order('created_at', { ascending: false })
        if (helpFilter !== 'all') query = query.eq('status', helpFilter)
        const { data } = await query
        if (data) setHelpReqs(data as HelpRow[])
      }
      if (t === 'moderation') {
        const { data: pending } = await supabase.from('help_requests_with_count').select('*').eq('status', 'pending').order('created_at', { ascending: false })
        if (pending) setHelpReqs(pending as HelpRow[])
        const { data: reportsData } = await supabase.from('reports').select('*').order('created_at', { ascending: false })
        if (reportsData) setReports(reportsData as ReportRow[])
        const { data: auditData } = await supabase.from('audit_logs').select('*, admin:profiles!audit_logs_admin_id_fkey(name, email)').order('created_at', { ascending: false }).limit(50)
        if (auditData) setAuditLogs(auditData as AuditLogRow[])
      }
      if (t === 'meetings') {
        let query = supabase.from('meetings_with_stats').select('*').order('meeting_date', { ascending: false })
        if (meetingFilter !== 'all') query = query.eq('status', meetingFilter)
        const { data } = await query
        if (data) setMeetingList(data as MeetRow[])
      }
      if (t === 'rituals') {
        const { data } = await supabase.from('rituals').select('*').order('sort_order')
        if (data) setRituals(data as RitualRow[])
        setSelectedRitual(null); setRitualSteps([])
      }
    } catch (err) {
      console.error(err); toast.error('Ошибка загрузки')
    } finally {
      setLoading(false)
    }
  }

  const logAudit = async (action: string, target_type: string, target_id: string) => {
    await supabase.rpc('log_admin_action', { p_action: action, p_target_type: target_type, p_target_id: target_id }).catch(console.error)
  }

  // ─── HELP REQUESTS ─────────────────────────────────────────────
  const handleDeleteHelp = async (id: string) => {
    const { error } = await supabase.from('help_requests').delete().eq('id', id)
    if (!error) {
      await logAudit('delete', 'help_requests', id)
      toast.success('Обращение удалено')
      loadTab(tab)
    } else {
      toast.error('Ошибка удаления')
    }
    setDeleteConfirm(null)
  }

  const closeHelpRequest = async (id: string) => {
    await supabase.from('help_requests').update({ status: 'completed' }).eq('id', id)
    await logAudit('close', 'help_requests', id)
    toast.success('Обращение закрыто'); loadTab(tab)
  }

  const approveHelp = async (r: HelpRow) => {
    await supabase.from('help_requests').update({ status: 'active' }).eq('id', r.id)
    await logAudit('approve', 'help_requests', r.id)
    if (r.author_id) {
      await supabase.from('user_notifications').insert({
        user_id: r.author_id, type: 'system',
        title: 'Ваше обращение одобрено',
        body: `Обращение "${r.title}" опубликовано.`, link: `/micro-yardym`
      })
    }
    toast.success('Одобрено'); loadTab(tab)
  }

  const rejectHelp = async (r: HelpRow) => {
    await supabase.from('help_requests').update({ status: 'rejected' }).eq('id', r.id)
    await logAudit('reject', 'help_requests', r.id)
    if (r.author_id) {
      await supabase.from('user_notifications').insert({
        user_id: r.author_id, type: 'system',
        title: 'Обращение отклонено',
        body: `Обращение "${r.title}" не прошло модерацию.`
      })
    }
    toast.success('Отклонено'); loadTab(tab)
  }

  // ─── MEETINGS ───────────────────────────────────────────────────
  const saveMeeting = async () => {
    if (!editMeeting) return
    if (editMeeting.id) {
      const { error } = await supabase.from('meetings').update(editMeeting).eq('id', editMeeting.id)
      if (!error) { await logAudit('update', 'meetings', editMeeting.id); toast.success('Встреча обновлена') }
      else toast.error('Ошибка сохранения')
    }
    setEditMeeting(null); loadTab('meetings')
  }

  const deleteMeeting = async (id: string) => {
    const { error } = await supabase.from('meetings').delete().eq('id', id)
    if (!error) { await logAudit('delete', 'meetings', id); toast.success('Встреча удалена') }
    else toast.error('Ошибка удаления')
    setDeleteConfirm(null); loadTab('meetings')
  }

  const changeMeetingStatus = async (id: string, status: string) => {
    await supabase.from('meetings').update({ status }).eq('id', id)
    await logAudit(`set_status_${status}`, 'meetings', id)
    toast.success(`Статус: ${status}`); loadTab('meetings')
  }

  // ─── EVENTS ─────────────────────────────────────────────────────
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

  // ─── RITUALS ─────────────────────────────────────────────────────
  const saveRitual = async () => {
    if (!editRitual) return
    if (editRitual.id) {
      await supabase.from('rituals').update(editRitual).eq('id', editRitual.id)
    } else {
      await supabase.from('rituals').insert(editRitual)
    }
    setEditRitual(null); loadTab('rituals'); toast.success('Обряд сохранён')
  }

  const loadRitualSteps = async (id: string) => {
    setLoading(true)
    const { data } = await supabase.from('ritual_steps').select('*').eq('ritual_id', id).order('step_order')
    if (data) setRitualSteps(data as RitualStepRow[])
    setLoading(false)
  }

  const saveStep = async () => {
    if (!editStep || !selectedRitual) return
    const stepData = { ...editStep, ritual_id: selectedRitual.id }
    if (editStep.id) await supabase.from('ritual_steps').update(stepData).eq('id', editStep.id)
    else await supabase.from('ritual_steps').insert(stepData)
    setEditStep(null); loadRitualSteps(selectedRitual.id); toast.success('Шаг сохранён')
  }

  const moveStep = async (step: RitualStepRow, dir: 'up' | 'down') => {
    if (!selectedRitual) return
    const idx = ritualSteps.findIndex(s => s.id === step.id)
    if (dir === 'up' && idx === 0) return
    if (dir === 'down' && idx === ritualSteps.length - 1) return
    const other = dir === 'up' ? ritualSteps[idx - 1] : ritualSteps[idx + 1]
    await supabase.from('ritual_steps').update({ step_order: other.step_order }).eq('id', step.id)
    await supabase.from('ritual_steps').update({ step_order: step.step_order }).eq('id', other.id)
    loadRitualSteps(selectedRitual.id)
  }

  const handleDeleteConfirmed = async () => {
    if (!deleteConfirm) return
    const { id, type } = deleteConfirm
    if (type === 'event') { await supabase.from('ethno_events').delete().eq('id', id); loadTab('events') }
    if (type === 'ritual') { await supabase.from('rituals').delete().eq('id', id); loadTab('rituals') }
    if (type === 'step') { await supabase.from('ritual_steps').delete().eq('id', id); if (selectedRitual) loadRitualSteps(selectedRitual.id) }
    if (type === 'help') await handleDeleteHelp(String(id))
    if (type === 'meeting') await deleteMeeting(String(id))
    if (type !== 'help' && type !== 'meeting') { await logAudit('delete', type + 's', String(id)); toast.success('Удалено'); setDeleteConfirm(null) }
  }

  // ─── USERS ───────────────────────────────────────────────────────
  const updateUserRole = async (uid: string, role: string) => {
    const { error } = await supabase.rpc('set_user_role', { target_user_id: uid, new_role: role })
      .catch(async () => supabase.from('profiles').update({ role }).eq('id', uid))
    if (!error) { await logAudit('update_role', 'profiles', uid); mutateUsers(); setEditUser(null); toast.success('Роль изменена') }
    else toast.error('Ошибка изменения роли')
  }

  // ─── TABS CONFIG ─────────────────────────────────────────────────
  const tabs = [
    { id: 'stats' as Tab, label: 'Статистика', icon: BarChart3, show: !isModerator },
    { id: 'users' as Tab, label: 'Пользователи', icon: Users, show: !isModerator },
    { id: 'moderation' as Tab, label: 'Модерация', icon: Shield, show: true },
    { id: 'help' as Tab, label: 'Ярдым', icon: HelpCircle, show: true },
    { id: 'meetings' as Tab, label: 'Встречи', icon: MapPin, show: true },
    { id: 'events' as Tab, label: 'Календарь', icon: Calendar, show: true },
    { id: 'rituals' as Tab, label: 'Обряды', icon: BookOpen, show: true },
    { id: 'settings' as Tab, label: 'Настройки', icon: ToggleRight, show: !isModerator },
  ].filter(t => t.show)

  const typeIcon = (type: string) => {
    if (type === 'blood') return <Droplets className="w-4 h-4 text-rose-500" />
    if (type === 'money') return <Banknote className="w-4 h-4 text-blue-500" />
    return <HelpCircle className="w-4 h-4 text-gray-500" />
  }

  const statusBadge = (status: string) => {
    const map: Record<string, string> = {
      active: 'bg-green-100 text-green-700', pending: 'bg-amber-100 text-amber-700',
      completed: 'bg-gray-100 text-gray-500', rejected: 'bg-rose-100 text-rose-700',
      cancelled: 'bg-gray-100 text-gray-500', upcoming: 'bg-amber-100 text-amber-700'
    }
    const labels: Record<string, string> = {
      active: 'Активно', pending: 'Модерация', completed: 'Закрыто',
      rejected: 'Отклонено', cancelled: 'Отменена', upcoming: 'Предстоит'
    }
    return <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${map[status] || 'bg-gray-100'}`}>{labels[status] || status}</span>
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
          {tabs.map(({ id, label, icon: Icon }) => (
            <button key={id} onClick={() => setTab(id)}
              className={`flex items-center gap-1.5 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab === id ? 'border-purple-500 text-purple-600' : 'border-transparent text-gray-500'
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

        {/* ═══ STATS ═══ */}
        {!loading && tab === 'stats' && (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              {[
                { key: 'total_users', label: 'Пользователей', color: 'text-purple-600', bg: 'bg-purple-50' },
                { key: 'new_users_week', label: 'За неделю', color: 'text-blue-600', bg: 'bg-blue-50' },
                { key: 'prayers_today', label: 'Намазов сегодня', color: 'text-emerald-600', bg: 'bg-emerald-50' },
                { key: 'upcoming_meetings', label: 'Встреч предстоит', color: 'text-amber-600', bg: 'bg-amber-50' },
              ].map(({ key, label, color, bg }) => (
                <div key={key} className={`${bg} rounded-xl p-4`}>
                  <div className={`text-3xl font-bold ${color}`}>{stats[key] ?? '—'}</div>
                  <div className="text-sm text-gray-600 mt-1">{label}</div>
                </div>
              ))}
            </div>

            <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
              <h3 className="font-bold text-gray-800 mb-3">Обращения Ярдым</h3>
              <div className="grid grid-cols-3 gap-3 mb-4">
                {[
                  { key: 'active_help', label: 'Активных', color: 'text-green-600' },
                  { key: 'urgent_help', label: 'Срочных', color: 'text-rose-600' },
                  { key: 'pending_help', label: 'На модерации', color: 'text-amber-600' },
                  { key: 'completed_help', label: 'Закрытых', color: 'text-gray-500' },
                  { key: 'total_responses', label: 'Всего откликов', color: 'text-blue-600' },
                  { key: 'pending_reports', label: 'Жалоб', color: 'text-rose-500' },
                ].map(({ key, label, color }) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-3 text-center">
                    <div className={`text-xl font-bold ${color}`}>{stats[key] ?? 0}</div>
                    <div className="text-xs text-gray-500 mt-0.5">{label}</div>
                  </div>
                ))}
              </div>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { key: 'blood_requests', label: '🩸 Кровь' },
                  { key: 'money_requests', label: '💰 Финансы' },
                  { key: 'other_requests', label: '🤝 Другое' },
                ].map(({ key, label }) => (
                  <div key={key} className="bg-gray-50 rounded-lg p-2 text-center">
                    <div className="text-lg font-bold text-gray-700">{stats[key] ?? 0}</div>
                    <div className="text-xs text-gray-400">{label}</div>
                  </div>
                ))}
              </div>
            </div>

            <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
              <p className="text-sm text-emerald-700">
                Данные в реальном времени из Supabase.{' '}
                <a href="https://supabase.com/dashboard/project/cksqnhldbrvbmdwtjefq" target="_blank" rel="noreferrer" className="font-medium underline">Dashboard →</a>
              </p>
            </div>
          </div>
        )}

        {/* ═══ USERS ═══ */}
        {!loading && tab === 'users' && !isModerator && (
          <div className="space-y-3">
            {!usersData ? (
              <div className="text-center py-4 text-gray-500">Загрузка...</div>
            ) : (
              <>
                {usersData.data?.map((u: any) => (
                  <div key={u.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="w-10 h-10 bg-purple-100 rounded-full flex items-center justify-center font-semibold text-purple-600 overflow-hidden">
                          {u.avatar_url ? <img src={u.avatar_url} className="w-full h-full object-cover" alt="" /> : u.name?.[0]?.toUpperCase() ?? '?'}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-800">{u.name || 'Без имени'}</p>
                          <p className="text-xs text-gray-400">{u.provider} · {new Date(u.created_at).toLocaleDateString('ru-RU')}</p>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <span className={`text-xs px-2 py-0.5 rounded-full ${u.role === 'admin' ? 'bg-purple-100 text-purple-700' : u.role === 'moderator' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}>
                          {u.role === 'admin' ? 'Админ' : u.role === 'moderator' ? 'Мод.' : 'Польз.'}
                        </span>
                        <button onClick={() => setEditUser(u)} className="p-1.5 hover:bg-gray-100 rounded-lg">
                          <Edit className="w-4 h-4 text-gray-400" />
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
                {usersData.count && usersData.count > 10 && (
                  <div className="flex items-center justify-between bg-white p-4 rounded-xl shadow-sm border border-gray-100">
                    <button onClick={() => setUsersPage(p => Math.max(1, p - 1))} disabled={usersPage === 1}
                      className="p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="w-5 h-5" /></button>
                    <span className="text-sm text-gray-600">Стр. {usersPage} из {Math.ceil(usersData.count / 10)}</span>
                    <button onClick={() => setUsersPage(p => p + 1)} disabled={usersPage >= Math.ceil(usersData.count / 10)}
                      className="p-2 rounded-lg hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="w-5 h-5" /></button>
                  </div>
                )}
              </>
            )}
          </div>
        )}

        {/* ═══ MODERATION ═══ */}
        {!loading && tab === 'moderation' && (
          <div className="space-y-6">
            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Ожидают модерации ({helpReqs.length})</h2>
              {helpReqs.length === 0 ? (
                <div className="bg-white p-6 rounded-xl border border-gray-100 text-center text-gray-500">
                  <Check className="w-8 h-8 text-emerald-400 mx-auto mb-2" />
                  Нет обращений на проверке
                </div>
              ) : (
                <div className="space-y-3">
                  {helpReqs.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-amber-200">
                      <div className="flex items-start gap-2 mb-2">
                        {typeIcon(r.type)}
                        <p className="font-semibold text-gray-800 flex-1">{r.title}</p>
                        <span className={`text-xs px-2 py-0.5 rounded-full flex-shrink-0 ${r.urgency === 'urgent' ? 'bg-rose-100 text-rose-700' : 'bg-gray-100 text-gray-500'}`}>
                          {r.urgency === 'urgent' ? '🔴 Срочно' : 'Обычное'}
                        </span>
                      </div>
                      <p className="text-sm text-gray-500 mb-1">{r.location}</p>
                      {r.description && <p className="text-sm text-gray-600 mb-3 line-clamp-2">{r.description}</p>}
                      <div className="flex gap-2">
                        <button onClick={() => approveHelp(r)} className="flex-1 bg-emerald-500 text-white py-2 rounded-xl text-sm font-medium hover:bg-emerald-600">
                          ✓ Одобрить
                        </button>
                        <button onClick={() => rejectHelp(r)} className="flex-1 bg-rose-100 text-rose-700 py-2 rounded-xl text-sm font-medium hover:bg-rose-200">
                          Отклонить
                        </button>
                        <button onClick={() => setDeleteConfirm({ id: r.id, type: 'help', title: r.title })}
                          className="p-2 bg-gray-100 text-gray-500 rounded-xl hover:bg-rose-50 hover:text-rose-500">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Жалобы ({reports.filter(r => r.status === 'pending').length})</h2>
              {reports.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100">Жалоб нет.</p>
              ) : (
                <div className="space-y-3">
                  {reports.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-rose-100">
                      <div className="flex justify-between mb-2">
                        <span className="text-xs font-bold text-rose-600">{r.target_type === 'help_request' ? 'На обращение' : 'На комментарий'}</span>
                        {statusBadge(r.status)}
                      </div>
                      <p className="font-medium text-gray-800">{r.reason}</p>
                      <p className="text-xs text-gray-400 mt-1">ID: {r.target_id.slice(0, 12)}...</p>
                      {r.status === 'pending' && (
                        <div className="flex gap-2 mt-3">
                          <button onClick={async () => { await supabase.from('reports').update({ status: 'reviewed' }).eq('id', r.id); await logAudit('review', 'reports', r.id); loadTab('moderation'); toast.success('Рассмотрено') }}
                            className="flex-1 bg-emerald-50 text-emerald-600 py-2 rounded-xl text-sm">Рассмотрено</button>
                          <button onClick={async () => { await supabase.from('reports').update({ status: 'dismissed' }).eq('id', r.id); await logAudit('dismiss', 'reports', r.id); loadTab('moderation'); toast.success('Отклонена') }}
                            className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-xl text-sm">Отклонить</button>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div>
              <h2 className="text-lg font-bold text-gray-800 mb-3">Журнал действий</h2>
              {auditLogs.length === 0 ? (
                <p className="text-sm text-gray-500 bg-white p-4 rounded-xl border border-gray-100">Пусто.</p>
              ) : (
                <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full text-sm">
                      <thead className="bg-gray-50 text-gray-500">
                        <tr>
                          <th className="px-4 py-3 text-left">Дата</th>
                          <th className="px-4 py-3 text-left">Модератор</th>
                          <th className="px-4 py-3 text-left">Действие</th>
                          <th className="px-4 py-3 text-left">Объект</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100">
                        {auditLogs.map(log => (
                          <tr key={log.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-gray-400 whitespace-nowrap text-xs">{new Date(log.created_at).toLocaleString('ru-RU')}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{log.admin?.name || '—'}</td>
                            <td className="px-4 py-3 text-gray-600">{log.action}</td>
                            <td className="px-4 py-3 text-gray-400 font-mono text-xs">{log.target_type}</td>
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

        {/* ═══ HELP (FULL MANAGEMENT) ═══ */}
        {!loading && tab === 'help' && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[['all', 'Все'], ['active', 'Активные'], ['pending', 'На модерации'], ['completed', 'Закрытые'], ['rejected', 'Отклонённые']].map(([val, label]) => (
                <button key={val} onClick={() => { setHelpFilter(val); }}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap transition-colors ${helpFilter === val ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            {helpReqs.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200">
                <HelpCircle className="w-10 h-10 text-gray-200 mx-auto mb-3" />
                <p className="text-gray-400">Нет обращений</p>
              </div>
            ) : (
              <div className="space-y-3">
                {helpReqs.map(r => (
                  <div key={r.id} className={`rounded-xl p-4 shadow-sm border ${r.urgency === 'urgent' ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100'}`}>
                    <div className="flex items-start gap-2 mb-1">
                      {typeIcon(r.type)}
                      <p className="font-semibold text-gray-800 flex-1 min-w-0 truncate">{r.title}</p>
                      {statusBadge(r.status)}
                    </div>
                    <p className="text-sm text-gray-500 mb-1">{r.location}</p>
                    {r.description && <p className="text-xs text-gray-400 mb-2 line-clamp-2">{r.description}</p>}
                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>{format(new Date(r.created_at), 'd MMM yyyy', { locale: ru })}</span>
                      <span>Откликов: {r.responses_count ?? 0}</span>
                      {r.contact_phone && <a href={`tel:${r.contact_phone}`} className="text-emerald-600">{r.contact_phone}</a>}
                    </div>
                    <div className="flex gap-2">
                      {r.status === 'pending' && (
                        <button onClick={() => approveHelp(r)} className="flex-1 bg-emerald-100 text-emerald-700 py-2 rounded-lg text-xs font-medium">
                          Одобрить
                        </button>
                      )}
                      {r.status === 'active' && (
                        <button onClick={() => closeHelpRequest(r.id)} className="flex-1 bg-gray-100 text-gray-600 py-2 rounded-lg text-xs font-medium">
                          <XCircle className="w-3.5 h-3.5 inline mr-1" />Закрыть
                        </button>
                      )}
                      {(r.status === 'pending' || r.status === 'active') && (
                        <button onClick={() => rejectHelp(r)} className="flex-1 bg-amber-50 text-amber-700 py-2 rounded-lg text-xs font-medium">
                          Отклонить
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm({ id: r.id, type: 'help', title: r.title })}
                        className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100 flex-shrink-0">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ MEETINGS (FULL MANAGEMENT) ═══ */}
        {!loading && tab === 'meetings' && (
          <div>
            {/* Filters */}
            <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
              {[['upcoming', 'Предстоящие'], ['all', 'Все'], ['completed', 'Завершённые'], ['cancelled', 'Отменённые']].map(([val, label]) => (
                <button key={val} onClick={() => setMeetingFilter(val)}
                  className={`px-3 py-1.5 rounded-full text-sm font-medium whitespace-nowrap ${meetingFilter === val ? 'bg-emerald-500 text-white' : 'bg-white text-gray-600 border border-gray-200'}`}>
                  {label}
                </button>
              ))}
            </div>

            {meetingList.length === 0 ? (
              <div className="text-center py-12 bg-white rounded-xl border border-dashed border-gray-200 text-gray-400">Нет встреч</div>
            ) : (
              <div className="space-y-3">
                {meetingList.map(m => (
                  <div key={m.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1 min-w-0">
                        <p className="font-semibold text-gray-800 truncate">{m.village}</p>
                        <p className="text-sm text-gray-500">{m.organizer} · {format(new Date(m.meeting_date), 'd MMM yyyy', { locale: ru })}</p>
                        {m.location && <p className="text-xs text-gray-400 mt-0.5">{m.location}</p>}
                      </div>
                      <div className="flex items-center gap-1 ml-2 flex-shrink-0">
                        {statusBadge(m.status)}
                      </div>
                    </div>

                    {m.fund_goal && (
                      <div className="mb-2">
                        <div className="flex justify-between text-xs text-gray-500 mb-1">
                          <span>{m.fund_purpose}</span>
                          <span className="text-emerald-600">{m.fund_progress ?? 0}%</span>
                        </div>
                        <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                          <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${m.fund_progress ?? 0}%` }} />
                        </div>
                      </div>
                    )}

                    <div className="flex items-center justify-between text-xs text-gray-400 mb-3">
                      <span>{m.attendees_count ?? 0} участников</span>
                    </div>

                    <div className="flex gap-2">
                      <button onClick={() => navigate(`/meetings/${m.id}`)}
                        className="flex-1 bg-gray-50 text-gray-600 py-2 rounded-lg text-xs font-medium border border-gray-200">
                        Детали →
                      </button>
                      <button onClick={() => setEditMeeting({ ...m })}
                        className="p-2 bg-emerald-50 text-emerald-600 rounded-lg hover:bg-emerald-100">
                        <Edit className="w-4 h-4" />
                      </button>
                      {m.status === 'upcoming' && (
                        <button onClick={() => changeMeetingStatus(m.id, 'cancelled')}
                          className="p-2 bg-amber-50 text-amber-600 rounded-lg hover:bg-amber-100" title="Отменить">
                          <XCircle className="w-4 h-4" />
                        </button>
                      )}
                      {m.status === 'upcoming' && (
                        <button onClick={() => changeMeetingStatus(m.id, 'completed')}
                          className="p-2 bg-blue-50 text-blue-600 rounded-lg hover:bg-blue-100" title="Завершить">
                          <Check className="w-4 h-4" />
                        </button>
                      )}
                      <button onClick={() => setDeleteConfirm({ id: m.id, type: 'meeting', title: m.village })}
                        className="p-2 bg-rose-50 text-rose-500 rounded-lg hover:bg-rose-100">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* ═══ EVENTS ═══ */}
        {!loading && tab === 'events' && (
          <div>
            <button onClick={() => setEditEvent({ type: 'holiday' })}
              className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4">
              <Plus className="w-4 h-4" />Добавить событие
            </button>
            <div className="space-y-3">
              {events.map(e => (
                <div key={e.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between">
                    <div className="flex-1 min-w-0">
                      <p className="text-xs text-gray-400">{e.event_date}</p>
                      <p className="font-semibold text-gray-800">{e.title}</p>
                      {e.description && <p className="text-sm text-gray-500 mt-0.5 line-clamp-1">{e.description}</p>}
                      <span className={`inline-block mt-1 text-xs px-2 py-0.5 rounded-full ${e.type === 'holiday' ? 'bg-emerald-100 text-emerald-700' : e.type === 'memorial' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'}`}>
                        {e.type === 'holiday' ? 'Праздник' : e.type === 'memorial' ? 'Памятная дата' : 'Другое'}
                      </span>
                    </div>
                    <div className="flex gap-1 ml-2">
                      <button onClick={() => setEditEvent(e)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-4 h-4 text-gray-400" /></button>
                      <button onClick={() => setDeleteConfirm({ id: e.id, type: 'event', title: e.title })} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-4 h-4 text-rose-400" /></button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* ═══ RITUALS ═══ */}
        {!loading && tab === 'rituals' && (
          <div>
            {!selectedRitual ? (
              <>
                <button onClick={() => setEditRitual({})} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4">
                  <Plus className="w-4 h-4" />Добавить обряд
                </button>
                <div className="space-y-3">
                  {rituals.map(r => (
                    <div key={r.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer hover:border-emerald-200"
                      onClick={() => { setSelectedRitual(r); loadRitualSteps(r.id) }}>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <span className="text-2xl">{r.icon || '📖'}</span>
                          <div>
                            <p className="font-semibold text-gray-800">{r.title}</p>
                            <p className="text-sm text-gray-500">{r.subtitle}</p>
                          </div>
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
                  <button onClick={() => setSelectedRitual(null)} className="flex items-center gap-1 text-gray-600">
                    <ChevronLeft className="w-5 h-5" /><span>Назад</span>
                  </button>
                  <h2 className="font-bold text-gray-800">{selectedRitual.title} — Шаги</h2>
                </div>
                <button onClick={() => setEditStep({ step_order: ritualSteps.length + 1 })} className="flex items-center gap-2 bg-emerald-500 text-white px-4 py-2.5 rounded-xl text-sm font-medium mb-4">
                  <Plus className="w-4 h-4" />Добавить шаг
                </button>
                <div className="space-y-3">
                  {ritualSteps.map((s, idx) => (
                    <div key={s.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                      <div className="flex items-start gap-3">
                        <div className="w-6 h-6 bg-gray-100 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 flex-shrink-0">{idx + 1}</div>
                        <div className="flex-1">
                          <p className="font-semibold text-gray-800">{s.title}</p>
                          {s.description && <p className="text-sm text-gray-500 mt-1 line-clamp-2">{s.description}</p>}
                        </div>
                        <div className="flex flex-col gap-1">
                          <div className="flex gap-1">
                            <button onClick={() => moveStep(s, 'up')} disabled={idx === 0} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowUp className="w-3.5 h-3.5" /></button>
                            <button onClick={() => moveStep(s, 'down')} disabled={idx === ritualSteps.length - 1} className="p-1 hover:bg-gray-100 rounded disabled:opacity-30"><ArrowDown className="w-3.5 h-3.5" /></button>
                          </div>
                          <div className="flex gap-1">
                            <button onClick={() => setEditStep(s)} className="p-1.5 hover:bg-gray-100 rounded-lg"><Edit className="w-3.5 h-3.5 text-gray-400" /></button>
                            <button onClick={() => setDeleteConfirm({ id: s.id, type: 'step', title: s.title })} className="p-1.5 hover:bg-rose-50 rounded-lg"><Trash2 className="w-3.5 h-3.5 text-rose-400" /></button>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* ═══ SETTINGS ═══ */}
        {!loading && tab === 'settings' && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h2 className="font-semibold text-gray-800 mb-4">Feature Toggles</h2>
            <div className="space-y-3">
              {([['meetings', 'Встречи сёл'], ['yardym', 'Микро-Ярдым'], ['calendar', 'Этно-календарь'], ['rituals', 'Обряды'], ['preModeration', 'Премодерация Ярдым']] as const).map(([id, label]) => (
                <div key={id} className="flex items-center justify-between py-2 border-b border-gray-50 last:border-0">
                  <span className="text-gray-700 font-medium">{label}</span>
                  <button onClick={() => setFeatureToggle(id, !featureToggles[id])}
                    className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${featureToggles[id] ? 'bg-emerald-500' : 'bg-gray-200'}`}>
                    <span className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${featureToggles[id] ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* ══════════ MODALS ══════════ */}

      {/* Delete Confirm */}
      {deleteConfirm && (
        <div className="fixed inset-0 z-[110] flex items-center justify-center modal-overlay" onClick={() => setDeleteConfirm(null)}>
          <div className="bg-white w-[90%] max-w-sm rounded-2xl p-6 shadow-xl" onClick={e => e.stopPropagation()}>
            <div className="text-center">
              <div className="w-14 h-14 bg-rose-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <Trash2 className="w-7 h-7 text-rose-600" />
              </div>
              <h3 className="text-lg font-bold text-gray-900 mb-2">Удалить?</h3>
              <p className="text-sm text-gray-500 mb-6">«{deleteConfirm.title}» будет удалено без возможности восстановления.</p>
              <div className="flex gap-3">
                <button onClick={() => setDeleteConfirm(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium">Отмена</button>
                <button onClick={handleDeleteConfirmed} className="flex-1 bg-rose-500 text-white py-3 rounded-xl font-medium">Удалить</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Meeting Modal */}
      {editMeeting && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditMeeting(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Редактировать встречу</h2>
              <button onClick={() => setEditMeeting(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {([
                ['village', 'Село *', 'text'],
                ['organizer', 'Организатор', 'text'],
                ['organizer_phone', 'Телефон', 'tel'],
                ['location', 'Место', 'text'],
                ['meeting_date', 'Дата *', 'date'],
                ['meeting_time', 'Время', 'time'],
              ] as [keyof MeetRow, string, string][]).map(([f, label, type]) => (
                <div key={String(f)}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={String((editMeeting as any)[f] ?? '')}
                    onChange={e => setEditMeeting(v => ({ ...v, [f]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea value={editMeeting.description ?? ''} rows={3}
                  onChange={e => setEditMeeting(v => ({ ...v, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 resize-none" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
                <select value={editMeeting.status ?? 'upcoming'} onChange={e => setEditMeeting(v => ({ ...v, status: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500">
                  <option value="upcoming">Предстоит</option>
                  <option value="completed">Завершена</option>
                  <option value="cancelled">Отменена</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditMeeting(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={saveMeeting} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
                  <Save className="w-4 h-4" />Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

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
                <input type="date" value={editEvent.event_date ?? ''} onChange={e => setEditEvent(v => ({ ...v, event_date: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              {([['title', 'Название (рус)'], ['title_crh', 'Название (крымтат)'], ['description', 'Описание (рус)'], ['description_crh', 'Описание (крымтат)']] as [keyof EventRow, string][]).map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input value={(editEvent as any)[f] ?? ''} onChange={e => setEditEvent(v => ({ ...v, [f]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип</label>
                <select value={editEvent.type ?? 'holiday'} onChange={e => setEditEvent(v => ({ ...v, type: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
                  <option value="holiday">Праздник</option>
                  <option value="memorial">Памятная дата</option>
                  <option value="custom">Другое</option>
                </select>
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditEvent(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={saveEvent} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium flex items-center justify-center gap-2">
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
              {(['user', 'moderator', 'admin'] as const).map(role => (
                <button key={role} onClick={() => updateUserRole(editUser.id, role)}
                  className={`w-full flex items-center justify-between px-4 py-3 rounded-xl border ${editUser.role === role ? 'border-purple-500 bg-purple-50 text-purple-700' : 'border-gray-200 text-gray-600 hover:bg-gray-50'}`}>
                  <span>{{ user: 'Пользователь', moderator: 'Модератор', admin: 'Администратор' }[role]}</span>
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
              {([['title', 'Название (RU)'], ['title_crh', 'Название (CRH)'], ['subtitle', 'Подзаголовок (RU)'], ['subtitle_crh', 'Подзаголовок (CRH)'], ['icon', 'Иконка (emoji)']] as [keyof RitualRow, string][]).map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type="text" value={String((editRitual as any)[f] ?? '')} onChange={e => setEditRitual(v => ({ ...v, [f]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditRitual(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={saveRitual} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Edit Step Modal */}
      {editStep && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditStep(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">{editStep.id ? 'Редактировать шаг' : 'Новый шаг'}</h2>
              <button onClick={() => setEditStep(null)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {([['title', 'Заголовок (RU)'], ['title_crh', 'Заголовок (CRH)']] as [keyof RitualStepRow, string][]).map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type="text" value={String((editStep as any)[f] ?? '')} onChange={e => setEditStep(v => ({ ...v, [f]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500" />
                </div>
              ))}
              {([['description', 'Описание (RU)'], ['description_crh', 'Описание (CRH)']] as [keyof RitualStepRow, string][]).map(([f, l]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <textarea value={String((editStep as any)[f] ?? '')} rows={3} onChange={e => setEditStep(v => ({ ...v, [f]: e.target.value }))}
                    className="w-full bg-gray-50 border border-gray-200 rounded-xl px-4 py-2.5 focus:outline-none focus:ring-2 focus:ring-emerald-500 resize-none" />
                </div>
              ))}
              <div className="flex gap-3 pt-2">
                <button onClick={() => setEditStep(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={saveStep} className="flex-1 bg-emerald-500 text-white rounded-xl py-3 font-semibold flex items-center justify-center gap-2">
                  <Save className="w-5 h-5" />Сохранить
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
