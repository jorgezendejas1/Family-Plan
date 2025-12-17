import React, { useState, useRef, useEffect } from 'react';
import { Menu, ChevronLeft, ChevronRight, Search, Settings, Sun, Moon, Monitor, BookOpen, CheckSquare, Calendar as CalendarIcon, Plus, ChevronDown, Grid3x3, Columns, LayoutList, Check, X, Filter } from 'lucide-react';
import { format, endOfMonth, endOfWeek, eachDayOfInterval, isSameMonth, isSameDay, addMonths } from 'date-fns';
import startOfMonth from 'date-fns/startOfWeek';
import startOfWeek from 'date-fns/startOfWeek';
import { es } from 'date-fns/locale';
import { ViewType, SearchCriteria, Theme, CalendarConfig, CalendarEvent } from '../types';

interface HeaderProps {
  currentDate: Date;
  view: ViewType;
  events: CalendarEvent[];
  onViewChange: (view: ViewType) => void;
  onDateSelect: (date: Date) => void;
  onMenuClick: () => void;
  onPrev: () => void;
  onNext: () => void;
  onToday: () => void;
  searchCriteria: SearchCriteria;
  onSearchChange: (criteria: SearchCriteria) => void;
  onToggleFilters: () => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onStartTour: () => void;
  onShowInstructions: () => void;
  onToggleTaskPanel: () => void;
  isTaskPanelOpen: boolean;
  onCreateClick: () => void;
  calendars?: CalendarConfig[];
}

const Header: React.FC<HeaderProps> = ({ 
  currentDate, 
  view, 
  events,
  onViewChange, 
  onDateSelect,
  onMenuClick, 
  onPrev, 
  onNext, 
  onToday,
  searchCriteria,
  onSearchChange,
  onToggleFilters,
  theme,
  onThemeChange,
  onStartTour,
  onShowInstructions,
  onToggleTaskPanel,
  isTaskPanelOpen,
  onCreateClick,
  calendars = []
}) => {
  const [isSearchExpanded, setIsSearchExpanded] = useState(false);
  const [activeMenu, setActiveMenu] = useState<'help' | 'settings' | 'view' | null>(null);
  const [isMonthPickerOpen, setIsMonthPickerOpen] = useState(false);
  const [pickerDate, setPickerDate] = useState(currentDate);

  const searchInputRef = useRef<HTMLInputElement>(null);
  const helpRef = useRef<HTMLDivElement>(null);
  const settingsRef = useRef<HTMLDivElement>(null);
  
  // Refs separados para Mobile y Desktop para evitar conflictos de "Click Outside"
  const viewMenuRefDesktop = useRef<HTMLDivElement>(null);
  const viewMenuRefMobile = useRef<HTMLDivElement>(null);
  const monthPickerRefDesktop = useRef<HTMLDivElement>(null);
  const monthPickerRefMobile = useRef<HTMLDivElement>(null);

  // Definición de las opciones de vista con sus iconos correspondientes
  const viewMenuOptions: { value: ViewType; label: string; icon: React.ReactNode }[] = [
    { value: 'month', label: 'Mes', icon: <Grid3x3 size={18} /> },
    { value: 'week', label: 'Semana', icon: <Columns size={18} /> },
    { value: 'day', label: 'Día', icon: <CalendarIcon size={18} /> },
    { value: 'agenda', label: 'Agenda', icon: <LayoutList size={18} /> },
  ];

  // Opción actual para mostrar en el botón activador
  const currentViewOption = viewMenuOptions.find(opt => opt.value === view) || viewMenuOptions[0];

  useEffect(() => {
    if (isMonthPickerOpen) {
        setPickerDate(currentDate);
    }
  }, [isMonthPickerOpen, currentDate]);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Node;

      // Help Menu
      if (helpRef.current && !helpRef.current.contains(target)) {
        if (activeMenu === 'help') setActiveMenu(null);
      }
      
      // Settings Menu
      if (settingsRef.current && !settingsRef.current.contains(target)) {
        if (activeMenu === 'settings') setActiveMenu(null);
      }
      
      // View Menu - Check both Desktop and Mobile refs
      const clickedInsideViewDesktop = viewMenuRefDesktop.current && viewMenuRefDesktop.current.contains(target);
      const clickedInsideViewMobile = viewMenuRefMobile.current && viewMenuRefMobile.current.contains(target);
      
      if (!clickedInsideViewDesktop && !clickedInsideViewMobile) {
        if (activeMenu === 'view') setActiveMenu(null);
      }
      
      // Month Picker - Check both Desktop and Mobile refs
      const clickedInsideMonthDesktop = monthPickerRefDesktop.current && monthPickerRefDesktop.current.contains(target);
      const clickedInsideMonthMobile = monthPickerRefMobile.current && monthPickerRefMobile.current.contains(target);

      if (!clickedInsideMonthDesktop && !clickedInsideMonthMobile) {
        // Solo cerramos si realmente está abierto para evitar cambios de estado innecesarios
        setIsMonthPickerOpen(prev => prev ? false : prev);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [activeMenu]);

  const handleSearchInput = (e: React.ChangeEvent<HTMLInputElement>) => {
    onSearchChange({ ...searchCriteria, query: e.target.value });
  };

  const clearSearch = () => {
    onSearchChange({ ...searchCriteria, query: '' });
    setIsSearchExpanded(false);
  };

  const toggleMenu = (menu: 'help' | 'settings' | 'view') => {
    setActiveMenu(activeMenu === menu ? null : menu);
  };

  const handleViewOptionClick = (e: React.MouseEvent, optionValue: ViewType) => {
      e.preventDefault();
      e.stopPropagation(); // CRITICAL: Detiene que el evento llegue al document y cierre el menú antes de tiempo
      onViewChange(optionValue);
      setActiveMenu(null);
  };

  const renderMonthPicker = () => {
      const monthStart = startOfMonth(pickerDate); 
      const monthEnd = endOfMonth(pickerDate);
      const startDate = startOfWeek(monthStart, { locale: es }); 
      const endDate = endOfWeek(monthEnd, { locale: es });
      const days = eachDayOfInterval({ start: startDate, end: endDate });
      const weekDays = ['D', 'L', 'M', 'M', 'J', 'V', 'S'];

      return (
          <div className="absolute top-full left-0 mt-4 bg-white/90 dark:bg-gray-900/95 backdrop-blur-xl rounded-3xl shadow-premium dark:shadow-premium-dark border border-white/20 dark:border-gray-800 p-5 z-50 w-[320px] animate-pop-over origin-top-left">
             <div className="flex items-center justify-between mb-4">
                 <button onClick={() => setPickerDate(addMonths(pickerDate, -1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"><ChevronLeft size={20} /></button>
                 <span className="text-base font-bold text-gray-900 dark:text-white capitalize">{format(pickerDate, 'MMMM yyyy', { locale: es })}</span>
                 <button onClick={() => setPickerDate(addMonths(pickerDate, 1))} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full text-gray-500"><ChevronRight size={20} /></button>
             </div>
             
             <div className="grid grid-cols-7 gap-y-2 mb-2">
                 {weekDays.map(d => (
                     <div key={d} className="text-center text-[10px] font-bold text-gray-400 dark:text-gray-500">{d}</div>
                 ))}
             </div>

             <div className="grid grid-cols-7 gap-1">
                 {days.map(day => {
                     const isCurrentMonth = isSameMonth(day, pickerDate);
                     const isSelected = isSameDay(day, currentDate);
                     const dayEvents = events.filter(e => isSameDay(e.start, day) && !e.deletedAt);
                     
                     return (
                         <button 
                            key={day.toString()}
                            onClick={() => {
                                onDateSelect(day);
                                setIsMonthPickerOpen(false);
                            }}
                            className={`
                                h-10 w-full rounded-xl flex flex-col items-center justify-center relative transition-all duration-200
                                ${!isCurrentMonth ? 'text-gray-300 dark:text-gray-700' : 'text-gray-700 dark:text-gray-200'}
                                ${isSelected ? 'bg-blue-600 text-white shadow-lg shadow-blue-500/30' : 'hover:bg-gray-50 dark:hover:bg-gray-800'}
                            `}
                         >
                            <span className="text-xs font-semibold">{format(day, 'd')}</span>
                            <div className="flex gap-0.5 mt-0.5 h-1.5 items-center justify-center">
                                {dayEvents.slice(0, 3).map((ev, i) => (
                                    <div 
                                        key={i} 
                                        className={`w-1 h-1 rounded-full ${isSelected ? 'bg-white' : ''}`}
                                        style={{ backgroundColor: isSelected ? 'white' : ev.color }}
                                    ></div>
                                ))}
                                {dayEvents.length > 3 && (
                                     <div className={`w-0.5 h-0.5 rounded-full ${isSelected ? 'bg-white' : 'bg-gray-400'}`}></div>
                                )}
                            </div>
                         </button>
                     );
                 })}
             </div>
             <div className="mt-3 pt-3 border-t border-gray-100 dark:border-gray-800 flex justify-center">
                <button 
                    onClick={() => { onToday(); setIsMonthPickerOpen(false); }}
                    className="text-xs font-bold text-blue-600 dark:text-blue-400 hover:underline"
                >
                    Ir a Hoy
                </button>
             </div>
          </div>
      );
  };

  // -------------------------
  // RENDER FOR MOBILE (Updated "Two Pills" Design)
  // -------------------------
  const renderMobileHeader = () => (
      <header className="w-full px-4 pt-4 pb-2 flex items-start justify-between z-30 shrink-0 md:hidden relative">
          
          {/* SEARCH OVERLAY (Mobile Only) */}
          {isSearchExpanded && (
              <div className="absolute inset-0 z-50 px-4 pt-4 pb-2 bg-white/95 dark:bg-black/95 backdrop-blur-xl flex items-center gap-3 animate-fade-in-up h-[72px]">
                  <div className="flex-1 bg-gray-100 dark:bg-gray-800 rounded-xl flex items-center px-3 h-10">
                      <Search size={18} className="text-gray-400" />
                      <input 
                         ref={searchInputRef}
                         type="text" 
                         placeholder="Buscar eventos..." 
                         className="flex-1 bg-transparent border-none outline-none px-3 text-sm text-gray-900 dark:text-white placeholder-gray-500"
                         value={searchCriteria.query}
                         onChange={handleSearchInput}
                      />
                      {searchCriteria.query && (
                          <button onClick={clearSearch} className="text-gray-400">
                              <X size={16} />
                          </button>
                      )}
                  </div>
                  <button onClick={() => setIsSearchExpanded(false)} className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                      Cancelar
                  </button>
              </div>
          )}

          {/* LEFT PILL: Hamburger | Month Name (No Year) */}
          <div className="flex items-center gap-2 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-premium dark:shadow-premium-dark border border-white/40 dark:border-gray-700/40 rounded-full py-2 px-3 relative" ref={monthPickerRefMobile}>
              <button 
                onClick={onMenuClick} 
                className="p-1 text-gray-700 dark:text-gray-200 active:scale-90 transition-transform"
              >
                  <Menu size={20} strokeWidth={2.5} />
              </button>
              
              <div className="w-px h-5 bg-gray-200 dark:bg-gray-700 mx-0.5"></div>

              <button 
                onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                className="flex items-center gap-1 active:opacity-70 transition-opacity"
              >
                  <span className="text-base font-bold text-gray-900 dark:text-white capitalize">
                    {format(currentDate, 'MMMM', { locale: es })}
                  </span>
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${isMonthPickerOpen ? 'rotate-180' : ''}`} strokeWidth={2.5} />
              </button>

              {isMonthPickerOpen && renderMonthPicker()}
          </div>

          {/* RIGHT PILL: View | Search | Tasks */}
          <div 
             ref={viewMenuRefMobile}
             key={activeMenu === 'view' ? 'active' : 'inactive'} 
             className={`flex items-center gap-1 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl shadow-premium dark:shadow-premium-dark border border-white/40 dark:border-gray-700/40 rounded-full py-1.5 pl-3 pr-1.5 relative ${activeMenu === 'view' ? 'animate-spring-press' : ''}`}
          >
              
              {/* View Switcher Trigger */}
              <button 
                onClick={() => toggleMenu('view')}
                className="flex items-center gap-1.5 text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white mr-2"
              >
                  {currentViewOption.icon}
                  <ChevronDown size={14} className={`text-gray-400 transition-transform ${activeMenu === 'view' ? 'rotate-180' : ''}`} strokeWidth={2.5} />
              </button>

              {/* Search Trigger */}
              <button 
                onClick={() => { setIsSearchExpanded(true); setTimeout(() => searchInputRef.current?.focus(), 100); }}
                className="p-2 text-gray-500 dark:text-gray-400 hover:text-gray-900 dark:hover:text-white active:scale-90 transition-transform"
              >
                  <Search size={20} strokeWidth={2.5} />
              </button>

              {/* Tasks Trigger (Replaces Today) */}
              <button 
                 onClick={onToggleTaskPanel}
                 className={`p-2 active:scale-90 transition-transform ${isTaskPanelOpen ? 'text-blue-600 dark:text-blue-400' : 'text-gray-900 dark:text-white'}`}
              >
                  <CheckSquare size={20} strokeWidth={2.5} />
              </button>

              {/* Pop-over Menu */}
              {activeMenu === 'view' && (
                  <div className="absolute right-0 top-full mt-2 w-48 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-premium dark:shadow-premium-dark border border-white/20 dark:border-gray-800 z-50 animate-pop-over origin-top-right overflow-hidden p-1.5">
                    <div className="flex flex-col gap-0.5">
                       {viewMenuOptions.map((opt) => (
                            <button
                                key={opt.value}
                                type="button"
                                onClick={(e) => handleViewOptionClick(e, opt.value)}
                                className={`
                                    w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors
                                    ${view === opt.value 
                                        ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white font-medium' 
                                        : 'text-gray-500 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800/50'}
                                `}
                            >
                                <div className="flex items-center gap-3">
                                    <span className={view === opt.value ? 'text-black dark:text-white' : ''}>{opt.icon}</span>
                                    <span className="text-sm">{opt.label}</span>
                                </div>
                                {view === opt.value && <Check size={14} className="text-blue-600" strokeWidth={3} />}
                            </button>
                       ))}
                    </div>
                 </div>
              )}
          </div>
      </header>
  );

  // -------------------------
  // RENDER FOR DESKTOP (Traditional Full Header)
  // -------------------------
  const renderDesktopHeader = () => (
    <header className="hidden md:flex w-full h-20 px-6 items-center justify-between z-30 shrink-0">
      <div className="w-full h-14 bg-white/70 dark:bg-gray-900/70 backdrop-blur-xl shadow-glass border border-white/40 dark:border-gray-700/40 rounded-2xl flex items-center px-4 transition-all duration-300 relative">
          
          {/* LEFT */}
          <div className="flex items-center gap-3 min-w-0">
             <div className="flex bg-gray-100 dark:bg-gray-800 rounded-lg p-0.5 border border-gray-200 dark:border-gray-700">
                 <button onClick={onPrev} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-all shadow-sm"><ChevronLeft size={16} /></button>
                 <button onClick={onNext} className="p-1 hover:bg-white dark:hover:bg-gray-700 rounded-md text-gray-500 dark:text-gray-400 transition-all shadow-sm"><ChevronRight size={16} /></button>
             </div>
             <div className="relative" ref={monthPickerRefDesktop}>
               <button 
                  onClick={() => setIsMonthPickerOpen(!isMonthPickerOpen)}
                  className="flex items-center gap-2 hover:bg-black/5 dark:hover:bg-white/10 px-2 py-1 rounded-lg transition-colors group"
               >
                   <h2 className="text-xl font-bold text-gray-900 dark:text-white truncate capitalize tracking-tight">
                     {view === 'search' ? 'Búsqueda' : format(currentDate, 'MMMM yyyy', { locale: es })}
                   </h2>
                   <ChevronDown size={16} className={`text-gray-500 transition-transform duration-300 ${isMonthPickerOpen ? 'rotate-180' : 'group-hover:translate-y-0.5'}`} strokeWidth={2.5} />
               </button>
               {isMonthPickerOpen && renderMonthPicker()}
             </div>
          </div>

          {/* MIDDLE: Search */}
          <div className="flex-1 px-8 flex justify-center">
            <div className={`
                flex items-center rounded-xl transition-all duration-300 group overflow-hidden bg-gray-100/50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 w-full max-w-md
            `}>
               <div className="pl-3 text-gray-400 group-focus-within:text-blue-500 transition-colors">
                  <Search size={16} />
               </div>
               <input 
                 ref={searchInputRef}
                 type="text" 
                 placeholder="Buscar..." 
                 className="w-full bg-transparent border-none focus:ring-0 text-gray-800 dark:text-white py-2 px-3 placeholder-gray-400 outline-none text-sm font-medium"
                 value={searchCriteria.query}
                 onChange={handleSearchInput}
               />
               {searchCriteria.query && (
                  <button 
                    onClick={clearSearch}
                    className="p-1.5 mr-2 rounded-full bg-gray-200 dark:bg-gray-700 text-gray-500 dark:text-gray-300 hover:bg-gray-300 transition-colors"
                  >
                      <X size={12} strokeWidth={3} />
                  </button>
               )}
            </div>
          </div>

          {/* RIGHT */}
          <div className="flex items-center gap-1.5 ml-auto">
             <div className="relative" ref={viewMenuRefDesktop}>
                 <button
                    onClick={() => toggleMenu('view')}
                    className={`
                        flex items-center gap-2 px-3 py-2 rounded-xl transition-all duration-200 group
                        ${activeMenu === 'view' 
                            ? 'bg-gray-100 dark:bg-gray-800 text-black dark:text-white' 
                            : 'hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-600 dark:text-gray-300'}
                    `}
                 >
                    <span className="flex items-center gap-2">
                        {currentViewOption.icon}
                        <span className="text-sm font-semibold tracking-tight">{currentViewOption.label}</span>
                    </span>
                    <ChevronDown size={14} className={`text-gray-400 transition-transform duration-300 ${activeMenu === 'view' ? 'rotate-180' : ''}`} strokeWidth={2.5} />
                 </button>

                 {activeMenu === 'view' && (
                     <div className="absolute right-0 top-full mt-2 w-52 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-premium dark:shadow-premium-dark border border-gray-200/50 dark:border-gray-800/50 z-[60] animate-pop-over origin-top-right overflow-hidden p-1.5">
                        <div className="flex flex-col gap-0.5">
                           {viewMenuOptions.map((opt) => (
                                <button
                                    key={opt.value}
                                    type="button"
                                    onClick={(e) => handleViewOptionClick(e, opt.value)}
                                    className={`
                                        w-full flex items-center justify-between px-3 py-2.5 rounded-xl transition-colors
                                        ${view === opt.value 
                                            ? 'bg-white dark:bg-gray-800 shadow-sm text-black dark:text-white' 
                                            : 'text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800/50'}
                                    `}
                                >
                                    <div className="flex items-center gap-3">
                                        <span className={view === opt.value ? 'text-blue-600 dark:text-blue-400' : 'text-gray-400 dark:text-gray-500'}>{opt.icon}</span>
                                        <span className="text-sm font-medium">{opt.label}</span>
                                    </div>
                                    {view === opt.value && <Check size={16} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />}
                                </button>
                           ))}
                        </div>
                     </div>
                 )}
             </div>

             <button 
                onClick={onCreateClick}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-900 dark:bg-white text-white dark:text-black rounded-lg text-sm font-bold shadow-md hover:scale-105 active:scale-95 transition-all ml-1"
            >
                <Plus size={16} strokeWidth={3} />
                <span>Nuevo</span>
            </button>

            {/* TASKS BUTTON (INTEGRATED) */}
            <button 
                onClick={onToggleTaskPanel}
                className={`p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors ${isTaskPanelOpen ? 'bg-gray-100 dark:bg-gray-800 text-blue-600 dark:text-blue-400' : 'text-gray-600 dark:text-gray-300'}`}
                title="Tareas"
            >
                <CheckSquare size={20} strokeWidth={2.5} />
            </button>

             <div className="relative" ref={settingsRef}>
                <button 
                  onClick={() => toggleMenu('settings')}
                  className={`p-2.5 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors ${activeMenu === 'settings' ? 'bg-gray-100 dark:bg-gray-800' : 'text-gray-600 dark:text-gray-300'}`}
                >
                  <Settings size={20} strokeWidth={2.5} />
                </button>
                {activeMenu === 'settings' && (
                  <div className="absolute right-0 mt-4 w-56 bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl rounded-2xl shadow-2xl border border-gray-200 dark:border-gray-800 z-50 animate-pop-over origin-top-right p-2">
                     <div className="p-2">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mb-2 px-1">Apariencia</p>
                        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                            {['light', 'dark', 'system'].map((t) => (
                                <button 
                                    key={t}
                                    onClick={() => onThemeChange(t as Theme)} 
                                    className={`flex-1 flex justify-center py-1.5 rounded-lg transition-all ${theme === t ? 'bg-white dark:bg-gray-700 shadow text-blue-600' : 'text-gray-400'}`}
                                >
                                    {t === 'light' && <Sun size={14} />}
                                    {t === 'dark' && <Moon size={14} />}
                                    {t === 'system' && <Monitor size={14} />}
                                </button>
                            ))}
                        </div>
                    </div>
                    <div className="h-px bg-gray-100 dark:bg-gray-800 my-1"></div>
                    <button onClick={() => { onShowInstructions(); toggleMenu('settings'); }} className="w-full flex items-center gap-3 px-3 py-2 text-sm text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-xl transition-colors font-medium">
                         <BookOpen size={16} /> Ayuda
                    </button>
                  </div>
                )}
            </div>
            
            <div className="ml-1">
               <button className="w-9 h-9 rounded-full bg-gradient-to-tr from-orange-400 to-pink-500 shadow-md border-2 border-white dark:border-gray-800 flex items-center justify-center text-white font-bold text-sm">
                  J
               </button>
            </div>
          </div>
      </div>
    </header>
  );

  return (
    <>
      {renderMobileHeader()}
      {renderDesktopHeader()}
    </>
  );
};

export default Header;