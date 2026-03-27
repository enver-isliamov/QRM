import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, MapPin, Heart, AlertCircle, Share2, Check } from 'lucide-react'
import { useEthnoEvents } from '../hooks/useEthnoEvents'
import { usePrayerTimesForDate, usePrayerCompletions } from '../hooks/usePrayerTimes'
import { useNextPrayer } from '../hooks/useNextPrayer'
import { useHelpRequests } from '../hooks/useHelpRequests'
import { useMeetings } from '../hooks/useMeetings'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import { prayerNames } from '../data/prayerTimes'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
import PwaInstallPrompt from '../components/PwaInstallPrompt'

export default function Home() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { featureToggles } = useStore()
  const { upcoming } = useEthnoEvents()
  const { prayers } = usePrayerTimesForDate(new Date())
  const { currentPrayer, nextPrayer, timeRemaining } = useNextPrayer()
  const { completed } = usePrayerCompletions(user?.id ?? null, new Date())
  const { urgent } = useHelpRequests()
  const { meetings } = useMeetings(user?.id)

  const upcomingEvents = upcoming(1)
  const urgentHelp = urgent[0]
  const upcomingMeeting = meetings[0]

  const handleShare = async () => {
    const shareData = {
      title: 'ORAZA',
      text: 'Присоединяйся к крымскотатарскому приложению ORAZA! Расписание намазов, этно-календарь и взаимопомощь.',
      url: window.location.origin,
    }
    if (navigator.share) {
      try {
        await navigator.share(shareData)
      } catch (err) {
        console.log('Share canceled or failed', err)
      }
    } else {
      navigator.clipboard.writeText(window.location.origin)
      alert('Ссылка скопирована в буфер обмена!')
    }
  }

  return (
    <div className="animate-fade-in pb-4">
      
      {/* PWA Install Prompt */}
      <PwaInstallPrompt />

      {/* Prayer Card */}
      <div className="px-4 pt-4">
        <button onClick={() => navigate('/prayer-times')} className="w-full prayer-card-gradient rounded-2xl p-4 text-white shadow-lg touch-feedback text-left">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4" />
              <span className="font-medium text-sm">Время намаза — сегодня</span>
            </div>
            <span className="text-xs opacity-70">{format(new Date(), 'd MMMM', { locale: ru })}</span>
          </div>
          {prayers ? (
            <>
              {nextPrayer && timeRemaining && (
                <div className="bg-white/10 rounded-xl p-3 mb-3 flex items-center justify-between">
                  <div>
                    <p className="text-xs opacity-80">До {nextPrayer.name}</p>
                    <p className="text-xl font-bold font-mono tracking-wider">{timeRemaining}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-xs opacity-80">След. намаз</p>
                    <p className="text-lg font-semibold">{nextPrayer.timeStr}</p>
                  </div>
                </div>
              )}
              <div className="grid grid-cols-3 gap-2">
                {prayerNames.filter(p => p.key !== 'sunrise').slice(0, 3).map(prayer => {
                  const isCurrent = currentPrayer?.key === prayer.key;
                  const isCompleted = completed.includes(prayer.key);
                  return (
                    <div key={prayer.key} className={`rounded-xl p-2 text-center transition-colors relative ${isCurrent ? 'bg-white/30 ring-1 ring-white/50' : 'bg-white/20'}`}>
                      {isCompleted && (
                        <div className="absolute -top-1 -right-1 w-4 h-4 bg-emerald-400 rounded-full border-2 border-emerald-600 flex items-center justify-center">
                          <Check className="w-2.5 h-2.5 text-white" />
                        </div>
                      )}
                      <div className="text-xs opacity-80 mb-0.5">{prayer.name}</div>
                      <div className="text-lg font-bold">{(prayers as any)[prayer.key]}</div>
                    </div>
                  );
                })}
              </div>
              {user && (
                <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-sm">
                  <span className="opacity-90">Выполнено сегодня:</span>
                  <span className="font-bold">{completed.length} / 5</span>
                </div>
              )}
            </>
          ) : (
            <p className="text-sm opacity-70 text-center py-2">Нажмите для просмотра расписания →</p>
          )}
        </button>
      </div>

      {/* Urgent help */}
      {urgentHelp && (
        <div className="px-4 pt-4">
          <button onClick={() => navigate('/micro-yardym')} className="w-full bg-rose-50 border border-rose-200 rounded-2xl p-4 text-left touch-feedback">
            <div className="flex items-center gap-2 mb-2">
              <AlertCircle className="w-4 h-4 text-rose-500" />
              <span className="text-xs font-bold text-rose-600 uppercase tracking-wide">Срочная помощь</span>
            </div>
            <p className="font-semibold text-gray-800">{urgentHelp.title}</p>
            <p className="text-sm text-gray-500 mt-0.5">{urgentHelp.location}</p>
            <div className="mt-3 bg-rose-500 text-white text-center py-2 rounded-xl text-sm font-semibold">
              Я МОГУ ПОМОЧЬ →
            </div>
          </button>
        </div>
      )}

      {/* Upcoming event */}
      {upcomingEvents.length > 0 && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">Ближайшая дата</span>
            <button onClick={() => navigate('/ethno-calendar')} className="text-emerald-600 text-sm flex items-center gap-0.5">
              Все <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          {upcomingEvents.map(event => {
            const d = new Date(event.event_date)
            return (
              <button key={event.id} onClick={() => navigate('/ethno-calendar')}
                className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left touch-feedback">
                <div className="flex items-start gap-4">
                  <div className="text-center flex-shrink-0 w-12">
                    <div className="text-2xl font-bold text-emerald-600">{d.getDate()}</div>
                    <div className="text-xs text-emerald-600 font-medium uppercase">{format(d, 'MMM', { locale: ru })}</div>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-gray-800">{event.title}</p>
                    <p className="text-sm text-gray-500 mt-0.5 line-clamp-2">{event.description}</p>
                  </div>
                </div>
              </button>
            )
          })}
        </div>
      )}

      {/* Upcoming meeting */}
      {upcomingMeeting && (
        <div className="px-4 pt-4">
          <div className="flex items-center justify-between mb-2">
            <span className="font-semibold text-gray-800">Встреча села</span>
            <button onClick={() => navigate('/village-meetings')} className="text-emerald-600 text-sm flex items-center gap-0.5">
              Все <ChevronRight className="w-4 h-4" />
            </button>
          </div>
          <button onClick={() => navigate(`/meetings/${upcomingMeeting.id}`)}
            className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left touch-feedback">
            <div className="flex items-start justify-between mb-2">
              <p className="font-semibold text-gray-800">{upcomingMeeting.village}</p>
              <span className="bg-amber-100 text-amber-700 text-xs px-2 py-0.5 rounded-full whitespace-nowrap ml-2">
                {format(new Date(upcomingMeeting.meeting_date), 'd MMM', { locale: ru })}
              </span>
            </div>
            {upcomingMeeting.location && (
              <div className="flex items-center gap-1 text-rose-500 text-sm mb-2">
                <MapPin className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{upcomingMeeting.location}</span>
              </div>
            )}
            {upcomingMeeting.fund_progress != null && (
              <div className="mt-2">
                <div className="flex justify-between text-xs text-gray-500 mb-1">
                  <span>{upcomingMeeting.fund_purpose}</span>
                  <span className="text-emerald-600 font-semibold">{upcomingMeeting.fund_progress}%</span>
                </div>
                <div className="h-1.5 bg-gray-100 rounded-full overflow-hidden">
                  <div className="h-full bg-emerald-500 rounded-full" style={{ width: `${upcomingMeeting.fund_progress}%` }} />
                </div>
              </div>
            )}
            <div className="mt-3 flex items-center gap-1 text-xs text-gray-400">
              <Heart className="w-3.5 h-3.5" />
              <span>{upcomingMeeting.attendees_count ?? 0} участников · Подробнее →</span>
            </div>
          </button>
        </div>
      )}

      {/* Quick nav cards */}
      <div className="px-4 pt-4">
        <p className="font-semibold text-gray-800 mb-3">Разделы</p>
        <div className="grid grid-cols-2 gap-3">
          {[
            { path: '/village-meetings', emoji: '🏘️', title: 'Встречи сёл',   sub: 'События и сборы', show: featureToggles.meetings },
            { path: '/micro-yardym',     emoji: '🤝', title: 'Микро-Ярдым',   sub: 'Взаимопомощь', show: featureToggles.yardym },
            { path: '/ethno-calendar',   emoji: '📅', title: 'Этно-календарь', sub: 'Праздники', show: featureToggles.calendar },
            { path: '/rituals',          emoji: '📖', title: 'Обряды',         sub: 'Никях, Дженазе', show: featureToggles.rituals },
          ].filter(item => item.show).map(({ path, emoji, title, sub }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-colors">
              <div className="text-2xl mb-2">{emoji}</div>
              <p className="font-semibold text-gray-800 text-sm">{title}</p>
              <p className="text-xs text-gray-400 mt-0.5">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Share Block */}
      <div className="px-4 pt-4">
        <button onClick={handleShare} className="w-full bg-blue-50 border border-blue-200 rounded-2xl p-4 text-left touch-feedback flex items-center gap-4 hover:bg-blue-100 transition-colors">
          <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
            <Share2 className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="font-semibold text-blue-900">Поделиться с близкими</h3>
            <p className="text-xs text-blue-700 mt-0.5 leading-relaxed">Расскажите об ORAZA родным — это поможет нашему сообществу расти.</p>
          </div>
        </button>
      </div>

      {/* Support Block */}
      <div className="px-4 pt-4">
        <div className="bg-gradient-to-br from-emerald-500 to-emerald-600 rounded-2xl p-5 text-white shadow-md relative overflow-hidden">
          <div className="relative z-10">
            <div className="flex items-center gap-2 mb-2">
              <Heart className="w-5 h-5 text-emerald-200" />
              <h3 className="font-bold text-lg">Поддержите проект</h3>
            </div>
            <p className="text-sm text-emerald-50 mb-4 leading-relaxed">
              ORAZA существует и развивается благодаря вашей поддержке. Внесите свой вклад в сохранение наших традиций.
            </p>
            <button onClick={() => navigate('/support')} className="bg-white text-emerald-600 font-semibold py-2.5 px-5 rounded-xl text-sm hover:bg-emerald-50 transition-colors w-full sm:w-auto text-center touch-feedback shadow-sm">
              Поддержать ORAZA
            </button>
          </div>
          <div className="absolute -bottom-6 -right-6 w-32 h-32 bg-white opacity-10 rounded-full blur-2xl"></div>
          <div className="absolute -top-6 -left-6 w-24 h-24 bg-white opacity-10 rounded-full blur-xl"></div>
        </div>
      </div>

    </div>
  )
}
