
import { supabase } from './supabaseClient';
import { CalendarEvent, CalendarConfig, FamilyChatMessage } from '../types';
import { DEFAULT_CALENDARS, PLAN_CALENDARS } from '../constants';
import { isValid, parseISO } from 'date-fns';
import { authService } from './authService';
import { cryptoService } from '../utils/cryptoUtils';

const getActiveUserId = () => authService.getCurrentUser()?.id || null;
const getEncryptionSecret = () => {
    const user = authService.getCurrentUser();
    return user ? user.email + "_fp_secure_v2" : "global_fallback_v2";
};

export const dataService = {
  getCalendars: async (): Promise<CalendarConfig[]> => {
    const user = authService.getCurrentUser();
    if (!user || !supabase) return DEFAULT_CALENDARS;
    const { data } = await supabase.from('calendars').select('*').eq('user_id', user.id);
    return data && data.length > 0 ? data : DEFAULT_CALENDARS;
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
    
    const secret = getEncryptionSecret();
    return await Promise.all(data.map(async (dbEvent) => ({
        ...dbEvent,
        title: await cryptoService.decrypt(dbEvent.title, secret),
        description: dbEvent.description ? await cryptoService.decrypt(dbEvent.description, secret) : undefined,
        location: dbEvent.location ? await cryptoService.decrypt(dbEvent.location, secret) : undefined,
        start: parseISO(dbEvent.start_date),
        end: parseISO(dbEvent.end_date),
        calendarId: dbEvent.calendar_id,
        reminderMinutes: Array.isArray(dbEvent.reminder_minutes) ? dbEvent.reminder_minutes : []
    })));
  },

  createOrUpdateEvent: async (event: CalendarEvent): Promise<CalendarEvent> => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return event;
    const secret = getEncryptionSecret();
    
    const dbReadyEvent = {
        id: event.id,
        user_id: userId,
        title: await cryptoService.encrypt(event.title || '(Sin título)', secret),
        description: event.description ? await cryptoService.encrypt(event.description, secret) : null,
        location: event.location ? await cryptoService.encrypt(event.location, secret) : null,
        start_date: event.start.toISOString(),
        end_date: event.end.toISOString(),
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

    await supabase.from('events').upsert(dbReadyEvent);
    return event;
  },

  deleteEvent: async (id: string) => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('events').update({ deleted_at: new Date().toISOString() }).eq('id', id).eq('user_id', userId);
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

  // --- ENGINE DE CHAT FAMILIAR (FIFO 200) ---
  getFamilyMessages: async (): Promise<FamilyChatMessage[]> => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return [];
    
    const { data } = await supabase
      .from('family_messages')
      .select('*')
      .eq('family_id', userId)
      .order('timestamp', { ascending: true });
    
    return data || [];
  },

  sendFamilyMessage: async (msgData: { text: string, mentions: string[] }) => {
    const user = authService.getCurrentUser();
    if (!user || !supabase) return null;

    // Verificar límite FIFO 200 antes de insertar
    const { count } = await supabase
      .from('family_messages')
      .select('*', { count: 'exact', head: true })
      .eq('family_id', user.id);

    if (count && count >= 200) {
      // Borrar el más antiguo
      const { data: oldest } = await supabase
        .from('family_messages')
        .select('id')
        .eq('family_id', user.id)
        .order('timestamp', { ascending: true })
        .limit(1)
        .single();
      
      if (oldest) {
        await supabase.from('family_messages').delete().eq('id', oldest.id);
      }
    }

    const newMessage = {
      id: crypto.randomUUID(),
      family_id: user.id,
      user_id: user.id,
      user_name: user.name,
      timestamp: new Date().toISOString(),
      text: msgData.text,
      mentions: msgData.mentions
    };

    const { data, error } = await supabase.from('family_messages').insert(newMessage).select().single();
    if (error) throw error;
    return data;
  },

  resetCalendarsToDefault: async () => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('events').delete().eq('user_id', userId);
    await supabase.from('calendars').delete().eq('user_id', userId);
    const user = authService.getCurrentUser();
    const plan = user?.plan || 'free';
    const defaultCals = PLAN_CALENDARS[plan as keyof typeof PLAN_CALENDARS] || PLAN_CALENDARS.free;
    const newCals = defaultCals.map(c => ({
      id: crypto.randomUUID(),
      user_id: userId,
      label: c.label,
      color: c.color,
      visible: true
    }));
    await supabase.from('calendars').insert(newCals);
  }
};
