
import React from 'react';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';
import { ViewProps } from '../types';
import { SearchX, Calendar } from 'lucide-react';

const SearchResultsView: React.FC<ViewProps> = ({ events, calendars, onEventClick }) => {
  if (events.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-full text-center px-6 bg-white dark:bg-gray-900">
        <div className="w-24 h-24 bg-gray-50 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
           <SearchX className="w-12 h-12 text-gray-400 dark:text-gray-500" />
        </div>
        <h3 className="text-lg font-medium text-gray-800 dark:text-gray-200 mb-1">No se encontraron eventos</h3>
        <p className="text-sm text-gray-500 dark:text-gray-400">Prueba con otras palabras clave o ajusta los filtros.</p>
      </div>
    );
  }

  // Sort chronologically
  const sortedEvents = [...events].sort((a, b) => a.start.getTime() - b.start.getTime());

  const getCalendarName = (id: string) => calendars.find(c => c.id === id)?.label || '';

  return (
    <div className="h-full overflow-y-auto bg-white dark:bg-gray-900 custom-scrollbar p-4">
      <h2 className="text-lg font-medium text-gray-700 dark:text-gray-300 mb-4 px-2">Resultados de búsqueda ({events.length})</h2>
      <div className="space-y-2 max-w-3xl mx-auto">
        {sortedEvents.map(event => {
            const calName = getCalendarName(event.calendarId);

            return (
                <div 
                    key={event.id}
                    onClick={() => onEventClick(event)}
                    className="flex flex-col sm:flex-row sm:items-center gap-3 p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:shadow-md hover:border-blue-200 dark:hover:border-blue-700 transition-all cursor-pointer bg-white dark:bg-gray-800"
                >
                    {/* Date Block */}
                    <div className="flex items-center gap-3 min-w-[150px]">
                        <div className="p-2 bg-gray-50 dark:bg-gray-700 rounded-lg text-center min-w-[50px]">
                            <span className="block text-xs font-bold text-gray-500 dark:text-gray-400 uppercase">{format(event.start, 'MMM', { locale: es })}</span>
                            <span className="block text-xl font-bold text-gray-800 dark:text-white">{format(event.start, 'd')}</span>
                        </div>
                        <div className="flex flex-col">
                            <span className="text-sm font-medium text-gray-900 dark:text-white">{format(event.start, 'EEEE', { locale: es })}</span>
                            <span className="text-xs text-gray-500 dark:text-gray-400">{format(event.start, 'yyyy')}</span>
                        </div>
                    </div>

                    {/* Event Details */}
                    <div className="flex-1 min-w-0 border-l-2 pl-3 ml-1 sm:ml-0" style={{ borderLeftColor: event.color }}>
                        <h4 className="text-base font-semibold text-gray-800 dark:text-gray-200 truncate">{event.title}</h4>
                        <div className="flex flex-wrap items-center gap-2 text-xs text-gray-500 dark:text-gray-400 mt-1">
                            <Calendar size={12} />
                            <span>
                                {format(event.start, 'h:mm a')} - {format(event.end, 'h:mm a')}
                            </span>
                            {calName && (
                                <span className="flex items-center gap-1 px-1.5 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-[10px] font-semibold">
                                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: event.color }}></span>
                                    {calName}
                                </span>
                            )}
                        </div>
                        {event.description && (
                            <p className="text-sm text-gray-600 dark:text-gray-400 mt-1 line-clamp-1">{event.description}</p>
                        )}
                    </div>
                </div>
            );
        })}
      </div>
      <div className="h-10"></div>
    </div>
  );
};

export default SearchResultsView;