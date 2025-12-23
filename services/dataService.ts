
import { supabase } from './supabaseClient';
import { CalendarEvent, CalendarConfig, Theme, TimeZoneConfig } from '../types';
import { DEFAULT_CALENDARS } from '../constants';
import { isValid } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { authService } from './authService';

// --- HELPERS ---
const isSupabaseConfigured = () => !!supabase;

const getActiveUserId = () => {
    const user = authService.getCurrentUser();
    return user ? user.id : 'guest';
};

const safeDate = (input: any, fallback: Date = new Date()): Date => {
  if (!input) return fallback;
  if (input instanceof Date) return isValid(input) ? input : fallback;
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
  createdByBot: dbEvent.created_by_bot
});

const mapEventToDB = (event: CalendarEvent, userId: string) => {
  return {
    id: event.id,
    user_id: userId,
    title: event.title || '(Sin título)',
    description: event.description,
    start_date: safeDate(event.start).toISOString(),
    end_date: safeDate(event.end).toISOString(),
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
    deleted_at: event.deletedAt ? safeDate(event.deletedAt).toISOString() : null,
    recurrence_ends: event.recurrenceEnds ? safeDate(event.recurrenceEnds).toISOString() : null,
    created_by_bot: event.createdByBot
  };
};

// Local Storage Helpers
const getLocal = <T>(key: string, userId: string, fallback: T): T => {
  if (typeof localStorage === 'undefined') return fallback;
  const item = localStorage.getItem(`${key}_${userId}`);
  if (!item) return fallback;
  try {
    return JSON.parse(item);
  } catch {
    return fallback;
  }
};

const setLocal = (key: string, userId: string, data: any) => {
  if (typeof localStorage === 'undefined') return;
  localStorage.setItem(`${key}_${userId}`, JSON.stringify(data));
};

export interface UserSettings {
  user_id: string;
  theme: Theme;
  timezone_config: TimeZoneConfig;
  has_seen_tour: boolean;
  metadata: any;
}

export const dataService = {
  
  getCalendars: async (): Promise<CalendarConfig[]> => {
    const userId = getActiveUserId();
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('calendars').select('*').eq('user_id', userId);
      if (!error && data && data.length > 0) {
        setLocal('fp_calendars', userId, data);
        return data;
      }
      if (!data || data.length === 0) {
        const seed = DEFAULT_CALENDARS.map(c => ({ ...c, user_id: userId }));
        await supabase!.from('calendars').insert(seed);
        return seed;
      }
    }
    const local = getLocal<CalendarConfig[]>('fp_calendars', userId, []);
    return local.length > 0 ? local : DEFAULT_CALENDARS;
  },

  saveCalendar: async (calendar: CalendarConfig): Promise<CalendarConfig> => {
    const userId = getActiveUserId();
    const local = getLocal<CalendarConfig[]>('fp_calendars', userId, []);
    const idx = local.findIndex(c => c.id === calendar.id);
    if (idx >= 0) local[idx] = calendar; else local.push(calendar);
    setLocal('fp_calendars', userId, local);

    if (isSupabaseConfigured()) {
       await supabase!.from('calendars').upsert({ ...calendar, user_id: userId });
    }
    return calendar;
  },

  getEvents: async (): Promise<CalendarEvent[]> => {
    const userId = getActiveUserId();
    if (isSupabaseConfigured()) {
      const { data, error } = await supabase!.from('events').select('*').eq('user_id', userId);
      if (!error && data) {
        const events = data.map(mapEventFromDB);
        setLocal('fp_events', userId, events);
        return events;
      }
    }
    const local = getLocal<any[]>('fp_events', userId, []);
    return local.map(e => ({
        ...e,
        start: safeDate(e.start),
        end: safeDate(e.end),
        deletedAt: e.deletedAt ? safeDate(e.deletedAt) : undefined,
    }));
  },

  createOrUpdateEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    const userId = getActiveUserId();
    const local = getLocal<CalendarEvent[]>('fp_events', userId, []);
    const idx = local.findIndex(e => e.id === event.id);
    if (idx >= 0) local[idx] = event; else local.push(event);
    setLocal('fp_events', userId, local);

    if (isSupabaseConfigured()) {
      await supabase!.from('events').upsert(mapEventToDB(event, userId));
    }
    return event;
  },

  deleteEvent: async (id: string, permanent: boolean = false) => {
    const userId = getActiveUserId();
    const local = getLocal<any[]>('fp_events', userId, []);
    if (permanent) {
        setLocal('fp_events', userId, local.filter(e => e.id !== id));
        if (isSupabaseConfigured()) await supabase!.from('events').delete().eq('id', id).eq('user_id', userId);
    } else {
        const updated = local.map(e => e.id === id ? { ...e, deletedAt: new Date().toISOString() } : e);
        setLocal('fp_events', userId, updated);
        if (isSupabaseConfigured()) await supabase!.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    }
  },

  getSettings: async (): Promise<UserSettings> => {
    const userId = getActiveUserId();
    const defaultSettings: UserSettings = {
       user_id: userId,
       theme: 'system',
       timezone_config: { primary: 'local', secondary: 'UTC', showSecondary: false },
       has_seen_tour: false,
       metadata: {}
    };

    if (isSupabaseConfigured()) {
       const { data } = await supabase!.from('settings').select('*').eq('user_id', userId).single();
       if (data) return data as UserSettings;
    }
    return getLocal<UserSettings>('fp_settings', userId, defaultSettings);
  },

  saveSettings: async (settings: Partial<UserSettings>) => {
    const userId = getActiveUserId();
    const current = await dataService.getSettings();
    const updated = { ...current, ...settings, user_id: userId };
    setLocal('fp_settings', userId, updated);

    if (isSupabaseConfigured()) {
      await supabase!.from('settings').upsert(updated);
    }
  },

  getChatHistory: async () => {
     const userId = getActiveUserId();
     if (isSupabaseConfigured()) {
        const { data } = await supabase!.from('chat_history').select('*').eq('user_id', userId).order('created_at', { ascending: true });
        if (data) return data;
     }
     return getLocal<any[]>('fp_chat_history', userId, []);
  },

  saveChatMessage: async (message: any) => {
     const userId = getActiveUserId();
     const history = getLocal<any[]>('fp_chat_history', userId, []);
     history.push(message);
     setLocal('fp_chat_history', userId, history);

     if (isSupabaseConfigured()) {
        await supabase!.from('chat_history').upsert({ ...message, user_id: userId, created_at: new Date().toISOString() });
     }
  }
};
