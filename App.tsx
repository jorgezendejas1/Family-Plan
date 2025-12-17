import React, { useState, useEffect, useMemo } from 'react';
import { addMonths, addWeeks, addDays, subMonths, subWeeks, subDays, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isSameDay, isWithinInterval, parseISO } from 'date-fns';
import { Plus } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import AgendaView from './components/AgendaView';
import SearchResultsView from './components/SearchResultsView';
import TaskPanel from './components/TaskPanel';
import ChatBot from './components/ChatBot';
import EventModal, { DeleteMode } from './components/EventModal';
import CalendarEditModal from './components/CalendarEditModal';
import SettingsModal from './components/SettingsModal';
import TrashModal from './components/TrashModal';
import OnboardingModal from './components/OnboardingModal';
import InstructionsModal from './components/InstructionsModal';
import SearchFilters from './components/SearchFilters';
import { CalendarEvent, ViewType, CalendarConfig, SearchCriteria, Theme, TimeZoneConfig } from './types';
import { dataService } from './services/dataService';
import { googleCalendarService } from './services/googleCalendarService';
import { generateRecurringEvents } from './utils/dateUtils';
import { CALENDAR_IDS, DEFAULT_CALENDARS } from './constants';

const App: React.FC = () => {
  // State: Date & View
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');

  // State: Data
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [deletedEvents, setDeletedEvents] = useState<CalendarEvent[]>([]);
  
  // State: UI Toggles
  const [isSidebarOpen, setIsSidebarOpen] = useState(false); // Mobile sidebar
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);

  // State: Modals
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalInitialDate, setModalInitialDate] = useState<Date | undefined>(undefined);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  
  const [isCalendarEditModalOpen, setIsCalendarEditModalOpen] = useState(false);
  const [selectedCalendarToEdit, setSelectedCalendarToEdit] = useState<CalendarConfig | null>(null);
  
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);

  // State: Configuration
  const [theme, setTheme] = useState<Theme>('system');
  const [timeZoneConfig, setTimeZoneConfig] = useState<TimeZoneConfig>({ primary: 'local', secondary: 'UTC', showSecondary: false });
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({ query: '' });
  
  // State: External Services
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);

  // --- INITIALIZATION ---

  useEffect(() => {
    const initData = async () => {
        // Load Settings
        const settings = await dataService.getSettings();
        setTheme(settings.theme);
        setTimeZoneConfig(settings.timezone_config);
        setIsOnboardingOpen(!settings.has_seen_tour);
        setIsGoogleConnected(!!settings.metadata?.isGoogleConnected);

        // Load Calendars
        const loadedCalendars = await dataService.getCalendars();
        setCalendars(loadedCalendars);

        // Load Events
        const loadedEvents = await dataService.getEvents();
        const activeEvents = loadedEvents.filter(e => !e.deletedAt);
        const trashEvents = loadedEvents.filter(e => !!e.deletedAt);
        
        setEvents(activeEvents);
        setDeletedEvents(trashEvents);

        if (settings.metadata?.isGoogleConnected) {
            handleConnectGoogle(true); // silent sync
        }
    };

    initData();

    window.addEventListener('beforeinstallprompt', (e) => {
        e.preventDefault();
        setDeferredPrompt(e);
    });

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    const handleChange = () => applyTheme(theme);
    mediaQuery.addEventListener('change', handleChange);

    return () => {
        mediaQuery.removeEventListener('change', handleChange);
    };
  }, []);

  useEffect(() => {
    applyTheme(theme);
    dataService.saveSettings({ theme });
  }, [theme]);

  const applyTheme = (t: Theme) => {
      const root = window.document.documentElement;
      const isDark = t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches);
      if (isDark) {
          root.classList.add('dark');
      } else {
          root.classList.remove('dark');
      }
  };

  // --- NAVIGATION ---

  const handlePrev = () => {
    if (view === 'month') setCurrentDate(subMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(subWeeks(currentDate, 1));
    else if (view === 'day') setCurrentDate(subDays(currentDate, 1));
  };

  const handleNext = () => {
    if (view === 'month') setCurrentDate(addMonths(currentDate, 1));
    else if (view === 'week') setCurrentDate(addWeeks(currentDate, 1));
    else if (view === 'day') setCurrentDate(addDays(currentDate, 1));
  };

  const handleToday = () => setCurrentDate(new Date());

  const handleViewChange = (newView: ViewType) => {
      setView(newView);
  };

  // --- EVENTS LOGIC ---

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
        id: eventData.id || crypto.randomUUID(),
        title: eventData.title || '(Sin título)',
        start: eventData.start || new Date(),
        end: eventData.end || new Date(),
        color: eventData.color || '#3788d8',
        calendarId: eventData.calendarId || calendars[0]?.id || 'default',
        description: eventData.description,
        location: eventData.location,
        recurrence: eventData.recurrence,
        reminderMinutes: eventData.reminderMinutes,
        isBirthday: eventData.isBirthday,
        isTask: eventData.isTask,
        isCompleted: eventData.isCompleted,
        isImportant: eventData.isImportant,
        category: eventData.category
    };

    const savedEvent = await dataService.createOrUpdateEvent(newEvent);
    
    setEvents(prev => {
        const exists = prev.find(e => e.id === savedEvent.id);
        if (exists) return prev.map(e => e.id === savedEvent.id ? savedEvent : e);
        return [...prev, savedEvent];
    });
  };

  const handleDeleteEvent = async (id: string, mode: DeleteMode) => {
     const eventToDelete = events.find(e => e.id === id);
     if (eventToDelete) {
         await dataService.deleteEvent(id);
         setEvents(prev => prev.filter(e => e.id !== id));
         setDeletedEvents(prev => [...prev, { ...eventToDelete, deletedAt: new Date() }]);
     }
  };

  const handleRestoreEvent = async (id: string) => {
      const eventToRestore = deletedEvents.find(e => e.id === id);
      if (eventToRestore) {
          const restored = { ...eventToRestore, deletedAt: undefined };
          const { deletedAt, ...rest } = eventToRestore;
          await dataService.createOrUpdateEvent(rest as CalendarEvent);
          setDeletedEvents(prev => prev.filter(e => e.id !== id));
          setEvents(prev => [...prev, rest as CalendarEvent]);
      }
  };

  const handleDeletePermanent = async (id: string) => {
      await dataService.deleteEvent(id, true);
      setDeletedEvents(prev => prev.filter(e => e.id !== id));
  };

  const handleToggleTask = async (task: CalendarEvent) => {
      const updated = { ...task, isCompleted: !task.isCompleted };
      await handleSaveEvent(updated);
  };

  const handleEventClick = (event: CalendarEvent) => {
      const baseId = event.id.split('_')[0];
      const realEvent = events.find(e => e.id === baseId);
      if (realEvent) {
          setSelectedEvent(realEvent);
          setIsModalOpen(true);
      }
  };

  // --- CALENDAR LOGIC ---

  const handleSaveCalendar = async (id: string, updates: Partial<CalendarConfig>) => {
      if (id === 'new') {
          const newCal: CalendarConfig = {
              id: crypto.randomUUID(),
              label: updates.label || 'Nuevo Calendario',
              color: updates.color || '#000000',
              visible: true
          };
          const saved = await dataService.saveCalendar(newCal);
          setCalendars(prev => [...prev, saved]);
      } else {
          const cal = calendars.find(c => c.id === id);
          if (cal) {
              const updated = { ...cal, ...updates };
              await dataService.saveCalendar(updated);
              setCalendars(prev => prev.map(c => c.id === id ? updated : c));
          }
      }
  };

  const handleDeleteCalendar = async (id: string) => {
      await dataService.deleteCalendar(id);
      setCalendars(prev => prev.filter(c => c.id !== id));
      setEvents(prev => prev.filter(e => e.calendarId !== id));
  };

  const handleToggleCalendar = async (id: string) => {
      const cal = calendars.find(c => c.id === id);
      if (cal) {
          const updated = { ...cal, visible: !cal.visible };
          await dataService.saveCalendar(updated);
          setCalendars(prev => prev.map(c => c.id === id ? updated : c));
      }
  };

  // --- GOOGLE INTEGRATION ---

  const handleConnectGoogle = async (silent = false) => {
      setIsGoogleLoading(true);
      try {
          if (!silent) await googleCalendarService.signIn();
          const remoteEvents = await googleCalendarService.listEvents(CALENDAR_IDS.GOOGLE);
          const localOnly = events.filter(e => !e.isRemote);
          const newEvents = [...localOnly, ...remoteEvents];
          setEvents(newEvents);
          setIsGoogleConnected(true);
          dataService.saveSettings({ metadata: { isGoogleConnected: true } });
          if (!calendars.find(c => c.id === CALENDAR_IDS.GOOGLE)) {
             const gCal: CalendarConfig = {
                 id: CALENDAR_IDS.GOOGLE,
                 label: 'Google Calendar',
                 color: '#4285F4',
                 visible: true,
                 isRemote: true
             };
             setCalendars(prev => [...prev, gCal]);
          }
      } catch (e) {
          console.error("Google Sync Error", e);
          if (!silent) alert("Error al conectar con Google.");
      } finally {
          setIsGoogleLoading(false);
      }
  };

  const handleDisconnectGoogle = async () => {
      await googleCalendarService.signOut();
      setEvents(prev => prev.filter(e => !e.isRemote));
      setCalendars(prev => prev.filter(c => c.id !== CALENDAR_IDS.GOOGLE));
      setIsGoogleConnected(false);
      dataService.saveSettings({ metadata: { isGoogleConnected: false } });
  };

  // --- FILTERED EVENTS CALCULATION ---

  const displayedEvents = useMemo(() => {
    let filtered = events;
    const visibleCalIds = calendars.filter(c => c.visible).map(c => c.id);
    filtered = filtered.filter(e => visibleCalIds.includes(e.calendarId));
    if (searchCriteria.query) {
        const q = searchCriteria.query.toLowerCase();
        filtered = filtered.filter(e => 
            e.title.toLowerCase().includes(q) || 
            (e.description && e.description.toLowerCase().includes(q)) ||
            (e.location && e.location.toLowerCase().includes(q))
        );
    }
    if (searchCriteria.startDate) {
        const start = parseISO(searchCriteria.startDate);
        filtered = filtered.filter(e => e.start >= start);
    }
    if (searchCriteria.endDate) {
        const end = parseISO(searchCriteria.endDate);
        filtered = filtered.filter(e => e.end <= end);
    }
    if (searchCriteria.calendarId) {
        filtered = filtered.filter(e => e.calendarId === searchCriteria.calendarId);
    }
    let rangeStart = startOfMonth(currentDate);
    let rangeEnd = endOfMonth(currentDate);
    if (view === 'week') {
        rangeStart = startOfWeek(currentDate);
        rangeEnd = endOfWeek(currentDate);
    } else if (view === 'day') {
        rangeStart = startOfDay(currentDate);
        rangeEnd = endOfDay(currentDate);
    } else if (view === 'agenda') {
        // RANGO SOLICITADO: 90 días atrás y 90 días adelante
        rangeStart = subDays(startOfDay(currentDate), 90); 
        rangeEnd = addDays(startOfDay(currentDate), 90);
    } else if (view === 'search') {
         rangeStart = subMonths(new Date(), 6);
         rangeEnd = addMonths(new Date(), 12);
    }
    return generateRecurringEvents(filtered, rangeStart, rangeEnd);
  }, [events, calendars, searchCriteria, view, currentDate]);

  const taskEvents = useMemo(() => {
      return events.filter(e => e.isTask);
  }, [events]);

  const handleCreateNew = () => {
    setSelectedEvent(null);
    setModalInitialDate(currentDate);
    setIsModalOpen(true);
  };

  return (
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-black transition-colors duration-300 overflow-hidden font-sans">
      
      <Header 
        currentDate={currentDate}
        view={view === 'search' && !searchCriteria.query ? 'month' : view}
        events={displayedEvents}
        onViewChange={handleViewChange}
        onDateSelect={(d) => setCurrentDate(d)}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        searchCriteria={searchCriteria}
        onSearchChange={(c) => {
            setSearchCriteria(c);
            if (c.query && view !== 'search') setView('search');
            if (!c.query && view === 'search') setView('month');
        }}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
        theme={theme}
        onThemeChange={setTheme}
        onStartTour={() => setIsOnboardingOpen(true)}
        onShowInstructions={() => setIsInstructionsOpen(true)}
        onToggleTaskPanel={() => setIsTaskPanelOpen(!isTaskPanelOpen)}
        isTaskPanelOpen={isTaskPanelOpen}
        onCreateClick={handleCreateNew}
        calendars={calendars}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="relative z-10 flex flex-1 overflow-hidden p-3 md:p-6 md:pt-2 gap-4">
        
        {/* Sidebar (Desktop & Mobile Wrapper) */}
        <Sidebar 
          isOpen={isSidebarOpen}
          currentDate={currentDate}
          onDateSelect={setCurrentDate}
          onCreateClick={handleCreateNew}
          onCreateTask={() => { setSelectedEvent({ isTask: true } as any); setIsModalOpen(true); }}
          currentView={view}
          onViewChange={handleViewChange}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          onToggleAllCalendars={(v) => {
              const updated = calendars.map(c => ({ ...c, visible: v }));
              setCalendars(updated);
              updated.forEach(c => dataService.saveCalendar(c));
          }}
          onEditCalendar={(c) => { setSelectedCalendarToEdit(c); setIsCalendarEditModalOpen(true); }}
          onAddCalendar={() => { setSelectedCalendarToEdit({ id: 'new' } as any); setIsCalendarEditModalOpen(true); }}
          notificationPermission="default"
          onRequestNotifications={() => {}}
          theme={theme}
          onThemeChange={setTheme}
          isGoogleConnected={isGoogleConnected}
          onConnectGoogle={() => handleConnectGoogle()}
          onDisconnectGoogle={handleDisconnectGoogle}
          isGoogleLoading={isGoogleLoading}
          onOpenTrash={() => setIsTrashOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          // Fix: Corrected typo in function call name
          onShowInstructions={() => setIsInstructionsOpen(true)}
          deferredPrompt={deferredPrompt}
          onInstallPwa={() => deferredPrompt?.prompt()}
          onClose={() => setIsSidebarOpen(false)}
        />

        {/* Main Content Area */}
        <main className="flex-1 bg-white/50 dark:bg-gray-900/50 backdrop-blur-xl rounded-[32px] border border-white/20 dark:border-gray-800 shadow-glass overflow-hidden relative transition-all duration-300 flex flex-col">
            {view === 'month' && (
                <MonthView 
                    currentDate={currentDate} 
                    events={displayedEvents} 
                    calendars={calendars}
                    onEventClick={handleEventClick} 
                    onTimeSlotClick={(d) => { setModalInitialDate(d); setIsModalOpen(true); }}
                    onToggleTaskCompletion={handleToggleTask}
                />
            )}
            {view === 'week' && (
                <WeekView 
                    currentDate={currentDate} 
                    events={displayedEvents} 
                    calendars={calendars}
                    onEventClick={handleEventClick} 
                    onTimeSlotClick={(d) => { setModalInitialDate(d); setIsModalOpen(true); }}
                    timeZoneConfig={timeZoneConfig}
                    onToggleTaskCompletion={handleToggleTask}
                />
            )}
            {view === 'day' && (
                <DayView 
                    currentDate={currentDate} 
                    events={displayedEvents} 
                    calendars={calendars}
                    onEventClick={handleEventClick} 
                    onTimeSlotClick={(d) => { setModalInitialDate(d); setIsModalOpen(true); }}
                    timeZoneConfig={timeZoneConfig}
                    onToggleTaskCompletion={handleToggleTask}
                />
            )}
            {view === 'agenda' && (
                <AgendaView 
                    currentDate={currentDate} 
                    events={displayedEvents} 
                    calendars={calendars}
                    onEventClick={handleEventClick} 
                    onTimeSlotClick={(d) => { setModalInitialDate(d); setIsModalOpen(true); }}
                    onToggleTaskCompletion={handleToggleTask}
                />
            )}
            {view === 'search' && (
                <SearchResultsView 
                    events={displayedEvents}
                    calendars={calendars}
                    onEventClick={handleEventClick}
                />
            )}
            {isFiltersOpen && (
                <SearchFilters 
                    isOpen={isFiltersOpen}
                    onClose={() => setIsFiltersOpen(false)}
                    criteria={searchCriteria}
                    onCriteriaChange={setSearchCriteria}
                    calendars={calendars}
                />
            )}
        </main>

        {/* Right Task Panel */}
        <div className={`
            absolute top-2 bottom-4 right-4 z-[60] w-80 bg-white/95 dark:bg-gray-900/95 backdrop-blur-3xl 
            transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) border border-gray-100 dark:border-gray-800 shadow-2xl rounded-3xl flex flex-col overflow-hidden
            ${isTaskPanelOpen ? 'translate-x-0 opacity-100 visible' : 'translate-x-[110%] opacity-0 invisible pointer-events-none'}
            lg:relative lg:top-0 lg:bottom-0 lg:right-0 lg:h-full lg:rounded-[32px] lg:mr-0 lg:bg-white/80 lg:dark:bg-gray-900/80 lg:backdrop-blur-2xl lg:shadow-none lg:z-40 lg:border-l lg:border-t-0 lg:border-b-0 lg:border-r-0 lg:visible lg:pointer-events-auto
            ${isTaskPanelOpen ? 'lg:w-80 lg:opacity-100 lg:translate-x-0' : 'lg:w-0 lg:opacity-0 lg:translate-x-full lg:border-none'}
        `}>
            <TaskPanel 
                isOpen={true} 
                onClose={() => setIsTaskPanelOpen(false)}
                tasks={taskEvents}
                calendars={calendars}
                onToggleTask={handleToggleTask}
                onDeleteTask={(id) => handleDeleteEvent(id, 'this')}
                onAddTask={(title, calId) => handleSaveEvent({ title, isTask: true, calendarId: calId })}
                onToggleImportance={(t) => handleSaveEvent({ ...t, isImportant: !t.isImportant })}
                onEditTask={handleEventClick}
                onChangeCalendar={(taskId, calId) => {
                    const t = events.find(e => e.id === taskId);
                    if (t) handleSaveEvent({ ...t, calendarId: calId });
                }}
            />
        </div>
      </div>

      {/* FLOATING ACTION BUTTON (FAB) - ESTILO PREMIUM RECTANGULAR SÓLO ICONO */}
      <button 
        onClick={handleCreateNew}
        className="fixed bottom-24 right-6 z-50 w-14 h-14 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl flex items-center justify-center transition-all duration-300 hover:scale-105 active:scale-95 group border border-white/20 dark:border-gray-200"
        aria-label="Añadir evento"
      >
        <Plus size={28} strokeWidth={3} className="transition-transform group-hover:rotate-90 group-hover:scale-110" />
      </button>

      <ChatBot onAddEvent={handleSaveEvent} calendars={calendars} events={events} />
      <EventModal isOpen={isModalOpen} onClose={() => { setIsModalOpen(false); setSelectedEvent(null); }} onSave={handleSaveEvent} onDelete={handleDeleteEvent} initialDate={modalInitialDate} existingEvent={selectedEvent} calendars={calendars} />
      <CalendarEditModal isOpen={isCalendarEditModalOpen} onClose={() => { setIsCalendarEditModalOpen(false); setSelectedCalendarToEdit(null); }} calendar={selectedCalendarToEdit} onSave={handleSaveCalendar} onDelete={handleDeleteCalendar} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} events={events} onImportEvents={(imported) => { imported.forEach(e => dataService.createOrUpdateEvent(e)); setEvents(prev => [...prev, ...imported]); }} timeZoneConfig={timeZoneConfig} onTimeZoneChange={(cfg) => { setTimeZoneConfig(cfg); dataService.saveSettings({ timezone_config: cfg }); }} />
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} deletedEvents={deletedEvents} onRestore={handleRestoreEvent} onDeletePermanent={handleDeletePermanent} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => { setIsOnboardingOpen(false); dataService.saveSettings({ has_seen_tour: true }); }} />
      <InstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />
    </div>
  );
};

export default App;