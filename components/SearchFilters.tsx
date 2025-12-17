
import React from 'react';
import { CalendarConfig, SearchCriteria } from '../types';
import { X } from 'lucide-react';

interface SearchFiltersProps {
  isOpen: boolean;
  onClose: () => void;
  criteria: SearchCriteria;
  onCriteriaChange: (criteria: SearchCriteria) => void;
  calendars: CalendarConfig[];
}

const SearchFilters: React.FC<SearchFiltersProps> = ({
  isOpen,
  onClose,
  criteria,
  onCriteriaChange,
  calendars
}) => {
  if (!isOpen) return null;

  const handleChange = (field: keyof SearchCriteria, value: string) => {
    onCriteriaChange({
      ...criteria,
      [field]: value
    });
  };

  return (
    <div className="absolute top-2 right-4 md:right-auto md:left-1/2 md:-translate-x-1/2 z-50 w-80 bg-white dark:bg-gray-800 rounded-lg shadow-xl border border-gray-200 dark:border-gray-700 animate-fade-in-up">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-100 dark:border-gray-700">
        <span className="text-sm font-semibold text-gray-700 dark:text-gray-200">Filtros de búsqueda</span>
        <button onClick={onClose} className="text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
          <X size={16} />
        </button>
      </div>
      
      <div className="p-4 space-y-4">
        {/* Calendar Filter */}
        <div>
          <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Calendario</label>
          <select
            value={criteria.calendarId || ''}
            onChange={(e) => handleChange('calendarId', e.target.value)}
            className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-200"
          >
            <option value="">Todos los calendarios</option>
            {calendars.map(cal => (
              <option key={cal.id} value={cal.id}>{cal.label}</option>
            ))}
          </select>
        </div>

        {/* Date Range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Desde</label>
            <input
              type="date"
              value={criteria.startDate || ''}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-200"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Hasta</label>
            <input
              type="date"
              value={criteria.endDate || ''}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-2 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-700 dark:text-gray-200"
            />
          </div>
        </div>

        {/* Reset Button */}
        <div className="pt-2 text-right">
            <button 
                onClick={() => onCriteriaChange({ query: criteria.query, startDate: '', endDate: '', calendarId: '' })}
                className="text-xs text-blue-600 dark:text-blue-400 hover:text-blue-800 dark:hover:text-blue-300 font-medium"
            >
                Limpiar filtros
            </button>
        </div>
      </div>
    </div>
  );
};

export default SearchFilters;
