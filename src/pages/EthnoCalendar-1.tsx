import { useState } from 'react';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, Info } from 'lucide-react';
import {
  format, startOfMonth, endOfMonth, eachDayOfInterval,
  isSameMonth, isSameDay, addMonths, subMonths, getDay,
} from 'date-fns';
import { ru } from 'date-fns/locale';
import { useEthnoEvents } from '../hooks/useEthnoEvents';
import { EthnoEventRow } from '../lib/supabase';

function EthnoCalendar() {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [selectedEvent, setSelectedEvent] = useState<EthnoEventRow | null>(null);
  const { events, loading, upcoming } = useEthnoEvents();

  const monthStart = startOfMonth(currentMonth);
  const days = eachDayOfInterval({ start: monthStart, end: endOfMonth(monthStart) });

  const startDay = getDay(monthStart);
  const emptyBefore = startDay === 0 ? 6 : startDay - 1;

  const getEventsForDay = (day: Date) => {
    const ds = format(day, 'yyyy-MM-dd');
    return events.filter(e => e.event_date === ds);
  };

  const weekDays = ['Пн', 'Вт', 'Ср', 'Чт', 'Пт', 'Сб', 'Вс'];

  return (
    <div className="animate-fade-in min-h-screen bg-gray-50">
      <div className="bg-white px-4 py-4 border-b border-gray-200">
        <h1 className="text-xl font-bold text-gray-800">Этно-календарь</h1>
        <p className="text-sm text-gray-500">Крымскотатарские праздники и памятные даты</p>
      </div>

      <div className="bg-white px-4 py-3 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <button onClick={() => setCurrentMonth(m => subMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg touch-feedback">
            <ChevronLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div className="flex items-center gap-2">
            <CalendarIcon className="w-5 h-5 text-emerald-600" />
            <span className="font-semibold text-gray-800 capitalize">
              {format(currentMonth, 'MMMM yyyy', { locale: ru })}
            </span>
          </div>
          <button onClick={() => setCurrentMonth(m => addMonths(m, 1))} className="p-2 hover:bg-gray-100 rounded-lg touch-feedback">
            <ChevronRight className="w-5 h-5 text-gray-600" />
          </button>
        </div>
      </div>

      <div className="p-4">
        <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden">
          <div className="grid grid-cols-7 bg-gray-50 border-b border-gray-100">
            {weekDays.map(d => (
              <div key={d} className="py-2 text-center text-xs font-medium text-gray-500">{d}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {Array.from({ length: emptyBefore }).map((_, i) => (
              <div key={`e${i}`} className="aspect-square border-b border-r border-gray-100" />
            ))}
            {days.map(day => {
              const dayEvents = getEventsForDay(day);
              const hasEvent = dayEvents.length > 0;
              const isToday = isSameDay(day, new Date());
              const isCurrentMonth = isSameMonth(day, currentMonth);

              return (
                <div
                  key={day.toISOString()}
                  onClick={() => hasEvent && setSelectedEvent(dayEvents[0])}
                  className={`aspect-square border-b border-r border-gray-100 p-1 relative ${
                    hasEvent ? 'cursor-pointer hover:bg-emerald-50' : ''
                  } ${!isCurrentMonth ? 'bg-gray-50' : ''}`}
                >
                  <div className={`w-7 h-7 rounded-full flex items-center justify-center text-sm ${
                    isToday ? 'bg-emerald-500 text-white' : !isCurrentMonth ? 'text-gray-400' : 'text-gray-700'
                  }`}>
                    {format(day, 'd')}
                  </div>
                  {hasEvent && (
                    <div className="absolute bottom-1 left-1 right-1 flex justify-center gap-0.5">
                      {dayEvents.map((e, i) => (
                        <div key={i} className={`w-1.5 h-1.5 rounded-full ${
                          e.type === 'holiday' ? 'bg-emerald-500' :
                          e.type === 'memorial' ? 'bg-rose-500' : 'bg-amber-500'
                        }`} />
                      ))}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        <div className="flex items-center justify-center gap-4 mt-4 text-xs">
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-emerald-500" /><span className="text-gray-600">Праздник</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-rose-500" /><span className="text-gray-600">Памятная дата</span></div>
          <div className="flex items-center gap-1"><div className="w-2 h-2 rounded-full bg-amber-500" /><span className="text-gray-600">Другое</span></div>
        </div>
      </div>

      <div className="px-4 pb-20">
        <h2 className="text-lg font-bold text-gray-800 mb-3">Ближайшие события</h2>
        {loading ? (
          <div className="space-y-3">{[...Array(3)].map((_, i) => <div key={i} className="h-20 bg-white rounded-xl animate-pulse border border-gray-100" />)}</div>
        ) : (
          <div className="space-y-3">
            {upcoming(5).map(event => {
              const d = new Date(event.event_date);
              return (
                <div
                  key={event.id}
                  onClick={() => setSelectedEvent(event)}
                  className="bg-white rounded-xl p-4 shadow-sm border border-gray-100 cursor-pointer touch-feedback"
                >
                  <div className="flex items-start gap-4">
                    <div className="flex-shrink-0 text-center bg-emerald-50 rounded-lg p-2 min-w-[60px]">
                      <div className="text-2xl font-bold text-emerald-600">{d.getDate()}</div>
                      <div className="text-xs text-emerald-600 font-medium uppercase">
                        {format(d, 'MMM', { locale: ru })}
                      </div>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-gray-800">{event.title}</h3>
                      <p className="text-sm text-gray-500 mt-1 line-clamp-2">{event.description}</p>
                      <span className={`inline-block mt-2 text-xs px-2 py-0.5 rounded ${
                        event.type === 'holiday' ? 'bg-emerald-100 text-emerald-700' :
                        event.type === 'memorial' ? 'bg-rose-100 text-rose-700' : 'bg-amber-100 text-amber-700'
                      }`}>
                        {event.type === 'holiday' ? 'Праздник' : event.type === 'memorial' ? 'Памятная дата' : 'Другое'}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {selectedEvent && (
        <div className="fixed inset-0 z-[100] flex items-end sm:items-center justify-center modal-overlay" onClick={() => setSelectedEvent(null)}>
          <div className="bg-white w-full max-w-md rounded-t-2xl sm:rounded-2xl p-6 animate-slide-up" onClick={e => e.stopPropagation()}>
            <div className="flex items-start gap-4 mb-4">
              <div className="flex-shrink-0 text-center bg-emerald-50 rounded-xl p-3">
                <div className="text-3xl font-bold text-emerald-600">{new Date(selectedEvent.event_date).getDate()}</div>
                <div className="text-sm text-emerald-600 font-medium uppercase">
                  {format(new Date(selectedEvent.event_date), 'MMM', { locale: ru })}
                </div>
              </div>
              <div className="flex-1">
                <h2 className="text-xl font-bold text-gray-800">{selectedEvent.title}</h2>
                {selectedEvent.title_crh && <p className="text-sm text-gray-500 mt-1">{selectedEvent.title_crh}</p>}
              </div>
            </div>
            <div className="space-y-4">
              {selectedEvent.description && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Описание</h3>
                  <p className="text-gray-600">{selectedEvent.description}</p>
                </div>
              )}
              {selectedEvent.description_crh && (
                <div>
                  <h3 className="font-semibold text-gray-700 mb-1">Крымскотатарский</h3>
                  <p className="text-gray-600 italic">{selectedEvent.description_crh}</p>
                </div>
              )}
              <div className="flex items-center gap-2">
                <Info className="w-4 h-4 text-emerald-600" />
                <span className="text-sm text-gray-500">
                  {format(new Date(selectedEvent.event_date), 'd MMMM yyyy', { locale: ru })}
                </span>
              </div>
            </div>
            <button onClick={() => setSelectedEvent(null)}
              className="w-full mt-6 bg-emerald-500 text-white font-semibold py-3 rounded-xl hover:bg-emerald-600 transition-colors">
              Закрыть
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EthnoCalendar;
