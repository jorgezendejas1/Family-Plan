
import React, { useState, useRef } from 'react';
import { X, Calendar as CalendarIcon, Upload, Download, Globe, ChevronRight, HardDrive } from 'lucide-react';
import { CalendarEvent, TimeZoneConfig } from '../types';
import { generateICS, parseICS } from '../utils/icsUtils';
import { TIME_ZONES } from '../constants';
import { dataService } from '../services/dataService';

interface SettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  events: CalendarEvent[];
  onImportEvents: (newEvents: CalendarEvent[]) => void;
  timeZoneConfig: TimeZoneConfig;
  onTimeZoneChange: (config: TimeZoneConfig) => void;
}

const SettingsModal: React.FC<SettingsModalProps> = ({ 
  isOpen, 
  onClose, 
  events, 
  onImportEvents,
  timeZoneConfig,
  onTimeZoneChange
}) => {
  const [activePage, setActivePage] = useState<'main' | 'timezones' | 'data'>('main');
  const fileInputRef = useRef<HTMLInputElement>(null);

  if (!isOpen) return null;

  const handleDownloadICS = () => {
    const validEvents = events.filter(e => !e.deletedAt);
    const icsContent = generateICS(validEvents);
    const blob = new Blob([icsContent], { type: 'text/calendar' });
    const url = window.URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', 'family_plan_backup.ics');
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    try {
      const text = await file.text();
      const importedEvents = parseICS(text);
      if (importedEvents.length > 0) {
        if (confirm(`Sincronización Premium: ¿Deseas importar ${importedEvents.length} eventos a tu calendario?`)) {
          onImportEvents(importedEvents);
          onClose();
        }
      } else {
        alert('Formato .ics no válido o vacío.');
      }
    } catch (error) {
      alert('Error al procesar el archivo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in-up">
      <div 
        className="
            bg-gray-50 dark:bg-black w-full md:w-[450px] md:rounded-[40px] rounded-t-[40px] overflow-hidden flex flex-col shadow-2xl 
            h-[85vh] md:h-[600px] border border-white/20 dark:border-gray-800 relative
        "
      >
        <div className="px-6 py-5 flex items-center justify-between sticky top-0 bg-gray-50/80 dark:bg-black/80 backdrop-blur-xl z-10">
            {activePage !== 'main' ? (
                <button onClick={() => setActivePage('main')} className="text-blue-600 dark:text-blue-400 font-bold flex items-center gap-1">
                    <ChevronRight size={20} className="rotate-180" /> Ajustes
                </button>
            ) : <div className="w-20"></div>}
            
            <h2 className="text-lg font-bold text-black dark:text-white">
                {activePage === 'main' ? 'Ajustes' : activePage === 'timezones' ? 'Zona Horaria' : 'Datos'}
            </h2>
            
            <button onClick={onClose} className="p-2 bg-gray-200 dark:bg-gray-800 rounded-full text-gray-500"><X size={18} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 custom-scrollbar">
            {activePage === 'main' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <button onClick={() => setActivePage('timezones')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all border-b border-gray-100 dark:border-zinc-800">
                            <div className="flex items-center gap-4">
                                <div className="bg-orange-500 rounded-2xl p-2 text-white"><Globe size={20} /></div>
                                <span className="font-bold text-gray-900 dark:text-white">Idioma y Zona</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </button>
                        <button onClick={() => setActivePage('data')} className="w-full flex items-center justify-between p-5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all">
                            <div className="flex items-center gap-4">
                                <div className="bg-blue-600 rounded-2xl p-2 text-white"><HardDrive size={20} /></div>
                                <span className="font-bold text-gray-900 dark:text-white">Copia de Seguridad</span>
                            </div>
                            <ChevronRight size={18} className="text-gray-300" />
                        </button>
                    </div>
                    
                    <div className="p-6 bg-ios-blue/10 rounded-[28px] border border-ios-blue/20">
                        <p className="text-xs text-ios-blue font-bold text-center leading-relaxed">
                            Family Plan v2.0 - Premium Edition<br/>
                            Tus datos están seguros localmente.
                        </p>
                    </div>
                </div>
            )}

            {activePage === 'timezones' && (
                <div className="space-y-6">
                    <div className="bg-white dark:bg-zinc-900 rounded-[28px] p-6 border border-gray-100 dark:border-zinc-800">
                        <div className="flex items-center justify-between mb-6">
                            <span className="text-gray-900 dark:text-white font-bold">Reloj Secundario</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={timeZoneConfig.showSecondary}
                                    onChange={(e) => onTimeZoneChange({...timeZoneConfig, showSecondary: e.target.checked})}
                                />
                                <div className="w-12 h-7 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-zinc-800 peer-checked:bg-green-500 after:content-[''] after:absolute after:top-[4px] after:left-[4px] after:bg-white after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:after:translate-x-5"></div>
                            </label>
                        </div>
                        
                        {timeZoneConfig.showSecondary && (
                            <select 
                                className="w-full bg-gray-50 dark:bg-zinc-800 border-none rounded-2xl px-4 py-3 text-gray-900 dark:text-white font-bold outline-none"
                                value={timeZoneConfig.secondary}
                                onChange={(e) => onTimeZoneChange({...timeZoneConfig, secondary: e.target.value})}
                            >
                                {TIME_ZONES.filter(tz => tz.value !== 'local').map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                </div>
            )}

            {activePage === 'data' && (
                <div className="space-y-4">
                    <div className="bg-white dark:bg-zinc-900 rounded-[28px] overflow-hidden border border-gray-100 dark:border-zinc-800">
                        <button onClick={handleDownloadICS} className="w-full flex items-center gap-4 p-5 border-b border-gray-100 dark:border-zinc-800 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-left">
                            <div className="bg-blue-100 dark:bg-blue-900/30 p-2 rounded-xl text-blue-600 dark:text-blue-400">
                                <Download size={22} />
                            </div>
                            <div>
                                <span className="block font-bold text-gray-900 dark:text-white">Exportar (.ics)</span>
                                <span className="text-xs text-gray-500">Universal para Outlook/Google</span>
                            </div>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-4 p-5 hover:bg-gray-50 dark:hover:bg-zinc-800 transition-all text-left">
                            <div className="bg-green-100 dark:bg-green-900/30 p-2 rounded-xl text-green-600 dark:text-green-400">
                                <Upload size={22} />
                            </div>
                            <div>
                                <span className="block font-bold text-gray-900 dark:text-white">Importar (.ics)</span>
                                <span className="text-xs text-gray-500">Restaurar eventos externos</span>
                            </div>
                        </button>
                        <input type="file" ref={fileInputRef} className="hidden" accept=".ics" onChange={handleFileChange} />
                    </div>
                </div>
            )}
        </div>
      </div>
    </div>
  );
};

export default SettingsModal;
