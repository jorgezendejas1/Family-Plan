import React, { useState, useRef, useEffect } from 'react';
import { X, Check, Trash2, Plus, MoreHorizontal, Star, Calendar, Eye, EyeOff, ListX } from 'lucide-react';
import { CalendarEvent, CalendarConfig } from '../types';
import { format, isToday, isTomorrow, isPast, isSameDay } from 'date-fns';
import { es } from 'date-fns/locale';

interface TaskPanelProps {
  isOpen: boolean;
  onClose: () => void;
  tasks: CalendarEvent[];
  calendars: CalendarConfig[];
  onToggleTask: (task: CalendarEvent) => void;
  onDeleteTask: (taskId: string) => void;
  onAddTask: (title: string, calendarId?: string) => void;
  onToggleImportance?: (task: CalendarEvent) => void;
  onEditTask: (task: CalendarEvent) => void;
  onChangeCalendar?: (taskId: string, calendarId: string) => void;
}

const TaskPanel: React.FC<TaskPanelProps> = ({ 
  isOpen, 
  onClose, 
  tasks, 
  calendars,
  onToggleTask, 
  onDeleteTask,
  onAddTask,
  onToggleImportance,
  onEditTask,
  onChangeCalendar
}) => {
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showCompleted, setShowCompleted] = useState(true);
  
  // Creation Calendar Selector State
  const [selectedCreateCalendarId, setSelectedCreateCalendarId] = useState<string>('');
  const [isCreateCalSelectorOpen, setIsCreateCalSelectorOpen] = useState(false);

  // List Item Calendar Selector State
  const [openSelectorTaskId, setOpenSelectorTaskId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const createCalSelectorRef = useRef<HTMLDivElement>(null);
  const listCalSelectorRef = useRef<HTMLDivElement>(null);

  // Initialize selected calendar to "Tareas" or first available
  useEffect(() => {
    if (!selectedCreateCalendarId && calendars.length > 0) {
        const defaultCal = calendars.find(c => c.label === 'Tareas') || calendars[0];
        setSelectedCreateCalendarId(defaultCal.id);
    }
  }, [calendars, selectedCreateCalendarId]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTaskTitle.trim()) return;
    onAddTask(newTaskTitle, selectedCreateCalendarId);
    setNewTaskTitle('');
    setTimeout(() => inputRef.current?.focus(), 0);
  };

  useEffect(() => {
    if (isOpen && tasks.length === 0 && inputRef.current) {
        inputRef.current.focus();
    }
  }, [isOpen]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) {
        setIsMenuOpen(false);
      }
      if (createCalSelectorRef.current && !createCalSelectorRef.current.contains(target)) {
        setIsCreateCalSelectorOpen(false);
      }
      if (listCalSelectorRef.current && !listCalSelectorRef.current.contains(target)) {
          // Only close if we clicked outside the current active selector
          // Note: This simple check closes it if we click anywhere else, which is fine
          setOpenSelectorTaskId(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const getTime = (d: Date | string) => (d instanceof Date ? d.getTime() : new Date(d).getTime());

  const pendingTasks = tasks.filter(t => !t.isCompleted).sort((a, b) => {
      const aImp = !!a.isImportant;
      const bImp = !!b.isImportant;
      if (aImp && !bImp) return -1;
      if (!aImp && bImp) return 1;
      return getTime(a.start) - getTime(b.start);
  });
  
  const completedTasks = tasks.filter(t => t.isCompleted).sort((a, b) => getTime(b.start) - getTime(a.start));

  const formatTaskDate = (date: Date | string) => {
    const d = date instanceof Date ? date : new Date(date);
    if (isToday(d)) return 'Hoy';
    if (isTomorrow(d)) return 'Mañana';
    if (d.getFullYear() === new Date().getFullYear()) return format(d, 'd MMM', { locale: es });
    return format(d, 'd MMM yyyy', { locale: es });
  };

  const handleDeleteAllCompleted = () => {
      if (window.confirm('¿Estás seguro de que quieres eliminar todas las tareas completadas?')) {
          completedTasks.forEach(task => onDeleteTask(task.id));
          setIsMenuOpen(false);
      }
  };

  const getCalendarColor = (id: string) => calendars.find(c => c.id === id)?.color || '#999';

  if (!isOpen) return null;

  return (
    <div className="flex flex-col h-full w-full bg-white dark:bg-gray-900 border-l border-gray-200 dark:border-gray-800 shadow-2xl relative">
      
      {/* Header Styled like iOS Reminders List Header */}
      <div className="pt-12 pb-2 px-6 flex justify-between items-start shrink-0 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl z-20">
         <div>
            <h2 className="text-3xl font-bold text-blue-600 dark:text-blue-500 tracking-tight">Tareas</h2>
            <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">{pendingTasks.length} pendientes</p>
         </div>
         <div className="flex gap-2 relative" ref={menuRef}>
             <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-2 rounded-full transition-colors ${isMenuOpen ? 'bg-blue-100 dark:bg-blue-900/60 text-blue-600' : 'text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 hover:bg-blue-100 dark:hover:bg-blue-900/40'}`}
             >
                <MoreHorizontal size={20} />
             </button>
             
             {isMenuOpen && (
                 <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-scale-in origin-top-right">
                     <button 
                        onClick={() => { setShowCompleted(!showCompleted); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-4 py-3 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                     >
                        {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showCompleted ? 'Ocultar completadas' : 'Mostrar completadas'}
                     </button>
                     {completedTasks.length > 0 && (
                        <button 
                            onClick={handleDeleteAllCompleted}
                            className="w-full flex items-center gap-3 px-4 py-3 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-700"
                        >
                            <ListX size={16} />
                            Eliminar completadas
                        </button>
                     )}
                 </div>
             )}

             <button onClick={onClose} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors">
               <X size={20} />
             </button>
         </div>
      </div>

      {/* Input Area - Moved to Top */}
      <div className="px-6 py-2 shrink-0 z-10">
        <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Plus size={22} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
                ref={inputRef}
                type="text" 
                placeholder="Añadir nueva tarea..." 
                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-xl py-3 pl-11 pr-14 text-base font-medium text-gray-900 dark:text-white placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 transition-all outline-none"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                {/* Create Calendar Selector */}
                <div className="relative" ref={createCalSelectorRef}>
                    <button
                        type="button"
                        onClick={() => setIsCreateCalSelectorOpen(!isCreateCalSelectorOpen)}
                        className="w-6 h-6 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Seleccionar calendario"
                    >
                        <div 
                            className="w-2.5 h-2.5 rounded-full"
                            style={{ backgroundColor: getCalendarColor(selectedCreateCalendarId) }}
                        ></div>
                    </button>
                    {isCreateCalSelectorOpen && (
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-800 rounded-xl shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 max-h-64 overflow-y-auto">
                            {calendars.filter(c => c.visible).map(cal => (
                                <button
                                    key={cal.id}
                                    type="button"
                                    onClick={() => { setSelectedCreateCalendarId(cal.id); setIsCreateCalSelectorOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                                >
                                    <div className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: cal.color }}></div>
                                    <span className="truncate">{cal.label}</span>
                                    {selectedCreateCalendarId === cal.id && <Check size={14} className="ml-auto text-blue-500"/>}
                                </button>
                            ))}
                         </div>
                    )}
                </div>

                {newTaskTitle && (
                    <button 
                        type="submit" 
                        className="px-3 py-1 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors animate-scale-in"
                    >
                        Añadir
                    </button>
                )}
            </div>
        </form>
      </div>

      <div className="w-full h-px bg-gray-100 dark:bg-gray-800 mt-2"></div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12 pt-4" ref={listCalSelectorRef}>
         <div className="space-y-4">
             {pendingTasks.map(task => {
                 const cal = calendars.find(c => c.id === task.calendarId);
                 
                 return (
                 <div 
                    key={task.id} 
                    onClick={() => onEditTask(task)}
                    className="group flex items-start gap-4 py-3 border-b border-gray-100 dark:border-gray-800 last:border-0 cursor-pointer"
                 >
                     <button
                        onClick={(e) => { e.stopPropagation(); onToggleTask(task); }}
                        className="mt-1 w-6 h-6 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center shrink-0"
                     />
                     
                     <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between">
                             <span className={`text-base font-medium text-gray-900 dark:text-white leading-snug ${task.isImportant ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {task.isImportant && <span className="mr-1 text-blue-500">!</span>}
                                {task.title}
                             </span>
                             {task.isImportant && <Star size={12} className="text-yellow-500 fill-current mt-1 shrink-0 ml-2" />}
                         </div>
                         
                         <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-xs ${isPast(new Date(task.start)) && !isSameDay(new Date(task.start), new Date()) ? 'text-red-500 font-medium' : 'text-gray-500 dark:text-gray-400'}`}>
                                {formatTaskDate(task.start)}
                            </span>
                            
                            {/* Calendar Name Badge */}
                            {cal && (
                                <span 
                                    className="text-[10px] font-bold px-2 py-0.5 rounded-[6px] tracking-wide"
                                    style={{ 
                                        backgroundColor: `${cal.color}15`, // Subtle tint background
                                        color: cal.color 
                                    }}
                                >
                                    {cal.label}
                                </span>
                            )}

                            {task.description && <span className="text-xs text-gray-400 dark:text-gray-600 truncate max-w-[150px]">• {task.description}</span>}
                         </div>
                     </div>

                     <div className="flex items-center gap-1">
                        {/* List Item Calendar Selector */}
                        {onChangeCalendar && (
                            <div className="relative">
                                <button
                                    onClick={(e) => { e.stopPropagation(); setOpenSelectorTaskId(openSelectorTaskId === task.id ? null : task.id); }}
                                    className="p-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors opacity-0 group-hover:opacity-100"
                                    title="Cambiar calendario"
                                >
                                    <div className="w-2 h-2 rounded-full" style={{ backgroundColor: task.color }}></div>
                                </button>
                                {openSelectorTaskId === task.id && (
                                    <div className="absolute right-0 top-full mt-1 w-40 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-100 dark:border-gray-700 overflow-hidden z-[60] max-h-48 overflow-y-auto">
                                        {calendars.filter(c => c.visible).map(calItem => (
                                            <button
                                                key={calItem.id}
                                                onClick={(e) => { 
                                                    e.stopPropagation(); 
                                                    onChangeCalendar(task.id, calItem.id); 
                                                    setOpenSelectorTaskId(null); 
                                                }}
                                                className="w-full flex items-center gap-2 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors text-left"
                                            >
                                                <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: calItem.color }}></div>
                                                <span className="truncate">{calItem.label}</span>
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>
                        )}

                        <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
                            {onToggleImportance && (
                                <button onClick={(e) => { e.stopPropagation(); onToggleImportance(task); }} className={`p-1.5 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${task.isImportant ? 'text-yellow-500' : 'text-gray-400'}`}>
                                    <Star size={16} fill={task.isImportant ? "currentColor" : "none"} />
                                </button>
                            )}
                            <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                                <Trash2 size={16} />
                            </button>
                        </div>
                     </div>
                 </div>
                 );
             })}

             {pendingTasks.length === 0 && completedTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-10 text-center opacity-60">
                    <div className="w-16 h-16 bg-gray-100 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Check size={32} className="text-gray-400" />
                    </div>
                    <p className="text-gray-500 font-medium">No tienes tareas pendientes.</p>
                </div>
             )}

             {showCompleted && completedTasks.length > 0 && (
                 <div className="mt-8 animate-fade-in-up">
                     <h3 className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2">
                        Completadas 
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded text-[10px]">{completedTasks.length}</span>
                     </h3>
                     {completedTasks.map(task => (
                         <div key={task.id} className="flex items-center gap-4 py-2 opacity-50 hover:opacity-100 transition-opacity">
                             <button onClick={(e) => { e.stopPropagation(); onToggleTask(task); }} className="w-6 h-6 rounded-full bg-blue-500 flex items-center justify-center shrink-0">
                                 <Check size={14} className="text-white" strokeWidth={3} />
                             </button>
                             <span className="text-sm text-gray-500 line-through flex-1 truncate">{task.title}</span>
                             <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1.5 text-gray-400 hover:text-red-500"><Trash2 size={14} /></button>
                         </div>
                     ))}
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default TaskPanel;