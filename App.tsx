
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
    setShowLanding(true);
  };

  useEffect(() => {
    const loggedUser = authService.getCurrentUser();
    if (loggedUser && (!currentUser || loggedUser.id !== currentUser.id)) {
      setCurrentUser(loggedUser);
      setShowLanding(false);
    }
    if (!loggedUser) {
        setShowLanding(true);
        setCurrentUser(null);
        return;
    }
    const init = async () => {
        const settings = await dataService.getSettings();
        setTheme(settings.theme || 'system');
        setTimeZoneConfig(settings.timezone_config || { primary: 'local', secondary: 'UTC', showSecondary: false });
        if (!settings.has_seen_tour) setIsOnboardingOpen(true);
        const [cals, evts] = await Promise.all([
            dataService.getCalendars(),
            dataService.getEvents()
        ]);
        setCalendars(cals);
        setEvents(evts.filter(e => !e.deletedAt));
        setDeletedEvents(evts.filter(e => !!e.deletedAt));
        performSync(cals);
    };
    init();
  }, [currentUser?.id, performSync]);

  const handleSaveEvent = async (eventData: Partial<CalendarEvent>) => {
    let finalCalendarId = eventData.calendarId || calendars[0]?.id || 'default';
    const exists = calendars.find(c => c.id === finalCalendarId);
    if (!exists && calendars.length > 0) finalCalendarId = calendars[0].id;

    const newEvent: CalendarEvent = {
        id: eventData.id || crypto.randomUUID(),
        title: eventData.title || '(Sin título)',
        start: eventData.start || new Date(),
        end: eventData.end || new Date(),
        color: eventData.color || calendars.find(c => c.id === finalCalendarId)?.color || '#000000',
        calendarId: finalCalendarId,
        isTask: !!eventData.isTask,
        isCompleted: !!eventData.isCompleted,
        isImportant: !!eventData.isImportant,
        createdByBot: !!eventData.createdByBot,
        description: eventData.description,
        location: eventData.location,
        category: eventData.category,
        remoteId: eventData.remoteId
    };

    setEvents(prev => {
        const filtered = prev.filter(e => e.id !== newEvent.id);
        return [...filtered, newEvent];
    });

    await dataService.createOrUpdateEvent(newEvent);
    await googleCalendarService.pushEventToGoogle(newEvent, calendars);
  };

  const displayedEvents = useMemo(() => {
    const visibleIds = calendars.filter(c => c.visible).map(c => c.id);
    const filtered = events.filter(e => visibleIds.includes(e.calendarId));
    
    let start: Date;
    let end: Date;
    
    if (view === 'month') {
        start = startOfWeek(startOfMonth(currentDate), { locale: es });
        end = endOfWeek(endOfMonth(currentDate), { locale: es });
    } else if (view === 'week') { 
        start = startOfWeek(currentDate, { locale: es }); 
        end = endOfWeek(currentDate, { locale: es }); 
    } else if (view === 'day') { 
        start = startOfDay(currentDate); 
        end = endOfDay(currentDate); 
    } else {
        start = startOfMonth(currentDate);
        end = endOfMonth(currentDate);
    }
    
    return generateRecurringEvents(filtered, start, end);
  }, [events, calendars, view, currentDate]);

  if (!currentUser) {
    return showLanding ? <LandingPage onGetStarted={() => setShowLanding(false)} /> : <Login onLogin={(u) => { setCurrentUser(u); setShowLanding(false); }} onBack={() => setShowLanding(true)} />;
  }

  return (
    <div className={`flex flex-col min-h-screen bg-gray-50 dark:bg-black font-sans ${theme === 'dark' ? 'dark' : ''}`}>
      <Header 
        currentDate={currentDate} view={searchCriteria.query.trim() ? 'search' : view} events={events}
        onViewChange={setView} onDateSelect={setCurrentDate} onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        isSidebarOpen={isSidebarOpen} onPrev={() => setCurrentDate(view === 'month' ? subMonths(currentDate, 1) : subWeeks(currentDate, 1))}
        onNext={() => setCurrentDate(view === 'month' ? addMonths(currentDate, 1) : addWeeks(currentDate, 1))}
        onToday={() => setCurrentDate(new Date())} searchCriteria={searchCriteria} onSearchChange={setSearchCriteria}
        onToggleFilters={() => {}} theme={theme} onThemeChange={(t) => { setTheme(t); dataService.saveSettings({ theme: t }); }}
        onStartTour={() => setIsOnboardingOpen(true)} onShowInstructions={() => setIsInstructionsOpen(true)}
        onToggleTaskPanel={() => setIsTaskPanelOpen(!isTaskPanelOpen)} isTaskPanelOpen={isTaskPanelOpen}
        onCreateClick={() => setIsModalOpen(true)} onOpenSettings={() => setIsSettingsOpen(true)}
        currentUser={currentUser} onLogout={handleLogout}
      />

      <div className="flex flex-col lg:flex-row px-4 md:px-6 pb-6 gap-6 safe-area-pb relative overflow-visible flex-1">
        <Sidebar 
          isOpen={isSidebarOpen} currentDate={currentDate} onDateSelect={setCurrentDate}
          onCreateClick={() => setIsModalOpen(true)} currentView={view} onViewChange={setView}
          calendars={calendars} onToggleCalendar={(id) => setCalendars(prev => prev.map(c => c.id === id ? {...c, visible: !c.visible} : c))}
          onCalendarsChange={(newCals) => { setCalendars(newCals); performSync(newCals); }} theme={theme} onThemeChange={setTheme} onClose={() => setIsSidebarOpen(false)}
          onOpenSettings={() => setIsSettingsOpen(true)} onOpenHelp={() => setIsInstructionsOpen(true)}
          currentUser={currentUser} onLogout={handleLogout} onOpenPricing={() => setIsPricingOpen(true)}
        />

        <main className={`flex-1 bg-white dark:bg-zinc-950 rounded-[32px] border border-gray-200 dark:border-zinc-800 shadow-premium relative flex flex-col transition-all duration-500 overflow-visible min-h-[600px]`}>
            {isSyncing && (
                <div className="absolute top-4 right-4 z-50 flex items-center gap-2 bg-white/80 dark:bg-black/80 backdrop-blur-md px-3 py-1.5 rounded-full border border-gray-100 dark:border-zinc-800 shadow-sm animate-fade-in">
                    <Loader2 className="animate-spin text-blue-500" size={14} />
                    <span className="text-[10px] font-bold dark:text-white uppercase tracking-widest">Sincronizando...</span>
                </div>
            )}
            
            {view === 'users' ? <UserManagement /> : searchCriteria.query.trim() ? <SearchResultsView events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} currentDate={currentDate} /> : (
              <div className="flex-1 overflow-visible">
                {view === 'month' && <MonthView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onTimeSlotClick={setCurrentDate} onToggleTaskCompletion={t => handleSaveEvent({...t, isCompleted: !t.isCompleted})} />}
                {view === 'week' && <WeekView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onToggleTaskCompletion={t => handleSaveEvent({...t, isCompleted: !t.isCompleted})} />}
                {view === 'day' && <DayView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onToggleTaskCompletion={t => handleSaveEvent({...t, isCompleted: !t.isCompleted})} />}
                {view === 'agenda' && <AgendaView currentDate={currentDate} events={displayedEvents} calendars={calendars} onEventClick={setSelectedEvent} onToggleTaskCompletion={t => handleSaveEvent({...t, isCompleted: !t.isCompleted})} />}
              </div>
            )}
        </main>
      </div>

      <button onClick={() => setIsModalOpen(true)} className="fixed bottom-6 right-6 z-50 w-16 h-16 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl flex items-center justify-center hover:scale-110 transition-all group border border-white/20 active:scale-90"><Plus size={32} strokeWidth={3} /></button>
      <ChatBot onAddEvent={handleSaveEvent} calendars={calendars} events={events} currentUser={currentUser} onOpenPricing={() => setIsPricingOpen(true)} />
      <EventModal isOpen={isModalOpen || !!selectedEvent} onClose={() => {setIsModalOpen(false); setSelectedEvent(null)}} onSave={handleSaveEvent} calendars={calendars} existingEvent={selectedEvent} onDelete={(id) => dataService.deleteEvent(id).then(() => setEvents(p => p.filter(e => e.id !== id)))} />
      <SettingsModal isOpen={isSettingsOpen} onClose={() => setIsSettingsOpen(false)} events={events} onImportEvents={evs => evs.forEach(handleSaveEvent)} timeZoneConfig={timeZoneConfig} onTimeZoneChange={c => { setTimeZoneConfig(c); dataService.saveSettings({ timezone_config: c }); }} />
      <PricingModal isOpen={isPricingOpen} onClose={() => setIsPricingOpen(false)} />
    </div>
  );
};

export default App;
