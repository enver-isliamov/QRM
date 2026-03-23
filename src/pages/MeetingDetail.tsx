import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ChevronLeft, MapPin, Calendar, Users, Bell, BellOff, Heart, ExternalLink, Phone, Mail, Check, Edit, Copy } from 'lucide-react';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useMeetingDetail, useMeetings } from '../hooks/useMeetings';
import { useAuth } from '../hooks/useAuth';

function MeetingDetail() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user, profile } = useAuth();
  const { meeting, participants, loading } = useMeetingDetail(id);
  const { toggleAttend, toggleSubscribe, updateMeeting, isGoing, isSubscribed } = useMeetings(user?.id);
  const [copied, setCopied] = useState(false);
  const [editingFund, setEditingFund] = useState(false);
  const [fundForm, setFundForm] = useState({ fund_current: 0, fund_cloudtips_url: '', fund_instructions: '' });

  const going = id ? isGoing(id) : false;
  const subscribed = id ? isSubscribed(id) : false;
  const isOrganizer = user && meeting && meeting.author_id === user.id;
  const isAdmin = profile?.role === 'admin';
  const canEdit = isOrganizer || isAdmin;

  const handleCopyFundLink = () => {
    if (!meeting?.fund_cloudtips_url) return;
    navigator.clipboard.writeText(meeting.fund_cloudtips_url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSaveFund = async () => {
    if (!id) return;
    await updateMeeting(id, {
      fund_current: fundForm.fund_current,
      fund_cloudtips_url: fundForm.fund_cloudtips_url || undefined,
      fund_instructions: fundForm.fund_instructions || undefined,
    });
    setEditingFund(false);
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-4">
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />)}
        </div>
      </div>
    );
  }

  if (!meeting) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <h2 className="text-xl font-semibold text-gray-600 mb-4">Встреча не найдена</h2>
          <button onClick={() => navigate('/village-meetings')} className="text-emerald-600 font-medium">← К списку встреч</button>
        </div>
      </div>
    );
  }

  const progress = meeting.fund_progress ?? (meeting.fund_goal && meeting.fund_current != null
    ? Math.round((meeting.fund_current / meeting.fund_goal) * 100) : null);

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <button onClick={() => navigate('/village-meetings')} className="flex items-center gap-2 text-gray-600 mb-2">
          <ChevronLeft className="w-5 h-5" /><span>Назад</span>
        </button>
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">{meeting.village}</h1>
            <p className="text-sm text-gray-500">Организатор: {meeting.organizer}</p>
          </div>
          {canEdit && (
            <button onClick={() => navigate(`/meetings/${id}/edit`)}
              className="flex items-center gap-1 text-sm text-emerald-600 border border-emerald-200 rounded-lg px-3 py-1.5 hover:bg-emerald-50">
              <Edit className="w-4 h-4" /><span>Изменить</span>
            </button>
          )}
        </div>
      </div>

      <div className="p-4 space-y-4 pb-24">
        {/* Date & Location */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 space-y-3">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-amber-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <Calendar className="w-5 h-5 text-amber-600" />
            </div>
            <div>
              <p className="font-semibold text-gray-800">
                {format(new Date(meeting.meeting_date), 'd MMMM yyyy', { locale: ru })}
                {meeting.meeting_time && <span className="text-emerald-600 ml-2">в {(meeting.meeting_time as string).slice(0,5)}</span>}
              </p>
              {!meeting.meeting_time && <p className="text-sm text-amber-600">Точное время уточняется</p>}
            </div>
          </div>
          {meeting.location && (
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <MapPin className="w-5 h-5 text-rose-500" />
              </div>
              <p className="text-gray-700">{meeting.location}</p>
            </div>
          )}
        </div>

        {/* Description */}
        {meeting.description && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-2">О встрече</h3>
            <p className="text-gray-600 text-sm leading-relaxed">{meeting.description}</p>
          </div>
        )}

        {/* Organizer contacts */}
        {(meeting.organizer_phone || meeting.organizer_email) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <h3 className="font-semibold text-gray-800 mb-3">Контакты организатора</h3>
            {meeting.organizer_phone && (
              <a href={`tel:${meeting.organizer_phone}`}
                className="flex items-center gap-3 py-2 text-emerald-700 hover:underline">
                <Phone className="w-4 h-4" /><span>{meeting.organizer_phone}</span>
              </a>
            )}
            {meeting.organizer_email && (
              <a href={`mailto:${meeting.organizer_email}`}
                className="flex items-center gap-3 py-2 text-emerald-700 hover:underline">
                <Mail className="w-4 h-4" /><span>{meeting.organizer_email}</span>
              </a>
            )}
          </div>
        )}

        {/* Fund Collection */}
        {(meeting.fund_goal || canEdit) && (
          <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-gray-800 flex items-center gap-2">
                <Heart className="w-4 h-4 text-rose-500" />
                {meeting.fund_purpose || 'Сбор средств'}
              </h3>
              {canEdit && (
                <button onClick={() => {
                  setFundForm({ fund_current: meeting.fund_current ?? 0, fund_cloudtips_url: meeting.fund_cloudtips_url ?? '', fund_instructions: meeting.fund_instructions ?? '' });
                  setEditingFund(true);
                }} className="text-sm text-emerald-600 hover:underline">Обновить</button>
              )}
            </div>

            {meeting.fund_goal && (
              <>
                <div className="flex items-center justify-between text-sm mb-2">
                  <span className="text-gray-500">Собрано {meeting.fund_current?.toLocaleString('ru') ?? 0} из {meeting.fund_goal?.toLocaleString('ru')} ₽</span>
                  <span className="font-bold text-emerald-600">{progress ?? 0}%</span>
                </div>
                <div className="h-3 bg-gray-100 rounded-full overflow-hidden mb-4">
                  <div className="h-full bg-emerald-500 rounded-full transition-all" style={{ width: `${Math.min(progress ?? 0, 100)}%` }} />
                </div>
              </>
            )}

            {meeting.fund_instructions && (
              <p className="text-sm text-gray-600 mb-3 bg-emerald-50 rounded-lg p-3">{meeting.fund_instructions}</p>
            )}

            {meeting.fund_cloudtips_url ? (
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <input readOnly value={meeting.fund_cloudtips_url}
                    className="flex-1 px-3 py-2 border border-gray-200 rounded-lg text-sm bg-gray-50" />
                  <button onClick={handleCopyFundLink} className="p-2 border border-gray-200 rounded-lg hover:bg-gray-50">
                    {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4 text-gray-400" />}
                  </button>
                </div>
                <a href={meeting.fund_cloudtips_url} target="_blank" rel="noreferrer"
                  className="flex items-center justify-center gap-2 w-full bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600 transition-colors">
                  <Heart className="w-4 h-4" />
                  Внести вклад
                  <ExternalLink className="w-4 h-4" />
                </a>
              </div>
            ) : canEdit ? (
              <p className="text-sm text-gray-400 text-center py-2">Добавьте ссылку на сбор средств (CloudTips)</p>
            ) : null}
          </div>
        )}

        {/* Participants */}
        <div className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4 text-gray-500" />
            <h3 className="font-semibold text-gray-800">
              Участники ({meeting.attendees_count ?? 0})
              {(meeting as any).subscribers_count > 0 && (
                <span className="text-sm text-gray-400 ml-2">· {(meeting as any).subscribers_count} подписчиков</span>
              )}
            </h3>
          </div>
          {participants.length > 0 ? (
            <div className="flex flex-wrap gap-2">
              {participants.map(p => (
                <div key={p.id} className="flex items-center gap-1.5 bg-gray-50 rounded-full px-3 py-1">
                  {p.avatar_url
                    ? <img src={p.avatar_url} className="w-5 h-5 rounded-full object-cover" alt="" />
                    : <div className="w-5 h-5 bg-emerald-200 rounded-full flex items-center justify-center text-xs text-emerald-700">{p.name?.[0]?.toUpperCase()}</div>
                  }
                  <span className="text-sm text-gray-700">{p.name}</span>
                </div>
              ))}
              {(meeting.attendees_count ?? 0) > 20 && (
                <span className="text-sm text-gray-400 self-center">+{(meeting.attendees_count ?? 0) - 20} ещё</span>
              )}
            </div>
          ) : (
            <p className="text-sm text-gray-400">Пока никто не отметился. Будь первым!</p>
          )}
        </div>
      </div>

      {/* Bottom action bar */}
      <div className="fixed bottom-16 left-0 right-0 bg-white border-t border-gray-100 px-4 py-3 shadow-lg">
        <div className="max-w-md mx-auto flex gap-3">
          {user && (
            <button onClick={() => id && toggleSubscribe(id)}
              className={`p-3 rounded-xl border transition-colors ${
                subscribed ? 'bg-amber-50 border-amber-300 text-amber-600' : 'border-gray-200 text-gray-500 hover:bg-gray-50'
              }`}
              title={subscribed ? 'Отписаться от уведомлений' : 'Получать уведомления'}>
              {subscribed ? <Bell className="w-5 h-5" /> : <BellOff className="w-5 h-5" />}
            </button>
          )}
          <button
            onClick={() => user ? (id && toggleAttend(id)) : navigate('/login')}
            className={`flex-1 py-3 rounded-xl font-semibold transition-colors flex items-center justify-center gap-2 ${
              going ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
            }`}>
            {going ? <><Check className="w-4 h-4" /> Вы идёте</> : 'Я ПОЕДУ'}
          </button>
        </div>
      </div>

      {/* Edit fund modal */}
      {editingFund && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setEditingFund(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Обновить сбор средств</h2>
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Собрано (₽)</label>
                <input type="number" value={fundForm.fund_current}
                  onChange={e => setFundForm(f => ({ ...f, fund_current: +e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Ссылка CloudTips</label>
                <input type="url" value={fundForm.fund_cloudtips_url} placeholder="https://pay.cloudtips.ru/p/..."
                  onChange={e => setFundForm(f => ({ ...f, fund_cloudtips_url: e.target.value }))}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Инструкция для участников</label>
                <textarea value={fundForm.fund_instructions} rows={3}
                  onChange={e => setFundForm(f => ({ ...f, fund_instructions: e.target.value }))}
                  placeholder="Как перевести деньги и для чего они нужны..."
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>
              <div className="flex gap-3">
                <button onClick={() => setEditingFund(false)} className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600">Отмена</button>
                <button onClick={handleSaveFund} className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600">Сохранить</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MeetingDetail;
