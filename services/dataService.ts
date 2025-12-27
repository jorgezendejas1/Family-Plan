
import { supabase } from './supabaseClient';
import { CalendarEvent, CalendarConfig, Theme, TimeZoneConfig, PlanType } from '../types';
import { PLAN_CALENDARS, DEFAULT_CALENDARS } from '../constants';
import { isValid, parseISO } from 'date-fns';
import { authService } from './authService';
import { cryptoService } from '../utils/cryptoUtils';

const getActiveUserId = () => authService.getCurrentUser()?.id || null;
const getEncryptionSecret = () => {
    const user = authService.getCurrentUser();
    return user ? user.email + "_fp_secure_v2" : "global_fallback_v2";
};

const safeDate = (input: any, fallback: Date = new Date()): Date => {
  if (!input) return fallback;
  if (input instanceof Date) return isValid(input) ? input : fallback;
  if (typeof input === 'string') {
    const parsed = parseISO(input);
    return isValid(parsed) ? parsed : fallback;
  }
  return fallback;
};

const mapEventFromDB = async (dbEvent: any): Promise<CalendarEvent> => {
  const secret = getEncryptionSecret();
  return {
    ...dbEvent,
    title: await cryptoService.decrypt(dbEvent.title, secret),
    description: dbEvent.description ? await cryptoService.decrypt(dbEvent.description, secret) : undefined,
    location: dbEvent.location ? await cryptoService.decrypt(dbEvent.location, secret) : undefined,
    start: safeDate(dbEvent.start_date),
    end: safeDate(dbEvent.end_date),
    calendarId: dbEvent.calendar_id,
    reminderMinutes: Array.isArray(dbEvent.reminder_minutes) ? dbEvent.reminder_minutes : []
  };
};

const mapEventToDB = async (event: CalendarEvent, userId: string) => {
  const secret = getEncryptionSecret();
  return {
    id: event.id,
    user_id: userId,
    title: await cryptoService.encrypt(event.title || '(Sin título)', secret),
    description: event.description ? await cryptoService.encrypt(event.description, secret) : null,
    location: event.location ? await cryptoService.encrypt(event.location, secret) : null,
    start_date: safeDate(event.start).toISOString(),
    end_date: safeDate(event.end).toISOString(),
    color: event.color,
    calendar_id: event.calendarId,
    recurrence: event.recurrence || 'none',
    is_birthday: !!event.isBirthday,
    is_task: !!event.isTask,
    is_completed: !!event.isCompleted,
    is_important: !!event.isImportant,
    category: event.category || 'Otro',
    reminder_minutes: event.reminderMinutes || [],
    created_by_bot: !!event.createdByBot
  };
};

let seedingInProgress = false;

export const dataService = {
  getCalendars: async (): Promise<CalendarConfig[]> => {
    const user = authService.getCurrentUser();
    if (!user || !supabase) return DEFAULT_CALENDARS;

    const { data, error } = await supabase.from('calendars').select('*').eq('user_id', user.id);
    
    if (!error && data && data.length > 0) {
        return data;
    }
    
    if (seedingInProgress) {
        await new Promise(resolve => setTimeout(resolve, 800));
        const retry = await supabase.from('calendars').select('*').eq('user_id', user.id);
        if (retry.data && retry.data.length > 0) return retry.data;
    }

    seedingInProgress = true;
    try {
        const finalCheck = await supabase.from('calendars').select('*').eq('user_id', user.id);
        if (finalCheck.data && finalCheck.data.length > 0) return finalCheck.data;

        let planKey = user.plan;
        if (user.role === 'master' || user.email === 'admin@familyplan.com') {
            planKey = 'admin';
        }
        
        const defaultSet = PLAN_CALENDARS[planKey as keyof typeof PLAN_CALENDARS] || PLAN_CALENDARS.free;
        
        const seed = defaultSet.map((c, idx) => ({ 
          id: crypto.randomUUID(), 
          user_id: user.id, 
          label: c.label, 
          color: c.color, 
          visible: true 
        }));

        const { error: insertError } = await supabase.from('calendars').insert(seed);
        if (insertError) throw insertError;
        return seed;
    } finally {
        seedingInProgress = false;
    }
  },

  resetCalendarsToDefault: async (): Promise<CalendarConfig[]> => {
    const user = authService.getCurrentUser();
    if (!user || !supabase) return [];

    // 1. Borrar TODO de forma secuencial
    const { error: eventError } = await supabase.from('events').delete().eq('user_id', user.id);
    if (eventError) console.error('Error eventos:', eventError);
    
    const { error: calError } = await supabase.from('calendars').delete().eq('user_id', user.id);
    if (calError) console.error('Error cals:', calError);

    // 2. Inmediatamente después de borrar, realizar el sembrado (seeding) manual
    // para evitar que la siguiente llamada a getCalendars (tras el reload) falle por lag de DB.
    let planKey = user.plan;
    if (user.role === 'master' || user.email === 'admin@familyplan.com') {
        planKey = 'admin';
    }
    
    const defaultSet = PLAN_CALENDARS[planKey as keyof typeof PLAN_CALENDARS] || PLAN_CALENDARS.free;
    const seed = defaultSet.map(c => ({ 
      id: crypto.randomUUID(), 
      user_id: user.id, 
      label: c.label, 
      color: c.color, 
      visible: true 
    }));

    const { error: finalSeedError } = await supabase.from('calendars').insert(seed);
    if (finalSeedError) throw finalSeedError;

    return seed;
  },

  updateCalendar: async (id: string, updates: Partial<CalendarConfig>) => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('calendars').update(updates).eq('id', id).eq('user_id', userId);
  },

  deleteCalendar: async (id: string) => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('events').delete().eq('calendar_id', id).eq('user_id', userId);
    await supabase.from('calendars').delete().eq('id', id).eq('user_id', userId);
  },

  createCalendar: async (label: string, color: string): Promise<CalendarConfig | null> => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return null;
    const newCal = { id: crypto.randomUUID(), user_id: userId, label, color, visible: true };
    const { data } = await supabase.from('calendars').insert(newCal).select().single();
    return data;
  },

  getEvents: async (): Promise<CalendarEvent[]> => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return [];
    const { data } = await supabase.from('events').select('*').eq('user_id', userId).is('deleted_at', null);
    if (!data) return [];
    return await Promise.all(data.map(mapEventFromDB));
  },

  createOrUpdateEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return event;
    const dbReadyEvent = await mapEventToDB(event, userId);
    await supabase.from('events').upsert(dbReadyEvent);
    return event;
  },

  deleteEvent: async (id: string, permanent: boolean = false) => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    if (permanent) {
      await supabase.from('events').delete().eq('id', id).eq('user_id', userId);
    } else {
      await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
    }
  },

  getSettings: async () => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return { theme: 'system', timezone_config: { primary: 'local', secondary: 'UTC', showSecondary: false }, has_seen_tour: false };
    const { data } = await supabase.from('settings').select('*').eq('user_id', userId).single();
    return data || { theme: 'system', timezone_config: { primary: 'local', secondary: 'UTC', showSecondary: false }, has_seen_tour: false };
  },

  saveSettings: async (settings: any) => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('settings').upsert({ ...settings, user_id: userId });
  },

  getChatHistory: async () => {
     const userId = getActiveUserId();
     const history = localStorage.getItem(`fp_chat_${userId}`);
     return history ? JSON.parse(history) : [];
  },

  saveChatMessage: async (message: any) => {
     const userId = getActiveUserId();
     const history = await dataService.getChatHistory();
     history.push(message);
     localStorage.setItem(`fp_chat_${userId}`, JSON.stringify(history));
  }
};
