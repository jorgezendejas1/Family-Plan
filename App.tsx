
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addMonths, addWeeks, subMonths, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, startOfISOWeek, endOfISOWeek } from 'date-fns';
import { Plus, RefreshCw, LogOut } from 'lucide-react';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import AgendaView from './components/AgendaView';
import SearchResultsView from './components/SearchResultsView';
import UserManagement from './components/UserManagement';
import TaskPanel from './components/TaskPanel';
import ChatBot from './components/ChatBot';
import EventModal, { DeleteMode } from './components/EventModal';
import SettingsModal from './components/SettingsModal';
import TrashModal from './components/TrashModal';
import OnboardingModal from './components/OnboardingModal';
import InstructionsModal from './components/InstructionsModal';
import Login from './components/Login';
import LandingPage from './components/LandingPage';
import PricingModal from './components/PricingModal';
import { CalendarEvent, ViewType, CalendarConfig, SearchCriteria, Theme, TimeZoneConfig, User } from './types';
import { dataService } from './services/dataService';
import { googleCalendarService } from './services/googleCalendarService';
import { generateRecurringEvents } from './utils/dateUtils';
import { authService } from './services/authService';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [deletedEvents, setDeletedEvents] = useState<CalendarEvent[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({ query: '' });
  const [timeZoneConfig, setTimeZoneConfig] = useState<TimeZoneConfig>({ primary: 'local', secondary: 'UTC', showSecondary: false });

  const performSync = useCallback(async () => {
    const accounts = googleCalendarService.getConnectedAccounts();
    if (accounts.length === 0) return;
    setIsSyncing(true);
    try {
      const remoteEvents = await googleCalendarService.fetchAllRemoteEvents();
      setEvents(prev => {
        const localOnly = prev.filter(e => !e.isRemote);
        return [...localOnly, ...remoteEvents];
      });
      setCalendars(prev => {
        const updated = [...prev];
        let hasChanges = false;
        accounts.forEach(acc => {
          const id = `google_${acc.email}`;
          if (!updated.find(c => c.id === id)) {
            updated.push({ id, label: `Google: ${acc.email.split('@')[0]}`, color: '#4285F4', visible: true, isRemote: true });
            hasChanges = true;
          }
        });
        return hasChanges ? updated : prev;
      });
    } catch (e) {
      console.error("Sync Error:", e);
    } finally {
      setIsSyncing(false);
    }
  }, []);

  useEffect(() => {
    const user = authService.getCurrentUser();
    if (user) {
        setCurrentUser(user);
        setShowLanding(false);
    }

    const init = async () => {
        const settings = await dataService.getSettings();
        setTheme(settings.theme);
        setTimeZoneConfig(settings.timezone_config);
        if (!settings.has_seen_tour && user) setIsOnboardingOpen(true);
        const cals = await dataService.getCalendars();
        const evts = await dataService.getEvents();
        setCalendars(cals);
        setEvents(evts.filter(e => !e.deletedAt));
        setDeletedEvents(evts.filter(e => !!e.deletedAt));
        performSync();
    };
    init();
    const interval = setInterval(performSync, 180000); 
    return () => clearInterval(interval);
  }, [performSync]);

  const handleLogout = useCallback(() => {
    setCurrentUser(null);
    setShowLanding(true);
    authService.logout();
  }, []);

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
        id: eventData.id || crypto.randomUUID(),
        title: eventData.title || '(Sin título)',
        start: eventData.start || new Date(),
        end: eventData.end || new Date(),
        color: eventData.color || '#000000',
        calendarId: eventData.calendarId || 'default',
        isTask: eventData.isTask || false,
        isCompleted: eventData.isCompleted ?? false,
        isRemote: eventData.isRemote,
        remoteId: eventData.remoteId,
        description: eventData.description,
        location: eventData.location,
        category: eventData.category,
        recurrence: eventData.recurrence,
        reminderMinutes: eventData.reminderMinutes,
        isBirthday: eventData.isBirthday,
        isImportant: eventData.isImportant,
        createdByBot: eventData.createdByBot || false
    };
    const saved = await dataService.createOrUpdateEvent(newEvent);
    setEvents(prev => {
        const exists = prev.find(e => e.id === saved.id);
        if (exists) return prev.map(e => e.id === saved.id ? saved : e);
        return [...prev, saved];
    });
    if (saved.calendarId.startsWith('google_')) {
      setIsSyncing(true);
      await googleCalendarService.pushEvent(saved);
      performSync();
    }
  };

  const handleToggleTaskCompletion = (task: CalendarEvent) => {
    handleSaveEvent({ ...task, isCompleted: !task.isCompleted });
  };

  const handleDeleteEvent = async (id: string, mode: DeleteMode) => {
    const eventToDelete = events.find(e => e.id === id);
    if (eventToDelete) {
        await dataService.deleteEvent(id, false);
        setEvents(prev => prev.filter(e => e.id !== id));
        setDeletedEvents(prev => [...prev, { ...eventToDelete, deletedAt: new Date() }]);
    }
  };

  const displayedEvents = useMemo(() => {
    const visibleIds = calendars.filter(c => c.visible).map(c => c.id);
    const filtered = events.filter(e => visibleIds.includes(e.calendarId));
    let start = startOfMonth(currentDate);
    let end = endOfMonth(currentDate);
    if (view === 'week') { start = startOfWeek(currentDate); end = endOfWeek(currentDate); }
    if (view === 'day') { start = startOfDay(currentDate); end = endOfDay(currentDate); }
    return generateRecurringEvents(filtered, start, end);
  }, [events, calendars, view, currentDate]);

  if (!currentUser) {
    return showLanding ? (
        <LandingPage onGetStarted={() => setShowLanding(false)} />
    ) : (
        <Login 
          onLogin={(user) => { setCurrentUser(user); setShowLanding(false); }} 
          onBack={() => setShowLanding(true)}
        />
    );
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-black font-sans ${theme === 'dark' ? 'dark' : ''}`}>
      <Header 
        currentDate={currentDate}
        view={searchCriteria.query.trim() ? 'search' : view}
        events={events}
        onViewChange={setView}
        onDateSelect={setCurrentDate}
        onMenuClick={() => {
            setIsSidebarOpen(!isSidebarOpen);
            if (isTaskPanelOpen) setIsTaskPanelOpen(false);
        }}
        isSidebarOpen={isSidebarOpen}
        onPrev={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
        onNext={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
        onToday={() => setCurrentDate(new Date())}
        searchCriteria={searchCriteria}
        onSearchChange={setSearchCriteria}
        onToggleFilters={() => {}}
        theme={theme}
        onThemeChange={(newTheme) => {
          setTheme(newTheme);
          dataService.saveSettings({ theme: newTheme });
        }}
        onStartTour={() => setIsOnboardingOpen(true)}
        onShowInstructions={() => setIsInstructionsOpen(true)}
        onToggleTaskPanel={() => {
            setIsTaskPanelOpen(!isTaskPanelOpen);
            if (isSidebarOpen) setIsSidebarOpen(false);
        }}
        isTaskPanelOpen={isTaskPanelOpen}
        onCreateClick={() => setIsModalOpen(true)}
        onOpenSettings={() => setIsSettingsOpen(true)}
      />

      <div className="flex-1 flex overflow-hidden px-6 pb-6 gap-6 safe-area-pb relative">
        <Sidebar 
          isOpen={isSidebarOpen}
          currentDate={currentDate}
          onDateSelect={setCurrentDate}
          onCreateClick={() => setIsModalOpen(true)}
          currentView={view}
          onViewChange={setView}
          calendars={calendars}
          onToggleCalendar={(id) => setCalendars(prev => prev.map(c => c.id === id ? {...c, visible: !c.visible} : c))}
          theme={theme}
          onThemeChange={(newTheme) => {
            setTheme(newTheme);
            dataService.saveSettings({ theme: newTheme });
          }}
          onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onOpenHelp={() => setIsInstructionsOpen(true)}
          currentUser={currentUser}
          onLogout={handleLogout}
          onOpenPricing={() => setIsPricingOpen(true)}
        />

        <main className={`flex-1 bg-white dark:bg-zinc-950 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-premium overflow-hidden relative flex flex-col transition-all duration-500 ${isSidebarOpen && window.innerWidth > 1024 ? 'ml-4' : ''}`}>
            {isSyncing && (
              <div className="absolute top-4 right-4 z-50 animate-spin text-blue-500">
                <RefreshCw size={18} />
              </div>
            )}
            {view === 'users' ? (
              <UserManagement />
            ) : searchCriteria.query.trim() ? (
              <SearchResultsView events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} currentDate={currentDate} />
            ) : (
              <>
                {view === 'month' && <MonthView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onTimeSlotClick={setCurrentDate} onToggleTaskCompletion={handleToggleTaskCompletion} />}
                {view === 'week' && <WeekView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} timeZoneConfig={timeZoneConfig} onToggleTaskCompletion={handleToggleTaskCompletion} />}
                {view === 'day' && <DayView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} timeZoneConfig={timeZoneConfig} onToggleTaskCompletion={handleToggleTaskCompletion} />}
                {view === 'agenda' && <AgendaView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onToggleTaskCompletion={handleToggleTaskCompletion} />}
              </>
            )}
        </main>

        <div className={`
            absolute top-0 bottom-0 right-6 z-[80] flex transition-transform duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
            md:relative md:top-auto md:bottom-auto md:right-auto md:z-40
            ${isTaskPanelOpen ? 'translate-x-0 w-[85vw] sm:w-80 md:w-80' : 'translate-x-[120%] md:w-0 md:opacity-0 md:pointer-events-none'}
        `}>
            <div 
                className={`md:hidden fixed inset-0 bg-black/10 backdrop-blur-[2px] transition-opacity duration-500 z-[-1] ${isTaskPanelOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
                onClick={() => setIsTaskPanelOpen(false)}
            ></div>

            <div className="h-full w-full bg-white/95 dark:bg-black/95 backdrop-blur-3xl rounded-[32px] border border-black/5 dark:border-white/10 shadow-2xl relative">
                <TaskPanel 
                    isOpen={true} 
                    onClose={() => setIsTaskPanelOpen(false)} 
                    tasks={events.filter(e => e.isTask)} 
                    calendars={calendars}
                    onToggleTask={handleToggleTaskCompletion}
                    onDeleteTask={(id) => dataService.deleteEvent(id, true).then(() => setEvents(p => p.filter(e => e.id !== id)))}
                    onAddTask={(title, calId) => handleSaveEvent({ title, isTask: true, calendarId: calId })}
                    onEditTask={setSelectedEvent}
                    onToggleImportance={(t) => handleSaveEvent({ ...t, isImportant: !t.isImportant })}
                />
            </div>
        </div>
      </div>

      <button 
        onClick={() => setIsModalOpen(true)}
        className="fixed bottom-24 right-6 z-50 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 active:scale-95 transition-all group border border-white/20"
      >
        <Plus size={32} strokeWidth={3} className="group-hover:rotate-90 transition-transform" />
      </button>

      <ChatBot onAddEvent={handleSaveEvent} calendars={calendars} events={events} currentUser={currentUser} onOpenPricing={() => setIsPricingOpen(true)} />
      <EventModal isOpen={isModalOpen || !!selectedEvent} onClose={() => {setIsModalOpen(false); setSelectedEvent(null)}} onSave={handleSaveEvent} onDelete={handleDeleteEvent} calendars={calendars} existingEvent={selectedEvent} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} events={events} onImportEvents={(imported) => imported.forEach(e => handleSaveEvent(e))} timeZoneConfig={timeZoneConfig} onTimeZoneChange={(config) => { setTimeZoneConfig(config); dataService.saveSettings({ timezone_config: config }); }} />
      <TrashModal isOpen={isTrashOpen} onClose={() => setIsTrashOpen(false)} deletedEvents={deletedEvents} onRestore={async (id) => { const ev = deletedEvents.find(e => e.id === id); if (ev) { await dataService.createOrUpdateEvent({ ...ev, deletedAt: undefined }); setDeletedEvents(prev => prev.filter(e => e.id !== id)); setEvents(prev => [...prev, { ...ev, deletedAt: undefined }]); } }} onDeletePermanent={async (id) => { await dataService.deleteEvent(id, true); setDeletedEvents(prev => prev.filter(e => e.id !== id)); }} />
      <OnboardingModal isOpen={isOnboardingOpen} onClose={() => { setIsOnboardingOpen(false); dataService.saveSettings({ has_seen_tour: true }); }} />
      <InstructionsModal isOpen={isInstructionsOpen} onClose={() => setIsInstructionsOpen(false)} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
};

export default App;
