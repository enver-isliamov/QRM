import { useState } from 'react';
import { useState } from 'react';
import { MapPin, Calendar, Plus, X, Bell } from 'lucide-react';
import { useStore } from '../store/useStore';
import { VillageMeeting } from '../types';
import { format } from 'date-fns';

function VillageMeetings() {
  const { meetings, toggleMeetingAttendance, addMeeting, isAuthenticated } = useStore();
  const [showAddModal, setShowAddModal] = useState(false);
  const [showSubscribeModal, setShowSubscribeModal] = useState<string | null>(null);
  
  const [newMeeting, setNewMeeting] = useState<Partial<VillageMeeting>>({
    village: '',
    organizer: '',
    location: '',
    date: '',
    description: ''
  });
  
  const upcomingMeetings = meetings.filter(m => m.status === 'upcoming');
  
  const handleAddMeeting = () => {
    if (!newMeeting.village || !newMeeting.date) return;
    
    const meeting: VillageMeeting = {
      id: Date.now().toString(),
      village: newMeeting.village,
      villageCrh: newMeeting.village,
      organizer: newMeeting.organizer || 'Оргкомитет',
      location: newMeeting.location || '',
      date: newMeeting.date,
      description: newMeeting.description || '',
      attendees: 0,
      isUserGoing: false,
      status: 'upcoming'
    };
    
    addMeeting(meeting);
    setShowAddModal(false);
    setNewMeeting({
      village: '',
      organizer: '',
      location: '',
      date: '',
      description: ''
    });
  };
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">Встречи сел</h1>
            <p className="text-sm text-gray-500">События и мероприятия</p>
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
      
      {/* Meetings List */}
      <div className="p-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Предстоящие встречи</h2>
        
        {upcomingMeetings.length === 0 ? (
          <div className="text-center py-12">
            <Calendar className="w-12 h-12 text-gray-300 mx-auto mb-3" />
            <p className="text-gray-500">Нет предстоящих встреч</p>
          </div>
        ) : (
          <div className="space-y-4">
            {upcomingMeetings.map((meeting) => (
              <div key={meeting.id} className="bg-white rounded-xl p-4 shadow-sm border border-gray-100">
                <div className="flex items-start justify-between mb-2">
                  <h3 className="font-semibold text-gray-800">{meeting.village}</h3>
                  <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded">
                    {format(new Date(meeting.date), 'd MMMM', { locale: ru })}
                  </span>
                </div>
                
                <p className="text-sm text-gray-500 mb-2">Организатор: {meeting.organizer}</p>
                
                {meeting.location && (
                  <div className="flex items-center gap-1 text-rose-500 text-sm mb-2">
                    <MapPin className="w-4 h-4" />
                    <span>{meeting.location}</span>
                  </div>
                )}
                
                <p className="text-sm text-gray-600 mb-3">{meeting.description}</p>
                
                {meeting.fundProgress && (
                  <div className="mb-3">
                    <div className="flex items-center justify-between text-sm mb-1">
                      <span className="text-gray-600">{meeting.fundPurpose}</span>
                      <span className="font-semibold text-emerald-600">{meeting.fundProgress}%</span>
                    </div>
                    <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all"
                        style={{ width: `${meeting.fundProgress}%` }}
                      />
                    </div>
                  </div>
                )}
                
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => toggleMeetingAttendance(meeting.id)}
                    className={`flex-1 py-3 rounded-lg font-semibold transition-colors ${
                      meeting.isUserGoing
                        ? 'bg-emerald-500 text-white'
                        : 'bg-emerald-100 text-emerald-700 hover:bg-emerald-200'
                    }`}
                  >
                    {meeting.isUserGoing ? 'Вы идете' : 'Я ПОЕДУ'} ({meeting.attendees} чел)
                  </button>
                  
                  {!meeting.time && (
                    <button
                      onClick={() => setShowSubscribeModal(meeting.id)}
                      className="p-3 border border-gray-200 rounded-lg text-gray-600 hover:bg-gray-50"
                    >
                      <Bell className="w-5 h-5" />
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
      
      {/* Add Meeting Modal */}
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
              <h2 className="text-xl font-bold text-gray-800">Новая встреча</h2>
              <button onClick={() => setShowAddModal(false)}>
                <X className="w-6 h-6 text-gray-400" />
              </button>
            </div>
            
            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Село/Населенный пункт</label>
                <input
                  type="text"
                  value={newMeeting.village}
                  onChange={(e) => setNewMeeting({ ...newMeeting, village: e.target.value })}
                  placeholder="Например: с. Ускут"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Организатор</label>
                <input
                  type="text"
                  value={newMeeting.organizer}
                  onChange={(e) => setNewMeeting({ ...newMeeting, organizer: e.target.value })}
                  placeholder="Например: Совет старейшин"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Место проведения</label>
                <input
                  type="text"
                  value={newMeeting.location}
                  onChange={(e) => setNewMeeting({ ...newMeeting, location: e.target.value })}
                  placeholder="Например: Поляна 'Кок-Асан'"
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Дата</label>
                <input
                  type="date"
                  value={newMeeting.date}
                  onChange={(e) => setNewMeeting({ ...newMeeting, date: e.target.value })}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent"
                />
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Описание</label>
                <textarea
                  value={newMeeting.description}
                  onChange={(e) => setNewMeeting({ ...newMeeting, description: e.target.value })}
                  placeholder="Описание мероприятия"
                  rows={3}
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-emerald-500 focus:border-transparent resize-none"
                />
              </div>
              
              <button
                onClick={handleAddMeeting}
                disabled={!newMeeting.village || !newMeeting.date}
                className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors disabled:bg-gray-300 disabled:cursor-not-allowed"
              >
                Создать встречу
              </button>
            </div>
          </div>
        </div>
      )}
      
      {/* Subscribe Modal */}
      {showSubscribeModal && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setShowSubscribeModal(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Bell className="w-6 h-6 text-emerald-600" />
            </div>
            <h2 className="text-xl font-bold text-gray-800 text-center mb-2">Подписаться на уведомления</h2>
            <p className="text-gray-600 text-center mb-6">
              Вы получите уведомление, когда будет объявлена точная дата и время встречи
            </p>
            
            <div className="flex gap-3">
              <button
                onClick={() => setShowSubscribeModal(null)}
                className="flex-1 py-3 border border-gray-200 rounded-xl text-gray-600 font-medium"
              >
                Отмена
              </button>
              <button
                onClick={() => setShowSubscribeModal(null)}
                className="flex-1 bg-emerald-500 text-white py-3 rounded-xl font-medium hover:bg-emerald-600"
              >
                Подписаться
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default VillageMeetings;
