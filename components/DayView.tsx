import React, { useEffect, useRef, useState, useMemo } from 'react';
import { format, differenceInMinutes, isSameDay } from 'date-fns';
import startOfDay from 'date-fns/startOfDay';
import { es } from 'date-fns/locale';
import { ViewProps, CalendarEvent } from '../types';
import { TIME_ZONES } from '../constants';
import { Check } from 'lucide-react';

interface ArrangedEvent extends CalendarEvent {
  top: number;
  height: number;
  left: number;
  width: number;
}

const DayView: React.FC<ViewProps> = ({ currentDate, events, calendars, onEventClick, onTimeSlotClick, timeZoneConfig, onToggleTaskCompletion }) => {
  const hours = Array.from({ length: 24 }).map((_, i) => i);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const [now, setNow] = useState(new Date());

  useEffect(() => {
    const interval = setInterval(() => setNow(new Date()), 60000);
    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
     if (scrollContainerRef.current && isSameDay(currentDate, now)) {
         const currentHour = new Date().getHours();
         const scrollPosition = Math.max(0, (currentHour - 2) * 60);
         scrollContainerRef.current.scrollTo({
             top: scrollPosition,
             behavior: 'smooth'
         });
     }
  }, [currentDate]);

  const arrangedEvents = useMemo(() => {
    const dayEvents = events.filter(e => isSameDay(e.start, currentDate));
    
    dayEvents.sort((a, b) => {
        if (a.start.getTime() === b.start.getTime()) {
            return b.end.getTime() - a.end.getTime();
        }
        return a.start.getTime() - b.start.getTime();
    });

    const result: ArrangedEvent[] = [];
    
    const processedEvents = dayEvents.map(e => ({
        ...e,
        top: e.start.getHours() * 60 + e.start.getMinutes(),
        height: Math.max(differenceInMinutes(e.end, e.start), 30),
        startMs: e.start.getTime(),
        endMs: e.end.getTime()
    }));

    const groups: (typeof processedEvents)[] = [];
    
    processedEvents.forEach(event => {
        const group = groups.find(g => g.some(existing => 
             event.startMs < existing.endMs && event.endMs > existing.startMs
        ));

        if (group) {
            group.push(event);
        } else {
            groups.push([event]);
        }
    });

    groups.forEach(group => {
        const lanes: (typeof processedEvents)[] = [];
        
        group.forEach(event => {
            let placed = false;
            for (let i = 0; i < lanes.length; i++) {
                const lastInLane = lanes[i][lanes[i].length - 1];
                if (event.startMs >= lastInLane.endMs) {
                    lanes[i].push(event);
                    placed = true;
                    break;
                }
            }
            if (!placed) {
                lanes.push([event]);
            }
        });

        const totalLanes = lanes.length;
        
        lanes.forEach((lane, laneIndex) => {
            lane.forEach(event => {
                 result.push({
                    ...event,
                    left: (laneIndex / totalLanes) * 100,
                    width: 100 / totalLanes
                });
            });
        });
    });

    return result;

  }, [events, currentDate]);

  const hasSecondaryTZ = timeZoneConfig?.showSecondary && timeZoneConfig?.secondary;
  const secondaryLabel = hasSecondaryTZ ? TIME_ZONES.find(tz => tz.value === timeZoneConfig.secondary)?.label.split(')')[0] + ')' : '';

  const getCalendarName = (id: string) => calendars.find(c => c.id === id)?.label || '';

  return (
    <div className="flex flex-col h-full bg-white dark:bg-gray-900 overflow-hidden">
      <div className={`${hasSecondaryTZ ? 'pl-28' : 'pl-14'} border-b border-gray-200 dark:border-gray-700 py-3 shrink-0`}>
         <div className="text-sm text-gray-500 dark:text-gray-400 font-medium uppercase">{format(currentDate, 'EEEE', { locale: es })}</div>
         <div className="text-2xl text-gray-800 dark:text-white capitalize">{format(currentDate, 'MMMM d, yyyy', { locale: es })}</div>
      </div>

      <div 
        ref={scrollContainerRef}
        className="flex-1 overflow-y-auto relative custom-scrollbar"
      >
         <div className="flex relative min-h-[1440px]">
            <div className={`flex-shrink-0 flex bg-white dark:bg-gray-900 border-r border-gray-200 dark:border-gray-700 z-10 sticky left-0 ${hasSecondaryTZ ? 'w-28' : 'w-14'}`}>
                
                 {hasSecondaryTZ && (
                    <div className="w-14 border-r border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900 flex flex-col">
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
                  {hours.map(hour => (
                      <div key={hour} className="h-[60px] relative">
                          <span className="absolute -top-3 right-2 text-xs text-gray-500 dark:text-gray-400 bg-white dark:bg-gray-900 px-1">
                              {hour === 0 ? '' : format(new Date().setHours(hour, 0, 0, 0), 'h a')}
                          </span>
                      </div>
                  ))}
                </div>
            </div>

            <div 
                className="flex-1 relative cursor-pointer"
                onClick={() => onTimeSlotClick && onTimeSlotClick(startOfDay(currentDate))}
            >
                <div className="absolute inset-0 flex flex-col pointer-events-none">
                    {hours.map(h => (
                        <div key={h} className="h-[60px] border-b border-gray-100 dark:border-gray-800 w-full"></div>
                    ))}
                </div>
                
                {isSameDay(currentDate, now) && (
                    <div 
                    className="absolute left-0 right-0 z-50 pointer-events-none flex items-center"
                    style={{ top: `${now.getHours() * 60 + now.getMinutes()}px` }}
                    >
                        <div className="absolute left-0 w-full border-t border-red-500 shadow-[0_0_6px_rgba(239,68,68,0.4)]"></div>
                        <div className="absolute -left-1.5 w-3 h-3 bg-red-500 rounded-full shadow-[0_0_10px_rgba(239,68,68,0.8)] animate-pulse"></div>
                    </div>
                )}

                {arrangedEvents.map(event => (
                    <div
                        key={event.id}
                        onClick={(e) => {
                            e.stopPropagation();
                            onEventClick(event);
                        }}
                        className="absolute rounded-lg border-l-4 shadow-sm hover:shadow-xl transition-all hover:z-40 cursor-pointer overflow-hidden group backdrop-blur-[1px]"
                        style={{
                            top: `${event.top}px`,
                            height: `${event.height}px`,
                            left: `${event.left}%`,
                            width: `${event.width}%`,
                            backgroundColor: event.isTask ? undefined : `${event.color}15`,
                            borderLeftColor: event.isTask ? 'transparent' : event.color,
                            paddingRight: '4px',
                            zIndex: 10
                        }}
                    >
                        <div className={`w-full h-full px-3 py-2 relative ${event.isTask ? 'bg-blue-50 dark:bg-blue-900/40 border border-blue-200 dark:border-blue-800/50 rounded' : ''}`}>
                            <div className="flex items-start gap-2">
                                {event.isTask && (
                                    <button
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (onToggleTaskCompletion) onToggleTaskCompletion(event);
                                        }}
                                        className="mt-0.5 shrink-0 z-20"
                                    >
                                        {event.isCompleted ? (
                                            <div className="bg-blue-600 rounded text-white p-0.5 w-3.5 h-3.5 flex items-center justify-center">
                                                <Check size={10} strokeWidth={4} />
                                            </div>
                                        ) : (
                                            <div className="w-3.5 h-3.5 rounded border border-gray-400 dark:border-gray-500"></div>
                                        )}
                                    </button>
                                )}
                                <div className="min-w-0">
                                    <div className={`text-sm font-semibold truncate leading-tight ${event.isTask ? 'text-gray-800 dark:text-gray-200' : ''} ${event.isCompleted ? 'line-through opacity-60' : ''}`} style={{ color: event.isTask ? undefined : event.color }}>
                                        {event.title}
                                    </div>
                                    <div className={`text-xs flex items-center gap-1 ${event.isTask ? 'text-gray-500' : 'text-gray-500 dark:text-gray-400'}`}>
                                        {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                                    </div>
                                    {!event.isTask && (
                                         <div className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5 truncate font-medium flex items-center gap-1">
                                            {getCalendarName(event.calendarId)}
                                            {event.location && (
                                                <span className="opacity-75">• {event.location}</span>
                                            )}
                                        </div>
                                    )}
                                </div>
                            </div>
                        </div>
                    </div>
                ))}
            </div>
         </div>
      </div>
    </div>
  );
};

export default DayView;