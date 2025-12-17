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
  addMinutes,
  differenceInWeeks,
  differenceInMonths
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
 * OPTIMIZED V2: Smart jump logic for all recurrence types to save CPU.
 */
export const generateRecurringEvents = (
  events: CalendarEvent[], 
  rangeStart: Date, 
  rangeEnd: Date
): CalendarEvent[] => {
  const result: CalendarEvent[] = [];
  
  // Cache times for performance comparison
  const rangeStartMs = rangeStart.getTime();
  const rangeEndMs = rangeEnd.getTime();

  events.forEach(event => {
    // 1. Quick check: If event starts WAY after range end, skip entirely
    if (event.start.getTime() > rangeEndMs) return;

    // 2. Quick check: If event ended WAY before range start and has no recurrence, skip
    if ((!event.recurrence || event.recurrence === 'none') && event.end.getTime() < rangeStartMs) {
      return;
    }

    // If no recurrence, standard check
    if (!event.recurrence || event.recurrence === 'none') {
      if (event.start.getTime() <= rangeEndMs && event.end.getTime() >= rangeStartMs) {
        result.push(event);
      }
      return;
    }

    // RECURRENCE LOGIC
    const duration = differenceInMinutes(event.end, event.start);
    let currentStart = new Date(event.start);
    
    // SAFETY: Prevent infinite loops
    let iterations = 0;
    const MAX_ITERATIONS = 500; 

    // OPTIMIZATION: "Teleport" currentStart closer to rangeStart
    // This avoids iterating day-by-day from 2020 to 2025.
    if (currentStart.getTime() < rangeStartMs) {
       if (event.recurrence === 'daily') {
          const daysDiff = Math.floor((rangeStartMs - currentStart.getTime()) / (1000 * 60 * 60 * 24));
          if (daysDiff > 0) currentStart = addDays(currentStart, daysDiff - 1);
       } 
       else if (event.recurrence === 'weekly') {
          // Jump full weeks to maintain the "Day of Week" alignment
          const weeksDiff = Math.floor(differenceInWeeks(rangeStart, currentStart));
          if (weeksDiff > 0) currentStart = addWeeks(currentStart, weeksDiff - 1);
       }
       else if (event.recurrence === 'monthly') {
          // Jump full months to maintain "Day of Month" alignment
          const monthsDiff = differenceInMonths(rangeStart, currentStart);
          if (monthsDiff > 0) currentStart = addMonths(currentStart, monthsDiff - 1);
       }
       else if (event.recurrence === 'yearly') {
          // Jump years
          const currentYear = currentStart.getFullYear();
          const targetYear = rangeStart.getFullYear();
          const yearDiff = targetYear - currentYear;
          if (yearDiff > 0) currentStart = addYears(currentStart, yearDiff - 1);
       }
    }

    while (isBefore(currentStart, rangeEnd) && iterations < MAX_ITERATIONS) {
      iterations++;
      
      // Check if recurrence has ended globally
      if (event.recurrenceEnds && isAfter(currentStart, event.recurrenceEnds)) {
        break;
      }

      // Calculate end time
      const currentEnd = addMinutes(currentStart, duration);

      // Only add if it overlaps with the view range and starts on/after the original start date
      if (
          currentEnd.getTime() >= rangeStartMs && 
          currentStart.getTime() <= rangeEndMs &&
          !isBefore(currentStart, event.start)
      ) {
        
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