import React, { useState, useRef, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, LayoutList, Calendar as CalendarIcon, Grid3x3, Columns, Settings, Edit2, Sun, Moon, Monitor, ChevronDown, CalendarPlus, ArrowDownAZ, Palette, ListFilter, Eye, EyeOff, Plug, LogOut, Check, Download, X, Cake, CheckSquare, GripVertical } from 'lucide-react';
import { format, endOfWeek, eachDayOfInterval, endOfMonth, isSameDay, isSameMonth, addMonths } from 'date-fns';
import startOfWeek from 'date-fns/startOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import { es } from 'date-fns/locale';
import { ViewType, CalendarConfig, Theme } from '../types';

interface SidebarProps {
  isOpen: boolean;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCreateClick: () => void;
  onCreateBirthday?: () => void;
  onCreateTask?: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  calendars: CalendarConfig[];
  onToggleCalendar: (id: string) => void;
  onToggleAllCalendars: (visible: boolean) => void;
  onEditCalendar: (calendar: CalendarConfig) => void;
  onAddCalendar: () => void;
  onReorderCalendars?: (fromIndex: number, toIndex: number) => void;
  notificationPermission: NotificationPermission;
  onRequestNotifications: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  isGoogleConnected?: boolean;
  onConnectGoogle?: () => void;
  onDisconnectGoogle?: () => void;
  isGoogleLoading?: boolean;
  onOpenTrash?: () => void;
  onOpenSettings?: () => void;
  deferredPrompt?: any;
  onInstallPwa?: () => void;
  onClose?: () => void;
}

type SortMode = 'default' | 'alpha' | 'color';

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, 
  currentDate, 
  onDateSelect, 
  onCreateClick,
  onCreateTask,
  currentView,
  onViewChange,
  calendars,
  onToggleCalendar,
  onToggleAllCalendars,
  onEditCalendar,
  onAddCalendar,
  onReorderCalendars,
  theme,
  onThemeChange,
  isGoogleConnected = false,
  onConnectGoogle,
  onDisconnectGoogle,
  isGoogleLoading = false,
  onOpenSettings,
  deferredPrompt,
  onInstallPwa,
  onClose
}) => {
  const [miniDate, setMiniDate] = React.useState(new Date());
  const [isCreateMenuOpen, setIsCreateMenuOpen] = useState(false);
  const [sortMode, setSortMode] = useState<SortMode>('default');
  const createMenuRef = useRef<HTMLDivElement>(null);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  // OPTIMIZATION: Memoize mini calendar days calculation to avoid heavy repetitive computation
  const miniDays = useMemo(() => {
      const miniMonthStart = startOfMonth(miniDate);
      const miniMonthEnd = endOfMonth(miniDate);
      const miniStartDate = startOfWeek(miniMonthStart, { locale: es });
      const miniEndDate = endOfWeek(miniMonthEnd, { locale: es });
      return eachDayOfInterval({ start: miniStartDate, end: miniEndDate });
  }, [miniDate]);

  const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

  const viewOptions: { value: ViewType; label: string; icon: React.ReactNode }[] = [
    { value: 'agenda', label: 'Agenda', icon: <LayoutList size={18} /> },
    { value: 'day', label: 'Día', icon: <CalendarIcon size={18} /> },
    { value: 'week', label: 'Semana', icon: <Columns size={18} /> }, 
    { value: 'month', label: 'Mes', icon: <Grid3x3 size={18} /> },
  ];

  const sortedCalendars = useMemo(() => {
    const list = [...calendars];
    if (sortMode === 'alpha') {
      return list.sort((a, b) => a.label.localeCompare(b.label));
    }
    if (sortMode === 'color') {
      return list.sort((a, b) => a.color.localeCompare(b.color));
    }
    return list;
  }, [calendars, sortMode]);

  const allVisible = calendars.length > 0 && calendars.every(c => c.visible);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (createMenuRef.current && !createMenuRef.current.contains(event.target as Node)) {
        setIsCreateMenuOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSortClick = () => {
    if (sortMode === 'default') setSortMode('alpha');
    else if (sortMode === 'alpha') setSortMode('color');
    else setSortMode('default');
  };

  const handleDragStart = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    dragItem.current = position;
    e.dataTransfer.effectAllowed = 'move';
  };

  const handleDragEnter = (e: React.DragEvent<HTMLDivElement>, position: number) => {
    e.preventDefault();
    dragOverItem.current = position;
  };

  const handleDragEnd = () => {
    if (dragItem.current !== null && dragOverItem.current !== null && onReorderCalendars) {
      if (dragItem.current !== dragOverItem.current) {
         onReorderCalendars(dragItem.current, dragOverItem.current);
      }
    }
    dragItem.current = null;
    dragOverItem.current = null;
  };

  const renderContent = () => (
      <>
         {/* PREMIUM MINI CALENDAR */}
         <div className="px-6 mb-8">
            <div className="flex items-center justify-between mb-4">
                <span className="text-sm font-bold text-gray-900 dark:text-white capitalize">
                    {format(miniDate, 'MMMM yyyy', { locale: es })}
                </span>
                <div className="flex gap-1">
                    <button onClick={() => setMiniDate(addMonths(miniDate, -1))} className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"><ChevronLeft size={18} /></button>
                    <button onClick={() => setMiniDate(addMonths(miniDate, 1))} className="p-1 text-gray-400 hover:text-gray-800 dark:hover:text-white transition-colors"><ChevronRight size={18} /></button>
                </div>
            </div>
            
            <div className="grid grid-cols-7 gap-y-3 mb-2">
                {weekDays.map(day => (
                    <div key={day} className="text-[10px] text-center text-gray-400 dark:text-gray-500 font-bold">
                        {day}
                    </div>
                ))}
            </div>
            <div className="grid grid-cols-7 gap-y-1 justify-items-center">
                {miniDays.map(day => {
                    const isCurrentMonth = isSameMonth(day, miniDate);
                    const isSelected = isSameDay(day, currentDate);
                    const isToday = isSameDay(day, new Date());
                    
                    return (
                        <button
                            key={day.toString()}
                            onClick={() => {
                                onDateSelect(day);
                                setMiniDate(day);
                            }}
                            className={`
                                h-8 w-8 rounded-full flex items-center justify-center text-xs font-medium transition-all duration-200 relative
                                ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-300'}
                                ${isSelected 
                                    ? 'bg-black dark:bg-white text-white dark:text-black font-bold shadow-md' 
                                    : 'hover:bg-gray-100 dark:hover:bg-gray-800'}
                                ${isToday && !isSelected ? 'text-blue-600 dark:text-blue-400 font-bold' : ''}
                            `}
                        >
                            {format(day, 'd')}
                        </button>
                    );
                })}
            </div>
          </div>

          <div className="md:flex-1 px-4 py-2 mt-2">
              <div className="flex items-center justify-between mb-3 px-2">
                  <span className="text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest">Mis Calendarios</span>
                  <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={handleSortClick} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors">
                         {sortMode === 'default' && <ListFilter size={14} />}
                         {sortMode === 'alpha' && <ArrowDownAZ size={14} />}
                         {sortMode === 'color' && <Palette size={14} />}
                      </button>
                      <button onClick={() => onToggleAllCalendars(!allVisible)} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors">
                         {allVisible ? <EyeOff size={14} /> : <Eye size={14} />}
                      </button>
                      <button onClick={onAddCalendar} className="p-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 rounded-md transition-colors">
                        <Plus size={14} />
                      </button>
                  </div>
              </div>
              
              <div className="space-y-0.5 bg-gray-50 dark:bg-gray-800/40 rounded-2xl p-2">
                  {sortedCalendars.map((cal, index) => (
                      <div 
                        key={cal.id} 
                        className="group flex items-center justify-between py-2 px-3 hover:bg-white dark:hover:bg-gray-700/50 rounded-xl transition-all cursor-pointer"
                        draggable={sortMode === 'default'}
                        onDragStart={(e) => handleDragStart(e, index)}
                        onDragEnter={(e) => handleDragEnter(e, index)}
                        onDragEnd={handleDragEnd}
                        onDragOver={(e) => e.preventDefault()}
                      >
                          <div className="flex items-center flex-1 min-w-0">
                            {sortMode === 'default' && (
                                <div className="mr-2 text-gray-300 opacity-0 group-hover:opacity-100 cursor-grab active:cursor-grabbing hover:text-gray-500 transition-opacity">
                                    <GripVertical size={12} />
                                </div>
                            )}

                            <label className="flex items-center space-x-3 cursor-pointer flex-1 min-w-0">
                                    <div className="relative flex items-center justify-center">
                                        <input 
                                            type="checkbox" 
                                            checked={cal.visible}
                                            onChange={() => onToggleCalendar(cal.id)}
                                            className="sr-only" 
                                        />
                                        <div 
                                            className={`
                                                w-5 h-5 rounded-full border-2 transition-all duration-200 flex items-center justify-center
                                                ${cal.visible ? 'scale-100 border-transparent' : 'scale-90 opacity-60 border-gray-300 dark:border-gray-600 bg-transparent'}
                                            `}
                                            style={{ 
                                                backgroundColor: cal.visible ? cal.color : 'transparent',
                                            }}
                                        >
                                            {cal.visible && <Check size={12} className="text-white" strokeWidth={3} />}
                                        </div>
                                    </div>
                                    
                                    <span className={`text-sm font-medium truncate flex-1 flex items-center gap-2 transition-colors ${cal.visible ? 'text-gray-700 dark:text-gray-200' : 'text-gray-400'}`}>
                                        {cal.label}
                                        {cal.isRemote && <span className="text-[9px] font-bold text-blue-600 bg-blue-100 dark:bg-blue-900/50 px-1.5 py-0.5 rounded-md">G</span>}
                                        {cal.label === 'Cumpleaños' && <Cake size={14} className="text-pink-500 shrink-0" />}
                                        {cal.label === 'Tareas' && <CheckSquare size={14} className="text-indigo-500 shrink-0" />}
                                    </span>
                            </label>
                          </div>
                          
                          <button 
                              onClick={(e) => {
                                  e.stopPropagation();
                                  onEditCalendar(cal);
                              }}
                              className="opacity-0 group-hover:opacity-100 p-1.5 text-gray-400 hover:text-blue-600 dark:hover:text-blue-400 rounded-full transition-all"
                          >
                              <Edit2 size={12} />
                          </button>
                      </div>
                  ))}
              </div>

              {onConnectGoogle && (
                <div className="mt-6 px-2">
                     <span className="block text-xs font-bold text-gray-400 dark:text-gray-500 uppercase tracking-widest mb-2">Conexiones</span>
                     {isGoogleConnected ? (
                         <div className="bg-white dark:bg-gray-800 rounded-xl p-3 border border-gray-100 dark:border-gray-700 shadow-sm flex items-center justify-between">
                            <div className="flex items-center gap-2">
                                <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse"></div>
                                <span className="text-xs font-semibold text-gray-700 dark:text-gray-200">Google Calendar</span>
                            </div>
                            <button onClick={onDisconnectGoogle} className="text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 p-1.5 rounded-lg transition-colors">
                                <LogOut size={14} />
                            </button>
                         </div>
                     ) : (
                        <button 
                            onClick={onConnectGoogle}
                            disabled={isGoogleLoading}
                            className="w-full flex items-center justify-center gap-2 py-2.5 bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl hover:bg-white dark:hover:bg-gray-700 transition-all text-xs font-bold text-gray-600 dark:text-gray-300"
                        >
                            {isGoogleLoading ? <span className="animate-spin">⌛</span> : <Plug size={14} />}
                            <span>Conectar Google</span>
                        </button>
                     )}
                </div>
              )}
              
              {deferredPrompt && onInstallPwa && (
                  <div className="mt-4 px-2">
                      <button onClick={onInstallPwa} className="w-full flex items-center justify-center gap-2 py-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl transition-all font-bold text-xs hover:bg-blue-100">
                          <Download size={14} />
                          Instalar App
                      </button>
                  </div>
              )}
          </div>

          <div className="px-6 pb-6 pt-2 mt-auto">
               <div className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-1 rounded-full border border-gray-100 dark:border-gray-800">
                  <button onClick={() => onThemeChange('light')} className={`p-2 rounded-full transition-all ${theme === 'light' ? 'bg-white dark:bg-gray-700 shadow-sm text-yellow-500' : 'text-gray-400'}`}><Sun size={16} /></button>
                  <button onClick={() => onThemeChange('system')} className={`p-2 rounded-full transition-all ${theme === 'system' ? 'bg-white dark:bg-gray-700 shadow-sm text-blue-500' : 'text-gray-400'}`}><Monitor size={16} /></button>
                  <button onClick={() => onThemeChange('dark')} className={`p-2 rounded-full transition-all ${theme === 'dark' ? 'bg-white dark:bg-gray-700 shadow-sm text-indigo-400' : 'text-gray-400'}`}><Moon size={16} /></button>
               </div>
          </div>
      </>
  );

  return (
    <aside 
      className={`
        fixed inset-y-0 left-0 z-50 w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl transform transition-transform duration-500 cubic-bezier(0.19, 1, 0.22, 1) border-r border-gray-100 dark:border-gray-800 shadow-2xl
        ${isOpen ? 'translate-x-0' : '-translate-x-full'}
        lg:relative lg:translate-x-0 lg:w-72 lg:rounded-[32px] lg:ml-3 lg:bg-white/80 lg:dark:bg-gray-900/80 lg:backdrop-blur-2xl lg:shadow-none lg:z-40
        flex flex-col h-full
      `}
    >
      {/* MOBILE STRUCTURE: ABSOLUTE HEADER + SCROLLABLE CONTENT */}
      <div className="md:hidden flex flex-col w-full h-full relative">
         {/* Fixed Header */}
         <div className="absolute top-0 left-0 right-0 z-30 px-6 py-6 h-[88px] flex items-center justify-between bg-white/95 dark:bg-gray-900/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
            <h1 className="text-2xl font-bold tracking-tight text-gray-900 dark:text-white">Menú</h1>
            {onClose && (
                <button 
                  type="button"
                  onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                  }}
                  className="p-3 -mr-3 rounded-full text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 transition-all active:scale-90 cursor-pointer"
                >
                    <X size={24} />
                </button>
            )}
         </div>

         {/* Scrollable Content (Padded at top for header) */}
         <div className="flex-1 overflow-y-auto overflow-x-hidden pt-[88px] safe-area-pb">
            <div className="px-4 mb-6 mt-2">
                <div className="bg-gray-50 dark:bg-gray-800/50 rounded-2xl p-2 space-y-1">
                    {viewOptions.map((option) => (
                        <button
                            key={option.value}
                            onClick={() => { onViewChange(option.value); if(onClose) onClose(); }}
                            className={`
                                w-full flex items-center gap-3 px-4 py-3 rounded-xl text-sm font-medium transition-all
                                ${currentView === option.value 
                                    ? 'bg-white dark:bg-gray-700 text-black dark:text-white shadow-sm' 
                                    : 'text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800'}
                            `}
                        >
                            <span className={currentView === option.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400'}>
                                {option.icon}
                            </span>
                            <span>{option.label}</span>
                        </button>
                    ))}
                </div>
            </div>
            
            {renderContent()}
            <div className="h-20 w-full"></div>
         </div>
      </div>

      <div className="hidden md:flex flex-col h-full overflow-y-auto custom-scrollbar pt-6">
          {/* Tablet Overlay Header (Visible only when sidebar is an overlay, i.e., < lg) */}
          <div className="lg:hidden flex justify-between items-center px-6 mb-6">
             <h2 className="text-xl font-bold text-gray-900 dark:text-white">Menú</h2>
             {onClose && (
                <button 
                  type="button"
                  onClick={(e) => {
                      e.stopPropagation();
                      onClose();
                  }}
                  className="p-2 bg-gray-100 dark:bg-gray-800 hover:bg-gray-200 dark:hover:bg-gray-700 rounded-full text-gray-500 transition-colors"
                >
                    <X size={20} />
                </button>
             )}
          </div>

          {/* PREMIUM CREATE BUTTON */}
          <div className="relative mb-8 px-6 flex-shrink-0" ref={createMenuRef}>
            <button 
              onClick={() => setIsCreateMenuOpen(!isCreateMenuOpen)}
              className="w-full group flex items-center justify-between pl-5 pr-4 py-3.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl hover:shadow-2xl hover:-translate-y-0.5 transition-all duration-300"
            >
              <div className="flex items-center gap-3">
                  <Plus className="w-5 h-5" strokeWidth={3} />
                  <span className="font-bold text-sm tracking-wide">Nuevo</span>
              </div>
              <ChevronDown size={16} className={`transition-transform duration-300 opacity-60 ${isCreateMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {isCreateMenuOpen && (
              <div className="absolute top-full left-6 right-6 mt-3 bg-white/90 dark:bg-gray-800/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-100 dark:border-gray-700 overflow-hidden z-50 animate-scale-in origin-top">
                <button 
                  onClick={() => { onCreateClick(); setIsCreateMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                  <CalendarPlus size={18} className="text-blue-500" />
                  Evento
                </button>
                {onCreateTask && (
                   <button 
                      onClick={() => { onCreateTask(); setIsCreateMenuOpen(false); }}
                      className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
                    >
                      <CheckSquare size={18} className="text-indigo-500" />
                      Tarea
                    </button>
                )}
                <button 
                  onClick={() => { onAddCalendar(); setIsCreateMenuOpen(false); }}
                  className="w-full flex items-center gap-3 px-4 py-3.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors border-t border-gray-100 dark:border-gray-700"
                >
                  <Settings size={18} className="text-gray-400" />
                  Calendario
                </button>
              </div>
            )}
          </div>
          
          {renderContent()}
      </div>
    </aside>
  );
};

export default Sidebar;