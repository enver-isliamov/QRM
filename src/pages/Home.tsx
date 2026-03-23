import { useNavigate } from 'react-router-dom';
import { Calendar, BookOpen, Users, Heart, ChevronRight, Clock, MapPin } from 'lucide-react';
import { useEthnoEvents } from '../hooks/useEthnoEvents';
import { usePrayerTimesForDate } from '../hooks/usePrayerTimes';
import { useHelpRequests } from '../hooks/useHelpRequests';
import { useMeetings } from '../hooks/useMeetings';
import { prayerNames } from '../data/prayerTimes';
import { format } from 'date-fns';
import { ru } from 'date-fns/locale';

function Home() {
  const navigate = useNavigate();
  const { upcoming } = useEthnoEvents();
  const { prayers } = usePrayerTimesForDate(new Date());
  const { urgent } = useHelpRequests();
  const { meetings } = useMeetings();

  const upcomingEvents = upcoming(1);
  const urgentHelp = urgent[0];
  const upcomingMeeting = meetings[0];

  const tabs = [
    { id: 'meetings', label: 'Встречи сел' },
    { id: 'yardym',   label: 'Микро-Ярдым' },
    { id: 'rituals',  label: 'Обрядовый гид' },
    { id: 'calendar', label: 'Этно-календарь', active: true },
  ];

  return (
    <div className="animate-fade-in">
      {/* Top nav tabs */}
      <div className="bg-white border-b border-gray-200">
        <div className="flex overflow-x-auto hide-scrollbar">
          {tabs.map(tab => (
            <button key={tab.id}
              onClick={() => {
                if (tab.id === 'rituals')  navigate('/rituals');
                if (tab.id === 'calendar') navigate('/ethno-calendar');
                if (tab.id === 'yardym')   navigate('/micro-yardym');
                if (tab.id === 'meetings') navigate('/village-meetings');
              }}
              className={`flex-shrink-0 px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors ${
                tab.active ? 'border-emerald-500 text-emerald-600' : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Prayer Card */}
      <div className="p-4">
        <div onClick={() => navigate('/prayer-times')}
          className="prayer-card-gradient rounded-2xl p-4 text-white shadow-lg cursor-pointer touch-feedback">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-5 h-5" />
              <span className="font-medium">Время намаза</span>
            </div>
            <span className="text-sm opacity-80">{format(new Date(), 'd MMMM', { locale: ru })}</span>
          </div>
          {prayers ? (
            <div className="grid grid-cols-3 gap-2">
              {prayerNames.filter(p => p.key !== 'sunrise').slice(0, 3).map(prayer => (
                <div key={prayer.key} className="bg-white/20 rounded-lg p-2 text-center">
                  <div className="text-xs opacity-80">{prayer.name}</div>
                  <div className="text-lg font-bold">{(prayers as any)[prayer.key]}</div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-4 opacity-80">Нажмите для просмотра расписания</div>
          )}
        </div>
      </div>

      {/* Significant Dates */}
      <div className="px-4 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h2 className="text-lg font-bold text-gray-800">Значимые даты</h2>
          <button onClick={() => navigate('/ethno-calendar')} className="text-emerald-600 text-sm flex items-center gap-1">
            Все <ChevronRight className="w-4 h-4" />
          </button>
        </div>
        {upcomingEvents.map(event => {
          const d = new Date(event.event_date);
          return (
            <div key={event.id} onClick={() => navigate('/ethno-calendar')}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer touch-feedback">
              <div className="flex items-start gap-4">
                <div className="flex-shrink-0 text-center">
                  <div className="text-3xl font-bold text-emerald-600">{d.getDate()}</div>
                  <div className="text-xs text-emerald-600 font-medium uppercase">{format(d, 'MMM', { locale: ru })}</div>
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-gray-800">{event.title}</h3>
                  <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="px-4 pb-4">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Разделы</h2>
        <div className="grid grid-cols-2 gap-3">
          {[
            { path: '/rituals',       icon: BookOpen, bg: 'bg-emerald-100', c: 'text-emerald-600', title: 'Обрядовый гид', sub: 'Никях, Дженазе' },
            { path: '/ethno-calendar', icon: Calendar, bg: 'bg-emerald-100', c: 'text-emerald-600', title: 'Этно-календарь', sub: 'Праздники и даты' },
            { path: '/micro-yardym',  icon: Heart,    bg: 'bg-rose-100',    c: 'text-rose-600',    title: 'Микро-Ярдым',   sub: 'Помощь сообществу' },
            { path: '/village-meetings', icon: Users, bg: 'bg-blue-100',    c: 'text-blue-600',    title: 'Встречи сел',   sub: 'События в сёлах' },
          ].map(({ path, icon: Icon, bg, c, title, sub }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors">
              <div className={`w-10 h-10 ${bg} rounded-lg flex items-center justify-center mb-3`}>
                <Icon className={`w-5 h-5 ${c}`} />
              </div>
              <h3 className="font-semibold text-gray-800">{title}</h3>
              <p className="text-xs text-gray-500 mt-1">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Urgent Help */}
      {urgentHelp && (
        <div className="px-4 pb-4">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Нужна помощь прямо сейчас</h2>
          <div className="bg-rose-50 border border-rose-200 rounded-xl p-4">
            <div className="flex items-start justify-between mb-2">
              <span className="bg-rose-500 text-white text-xs font-bold px-2 py-1 rounded">{urgentHelp.title}</span>
              <span className="text-xs text-gray-500">{format(new Date(urgentHelp.created_at), 'HH:mm')}</span>
            </div>
            <p className="text-sm text-gray-700 mb-1">{urgentHelp.location}</p>
            <p className="text-sm text-gray-600 mb-3">{urgentHelp.description}</p>
            <button onClick={() => navigate('/micro-yardym')}
              className="w-full bg-rose-500 text-white font-semibold py-3 rounded-lg hover:bg-rose-600 transition-colors">
              Я МОГУ ПОМОЧЬ
            </button>
          </div>
        </div>
      )}

      {/* Upcoming Meeting */}
      {upcomingMeeting && (
        <div className="px-4 pb-20">
          <h2 className="text-lg font-bold text-gray-800 mb-3">Предстоящие встречи</h2>
          <div onClick={() => navigate('/village-meetings')}
            className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer touch-feedback">
            <div className="flex items-start justify-between mb-2">
              <h3 className="font-semibold text-gray-800">{upcomingMeeting.village}</h3>
              <span className="bg-amber-100 text-amber-700 text-xs font-medium px-2 py-1 rounded">
                {format(new Date(upcomingMeeting.meeting_date), 'd MMMM', { locale: ru })}
              </span>
            </div>
            <p className="text-sm text-gray-500 mb-2">Организатор: {upcomingMeeting.organizer}</p>
            {upcomingMeeting.location && (
              <div className="flex items-center gap-1 text-rose-500 text-sm mb-3">
                <MapPin className="w-4 h-4" />
                <span>{upcomingMeeting.location}</span>
              </div>
            )}
            <button className="w-full bg-emerald-500 text-white font-semibold py-3 rounded-lg hover:bg-emerald-600 transition-colors">
              Я ПОЕДУ ({upcomingMeeting.attendees_count ?? 0} чел)
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default Home;
