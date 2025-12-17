import React, { useState, useRef } from 'react';
import { X, Calendar as CalendarIcon, Upload, Download, Globe, ChevronRight } from 'lucide-react';
import { CalendarConfig, CalendarEvent, TimeZoneConfig } from '../types';
import { generateICS, parseICS } from '../utils/icsUtils';
import { TIME_ZONES } from '../constants';

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
    link.setAttribute('download', 'mi_calendario.ics');
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
        if (confirm(`Se encontraron ${importedEvents.length} eventos. ¿Deseas importarlos?`)) {
          onImportEvents(importedEvents);
          alert('Importación completada.');
          onClose();
        }
      } else {
        alert('No se encontraron eventos válidos.');
      }
    } catch (error) {
      alert('Error al leer el archivo.');
    }
  };

  return (
    <div className="fixed inset-0 z-[60] flex items-end md:items-center justify-center bg-black/40 backdrop-blur-sm transition-opacity animate-fade-in-up">
      <div 
        className="
            bg-gray-100 dark:bg-black w-full md:w-[450px] md:rounded-[30px] rounded-t-[30px] overflow-hidden flex flex-col shadow-2xl 
            h-[85vh] md:h-[600px] border border-white/20 dark:border-gray-800 relative
        "
      >
        {/* Navigation Bar */}
        <div className="bg-gray-100/80 dark:bg-gray-900/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-4 py-4 flex items-center justify-between sticky top-0 z-10">
            {activePage !== 'main' ? (
                <button onClick={() => setActivePage('main')} className="text-blue-600 dark:text-blue-400 text-base font-medium flex items-center gap-1">
                    <ChevronRight size={20} className="rotate-180" /> Atrás
                </button>
            ) : (
                <div className="w-16"></div>
            )}
            
            <h2 className="text-base font-bold text-black dark:text-white">
                {activePage === 'main' ? 'Configuración' : activePage === 'timezones' ? 'Zona Horaria' : 'Datos'}
            </h2>
            
            <button onClick={onClose} className="w-16 text-right text-base font-bold text-gray-500 dark:text-gray-400 bg-transparent">
                OK
            </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-5 custom-scrollbar">
            
            {activePage === 'main' && (
                <div className="space-y-6 animate-slide-in-right">
                    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm">
                        <button onClick={() => setActivePage('timezones')} className="w-full flex items-center justify-between p-4 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-orange-500 rounded-lg p-1.5 text-white"><Globe size={18} /></div>
                                <span className="font-medium text-gray-900 dark:text-white">Zona Horaria</span>
                            </div>
                            <div className="flex items-center gap-2">
                                <span className="text-gray-400 text-sm">Local</span>
                                <ChevronRight size={16} className="text-gray-300" />
                            </div>
                        </button>
                        <button onClick={() => setActivePage('data')} className="w-full flex items-center justify-between p-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors">
                            <div className="flex items-center gap-3">
                                <div className="bg-blue-500 rounded-lg p-1.5 text-white"><CalendarIcon size={18} /></div>
                                <span className="font-medium text-gray-900 dark:text-white">Importar / Exportar</span>
                            </div>
                            <ChevronRight size={16} className="text-gray-300" />
                        </button>
                    </div>

                    <div className="px-2">
                        <p className="text-xs text-gray-400 text-center">Versión 1.0.2 (Premium Build)</p>
                    </div>
                </div>
            )}

            {activePage === 'timezones' && (
                <div className="space-y-6 animate-slide-in-right">
                    <div className="bg-white dark:bg-gray-900 rounded-xl p-4 shadow-sm">
                        <div className="flex items-center justify-between mb-4">
                            <span className="text-gray-900 dark:text-white font-medium">Zona Secundaria</span>
                            <label className="relative inline-flex items-center cursor-pointer">
                                <input 
                                    type="checkbox" 
                                    className="sr-only peer"
                                    checked={timeZoneConfig.showSecondary}
                                    onChange={(e) => onTimeZoneChange({...timeZoneConfig, showSecondary: e.target.checked})}
                                />
                                <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none rounded-full peer dark:bg-gray-700 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all dark:border-gray-600 peer-checked:bg-green-500"></div>
                            </label>
                        </div>
                        
                        {timeZoneConfig.showSecondary && (
                            <select 
                                className="w-full bg-gray-100 dark:bg-gray-800 border-none rounded-lg px-3 py-2 text-gray-900 dark:text-white font-medium outline-none"
                                value={timeZoneConfig.secondary}
                                onChange={(e) => onTimeZoneChange({...timeZoneConfig, secondary: e.target.value})}
                            >
                                {TIME_ZONES.filter(tz => tz.value !== 'local').map(tz => (
                                    <option key={tz.value} value={tz.value}>{tz.label}</option>
                                ))}
                            </select>
                        )}
                    </div>
                    <p className="text-xs text-gray-500 px-2">
                        Al activar la zona secundaria, verás una columna extra en las vistas de Día y Semana.
                    </p>
                </div>
            )}

            {activePage === 'data' && (
                <div className="space-y-4 animate-slide-in-right">
                    <div className="bg-white dark:bg-gray-900 rounded-xl overflow-hidden shadow-sm">
                        <button onClick={handleDownloadICS} className="w-full flex items-center gap-3 p-4 border-b border-gray-100 dark:border-gray-800 active:bg-gray-50 dark:active:bg-gray-800 transition-colors text-left">
                            <Download size={20} className="text-blue-600 dark:text-blue-400" />
                            <div>
                                <span className="block font-medium text-gray-900 dark:text-white">Exportar calendario</span>
                                <span className="text-xs text-gray-500">Descargar archivo .ics</span>
                            </div>
                        </button>
                        <button onClick={() => fileInputRef.current?.click()} className="w-full flex items-center gap-3 p-4 active:bg-gray-50 dark:active:bg-gray-800 transition-colors text-left">
                            <Upload size={20} className="text-green-600 dark:text-green-400" />
                            <div>
                                <span className="block font-medium text-gray-900 dark:text-white">Importar calendario</span>
                                <span className="text-xs text-gray-500">Subir archivo .ics</span>
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