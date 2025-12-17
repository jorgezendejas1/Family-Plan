
import { CalendarEvent } from '../types';

export const generateICS = (events: CalendarEvent[]): string => {
  const formatDateTime = (d: Date): string => {
    const pad = (n: number) => n < 10 ? '0' + n : n;
    return `${d.getUTCFullYear()}${pad(d.getUTCMonth() + 1)}${pad(d.getUTCDate())}T${pad(d.getUTCHours())}${pad(d.getUTCMinutes())}${pad(d.getUTCSeconds())}Z`;
  };

  const escapeICS = (str: string): string => {
    if (!str) return '';
    return str.replace(/\\/g, '\\\\').replace(/;/g, '\\;').replace(/,/g, '\\,').replace(/\n/g, '\\n');
  };

  const lines = [
    'BEGIN:VCALENDAR',
    'VERSION:2.0',
    'PRODID:-//QR Artist Studio//Calendar//EN',
    'CALSCALE:GREGORIAN',
    'METHOD:PUBLISH',
  ];

  events.forEach(event => {
    lines.push('BEGIN:VEVENT');
    lines.push(`UID:${event.id}`);
    lines.push(`DTSTAMP:${formatDateTime(new Date())}`);
    lines.push(`DTSTART:${formatDateTime(event.start)}`);
    lines.push(`DTEND:${formatDateTime(event.end)}`);
    lines.push(`SUMMARY:${escapeICS(event.title)}`);
    
    if (event.description) {
      lines.push(`DESCRIPTION:${escapeICS(event.description)}`);
    }
    
    if (event.location) {
      lines.push(`LOCATION:${escapeICS(event.location)}`);
    }

    if (event.recurrence && event.recurrence !== 'none') {
        const freq = event.recurrence.toUpperCase();
        lines.push(`RRULE:FREQ=${freq}`);
    }

    lines.push('END:VEVENT');
  });

  lines.push('END:VCALENDAR');

  return lines.join('\r\n');
};

export const parseICS = (icsContent: string): CalendarEvent[] => {
  const events: CalendarEvent[] = [];
  const lines = icsContent.split(/\r\n|\n|\r/);
  
  let currentEvent: Partial<CalendarEvent> | null = null;
  let inEvent = false;

  const unescapeICS = (str: string): string => {
    return str.replace(/\\n/g, '\n').replace(/\\,/g, ',').replace(/\\;/g, ';').replace(/\\\\/g, '\\');
  };

  const parseICSDate = (dateStr: string): Date => {
      if (!dateStr) return new Date();
      // YYYYMMDDTHHmmssZ or YYYYMMDDTHHmmss
      const year = parseInt(dateStr.substring(0, 4));
      const month = parseInt(dateStr.substring(4, 6)) - 1;
      const day = parseInt(dateStr.substring(6, 8));
      let hour = 0;
      let minute = 0;
      let second = 0;

      if (dateStr.includes('T')) {
          const timePart = dateStr.split('T')[1];
          hour = parseInt(timePart.substring(0, 2));
          minute = parseInt(timePart.substring(2, 4));
          second = parseInt(timePart.substring(4, 6));
      }

      // Treating as local for simplicity in this context
      return new Date(year, month, day, hour, minute, second);
  };

  for (let i = 0; i < lines.length; i++) {
    const line = lines[i].trim();
    
    if (line.startsWith('BEGIN:VEVENT')) {
      inEvent = true;
      currentEvent = {
          id: Math.random().toString(36).substr(2, 9),
          calendarId: 'imported',
          color: '#616161',
          recurrence: 'none'
      };
      continue;
    }

    if (line.startsWith('END:VEVENT')) {
      if (currentEvent && currentEvent.title && currentEvent.start) {
          if (!currentEvent.end) {
              // Default 1 hour if no end time
              currentEvent.end = new Date(currentEvent.start.getTime() + 60 * 60 * 1000);
          }
          events.push(currentEvent as CalendarEvent);
      }
      inEvent = false;
      currentEvent = null;
      continue;
    }

    if (inEvent && currentEvent) {
        if (line.startsWith('SUMMARY:')) {
            currentEvent.title = unescapeICS(line.substring(8));
        } else if (line.startsWith('DESCRIPTION:')) {
            currentEvent.description = unescapeICS(line.substring(12));
        } else if (line.startsWith('LOCATION:')) {
            currentEvent.location = unescapeICS(line.substring(9));
        } else if (line.startsWith('DTSTART')) {
             // Handle parameters like DTSTART;TZID=...:
             const parts = line.split(':');
             currentEvent.start = parseICSDate(parts[parts.length - 1]);
        } else if (line.startsWith('DTEND')) {
             const parts = line.split(':');
             currentEvent.end = parseICSDate(parts[parts.length - 1]);
        } else if (line.startsWith('RRULE:')) {
             if (line.includes('FREQ=DAILY')) currentEvent.recurrence = 'daily';
             else if (line.includes('FREQ=WEEKLY')) currentEvent.recurrence = 'weekly';
             else if (line.includes('FREQ=MONTHLY')) currentEvent.recurrence = 'monthly';
             else if (line.includes('FREQ=YEARLY')) currentEvent.recurrence = 'yearly';
        }
    }
  }

  return events;
};
