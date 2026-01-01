
import React, { useState, useEffect, useMemo, useCallback } from 'react';
import { addMonths, addWeeks, subMonths, subWeeks, startOfWeek, endOfWeek, startOfMonth, endOfMonth, startOfDay, endOfDay, isWithinInterval, addDays } from 'date-fns';
import { Plus, RefreshCw, Loader2 } from 'lucide-react';
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
import { es } from 'date-fns/locale';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [showLanding, setShowLanding] = useState(true);
  const [currentDate, setCurrentDate] = useState(new Date());
  const [view, setView] = useState<ViewType>('month');
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isPricingOpen, setIsPricingOpen] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [isSyncing, setIsSyncing] = useState(false);
  const [theme, setTheme] = useState<Theme>('system');
  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({ query: '' });
  const [timeZoneConfig, setTimeZoneConfig] = useState<TimeZoneConfig>({ primary: 'local', secondary: 'UTC', showSecondary: false });

  const performSync = useCallback(async (currentCals: CalendarConfig[]) => {
    if (currentCals.length === 0) return;
    setIsSyncing(true);
    try {
      const remoteEvents = await googleCalendarService.fetchAllMappedEvents(currentCals);
      setEvents(prev => [...prev.filter(e => !e.isRemote), ...remoteEvents]);
    } catch (e) { 
      console.error("Sync Error:", e); 
    } finally { 
      setIsSyncing(false); 
    }
  }, []);

  const handleLogout = () => {
    authService.logout();
    setCurrentUser(null);
    setShowLanding(false);
    setIsSidebarOpen(false);
    setIsTaskPanelOpen(false);
  };

  useEffect(() => {
    const loggedUser = authService.getCurrentUser();
    if (loggedUser) {
      setCurrentUser(loggedUser);
      setShowLanding(false);
    }
  }, []);

  useEffect(() => {
    if (currentUser) {
      const init = async () => {
          const settings = await dataService.getSettings();
          setTheme(settings.theme || 'system');
          if (!settings.has_seen_tour) setIsOnboardingOpen(true);
          const [cals, evts] = await Promise.all([
              dataService.getCalendars(),
              dataService.getEvents()
          ]);
          setCalendars(cals);
          setEvents(evts.filter(e => !e.deletedAt));
          performSync(cals);
      };
      init();
    }
  }, [currentUser, performSync]);

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    const newEvent: CalendarEvent = {
        id: eventData.id || crypto.randomUUID(),
        title: eventData.title || '(Sin título)',
        start: eventData.start || new Date(),
        end: eventData.end || new Date(),
        color: eventData.color || '#000000',
        calendarId: eventData.calendarId || calendars[0]?.id || 'default',
        isTask: !!eventData.isTask,
        isCompleted: !!eventData.isCompleted,
        isImportant: !!eventData.isImportant,
        description: eventData.description,
        location: eventData.location,
        category: eventData.category
    };

    setEvents(prev => [...prev.filter(e => e.id !== newEvent.id), newEvent]);
    await dataService.createOrUpdateEvent(newEvent);
  };

  const displayedEvents = useMemo(() => {
    const visibleIds = calendars.filter(c => c.visible).map(c => c.id);
    const filtered = events.filter(e => visibleIds.includes(e.calendarId));
    let start, end;
    if (view === 'month') { start = startOfMonth(currentDate); end = endOfMonth(currentDate); }
    else if (view === 'week') { start = startOfWeek(currentDate); end = addDays(start, 7); }
    else { start = startOfDay(currentDate); end = endOfDay(currentDate); }
    return generateRecurringEvents(filtered, start, end);
  }, [events, calendars, view, currentDate]);

  const tasks = useMemo(() => events.filter(e => e.isTask), [events]);

  if (!currentUser) {
    return showLanding ? <LandingPage onGetStarted={() => setShowLanding(false)} /> : <Login onLogin={setCurrentUser} onBack={() => setShowLanding(true)} />;
  }

  return (
    <div className={`flex flex-col h-screen bg-gray-50 dark:bg-black font-sans ${theme === 'dark' ? 'dark' : ''} overflow-hidden`}>
      <Header 
        currentDate={currentDate} view={view} events={events}
        onViewChange={setView} onDateSelect={setCurrentDate} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen} onPrev={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
        onNext={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
        onToday={() => setCurrentDate(new Date())} searchCriteria={searchCriteria} onSearchChange={setSearchCriteria}
        onToggleFilters={() => {}} theme={theme} onThemeChange={setTheme}
        onStartTour={() => setIsOnboardingOpen(true)} onShowInstructions={() => setIsInstructionsOpen(true)}
        onToggleTaskPanel={() => setIsTaskPanelOpen(!isTaskPanelOpen)} isTaskPanelOpen={isTaskPanelOpen}
        onCreateClick={() => setIsModalOpen(true)} currentUser={currentUser} onLogout={handleLogout}
      />

      <div className="flex flex-1 relative overflow-hidden px-4 md:px-6 pb-6 gap-6">
        <Sidebar 
          isOpen={isSidebarOpen} currentDate={currentDate} onDateSelect={setCurrentDate}
          onCreateClick={() => setIsModalOpen(true)} currentView={view} onViewChange={setView}
          calendars={calendars} onToggleCalendar={(id) => setCalendars(prev => prev.map(c => c.id === id ? {...c, visible: !c.visible} : c))}
          onCalendarsChange={setCalendars} theme={theme} onThemeChange={setTheme} onClose={() => setIsSidebarOpen(false)}
          currentUser={currentUser} onLogout={handleLogout} onOpenPricing={() => setIsPricingOpen(true)}
        />

        <main className={`flex-1 bg-white dark:bg-zinc-950 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-premium relative flex flex-col transition-all duration-500 overflow-hidden ${isTaskPanelOpen ? 'lg:mr-80' : ''}`}>
            <div className="flex-1 overflow-y-auto custom-scrollbar">
                {view === 'month' && <MonthView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onTimeSlotClick={setCurrentDate} />}
                {view === 'week' && <WeekView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} />}
                {view === 'day' && <DayView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} />}
                {view === 'agenda' && <AgendaView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} />}
            </div>
        </main>

        <aside className={`fixed top-[88px] bottom-6 right-6 z-[80] w-[calc(100%-48px)] md:w-80 bg-white/95 dark:bg-zinc-950/95 backdrop-blur-3xl border border-gray-200 dark:border-zinc-800 rounded-[32px] shadow-2xl transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isTaskPanelOpen ? 'translate-x-0' : 'translate-x-[120%] pointer-events-none'}`}>
           <TaskPanel 
              isOpen={isTaskPanelOpen} onClose={() => setIsTaskPanelOpen(false)}
              tasks={tasks} calendars={calendars} onToggleTask={t => handleSaveEvent({...t, isCompleted: !t.isCompleted})}
              onDeleteTask={id => dataService.deleteEvent(id).then(() => setEvents(p => p.filter(e => e.id !== id)))}
              onAddTask={(title, calId) => handleSaveEvent({ title, isTask: true, calendarId: calId })}
              onEditTask={setSelectedEvent}
           />
        </aside>
      </div>

      <ChatBot onAddEvent={handleSaveEvent} calendars={calendars} currentUser={currentUser} onOpenPricing={() => setIsPricingOpen(true)} />
      
      {/* Botón Flotante "+" (FAB) integrado debajo del ChatBot */}
      <button 
        onClick={() => setIsModalOpen(true)} 
        className="fixed bottom-6 right-6 z-[160] w-16 h-16 bg-white dark:bg-zinc-900 text-gray-800 dark:text-white rounded-3xl shadow-premium border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <Plus size={32} className="text-blue-600 dark:text-blue-400" strokeWidth={3} />
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 opacity-0 group-hover:opacity-100 transition-opacity"></div>
      </button>

      <EventModal isOpen={isModalOpen || !!selectedEvent} onClose={() => {setIsModalOpen(false); setSelectedEvent(null)}} onSave={handleSaveEvent} calendars={calendars} existingEvent={selectedEvent} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
};

export default App;
