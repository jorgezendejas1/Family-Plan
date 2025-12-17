
import { CalendarConfig } from './types';

export const EVENT_COLORS = [
  '#039BE5', // Azul clarito (Peacock)
  '#3F51B5', // Azul oscuro (Indigo)
  '#D50000', // Rojo (Tomato)
  '#E91E63', // Rosa (Pink)
  '#8E24AA', // Morado (Grape)
  '#33B679', // Verde (Sage)
  '#F6BF26', // Amarillo (Banana)
  '#F4511E', // Naranja (Tangerine)
  '#616161', // Gris (Graphite)
  '#7986CB', // Lavanda
];

export const REMINDER_OPTIONS = [
  { value: 0, label: 'Al momento' },
  { value: 5, label: '5 minutos antes' },
  { value: 10, label: '10 minutos antes' },
  { value: 15, label: '15 minutos antes' },
  { value: 30, label: '30 minutos antes' },
  { value: 60, label: '1 hora antes' },
  { value: 1440, label: '1 día antes' },
  { value: 10080, label: '1 semana antes' },
];

// UUIDs constantes para mantener consistencia
export const CALENDAR_IDS = {
  PERSONAL: 'a1a1a1a1-a1a1-a1a1-a1a1-a1a1a1a1a1a1',
  WORK: 'b2b2b2b2-b2b2-b2b2-b2b2-b2b2b2b2b2b2',
  FAMILY: 'c3c3c3c3-c3c3-c3c3-c3c3-c3c3c3c3c3c3',
  HEALTH: 'd4d4d4d4-d4d4-d4d4-d4d4-d4d4d4d4d4d4',
  LEISURE: 'e5e5e5e5-e5e5-e5e5-e5e5-e5e5e5e5e5e5',
  BIRTHDAYS: 'f6f6f6f6-f6f6-f6f6-f6f6-f6f6f6f6f6f6',
  TASKS: 'a7a7a7a7-a7a7-a7a7-a7a7-a7a7a7a7a7a7',
  GOOGLE: '99999999-9999-9999-9999-999999999999'
};

export const DEFAULT_CALENDARS: CalendarConfig[] = [
  { id: CALENDAR_IDS.PERSONAL, label: 'Personal', color: '#039BE5', visible: true },      // Peacock (Blue)
  { id: CALENDAR_IDS.WORK, label: 'Trabajo', color: '#F4511E', visible: true },           // Tangerine (Orange)
  { id: CALENDAR_IDS.FAMILY, label: 'Familia', color: '#8E24AA', visible: true },         // Grape (Purple)
  { id: CALENDAR_IDS.HEALTH, label: 'Salud', color: '#D50000', visible: true },           // Tomato (Red)
  { id: CALENDAR_IDS.LEISURE, label: 'Ocio', color: '#F6BF26', visible: true },           // Banana (Yellow)
  { id: CALENDAR_IDS.BIRTHDAYS, label: 'Cumpleaños', color: '#7CB342', visible: true },   // Pistachio
  { id: CALENDAR_IDS.TASKS, label: 'Tareas', color: '#3F51B5', visible: true },           // Indigo (Google Tasks Blue)
];

export const TIME_ZONES = [
  { value: 'local', label: 'Hora Local' },
  { value: 'UTC', label: '(UTC) Tiempo Universal Coordinado' },
  { value: 'America/New_York', label: '(GMT-5) Nueva York, EE.UU.' },
  { value: 'America/Mexico_City', label: '(GMT-6) Ciudad de México' },
  { value: 'America/Los_Angeles', label: '(GMT-8) Los Ángeles, EE.UU.' },
  { value: 'Europe/London', label: '(GMT+0) Londres, Reino Unido' },
  { value: 'Europe/Madrid', label: '(GMT+1) Madrid, España' },
  { value: 'Europe/Paris', label: '(GMT+1) París, Francia' },
  { value: 'Asia/Tokyo', label: '(GMT+9) Tokio, Japón' },
  { value: 'Australia/Sydney', label: '(GMT+11) Sídney, Australia' },
];

// Simulated locations for autocomplete
export const MOCK_LOCATIONS = [
  "Starbucks",
  "Oficina Central",
  "Casa",
  "Aeropuerto Internacional Benito Juárez (MEX)",
  "Parque México",
  "Cinépolis",
  "Gimnasio Smart Fit",
  "Restaurante El Cardenal",
  "Zoom Meeting",
  "Google Meet",
  "Madrid, España",
  "New York, USA",
  "Estadio Azteca"
];

export const MOCK_EVENTS = [
  {
    id: '11111111-0000-0000-0000-000000000001',
    title: 'Reunión de Equipo',
    start: new Date(new Date().setHours(10, 0, 0, 0)),
    end: new Date(new Date().setHours(11, 30, 0, 0)),
    description: 'Sincronización semanal.',
    color: '#F4511E', // Trabajo
    calendarId: CALENDAR_IDS.WORK,
    recurrence: 'weekly' as const,
    reminderMinutes: [15]
  },
  {
    id: '11111111-0000-0000-0000-000000000002',
    title: 'Comida familiar',
    start: new Date(new Date().setHours(14, 0, 0, 0)),
    end: new Date(new Date().setHours(16, 0, 0, 0)),
    description: 'Casa de la abuela.',
    color: '#8E24AA', // Familia
    calendarId: CALENDAR_IDS.FAMILY,
    recurrence: 'none' as const,
    reminderMinutes: [60, 1440],
    location: 'Casa de la Abuela'
  },
  {
    id: '11111111-0000-0000-0000-000000000003',
    title: 'Gimnasio',
    start: new Date(new Date().setDate(new Date().getDate() + 1)), 
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 1)).setHours(19, 0, 0, 0)),
    description: 'Día de pierna.',
    color: '#D50000', // Salud
    calendarId: CALENDAR_IDS.HEALTH,
    recurrence: 'weekly' as const,
    reminderMinutes: [30]
  },
  {
    id: '11111111-0000-0000-0000-000000000004',
    title: 'Cine',
    start: new Date(new Date().setDate(new Date().getDate() + 2)), 
    end: new Date(new Date(new Date().setDate(new Date().getDate() + 2)).setHours(22, 0, 0, 0)),
    description: 'Estreno de película.',
    color: '#F6BF26', // Ocio
    calendarId: CALENDAR_IDS.LEISURE, 
    recurrence: 'none' as const,
    reminderMinutes: [60],
    location: 'Cinépolis VIP'
  },
  {
    id: '11111111-0000-0000-0000-000000000005',
    title: 'Dentista',
    start: new Date(new Date().setHours(16, 30, 0, 0)),
    end: new Date(new Date().setHours(17, 30, 0, 0)),
    description: 'Limpieza semestral.',
    color: '#039BE5', // Personal
    calendarId: CALENDAR_IDS.PERSONAL,
    recurrence: 'none' as const,
    reminderMinutes: [60, 1440]
  },
  // MOCK TASK
  {
      id: '11111111-0000-0000-0000-000000000006',
      title: 'Comprar leche',
      start: new Date(new Date().setHours(9, 0, 0, 0)),
      end: new Date(new Date().setHours(9, 30, 0, 0)),
      description: 'Y pan también',
      color: '#3F51B5',
      calendarId: CALENDAR_IDS.TASKS,
      recurrence: 'none' as const,
      isTask: true,
      isCompleted: false
  }
];

// Events that simulate coming from Google Calendar API
export const MOCK_GOOGLE_EVENTS = [
    {
      id: 'g_1',
      title: '✈️ Vuelo a CDMX',
      start: new Date(new Date().setDate(new Date().getDate() + 5)),
      end: new Date(new Date(new Date().setDate(new Date().getDate() + 5)).setHours(12, 0, 0, 0)),
      description: 'Vuelo AM405. Terminal 2.',
      color: '#4285F4', // Google Blue
      calendarId: CALENDAR_IDS.GOOGLE,
      recurrence: 'none' as const,
      isRemote: true,
      location: 'Aeropuerto Internacional Benito Juárez'
    },
    {
        id: 'g_2',
        title: 'Videollamada con Cliente',
        start: new Date(new Date().setHours(13, 0, 0, 0)),
        end: new Date(new Date().setHours(14, 0, 0, 0)),
        description: 'Link de Meet: meet.google.com/abc-defg-hij',
        color: '#4285F4',
        calendarId: CALENDAR_IDS.GOOGLE,
        recurrence: 'none' as const,
        isRemote: true,
        location: 'Google Meet'
    },
    {
        id: 'g_3',
        title: 'Festivo: Día de la Constitución',
        start: new Date(new Date().setDate(new Date().getDate() + 10)),
        end: new Date(new Date().setDate(new Date().getDate() + 10)),
        description: 'Día feriado nacional',
        color: '#33B679', // Sage
        calendarId: CALENDAR_IDS.GOOGLE,
        recurrence: 'yearly' as const,
        isRemote: true
    },
    {
      id: 'g_4_today',
      title: '🔴 Reunión de Proyecto Google (HOY)',
      start: new Date(new Date().setHours(new Date().getHours() + 1, 0, 0, 0)), // Starts in 1 hour
      end: new Date(new Date().setHours(new Date().getHours() + 2, 0, 0, 0)),
      description: 'Demo de integración.',
      color: '#D50000', // Red
      calendarId: CALENDAR_IDS.GOOGLE,
      recurrence: 'none' as const,
      isRemote: true,
      location: 'Oficina Central'
    }
];
    