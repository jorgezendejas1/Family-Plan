
import React, { useState, useEffect } from 'react';
import { X, Trash2, Check, Globe, Link2, Unlink } from 'lucide-react';
import { CalendarConfig } from '../types';
import { EVENT_COLORS } from '../constants';
import { googleCalendarService, GoogleAccount } from '../services/googleCalendarService';

interface CalendarEditModalProps {
  isOpen: boolean;
  onClose: () => void;
  calendar: CalendarConfig | null;
  onSave: (id: string, updates: Partial<CalendarConfig>) => void;
  onDelete: (id: string) => void;
  canDelete: boolean;
}

const CalendarEditModal: React.FC<CalendarEditModalProps> = ({ 
  isOpen, onClose, calendar, onSave, onDelete, canDelete
}) => {
  const [label, setLabel] = useState('');
  const [color, setColor] = useState('');
  const [googleEmail, setGoogleEmail] = useState<string | undefined>(undefined);
  const [connectedAccounts, setConnectedAccounts] = useState<GoogleAccount[]>([]);

  useEffect(() => {
    if (calendar) {
      setLabel(calendar.id === 'new' ? '' : calendar.label);
      setColor(calendar.color || EVENT_COLORS[0]);
      setGoogleEmail(calendar.googleAccountEmail);
      setConnectedAccounts(googleCalendarService.getConnectedAccounts());
    }
  }, [calendar, isOpen]);

  if (!isOpen || !calendar) return null;

  const handleLinkAccount = async () => {
    try {
        const acc = await googleCalendarService.addAccount();
        setConnectedAccounts(googleCalendarService.getConnectedAccounts());
        setGoogleEmail(acc.email);
    } catch (e) {
        alert('Error al conectar cuenta de Google');
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/40 backdrop-blur-sm p-4 animate-fade-in">
      <div className="bg-white dark:bg-zinc-900 rounded-[32px] shadow-2xl w-full max-w-sm overflow-hidden border border-white/20 dark:border-zinc-800 animate-scale-in">
        <div className="px-6 py-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center">
          <h3 className="text-sm font-bold dark:text-white uppercase tracking-widest">{calendar.id === 'new' ? 'Nuevo Miembro' : 'Editar Miembro'}</h3>
          <button onClick={onClose} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full text-gray-500"><X size={18} /></button>
        </div>

        <div className="p-6 space-y-6">
          <div>
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 block px-1">Nombre del Miembro</label>
            <input 
              type="text" value={label} onChange={(e) => setLabel(e.target.value)}
              className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl px-4 py-3 text-sm font-bold outline-none dark:text-white focus:ring-2 ring-blue-500/30"
              placeholder="Ej. Mama, Papa..."
            />
          </div>

          <div>
             <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1">Color de Identificación</label>
             <div className="grid grid-cols-5 gap-3">
                 {EVENT_COLORS.map(c => (
                     <button 
                        key={c} onClick={() => setColor(c)}
                        className={`w-full aspect-square rounded-xl border-4 transition-all ${color === c ? 'border-black dark:border-white scale-110 shadow-lg' : 'border-transparent hover:scale-105'}`}
                        style={{ backgroundColor: c }}
                     />
                 ))}
             </div>
          </div>

          <div className="pt-2">
            <label className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3 block px-1 flex items-center gap-2">
                <Globe size={12} className="text-blue-500" /> Sincronización Google
            </label>
            
            <div className="bg-gray-50 dark:bg-zinc-800 rounded-2xl p-4 border border-gray-100 dark:border-zinc-700/50">
                {googleEmail ? (
                    <div className="flex items-center justify-between">
                        <div className="flex flex-col min-w-0">
                            <span className="text-[10px] text-green-500 font-bold uppercase">Vinculado a:</span>
                            <span className="text-xs font-bold dark:text-white truncate">{googleEmail}</span>
                        </div>
                        <button onClick={() => setGoogleEmail(undefined)} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-xl transition-all">
                            <Unlink size={16} />
                        </button>
                    </div>
                ) : (
                    <div className="space-y-3">
                        {connectedAccounts.length > 0 && (
                            <select 
                                className="w-full bg-white dark:bg-zinc-900 border-none rounded-xl px-3 py-2 text-xs font-bold outline-none"
                                value={googleEmail || ''}
                                onChange={(e) => setGoogleEmail(e.target.value || undefined)}
                            >
                                <option value="">Seleccionar cuenta...</option>
                                {connectedAccounts.map(acc => (
                                    <option key={acc.email} value={acc.email}>{acc.email}</option>
                                ))}
                            </select>
                        )}
                        <button 
                            onClick={handleLinkAccount}
                            className="w-full py-2.5 border-2 border-dashed border-gray-200 dark:border-zinc-700 rounded-xl text-[11px] font-bold text-gray-400 hover:border-blue-500 hover:text-blue-500 transition-all flex items-center justify-center gap-2"
                        >
                            <Link2 size={14} /> Conectar nueva cuenta
                        </button>
                    </div>
                )}
            </div>
          </div>

          <div className="flex gap-3 pt-4 border-t border-gray-100 dark:border-zinc-800">
             {calendar.id !== 'new' && canDelete && (
                <button 
                  onClick={() => window.confirm('¿Borrar este miembro y todos sus eventos?') && onDelete(calendar.id)}
                  className="p-3 bg-red-50 dark:bg-red-900/20 text-red-500 rounded-2xl hover:bg-red-100 transition-colors"
                >
                  <Trash2 size={20} />
                </button>
             )}
             <button 
                onClick={() => onSave(calendar.id, { label, color, googleAccountEmail: googleEmail })}
                className="flex-1 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-bold shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2"
             >
                <Check size={18} strokeWidth={3} /> {calendar.id === 'new' ? 'Crear' : 'Guardar'}
             </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CalendarEditModal;
