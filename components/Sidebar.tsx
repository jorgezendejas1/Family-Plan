
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Check, Trash2, Mail, LogOut, RefreshCw, Smartphone as SmartphoneIcon, Settings, HelpCircle, ShieldCheck, AlertCircle, Users, Zap } from 'lucide-react';
import { format, endOfWeek, eachDayOfInterval, endOfMonth, isSameDay, addMonths, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ViewType, CalendarConfig, Theme, User } from '../types';
import { googleCalendarService, GoogleAccount } from '../services/googleCalendarService';

interface SidebarProps {
  isOpen: boolean;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCreateClick: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  calendars: CalendarConfig[];
  onToggleCalendar: (id: string) => void;
  theme: Theme;
  onThemeChange: (theme: Theme) => void;
  onClose?: () => void;
  onOpenSettings?: () => void;
  onOpenHelp?: () => void;
  currentUser: User;
  onLogout: () => void;
  onOpenPricing: () => void;
}

const Sidebar: React.FC<SidebarProps> = ({ 
  isOpen, currentDate, onDateSelect, calendars, onToggleCalendar, theme, onThemeChange, onClose, onOpenSettings, onOpenHelp, currentUser, onLogout, onOpenPricing, currentView, onViewChange
}) => {
  const [miniDate, setMiniDate] = useState(new Date());
  const [accounts, setAccounts] = useState<GoogleAccount[]>([]);
  const [isSyncing, setIsSyncing] = useState(false);

  useEffect(() => {
    setAccounts(googleCalendarService.getConnectedAccounts());
    const interval = setInterval(() => {
        setAccounts(googleCalendarService.getConnectedAccounts());
    }, 5000);
    return () => clearInterval(interval);
  }, []);

  const handleAddAccount = async () => {
    setIsSyncing(true);
    try {
      await googleCalendarService.addAccount();
      setAccounts(googleCalendarService.getConnectedAccounts());
    } finally {
      setIsSyncing(false);
    }
  };

  const miniDays = useMemo(() => {
      const monthStart = startOfMonth(miniDate);
      const monthEnd = endOfMonth(miniDate);
      const start = startOfWeek(monthStart, { locale: es });
      const end = endOfWeek(monthEnd, { locale: es });
      return eachDayOfInterval({ start, end });
  }, [miniDate]);

  return (
    <>
      {/* Elegante Backdrop Blur para móvil */}
      <div 
        className={`fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] z-[65] transition-opacity duration-500 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`}
        onClick={onClose}
      ></div>

      <aside className={`
        fixed inset-y-2 left-4 z-[70] w-[85vw] max-w-[320px] bg-white/95 dark:bg-black/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl rounded-[32px] flex flex-col transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)]
        ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'}
        mt-[calc(env(safe-area-inset-top,0px)+72px)] lg:mt-0
        lg:static lg:translate-x-0 lg:w-72 lg:h-full lg:shadow-none lg:bg-white/80 lg:dark:bg-black/80 lg:z-40 overflow-hidden shrink-0 transition-none
      `}>
        <div className="flex-1 flex flex-col p-6 overflow-y-auto custom-scrollbar">
          
          <div className="flex items-center justify-between mb-8">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <SmartphoneIcon size={18} className="text-white dark:text-black" />
              </div>
              <h1 className="text-xl font-bold dark:text-white">Family Plan</h1>
            </div>
            {/* Botón de cierre visible en móvil para redundancia */}
            <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full transition-colors active:scale-90"><X size={20} /></button>
          </div>

          {/* Plan SaaS Status */}
          <div 
            onClick={onOpenPricing}
            className="mb-6 bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-xl hover:scale-[1.02] active:scale-95 transition-all cursor-pointer group relative overflow-hidden"
          >
            <div className="absolute top-0 right-0 w-20 h-20 bg-white/10 blur-2xl rounded-full"></div>
            <div className="flex justify-between items-start mb-1">
              <span className="text-[10px] font-bold uppercase tracking-widest opacity-80">Plan Actual</span>
              <Zap size={14} className="group-hover:animate-pulse" />
            </div>
            <p className="text-lg font-bold capitalize">{currentUser.plan === 'unlimited' ? 'Ilimitado' : currentUser.plan}</p>
            <p className="text-[10px] opacity-70 mt-1">Pulsa para ver beneficios premium</p>
          </div>

          {/* Master Admin Section */}
          {currentUser.role === 'master' && (
            <div className="mb-8">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3 block">Administración</span>
                <button 
                  onClick={() => onViewChange('users')}
                  className={`w-full flex items-center gap-3 px-3 py-3 rounded-2xl transition-all ${currentView === 'users' ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'hover:bg-gray-100 dark:hover:bg-zinc-800 dark:text-gray-300'}`}
                >
                  <Users size={18} />
                  <span className="text-sm">Gestión SaaS</span>
                </button>
            </div>
          )}

          {/* Mini Calendar */}
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4 px-1">
              <span className="text-sm font-bold capitalize dark:text-white">{format(miniDate, 'MMMM yyyy', { locale: es })}</span>
              <div className="flex gap-1">
                <button onClick={() => setMiniDate(addMonths(miniDate, -1))} className="p-1 text-gray-400"><ChevronLeft size={18} /></button>
                <button onClick={() => setMiniDate(addMonths(miniDate, 1))} className="p-1 text-gray-400"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-[10px] text-center font-bold text-gray-400">{d}</div>)}
              {miniDays.map(day => (
                <button 
                  key={day.toString()}
                  onClick={() => onDateSelect(day)}
                  className={`h-8 w-8 rounded-xl text-xs flex items-center justify-center transition-all ${isSameDay(day, currentDate) ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}
                >
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          {/* Main Calendars */}
          <div className="mb-8">
            <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest px-1 mb-3 block">Calendarios</span>
            <div className="space-y-1 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl p-2">
                {calendars.map(cal => (
                  <div key={cal.id} className="flex items-center gap-3 px-3 py-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all cursor-pointer" onClick={() => onToggleCalendar(cal.id)}>
                    <div 
                      className={`w-5 h-5 rounded-lg border-2 flex items-center justify-center transition-all ${cal.visible ? 'border-transparent' : 'border-gray-300 dark:border-gray-600'}`} 
                      style={{ backgroundColor: cal.visible ? cal.color : 'transparent' }}
                    >
                      {cal.visible && <Check size={12} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className={`text-sm font-medium truncate ${cal.visible ? 'dark:text-gray-200' : 'text-gray-400'}`}>{cal.label}</span>
                  </div>
                ))}
            </div>
          </div>
        </div>

        <div className="mt-auto p-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-1 bg-white/50 dark:bg-black/50 backdrop-blur-md">
          {/* User Session Info */}
          <div className="mb-4 bg-gray-50 dark:bg-zinc-900 rounded-2xl p-3 flex items-center justify-between">
              <div className="flex items-center gap-3 overflow-hidden">
                <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0">{currentUser.name[0]}</div>
                <div className="min-w-0">
                    <p className="text-[11px] font-bold dark:text-white truncate">{currentUser.name}</p>
                    <p className="text-[9px] text-gray-400 truncate">{currentUser.email}</p>
                </div>
              </div>
              <button 
                type="button"
                onClick={(e) => { e.stopPropagation(); onLogout(); }} 
                className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"
                title="Cerrar sesión"
              >
                <LogOut size={16} />
              </button>
          </div>

          <div className="flex items-center justify-between mb-2">
              <button onClick={onOpenSettings} className="flex items-center gap-3 px-3 py-2.5 text-xs font-bold text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all flex-1 text-left">
                  <Settings size={16} className="text-gray-400" />Configuración
              </button>
              <button onClick={onOpenHelp} className="p-2.5 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-all"><HelpCircle size={18} /></button>
          </div>

          <button 
              onClick={handleAddAccount}
              className="w-full flex items-center justify-center gap-2 py-3.5 bg-black dark:bg-white text-white dark:text-black rounded-2xl text-[13px] font-bold hover:scale-[1.02] active:scale-95 transition-all shadow-xl border border-white/10 relative overflow-hidden group"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/5 to-transparent -translate-x-full group-hover:translate-x-full transition-transform duration-1000"></div>
              <Plus size={18} strokeWidth={3} />
              <span>Google Calendar</span>
            </button>
        </div>
      </aside>
    </>
  );
};

export default Sidebar;
