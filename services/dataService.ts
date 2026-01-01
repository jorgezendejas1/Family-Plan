
import { supabase } from './supabaseClient';
import { CalendarEvent, CalendarConfig, FamilyChatMessage } from '../types';
import { PLAN_DEFAULTS, PLAN_LIMITS } from '../constants';
import { isValid, parseISO, startOfWeek } from 'date-fns';
import { authService } from './authService';
import { cryptoService } from '../utils/cryptoUtils';

const getActiveUserId = () => authService.getCurrentUser()?.id || null;
const getEncryptionSecret = () => {
    const user = authService.getCurrentUser();
    return user ? user.email + "_fp_secure_v2" : "global_fallback_v2";
};

export const dataService = {
  // ... (métodos existentes se mantienen)

  // --- GESTIÓN DE CHAT FIFO 200 ---
  getChatMessages: async (): Promise<FamilyChatMessage[]> => {
    if (!supabase) return [];
    
    const { data } = await supabase
      .from('family_chat')
      .select('*')
      .order('timestamp', { ascending: true })
      .limit(200);
    
    return data || [];
  },

  sendChatMessage: async (message: FamilyChatMessage) => {
    if (!supabase) return;

    // 1. Insertar el nuevo mensaje
    await supabase.from('family_chat').insert({
      id: message.id,
      family_id: message.family_id,
      user_id: message.user_id,
      user_name: message.user_name,
      text: message.text,
      timestamp: message.timestamp,
      mentions: message.mentions
    });

    // 2. Ejecutar limpieza FIFO (Mantener solo los últimos 200)
    // Nota: En una app real de producción, esto sería un Trigger de PostgreSQL, 
    // pero aquí lo hacemos vía código para asegurar compatibilidad.
    const { data: countData } = await supabase.from('family_chat').select('id', { count: 'exact' });
    if (countData && countData.length > 200) {
        // Obtenemos el ID del mensaje 201 más nuevo para borrar todo lo anterior
        const { data: oldestToKeep } = await supabase
            .from('family_chat')
            .select('timestamp')
            .order('timestamp', { ascending: false })
            .range(199, 199)
            .single();
        
        if (oldestToKeep) {
            await supabase
                .from('family_chat')
                .delete()
                .lt('timestamp', oldestToKeep.timestamp);
        }
    }
  },

  // --- RESTO DE MÉTODOS ---
  getSettings: async () => {
    const user = authService.getCurrentUser();
    if (!user || !supabase) return { theme: 'system', has_seen_tour: false };
    
    const { data, error } = await supabase
      .from('user_settings')
      .select('*')
      .eq('user_id', user.id)
      .single();
    
    if (error || !data) {
        return { theme: 'system', has_seen_tour: false };
    }
    return {
        theme: data.theme || 'system',
        has_seen_tour: !!data.has_seen_tour
    };
  },

  getCalendars: async (): Promise<CalendarConfig[]> => {
    const user = authService.getCurrentUser();
    if (!user || !supabase) return [];
    
    const { data } = await supabase.from('calendars').select('*').eq('user_id', user.id);
    
    if (!data || data.length === 0) {
      const plan = user.plan || 'free';
      const defaults = (plan === 'free') ? PLAN_DEFAULTS.free : PLAN_DEFAULTS.premium;
      const newCals = defaults.map(c => ({
        id: crypto.randomUUID(),
        user_id: user.id,
        label: c.label,
        color: c.color,
        visible: true
      }));
      await supabase.from('calendars').insert(newCals);
      return newCals;
    }
    return data;
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
    const user = authService.getCurrentUser();
    if (!user || !supabase) return null;

    const { count } = await supabase.from('calendars').select('id', { count: 'exact' }).eq('user_id', user.id);
    const limit = PLAN_LIMITS[user.plan as keyof typeof PLAN_LIMITS] || 5;
    
    if (count && count >= limit) {
      throw new Error(`Límite de ${limit} miembros alcanzado.`);
    }

    const newCal = { id: crypto.randomUUID(), user_id: user.id, label, color, visible: true };
    const { data } = await supabase.from('calendars').insert(newCal).select().single();
    return data;
  },

  resetCalendarsToDefault: async () => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('events').delete().eq('user_id', userId);
    await supabase.from('calendars').delete().eq('user_id', userId);
  },

  getWeeklyAiCount: async (): Promise<number> => {
    const userId = getActiveUserId();
    if (!userId) return 0;
    const weekStart = startOfWeek(new Date()).toISOString();
    const { count } = await supabase
      .from('ai_events_log')
      .select('id', { count: 'exact' })
      .eq('user_id', userId)
      .gte('created_at', weekStart);
    return count || 0;
  },

  incrementAiCount: async () => {
    const userId = getActiveUserId();
    if (!userId) return;
    await supabase.from('ai_events_log').insert({ user_id: userId });
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

  saveSettings: async (settings: any) => {
    const userId = getActiveUserId();
    if (!userId || !supabase) return;
    await supabase.from('user_settings').upsert({ user_id: userId, ...settings });
  }
};
