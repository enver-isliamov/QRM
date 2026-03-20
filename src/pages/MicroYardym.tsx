import { useState } from 'react';
import { useState } from 'react';
import { Heart, Phone, MapPin, AlertCircle, Plus, X, Droplets, Banknote, HelpCircle } from 'lucide-react';
import { useStore } from '../store/useStore';
import { HelpRequest } from '../types';
import { format } from 'date-fns';

function MicroYardym() {
  const { helpRequests, respondToHelp, addHelpRequest, isAuthenticated } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showResponseModal, setShowResponseModal] = useState<string | null>(null);
  
  const [newRequest, setNewRequest] = useState<Partial<HelpRequest>>({
    type: 'other',
    urgency: 'normal',
    title: '',
    location: '',
    description: '',
    contactPhone: ''
  });
  
  const activeRequests = helpRequests.filter(r => r.status === 'active');
  
  const handleAddRequest = () => {
    if (!newRequest.title || !newRequest.location || !newRequest.description) return;
    
    const request: HelpRequest = {
      id: Date.now().toString(),
      type: newRequest.type as 'blood' | 'money' | 'other',
      urgency: newRequest.urgency as 'urgent' | 'normal',
      title: newRequest.title,
      location: newRequest.location,
      description: newRequest.description,
      contactPhone: newRequest.contactPhone || '',
      createdAt: new Date().toISOString(),
      status: 'active',
      responses: 0
    };
    
    addHelpRequest(request);
    setShowAddModal(false);
    setNewRequest({
      type: 'other',
      urgency: 'normal',
      title: '',
      location: '',
      description: '',
      contactPhone: ''
    });
  };
  
  const getTypeIcon = (type: string) => {
    switch (type) {
      case 'blood': return <Droplets className="w-5 h-5" />;
      case 'money': return <Banknote className="w-5 h-5" />;
      default: return <HelpCircle className="w-5 h-5" />;
    }
  };
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Микро-Ярдым</h1>
            <p className="text-sm text-gray-500">Взаимопомощь сообщества</p>
          </div>
          {isAuthenticated && (
            <button
              onClick={() => setShowAddModal(true)}
              className="flex items-center gap-1 bg-emerald-500 text-white px-3 py-2 rounded-lg text-sm font-medium"
            >
              <Plus className="w-4 h-4" />
              Добавить
            </button>
          )}
        </div>
      </div>
      
      {/* Urgent Section */}
      <div className="p-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Нужна помощь прямо сейчас</h2>
        
        {activeRequests.filter(r => r.urgency === 'urgent').length === 0 ? (
          <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4 text-center">
            <Heart className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
            <p className="text-emerald-700">Сейчас нет срочных обращений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests
              .filter(r => r.urgency === 'urgent')
              .map((request) => (
                <div key={request.id} className="bg-rose-50 border border-rose-200 rounded-xl p-4">
                  <div className="flex items-start justify-between mb-2">
                    <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" />
                      {request.title}
                    </span>
                    <span className="text-xs text-gray-500">
                      {format(new Date(request.createdAt), 'HH:mm')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-700 mb-1">
                    <MapPin className="w-4 h-4 text-rose-500" />
                    <span className="text-sm">{request.location}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                  
                  {request.contactPhone && (
                    <div className="flex items-center gap-1 text-gray-600 mb-3">
                      <Phone className="w-4 h-4" />
                      <span className="text-sm">{request.contactPhone}</span>
                    </div>
                  )}
                  
                  <button 
                    onClick={() => setShowResponseModal(request.id)}
                    className="w-full bg-rose-500 text-white font-semibold py-3 rounded-lg hover:bg-rose-600 transition-colors"
                  >
                    Я МОГУ ПОМОЧЬ
                  </button>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {/* All Requests */}
      <div className="px-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Все обращения</h2>
        
        {activeRequests.filter(r => r.urgency === 'normal').length === 0 ? (
          <div className="text-center py-8">
            <HelpCircle className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет активных обращений</p>
          </div>
        ) : (
          <div className="space-y-3">
            {activeRequests
              .filter(r => r.urgency === 'normal')
              .map((request) => (
                <div key={request.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                  <div className="flex items-start justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <div className="w-8 h-8 bg-emerald-100 rounded-lg flex items-center justify-center text-emerald-600">
                        {getTypeIcon(request.type)}
                      </div>
                      <span className="font-medium text-gray-800">{request.title}</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {format(new Date(request.createdAt), 'dd.MM')}
                    </span>
                  </div>
                  
                  <div className="flex items-center gap-1 text-gray-600 mb-1">
                    <MapPin className="w-4 h-4" />
                    <span className="text-sm">{request.location}</span>
                  </div>
                  
                  <p className="text-sm text-gray-600 mb-3">{request.description}</p>
                  
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-gray-500">
                      Откликов: {request.responses}
                    </span>
                    <button 
                      onClick={() => setShowResponseModal(request.id)}
                      className="bg-emerald-500 text-white px-4 py-2 rounded-lg text-sm font-medium hover:bg-emerald-600 transition-colors"
                    >
                      Откликнуться
                    </button>
                  </div>
                </div>
              ))}
          </div>
        )}
      </div>
      
      {/* Add Request Modal */}
      {showAddModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowAddModal(false)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up max-h-[90vh] overflow-y-auto"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold text-gray-800">Новое обращение</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Тип помощи</label>
                <div className="flex gap-2">
                  {[
                    { value: 'blood', label: 'Кровь', icon: Droplets },
                    { value: 'money', label: 'Финансы', icon: Banknote },
                    { value: 'other', label: 'Другое', icon: HelpCircle }
                  ].map(({ value, label, icon: Icon }) => (
                    <button
                      key={value}
                      onClick={() => setNewRequest({ ...newRequest, type: value as any })}
                      className={`flex-1 flex items-center justify-center gap-2 py-2 rounded-lg border ${
                        newRequest.type === value 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="text-sm">{label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Срочность</label>
                <div className="flex gap-2">
                  {[
                    { value: 'urgent', label: 'Срочно' },
                    { value: 'normal', label: 'Обычно' }
                  ].map(({ value, label }) => (
                    <button
                      key={value}
                      onClick={() => setNewRequest({ ...newRequest, urgency: value as any })}
                      className={`flex-1 py-2 rounded-lg border ${
                        newRequest.urgency === value 
                          ? 'border-emerald-500 bg-emerald-50 text-emerald-700' 
                          : 'border-gray-200 text-gray-600'
                      }`}
                    >
                      {label}
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Заголовок</label>
                <input
                  type="text"
                  value={newRequest.title}
                  onChange={(e) => setNewRequest({ ...newRequest, title: e.target.value })}
                  placeholder="Например: Нужна кровь 4+"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Место</label>
                <input
                  type="text"
                  value={newRequest.location}
                  onChange={(e) => setNewRequest({ ...newRequest, location: e.target.value })}
                  placeholder="Город, адрес"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={newRequest.description}
                  onChange={(e) => setNewRequest({ ...newRequest, description: e.target.value })}
                  placeholder="Подробное описание ситуации"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Телефон для связи</label>
                <input
                  type="tel"
                  value={newRequest.contactPhone}
                  onChange={(e) => setNewRequest({ ...newRequest, contactPhone: e.target.value })}
                  placeholder="+7 (___) ___-__-__"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <button
                onClick={handleAddRequest}
                disabled={!newRequest.title || !newRequest.location || !newRequest.description}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Опубликовать
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Response Modal */}
      {showResponseModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowResponseModal(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <h2 className="text-xl font-bold text-gray-800 mb-4">Вы готовы помочь?</h2>
            <p className="text-gray-600 mb-6">
              Нажимая "Подтвердить", вы подтверждаете свою готовность оказать помощь. 
              Организатор свяжется с вами для уточнения деталей.
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowResponseModal(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                Отмена
              </button>
              <button
                onClick={() => {
                  respondToHelp(showResponseModal);
                  setShowResponseModal(null);
                }}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600"
              >
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
