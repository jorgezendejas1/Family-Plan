
import { CalendarConfig } from './types';

export const EVENT_COLORS = [
  '#E91E63', '#039BE5', '#8E24AA', '#33B679', '#F6BF26', 
  '#F4511E', '#3F51B5', '#616161', '#7986CB', '#D50000',
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

// Estructura de calendarios predeterminados por plan
export const PLAN_DEFAULTS = {
  free: [
    { label: 'Personal', color: '#039BE5' },
    { label: 'Trabajo', color: '#616161' },
    { label: 'Familia', color: '#3F51B5' },
    { label: 'Salud', color: '#33B679' },
    { label: 'Ocio', color: '#F6BF26' }
  ],
  premium: [
    { label: 'Mama', color: '#E91E63' },
    { label: 'Papa', color: '#039BE5' },
    { label: 'Hija', color: '#8E24AA' },
    { label: 'Hijo', color: '#33B679' },
    { label: 'Hijita', color: '#F6BF26' },
    { label: 'Hijito', color: '#F4511E' },
    { label: 'Familia', color: '#3F51B5' },
    { label: 'Otros', color: '#616161' }
  ]
};

export const PLAN_LIMITS = {
  free: 5, // Límite de miembros/calendarios
  basic: 20,
  pro: 20,
  casa: 999,
  admin: 999,
  unlimited: 999
};

// Límites de IA semanales
export const AI_WEEKLY_LIMITS = {
  free: 10,
  basic: 50,
  pro: 125,
  admin: 99999,
  unlimited: 99999,
  casa: 99999
};

export const TIME_ZONES = [
  { value: 'local', label: 'Hora Local' },
  { value: 'UTC', label: '(UTC) Tiempo Universal Coordinado' },
  { value: 'America/New_York', label: '(GMT-5) Nueva York, EE.UU.' },
  { value: 'America/Mexico_City', label: '(GMT-6) Ciudad de México' },
  { value: 'Europe/Madrid', label: '(GMT+1) Madrid, España' },
];

export const MOCK_LOCATIONS = [
  "Starbucks", "Oficina Central", "Casa", "Zoom Meeting", "Google Meet"
];

export const DEFAULT_CALENDARS: CalendarConfig[] = PLAN_DEFAULTS.free.map(c => ({
  id: crypto.randomUUID(),
  label: c.label,
  color: c.color,
  visible: true
}));
