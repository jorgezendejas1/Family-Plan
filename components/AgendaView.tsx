
import React, { useMemo, useEffect, useState, useRef } from 'react';
import { format, isToday, isTomorrow, isBefore, addDays, isSameDay, parse, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarEvent, ViewProps } from '../types';
import { CalendarDays, Check, Cake } from 'lucide-react';

const AgendaView: React.FC<ViewProps> = ({ currentDate, events, calendars, onEventClick, onTimeSlotClick, onToggleTaskCompletion }) => {
  const [now, setNow] = useState(new Date());
  const listRef = useRef<HTMLDivElement>(null);
  const [highlightedDate, setHighlightedDate] = useState<string | null>(null);

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000); // Update every minute for "Now" indicator
    return () => clearInterval(interval);
  }, []);

  const { groupedEvents, dates, hasEventsInNext7Days } = useMemo(() => {
    // Use all available events to allow scrolling to past/future without filtering by currentDate
    const relevantEvents = [...events];
    
    relevantEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    // Using startOfDay as a named import
    const startOfCurrent = startOfDay(currentDate);
    const next7DaysEnd = addDays(startOfCurrent, 7);
    const hasEventsInNext7Days = relevantEvents.some(e => 
        !isBefore(e.end, startOfCurrent) && isBefore(e.start, next7DaysEnd)
    );

    const groups: Record<string, CalendarEvent[]> = {};
    relevantEvents.forEach(event => {
      const dateKey = format(event.start, 'yyyy-MM-dd');
      if (!groups[dateKey]) {
        groups[dateKey] = [];
      }
      groups[dateKey].push(event);
    });

    return {
      groupedEvents: groups,
      dates: Object.keys(groups).sort(),
      hasEventsInNext7Days
    };
  }, [events, currentDate]);

  // Scroll to the selected date whenever it changes
  useEffect(() => {
    if (!listRef.current) return;

    const targetDateStr = format(currentDate, 'yyyy-MM-dd');
    let targetId = `group-${targetDateStr}`;
    
    // If exact date missing, find next closest
    if (!groupedEvents[targetDateStr]) {
        const nextDate = dates.find(d => d > targetDateStr);
        if (nextDate) {
            targetId = `group-${nextDate}`;
        }
    }

    // Small timeout to ensure DOM is fully rendered before scrolling
    const timer = setTimeout(() => {
        const el = document.getElementById(targetId);
        if (el) {
            el.scrollIntoView({ behavior: 'smooth', block: 'start' });
            
            // Trigger visual highlight
            const highlightKey = targetId.replace('group-', '');
            setHighlightedDate(highlightKey);
            setTimeout(() => setHighlightedDate(null), 2000); // Remove highlight after 2s
        }
    }, 100);

    return () => clearTimeout(timer);
  }, [currentDate, dates, groupedEvents]);

  const renderNowIndicator = (eventEnd: Date, nextEventStart: Date | null) => {
      if (!isSameDay(eventEnd, now)) return null;
      
      const nowTime = now.getTime();
      const endTime = eventEnd.getTime();
      const nextTime = nextEventStart ? nextEventStart.getTime() : Number.MAX_SAFE_INTEGER;

      if (nowTime >= endTime && nowTime < nextTime) {
          return (
              <div className="flex items-center pl-[72px] pr-4 py-2 opacity-80 group-now">
                  <div className="text-xs font-bold text-red-500 w-12 text-right pr-2">
                      {format(now, 'h:mm')}
                  </div>
                  <div className="flex-1 flex items-center">
                      <div className="w-2 h-2 rounded-full bg-red-500 shrink-0 shadow-sm animate-pulse"></div>
                      <div className="h-px bg-red-500 w-full shadow-[0_0_4px_rgba(239,68,68,0.4)]"></div>
                  </div>
              </div>
          );
      }
      return null;
  };

  if (dates.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 bg-white dark:bg-gray-900">
        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-6 animate-float">
           <CalendarDays className="w-10 h-10 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-bold text-gray-900 dark:text-white mb-1">Sin planes próximos</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400 max-w-xs mx-auto mb-8">
          Tu agenda está despejada. ¡Disfruta tu tiempo libre!
        </p>
        {onTimeSlotClick && (
            <button 
                onClick={() => onTimeSlotClick(currentDate)}
                className="px-6 py-2.5 bg-blue-600 dark:bg-blue-500 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-transform"
            >
                Nuevo evento
            </button>
        )}
      </div>
    );
  }

  return (
    <div ref={listRef} className="h-full overflow-y-auto bg-white dark:bg-black custom-scrollbar relative scroll-smooth pb-24">
      {!hasEventsInNext7Days && (
        <div className="mx-4 mt-6 mb-2 p-4 bg-gray-50 dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-2xl flex items-center justify-center text-center animate-fade-in-up">
            <div>
                <p className="text-sm font-semibold text-gray-600 dark:text-gray-300">Semana libre</p>
                <p className="text-xs text-gray-400 mt-1">Tus próximos eventos son más adelante.</p>
            </div>
        </div>
      )}

      {dates.map((dateStr, dateIdx) => {
        const dateObj = parse(dateStr, 'yyyy-MM-dd', new Date());
        const groupEvents = groupedEvents[dateStr];
        const isTodayDate = isToday(dateObj);
        const isTomorrowDate = isTomorrow(dateObj);
        const isHighlighted = highlightedDate === dateStr;
        
        return (
          // Added scroll-mt-24 to ensure the header doesn't get covered when scrolling
          <div key={dateStr} id={`group-${dateStr}`} className="relative z-10 scroll-mt-0 md:scroll-mt-0">
            
            {/* Sticky Header */}
            <div className={`
                sticky top-0 z-30 py-3 px-5 flex items-center shadow-sm transition-all duration-500
                ${isHighlighted 
                    ? 'bg-blue-50 dark:bg-blue-900/30 border-b border-blue-200 dark:border-blue-800' 
                    : 'bg-white/95 dark:bg-black/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800/50'}
            `}>
                <div className={`
                    w-9 h-9 flex items-center justify-center rounded-full text-lg font-bold mr-3 shadow-sm transition-transform duration-300
                    ${isTodayDate 
                        ? 'bg-red-500 text-white shadow-red-500/30' 
                        : 'bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white'}
                    ${isHighlighted ? 'scale-110' : ''}
                `}>
                    {format(dateObj, 'd')}
                </div>
                <div className="flex flex-col leading-none">
                    <span className={`text-xs font-bold uppercase tracking-wide mb-0.5 ${isTodayDate ? 'text-red-500' : 'text-gray-900 dark:text-white'}`}>
                        {isTodayDate ? 'Hoy' : (isTomorrowDate ? 'Mañana' : format(dateObj, 'EEEE', { locale: es }))}
                    </span>
                    <span className="text-[11px] font-medium text-gray-400 dark:text-gray-500 capitalize">
                        {format(dateObj, 'MMMM yyyy', { locale: es })}
                    </span>
                </div>
                {/* Total events badge */}
                <div className="ml-auto text-[10px] font-bold text-gray-400 bg-gray-50 dark:bg-gray-900 px-2 py-1 rounded-full">
                    {groupEvents.length}
                </div>
            </div>

            <div className={`py-2 transition-colors duration-500 ${isHighlighted ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}`}>
              {groupEvents.map((event, idx) => {
                const calendar = calendars.find(c => c.id === event.calendarId);
                const isLast = idx === groupEvents.length - 1;
                const nextEvent = !isLast ? groupEvents[idx + 1] : null;

                return (
                  <React.Fragment key={event.id}>
                      <div 
                          onClick={() => onEventClick(event)}
                          className="flex group cursor-pointer transition-colors relative"
                      >
                        {/* Time Column */}
                        <div className="w-[85px] flex-shrink-0 flex flex-col items-end pr-4 py-3.5">
                          {!event.isTask ? (
                              <>
                                <span className={`text-sm font-semibold tracking-tight ${isTodayDate && isBefore(event.end, now) ? 'text-gray-400 dark:text-gray-600' : 'text-gray-900 dark:text-white'}`}>
                                    {format(event.start, 'h:mm')}
                                </span>
                                <span className="text-[10px] text-gray-400 font-medium uppercase">
                                    {format(event.start, 'a')}
                                </span>
                              </>
                          ) : (
                              <div className="mt-1">
                                  <div className="w-2 h-2 rounded-full bg-gray-300 dark:bg-gray-700"></div>
                              </div>
                          )}
                        </div>
                        
                        {/* Event Content */}
                        <div className="flex-1 pr-4 py-1 min-w-0 relative">
                          <div className={`
                             relative rounded-[18px] p-3.5 w-full transition-all duration-200
                             ${event.isTask 
                                ? 'bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800' 
                                : 'bg-gray-100/50 dark:bg-gray-800/40 hover:bg-blue-50/50 dark:hover:bg-blue-900/10'
                             }
                          `}>
                             {/* Color Indicator Bar */}
                             {!event.isTask && (
                                <div 
                                    className="absolute left-0 top-3 bottom-3 w-1 rounded-r-full shadow-sm"
                                    style={{ backgroundColor: event.color }}
                                ></div>
                             )}

                             <div className={`flex items-start gap-3 ${!event.isTask ? 'pl-2' : ''}`}>
                                {event.isTask && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onToggleTaskCompletion) onToggleTaskCompletion(event);
                                        }}
                                        className={`mt-0.5 w-5 h-5 rounded-full border-2 flex items-center justify-center transition-all shrink-0 ${
                                            event.isCompleted 
                                            ? 'bg-blue-500 border-blue-500 text-white' 
                                            : 'border-gray-300 dark:border-gray-600 hover:border-blue-500'
                                        }`}
                                    >
                                        {event.isCompleted && <Check size={12} strokeWidth={4} />}
                                    </button>
                                )}

                                <div className="min-w-0 flex-1">
                                    <h4 className={`text-[15px] font-semibold leading-snug ${event.isCompleted ? 'text-gray-400 line-through' : 'text-gray-900 dark:text-white'}`}>
                                        {event.isBirthday && <Cake size={14} className="inline-block mr-1.5 -mt-0.5 text-pink-500" />}
                                        {event.title}
                                    </h4>
                                    
                                    <div className="flex flex-wrap items-center gap-2 mt-1">
                                        {!event.isTask && (
                                            <span className="text-xs text-gray-500 dark:text-gray-400 font-medium">
                                                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                            </span>
                                        )}
                                        
                                        {calendar && (
                                            <span 
                                                className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] tracking-wide"
                                                style={{ 
                                                    backgroundColor: `${calendar.color}15`,
                                                    color: calendar.color
                                                }}
                                            >
                                                {calendar.label}
                                            </span>
                                        )}

                                        {event.location && !event.isTask && (
                                            <span className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[120px]">
                                                • {event.location}
                                            </span>
                                        )}
                                    </div>
                                    
                                    {event.description && !event.isTask && (
                                        <p className="text-xs text-gray-400 dark:text-gray-500 mt-1.5 line-clamp-1">
                                            {event.description}
                                        </p>
                                    )}
                                </div>
                             </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Now Line Indicator */}
                      {renderNowIndicator(event.end, nextEvent ? nextEvent.start : null)}
                  </React.Fragment>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default AgendaView;