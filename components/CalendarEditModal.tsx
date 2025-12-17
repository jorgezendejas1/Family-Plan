
import React, { useState, useEffect } from 'react';
import { X, Trash2 } from 'lucide-react';
import { CalendarConfig } from '../types';
import { EVENT_COLORS } from '../constants';

interface CalendarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: CalendarConfig | null;
  onSave: (id: string, updates: Partial<CalendarConfig>) => void;
  onDelete: (id: string) => void;
}

const CalendarEditModal: React.FC<CalendarEditModalProps> = ({ 
  isOpen, 
  onClose, 
  calendar, 
  onSave,
  onDelete
}) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('');

  useEffect(() => {
    if (calendar) {
      setLabel(calendar.label);
      setColor(calendar.color);
    }
  }, [calendar]);

  if (!isOpen || !calendar) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onSave(calendar.id, { label, color });
    onClose();
  };

  const handleDelete = () => {
    if (window.confirm(`¿Estás seguro de que quieres eliminar el calendario "${label}"? Se borrarán todos sus eventos.`)) {
      onDelete(calendar.id);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-40 p-4 transition-opacity animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-lg shadow-xl w-full max-w-sm overflow-hidden">
        <div className="flex items-center justify-between px-4 py-3 bg-gray-50 dark:bg-gray-700 border-b border-gray-100 dark:border-gray-600">
          <span className="text-sm font-semibold text-gray-700 dark:text-gray-200 uppercase tracking-wide">
            {calendar.id === 'new' ? 'Crear calendario' : 'Editar calendario'}
          </span>
          <button onClick={onClose} className="p-1 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full text-gray-500 dark:text-gray-400">
            <X size={18} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-4 space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">Nombre</label>
            <input 
              type="text" 
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 outline-none text-gray-800 dark:text-white"
              autoFocus
              placeholder="Nombre del calendario"
            />
          </div>

          <div>
             <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-2">Color</label>
             <div className="flex gap-2 items-center">
                 <input 
                   type="color" 
                   value={color}
                   onChange={(e) => setColor(e.target.value)}
                   className="w-10 h-10 p-0 border-0 rounded cursor-pointer"
                 />
                 <input 
                    type="text"
                    value={color}
                    onChange={(e) => setColor(e.target.value)}
                    className="flex-1 bg-gray-50 dark:bg-gray-700 border border-gray-300 dark:border-gray-600 rounded px-3 py-2 text-sm text-gray-800 dark:text-white uppercase"
                 />
             </div>
          </div>

          <div className="flex items-center justify-between pt-4 mt-2 border-t border-gray-50 dark:border-gray-700">
             {calendar.id !== 'new' ? (
                <button
                  type="button"
                  onClick={handleDelete}
                  className="flex items-center gap-1 px-3 py-2 text-sm font-medium text-red-600 hover:bg-red-50 dark:hover:bg-red-900/30 rounded transition-colors"
                >
                  <Trash2 size={16} />
                  <span>Eliminar</span>
                </button>
             ) : (
               <div></div> /* Spacer */
             )}

             <div className="flex gap-2">
                <button 
                    type="button" 
                    onClick={onClose} 
                    className="px-4 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    type="submit"
                    className="px-4 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded shadow-sm transition-colors"
                >
                    Guardar
                </button>
             </div>
          </div>
        </form>
      </div>
    </div>
  );
};

export default CalendarEditModal;