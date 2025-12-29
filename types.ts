
export type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'search' | 'users';
export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';
export type Theme = 'light' | 'dark' | 'system';
export type UserRole = 'master' | 'family' | 'standard' | 'free';
export type PlanType = 'free' | 'basic' | 'pro' | 'unlimited' | 'admin' | 'casa';

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
  googleAccountEmail?: string; 
}

export interface FamilyChatMessage {
  id: string;
  family_id: string;
  user_id: string;
  user_name: string;
  timestamp: string; // ISO8601
  text: string;
  mentions: string[];
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
  // Fix: Added recurrenceEnds and exdates to support recurrence logic in dateUtils
  recurrenceEnds?: Date;
  exdates?: Date[];
  calendarId: string;
  reminderMinutes?: number[]; 
  isBirthday?: boolean; 
  deletedAt?: string; 
  category?: 'Escuela' | 'Deporte' | 'Trabajo' | 'Salud' | 'Social' | 'Hogar' | 'Otro';
  isTask?: boolean;
  isCompleted?: boolean;
  isImportant?: boolean; 
  createdByBot?: boolean; 
  // Fix: Added remoteId and accountId for Google Calendar external synchronization
  remoteId?: string;
  accountId?: string;
}

export interface TimeZoneConfig {
  showSecondary: boolean;
  primary: string; 
  secondary: string; 
}

// Fix: Added missing SearchCriteria interface used by Header and SearchFilters
export interface SearchCriteria {
  query: string;
  startDate?: string;
  endDate?: string;
  calendarId?: string;
}

// Fix: Added missing ViewProps interface used across Month, Week, Day, and Agenda views
export interface ViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarConfig[];
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date) => void;
  onToggleTaskCompletion?: (task: CalendarEvent) => void;
  timeZoneConfig?: TimeZoneConfig;
}
