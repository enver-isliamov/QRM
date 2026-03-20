import { useState } from 'react';
import { ChevronLeft, ChevronRight, Check, Clock, Sun, Sunrise, Sunset, Moon } from 'lucide-react';
import { format, addDays, subDays } from 'date-fns';
import { ru } from 'date-fns/locale';
import { useStore } from '../store/useStore';
import { getPrayersForDate, prayerNames } from '../data/prayerTimes';

function PrayerTimes() {
  const [selectedDate, setSelectedDate] = useState(new Date());
  const { completedPrayers, togglePrayer } = useStore();
  
  const dateStr = format(selectedDate, 'yyyy-MM-dd');
  const prayers = getPrayersForDate(dateStr);
  const completed = completedPrayers[dateStr] || [];
  
  const navigateDate = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setSelectedDate(prev => subDays(prev, 1));
    } else {
      setSelectedDate(prev => addDays(prev, 1));
    }
  };
  
  const getPrayerIcon = (key: string) => {
    switch (key) {
      case 'fajr': return <Sunrise className="w-5 h-5" />;
      case 'sunrise': return <Sun className="w-5 h-5" />;
      case 'dhuhr': return <Sun className="w-5 h-5" />;
      case 'asr': return <Sun className="w-5 h-5" />;
      case 'maghrib': return <Sunset className="w-5 h-5" />;
      case 'isha': return <Moon className="w-5 h-5" />;
      default: return <Clock className="w-5 h-5" />;
    }
  };
  
  const isToday = format(selectedDate, 'yyyy-MM-dd') === format(new Date(), 'yyyy-MM-dd');
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Расписание намазов</h1>
        <p className="text-sm text-gray-500">Симферополь, Крым</p>
      </div>
      
      {/* Date Navigation */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigateDate('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="text-center">
            <div className="font-semibold text-gray-800">
              {format(selectedDate, 'd MMMM yyyy', { locale: ru })}
            </div>
            <div className="text-xs text-gray-500">
              {format(selectedDate, 'EEEE', { locale: ru })}
              {isToday && <span className="text-emerald-600 ml-1">(Сегодня)</span>}
            </div>
          </div>
          
          <button 
            onClick={() => navigateDate('next')}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Prayer Times */}
      <div className="p-4">
        {prayers ? (
          <div className="space-y-3">
            {prayerNames.map((prayer) => {
              const time = prayers[prayer.key as keyof typeof prayers];
              const isCompleted = completed.includes(prayer.key);
              const isSunrise = prayer.key === 'sunrise';
              
              return (
                <div 
                  key={prayer.key}
                  className={`bg-white rounded-xl p-4 shadow-sm border ${
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
                        <h3 className="font-semibold text-gray-800">{prayer.name}</h3>
                        <p className="text-sm text-gray-500">{prayer.description}</p>
                        <p className="text-xs text-gray-400 font-arabic">{prayer.arabic}</p>
                      </div>
                    </div>
                    
                    <div className="flex items-center gap-4">
                      <div className="text-right">
                        <div className="text-2xl font-bold text-gray-800">{time}</div>
                      </div>
                      
                      {!isSunrise && isToday && (
                        <button
                          onClick={() => togglePrayer(dateStr, prayer.key)}
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
            <h3 className="text-lg font-semibold text-gray-600 mb-2">Нет данных</h3>
            <p className="text-sm text-gray-500">
              Расписание намазов на выбранную дату недоступно
            </p>
          </div>
        )}
      </div>
      
      {/* Info Card */}
      <div className="px-4 pb-20">
        <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-4">
          <h3 className="font-semibold text-emerald-800 mb-2">Информация</h3>
          <p className="text-sm text-emerald-700">
            Время намаза рассчитано для г. Симферополь по методу ДУМ Крыма. 
            Рекомендуется сверяться с местным мечетью.
          </p>
          <p className="text-xs text-emerald-600 mt-2">
            Источник: Духовное управление мусульман Республики Крым (qmdi.ru)
          </p>
        </div>
      </div>
    </div>
  );
}

export default PrayerTimes;
