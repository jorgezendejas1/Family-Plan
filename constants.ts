
import { CalendarConfig } from './types';

export const EVENT_COLORS = [
  '#039BE5', '#3F51B5', '#D50000', '#E91E63', '#8E24AA', 
  '#33B679', '#F6BF26', '#F4511E', '#616161', '#7986CB',
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

// Configuración por Plan
export const PLAN_CALENDARS = {
  free: [
    { label: 'Personal', color: '#039BE5' }
  ],
  basic: [
    { label: 'Mama', color: '#E91E63' },
    { label: 'Papa', color: '#039BE5' }
  ],
  pro: [
    { label: 'Mama', color: '#E91E63' },
    { label: 'Papa', color: '#039BE5' },
    { label: 'Familia', color: '#3F51B5' }
  ],
  casa: [
    { label: 'Mama', color: '#E91E63' },
    { label: 'Papa', color: '#039BE5' },
    { label: 'Hijo', color: '#33B679' },
    { label: 'Hija', color: '#F6BF26' },
    { label: 'Familia', color: '#3F51B5' }
  ],
  admin: [
    { label: 'Mama', color: '#E91E63' },
    { label: 'Papa', color: '#039BE5' },
    { label: 'Hija', color: '#F6BF26' },
    { label: 'Hijo', color: '#33B679' },
    { label: 'Hijita', color: '#8E24AA' },
    { label: 'Hijito', color: '#F4511E' },
    { label: 'Familia', color: '#3F51B5' },
    { label: 'Otros', color: '#616161' }
  ],
  unlimited: [
    { label: 'Admin', color: '#000000' }
  ]
};

export const PLAN_LIMITS = {
  free: 1,
  basic: 2,
  pro: 20,
  casa: 20,
  admin: 30,
  unlimited: 999
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

// Fallback legacy
export const DEFAULT_CALENDARS: CalendarConfig[] = [
  { id: 'personal', label: 'Personal', color: '#039BE5', visible: true }
];
