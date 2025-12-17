import { 
  format, 
  endOfWeek, 
  eachDayOfInterval, 
  endOfMonth, 
  isSameDay, 
  addDays,
  addWeeks,
  addMonths,
  addYears,
  isBefore,
  isAfter,
  differenceInMinutes,
  addMinutes
} from 'date-fns';
import startOfWeek from 'date-fns/startOfWeek';
import startOfMonth from 'date-fns/startOfMonth';
import { es } from 'date-fns/locale';
import { CalendarEvent, RecurrenceType } from '../types';

// Helper to use Spanish locale globally for calendar generation
export const getMonthDays = (currentDate: Date) => {
  const monthStart = startOfMonth(currentDate);
  const monthEnd = endOfMonth(currentDate);
  const startDate = startOfWeek(monthStart, { locale: es });
  const endDate = endOfWeek(monthEnd, { locale: es });
  
  return eachDayOfInterval({
    start: startDate,
    end: endDate
  });
};

export const getWeekDays = (currentDate: Date) => {
  const start = startOfWeek(currentDate, { locale: es });
  const end = endOfWeek(currentDate, { locale: es });
  return eachDayOfInterval({ start, end });
};

export const getEventsForDay = (events: CalendarEvent[], date: Date) => {
  return events.filter(event => isSameDay(event.start, date));
};

export const formatTime = (date: Date) => {
  return format(date, 'h:mm a');
};

/**
 * Expands recurring events into individual instances for a specific time range.
 */
export const generateRecurringEvents = (
  events: CalendarEvent[], 
  rangeStart: Date, 
  rangeEnd: Date
): CalendarEvent[] => {
  const result: CalendarEvent[] = [];

  events.forEach(event => {
    // If no recurrence, checks if it falls within range
    if (!event.recurrence || event.recurrence === 'none') {
      if (isAfter(event.end, rangeStart) && isBefore(event.start, rangeEnd)) {
        result.push(event);
      }
      return;
    }

    const duration = differenceInMinutes(event.end, event.start);
    let currentStart = new Date(event.start);
    
    // Safety break to prevent infinite loops
    let iterations = 0;
    const MAX_ITERATIONS = 500; // Reduced for performance safety

    while (isBefore(currentStart, rangeEnd) && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Check if recurrence has ended
      if (event.recurrenceEnds && isAfter(currentStart, event.recurrenceEnds)) {
        break;
      }

      // Calculate end time using addMinutes for safe duration handling (handles DST better than raw milliseconds)
      const currentEnd = addMinutes(currentStart, duration);

      // Only add if it overlaps with the view range and starts on/after the original start date
      if (isAfter(currentEnd, rangeStart) && !isBefore(currentStart, event.start)) {
        
        // Check for exceptions (exdates)
        const isExcluded = event.exdates?.some(exDate => isSameDay(exDate, currentStart));
        
        if (!isExcluded) {
          result.push({
            ...event,
            id: `${event.id}_${currentStart.getTime()}`, // Unique ID for the instance
            start: new Date(currentStart),
            end: currentEnd,
          });
        }
      }

      // Increment date based on recurrence rule
      switch (event.recurrence) {
        case 'daily':
          currentStart = addDays(currentStart, 1);
          break;
        case 'weekly':
          currentStart = addWeeks(currentStart, 1);
          break;
        case 'monthly':
          currentStart = addMonths(currentStart, 1);
          break;
        case 'yearly':
          currentStart = addYears(currentStart, 1);
          break;
        default:
          currentStart = addYears(currentStart, 100); 
      }
    }
  });

  return result;
};