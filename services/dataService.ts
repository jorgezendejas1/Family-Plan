import { supabase } from './supabaseClient';
import { CalendarEvent, CalendarConfig, Theme, TimeZoneConfig } from '../types';
import { DEFAULT_CALENDARS } from '../constants';
import { isValid } from 'date-fns';
import parseISO from 'date-fns/parseISO';

// --- HELPERS ---
const isSupabaseConfigured = () => !!supabase;

const safeDate = (input: any, fallback: Date = new Date()): Date => {
  if (!input) return fallback;
  if (input instanceof Date) {
    return isValid(input) ? input : fallback;
  }
  if (typeof input === 'string') {
    const parsed = parseISO(input);
    return isValid(parsed) ? parsed : fallback;
  }
  const fromNum = new Date(input);
  return isValid(fromNum) ? fromNum : fallback;
};

const mapEventFromDB = (dbEvent: any): CalendarEvent => ({
  ...dbEvent,
  start: safeDate(dbEvent.start_date),
  end: safeDate(dbEvent.end_date),
  calendarId: dbEvent.calendar_id,
  isBirthday: dbEvent.is_birthday,
  isTask: dbEvent.is_task,
  isCompleted: dbEvent.is_completed,
  isImportant: dbEvent.is_important, 
  category: dbEvent.category,
  reminderMinutes: dbEvent.reminder_minutes,
  deletedAt: dbEvent.deleted_at ? safeDate(dbEvent.deleted_at) : undefined,
  recurrenceEnds: dbEvent.recurrence_ends ? safeDate(dbEvent.recurrence_ends) : undefined,
});

const mapEventToDB = (event: CalendarEvent) => {
  const start = safeDate(event.start);
  const end = safeDate(event.end);
  const deletedAt = event.deletedAt ? safeDate(event.deletedAt) : null;
  const recurrenceEnds = event.recurrenceEnds ? safeDate(event.recurrenceEnds) : null;

  return {
    id: event.id,
    title: event.title || '(Sin título)',
    description: event.description,
    start_date: start.toISOString(),
    end_date: end.toISOString(),
    color: event.color,
    location: event.location,
    calendar_id: event.calendarId,
    recurrence: event.recurrence,
    is_birthday: event.isBirthday,
    is_task: event.isTask,
    is_completed: event.isCompleted,
    is_important: event.isImportant,
    category: event.category,
    reminder_minutes: event.reminderMinutes,
    deleted_at: deletedAt ? deletedAt.toISOString() : null,
    recurrence_ends: recurrenceEnds ? recurrenceEnds.toISOString() : null
  };
};

// LOCAL STORAGE KEYS
const LS_KEYS = {
  EVENTS: 'fp_events',
  CALENDARS: 'fp_calendars',
  SETTINGS: 'fp_settings',
  CHAT: 'fp_chat_history'
};

// Local Storage Helpers
const getLocal = <T>(key: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  const item = localStorage.getItem(key);
  if (!item) return fallback;
  try {
    return JSON.parse(item);
  } catch {
    return fallback;
  }
};

const setLocal = (key: string, data: any) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(key, JSON.stringify(data));
};

export interface UserSettings {
  id?: string;
  theme: Theme;
  timezone_config: TimeZoneConfig;
  has_seen_tour: boolean;
  metadata: {
    isGoogleConnected?: boolean;
    notifiedEventIds?: string[];
    lastView?: string;
    [key: string]: any;
  };
}

export const dataService = {
  
  // --- CALENDARS ---
  
  getCalendars: async (): Promise<CalendarConfig[]> => {
    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('calendars').select('*');
      
      if (!error && data && data.length > 0) {
        setLocal(LS_KEYS.CALENDARS, data); // Sync to local
        return data;
      }
      
      // If error is network related, warn but don't crash
      if (error) {
        console.warn("Supabase calendar fetch failed (offline mode):", error.message);
      } else if (!data || data.length === 0) {
        // Seed default calendars if empty in DB
        const seedData = DEFAULT_CALENDARS;
        const { data: newCalendars, error: seedError } = await supabase!
          .from('calendars')
          .insert(seedData)
          .select();
        if (!seedError && newCalendars) {
           setLocal(LS_KEYS.CALENDARS, newCalendars);
           return newCalendars;
        }
      }
    }

    // 2. Fallback to Local Storage
    const localCalendars = getLocal<CalendarConfig[]>(LS_KEYS.CALENDARS, []);
    if (localCalendars.length > 0) return localCalendars;

    // 3. Default
    setLocal(LS_KEYS.CALENDARS, DEFAULT_CALENDARS);
    return DEFAULT_CALENDARS;
  },

  saveCalendar: async (calendar: CalendarConfig): Promise<CalendarConfig> => {
    // Save Local
    const localCalendars = getLocal<CalendarConfig[]>(LS_KEYS.CALENDARS, []);
    const index = localCalendars.findIndex(c => c.id === calendar.id);
    if (index >= 0) {
      localCalendars[index] = calendar;
    } else {
      localCalendars.push(calendar);
    }
    setLocal(LS_KEYS.CALENDARS, localCalendars);

    // Save Supabase
    if (isSupabaseConfigured()) {
       const { data, error } = await supabase!.from('calendars').upsert({
         id: calendar.id,
         label: calendar.label,
         color: calendar.color,
         visible: calendar.visible
       }).select().single();
       if (error) console.warn("Supabase save calendar failed:", error.message);
       if (data) return data;
    }
    return calendar;
  },

  deleteCalendar: async (id: string) => {
    // Local
    const localCalendars = getLocal<CalendarConfig[]>(LS_KEYS.CALENDARS, []);
    const filteredCals = localCalendars.filter(c => c.id !== id);
    setLocal(LS_KEYS.CALENDARS, filteredCals);

    const localEvents = getLocal<any[]>(LS_KEYS.EVENTS, []);
    const filteredEvents = localEvents.filter(e => e.calendarId !== id);
    setLocal(LS_KEYS.EVENTS, filteredEvents);

    // Supabase
    if (isSupabaseConfigured()) {
      await supabase!.from('events').delete().eq('calendar_id', id);
      await supabase!.from('calendars').delete().eq('id', id);
    }
  },

  resetCalendars: async (): Promise<CalendarConfig[]> => {
    setLocal(LS_KEYS.CALENDARS, DEFAULT_CALENDARS);
    
    if (isSupabaseConfigured()) {
        try {
            const { data: allEvents } = await supabase!.from('events').select('id');
            if (allEvents && allEvents.length > 0) {
                await supabase!.from('events').delete().in('id', allEvents.map(e => e.id));
            }
            const { data: allCalendars } = await supabase!.from('calendars').select('id');
            if (allCalendars && allCalendars.length > 0) {
                await supabase!.from('calendars').delete().in('id', allCalendars.map(c => c.id));
            }
            const { data, error: insertErr } = await supabase!
                .from('calendars')
                .insert(DEFAULT_CALENDARS)
                .select();
            
            if (insertErr) throw insertErr;
            return data || DEFAULT_CALENDARS;
        } catch (e: any) {
            console.error("Error resetting calendars in DB:", e);
        }
    }
    return DEFAULT_CALENDARS;
  },

  // --- EVENTS ---

  getEvents: async (): Promise<CalendarEvent[]> => {
    let events: CalendarEvent[] = [];

    // 1. Try Supabase
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('events').select('*');
      if (!error && data) {
        events = data.map(mapEventFromDB);
        // Sync Local
        // Note: For events, we store the *mapped* object in local storage to avoid re-mapping issues on load
        // But mapEventToDB expects CalendarEvent object anyway.
        // Let's store raw-ish objects in LS.
        setLocal(LS_KEYS.EVENTS, events);
        return events;
      }
      if (error) console.warn("Supabase event fetch failed (offline mode):", error.message);
    }

    // 2. Fallback Local
    const localData = getLocal<any[]>(LS_KEYS.EVENTS, []);
    // Ensure dates are parsed correctly from JSON strings
    return localData.map(e => ({
        ...e,
        start: safeDate(e.start),
        end: safeDate(e.end),
        deletedAt: e.deletedAt ? safeDate(e.deletedAt) : undefined,
        recurrenceEnds: e.recurrenceEnds ? safeDate(e.recurrenceEnds) : undefined
    }));
  },

  createOrUpdateEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    // Local
    const localEvents = getLocal<CalendarEvent[]>(LS_KEYS.EVENTS, []);
    const idx = localEvents.findIndex(e => e.id === event.id);
    if (idx >= 0) {
        localEvents[idx] = event;
    } else {
        localEvents.push(event);
    }
    setLocal(LS_KEYS.EVENTS, localEvents);

    // Supabase
    if (isSupabaseConfigured()) {
      const dbPayload: any = mapEventToDB(event);
      
      const { data, error } = await supabase!
        .from('events')
        .upsert(dbPayload)
        .select()
        .single();
        
      if (!error && data) {
        return mapEventFromDB(data);
      }
      
      // Retry for missing category column
      if (error && error.code === 'PGRST204' && error.message.includes('category')) {
          delete dbPayload.category;
          const { data: retryData } = await supabase!
            .from('events')
            .upsert(dbPayload)
            .select()
            .single();
          if (retryData) return mapEventFromDB(retryData);
      }

      if (error) console.warn("Supabase save event failed:", error.message);
    }
    return event;
  },

  deleteEvent: async (id: string, permanent: boolean = false) => {
    // Local
    const localEvents = getLocal<any[]>(LS_KEYS.EVENTS, []);
    if (permanent) {
        const filtered = localEvents.filter(e => e.id !== id);
        setLocal(LS_KEYS.EVENTS, filtered);
    } else {
        const updated = localEvents.map(e => e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e);
        setLocal(LS_KEYS.EVENTS, updated);
    }

    // Supabase
    if (isSupabaseConfigured()) {
       if (permanent) {
          await supabase!.from('events').delete().eq('id', id);
       } else {
          await supabase!.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id);
       }
    }
  },

  // --- SETTINGS & CHAT ---
  getSettings: async (): Promise<UserSettings> => {
    const defaultSettings: UserSettings = {
       theme: 'system',
       timezone_config: { primary: 'local', secondary: 'UTC', showSecondary: false },
       has_seen_tour: false,
       metadata: {}
    };

    if (isSupabaseConfigured()) {
       const { data, error } = await supabase!.from('settings').select('*').limit(1).single();
       if (data) {
           const settings = { ...data, metadata: data.metadata || {} } as UserSettings;
           setLocal(LS_KEYS.SETTINGS, settings);
           return settings;
       }
    }

    // Fallback
    return getLocal<UserSettings>(LS_KEYS.SETTINGS, defaultSettings);
  },

  saveSettings: async (settings: Partial<UserSettings>) => {
    // Local
    const current = getLocal<UserSettings>(LS_KEYS.SETTINGS, {
        theme: 'system',
        timezone_config: { primary: 'local', secondary: 'UTC', showSecondary: false },
        has_seen_tour: false,
        metadata: {}
    });
    const updated = { ...current, ...settings };
    if (settings.metadata) {
        updated.metadata = { ...current.metadata, ...settings.metadata };
    }
    setLocal(LS_KEYS.SETTINGS, updated);

    // Supabase
    if (isSupabaseConfigured()) {
      const { data: existing } = await supabase!.from('settings').select('id, metadata').limit(1).single();
      let payload = { ...settings };
      if (existing) {
        if (settings.metadata) payload.metadata = { ...existing.metadata, ...settings.metadata };
        await supabase!.from('settings').update(payload).eq('id', existing.id);
      } else {
        await supabase!.from('settings').insert(payload);
      }
    }
  },

  getChatHistory: async () => {
     if (isSupabaseConfigured()) {
        const { data } = await supabase!.from('chat_history').select('*').order('created_at', { ascending: true });
        if (data) {
           const history = data.map((msg: any) => ({
              id: msg.id,
              role: msg.role,
              text: msg.text,
              image: msg.image,
              video: msg.video,
              eventDraft: msg.event_draft,
              selectedCalendarId: msg.selected_calendar_id,
              subject: msg.subject || 'general' 
           }));
           setLocal(LS_KEYS.CHAT, history);
           return history;
        }
     }
     return getLocal<any[]>(LS_KEYS.CHAT, []);
  },

  saveChatMessage: async (message: any) => {
     // Local
     const history = getLocal<any[]>(LS_KEYS.CHAT, []);
     history.push(message);
     setLocal(LS_KEYS.CHAT, history);

     // Supabase
     if (isSupabaseConfigured()) {
        const dbMessage = {
           id: message.id,
           role: message.role,
           text: message.text,
           image: message.image, 
           video: message.video,
           event_draft: message.eventDraft,
           selected_calendar_id: message.selectedCalendarId,
           subject: message.subject || 'general',
           created_at: new Date().toISOString()
        };
        await supabase!.from('chat_history').upsert(dbMessage);
     }
  },

  clearChatHistory: async () => {
    setLocal(LS_KEYS.CHAT, []);
    if (isSupabaseConfigured()) {
      await supabase!.from('chat_history').delete().neq('id', '0');
    }
  }
};