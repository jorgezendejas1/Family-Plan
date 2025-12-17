
export type ViewType = 'month' | 'week' | 'day' | 'agenda' | 'search';

export type RecurrenceType = 'none' | 'daily' | 'weekly' | 'monthly' | 'yearly';

export type Theme = 'light' | 'dark' | 'system';

export interface CalendarConfig {
  id: string;
  label: string;
  color: string;
  visible: boolean;
  isRemote?: boolean; // True if synced from Google Calendar
}

export interface CalendarEvent {
  id: string;
  title: string;
  start: Date;
  end: Date;
  description?: string;
  location?: string;
  color: string; // hex code or tailwind class reference
  recurrence?: RecurrenceType;
  recurrenceEnds?: Date; // Date when the recurrence stops
  exdates?: Date[]; // Array of dates to skip (deleted instances)
  calendarId: string;
  reminderMinutes?: number[]; // Array of minutes before event to notify
  isRemote?: boolean; // True if event comes from external API
  isBirthday?: boolean; // Flag for special birthday formatting
  deletedAt?: Date; // Timestamp when event was soft-deleted (for Trash)
  
  // NEW FIELDS
  category?: 'Escuela' | 'Deporte' | 'Trabajo' | 'Salud' | 'Social' | 'Hogar' | 'Otro';

  // TASK SPECIFIC FIELDS
  isTask?: boolean;
  isCompleted?: boolean;
  isImportant?: boolean; // Priority flag for tasks
}

export interface ViewProps {
  currentDate: Date;
  events: CalendarEvent[];
  calendars: CalendarConfig[]; // Added this line
  onEventClick: (event: CalendarEvent) => void;
  onTimeSlotClick?: (date: Date) => void;
  // Time Zone Support
  timeZoneConfig?: TimeZoneConfig;
  // Task Support
  onToggleTaskCompletion?: (event: CalendarEvent) => void;
}

export interface SearchCriteria {
  query: string;
  startDate?: string; // YYYY-MM-DD
  endDate?: string;   // YYYY-MM-DD
  calendarId?: string;
}

export interface TimeZoneConfig {
  showSecondary: boolean;
  primary: string; // 'local' or IANA string
  secondary: string; // IANA string
}
