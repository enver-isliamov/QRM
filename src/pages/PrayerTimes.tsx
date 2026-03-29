import { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ChevronLeft, ChevronRight, Check, Clock, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
const crh = ru; // date-fns doesn't have crh locale, using ru as fallback
import { usePrayerTimesForDate, usePrayerCompletions } from '../hooks/usePrayerTimes';
import { useAuth } from '../hooks/useAuth';
import { prayerNames } from '../store/data/prayerTimes';

function PrayerTimes() {
  const { t, i18n } = useTranslation();
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { user } = useAuth();
  const { prayers, loading } = usePrayerTimesForDate(selectedDate);
  const { completed, toggle } = usePrayerCompletions(user?.id ?? null, selectedDate);

  const currentLocale = i18n.language === 'crh' ? crh : ru;
  const isCrh = i18n.language === 'crh';

  const navigateDate = (dir: 'prev' | 'next') =>
    setSelectedDate(prev => dir === 'prev' ? subDays(prev, 1) : addDays(prev, 1));

  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');

  const getPrayerIcon = (key: string) => {
    switch (key) {
      case 'fajr':    return <Sunrise className="w-5 h-5" />;
      case 'sunrise': return <Sun className="w-5 h-5" />;
      case 'dhuhr':   return <Sun className="w-5 h-5" />;
      case 'asr':     return <Sun className="w-5 h-5" />;
      case 'maghrib': return <Sunset className="w-5 h-5" />;
      case 'isha':    return <Moon className="w-5 h-5" />;
      default:        return <Clock className="w-5 h-5" />;
    }
  };

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">{t('namaz.title')}</h1>
        <p className="text-sm text-gray-500">{t('namaz.location')}</p>
      </div>

      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button onClick={() => navigateDate('prev')} className="p-2 hover:bg-gray-100 rounded-lg touch-feedback">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="text-center">
            <div className="font-semibold text-gray-800">{format(selectedDate, 'd MMMM yyyy', { locale: currentLocale })}</div>
            <div className="text-xs text-gray-500">
              {format(selectedDate, 'EEEE', { locale: currentLocale })}
              {isToday && <span className="text-emerald-600 ml-1">({t('namaz.today')})</span>}
            </div>
          </div>
          <button onClick={() => navigateDate('next')} className="p-2 hover:bg-gray-100 rounded-lg touch-feedback">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        {loading ? (
          <div className="space-y-3">
            {[...Array(6)].map((_, i) => (
              <div key={i} className="bg-white rounded-xl p-4 h-20 animate-pulse border border-gray-100" />
            ))}
          </div>
        ) : prayers ? (
          <div className="space-y-3">
            {prayerNames.map((prayer) => {
              const time = (prayers as any)[prayer.key] as string;
              const isCompleted = completed.includes(prayer.key);
              const isSunrise = prayer.key === 'sunrise';

              return (
                <div
                  key={prayer.key}
                  className={`bg-white rounded-xl p-4 shadow-sm border transition-colors ${
                    isCompleted ? 'border-emerald-300 bg-emerald-50' : 'border-gray-100'
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-4">
                      <div className={`w-12 h-12 rounded-xl flex items-center justify-center ${
                        isCompleted ? 'bg-emerald-500 text-white' : 'bg-emerald-100 text-emerald-600'
                      }`}>
                        {getPrayerIcon(prayer.key)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-800">{isCrh ? prayer.nameCrh : prayer.name}</h3>
                        <p className="text-sm text-gray-500">{t(`namaz.${prayer.key}_desc`)}</p>
                        <p className="text-xs text-gray-400">{prayer.arabic}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <div className="text-2xl font-bold text-gray-800">{time}</div>
                      {!isSunrise && isToday && (
                        <button
                          onClick={() => toggle(prayer.key)}
                          className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${
                            isCompleted
                              ? 'bg-emerald-500 text-white'
                              : 'bg-gray-100 text-gray-400 hover:bg-gray-200'
                          }`}
                        >
                          <Check className="w-5 h-5" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        ) : (
          <div className="text-center py-12">
            <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
              <Clock className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-semibold text-gray-600 mb-2">{t('namaz.no_data')}</h3>
          </div>
        )}
      </div>

      {!user && (
        <div className="px-4 pb-4">
          <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
            <p className="text-sm text-amber-700">
              {t('namaz.login_prompt')}
            </p>
          </div>
        </div>
      )}

      <div className="px-4 pb-20">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="font-semibold text-emerald-800 mb-2">{t('namaz.info_title')}</h3>
          <p className="text-sm text-emerald-700">
            {t('namaz.info_desc')}
          </p>
          <p className="text-xs text-emerald-600 mt-2">
            {t('namaz.source')}
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrayerTimes;
