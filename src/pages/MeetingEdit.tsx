import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ChevronLeft, Save, Trash2 } from 'lucide-react'
import { supabase } from '../lib/supabase'
import { useAuth } from '../hooks/useAuth'
import { toast } from 'sonner'

export default function MeetingEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { profile } = useAuth()
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)

  const [form, setForm] = useState({
    village: '', organizer: '', organizer_phone: '', organizer_email: '',
    location: '', meeting_date: '', meeting_time: '', description: '',
    fund_purpose: '', fund_goal: '', fund_current: '', fund_cloudtips_url: '',
    fund_instructions: '', status: 'upcoming',
  })

  useEffect(() => {
    if (!id) return
    supabase.from('meetings').select('*').eq('id', id).single().then(({ data }) => {
      if (data) {
        setForm({
          village: data.village ?? '',
          organizer: data.organizer ?? '',
          organizer_phone: data.organizer_phone ?? '',
          organizer_email: data.organizer_email ?? '',
          location: data.location ?? '',
          meeting_date: data.meeting_date ?? '',
          meeting_time: data.meeting_time ? String(data.meeting_time).slice(0, 5) : '',
          description: data.description ?? '',
          fund_purpose: data.fund_purpose ?? '',
          fund_goal: data.fund_goal ? String(data.fund_goal) : '',
          fund_current: data.fund_current ? String(data.fund_current) : '',
          fund_cloudtips_url: data.fund_cloudtips_url ?? '',
          fund_instructions: data.fund_instructions ?? '',
          status: data.status ?? 'upcoming',
        })
      }
      setLoading(false)
    })
  }, [id])

  const handleSave = async () => {
    if (!id || !form.village || !form.meeting_date) return
    setSaving(true)
    const { error } = await supabase.from('meetings').update({
      village: form.village, village_crh: form.village,
      organizer: form.organizer || 'Оргкомитет',
      organizer_phone: form.organizer_phone || null,
      organizer_email: form.organizer_email || null,
      location: form.location || null,
      meeting_date: form.meeting_date,
      meeting_time: form.meeting_time || null,
      description: form.description || null,
      fund_purpose: form.fund_purpose || null,
      fund_goal: form.fund_goal ? +form.fund_goal : null,
      fund_current: form.fund_current ? +form.fund_current : 0,
      fund_cloudtips_url: form.fund_cloudtips_url || null,
      fund_instructions: form.fund_instructions || null,
      status: form.status,
    }).eq('id', id)
    setSaving(false)
    if (!error) { toast.success('Сохранено'); setTimeout(() => navigate(`/meetings/${id}`), 1000) }
    else toast.error('Ошибка сохранения')
  }

  const handleDelete = async () => {
    if (!confirm('Удалить встречу? Это действие необратимо.')) return
    await supabase.from('meetings').delete().eq('id', id!)
    navigate('/village-meetings')
  }

  if (loading) return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="space-y-3">{[...Array(5)].map((_, i) => <div key={i} className="h-14 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
    </div>
  )

  const fields: [keyof typeof form, string, string, string][] = [
    ['village',            'Село / населённый пункт *', 'с. Ускут',                     'text'],
    ['organizer',          'Организатор',                'Совет старейшин',              'text'],
    ['organizer_phone',    'Телефон организатора',       '+7 (978)...',                  'tel'],
    ['organizer_email',    'Email организатора',         'email@example.com',            'email'],
    ['location',           'Место проведения',           'Поляна "Кок-Асан"',            'text'],
    ['meeting_date',       'Дата *',                     '',                             'date'],
    ['meeting_time',       'Время',                      '12:00',                        'time'],
    ['fund_purpose',       'Цель сбора',                 'Реставрация чешме',            'text'],
    ['fund_goal',          'Сумма сбора (₽)',            '500000',                       'number'],
    ['fund_current',       'Уже собрано (₽)',            '0',                            'number'],
    ['fund_cloudtips_url', 'Ссылка CloudTips',           'https://pay.cloudtips.ru/p/...','url'],
  ]

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate(`/meetings/${id}`)} className="flex items-center gap-2 text-gray-600 mb-2">
          <ChevronLeft className="w-5 h-5" /><span>Назад</span>
        </button>
        <h1 className="text-xl font-bold text-gray-800">Редактировать встречу</h1>
      </div>

      <div className="p-4 pb-24 space-y-4">
        {fields.map(([f, label, placeholder, type]) => (
          <div key={f}>
            <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
            <input type={type} value={form[f]} placeholder={placeholder}
              onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
          </div>
        ))}

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Инструкция по взносу</label>
          <textarea value={form.fund_instructions} rows={3}
            onChange={e => setForm(prev => ({ ...prev, fund_instructions: e.target.value }))}
            placeholder="Как перевести деньги и для чего они..."
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
          <textarea value={form.description} rows={4}
            onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">Статус</label>
          <select value={form.status} onChange={e => setForm(prev => ({ ...prev, status: e.target.value }))}
            className="w-full px-4 py-3 border border-gray-200 rounded-xl focus:ring-2 focus:ring-emerald-500 focus:border-transparent">
            <option value="upcoming">Предстоит</option>
            <option value="completed">Завершена</option>
            <option value="cancelled">Отменена</option>
          </select>
        </div>

        <button onClick={handleSave} disabled={!form.village || !form.meeting_date || saving}
          className="w-full bg-emerald-500 text-white font-semibold py-4 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 flex items-center justify-center gap-2">
          <Save className="w-5 h-5" />
          {saving ? 'Сохранение...' : 'Сохранить изменения'}
        </button>

        {profile?.role === 'admin' && (
          <button onClick={handleDelete}
            className="w-full bg-rose-50 text-rose-600 font-medium py-4 rounded-xl hover:bg-rose-100 transition-colors flex items-center justify-center gap-2 border border-rose-200">
            <Trash2 className="w-5 h-5" />Удалить встречу
          </button>
        )}
      </div>
    </div>
  )
}
