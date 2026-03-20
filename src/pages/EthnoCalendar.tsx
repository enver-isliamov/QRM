import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameMonth, isSameDay, addMonths, subMonths, getDay } from 'date-fns';
import { ru } from 'date-fns/locale';
import { ethnoEvents } from '../data/ethnoCalendar';
import { EthnoEvent } from '../types';

function EthnoCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EthnoEvent | null>(null);
  
  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(monthStart);
  const days = eachDayOfInterval({ start: monthStart, end: monthEnd });
  
  // Get day of week starting from Monday (0 = Monday, 6 = Sunday)
  const startDay = getDay(monthStart);
  const adjustedStartDay = startDay === 0 ? 6 : startDay - 1;
  
  const navigateMonth = (direction: 'prev' | 'next') => {
    if (direction === 'prev') {
      setCurrentMonth(prev => subMonths(prev, 1));
    } else {
      setCurrentMonth(prev => addMonths(prev, 1));
    }
  };
  
  const getEventsForDay = (day: Date): EthnoEvent[] => {
    const dateStr = format(day, 'yyyy-MM-dd');
    return ethnoEvents.filter(e => e.date === dateStr);
  };
  
  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];
  
  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      {/* Header */}
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Этно-календарь</h1>
        <p className="text-sm text-gray-500">Крымскотатарские праздники и памятные даты</p>
      </div>
      
      {/* Month Navigation */}
      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button 
            onClick={() => navigateMonth('prev')}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
          >
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-gray-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ru })}
            </span>
          </div>
          
          <button 
            onClick={() => navigateMonth('next')}
            className="p-2 hover:bg-gray-100 rounded-lg touch-feedback"
          >
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>
      
      {/* Calendar Grid */}
      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          {/* Week Days Header */}
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {weekDays.map(day => (
              <div key={day} className="py-2 text-center text-xs font-medium text-gray-500">
                {day}
              </div>
            ))}
          </div>
          
          {/* Days Grid */}
          <div className="grid grid-cols-7">
            {/* Empty cells for days before month start */}
            {Array.from({ length: adjustedStartDay }).map((_, i) => (
              <div key={`empty-${i}`} className="aspect-square border-b border-r border-gray-100" />
            ))}
            
            {days.map((day) => {
              const dayEvents = getEventsForDay(day);
              const hasEvent = dayEvents.length > 0;
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);
              
              return (
                <div 
                  key={day.toISOString()}
                  onClick={() => {
                    if (hasEvent) {
                      setSelectedEvent(dayEvents[0]);
                    }
                  }}
                  className={`aspect-square border-b border-r border-gray-100 p-1 relative ${
                    hasEvent ? 'cursor-pointer hover:bg-emerald-50' : ''
                  } ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                >
                  <div className={`
                    w-7 h-7 rounded-full flex items-center justify-center text-sm
                    ${isToday ? 'bg-emerald-500 text-white' : 'text-gray-700'}
                    ${!isCurrentMonth ? 'text-gray-400' : ''}
                  `}>
                    {format(day, 'd')}
                  </div>
                  
                  {hasEvent && (
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5">
                      {dayEvents.map((e, i) => (
                        <div 
                          key={i}
                          className={`w-1.5 h-1.5 rounded-full ${
                            e.type === 'holiday' ? 'bg-emerald-500' : 
                            e.type === 'memorial' ? 'bg-rose-500' : 'bg-amber-500'
                          }`}
                        />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
        
        {/* Legend */}
        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-emerald-500" />
            <span className="text-gray-600">Праздник</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-rose-500" />
            <span className="text-gray-600">Памятная дата</span>
          </div>
          <div className="flex items-center gap-1">
            <div className="w-2 h-2 rounded-full bg-amber-500" />
            <span className="text-gray-600">Другое</span>
          </div>
        </div>
      </div>
      
      {/* Upcoming Events List */}
      <div className="px-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Ближайшие события</h2>
        <div className="space-y-3">
          {ethnoEvents
            .filter(e => new Date(e.date) >= new Date())
            .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime())
            .slice(0, 5)
            .map((event) => (
              <div 
                key={event.id}
                onClick={() => setSelectedEvent(event)}
                className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer touch-feedback"
              >
                <div className="flex items-start gap-4">
                  <div className="flex-shrink-0 text-center bg-emerald-50 rounded-lg p-2 min-w-[60px]">
                    <div className="text-2xl font-bold text-emerald-600">{event.day}</div>
                    <div className="text-xs text-emerald-600 font-medium uppercase">{event.month}</div>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-semibold text-gray-800">{event.title}</h3>
                    <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                    <div className="flex items-center gap-2 mt-2">
                      <span className={`text-xs px-2 py-0.5 rounded ${
                        event.type === 'holiday' ? 'bg-emerald-100 text-emerald-700' :
                        event.type === 'memorial' ? 'bg-rose-100 text-rose-700' :
                        'bg-amber-100 text-amber-700'
                      }`}>
                        {event.type === 'holiday' ? 'Праздник' :
                         event.type === 'memorial' ? 'Памятная дата' : 'Другое'}
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
        </div>
      </div>
      
      {/* Event Modal */}
      {selectedEvent && (
        <div 
          className="fixed inset-0 z-50 flex items-end sm:items-center justify-center modal-overlay"
          onClick={() => setSelectedEvent(null)}
        >
          <div 
            className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up"
            onClick={e => e.stopPropagation()}
          >
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 text-center bg-emerald-50 rounded-xl p-3">
                <div className="text-3xl font-bold text-emerald-600">{selectedEvent.day}</div>
                <div className="text-sm text-emerald-600 font-medium uppercase">{selectedEvent.month}</div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h2>
                <p className="text-sm text-gray-500 mt-1">{selectedEvent.titleCrh}</p>
              </div>
            </div>
            
            <div className="space-y-4">
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Описание</h3>
                <p className="text-gray-600">{selectedEvent.description}</p>
              </div>
              
              <div>
                <h3 className="font-semibold text-gray-700 mb-1">Крымскотатарский язык</h3>
                <p className="text-gray-600 italic">{selectedEvent.descriptionCrh}</p>
              </div>
              
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-500">
                  {format(new Date(selectedEvent.date), 'd MMMM yyyy', { locale: ru })}
                </span>
              </div>
            </div>
            
            <button
              onClick={() => setSelectedEvent(null)}
              className="w-full mt-6 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors"
            >
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EthnoCalendar;
