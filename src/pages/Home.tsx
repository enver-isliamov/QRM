import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, Users, Heart, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useStore } from '../store/useStore';
import { getUpcomingEvents } from '../data/ethnoCalendar';
import { getTodayPrayers, prayerNames } from '../data/prayerTimes';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function Home() {
  const navigate = useNavigate();
  const { helpRequests, meetings } = useStore();
  
  const upcomingEvents = getUpcomingEvents(1);
  const todayPrayers = getTodayPrayers();
  const urgentHelp = helpRequests.find(h => h.urgency === 'urgent' && h.status === 'active');
  const upcomingMeeting = meetings.find(m => m.status === 'upcoming');
  
  const tabs = [
    { 
      id: 'meetings', 
      label: 'Встречи сел', 
      labelCrh: 'Кой вакъиалары',
      active: false 
    },
    { 
      id: 'yardym', 
      label: 'Микро-Ярдым', 
      labelCrh: 'Микро-Ярдым',
      active: false 
    },
    { 
      id: 'rituals', 
      label: 'Обрядовый гид', 
      labelCrh: 'Мерасимлер къулланмасы',
      active: false 
    },
    { 
      id: 'calendar', 
      label: 'Этно-календарь', 
      labelCrh: 'Этно-къалендарь',
      active: true 
    },
  ];
  
  return (
    <div className="animate-fade-in">
      {/* Top Navigation Tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => {
                if (tab.id === 'rituals') navigate('/rituals');
                if (tab.id === 'calendar') navigate('/ethno-calendar');
                if (tab.id === 'yardym') navigate('/micro-yardym');
                if (tab.id === 'meetings') navigate('/village-meetings');
              }}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab.active 
                  ? 'border-emerald-500 text-emerald-600' 
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>
      
      {/* Prayer Times Card */}
      <div className="p-4">
        <div 
          onClick={() => navigate('/prayer-times')}
          className="prayer-card-gradient rounded-2xl p-4 text-white shadow-lg cursor-pointer touch-feedback"
        >
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Время намаза</span>
            </div>
            <span className="text-sm opacity-80">
              {format(new Date(), 'd MMMM', { locale: ru })}
            </span>
          </div>
          
          {todayPrayers ? (
            <div className="grid grid-cols-3 gap-2">
              {prayerNames.filter(p => p.key !== 'sunrise').slice(0, 3).map((prayer) => (
                <div key={prayer.key} className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-80">{prayer.name}</div>
                  <div className="text-lg font-bold">
                    {todayPrayers[prayer.key as keyof typeof todayPrayers]}
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 opacity-80">
              Нажмите для просмотра расписания
            </div>
          )}
        </div>
      </div>
      
      {/* Significant Dates Section */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Значимые даты</h2>
          <button 
            onClick={() => navigate('/ethno-calendar')}
            className="text-emerald-600 text-sm flex items-center gap-1"
          >
            Все <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        
        {upcomingEvents.map((event) => (
          <div 
            key={event.id}
            onClick={() => navigate('/ethno-calendar')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer touch-feedback"
          >
            <div className="flex items-start gap-4">
              <div className="flex-shrink-0 text-center">
                <div className="text-3xl font-bold text-emerald-600">{event.day}</div>
                <div className="text-xs text-emerald-600 font-medium uppercase">{event.month}</div>
              </div>
              <div className="flex-1">
                <h3 className="font-semibold text-gray-800">{event.title}</h3>
                <p className="text-sm text-gray-500 mt-1">{event.description}</p>
              </div>
            </div>
          </div>
        ))}
      </div>
      
      {/* Quick Actions Grid */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Разделы</h2>
        <div className="grid grid-cols-2 gap-3">
          <button
            onClick={() => navigate('/rituals')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <BookOpen className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Обрядовый гид</h3>
            <p className="text-xs text-gray-500 mt-1">Никях, Дженазе</p>
          </button>
          
          <button
            onClick={() => navigate('/ethno-calendar')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors"
          >
            <div className="w-10 h-10 bg-emerald-100 rounded-lg flex items-center justify-center mb-3">
              <Calendar className="w-5 h-5 text-emerald-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Этно-календарь</h3>
            <p className="text-xs text-gray-500 mt-1">Праздники и даты</p>
          </button>
          
          <button
            onClick={() => navigate('/micro-yardym')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors"
          >
            <div className="w-10 h-10 bg-rose-100 rounded-lg flex items-center justify-center mb-3">
              <Heart className="w-5 h-5 text-rose-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Микро-Ярдым</h3>
            <p className="text-xs text-gray-500 mt-1">Помощь сообществу</p>
          </button>
          
          <button
            onClick={() => navigate('/village-meetings')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors"
          >
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mb-3">
              <Users className="w-5 h-5 text-blue-600" />
            </div>
            <h3 className="font-semibold text-gray-800">Встречи сел</h3>
            <p className="text-xs text-gray-500 mt-1">События в селах</p>
          </button>
        </div>
      </div>
      
      {/* Urgent Help Section */}
      {urgentHelp && (
        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Нужна помощь прямо сейчас</h2>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">
                {urgentHelp.title}
              </span>
              <span className="text-xs text-gray-500">
                {format(new Date(urgentHelp.createdAt), 'HH:mm')}
              </span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{urgentHelp.location}</p>
            <p className="text-sm text-gray-600 mb-3">{urgentHelp.description}</p>
            <button 
              onClick={() => navigate('/micro-yardym')}
              className="w-full bg-rose-500 text-white font-semibold py-3 rounded-lg hover:bg-rose-600 transition-colors"
            >
              Я МОГУ ПОМОЧЬ
            </button>
          </div>
        </div>
      )}
      
      {/* Upcoming Meeting */}
      {upcomingMeeting && (
        <div className="px-4 pb-20">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Предстоящие встречи</h2>
          <div 
            onClick={() => navigate('/village-meetings')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer touch-feedback"
          >
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{upcomingMeeting.village}</h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded">
                {format(new Date(upcomingMeeting.date), 'd MMMM', { locale: ru })}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">Организатор: {upcomingMeeting.organizer}</p>
            <div className="flex items-center gap-1 text-rose-500 text-sm mb-3">
              <MapPin className="w-4 h-4" />
              <span>{upcomingMeeting.location}</span>
            </div>
            
            {upcomingMeeting.fundProgress && (
              <div className="mb-3">
                <div className="flex items-center justify-between text-sm mb-1">
                  <span className="text-gray-600">{upcomingMeeting.fundPurpose}</span>
                  <span className="font-semibold text-emerald-600">{upcomingMeeting.fundProgress}%</span>
                </div>
                <div className="h-2 bg-gray-200 rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-emerald-500 rounded-full"
                    style={{ width: `${upcomingMeeting.fundProgress}%` }}
                  />
                </div>
              </div>
            )}
            
            <button className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-lg hover:bg-emerald-600 transition-colors">
              Я ПОЕДУ ({upcomingMeeting.attendees} чел)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
