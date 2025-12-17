import React, { useState } from 'react';
import { X, RotateCcw, Trash2, AlertTriangle } from 'lucide-react';
import { CalendarEvent } from '../types';
import { format } from 'date-fns';
import { es } from 'date-fns/locale';

interface TrashModalProps {
  isOpen: boolean;
  onClose: () => void;
  deletedEvents: CalendarEvent[];
  onRestore: (id: string) => void;
  onDeletePermanent: (id: string) => void;
}

const TrashModal: React.FC<TrashModalProps> = ({ 
  isOpen, 
  onClose, 
  deletedEvents, 
  onRestore, 
  onDeletePermanent 
}) => {
  const [confirmDeleteId, setConfirmDeleteId] = useState<string | null>(null);

  if (!isOpen) return null;

  if (confirmDeleteId) {
    return (
      <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-scale-in">
        <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-sm p-6 text-center border border-gray-100 dark:border-gray-700">
            <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mx-auto mb-4">
                <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="text-lg font-bold text-gray-800 dark:text-white mb-2">¿Eliminar definitivamente?</h3>
            <p className="text-sm text-gray-500 dark:text-gray-400 mb-6">
                Esta acción no se puede deshacer. El evento desaparecerá para siempre.
            </p>
            <div className="flex gap-3 justify-center">
                <button 
                    onClick={() => setConfirmDeleteId(null)}
                    className="px-5 py-2 text-sm font-medium text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-600 rounded-full hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                >
                    Cancelar
                </button>
                <button 
                    onClick={() => {
                        onDeletePermanent(confirmDeleteId);
                        setConfirmDeleteId(null);
                    }}
                    className="px-5 py-2 text-sm font-medium text-white bg-red-600 hover:bg-red-700 rounded-full shadow-lg transition-colors"
                >
                    Eliminar
                </button>
            </div>
        </div>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-lg overflow-hidden flex flex-col max-h-[80vh] border border-gray-100 dark:border-gray-700">
        
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100 dark:border-gray-700">
          <h2 className="text-xl font-bold text-gray-800 dark:text-white flex items-center gap-2">
            <Trash2 size={20} className="text-gray-500" />
            Papelera
          </h2>
          <button 
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-0 custom-scrollbar">
          {deletedEvents.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12 text-center px-6">
              <div className="w-16 h-16 bg-gray-50 dark:bg-gray-700 rounded-full flex items-center justify-center mb-4">
                 <Trash2 size={32} className="text-gray-300 dark:text-gray-500" />
              </div>
              <p className="text-gray-500 dark:text-gray-400 font-medium">La papelera está vacía</p>
            </div>
          ) : (
            <div className="divide-y divide-gray-100 dark:divide-gray-700">
               {deletedEvents.map(event => (
                 <div key={event.id} className="p-4 hover:bg-gray-50 dark:hover:bg-gray-700/50 transition-colors flex items-center justify-between group">
                    <div className="min-w-0 flex-1 pr-4">
                        <h4 className="font-semibold text-gray-800 dark:text-gray-200 truncate">{event.title}</h4>
                        <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                           {format(event.start, "d 'de' MMMM, yyyy", { locale: es })}
                        </p>
                        <p className="text-xs text-red-400 mt-1 flex items-center gap-1">
                           <AlertTriangle size={10} /> Borrado el {event.deletedAt ? format(new Date(event.deletedAt), 'd MMM', { locale: es }) : 'desconocido'}
                        </p>
                    </div>
                    <div className="flex items-center gap-2 opacity-100 sm:opacity-0 sm:group-hover:opacity-100 transition-opacity">
                        <button 
                          onClick={() => onRestore(event.id)}
                          className="p-2 text-blue-600 hover:bg-blue-50 dark:text-blue-400 dark:hover:bg-blue-900/30 rounded-full"
                          title="Restaurar"
                        >
                            <RotateCcw size={18} />
                        </button>
                        <button 
                          onClick={() => setConfirmDeleteId(event.id)}
                          className="p-2 text-red-600 hover:bg-red-50 dark:text-red-400 dark:hover:bg-red-900/30 rounded-full"
                          title="Eliminar definitivamente"
                        >
                            <Trash2 size={18} />
                        </button>
                    </div>
                 </div>
               ))}
            </div>
          )}
        </div>

        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-700 text-center">
            <p className="text-xs text-gray-500 dark:text-gray-400">
               Los eventos en la papelera no se sincronizan con Google Calendar.
            </p>
        </div>
      </div>
    </div>
  );
};

export default TrashModal;