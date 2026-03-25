import { useState } from 'react';
import { MapPin, Calendar, Plus, X, Bell, Users, ChevronRight } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useNavigate } from 'react-router-dom';
import { useMeetings } from '../hooks/useMeetings';
import { useAuth } from '../hooks/useAuth';
import { MeetingRow } from '../lib/supabase';

function VillageMeetings() {
  const navigate = useNavigate();
  const { user } = useAuth();
  const { meetings, loading, toggleAttend, toggleSubscribe, addMeeting, isGoing, isSubscribed } = useMeetings(user?.id ?? null);
  const [showAdd, setShowAdd] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({ village: '', organizer: '', location: '', meeting_date: '', description: '', organizer_phone: '', fund_purpose: '', fund_goal: '' });

  const handleAdd = async () => {
    if (!form.village || !form.meeting_date || !user) return;
    setSubmitting(true);
    await addMeeting({
      village: form.village, village_crh: form.village,
      organizer: form.organizer || 'Оргкомитет',
      location: form.location || undefined,
      meeting_date: form.meeting_date,
      description: form.description || undefined,
      organizer_phone: form.organizer_phone || undefined,
      fund_purpose: form.fund_purpose || undefined,
      fund_goal: form.fund_goal ? +form.fund_goal : undefined,
      status: 'upcoming',
    } as any, user.id);
    setSubmitting(false);
    setShowAdd(false);
    setForm({ village: '', organizer: '', location: '', meeting_date: '', description: '', organizer_phone: '', fund_purpose: '', fund_goal: '' });
  };

  const MeetingCard = ({ m }: { m: MeetingRow }) => {
    const going = isGoing(m.id);
    const subbed = isSubscribed(m.id);
    const progress = m.fund_progress ?? (m.fund_goal && m.fund_current != null ? Math.round((m.fund_current / m.fund_goal) * 100) : null);

    return (
      <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Card header - clickable to detail */}
        <button onClick={() => navigate(`/meetings/${m.id}`)} className="w-full text-left p-4 hover:bg-gray-50 transition-colors">
          <div className="flex items-start justify-between mb-2">
            <h3 className="font-semibold text-gray-800 flex-1 pr-2">{m.village}</h3>
            <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
              {format(new Date(m.meeting_date), 'd MMMM', { locale: ru })}
            </span>
          </div>
          <p className="text-sm text-gray-500 mb-1">Организатор: {m.organizer}</p>
          {m.location && (
            <div className="flex items-center gap-1 text-rose-500 text-sm mb-1">
              <MapPin className="w-3.5 h-3.5 flex-shrink-0" /><span>{m.location}</span>
            </div>
          )}
          {m.description && <p className="text-sm text-gray-500 line-clamp-2">{m.description}</p>}
          {progress != null && (
            <div className="mt-2">
              <div className="flex items-center justify-between text-xs mb-1">
                <span className="text-gray-500">{m.fund_purpose}</span>
                <span className="font-semibold text-emerald-600">{progress}%</span>
              </div>
              <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          <div className="flex items-center gap-2 mt-2 text-xs text-gray-400">
            <Users className="w-3.5 h-3.5" /><span>{m.attendees_count ?? 0} участников</span>
            <ChevronRight className="w-3.5 h-3.5 ml-auto" />
          </div>
        </button>

        {/* Action bar */}
        <div className="px-4 pb-4 flex gap-2">
          {!m.meeting_time && user && (
            <button onClick={() => toggleSubscribe(m.id)}
              title={subbed ? 'Отписаться от уведомлений' : 'Подписаться на уведомления'}
              className={`p-2.5 rounded-lg border transition-colors ${subbed ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-200 text-gray-400 hover:bg-gray-50'}`}>
              <Bell className="w-4 h-4" />
            </button>
          )}
          <button
            onClick={() => user ? toggleAttend(m.id) : navigate('/login')}
            className={`flex-1 py-2.5 rounded-lg font-semibold text-sm transition-colors ${
              going ? 'bg-emerald-500 text-white' : user ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200' : 'bg-gray-100 text-gray-400'
            }`}>
            {going ? '✓ Вы идёте' : 'Я ПОЕДУ'}
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Встречи сёл</h1>
            <p className="text-sm text-gray-500">События и мероприятия</p>
          </div>
          {user && (
            <button onClick={() => setShowAdd(true)} className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />Добавить
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pb-24">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Предстоящие встречи</h2>
        {loading ? (
          <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-200 mx-auto mb-3" />
            <p className="text-gray-400">Нет предстоящих встреч</p>
          </div>
        ) : (
          <div className="space-y-4">{meetings.map(m => <MeetingCard key={m.id} m={m} />)}</div>
        )}

        {!user && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700">Войдите, чтобы записаться на встречу и получать уведомления.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowAdd(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Новая встреча</h2>
              <button onClick={() => setShowAdd(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {[
                ['village', 'Село / населённый пункт *', 'с. Ускут', 'text'],
                ['organizer', 'Организатор', 'Совет старейшин', 'text'],
                ['organizer_phone', 'Телефон организатора', '+7 (978) ...', 'tel'],
                ['location', 'Место проведения', 'Поляна "Кок-Асан"', 'text'],
                ['meeting_date', 'Дата *', '', 'date'],
                ['fund_purpose', 'Цель сбора (если есть)', 'Реставрация чешме', 'text'],
                ['fund_goal', 'Сумма сбора (₽)', '500000', 'number'],
              ].map(([f, l, ph, t]) => (
                <div key={f}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{l}</label>
                  <input type={t} value={(form as any)[f]} placeholder={ph}
                    onChange={e => setForm(prev => ({ ...prev, [f]: e.target.value }))}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea value={form.description} rows={3}
                  onChange={e => setForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <button onClick={handleAdd} disabled={!form.village || !form.meeting_date || submitting}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                {submitting ? 'Создание...' : 'Создать встречу'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VillageMeetings;
