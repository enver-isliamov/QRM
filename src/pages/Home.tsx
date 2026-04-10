import { useNavigate } from 'react-router-dom'
import { ChevronRight, Clock, MapPin, Heart, AlertCircle, Share2, BookOpen, Calendar as CalendarIcon, Users } from 'lucide-react'
import { useEthnoEvents } from '../hooks/useEthnoEvents'
import { usePrayerTimesForDate, usePrayerCompletions } from '../hooks/usePrayerTimes'
import { useNextPrayer } from '../hooks/useNextPrayer'
import { useHelpRequests } from '../hooks/useHelpRequests'
import { useMeetings } from '../hooks/useMeetings'
import { useRituals } from '../hooks/useRituals'
import { useAuth } from '../hooks/useAuth'
import { useStore } from '../store/useStore'
import { prayerNames } from '../store/data/prayerTimes'
import { format } from 'date-fns'
import { ru } from 'date-fns/locale'
const crh = ru // date-fns doesn't have crh locale, using ru as fallback
import PwaInstallPrompt from '../components/PwaInstallPrompt'
import { Skeleton } from '../components/ui/Skeleton'
import { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'

const SUPPORT_URL = import.meta.env.VITE_SUPPORT_URL || 'https://pay.cloudtips.ru/p/8a27e9ab';

export default function Home() {
  const navigate = useNavigate()
  const { t, i18n } = useTranslation()
  const { user, profile, loading: authLoading } = useAuth()
  console.log('Home: Auth state:', { user: user?.id, authLoading });
  const { featureToggles } = useStore()
  const { upcoming, loading: eventsLoading } = useEthnoEvents()
  const { prayers, loading: prayersLoading } = usePrayerTimesForDate(new Date())
  const { currentPrayer } = useNextPrayer()
  const { completed, toggle } = usePrayerCompletions(user?.id ?? null, new Date())
  console.log('Home: Completions state:', { completed });
  const { urgent, loading: helpLoading } = useHelpRequests()
  const { meetings, loading: meetingsLoading } = useMeetings(user?.id)
  const { rituals, loading: ritualsLoading } = useRituals()

  const [activeTab, setActiveTab] = useState<'meetings' | 'yardym' | 'rituals' | 'calendar'>('meetings')

  const upcomingEvents = useMemo(() => upcoming(1), [upcoming])
  const urgentHelp = useMemo(() => urgent[0], [urgent])
  const upcomingMeeting = useMemo(() => meetings[0], [meetings])
  const featuredRitual = useMemo(() => rituals[0], [rituals])

  const isLoading = eventsLoading || prayersLoading || helpLoading || meetingsLoading || ritualsLoading
  console.log('Home: Loading states:', { eventsLoading, prayersLoading, helpLoading, meetingsLoading, isLoading });

  const dateLocale = i18n.language === 'crh' ? crh : ru

  const handleShare = async () => {
    const shareData = {
      title: t('home.title'),
      text: t('home.subtitle') + t('home.share_text_extra'),
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
      alert(t('home.share_alert'))
    }
  }

  if (isLoading && !prayers) {
    return (
      <div className="px-4 pt-4 space-y-6 animate-fade-in">
        <div className="space-y-2">
          <Skeleton className="h-8 w-48" />
          <Skeleton className="h-4 w-32" />
        </div>
        <Skeleton className="h-48 w-full rounded-2xl" />
        <Skeleton className="h-24 w-full rounded-2xl" />
        <div className="space-y-3">
          <Skeleton className="h-6 w-32" />
          <Skeleton className="h-32 w-full rounded-2xl" />
        </div>
      </div>
    )
  }

  return (
    <div className="animate-fade-in pb-8">
      
      {/* PWA Install Prompt */}
      <PwaInstallPrompt />

      {/* Welcome Header */}
      <div className="px-4 pt-6 pb-2 flex items-start justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            {user ? t('home.welcome_user', { name: profile?.name?.split(' ')[0] || user.user_metadata?.full_name?.split(' ')[0] || t('auth.user') }) : t('home.welcome_guest')}
          </h1>
          <p className="text-gray-500 text-sm mt-1">{t('home.subtitle')}</p>
        </div>
        <button 
          onClick={() => window.open(SUPPORT_URL, '_blank')}
          className="w-10 h-10 bg-rose-50 rounded-full flex items-center justify-center text-rose-500 shadow-sm border border-rose-100 active:scale-90 transition-transform"
          title={t('home.support')}
        >
          <Heart className="w-5 h-5 fill-rose-500" />
        </button>
      </div>

      {/* Minimalist Prayer Widget */}
      <div className="px-4 pt-4">
        <button onClick={() => navigate('/prayer-times')} className="w-full bg-emerald-600 rounded-2xl p-4 text-white shadow-md touch-feedback text-left relative overflow-hidden">
          <div className="flex items-center justify-between mb-3">
            <div className="flex items-center gap-2">
              <Clock className="w-4 h-4 opacity-80" />
              <span className="font-bold text-sm tracking-tight">{t('nav.namaz')}</span>
            </div>
            <span className="text-[10px] font-bold opacity-70 uppercase tracking-widest">{format(new Date(), 'd MMMM', { locale: dateLocale })}</span>
          </div>
          
          {prayers ? (
            <div className="grid grid-cols-5 gap-1">
              {prayerNames.filter(p => p.key !== 'sunrise').map(prayer => {
                const isCurrent = currentPrayer?.key === prayer.key;
                const isCompleted = completed.includes(prayer.key);
                return (
                  <button 
                    key={prayer.key} 
                    onClick={(e) => { e.stopPropagation(); toggle(prayer.key); }}
                    className={`rounded-xl py-2 px-1 text-center transition-all ${isCurrent ? 'bg-white/20 ring-1 ring-white/40' : 'bg-white/5'}`}
                  >
                    <div className="text-[8px] uppercase tracking-tighter opacity-60 mb-0.5 truncate">{prayer.name}</div>
                    <div className="text-sm font-bold">{(prayers as any)[prayer.key]}</div>
                    {isCompleted && <div className="w-1 h-1 bg-emerald-300 rounded-full mx-auto mt-1" />}
                  </button>
                );
              })}
            </div>
          ) : (
            <Skeleton className="h-10 w-full bg-white/10" />
          )}
        </button>
      </div>

      {/* Tabs Bar */}
      <div className="mt-6 px-4 sticky top-0 z-40 bg-gray-50/80 backdrop-blur-md py-2 -mx-4 overflow-x-auto no-scrollbar flex gap-2 scroll-px-4">
        <div className="flex gap-2 px-4 min-w-max">
          {[
            { id: 'meetings', label: t('sections.meetings'), icon: Users },
            { id: 'yardym',   label: t('sections.yardym'),   icon: AlertCircle },
            { id: 'rituals',  label: t('sections.rituals'),  icon: BookOpen },
            { id: 'calendar', label: t('sections.ethno_calendar'), icon: CalendarIcon },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`flex items-center gap-2 px-4 py-2 rounded-full text-sm font-bold transition-all whitespace-nowrap ${
                activeTab === tab.id 
                  ? 'bg-emerald-600 text-white shadow-md shadow-emerald-200' 
                  : 'bg-white text-gray-500 border border-gray-100'
              }`}
            >
              <tab.icon className={`w-4 h-4 ${activeTab === tab.id ? 'text-white' : 'text-gray-400'}`} />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="px-4 pt-4">
        {activeTab === 'meetings' && (
          <div className="animate-slide-up">
            {upcomingMeeting ? (
              <button onClick={() => navigate(`/meetings/${upcomingMeeting.id}`)}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-100 transition-colors">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-bold text-gray-900 text-lg leading-tight">{i18n.language === 'crh' ? upcomingMeeting.village_crh || upcomingMeeting.village : upcomingMeeting.village}</h3>
                    <p className="text-xs text-emerald-600 font-bold mt-1 uppercase tracking-wider">{t('home.organizer')}: {upcomingMeeting.organizer}</p>
                  </div>
                  <div className="bg-amber-50 text-amber-700 text-[10px] font-bold px-2.5 py-1 rounded-full border border-amber-100 uppercase tracking-wider whitespace-nowrap ml-2">
                    {format(new Date(upcomingMeeting.meeting_date), 'd MMMM', { locale: dateLocale })}
                  </div>
                </div>
                {upcomingMeeting.location && (
                  <div className="flex items-center gap-1.5 text-gray-500 text-sm mb-4">
                    <MapPin className="w-4 h-4 text-rose-400 flex-shrink-0" />
                    <span className="truncate">{upcomingMeeting.location}</span>
                  </div>
                )}
                <div className="flex items-center justify-between mt-2">
                  <div className="flex items-center gap-1.5 text-xs text-gray-500">
                    <Users className="w-4 h-4" />
                    <span className="font-medium">{upcomingMeeting.attendees_count ?? 0} {t('home.attendees')}</span>
                  </div>
                  <span className="text-xs font-bold text-emerald-600">{t('home.details')} →</span>
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <Users className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">{t('common.no_data')}</p>
              </div>
            )}
            <button onClick={() => navigate('/village-meetings')} className="w-full mt-4 py-3 text-emerald-600 text-sm font-bold border border-emerald-100 rounded-xl bg-emerald-50/30">
              {t('home.all')} {t('sections.meetings')}
            </button>
          </div>
        )}

        {activeTab === 'yardym' && (
          <div className="animate-slide-up">
            {urgentHelp ? (
              <button onClick={() => navigate('/micro-yardym')} className="w-full bg-rose-50 border border-rose-100 rounded-2xl p-5 text-left touch-feedback shadow-sm hover:border-rose-200 transition-colors">
                <div className="flex items-center gap-2 mb-3">
                  <div className="w-8 h-8 bg-rose-100 rounded-full flex items-center justify-center">
                    <AlertCircle className="w-5 h-5 text-rose-500" />
                  </div>
                  <span className="text-xs font-bold text-rose-600 uppercase tracking-widest">{t('home.urgent_help')}</span>
                </div>
                <h3 className="font-bold text-gray-900 text-lg leading-tight">{urgentHelp.title}</h3>
                <p className="text-sm text-gray-500 mt-2 flex items-center gap-1">
                  <MapPin className="w-3.5 h-3.5" />
                  {urgentHelp.location}
                </p>
                <div className="mt-4 bg-rose-500 text-white text-center py-3 rounded-xl text-sm font-bold shadow-md shadow-rose-200">
                  {t('home.i_can_help')} →
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <AlertCircle className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">{t('common.no_data')}</p>
              </div>
            )}
            <button onClick={() => navigate('/micro-yardym')} className="w-full mt-4 py-3 text-rose-600 text-sm font-bold border border-rose-100 rounded-xl bg-rose-50/30">
              {t('home.all')} {t('sections.yardym')}
            </button>
          </div>
        )}

        {activeTab === 'rituals' && (
          <div className="animate-slide-up">
            {featuredRitual ? (
              <button onClick={() => navigate(`/rituals/${featuredRitual.id}`)}
                className="w-full bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left touch-feedback hover:border-purple-100 transition-colors">
                <div className="flex items-center gap-4">
                  <div className="w-12 h-12 bg-purple-50 rounded-xl flex items-center justify-center text-2xl">
                    {featuredRitual.icon || '📖'}
                  </div>
                  <div>
                    <h3 className="font-bold text-gray-900 leading-tight">{i18n.language === 'crh' ? featuredRitual.title_crh || featuredRitual.title : featuredRitual.title}</h3>
                    <p className="text-xs text-gray-500 mt-1">{i18n.language === 'crh' ? featuredRitual.subtitle_crh || featuredRitual.subtitle : featuredRitual.subtitle}</p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 ml-auto" />
                </div>
              </button>
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <BookOpen className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">{t('common.no_data')}</p>
              </div>
            )}
            <button onClick={() => navigate('/rituals')} className="w-full mt-4 py-3 text-purple-600 text-sm font-bold border border-purple-100 rounded-xl bg-purple-50/30">
              {t('home.all')} {t('sections.rituals')}
            </button>
          </div>
        )}

        {activeTab === 'calendar' && (
          <div className="animate-slide-up">
            {upcomingEvents.length > 0 ? (
              upcomingEvents.map(event => {
                const d = new Date(event.event_date)
                return (
                  <button key={event.id} onClick={() => navigate('/ethno-calendar')}
                    className="w-full bg-white rounded-2xl p-4 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-100 transition-colors">
                    <div className="flex items-center gap-5">
                      <div className="text-center flex-shrink-0 w-14 py-2 bg-emerald-50 rounded-xl border border-emerald-100">
                        <div className="text-2xl font-black text-emerald-600 leading-none">{d.getDate()}</div>
                        <div className="text-[10px] text-emerald-600 font-bold uppercase tracking-tighter mt-1">{format(d, 'MMMM', { locale: dateLocale })}</div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="font-bold text-gray-900 leading-snug">{i18n.language === 'crh' ? event.title_crh || event.title : event.title}</p>
                        <p className="text-xs text-gray-500 mt-1 line-clamp-1">{i18n.language === 'crh' ? event.description_crh || event.description : event.description}</p>
                      </div>
                      <ChevronRight className="w-5 h-5 text-gray-300 flex-shrink-0" />
                    </div>
                  </button>
                )
              })
            ) : (
              <div className="bg-white rounded-2xl p-8 text-center border border-dashed border-gray-200">
                <CalendarIcon className="w-10 h-10 text-gray-200 mx-auto mb-2" />
                <p className="text-sm text-gray-400 font-medium">{t('common.no_data')}</p>
              </div>
            )}
            <button onClick={() => navigate('/ethno-calendar')} className="w-full mt-4 py-3 text-emerald-600 text-sm font-bold border border-emerald-100 rounded-xl bg-emerald-50/30">
              {t('home.all')} {t('sections.ethno_calendar')}
            </button>
          </div>
        )}
      </div>

      {/* Quick nav cards */}
      <div className="px-4 pt-8">
        <p className="font-bold text-gray-900 text-lg mb-4 px-1">{t('nav.sections')}</p>
        <div className="grid grid-cols-2 gap-4">
          {[
            { path: '/village-meetings', emoji: '🏘️', title: t('sections.meetings'),   sub: t('sections.meetings_sub'), show: featureToggles.meetings, color: 'bg-blue-50' },
            { path: '/micro-yardym',     emoji: '🤝', title: t('sections.yardym'),     sub: t('sections.yardym_sub'), show: featureToggles.yardym, color: 'bg-emerald-50' },
            { path: '/ethno-calendar',   emoji: '📅', title: t('sections.ethno_calendar'), sub: t('sections.calendar_sub'), show: featureToggles.calendar, color: 'bg-amber-50' },
            { path: '/rituals',          emoji: '📖', title: t('sections.rituals'),    sub: t('sections.rituals_sub'), show: featureToggles.rituals, color: 'bg-purple-50' },
          ].filter(item => item.show).map(({ path, emoji, title, sub, color }) => (
            <button key={path} onClick={() => navigate(path)}
              className="bg-white rounded-2xl p-5 shadow-sm border border-gray-100 text-left touch-feedback hover:border-emerald-200 transition-all hover:shadow-md group">
              <div className={`w-12 h-12 ${color} rounded-xl flex items-center justify-center text-2xl mb-4 group-hover:scale-110 transition-transform`}>{emoji}</div>
              <p className="font-bold text-gray-900 text-sm">{title}</p>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">{sub}</p>
            </button>
          ))}
        </div>
      </div>

      {/* Share Block */}
      <div className="px-4 pt-12">
        <button onClick={handleShare} className="w-full bg-indigo-50 border border-indigo-100 rounded-2xl p-5 text-left touch-feedback flex items-center gap-5 hover:bg-indigo-100 transition-all shadow-sm">
          <div className="w-14 h-14 bg-white rounded-2xl flex items-center justify-center flex-shrink-0 shadow-sm">
            <Share2 className="w-7 h-7 text-indigo-600" />
          </div>
          <div>
            <h3 className="font-bold text-indigo-900 text-lg">{t('home.share_title')}</h3>
            <p className="text-xs text-indigo-700 mt-1 leading-relaxed font-medium">{t('home.share_desc')}</p>
          </div>
        </button>
      </div>

      {/* Support Block */}
      <div className="px-4 pt-8">
        <div className="bg-gradient-to-br from-emerald-600 to-teal-700 rounded-3xl p-6 text-white shadow-xl relative overflow-hidden">
          <div className="relative z-10 text-center">
            <div className="w-12 h-12 bg-white/20 backdrop-blur-md rounded-2xl flex items-center justify-center mx-auto mb-4">
              <Heart className="w-6 h-6 text-white fill-white" />
            </div>
            <h3 className="font-black text-xl tracking-tight mb-2">{t('home.support')}</h3>
            <p className="text-sm text-emerald-50 mb-6 leading-relaxed font-medium opacity-90">
              {t('home.support_desc')}
            </p>
            <button onClick={() => window.open(SUPPORT_URL, '_blank')} className="bg-white text-emerald-700 font-black py-3.5 px-6 rounded-2xl text-sm hover:bg-emerald-50 transition-all w-full text-center touch-feedback shadow-lg active:scale-[0.98]">
              {t('home.support_button')}
            </button>
          </div>
          <div className="absolute -bottom-10 -right-10 w-48 h-48 bg-white opacity-10 rounded-full blur-3xl"></div>
          <div className="absolute -top-10 -left-10 w-32 h-32 bg-emerald-400 opacity-20 rounded-full blur-2xl"></div>
        </div>
      </div>

    </div>
  )
}
