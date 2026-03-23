import { useState } from 'react';
import { MapPin, Calendar, Plus, X, Bell, Users } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMeetings } from '../hooks/useMeetings';
import { useAuth } from '../hooks/useAuth';
import { MeetingRow } from '../lib/supabase';

function VillageMeetings() {
  const { user } = useAuth();
  const { meetings, loading, toggleAttend, addMeeting, isGoing } = useMeetings(user?.id ?? null);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showBellModal, setShowBellModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  const [form, setForm] = useState({
    village: '', organizer: '', location: '',
    meeting_date: '', description: '',
  });

  const handleAdd = async () => {
    if (!form.village || !form.meeting_date || !user) return;
    setSubmitting(true);
    await addMeeting({
      village: form.village,
      village_crh: form.village,
      organizer: form.organizer || 'Оргкомитет',
      location: form.location || undefined,
      meeting_date: form.meeting_date,
      description: form.description || undefined,
      status: 'upcoming',
    } as any, user.id);
    setSubmitting(false);
    setShowAddModal(false);
    setForm({ village: '', organizer: '', location: '', meeting_date: '', description: '' });
  };

  const MeetingCard = ({ m }: { m: MeetingRow }) => {
    const going = isGoing(m.id);
    const progress = m.fund_progress ?? (m.fund_goal && m.fund_current != null
      ? Math.round((m.fund_current / m.fund_goal) * 100) : null);

    return (
      <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
        <div className="flex items-start justify-between mb-2">
          <h3 className="font-semibold text-gray-800 flex-1 pr-2">{m.village}</h3>
          <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded whitespace-nowrap">
            {format(new Date(m.meeting_date), 'd MMMM', { locale: ru })}
          </span>
        </div>

        <p className="text-sm text-gray-500 mb-2">Организатор: {m.organizer}</p>

        {m.location && (
          <div className="flex items-center gap-1 text-rose-500 text-sm mb-2">
            <MapPin className="w-4 h-4 flex-shrink-0" />
            <span>{m.location}</span>
          </div>
        )}

        {m.description && <p className="text-sm text-gray-600 mb-3">{m.description}</p>}

        {progress != null && (
          <div className="mb-3">
            <div className="flex items-center justify-between text-sm mb-1">
              <span className="text-gray-600">{m.fund_purpose}</span>
              <span className="font-semibold text-emerald-600">{progress}%</span>
            </div>
            <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
              <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
            </div>
          </div>
        )}

        <div className="flex items-center gap-3">
          <button
            onClick={() => user ? toggleAttend(m.id) : undefined}
            className={`flex-1 py-3 rounded-lg font-semibold transition-colors flex items-center justify-center gap-2 ${
              going
                ? 'bg-emerald-500 text-white'
                : user
                ? 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                : 'bg-gray-100 text-gray-400 cursor-default'
            }`}
          >
            <Users className="w-4 h-4" />
            {going ? 'Вы идёте' : 'Я ПОЕДУ'} ({m.attendees_count ?? 0} чел)
          </button>
          {!m.meeting_time && (
            <button onClick={() => setShowBellModal(m.id)}
              className="p-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50">
              <Bell className="w-5 h-5" />
            </button>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Встречи сел</h1>
            <p className="text-sm text-gray-500">События и мероприятия</p>
          </div>
          {user && (
            <button onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium">
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          )}
        </div>
      </div>

      <div className="p-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Предстоящие встречи</h2>
        {loading ? (
          <div className="space-y-4">{[...Array(2)].map((_, i) => <div key={i} className="h-48 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
        ) : meetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет предстоящих встреч</p>
          </div>
        ) : (
          <div className="space-y-4">
            {meetings.map(m => <MeetingCard key={m.id} m={m} />)}
          </div>
        )}

        {!user && (
          <div className="mt-4 bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700">Войдите в аккаунт, чтобы отметить участие или добавить встречу.</p>
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Новая встреча</h2>
              <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>
            <div className="space-y-4">
              {[
                ['village', 'Село / населённый пункт', 'с. Ускут', 'text'],
                ['organizer', 'Организатор', 'Совет старейшин', 'text'],
                ['location', 'Место проведения', 'Поляна "Кок-Асан"', 'text'],
                ['meeting_date', 'Дата', '', 'date'],
              ].map(([field, label, placeholder, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(form as any)[field]}
                    onChange={e => setForm({ ...form, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea value={form.description} rows={3}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  placeholder="Описание мероприятия"
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

      {/* Bell Modal */}
      {showBellModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowBellModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Уведомление о дате</h2>
            <p className="text-gray-600 text-center mb-6">
              Вы получите уведомление, когда будет объявлена точная дата и время встречи.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowBellModal(null)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium">Отмена</button>
              <button onClick={() => setShowBellModal(null)} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600">Подписаться</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VillageMeetings;
