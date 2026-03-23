import { useState } from 'react';
import { Heart, Phone, MapPin, AlertCircle, Plus, X, Droplets, Banknote, HelpCircle } from 'lucide-react';
import { format } from 'date-fns';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useAuth } from '../hooks/useAuth';
import { HelpRequestRow } from '../lib/supabase';

type NewReq = {
  type: 'blood' | 'money' | 'other';
  urgency: 'urgent' | 'normal';
  title: string;
  location: string;
  description: string;
  contact_phone: string;
};

function MicroYardym() {
  const { user } = useAuth();
  const { urgent, normal, loading, addRequest, respond } = useHelpRequests();

  const [showAddModal, setShowAddModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const [responded, setResponded] = useState<Set<string>>(new Set());

  const [newReq, setNewReq] = useState<NewReq>({
    type: 'other', urgency: 'normal',
    title: '', location: '', description: '', contact_phone: '',
  });

  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood':  return <Droplets className="w-5 h-5" />;
      case 'money':  return <Banknote className="w-5 h-5" />;
      default:       return <HelpCircle className="w-5 h-5" />;
    }
  };

  const handleAdd = async () => {
    if (!newReq.title || !newReq.location || !newReq.description) return;
    setSubmitting(true);
    await addRequest({ ...newReq, status: 'active' }, user?.id);
    setSubmitting(false);
    setShowAddModal(false);
    setNewReq({ type: 'other', urgency: 'normal', title: '', location: '', description: '', contact_phone: '' });
  };

  const handleRespond = async (requestId: string) => {
    await respond(requestId, user?.id);
    setResponded(prev => new Set([...prev, requestId]));
    setShowResponseModal(null);
  };

  const RequestCard = ({ request, isUrgent }: { request: HelpRequestRow; isUrgent?: boolean }) => (
    <div className={`rounded-xl p-4 border ${isUrgent ? 'bg-rose-50 border-rose-200' : 'bg-white border-gray-100 shadow-sm'}`}>
      <div className="flex items-start justify-between mb-2">
        {isUrgent ? (
          <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
            <AlertCircle className="w-3 h-3" />
            {request.title}
          </span>
        ) : (
          <div className="flex items-center gap-2">
            <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
              {getTypeIcon(request.type)}
            </div>
            <span className="font-medium text-gray-800">{request.title}</span>
          </div>
        )}
        <span className="text-xs text-gray-500">
          {format(new Date(request.created_at), 'dd.MM HH:mm')}
        </span>
      </div>

      <div className="flex items-center gap-1 text-gray-600 mb-1">
        <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
        <span className="text-sm">{request.location}</span>
      </div>
      <p className="text-sm text-gray-600 mb-3">{request.description}</p>

      {request.contact_phone && (
        <a href={`tel:${request.contact_phone}`} className="flex items-center gap-1 text-emerald-700 mb-3 hover:underline">
          <Phone className="w-4 h-4" />
          <span className="text-sm font-medium">{request.contact_phone}</span>
        </a>
      )}

      {!isUrgent && (
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-gray-500">Откликов: {request.responses_count ?? 0}</span>
        </div>
      )}

      <button
        onClick={() => setShowResponseModal(request.id)}
        disabled={responded.has(request.id)}
        className={`w-full font-semibold py-3 rounded-lg transition-colors ${
          isUrgent
            ? responded.has(request.id)
              ? 'bg-gray-200 text-gray-500 cursor-default'
              : 'bg-rose-500 text-white hover:bg-rose-600'
            : responded.has(request.id)
              ? 'bg-gray-100 text-gray-400 cursor-default'
              : 'bg-emerald-500 text-white hover:bg-emerald-600'
        }`}
      >
        {responded.has(request.id) ? '✓ Вы откликнулись' : isUrgent ? 'Я МОГУ ПОМОЧЬ' : 'Откликнуться'}
      </button>
    </div>
  );

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Микро-Ярдым</h1>
            <p className="text-sm text-gray-500">Взаимопомощь сообщества</p>
          </div>
          <button
            onClick={() => user ? setShowAddModal(true) : undefined}
            className={`flex items-center gap-1 px-3 py-2 rounded-lg text-sm font-medium ${
              user ? 'bg-emerald-500 text-white' : 'bg-gray-100 text-gray-400'
            }`}
          >
            <Plus className="w-4 h-4" />
            Добавить
          </button>
        </div>
      </div>

      {/* Urgent */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Нужна помощь прямо сейчас</h2>
        {loading ? (
          <div className="h-32 bg-white rounded-xl animate-pulse border border-gray-100" />
        ) : urgent.length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-700">Сейчас нет срочных обращений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {urgent.map(r => <RequestCard key={r.id} request={r} isUrgent />)}
          </div>
        )}
      </div>

      {/* Normal */}
      <div className="px-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Все обращения</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(2)].map((_, i) => <div key={i} className="h-24 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
        ) : normal.length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет активных обращений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {normal.map(r => <RequestCard key={r.id} request={r} />)}
          </div>
        )}
      </div>

      {/* Add Modal */}
      {showAddModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowAddModal(false)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Новое обращение</h2>
              <button onClick={() => setShowAddModal(false)}><X className="w-6 h-6 text-gray-400" /></button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип помощи</label>
                <div className="flex gap-2">
                  {([['blood', 'Кровь', Droplets], ['money', 'Финансы', Banknote], ['other', 'Другое', HelpCircle]] as const).map(([v, l, Icon]) => (
                    <button key={v} onClick={() => setNewReq({ ...newReq, type: v })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${
                        newReq.type === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'
                      }`}>
                      <Icon className="w-4 h-4" /><span className="text-sm">{l}</span>
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Срочность</label>
                <div className="flex gap-2">
                  {([['urgent', 'Срочно'], ['normal', 'Обычно']] as const).map(([v, l]) => (
                    <button key={v} onClick={() => setNewReq({ ...newReq, urgency: v })}
                      className={`flex-1 py-2 rounded-lg border ${
                        newReq.urgency === v ? 'border-emerald-500 bg-emerald-50 text-emerald-700' : 'border-gray-200 text-gray-600'
                      }`}>{l}</button>
                  ))}
                </div>
              </div>

              {[
                ['title', 'Заголовок', 'Например: Нужна кровь 4+', 'text'],
                ['location', 'Место', 'Город, адрес', 'text'],
                ['contact_phone', 'Телефон', '+7 (___) ___-__-__', 'tel'],
              ].map(([field, label, placeholder, type]) => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1">{label}</label>
                  <input type={type} value={(newReq as any)[field]}
                    onChange={e => setNewReq({ ...newReq, [field]: e.target.value })}
                    placeholder={placeholder}
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent" />
                </div>
              ))}

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea value={newReq.description} rows={3}
                  onChange={e => setNewReq({ ...newReq, description: e.target.value })}
                  placeholder="Подробное описание ситуации"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none" />
              </div>

              <button onClick={handleAdd} disabled={!newReq.title || !newReq.location || !newReq.description || submitting}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed">
                {submitting ? 'Публикация...' : 'Опубликовать'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Respond Modal */}
      {showResponseModal && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay" onClick={() => setShowResponseModal(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <h2 className="text-xl font-bold text-gray-800 mb-4">Вы готовы помочь?</h2>
            <p className="text-gray-600 mb-6">
              Нажимая «Подтвердить», вы подтверждаете готовность оказать помощь.
              Организатор свяжется с вами для уточнения деталей.
            </p>
            <div className="flex gap-3">
              <button onClick={() => setShowResponseModal(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium">
                Отмена
              </button>
              <button onClick={() => handleRespond(showResponseModal)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600">
                Подтвердить
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default MicroYardym;
