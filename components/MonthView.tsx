import React, { useState, useRef, useEffect } from 'react';
import { format, isSameMonth, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarEvent, ViewProps } from '../types';
import { getMonthDays } from '../utils/dateUtils';
import { Clock, Check, Cake } from 'lucide-react';

const MonthView: React.FC<ViewProps> = ({ currentDate, events, calendars, onEventClick, onTimeSlotClick, onToggleTaskCompletion }) => {
  const days = getMonthDays(currentDate);
  const weekDays = ['DOM', 'LUN', 'MAR', 'MIÉ', 'JUE', 'VIE', 'SÁB'];

  const [previewData, setPreviewData] = useState<{ date: Date; rect: DOMRect } | null>(null);
  const hoverTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const closeTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleMouseEnter = (day: Date, e: React.MouseEvent<HTMLDivElement>) => {
    if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
    if (previewData && isSameDay(previewData.date, day)) return;

    const rect = e.currentTarget.getBoundingClientRect();
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);

    hoverTimeoutRef.current = setTimeout(() => {
      setPreviewData({ date: day, rect });
    }, 600);
  };

  const handleMouseLeave = () => {
    if (hoverTimeoutRef.current) clearTimeout(hoverTimeoutRef.current);
    closeTimeoutRef.current = setTimeout(() => {
        setPreviewData(null);
    }, 300);
  };

  const handlePopupMouseEnter = () => {
     if (closeTimeoutRef.current) clearTimeout(closeTimeoutRef.current);
  };

  const handlePopupMouseLeave = () => {
      closeTimeoutRef.current = setTimeout(() => {
        setPreviewData(null);
    }, 300);
  };

  const getCalendarName = (calendarId: string) => {
    return calendars.find(c => c.id === calendarId)?.label || '';
  };

  useEffect(() => {
    const handleScroll = () => setPreviewData(null);
    window.addEventListener('scroll', handleScroll, true);
    return () => window.removeEventListener('scroll', handleScroll, true);
  }, []);

  const renderPreview = () => {
    if (!previewData) return null;

    const { date, rect } = previewData;
    const dayEvents = events.filter(e => isSameDay(e.start, date));
    dayEvents.sort((a, b) => a.start.getTime() - b.start.getTime());

    let left = rect.right + 10;
    let top = rect.top;

    const PREVIEW_WIDTH = 300;
    if (left + PREVIEW_WIDTH > window.innerWidth) {
      left = rect.left - PREVIEW_WIDTH - 10;
    }

    const PREVIEW_HEIGHT_EST = Math.min(dayEvents.length * 55 + 60, 450);
    if (top + PREVIEW_HEIGHT_EST > window.innerHeight) {
        top = window.innerHeight - PREVIEW_HEIGHT_EST - 20;
    }

    return (
      <div 
        className="fixed z-[60] bg-white/80 dark:bg-gray-800/80 backdrop-blur-xl rounded-2xl shadow-premium dark:shadow-premium-dark border border-white/20 dark:border-white/10 p-4 flex flex-col animate-scale-in origin-top-left"
        style={{ 
          left, 
          top, 
          width: PREVIEW_WIDTH,
          maxHeight: '450px'
        }}
        onMouseEnter={handlePopupMouseEnter}
        onMouseLeave={handlePopupMouseLeave}
      >
        <div className="flex items-center justify-between mb-3 pb-2 border-b border-gray-100 dark:border-gray-700/50">
           <div className="flex flex-col">
             <span className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">
                {format(date, 'EEEE', { locale: es })}
             </span>
             <span className="text-xl font-bold text-gray-800 dark:text-white capitalize tracking-tight">
                {format(date, 'd MMMM', { locale: es })}
             </span>
           </div>
           <span className="text-xs font-semibold bg-gray-100 dark:bg-gray-700/50 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-full">
             {dayEvents.length}
           </span>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar space-y-2">
           {dayEvents.length === 0 ? (
             <div className="flex flex-col items-center justify-center py-6 text-gray-400">
               <span className="text-sm">Sin eventos</span>
             </div>
           ) : (
             dayEvents.map(event => {
               const calName = getCalendarName(event.calendarId);
               
               return (
                <div 
                  key={event.id}
                  className="group flex items-start gap-3 p-2.5 hover:bg-gray-50/80 dark:hover:bg-gray-700/30 rounded-xl cursor-pointer transition-all duration-200"
                  onClick={() => {
                    onEventClick(event);
                    setPreviewData(null);
                  }}
                >
                  {event.isTask ? (
                      <button
                          onClick={(e) => {
                              e.stopPropagation();
                              if (onToggleTaskCompletion) onToggleTaskCompletion(event);
                          }}
                          className="mt-0.5 transition-transform active:scale-95"
                      >
                          {event.isCompleted ? (
                              <div className="bg-blue-600 rounded-full text-white p-0.5 w-4 h-4 flex items-center justify-center shadow-sm">
                                  <Check size={10} strokeWidth={3} />
                              </div>
                          ) : (
                              <div className="w-4 h-4 rounded-full border-2 border-gray-300 dark:border-gray-500 hover:border-blue-500 dark:hover:border-blue-400 transition-colors"></div>
                          )}
                      </button>
                  ) : (
                      <div className="w-1.5 h-1.5 rounded-full mt-2 shadow-[0_0_8px] opacity-80" style={{ backgroundColor: event.color, shadowColor: event.color } as React.CSSProperties}></div>
                  )}
                  <div className="flex-1 min-w-0">
                      <h5 className={`text-sm font-medium text-gray-800 dark:text-gray-200 truncate leading-tight ${event.isCompleted ? 'line-through text-gray-400' : ''}`}>
                          {event.isBirthday && <Cake size={12} className="inline mr-1.5 text-pink-500" />}
                          {event.title}
                      </h5>
                      {!event.isTask && (
                          <div className="flex flex-col gap-0.5 mt-1">
                              <div className="flex items-center gap-1 text-xs text-gray-500 dark:text-gray-400 font-medium">
                                  <Clock size={10} />
                                  <span>{format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}</span>
                              </div>
                              {calName && (
                                <span className="text-[9px] text-gray-400 dark:text-gray-500 font-semibold uppercase tracking-wide">
                                  {calName}
                                </span>
                              )}
                          </div>
                      )}
                  </div>
                </div>
               );
             })
           )}
        </div>
      </div>
    );
  };

  return (
    <div className="flex flex-col h-full bg-transparent relative rounded-3xl overflow-hidden">
      {/* Weekday Header */}
      <div className="grid grid-cols-7 border-b border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-900/50 backdrop-blur-sm">
        {weekDays.map(day => (
          <div key={day} className="py-4 text-center text-[10px] font-bold text-gray-400 dark:text-gray-500 tracking-widest uppercase">
            {day}
          </div>
        ))}
      </div>
      
      {/* Calendar Grid */}
      <div className="flex-1 grid grid-cols-7 grid-rows-5 md:grid-rows-5 lg:grid-rows-6 gap-px bg-gray-100/50 dark:bg-gray-800/30">
        {days.map((day, idx) => {
          const isCurrentMonth = isSameMonth(day, currentDate);
          const isToday = isSameDay(day, new Date());
          const dayEvents = events.filter(e => isSameDay(e.start, day));
          
          return (
            <div 
              key={day.toString()} 
              className={`
                min-h-[100px] p-1.5 md:p-2 flex flex-col relative group transition-all duration-300
                ${isCurrentMonth ? 'bg-white/40 dark:bg-gray-900/40' : 'bg-gray-50/30 dark:bg-black/20'}
                hover:bg-white/80 dark:hover:bg-gray-800/60 cursor-pointer
                ${isToday && isCurrentMonth ? 'bg-blue-50/30 dark:bg-blue-900/10' : ''}
              `}
              onClick={() => onTimeSlotClick && onTimeSlotClick(day)}
              onMouseEnter={(e) => handleMouseEnter(day, e)}
              onMouseLeave={handleMouseLeave}
            >
              <div className="flex justify-center mb-1.5 md:mb-2">
                <span className={`
                  text-xs font-bold w-7 h-7 flex items-center justify-center rounded-full transition-all duration-300
                  ${isToday 
                    ? 'bg-gradient-to-tr from-blue-600 to-indigo-500 text-white shadow-lg shadow-blue-500/30 scale-110' 
                    : isCurrentMonth ? 'text-gray-700 dark:text-gray-300' : 'text-gray-400 dark:text-gray-600'}
                `}>
                  {format(day, 'd')}
                </span>
              </div>
              
              <div className="flex-1 space-y-1 overflow-hidden">
                {dayEvents.slice(0, 3).map(event => (
                  <button
                    key={event.id}
                    onClick={(e) => {
                        e.stopPropagation();
                        onEventClick(event);
                    }}
                    className={`
                        w-full text-left px-2 py-1 rounded-[6px] text-[10px] sm:text-[11px] font-medium truncate flex items-center gap-1.5 transition-all
                        hover:scale-[1.03] hover:brightness-110 active:scale-95
                        backdrop-blur-[1px]
                        ${event.isTask 
                            ? `bg-white/90 border border-gray-200/50 text-gray-600 dark:bg-gray-800/80 dark:border-gray-700 dark:text-gray-300 ${event.isCompleted ? 'line-through opacity-50' : ''}` 
                            : 'text-white border border-white/20 shadow-sm'}
                    `}
                    style={{ 
                        backgroundColor: event.isTask ? undefined : `${event.color}D9`, // ~85% opacity
                        boxShadow: event.isTask ? undefined : `0 2px 4px ${event.color}30`
                    }}
                  >
                    {event.isTask && (
                        <div className={`w-1.5 h-1.5 rounded-full flex-shrink-0 ${event.isCompleted ? 'bg-gray-400' : 'border border-gray-400'}`}></div>
                    )}
                    {event.isBirthday && <Cake size={10} className="shrink-0" />}
                    <span className="truncate tracking-tight opacity-95">{event.title}</span>
                  </button>
                ))}
                {dayEvents.length > 3 && (
                   <span className="block text-center text-[9px] font-bold text-gray-400 dark:text-gray-500 hover:text-blue-500 dark:hover:text-blue-400 transition-colors mt-1">
                     +{dayEvents.length - 3} más
                   </span>
                )}
              </div>
            </div>
          );
        })}
      </div>
      {renderPreview()}
    </div>
  );
};

export default MonthView;