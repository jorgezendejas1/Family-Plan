
import React, { useEffect, useRef, useState, useMemo } from 'react';
import { format, addDays, isSameDay, differenceInMinutes, isSameWeek, startOfWeek, startOfDay } from 'date-fns';
import { es } from 'date-fns/locale';
import { ViewProps, CalendarEvent } from '../types';
import { TIME_ZONES } from '../constants';
import { Check, Cake } from 'lucide-react';

interface PositionedEvent extends CalendarEvent {
    style: {
        top: string;
        height: string;
        left: string;
        width: string;
        zIndex: number;
    }
}

const WeekView: React.FC<ViewProps> = ({ currentDate, events, calendars, onEventClick, onTimeSlotClick, timeZoneConfig, onToggleTaskCompletion }) => {
  // Using startOfWeek as a named import
  const startOfCurrentWeek = startOfWeek(currentDate, { locale: es });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(startOfCurrentWeek, i));
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    if (scrollContainerRef.current && isSameWeek(currentDate, new Date(), { locale: es })) {
       const currentHour = new Date().getHours();
       const scrollPosition = Math.max(0, (currentHour - 2) * 60);
       scrollContainerRef.current.scrollTo({
           top: scrollPosition,
           behavior: 'smooth'
       });
    }
  }, [currentDate]);

  const hasSecondaryTZ = timeZoneConfig?.showSecondary && timeZoneConfig?.secondary;
  const secondaryLabel = hasSecondaryTZ ? TIME_ZONES.find(tz => tz.value === timeZoneConfig.secondary)?.label.split(')')[0] + ')' : '';

  const getCalendarName = (id: string) => calendars.find(c => c.id === id)?.label || '';

  // Logic to calculate lanes for overlapping events
  const getDayEvents = (day: Date): PositionedEvent[] => {
      const dayEvents = events.filter(e => isSameDay(e.start, day));
      
      // Sort by start time, then duration (longest first)
      dayEvents.sort((a, b) => {
          if (a.start.getTime() === b.start.getTime()) {
              return b.end.getTime() - a.end.getTime();
          }
          return a.start.getTime() - b.start.getTime();
      });

      const lanes: CalendarEvent[][] = [];
      const placedEvents: PositionedEvent[] = [];

      dayEvents.forEach(event => {
          let placed = false;
          // Try to find a lane where this event fits
          for (let i = 0; i < lanes.length; i++) {
              const lastInLane = lanes[i][lanes[i].length - 1];
              if (event.start.getTime() >= lastInLane.end.getTime()) {
                  lanes[i].push(event);
                  placed = true;
                  // Store lane index for calculations below
                  (event as any).laneIndex = i; 
                  break;
              }
          }
          if (!placed) {
              lanes.push([event]);
              (event as any).laneIndex = lanes.length - 1;
          }
      });

      return dayEvents.map(event => {
          const laneIndex = (event as any).laneIndex || 0;
          const totalLanes = lanes.length;
          const startMinutes = event.start.getHours() * 60 + event.start.getMinutes();
          const durationMinutes = differenceInMinutes(event.end, event.start);

          return {
              ...event,
              style: {
                  top: `${startMinutes}px`,
                  height: `${Math.max(durationMinutes, 25)}px`,
                  left: `${(laneIndex / totalLanes) * 100}%`,
                  width: `${100 / totalLanes}%`,
                  zIndex: 10 + laneIndex
              }
          };
      });
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      <div className={`flex border-b border-gray-200 dark:border-gray-700 ${hasSecondaryTZ ? 'ml-28' : 'ml-14'}`}>
        {weekDays.map(day => {
            const isToday = isSameDay(day, now);
            return (
                <div key={day.toString()} className="flex-1 py-3 text-center border-l border-gray-200 dark:border-gray-700 first:border-l-0">
                    <div className={`text-xs font-medium uppercase mb-1 ${isToday ? 'text-blue-600 dark:text-blue-400' : 'text-gray-500 dark:text-gray-400'}`}>
                        {format(day, 'EEE', { locale: es })}
                    </div>
                    <div className={`
                        text-2xl font-normal inline-block w-10 h-10 leading-10 rounded-full transition-all duration-300
                        ${isToday ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30 scale-105' : 'text-gray-700 dark:text-gray-200'}
                    `}>
                        {format(day, 'd')}
                    </div>
                </div>
            );
        })}
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative custom-scrollbar"
      >
         <div className="flex relative min-h-[1440px]"> 
            
            <div className={`flex-shrink-0 flex bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-20 sticky left-0 ${hasSecondaryTZ ? 'w-28' : 'w-14'}`}>
                
                {hasSecondaryTZ && (
                    <div className="w-14 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
                        <div className="h-6 text-[10px] text-center text-gray-400 py-1 font-bold truncate px-1 border-b border-gray-100 dark:border-gray-800" title={secondaryLabel}>
                            {secondaryLabel}
                        </div>
                         {hours.map(hour => {
                             const date = new Date();
                             date.setHours(hour, 0, 0, 0);
                             const timeString = date.toLocaleTimeString('en-US', { 
                                 hour: 'numeric', 
                                 hour12: false,
                                 timeZone: timeZoneConfig.secondary 
                             });
                             const displayHour = parseInt(timeString);
                             
                             return (
                                <div key={hour} className="h-[60px] relative">
                                    <span className="absolute -top-2 right-1 text-[10px] text-gray-400">
                                        {displayHour === 0 ? '24' : displayHour}
                                    </span>
                                </div>
                             );
                         })}
                    </div>
                )}

                <div className="w-14 flex flex-col relative">
                    {hasSecondaryTZ && (
                         <div className="h-6 text-[10px] text-center text-gray-400 py-1 font-bold border-b border-gray-100 dark:border-gray-800">
                            Local
                         </div>
                    )}
                    {hours.map(hour => (
                        <div key={hour} className="h-[60px] relative">
                             <span className="absolute -top-3 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-1">
                                 {hour === 0 ? '' : format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                             </span>
                             <div className="absolute top-0 right-0 w-2 border-t border-gray-200 dark:border-gray-700"></div>
                        </div>
                    ))}
                </div>
            </div>

            <div className="flex flex-1 relative">
                 <div className="absolute inset-0 flex">
                    {weekDays.map((_, i) => (
                        <div key={i} className="flex-1 border-l border-gray-100 dark:border-gray-800 first:border-l-0 h-full"></div>
                    ))}
                 </div>
                 
                 <div className="absolute inset-0 flex flex-col pt-0">
                    {hasSecondaryTZ && <div className="h-6"></div>}
                    {hours.map(h => (
                        <div key={h} className="h-[60px] border-b border-gray-100 dark:border-gray-800 w-full"></div>
                    ))}
                 </div>

                 {isSameWeek(currentDate, now, { locale: es }) && (
                     <div 
                        className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                        style={{ top: `${(now.getHours() * 60 + now.getMinutes()) + (hasSecondaryTZ ? 24 : 0)}px` }}
                     >
                         <div className="absolute left-0 w-full border-t border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"></div>
                         <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                     </div>
                 )}

                 <div className="absolute inset-0 flex pt-0">
                    {hasSecondaryTZ && <div className="w-full h-6 relative block"></div>}
                    
                    {weekDays.map((day, dayIndex) => {
                        const positionedEvents = getDayEvents(day);
                        
                        return (
                            <div 
                                key={dayIndex} 
                                className="flex-1 relative h-full cursor-pointer hover:bg-gray-50/30 dark:hover:bg-gray-800/30"
                                style={{ marginTop: hasSecondaryTZ ? '24px' : '0' }}
                                onClick={(e) => {
                                    // Using startOfDay as a named import
                                    onTimeSlotClick && onTimeSlotClick(addDays(startOfDay(day), 0)); 
                                }}
                            >
                                {positionedEvents.map(event => (
                                    <div
                                        key={event.id}
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            onEventClick(event);
                                        }}
                                        className={`absolute rounded shadow-sm px-1 py-0.5 overflow-hidden hover:z-50 hover:opacity-100 opacity-90 transition-all border group backdrop-blur-[1px]
                                            ${event.isTask 
                                                ? 'border-blue-200 bg-blue-50/90 dark:bg-blue-900/40' 
                                                : 'border-white/20 dark:border-gray-600/30'
                                            }
                                        `}
                                        style={{
                                            ...event.style,
                                            backgroundColor: event.isTask ? undefined : `${event.color}E6`, // Slight transparency
                                            boxShadow: event.isTask ? 'none' : `0 4px 6px -1px ${event.color}40`,
                                        }}
                                    >
                                        <div className={`flex items-start gap-1 ${event.isTask ? 'text-blue-900 dark:text-blue-100' : 'text-white'}`}>
                                            {event.isTask && (
                                                <button
                                                    onClick={(e) => {
                                                        e.stopPropagation();
                                                        if (onToggleTaskCompletion) onToggleTaskCompletion(event);
                                                    }}
                                                    className="mt-0.5 shrink-0"
                                                >
                                                    {event.isCompleted ? (
                                                        <div className="bg-blue-600 rounded text-white p-0.5 w-3 h-3 flex items-center justify-center">
                                                            <Check size={8} strokeWidth={4} />
                                                        </div>
                                                    ) : (
                                                        <div className="w-3 h-3 rounded border border-current"></div>
                                                    )}
                                                </button>
                                            )}
                                            {event.isBirthday && <Cake size={12} className="mt-0.5 shrink-0" />}
                                            <div className="min-w-0 flex flex-col">
                                                <div className={`text-[10px] font-semibold truncate leading-tight ${event.isCompleted ? 'line-through opacity-70' : ''}`}>
                                                    {event.title}
                                                </div>
                                                <div className={`text-[9px] truncate ${event.isCompleted ? 'opacity-50' : 'opacity-90'}`}>
                                                    {format(event.start, 'h:mm a')}
                                                </div>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        );
                    })}
                 </div>
             </div>
          </div>
        </div>
      </div>
    );
};

export default WeekView;