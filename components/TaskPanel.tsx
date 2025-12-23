
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
  
  const [selectedCreateCalendarId, setSelectedCreateCalendarId] = useState<string>('');
  const [isCreateCalSelectorOpen, setIsCreateCalSelectorOpen] = useState(false);
  const [openSelectorTaskId, setOpenSelectorTaskId] = useState<string | null>(null);

  const inputRef = useRef<HTMLInputElement>(null);
  const menuRef = useRef<HTMLDivElement>(null);
  const createCalSelectorRef = useRef<HTMLDivElement>(null);
  const listCalSelectorRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;
      if (menuRef.current && !menuRef.current.contains(target)) setIsMenuOpen(false);
      if (createCalSelectorRef.current && !createCalSelectorRef.current.contains(target)) setIsCreateCalSelectorOpen(false);
      if (listCalSelectorRef.current && !listCalSelectorRef.current.contains(target)) setOpenSelectorTaskId(null);
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
    <div className="flex flex-col h-full w-full bg-transparent relative">
      {/* Header: Sincronizado con Sidebar, pt-8 para bajar el título y darle aire */}
      <div className="pt-8 pb-4 px-6 flex justify-between items-start shrink-0 z-20">
         <div>
            <h2 className="text-xl font-bold text-gray-900 dark:text-white tracking-tight leading-none">Tareas</h2>
            <p className="text-gray-400 dark:text-gray-500 text-[10px] font-bold uppercase tracking-widest mt-1.5">{pendingTasks.length} pendientes</p>
         </div>
         <div className="flex gap-1 relative" ref={menuRef}>
             <button 
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className={`p-1.5 rounded-lg transition-colors ${isMenuOpen ? 'bg-gray-100 dark:bg-gray-800 text-blue-600' : 'text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
             >
                <MoreHorizontal size={18} />
             </button>
             
             {isMenuOpen && (
                 <div className="absolute right-0 top-full mt-2 w-56 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 animate-pop-over origin-top-right p-1.5">
                    <button 
                        onClick={() => { setShowCompleted(!showCompleted); setIsMenuOpen(false); }}
                        className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors rounded-xl"
                    >
                        {showCompleted ? <EyeOff size={16} /> : <Eye size={16} />}
                        {showCompleted ? 'Ocultar completadas' : 'Mostrar completadas'}
                    </button>
                    {completedTasks.length > 0 && (
                        <button 
                            onClick={handleDeleteAllCompleted}
                            className="w-full flex items-center gap-3 px-3 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors border-t border-gray-100 dark:border-gray-800 rounded-xl mt-1"
                        >
                            <ListX size={16} />
                            Eliminar completadas
                        </button>
                    )}
                 </div>
             )}

             <button onClick={onClose} className="p-1.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-90">
               <X size={18} />
             </button>
         </div>
      </div>

      {/* Input Area */}
      <div className="px-6 py-2 shrink-0 z-10">
        <form onSubmit={handleSubmit} className="relative group">
            <div className="absolute inset-y-0 left-3 flex items-center pointer-events-none">
                <Plus size={18} className="text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            </div>
            <input 
                ref={inputRef}
                type="text" 
                placeholder="Añadir nueva tarea..." 
                className="w-full bg-gray-50/50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 rounded-2xl py-2.5 pl-10 pr-12 text-sm font-medium text-gray-900 dark:text-white placeholder-gray-400 focus:ring-2 focus:ring-blue-500/30 transition-all outline-none"
                value={newTaskTitle}
                onChange={(e) => setNewTaskTitle(e.target.value)}
            />
            
            <div className="absolute right-2 top-1/2 -translate-y-1/2 flex items-center gap-1">
                <div className="relative" ref={createCalSelectorRef}>
                    <button
                        type="button"
                        onClick={() => setIsCreateCalSelectorOpen(!isCreateCalSelectorOpen)}
                        className="w-7 h-7 rounded-full flex items-center justify-center hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
                        title="Seleccionar calendario"
                    >
                        <div 
                            className="w-2 h-2 rounded-full"
                            style={{ backgroundColor: getCalendarColor(selectedCreateCalendarId) }}
                        ></div>
                    </button>
                    {isCreateCalSelectorOpen && (
                         <div className="absolute right-0 top-full mt-2 w-48 bg-white dark:bg-gray-900 rounded-2xl shadow-xl border border-gray-100 dark:border-gray-800 overflow-hidden z-50 max-h-64 overflow-y-auto p-1.5 animate-pop-over origin-top-right">
                            {calendars.filter(c => c.visible).map(cal => (
                                <button
                                    key={cal.id}
                                    type="button"
                                    onClick={() => { setSelectedCreateCalendarId(cal.id); setIsCreateCalSelectorOpen(false); }}
                                    className="w-full flex items-center gap-3 px-3 py-2 text-xs text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 rounded-xl transition-colors"
                                >
                                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: cal.color }}></div>
                                    <span className="truncate">{cal.label}</span>
                                    {selectedCreateCalendarId === cal.id && <Check size={12} className="ml-auto text-blue-500" strokeWidth={3} />}
                                </button>
                            ))}
                         </div>
                    )}
                </div>
            </div>
        </form>
      </div>

      <div className="w-full h-px bg-gray-100 dark:bg-gray-800/50 mt-4"></div>

      {/* Task List */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-6 pb-12 pt-4" ref={listCalSelectorRef}>
         <div className="space-y-1">
             {pendingTasks.map(task => {
                 const cal = calendars.find(c => c.id === task.calendarId);
                 
                 return (
                 <div 
                    key={task.id} 
                    onClick={() => onEditTask(task)}
                    className="group flex items-start gap-3 py-3 border-b border-gray-50/30 dark:border-gray-800/30 last:border-0 cursor-pointer transition-all active:bg-gray-50 dark:active:bg-gray-800/50 rounded-xl px-2 -mx-2"
                 >
                     <button
                        onClick={(e) => { e.stopPropagation(); onToggleTask(task); }}
                        className="mt-0.5 w-5 h-5 rounded-full border-2 border-gray-300 dark:border-gray-600 hover:border-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-all flex items-center justify-center shrink-0 active:scale-90"
                     />
                     
                     <div className="flex-1 min-w-0">
                         <div className="flex items-start justify-between">
                             <span className={`text-[13px] font-semibold text-gray-900 dark:text-white leading-snug ${task.isImportant ? 'text-blue-600 dark:text-blue-400' : ''}`}>
                                {task.title}
                             </span>
                             {task.isImportant && <Star size={10} className="text-yellow-500 fill-current mt-1 shrink-0 ml-2" />}
                         </div>
                         
                         <div className="flex flex-wrap items-center gap-2 mt-1">
                            <span className={`text-[9px] uppercase tracking-wide font-bold ${isPast(new Date(task.start)) && !isSameDay(new Date(task.start), new Date()) ? 'text-red-500' : 'text-gray-400 dark:text-gray-500'}`}>
                                {formatTaskDate(task.start)}
                            </span>
                            
                            {cal && (
                                <span 
                                    className="text-[8px] font-bold px-1.5 py-0.5 rounded-[4px] tracking-wide"
                                    style={{ 
                                        backgroundColor: `${cal.color}15`,
                                        color: cal.color 
                                    }}
                                >
                                    {cal.label}
                                </span>
                            )}
                         </div>
                     </div>

                     <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                        {onToggleImportance && (
                            <button onClick={(e) => { e.stopPropagation(); onToggleImportance(task); }} className={`p-1 rounded-md hover:bg-gray-100 dark:hover:bg-gray-800 ${task.isImportant ? 'text-yellow-500' : 'text-gray-400'}`}>
                                <Star size={14} fill={task.isImportant ? "currentColor" : "none"} />
                            </button>
                        )}
                        <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1 text-gray-400 hover:text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-md">
                            <Trash2 size={14} />
                        </button>
                     </div>
                 </div>
                 );
             })}

             {pendingTasks.length === 0 && completedTasks.length === 0 && (
                <div className="flex flex-col items-center justify-center py-16 text-center opacity-60">
                    <div className="w-12 h-12 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
                        <Check size={24} className="text-gray-300 dark:text-gray-500" />
                    </div>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium">No hay tareas pendientes.</p>
                </div>
             )}

             {showCompleted && completedTasks.length > 0 && (
                 <div className="mt-8 animate-fade-in-up">
                     <h3 className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-3 flex items-center gap-2 px-1">
                        Completadas 
                        <span className="bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-1.5 py-0.5 rounded text-[9px]">{completedTasks.length}</span>
                     </h3>
                     <div className="space-y-0.5">
                        {completedTasks.map(task => (
                            <div key={task.id} className="flex items-center gap-3 py-2.5 opacity-50 hover:opacity-100 transition-opacity px-1">
                                <button onClick={(e) => { e.stopPropagation(); onToggleTask(task); }} className="w-5 h-5 rounded-full bg-blue-500 flex items-center justify-center shrink-0 active:scale-90 transition-transform">
                                    <Check size={12} className="text-white" strokeWidth={3} />
                                </button>
                                <span className="text-sm text-gray-500 line-through flex-1 truncate font-medium">{task.title}</span>
                                <button onClick={(e) => { e.stopPropagation(); onDeleteTask(task.id); }} className="p-1 text-gray-400 hover:text-red-500 transition-colors"><Trash2 size={14} /></button>
                            </div>
                        ))}
                     </div>
                 </div>
             )}
         </div>
      </div>
    </div>
  );
};

export default TaskPanel;
