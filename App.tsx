import React, { useState, useMemo, useEffect, useCallback } from 'react';
import { addMonths, addWeeks, addDays, differenceInMinutes, format, isAfter, isBefore, addYears, isSameDay, isValid } from 'date-fns';
import startOfDay from 'date-fns/startOfDay';
import parseISO from 'date-fns/parseISO';
import { es } from 'date-fns/locale';
import Header from './components/Header';
import Sidebar from './components/Sidebar';
import MonthView from './components/MonthView';
import WeekView from './components/WeekView';
import DayView from './components/DayView';
import AgendaView from './components/AgendaView';
import SearchResultsView from './components/SearchResultsView';
import SearchFilters from './components/SearchFilters';
import EventModal, { DeleteMode } from './components/EventModal';
import CalendarEditModal from './components/CalendarEditModal';
import TrashModal from './components/TrashModal';
import SettingsModal from './components/SettingsModal';
import ChatBot from './components/ChatBot';
import OnboardingModal from './components/OnboardingModal';
import InstructionsModal from './components/InstructionsModal';
import TaskPanel from './components/TaskPanel';
import { CalendarEvent, ViewType, CalendarConfig, SearchCriteria, Theme, TimeZoneConfig } from './types';
import { EVENT_COLORS, DEFAULT_CALENDARS, CALENDAR_IDS } from './constants';
import { Plus, Loader2, RefreshCcw, X } from 'lucide-react';
import { generateRecurringEvents } from './utils/dateUtils';
import { googleCalendarService } from './services/googleCalendarService';
import { dataService, UserSettings } from './services/dataService';

// --- VISUAL EFFECTS UTILS ---
const playSuccessSound = () => {
  try {
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();
    
    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);
    
    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(500, audioContext.currentTime);
    oscillator.frequency.exponentialRampToValueAtTime(1000, audioContext.currentTime + 0.1);
    
    gainNode.gain.setValueAtTime(0.1, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.1);
    
    oscillator.start();
    oscillator.stop(audioContext.currentTime + 0.1);
  } catch (e) {
    // Silent fail if audio is blocked
  }
};

const triggerConfetti = () => {
  const colors = ['#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#8B5CF6', '#EC4899'];
  const particleCount = 30; // Reduced count for performance
  
  for (let i = 0; i < particleCount; i++) {
    const particle = document.createElement('div');
    const color = colors[Math.floor(Math.random() * colors.length)];
    const x = Math.random() * window.innerWidth;
    const y = Math.random() * window.innerHeight;
    
    particle.style.position = 'fixed';
    particle.style.left = '50%';
    particle.style.top = '50%';
    particle.style.width = '8px';
    particle.style.height = '8px';
    particle.style.backgroundColor = color;
    particle.style.borderRadius = '50%';
    particle.style.pointerEvents = 'none';
    particle.style.zIndex = '9999';
    particle.style.transform = `translate(-50%, -50%)`;
    
    document.body.appendChild(particle);

    const destinationX = (Math.random() - 0.5) * 500;
    const destinationY = (Math.random() - 0.5) * 500;
    const rotation = Math.random() * 520;
    const delay = Math.random() * 200;

    const animation = particle.animate([
      { transform: `translate(-50%, -50%) scale(0)`, opacity: 1 },
      { transform: `translate(calc(-50% + ${destinationX}px), calc(-50% + ${destinationY}px)) rotate(${rotation}deg) scale(1)`, opacity: 0 }
    ], {
      duration: 1000 + Math.random() * 1000,
      easing: 'cubic-bezier(0, .9, .57, 1)',
      delay: delay
    });

    animation.onfinish = () => {
      particle.remove();
    };
  }
};
// ---------------------------

// UUID Generator Helper
const generateUUID = () => {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
    const r = Math.random() * 16 | 0;
    const v = c === 'x' ? r : (r & 0x3 | 0x8);
    return v.toString(16);
  });
};

// --- SKELETON LOADER COMPONENT ---
const AppSkeleton = () => (
  <div className="h-[100dvh] w-screen flex flex-col bg-[#F3F4F6] dark:bg-[#0B0F19] overflow-hidden">
    {/* Header Skeleton */}
    <div className="h-20 px-6 flex items-center gap-4 shrink-0 border-b border-gray-200/50 dark:border-gray-800/50">
       <div className="w-10 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
       <div className="w-32 h-8 rounded-lg bg-gray-200 dark:bg-gray-800 animate-pulse hidden md:block"></div>
       <div className="flex-1"></div>
       <div className="w-64 h-10 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse hidden md:block"></div>
       <div className="w-10 h-10 rounded-full bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
    </div>
    
    <div className="flex flex-1 overflow-hidden p-6 gap-6">
       {/* Sidebar Skeleton */}
       <div className="hidden lg:block w-64 h-full bg-white/50 dark:bg-gray-900/50 rounded-3xl p-4 space-y-4">
           <div className="w-full h-12 rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
           <div className="w-full aspect-square rounded-xl bg-gray-200 dark:bg-gray-800 animate-pulse opacity-50"></div>
           <div className="space-y-2 pt-4">
              {[1,2,3,4].map(i => (
                  <div key={i} className="flex items-center gap-3">
                      <div className="w-4 h-4 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                      <div className="h-4 w-24 rounded bg-gray-200 dark:bg-gray-800 animate-pulse"></div>
                  </div>
              ))}
           </div>
       </div>

       {/* Main Content Skeleton */}
       <div className="flex-1 bg-white/50 dark:bg-gray-900/50 rounded-3xl p-4 relative overflow-hidden">
           {/* Grid Lines */}
           <div className="w-full h-full grid grid-rows-6 gap-4">
               {[1,2,3,4,5,6].map(i => (
                   <div key={i} className="w-full h-full border-b border-gray-200/50 dark:border-gray-800/50 flex items-center gap-4">
                       <div className="w-full h-full bg-gray-100/30 dark:bg-gray-800/30 rounded-lg animate-pulse" style={{ animationDelay: `${i * 0.1}s` }}></div>
                   </div>
               ))}
           </div>
       </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [view, setView] = useState<ViewType>('agenda'); 
  const [lastView, setLastView] = useState<ViewType>('agenda');
  const [currentDate, setCurrentDate] = useState(new Date());
  const [isSidebarOpen, setIsSidebarOpen] = useState(true); // Default open on desktop
  
  // Data State
  const [isLoadingData, setIsLoadingData] = useState(true);
  const [events, setEvents] = useState<CalendarEvent[]>([]);
  const [calendars, setCalendars] = useState<CalendarConfig[]>([]);
  
  // Settings State 
  const [theme, setTheme] = useState<Theme>('system');
  const [timeZoneConfig, setTimeZoneConfig] = useState<TimeZoneConfig>({ showSecondary: false, primary: 'local', secondary: 'UTC' });
  const [isTourOpen, setIsTourOpen] = useState(false);
  const [settingsLoaded, setSettingsLoaded] = useState(false);

  // Auth / UI State
  const [isGoogleConnected, setIsGoogleConnected] = useState(false);
  const [isGoogleLoading, setIsGoogleLoading] = useState(false);
  const [isInstructionsOpen, setIsInstructionsOpen] = useState(false);
  const [isTrashOpen, setIsTrashOpen] = useState(false);
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [isTaskPanelOpen, setIsTaskPanelOpen] = useState(false);

  // PWA Install State
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  
  // PWA Update State
  const [isUpdateAvailable, setIsUpdateAvailable] = useState(false);
  const [swRegistration, setSwRegistration] = useState<ServiceWorkerRegistration | null>(null);

  // Notification State
  const [notifiedEventIds, setNotifiedEventIds] = useState<Set<string>>(new Set());
  const [notificationPermission, setNotificationPermission] = useState<NotificationPermission>('default');

  // Responsive Sidebar Check & PWA Logic
  useEffect(() => {
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
    
    // PWA Install Listener
    window.addEventListener('beforeinstallprompt', (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
    });

    // PWA Service Worker Registration with Update Handling
    if ('serviceWorker' in navigator) {
      const swUrl = '/service-worker.js';

      navigator.serviceWorker.register(swUrl)
        .then((registration) => {
          setSwRegistration(registration);

          if (registration.waiting) {
            setIsUpdateAvailable(true);
          }

          registration.onupdatefound = () => {
            const installingWorker = registration.installing;
            if (installingWorker) {
              installingWorker.onstatechange = () => {
                if (installingWorker.state === 'installed' && navigator.serviceWorker.controller) {
                  setIsUpdateAvailable(true);
                }
              };
            }
          };
        })
        .catch(error => {
          if (error.message && (error.message.includes('origin') || error.message.includes('scriptURL'))) {
             console.warn('SW Skipped (Preview Mode)');
          } else {
             console.error('SW Registration failed:', error);
          }
        });

      let refreshing = false;
      navigator.serviceWorker.addEventListener('controllerchange', () => {
        if (!refreshing) {
          window.location.reload();
          refreshing = true;
        }
      });
    }
  }, []);

  const handleUpdateApp = () => {
    if (swRegistration && swRegistration.waiting) {
      swRegistration.waiting.postMessage({ type: 'SKIP_WAITING' });
      setIsUpdateAvailable(false);
    } else {
        window.location.reload();
    }
  };

  const handleInstallPwa = async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setDeferredPrompt(null);
    }
  };

  // --- INITIAL DATA LOADING ---
  useEffect(() => {
    const loadData = async () => {
      setIsLoadingData(true);
      try {
        let [loadedEvents, loadedCalendars, loadedSettings] = await Promise.all([
          dataService.getEvents(),
          dataService.getCalendars(),
          dataService.getSettings()
        ]);
        
        // --- MIGRATION LOGIC ---
        const requiredIds = [CALENDAR_IDS.PERSONAL, CALENDAR_IDS.WORK];
        const hasStandardCalendars = loadedCalendars.some(c => requiredIds.includes(c.id));
        
        if (!hasStandardCalendars && loadedCalendars.length > 0) {
            const resetCals = await dataService.resetCalendars();
            loadedCalendars = resetCals;
            loadedEvents = await dataService.getEvents();
        }

        setEvents(loadedEvents);
        setCalendars(loadedCalendars);
        
        setTheme(loadedSettings.theme);
        setTimeZoneConfig(loadedSettings.timezone_config);
        
        if (loadedSettings.metadata) {
            if (loadedSettings.metadata.isGoogleConnected) {
                setIsGoogleConnected(true);
                handleConnectGoogle(true);
            }
            if (loadedSettings.metadata.notifiedEventIds && Array.isArray(loadedSettings.metadata.notifiedEventIds)) {
                setNotifiedEventIds(new Set<string>(loadedSettings.metadata.notifiedEventIds as string[]));
            }
            if (loadedSettings.metadata.lastView) {
                setView(loadedSettings.metadata.lastView as ViewType);
            }
        }
        
        if (!loadedSettings.has_seen_tour) {
            setTimeout(() => setIsTourOpen(true), 1500);
        }

        setSettingsLoaded(true);
      } catch (error) {
        console.error("Failed to load initial data", error);
      } finally {
        setIsLoadingData(false);
      }
    };
    loadData();
    
    if (typeof window !== 'undefined' && 'Notification' in window) {
        setNotificationPermission(Notification.permission);
    }
  }, []);

  const handleThemeChange = (newTheme: Theme) => {
    setTheme(newTheme);
    dataService.saveSettings({ theme: newTheme });
  };

  const handleTimeZoneChange = (newConfig: TimeZoneConfig) => {
    setTimeZoneConfig(newConfig);
    dataService.saveSettings({ timezone_config: newConfig });
  };

  const handleCloseTour = () => {
    setIsTourOpen(false);
    dataService.saveSettings({ has_seen_tour: true });
  };

  const handleStartTour = () => setIsTourOpen(true);
  const handleShowInstructions = () => setIsInstructionsOpen(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const root = window.document.documentElement;
    const applyTheme = (t: Theme) => {
      if (t === 'dark' || (t === 'system' && window.matchMedia('(prefers-color-scheme: dark)').matches)) {
        root.classList.add('dark');
      } else {
        root.classList.remove('dark');
      }
    };
    applyTheme(theme);
    if (theme === 'system') {
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      const handleChange = () => applyTheme('system');
      mediaQuery.addEventListener('change', handleChange);
      return () => mediaQuery.removeEventListener('change', handleChange);
    }
  }, [theme]);

  // Roll over unfinished tasks
  useEffect(() => {
    if (isLoadingData) return;
    const todayStart = startOfDay(new Date());
    
    setEvents(prevEvents => {
        let changed = false;
        const updatedEvents = prevEvents.map(ev => {
            if (ev.isTask && !ev.isCompleted && isBefore(startOfDay(ev.start), todayStart)) {
                changed = true;
                const newStart = new Date(todayStart);
                newStart.setHours(9, 0, 0, 0); 
                const newEnd = new Date(todayStart);
                newEnd.setHours(9, 30, 0, 0);
                const updatedTask = { ...ev, start: newStart, end: newEnd };
                dataService.createOrUpdateEvent(updatedTask);
                return updatedTask;
            }
            return ev;
        });
        return changed ? updatedEvents : prevEvents;
    });
  }, [currentDate, isLoadingData]);

  const [searchCriteria, setSearchCriteria] = useState<SearchCriteria>({ query: '' });
  const [isFiltersOpen, setIsFiltersOpen] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedEvent, setSelectedEvent] = useState<CalendarEvent | null>(null);
  const [modalInitialDate, setModalInitialDate] = useState<Date>(new Date());
  const [editingCalendar, setEditingCalendar] = useState<CalendarConfig | null>(null);

  const isSearching = useMemo(() => {
    return !!(searchCriteria.query.trim() || searchCriteria.startDate || searchCriteria.calendarId);
  }, [searchCriteria]);

  useEffect(() => {
    if (isSearching && view !== 'search') {
      setLastView(view);
      setView('search');
    } else if (!isSearching && view === 'search') {
      setView(lastView);
    }
  }, [isSearching, view, lastView]);

  const visibleCalendarIds = useMemo(() => {
    return calendars.filter(c => c.visible).map(c => c.id);
  }, [calendars]);

  // OPTIMIZED: Limit view range expansion to avoid huge calculations on every render
  const displayedEvents = useMemo(() => {
    const activeEvents = events.filter(e => !e.deletedAt);

    if (isSearching) {
       // Search mode usually needs a wider range, but limit to +/- 1 year
       const searchStart = addYears(new Date(), -1);
       const searchEnd = addYears(new Date(), 1);
       const allInstances = generateRecurringEvents(activeEvents, searchStart, searchEnd);

       return allInstances.filter(ev => {
          const query = searchCriteria.query.toLowerCase();
          const textMatch = !query || 
             ev.title.toLowerCase().includes(query) || 
             (ev.description || '').toLowerCase().includes(query);

          const calMatch = !searchCriteria.calendarId || ev.calendarId === searchCriteria.calendarId;

          let dateMatch = true;
          if (searchCriteria.startDate) {
              const startLimit = parseISO(searchCriteria.startDate);
              if (isBefore(ev.end, startLimit)) dateMatch = false;
          }
          if (searchCriteria.endDate) {
              const endLimit = addDays(parseISO(searchCriteria.endDate), 1); 
              if (isAfter(ev.start, endLimit)) dateMatch = false;
          }

          return textMatch && calMatch && dateMatch && visibleCalendarIds.includes(ev.calendarId);
       });

    } else {
       // STANDARD VIEW: Minimize expansion range based on view type
       // This drastically reduces CPU load on recurrence calculation
       let expandStart = addMonths(currentDate, -1);
       let expandEnd = addMonths(currentDate, 1);
       
       if (view === 'month') {
           expandStart = addMonths(currentDate, -1);
           expandEnd = addMonths(currentDate, 2);
       } else {
           expandStart = addWeeks(currentDate, -2);
           expandEnd = addWeeks(currentDate, 2);
       }

       const expanded = generateRecurringEvents(activeEvents, expandStart, expandEnd);
       return expanded.filter(ev => visibleCalendarIds.includes(ev.calendarId));
    }
  }, [events, currentDate, visibleCalendarIds, isSearching, searchCriteria, view]);

  const allTasks = useMemo(() => {
      return events.filter(e => e.isTask && !e.deletedAt);
  }, [events]);

  const requestNotificationPermission = async () => {
    if (typeof window === 'undefined' || !('Notification' in window)) {
      alert("Tu navegador no soporta notificaciones de escritorio.");
      return;
    }

    if (Notification.permission === 'denied') {
      alert("🚫 Las notificaciones están bloqueadas.");
      return;
    }

    try {
      const permission = await Notification.requestPermission();
      setNotificationPermission(permission);
      
      if (permission === 'granted') {
        new Notification("¡Notificaciones activadas! 🔔", {
          body: "Te avisaremos cuando tus eventos estén cerca.",
          icon: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png'
        });
      }
    } catch (e) {
      console.error("Error al solicitar permisos", e);
    }
  };

  const handleConnectGoogle = async (skipSignIn = false) => {
    setIsGoogleLoading(true);
    try {
        if (!skipSignIn) await googleCalendarService.signIn();
        setIsGoogleConnected(true);
        dataService.saveSettings({ metadata: { isGoogleConnected: true } });
        
        const remoteCalendars = await googleCalendarService.listCalendars();
        const remoteEvents = await googleCalendarService.listEvents(remoteCalendars[0].id);

        setCalendars(prev => {
            const existingIds = new Set(prev.map(c => c.id));
            const newRemote = remoteCalendars.filter(c => !existingIds.has(c.id));
            return [...prev, ...newRemote];
        });
        
        setEvents(prev => {
             const cleanLocal = prev.filter(e => !e.isRemote);
             return [...cleanLocal, ...remoteEvents];
        });

    } catch (error) {
      if (!skipSignIn) alert("No se pudo conectar con Google Calendar.");
      setIsGoogleConnected(false);
      dataService.saveSettings({ metadata: { isGoogleConnected: false } });
    } finally {
        setIsGoogleLoading(false);
    }
  };

  const handleDisconnectGoogle = () => {
      googleCalendarService.signOut();
      setIsGoogleConnected(false);
      dataService.saveSettings({ metadata: { isGoogleConnected: false } });
      setCalendars(prev => prev.filter(c => !c.isRemote));
      setEvents(prev => prev.filter(e => !e.isRemote));
  };

  // NOTIFICATION CHECKER - OPTIMIZED INTERVAL
  useEffect(() => {
    // Increased interval to 60s to reduce background CPU usage
    const checkInterval = setInterval(() => {
      if (typeof window === 'undefined' || !('Notification' in window) || Notification.permission !== 'granted') return;
      const now = new Date();
      // Only check next 24h for notifications, no need to expand year
      const checkEnd = addDays(now, 1);
      const activeEvents = events.filter(e => !e.deletedAt && !e.isCompleted);
      const upcomingInstances = generateRecurringEvents(activeEvents, now, checkEnd);

      upcomingInstances.forEach(event => {
        const reminders = event.reminderMinutes && event.reminderMinutes.length > 0 ? event.reminderMinutes : [15];
        
        reminders.forEach(reminderTime => {
            if (reminderTime === 0 && !isSameDay(event.start, now)) return; 
            const minutesUntilStart = differenceInMinutes(event.start, now);
            const notificationKey = `${event.id}_${reminderTime}_${format(event.start, 'yyyyMMddHHmm')}`; // Unique key per instance time
            
            // Check window: between reminderTime and reminderTime-1 minute
            const isTime = minutesUntilStart <= reminderTime && minutesUntilStart >= (reminderTime - 1.5);

            if (isTime && !notifiedEventIds.has(notificationKey)) {
              try {
                const notification = new Notification(event.title, {
                  body: `Comienza en ${Math.max(0, minutesUntilStart)} minutos (${format(event.start, 'h:mm a', { locale: es })})`,
                  icon: 'https://cdn-icons-png.flaticon.com/512/8943/8943377.png',
                  tag: notificationKey 
                });
                
                notification.onclick = () => {
                    window.focus();
                    setSelectedEvent(event);
                    setIsModalOpen(true);
                    notification.close();
                };
                
                setNotifiedEventIds(prev => {
                    const newSet = new Set(prev);
                    newSet.add(notificationKey);
                    // Cleanup old keys periodically could be added here
                    return newSet;
                });
              } catch (e) {
                console.error("Notification failed", e);
              }
            }
        });
      });
    }, 60000); // Check every minute instead of 10s

    return () => clearInterval(checkInterval);
  }, [events, notifiedEventIds]);

  const handleToggleCalendar = (id: string) => {
    setCalendars(prev => prev.map(c => c.id === id ? { ...c, visible: !c.visible } : c));
  };

  const handleToggleAllCalendars = (visible: boolean) => {
    setCalendars(prev => prev.map(c => ({ ...c, visible })));
  };

  const handleAddCalendar = () => {
    setEditingCalendar({
      id: 'new',
      label: '',
      color: EVENT_COLORS[Math.floor(Math.random() * EVENT_COLORS.length)],
      visible: true
    });
  };
  
  const handleReorderCalendars = (fromIndex: number, toIndex: number) => {
    const updatedCalendars = [...calendars];
    const [movedCalendar] = updatedCalendars.splice(fromIndex, 1);
    updatedCalendars.splice(toIndex, 0, movedCalendar);
    setCalendars(updatedCalendars);
  };

  const handleUpdateCalendar = async (id: string, updates: Partial<CalendarConfig>) => {
    let newCalendarConfig: CalendarConfig;
    if (id === 'new') {
        newCalendarConfig = {
            id: generateUUID(),
            label: updates.label || 'Nuevo calendario',
            color: updates.color || EVENT_COLORS[0],
            visible: true,
        };
        setCalendars(prev => [...prev, newCalendarConfig]);
    } else {
        const existing = calendars.find(c => c.id === id);
        if (!existing) return;
        newCalendarConfig = { ...existing, ...updates };
        setCalendars(prev => prev.map(c => c.id === id ? newCalendarConfig : c));
        if (updates.color) {
            setEvents(prev => prev.map(e => e.calendarId === id ? { ...e, color: updates.color as string } : e));
        }
    }
    await dataService.saveCalendar(newCalendarConfig);
  };

  const handleDeleteCalendar = async (id: string) => {
    setCalendars(prev => prev.filter(c => c.id !== id));
    setEvents(prev => prev.filter(e => e.calendarId !== id));
    setEditingCalendar(null);
    await dataService.deleteCalendar(id);
  };

  const handleNext = useCallback(() => {
    setCurrentDate(curr => {
        switch(view) {
          case 'month': return addMonths(curr, 1);
          case 'week': return addWeeks(curr, 1);
          case 'day': return addDays(curr, 1);
          case 'agenda': return addDays(curr, 1);
          default: return curr;
        }
    });
  }, [view]);

  const handlePrev = useCallback(() => {
    setCurrentDate(curr => {
        switch(view) {
          case 'month': return addMonths(curr, -1);
          case 'week': return addWeeks(curr, -1);
          case 'day': return addDays(curr, -1);
          case 'agenda': return addDays(curr, -1);
          default: return curr;
        }
    });
  }, [view]);

  const handleToday = useCallback(() => setCurrentDate(new Date()), []);

  const handleViewChange = (newView: ViewType) => {
    if (newView !== 'search') {
        setSearchCriteria({ query: '' });
    }
    setView(newView);
    if (window.innerWidth < 1024) {
        setIsSidebarOpen(false);
    }
    dataService.saveSettings({ metadata: { lastView: newView } });
  };

  const handleEventClick = (event: CalendarEvent) => {
    setSelectedEvent(event);
    setIsModalOpen(true);
  };
  
  const handleToggleTaskCompletion = async (event: CalendarEvent) => {
      const originalId = event.id.includes('_') ? event.id.split('_')[0] : event.id;
      
      const masterEvent = events.find(e => e.id === originalId);
      if (!masterEvent) return;

      if (!masterEvent.isCompleted) {
          triggerConfetti();
          playSuccessSound();
      }
      
      const updatedEvent = { ...masterEvent, isCompleted: !masterEvent.isCompleted };
      setEvents(prev => prev.map(e => e.id === originalId ? updatedEvent : e));
      await dataService.createOrUpdateEvent(updatedEvent);
  };

  const handleToggleTaskImportance = async (event: CalendarEvent) => {
      const originalId = event.id.includes('_') ? event.id.split('_')[0] : event.id;
      const masterEvent = events.find(e => e.id === originalId);
      if (!masterEvent) return;

      const updatedEvent = { ...masterEvent, isImportant: !masterEvent.isImportant };
      setEvents(prev => prev.map(e => e.id === originalId ? updatedEvent : e));
      await dataService.createOrUpdateEvent(updatedEvent);
  };

  const handleChangeTaskCalendar = async (taskId: string, calendarId: string) => {
     const originalId = taskId.includes('_') ? taskId.split('_')[0] : taskId;
     const masterEvent = events.find(e => e.id === originalId);
     const targetCalendar = calendars.find(c => c.id === calendarId);
     
     if (!masterEvent || !targetCalendar) return;

     const updatedEvent = { ...masterEvent, calendarId: calendarId, color: targetCalendar.color };
     setEvents(prev => prev.map(e => e.id === originalId ? updatedEvent : e));
     await dataService.createOrUpdateEvent(updatedEvent);
  };
  
  const handleQuickAddTask = async (title: string, calendarId?: string) => {
      const now = new Date();
      // Default to "Tareas" or the first calendar if no ID provided
      const targetCalId = calendarId || calendars.find(c => c.label === 'Tareas')?.id || calendars[0]?.id || 'default';
      const targetCal = calendars.find(c => c.id === targetCalId);

      const newTask: CalendarEvent = {
        id: generateUUID(),
        title: title,
        start: now,
        end: new Date(now.getTime() + 30 * 60000), 
        color: targetCal?.color || '#3F51B5',
        recurrence: 'none',
        calendarId: targetCalId,
        isTask: true,
        isCompleted: false,
        isImportant: false
      };
      setEvents(prev => [...prev, newTask]);
      await dataService.createOrUpdateEvent(newTask);
  };

  const handleTimeSlotClick = (date: Date) => {
    setSelectedEvent(null);
    setModalInitialDate(date);
    setIsModalOpen(true);
  };

  const handleCreateBirthday = () => {
    const bdayCal = calendars.find(c => c.label === 'Cumpleaños');
    const tempBirthdayEvent: any = {
        title: '',
        start: currentDate, 
        end: currentDate,
        isBirthday: true, 
        recurrence: 'yearly',
        calendarId: bdayCal?.id || calendars[0]?.id,
        color: bdayCal?.color || '#7CB342' 
    };
    setSelectedEvent(tempBirthdayEvent);
    setModalInitialDate(currentDate);
    setIsModalOpen(true);
    if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };
  
  const handleCreateTask = () => {
     const taskCal = calendars.find(c => c.label === 'Tareas');
     const tempTask: any = {
        title: '',
        start: currentDate,
        end: currentDate,
        isTask: true,
        calendarId: taskCal?.id || calendars[0]?.id,
        color: taskCal?.color || '#3F51B5'
     };
     setSelectedEvent(tempTask);
     setModalInitialDate(currentDate);
     setIsModalOpen(true);
     if (window.innerWidth < 1024) setIsSidebarOpen(false);
  };

  const saveEvent = async (eventData: Partial<CalendarEvent>) => {
    let eventToSave: CalendarEvent;
    
    const ensureDate = (d: any): Date => {
        if (!d) return new Date(); 
        if (d instanceof Date) {
            return isValid(d) ? d : new Date();
        }
        if (typeof d === 'string') {
            const p = parseISO(d);
            return isValid(p) ? p : new Date();
        }
        return new Date(); 
    };

    if (eventData.id) {
      const existing = events.find(e => e.id === eventData.id);
      if (!existing) return;
      
      eventToSave = { 
          ...existing, 
          ...eventData,
          start: ensureDate(eventData.start || existing.start),
          end: ensureDate(eventData.end || existing.end)
      } as CalendarEvent;
      
      setEvents(prev => prev.map(e => e.id === eventData.id ? eventToSave : e));
    } else {
      eventToSave = {
        id: generateUUID(),
        title: eventData.title || '(Sin título)',
        start: ensureDate(eventData.start),
        end: ensureDate(eventData.end),
        description: eventData.description,
        color: eventData.color || '#039BE5',
        recurrence: eventData.recurrence || 'none',
        calendarId: eventData.calendarId || (calendars.length > 0 ? calendars[0].id : 'default'),
        reminderMinutes: eventData.reminderMinutes || [15],
        isBirthday: eventData.isBirthday,
        location: eventData.location, 
        isTask: eventData.isTask,
        isCompleted: eventData.isCompleted,
        isImportant: eventData.isImportant
      };
      setEvents(prev => [...prev, eventToSave]);
    }
    
    const savedEvent = await dataService.createOrUpdateEvent(eventToSave);
    
    if (savedEvent.id !== eventToSave.id) {
         setEvents(prev => prev.map(e => e.id === eventToSave.id ? savedEvent : e));
    }
  };

  const handleAIAddEvent = (eventData: any) => {
      try {
          saveEvent({
              ...eventData,
              calendarId: eventData.calendarId || (calendars.length > 0 ? calendars[0].id : 'default'),
              recurrence: eventData.recurrence || 'none',
              reminderMinutes: eventData.reminderMinutes || [15]
          });
          
          if (eventData.start) {
              const d = new Date(eventData.start);
              if (isValid(d)) setCurrentDate(d);
          }
      } catch (e) {
          console.error("Error procesando evento de IA:", e);
      }
  };

  const deleteEvent = async (id: string, mode: DeleteMode) => {
    const [originalId, timestampStr] = id.split('_');
    const instanceDate = timestampStr ? new Date(parseInt(timestampStr)) : null;

    if (mode === 'all') {
         setEvents(prev => prev.map(ev => 
             ev.id === originalId ? { ...ev, deletedAt: new Date() } : ev
         ));
         await dataService.deleteEvent(originalId, false);
    } else if (mode === 'this' && instanceDate) {
         const event = events.find(e => e.id === originalId);
         if (event) {
             const updated = {
                 ...event,
                 exdates: [...(event.exdates || []), instanceDate]
             };
             setEvents(prev => prev.map(e => e.id === originalId ? updated : e));
             await dataService.createOrUpdateEvent(updated);
         }
    } else if (mode === 'following' && instanceDate) {
         const event = events.find(e => e.id === originalId);
         if (event) {
             const updated = {
                 ...event,
                 recurrenceEnds: addDays(instanceDate, -1)
             };
             setEvents(prev => prev.map(e => e.id === originalId ? updated : e));
             await dataService.createOrUpdateEvent(updated);
         }
    }
  };

  const restoreEvent = async (id: string) => {
      const event = events.find(e => e.id === id);
      if (event) {
          const updated = { ...event, deletedAt: undefined };
          setEvents(prev => prev.map(e => e.id === id ? updated : e));
          await dataService.createOrUpdateEvent(updated);
      }
  };

  const permanentDeleteEvent = async (id: string) => {
      setEvents(prev => prev.filter(e => e.id !== id));
      await dataService.deleteEvent(id, true);
  };
  
  const handleImportEvents = (newEvents: CalendarEvent[]) => {
      const safeEvents = newEvents.map(ev => ({
          ...ev,
          start: new Date(ev.start),
          end: new Date(ev.end)
      }));
      setEvents(prev => [...prev, ...safeEvents]);
      safeEvents.forEach(ev => dataService.createOrUpdateEvent(ev));
  };

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
        if (['INPUT', 'TEXTAREA', 'SELECT'].includes((e.target as HTMLElement).tagName) || isModalOpen || editingCalendar || isTourOpen || isInstructionsOpen || isSettingsOpen) {
            return;
        }

        switch(e.key.toLowerCase()) {
            case 'j':
            case 'n': handleNext(); break;
            case 'k':
            case 'p': handlePrev(); break;
            case 't': handleToday(); break;
            case 'c':
                setSelectedEvent(null);
                setModalInitialDate(currentDate);
                setIsModalOpen(true);
                break;
            case '/':
                e.preventDefault(); 
                const searchInput = document.getElementById('global-search-input');
                if (searchInput) searchInput.focus();
                break;
        }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [handleNext, handlePrev, handleToday, isModalOpen, editingCalendar, currentDate, isTourOpen, isInstructionsOpen, isSettingsOpen]);

  if (isLoadingData) {
      return <AppSkeleton />;
  }

  return (
    <div className="h-[100dvh] w-screen flex flex-col bg-[#F3F4F6] dark:bg-[#0B0F19] overflow-hidden font-sans text-gray-800 dark:text-gray-100 transition-colors duration-300">
      
      {/* PREMIUM BACKGROUND */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        {/* Soft Mesh Gradients */}
        <div className="absolute -top-[20%] -left-[10%] w-[70vw] h-[70vw] bg-purple-200/30 dark:bg-purple-900/10 rounded-full blur-[100px] animate-float opacity-70"></div>
        <div className="absolute top-[10%] -right-[10%] w-[60vw] h-[60vw] bg-blue-200/30 dark:bg-blue-900/10 rounded-full blur-[100px] animate-float opacity-70" style={{ animationDelay: '1s' }}></div>
        <div className="absolute -bottom-[20%] left-[20%] w-[60vw] h-[60vw] bg-indigo-200/30 dark:bg-indigo-900/10 rounded-full blur-[100px] animate-float opacity-70" style={{ animationDelay: '2s' }}></div>
      </div>

      <Header 
        currentDate={currentDate}
        view={view}
        events={displayedEvents}
        onViewChange={handleViewChange}
        onDateSelect={(d) => setCurrentDate(d)}
        onMenuClick={() => setIsSidebarOpen(!isSidebarOpen)}
        onPrev={handlePrev}
        onNext={handleNext}
        onToday={handleToday}
        searchCriteria={searchCriteria}
        onSearchChange={setSearchCriteria}
        onToggleFilters={() => setIsFiltersOpen(!isFiltersOpen)}
        theme={theme}
        onThemeChange={handleThemeChange}
        onStartTour={handleStartTour}
        onShowInstructions={handleShowInstructions}
        onToggleTaskPanel={() => setIsTaskPanelOpen(!isTaskPanelOpen)}
        isTaskPanelOpen={isTaskPanelOpen}
        onCreateClick={() => { setSelectedEvent(null); setModalInitialDate(currentDate); setIsModalOpen(true); }}
        calendars={calendars}
      />

      <div className="relative z-10 flex flex-1 overflow-hidden p-3 md:p-6 md:pt-2 gap-4">
        
         <SearchFilters 
            isOpen={isFiltersOpen}
            onClose={() => setIsFiltersOpen(false)}
            criteria={searchCriteria}
            onCriteriaChange={setSearchCriteria}
            calendars={calendars}
         />

        <Sidebar 
          isOpen={isSidebarOpen} 
          currentDate={currentDate}
          onDateSelect={(d) => { setCurrentDate(d); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
          onCreateClick={() => { setSelectedEvent(null); setModalInitialDate(currentDate); setIsModalOpen(true); if(window.innerWidth < 1024) setIsSidebarOpen(false); }}
          onCreateBirthday={handleCreateBirthday}
          onCreateTask={handleCreateTask}
          currentView={view}
          onViewChange={handleViewChange}
          calendars={calendars}
          onToggleCalendar={handleToggleCalendar}
          onToggleAllCalendars={handleToggleAllCalendars}
          onEditCalendar={(cal) => setEditingCalendar(cal)}
          onAddCalendar={handleAddCalendar}
          onReorderCalendars={handleReorderCalendars}
          notificationPermission={notificationPermission}
          onRequestNotifications={requestNotificationPermission}
          theme={theme}
          onThemeChange={handleThemeChange}
          isGoogleConnected={isGoogleConnected}
          onConnectGoogle={() => handleConnectGoogle(false)}
          onDisconnectGoogle={handleDisconnectGoogle}
          isGoogleLoading={isGoogleLoading}
          onOpenTrash={() => setIsTrashOpen(true)}
          onOpenSettings={() => setIsSettingsOpen(true)}
          onClose={() => setIsSidebarOpen(false)}
          // PWA Props
          deferredPrompt={deferredPrompt}
          onInstallPwa={handleInstallPwa}
        />

        {/* Backdrop for Mobile */}
        {isSidebarOpen && (
            <div 
                className="fixed inset-0 bg-black/20 backdrop-blur-[2px] z-20 lg:hidden animate-fade-in-up"
                onClick={() => setIsSidebarOpen(false)}
            ></div>
        )}

        <main className="flex-1 flex flex-col relative w-full overflow-hidden bg-white/70 dark:bg-gray-900/60 backdrop-blur-xl shadow-premium dark:shadow-premium-dark rounded-3xl border border-white/50 dark:border-gray-800/50 transition-all duration-300">
          
          {/* VIEW TRANSITION WRAPPER */}
          <div key={view} className="animate-view-enter h-full w-full">
            {view === 'month' && (
              <MonthView 
                currentDate={currentDate} 
                events={displayedEvents}
                calendars={calendars}
                onEventClick={handleEventClick} 
                onTimeSlotClick={handleTimeSlotClick}
                onToggleTaskCompletion={handleToggleTaskCompletion}
              />
            )}
            {view === 'week' && (
              <WeekView 
                currentDate={currentDate} 
                events={displayedEvents} 
                calendars={calendars}
                onEventClick={handleEventClick} 
                onTimeSlotClick={handleTimeSlotClick}
                timeZoneConfig={timeZoneConfig}
                onToggleTaskCompletion={handleToggleTaskCompletion}
              />
            )}
            {view === 'day' && (
              <DayView 
                currentDate={currentDate} 
                events={displayedEvents} 
                calendars={calendars}
                onEventClick={handleEventClick} 
                onTimeSlotClick={handleTimeSlotClick}
                timeZoneConfig={timeZoneConfig}
                onToggleTaskCompletion={handleToggleTaskCompletion}
              />
            )}
            {view === 'agenda' && (
              <AgendaView 
                currentDate={currentDate} 
                events={displayedEvents} 
                calendars={calendars}
                onEventClick={handleEventClick} 
                onTimeSlotClick={handleTimeSlotClick}
                onToggleTaskCompletion={handleToggleTaskCompletion}
              />
            )}
            {view === 'search' && (
              <SearchResultsView 
                currentDate={currentDate} 
                events={displayedEvents} 
                calendars={calendars}
                onEventClick={handleEventClick} 
                onTimeSlotClick={handleTimeSlotClick}
              />
            )}
          </div>
        </main>
        
        {/* FAB moved outside of main to fix backdrop-filter containing block issues on mobile */}
        <button 
            onClick={() => {
            setSelectedEvent(null);
            setModalInitialDate(currentDate);
            setIsModalOpen(true);
            }}
            className="lg:hidden fixed bottom-24 right-6 z-50 w-14 h-14 bg-gray-900 dark:bg-white text-white dark:text-black rounded-2xl shadow-xl shadow-gray-900/30 dark:shadow-white/20 flex items-center justify-center animate-scale-in hover:scale-105 active:scale-95 transition-transform duration-300 border border-white/20"
            title="Crear evento"
        >
            <Plus className="w-8 h-8" strokeWidth={2.5} />
        </button>

        {/* Update Prompt Toast */}
        {isUpdateAvailable && (
          <div className="fixed bottom-6 left-6 z-[100] bg-white dark:bg-gray-800 p-4 rounded-xl shadow-2xl border border-gray-200 dark:border-gray-700 animate-slide-in-right flex items-center gap-4 max-w-sm">
             <div className="w-10 h-10 bg-blue-100 dark:bg-blue-900/30 rounded-full flex items-center justify-center shrink-0">
               <RefreshCcw className="text-blue-600 dark:text-blue-400 w-5 h-5 animate-spin-slow" />
             </div>
             <div className="flex-1">
               <h4 className="font-bold text-sm text-gray-800 dark:text-white">Nueva versión disponible</h4>
               <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">Actualiza para ver los cambios.</p>
             </div>
             <div className="flex flex-col gap-2">
                <button 
                  onClick={handleUpdateApp}
                  className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold rounded-lg transition-colors"
                >
                  Actualizar
                </button>
                <button 
                  onClick={() => setIsUpdateAvailable(false)}
                  className="px-3 py-1.5 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 text-xs font-medium rounded-lg transition-colors"
                >
                  Cerrar
                </button>
             </div>
          </div>
        )}

        <div className={`
             absolute right-4 top-2 bottom-4 z-20 transition-all duration-500 cubic-bezier(0.16, 1, 0.3, 1)
             lg:relative lg:top-0 lg:bottom-0 lg:right-0
             ${isTaskPanelOpen ? 'translate-x-0 opacity-100' : 'translate-x-[120%] lg:translate-x-0 lg:w-0 lg:opacity-0 opacity-0 pointer-events-none'}
        `}>
           <div className="w-80 h-full overflow-hidden rounded-3xl bg-white/80 dark:bg-gray-900/80 backdrop-blur-xl shadow-premium border border-white/50 dark:border-gray-800">
               <TaskPanel 
                  isOpen={isTaskPanelOpen}
                  onClose={() => setIsTaskPanelOpen(false)}
                  tasks={allTasks}
                  calendars={calendars}
                  onToggleTask={handleToggleTaskCompletion}
                  onDeleteTask={(id) => deleteEvent(id, 'all')}
                  onAddTask={handleQuickAddTask}
                  onToggleImportance={handleToggleTaskImportance}
                  onChangeCalendar={handleChangeTaskCalendar}
                  onEditTask={handleEventClick}
               />
           </div>
        </div>
      </div>

      <EventModal 
        isOpen={isModalOpen} 
        onClose={() => setIsModalOpen(false)}
        onSave={saveEvent}
        onDelete={deleteEvent}
        initialDate={modalInitialDate}
        existingEvent={selectedEvent}
        calendars={calendars}
      />

      <CalendarEditModal 
        isOpen={!!editingCalendar}
        onClose={() => setEditingCalendar(null)}
        calendar={editingCalendar}
        onSave={handleUpdateCalendar}
        onDelete={handleDeleteCalendar}
      />

      <OnboardingModal 
        isOpen={isTourOpen}
        onClose={handleCloseTour}
      />

      <InstructionsModal
        isOpen={isInstructionsOpen}
        onClose={() => setIsInstructionsOpen(false)}
      />

      <TrashModal 
        isOpen={isTrashOpen}
        onClose={() => setIsTrashOpen(false)}
        deletedEvents={events.filter(e => !!e.deletedAt)}
        onRestore={restoreEvent}
        onDeletePermanent={permanentDeleteEvent}
      />

      <SettingsModal 
         isOpen={isSettingsOpen}
         onClose={() => setIsSettingsOpen(false)}
         events={events}
         onImportEvents={handleImportEvents}
         timeZoneConfig={timeZoneConfig}
         onTimeZoneChange={handleTimeZoneChange}
      />
      
      <ChatBot onAddEvent={handleAIAddEvent} calendars={calendars} events={events} />
    </div>
  );
};

export default App;