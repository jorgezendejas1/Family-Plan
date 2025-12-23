
export type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'search' | 'users';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Theme = 'light' | 'dark' | 'system';

export type UserRole = 'master' | 'family' | 'standard' | 'free';
export type PlanType = 'free' | 'basic' | 'pro' | 'unlimited';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  plan: PlanType;
  avatarUrl?: string;
  createdAt: string;
}

export interface CalendarConfig {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  isRemote?: boolean; 
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  color: string; 
  recurrence?: RecurrenceType;
  recurrenceEnds?: Date; 
  exdates?: Date[]; 
  calendarId: string;
  reminderMinutes?: number[]; 
  isRemote?: boolean; 
  remoteId?: string; 
  accountId?: string; 
  isBirthday?: boolean; 
  deletedAt?: Date; 
  category?: 'Escuela' | 'Deporte' | 'Trabajo' | 'Salud' | 'Social' | 'Hogar' | 'Otro';
  isTask?: boolean;
  isCompleted?: boolean;
  isImportant?: boolean; 
  createdByBot?: boolean; // Tracking for SaaS limits
}

export interface ViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarConfig[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date) => void;
  timeZoneConfig?: TimeZoneConfig;
  onToggleTaskCompletion?: (event: CalendarEvent) => void;
}

export interface SearchCriteria {
  query: string;
  startDate?: string; 
  endDate?: string;   
  calendarId?: string;
}

export interface TimeZoneConfig {
  showSecondary: boolean;
  primary: string; 
  secondary: string; 
}
