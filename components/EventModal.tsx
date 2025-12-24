
import React, { useState, useEffect, useRef } from 'react';
import { X, Clock, AlignLeft, Calendar as CalendarIcon, Trash2, Bell, Plus, ChevronDown, Cake, MapPin, CheckCircle2, Star, AlertTriangle, Repeat, Tag, Check, Users } from 'lucide-react';
import { CalendarEvent, RecurrenceType, CalendarConfig } from '../types';
import { EVENT_COLORS, REMINDER_OPTIONS, MOCK_LOCATIONS } from '../constants';
import { format, isValid, addDays, isBefore, parse } from 'date-fns';

export type DeleteMode = 'this' | 'following' | 'all';

interface EventModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSave: (event: Partial<CalendarEvent>) => void;
  onDelete?: (id: string, mode: DeleteMode) => void;
  initialDate?: Date;
  existingEvent?: CalendarEvent | null;
  calendars: CalendarConfig[];
}

const EventModal: React.FC<EventModalProps> = ({ 
  isOpen, 
  onClose, 
  onSave, 
  onDelete,
  initialDate, 
  existingEvent,
  calendars
}) => {
  const [type, setType] = useState<'event' | 'task'>('event');
  
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [startDate, setStartDate] = useState('');
  const [startTime, setStartTime] = useState('');
  const [endTime, setEndTime] = useState('');
  const [color, setColor] = useState(EVENT_COLORS[0]);
  const [recurrence, setRecurrence] = useState<RecurrenceType>('none');
  const [calendarId, setCalendarId] = useState<string>('user');
  const [reminderMinutes, setReminderMinutes] = useState<number[]>([]);
  const [location, setLocation] = useState('');
  
  const [isBirthday, setIsBirthday] = useState(false);
  const [isImportant, setIsImportant] = useState(false);

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [recurrenceWarning, setRecurrenceWarning] = useState<string | null>(null);

  const [showLocationSuggestions, setShowLocationSuggestions] = useState(false);
  const locationWrapperRef = useRef<HTMLDivElement>(null);

  const filteredLocations = MOCK_LOCATIONS.filter(loc => 
    loc.toLowerCase().includes(location.toLowerCase()) && loc !== location
  );

  useEffect(() => {
     const handleClickOutside = (e: MouseEvent) => {
         if (locationWrapperRef.current && !locationWrapperRef.current.contains(e.target as Node)) {
             setShowLocationSuggestions(false);
         }
     };
     document.addEventListener('mousedown', handleClickOutside);
     return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  useEffect(() => {
    if (isOpen) {
      setShowDeleteConfirm(false);
      setShowLocationSuggestions(false);
      setRecurrenceWarning(null);
      
      if (existingEvent) {
        setType(existingEvent.isTask ? 'task' : 'event');
        setTitle(existingEvent.title);
        setDescription(existingEvent.description || '');
        setStartDate(format(existingEvent.start, 'yyyy-MM-dd'));
        setStartTime(format(existingEvent.start, 'HH:mm'));
        setEndTime(format(existingEvent.end, 'HH:mm'));
        setColor(existingEvent.color);
        setRecurrence(existingEvent.recurrence || 'none');
        setCalendarId(existingEvent.calendarId || calendars[0]?.id || 'user');
        setIsBirthday(!!existingEvent.isBirthday);
        setLocation(existingEvent.location || '');
        setIsImportant(!!existingEvent.isImportant);
        
        const rawReminders = existingEvent.reminderMinutes;
        if (Array.isArray(rawReminders)) {
            setReminderMinutes(rawReminders);
        } else if (typeof rawReminders === 'number') {
            setReminderMinutes([rawReminders]);
        } else {
            setReminderMinutes([15]);
        }
      } else {
        let d = initialDate;
        if (!d || !isValid(d)) {
            d = new Date();
        }
        
        setTitle('');
        setDescription('');
        setStartDate(format(d, 'yyyy-MM-dd'));
        
        const now = new Date();
        const nextHour = new Date(now.setHours(now.getHours() + 1, 0, 0, 0));
        setStartTime(format(nextHour, 'HH:mm'));
        setEndTime(format(new Date(nextHour.setHours(nextHour.getHours() + 1)), 'HH:mm'));
        
        setRecurrence('none');
        setReminderMinutes([15]);
        setIsBirthday(false);
        setIsImportant(false);
        setLocation('');
        
        const defaultCal = calendars[0];
        setCalendarId(defaultCal?.id || 'user');
        setColor(defaultCal?.color || EVENT_COLORS[0]);
      }
    }
  }, [isOpen, existingEvent, initialDate, calendars]);

  useEffect(() => {
      if (type === 'task') {
          const taskCal = calendars.find(c => c.label === 'Tareas');
          if (taskCal) {
              setCalendarId(taskCal.id);
              setColor(taskCal.color);
          }
      } else if (!existingEvent && type === 'event') {
           const currentCal = calendars.find(c => c.id === calendarId);
           if (currentCal && currentCal.label === 'Tareas') {
                setCalendarId(calendars[0]?.id || 'user');
                setColor(calendars[0]?.color || EVENT_COLORS[0]);
           }
      }
  }, [type, calendars]);

  useEffect(() => {
    if (isBirthday) {
        setRecurrence('yearly');
        const bdayCal = calendars.find(c => c.label === 'Cumpleaños');
        if (bdayCal) {
            setCalendarId(bdayCal.id);
            setColor(bdayCal.color);
        }
    } else if (isOpen && !existingEvent) {
        setRecurrence('none');
    }
  }, [isBirthday, calendars, isOpen, existingEvent]);

  useEffect(() => {
    if (!startDate) {
        setRecurrenceWarning(null);
        return;
    }
    
    const date = parse(startDate, 'yyyy-MM-dd', new Date());
    if (!isValid(date)) return;

    const day = date.getDate();
    const month = date.getMonth();

    let warning = null;

    if (recurrence === 'monthly' && day > 28) {
        warning = `Nota: Como el evento inicia el día ${day}, se ajustará automáticamente al último día en meses que tengan menos días.`;
    } else if (recurrence === 'yearly' && month === 1 && day === 29) {
        warning = `Nota: Has seleccionado el 29 de Febrero. En años no bisiestos, el evento se pasará al 28 de Febrero.`;
    }

    setRecurrenceWarning(warning);
  }, [startDate, recurrence]);

  const handleCalendarChange = (newCalId: string) => {
    setCalendarId(newCalId);
    const cal = calendars.find(c => c.id === newCalId);
    if (cal) {
        setColor(cal.color);
    }
  };

  const handleAddReminder = () => {
    setReminderMinutes([...reminderMinutes, 10]);
  };

  const handleUpdateReminder = (index: number, value: number) => {
    const updated = [...reminderMinutes];
    updated[index] = value;
    setReminderMinutes(updated);
  };

  const handleRemoveReminder = (index: number) => {
    const updated = reminderMinutes.filter((_, i) => i !== index);
    setReminderMinutes(updated);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title || !startDate) return;
    
    const effectiveStartTime = isBirthday ? '09:00' : startTime;
    const effectiveEndTime = isBirthday ? '09:30' : endTime;

    if (!effectiveStartTime || !effectiveEndTime) return;

    const startDateTime = parse(`${startDate} ${effectiveStartTime}`, 'yyyy-MM-dd HH:mm', new Date());
    let endDateTime = parse(`${startDate} ${effectiveEndTime}`, 'yyyy-MM-dd HH:mm', new Date());

    if (!isValid(startDateTime) || !isValid(endDateTime)) return;

    if (isBefore(endDateTime, startDateTime)) {
        endDateTime = addDays(endDateTime, 1);
    }

    const cleanId = existingEvent?.id ? existingEvent.id.split('_')[0] : undefined;
    
    onSave({
      id: cleanId, 
      title,
      description,
      start: startDateTime,
      end: endDateTime,
      color,
      recurrence,
      calendarId,
      reminderMinutes,
      isBirthday,
      location,
      isTask: type === 'task',
      isCompleted: existingEvent?.isCompleted || false,
      isImportant: type === 'task' ? isImportant : undefined
    });
    onClose();
  };

  const handleDelete = (mode: DeleteMode) => {
     if (existingEvent && onDelete) {
        onDelete(existingEvent.id, mode);
        onClose();
     }
  };

  if (!isOpen) return null;

  if (showDeleteConfirm) {
    const isRecurring = existingEvent?.recurrence && existingEvent.recurrence !== 'none';
    return (
        <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all">
            <div className="bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl w-full max-w-sm overflow-hidden animate-scale-in border border-white/20 dark:border-white/10">
                {isRecurring ? (
                  <div className="flex flex-col">
                     <div className="px-6 py-4 border-b border-gray-200/50 dark:border-gray-700/50">
                        <h3 className="text-sm font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide text-center">Borrar evento recurrente</h3>
                     </div>
                     <div className="flex flex-col p-2 gap-1">
                        <button onClick={() => handleDelete('this')} className="w-full py-3 px-6 text-center text-blue-600 dark:text-blue-400 font-medium active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors">Este evento</button>
                        <button onClick={() => handleDelete('following')} className="w-full py-3 px-6 text-center text-blue-600 dark:text-blue-400 font-medium active:bg-gray-100 dark:active:bg-gray-700 rounded-xl transition-colors">Este y siguientes</button>
                        <button onClick={() => handleDelete('all')} className="w-full py-3 px-6 text-center text-red-500 font-medium active:bg-red-50 dark:active:bg-red-900/20 rounded-xl transition-colors">Todos los eventos</button>
                     </div>
                     <div className="p-2 border-t border-gray-200/50 dark:border-gray-700/50">
                        <button onClick={() => { setRecurrenceWarning(null); setShowDeleteConfirm(false); }} className="w-full bg-gray-100 dark:bg-gray-700 text-gray-800 dark:text-white rounded-xl py-3 font-bold active:scale-95 transition-transform">Cancelar</button>
                     </div>
                  </div>
                ) : (
                  <div className="p-6 text-center">
                      <div className="w-16 h-16 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                        <Trash2 className="w-8 h-8 text-red-500 dark:text-red-400" />
                      </div>
                      <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">¿Eliminar {type === 'task' ? 'tarea' : 'evento'}?</h3>
                      <p className="text-sm text-gray-500 dark:text-gray-400 mb-8 leading-relaxed">
                        Esta acción moverá el elemento a la papelera familiar.
                      </p>
                      <div className="flex gap-3 justify-center">
                          <button onClick={() => setShowDeleteConfirm(false)} className="flex-1 py-3 text-sm font-bold text-gray-700 dark:text-gray-200 bg-gray-100 dark:bg-gray-700 rounded-xl active:scale-95 transition-transform">Cancelar</button>
                          <button onClick={() => handleDelete('all')} className="flex-1 py-3 text-sm font-bold text-white bg-red-500 hover:bg-red-600 rounded-xl shadow-lg shadow-red-500/30 active:scale-95 transition-transform">Eliminar</button>
                      </div>
                  </div>
                )}
            </div>
        </div>
    );
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-md p-4 transition-all">
      <div className="bg-white/95 dark:bg-gray-900/95 backdrop-blur-2xl rounded-[28px] shadow-2xl w-full max-w-[500px] flex flex-col max-h-[90vh] md:max-h-[85vh] animate-scale-in border border-white/20 dark:border-gray-700 overflow-hidden relative">
        
        <div className="flex items-center justify-between px-5 py-4 shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-md sticky top-0 z-20">
          <button onClick={onClose} className="text-ios-blue dark:text-blue-400 hover:text-gray-800 transition-colors text-sm font-bold">
             Cancelar
          </button>
          
          <div className="flex items-center gap-3">
             {existingEvent && onDelete && (
                <button type="button" onClick={() => setShowDeleteConfirm(true)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-full transition-colors active:scale-90">
                    <Trash2 size={20} />
                </button>
            )}
             <button onClick={handleSubmit} className="px-5 py-2 bg-black dark:bg-white text-white dark:text-black rounded-full text-sm font-bold shadow-lg active:scale-95 transition-transform">
                {existingEvent ? 'Actualizar' : 'Agendar'}
             </button>
          </div>
        </div>

        <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-8 pt-2">
            
            <div className="mb-6">
                 {!existingEvent && (
                    <div className="flex p-1 bg-gray-200/50 dark:bg-gray-800 rounded-lg mb-4 w-full max-w-[200px] relative">
                        <div 
                            className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-gray-600 rounded-[6px] shadow-sm transition-all duration-300 ease-out`}
                            style={{ 
                                left: type === 'event' ? '4px' : 'calc(50% + 0px)' 
                            }}
                        ></div>
                        <button 
                            onClick={() => setType('event')}
                            className={`flex-1 relative z-10 py-1 text-xs font-semibold text-center transition-colors duration-200 ${type === 'event' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Evento
                        </button>
                        <button 
                            onClick={() => setType('task')}
                            className={`flex-1 relative z-10 py-1 text-xs font-semibold text-center transition-colors duration-200 ${type === 'task' ? 'text-black dark:text-white' : 'text-gray-500 dark:text-gray-400'}`}
                        >
                            Tarea
                        </button>
                    </div>
                 )}

                 <input 
                    type="text" 
                    placeholder={type === 'task' ? "Título de la tarea familiar" : (isBirthday ? "Cumpleaños de..." : "Título del evento")}
                    className="w-full text-3xl font-bold bg-transparent border-none p-0 outline-none text-gray-900 dark:text-white placeholder-gray-300 dark:placeholder-gray-600"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    autoFocus
                 />
            </div>

            <div className="space-y-4">
                
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-center justify-between">
                         <div className="flex items-center gap-3">
                             <div className="w-8 h-8 rounded-full bg-pink-100 dark:bg-pink-900/30 flex items-center justify-center text-pink-500">
                                 <Cake size={16} />
                             </div>
                             <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Todo el día</span>
                         </div>
                         <div 
                             onClick={() => setIsBirthday(!isBirthday)}
                             className={`w-12 h-7 rounded-full p-1 transition-colors cursor-pointer ${isBirthday ? 'bg-ios-blue' : 'bg-gray-300 dark:bg-gray-600'}`}
                         >
                             <div className={`w-5 h-5 bg-white rounded-full shadow-sm transition-transform ${isBirthday ? 'translate-x-5' : 'translate-x-0'}`}></div>
                         </div>
                    </div>

                    <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50"></div>

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-red-100 dark:bg-red-900/30 flex items-center justify-center text-red-500 shrink-0">
                             <Clock size={16} />
                        </div>
                        <div className="flex-1 flex flex-col gap-2">
                             <div className="flex items-center justify-between bg-white dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600">
                                 <input 
                                    type="date" 
                                    value={startDate}
                                    onChange={(e) => setStartDate(e.target.value)}
                                    className="bg-transparent text-gray-800 dark:text-white text-sm font-medium outline-none w-full"
                                 />
                             </div>

                             {!isBirthday && (
                                <div className="flex items-center gap-2">
                                     <div className="flex-1 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600">
                                        <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="bg-transparent text-gray-800 dark:text-white text-sm font-medium outline-none w-full" />
                                     </div>
                                     <span className="text-gray-400">→</span>
                                     <div className="flex-1 bg-white dark:bg-gray-700 rounded-xl px-3 py-2 border border-gray-200 dark:border-gray-600">
                                        <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="bg-transparent text-gray-800 dark:text-white text-sm font-medium outline-none w-full" />
                                     </div>
                                </div>
                             )}
                        </div>
                    </div>

                    {type === 'event' && (
                        <>
                            <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50"></div>
                            <div className="flex items-center gap-3">
                                <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-600 dark:text-gray-300 shrink-0">
                                    <Repeat size={16} />
                                </div>
                                <div className="relative flex-1">
                                    <select 
                                        value={recurrence}
                                        onChange={(e) => setRecurrence(e.target.value as RecurrenceType)}
                                        disabled={isBirthday}
                                        className="w-full bg-transparent text-gray-800 dark:text-white text-sm font-semibold outline-none appearance-none pr-8 py-1"
                                    >
                                        <option value="none">No se repite</option>
                                        <option value="daily">Todos los días</option>
                                        <option value="weekly">Cada semana</option>
                                        <option value="monthly">Cada mes</option>
                                        <option value="yearly">Cada año</option>
                                    </select>
                                    {!isBirthday && <ChevronDown size={14} className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 pointer-events-none" />}
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="py-2 animate-fade-in-up">
                    <p className="text-[11px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 px-1 flex items-center gap-2">
                       <Users size={12} /> ¿Para quién es este evento?
                    </p>
                    <div className="flex gap-2 overflow-x-auto custom-scrollbar pb-2 -mx-1 px-1">
                        {calendars.map((cal) => {
                            const isSelected = calendarId === cal.id;
                            return (
                                <button
                                    key={cal.id}
                                    type="button"
                                    onClick={() => handleCalendarChange(cal.id)}
                                    className={`
                                        flex items-center gap-2 px-3.5 py-2 rounded-full border shrink-0 transition-all duration-300
                                        ${isSelected 
                                            ? 'shadow-md scale-105' 
                                            : 'border-gray-100 dark:border-gray-800 bg-white/50 dark:bg-gray-800/30 text-gray-500 dark:text-gray-400 hover:bg-white dark:hover:bg-gray-800'}
                                    `}
                                    style={{
                                        borderColor: isSelected ? cal.color : undefined,
                                        backgroundColor: isSelected ? `${cal.color}15` : undefined,
                                        color: isSelected ? cal.color : undefined
                                    }}
                                >
                                    <div 
                                        className="w-2.5 h-2.5 rounded-full shrink-0" 
                                        style={{ backgroundColor: cal.color }}
                                    ></div>
                                    <span className="text-xs font-bold truncate">{cal.label}</span>
                                    {isSelected && <Check size={12} strokeWidth={4} />}
                                </button>
                            );
                        })}
                    </div>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 space-y-4 border border-gray-100 dark:border-gray-700/50">
                    {type === 'event' && (
                        <div className="flex items-start gap-3">
                            <div className="w-8 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center text-orange-500 shrink-0">
                                <MapPin size={16} />
                            </div>
                            <div className="flex-1 relative" ref={locationWrapperRef}>
                                <input 
                                    type="text" 
                                    placeholder="Lugar familiar"
                                    value={location}
                                    onChange={(e) => { setLocation(e.target.value); setShowLocationSuggestions(true); }}
                                    onFocus={() => setShowLocationSuggestions(true)}
                                    className="w-full bg-transparent text-gray-800 dark:text-white text-sm font-medium outline-none py-1.5 placeholder-gray-400"
                                />
                                {showLocationSuggestions && location.length > 0 && filteredLocations.length > 0 && (
                                    <div className="absolute top-full left-0 right-0 mt-2 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 z-50 overflow-hidden max-h-40 overflow-y-auto">
                                        {filteredLocations.map(loc => (
                                            <button key={loc} type="button" onClick={() => { setLocation(loc); setShowLocationSuggestions(false); }} className="w-full text-left px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 flex items-center gap-2 border-b border-gray-50 dark:border-gray-700 last:border-0">
                                                <MapPin size={14} className="text-gray-400" /> {loc}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        </div>
                    )}
                    
                    {type === 'event' && <div className="w-full h-px bg-gray-200 dark:bg-gray-700/50"></div>}

                    <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center text-gray-500 shrink-0">
                            <AlignLeft size={16} />
                        </div>
                        <textarea 
                            placeholder="Notas familiares o descripción..."
                            value={description}
                            onChange={(e) => setDescription(e.target.value)}
                            rows={2}
                            className="flex-1 bg-transparent border-none text-sm font-medium outline-none resize-none text-gray-800 dark:text-white placeholder-gray-400 py-1.5"
                        />
                    </div>
                </div>

                {type === 'event' && (
                    <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-4 border border-gray-100 dark:border-gray-700/50">
                        <div className="flex flex-col gap-3">
                            {reminderMinutes.map((reminder, index) => (
                                <div key={index} className="flex items-center gap-3 animate-fade-in-up">
                                    <div className="w-8 h-8 rounded-full bg-yellow-100 dark:bg-yellow-900/30 flex items-center justify-center text-yellow-600 shrink-0">
                                        <Bell size={16} />
                                    </div>
                                    <div className="flex-1 relative">
                                        <select value={reminder} onChange={(e) => handleUpdateReminder(index, Number(e.target.value))} className="w-full bg-transparent text-gray-800 dark:text-white text-sm font-semibold outline-none appearance-none py-1">
                                            {REMINDER_OPTIONS.map(opt => <option key={opt.value} value={opt.value}>{opt.label}</option>)}
                                        </select>
                                    </div>
                                    <button type="button" onClick={() => handleRemoveReminder(index)} className="p-1 text-gray-400 hover:text-red-500"><X size={16} /></button>
                                </div>
                            ))}
                            <button type="button" onClick={handleAddReminder} className="flex items-center gap-3 text-sm text-blue-600 dark:text-blue-400 font-bold py-1 w-fit group">
                                <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center group-hover:bg-blue-100 transition-colors">
                                    <Plus size={16} />
                                </div>
                                <span>Añadir alerta familiar</span>
                            </button>
                        </div>
                    </div>
                )}
            </div>
            
            {recurrenceWarning && (
                <div className="mt-4 p-3 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-800 rounded-xl flex gap-3 items-start animate-scale-in">
                    <AlertTriangle className="w-5 h-5 text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" />
                    <p className="text-xs text-amber-700 dark:text-amber-300 leading-relaxed font-medium">{recurrenceWarning}</p>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default EventModal;
