
import React, { useState, useEffect, useMemo } from 'react';
import { Plus, ChevronLeft, ChevronRight, X, Check, Settings, LogOut, Lock, Zap, Edit2, Trash2, Smartphone, RotateCcw, Globe, ShieldCheck } from 'lucide-react';
import { format, endOfWeek, eachDayOfInterval, endOfMonth, isSameDay, addMonths, startOfMonth, startOfWeek } from 'date-fns';
import { es } from 'date-fns/locale';
import { ViewType, CalendarConfig, Theme, User } from '../types';
import { PLAN_LIMITS, EVENT_COLORS } from '../constants';
import { dataService } from '../services/dataService';
import CalendarEditModal from './CalendarEditModal';

interface SidebarProps {
  isOpen: boolean;
  currentDate: Date;
  onDateSelect: (date: Date) => void;
  onCreateClick: () => void;
  currentView: ViewType;
  onViewChange: (view: ViewType) => void;
  calendars: CalendarConfig[];
  onToggleCalendar: (id: string) => void;
  onCalendarsChange: (newCalendars: CalendarConfig[]) => void;
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
  isOpen, currentDate, onDateSelect, calendars, onToggleCalendar, onCalendarsChange, theme, onThemeChange, onClose, onOpenSettings, onOpenHelp, currentUser, onLogout, onOpenPricing, currentView, onViewChange
}) => {
  const [miniDate, setMiniDate] = useState(new Date());
  const [editingCalendar, setEditingCalendar] = useState<CalendarConfig | null>(null);
  const [isResetting, setIsResetting] = useState(false);

  const planKey = currentUser.plan;
  const limit = PLAN_LIMITS[planKey as keyof typeof PLAN_LIMITS] || 1;
  const canAddMore = calendars.length < limit;

  const monthlyAILimit = useMemo(() => {
    if (currentUser.plan === 'unlimited' || currentUser.plan === 'admin') return '∞';
    if (currentUser.plan === 'pro' || currentUser.plan === 'casa') return '800';
    if (currentUser.plan === 'basic') return '160';
    return '40';
  }, [currentUser]);

  const miniDays = useMemo(() => {
      const monthStart = startOfMonth(miniDate);
      const monthEnd = endOfMonth(miniDate);
      const start = startOfWeek(monthStart, { locale: es });
      const end = endOfWeek(monthEnd, { locale: es });
      return eachDayOfInterval({ start, end });
  }, [miniDate]);

  const handleUpdateCalendar = async (id: string, updates: Partial<CalendarConfig>) => {
    if (id === 'new') {
        const created = await dataService.createCalendar(updates.label || 'Nuevo', updates.color || EVENT_COLORS[0]);
        if (created) onCalendarsChange([...calendars, created]);
    } else {
        await dataService.updateCalendar(id, updates);
        onCalendarsChange(calendars.map(c => {
          if (c.id === id) {
            return { ...c, ...updates };
          }
          return c;
        }));
    }
    setEditingCalendar(null);
  };

  const handleDeleteCalendar = async (id: string) => {
    if (calendars.length <= 1) return;
    await dataService.deleteCalendar(id);
    onCalendarsChange(calendars.filter(c => c.id !== id));
    setEditingCalendar(null);
  };

  const handleResetToDefaults = async (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    
    const msg = '¿Estás seguro de que quieres restablecer todos los calendarios y borrar los eventos? Se restaurarán los miembros por defecto (Admin, Mamá, Papá, etc.).';
    if (window.confirm(msg)) {
        setIsResetting(true);
        try {
            await dataService.resetCalendarsToDefault();
            window.location.reload();
        } catch (e) {
            console.error('Error al restablecer:', e);
            alert('No se pudo restablecer: ' + e);
            setIsResetting(false);
        }
    }
  };

  return (
    <>
      {/* Overlay para móviles */}
      <div className={`fixed inset-0 bg-black/10 dark:bg-black/40 backdrop-blur-[2px] z-[65] transition-opacity duration-500 lg:hidden ${isOpen ? 'opacity-100' : 'opacity-0 pointer-events-none'}`} onClick={onClose}></div>

      {/* Contenedor principal del Sidebar */}
      <aside className={`fixed inset-y-2 left-4 z-[70] w-[85vw] max-w-[320px] bg-white/95 dark:bg-black/95 backdrop-blur-3xl border border-black/5 dark:border-white/10 shadow-2xl rounded-[32px] transition-all duration-500 ease-[cubic-bezier(0.32,0.72,0,1)] ${isOpen ? 'translate-x-0' : '-translate-x-[120%]'} mt-[calc(env(safe-area-inset-top,0px)+72px)] lg:mt-0 lg:static lg:translate-x-0 lg:w-72 lg:h-full lg:shadow-none lg:bg-white/80 lg:dark:bg-black/80 lg:z-40 overflow-hidden shrink-0`}>
        
        {/* Único contenedor con scroll que abarca TODO */}
        <div className="h-full overflow-y-auto custom-scrollbar flex flex-col p-6">
          
          {/* Header Branding */}
          <div className="flex items-center justify-between mb-8 shrink-0">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                <Smartphone size={18} className="text-white dark:text-black" />
              </div>
              <h1 className="text-xl font-bold dark:text-white">Family Plan</h1>
            </div>
            <button onClick={onClose} className="lg:hidden p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 rounded-full active:scale-90"><X size={20} /></button>
          </div>

          {/* Mini Calendario */}
          <div className="mb-8 px-1 shrink-0">
            <div className="flex items-center justify-between mb-4">
              <span className="text-sm font-bold capitalize dark:text-white">{format(miniDate, 'MMMM yyyy', { locale: es })}</span>
              <div className="flex gap-1">
                <button onClick={() => setMiniDate(addMonths(miniDate, -1))} className="p-1 text-gray-400"><ChevronLeft size={18} /></button>
                <button onClick={() => setMiniDate(addMonths(miniDate, 1))} className="p-1 text-gray-400"><ChevronRight size={18} /></button>
              </div>
            </div>
            <div className="grid grid-cols-7 gap-y-1">
              {['D','L','M','M','J','V','S'].map(d => <div key={d} className="text-[10px] text-center font-bold text-gray-400">{d}</div>)}
              {miniDays.map(day => (
                <button key={day.toString()} onClick={() => onDateSelect(day)} className={`h-8 w-8 rounded-xl text-xs flex items-center justify-center transition-all ${isSameDay(day, currentDate) ? 'bg-black dark:bg-white text-white dark:text-black font-bold' : 'dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800'}`}>
                  {format(day, 'd')}
                </button>
              ))}
            </div>
          </div>

          {/* Miembros de la Familia */}
          <div className="mb-8 shrink-0">
            <div className="flex items-center justify-between mb-3 px-1">
                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Miembros Familia</span>
                <div className="flex items-center gap-1">
                    {(currentUser.plan === 'admin' || currentUser.plan === 'casa' || currentUser.plan === 'pro' || currentUser.plan === 'unlimited') && (
                        <button 
                            disabled={isResetting}
                            onMouseDown={(e) => handleResetToDefaults(e as any)}
                            className={`p-2 text-gray-400 hover:text-orange-500 hover:bg-orange-50 dark:hover:bg-orange-900/20 rounded-lg transition-all active:scale-90 cursor-pointer ${isResetting ? 'animate-spin pointer-events-none' : ''}`}
                            title="Restablecer a valores de fábrica"
                        >
                            <RotateCcw size={16} />
                        </button>
                    )}
                    {canAddMore && (
                        <button onClick={() => setEditingCalendar({ id: 'new', label: '', color: EVENT_COLORS[0], visible: true })} className="p-2 text-blue-500 hover:bg-blue-50 dark:hover:bg-blue-900/20 rounded-lg transition-all active:scale-90">
                            <Plus size={16} strokeWidth={3} />
                        </button>
                    )}
                </div>
            </div>
            <div className="space-y-1 bg-gray-50/50 dark:bg-zinc-900/50 rounded-2xl p-2 max-h-[400px] overflow-y-auto custom-scrollbar">
                {calendars.map(cal => (
                  <div key={cal.id} className="group flex items-center justify-between px-3 py-2 hover:bg-white dark:hover:bg-zinc-800 rounded-xl transition-all">
                    <div className="flex items-center gap-3 cursor-pointer overflow-hidden flex-1" onClick={() => onToggleCalendar(cal.id)}>
                        <div className={`w-4 h-4 rounded-md border-2 shrink-0 flex items-center justify-center ${cal.visible ? 'border-transparent' : 'border-gray-300'}`} style={{ backgroundColor: cal.visible ? cal.color : 'transparent' }}>
                            {cal.visible && <Check size={10} className="text-white" strokeWidth={4} />}
                        </div>
                        <div className="flex flex-col min-w-0">
                            <div className="flex items-center gap-1.5">
                                <span className={`text-xs font-bold truncate ${cal.visible ? 'dark:text-gray-200' : 'text-gray-400'}`}>{cal.label}</span>
                                {cal.googleAccountEmail && <Globe size={10} className="text-blue-500 animate-pulse" />}
                            </div>
                        </div>
                    </div>
                    <button onClick={() => setEditingCalendar(cal)} className="opacity-0 group-hover:opacity-100 p-1 text-gray-400 hover:text-blue-500 transition-all"><Edit2 size={12} /></button>
                  </div>
                ))}
            </div>
          </div>

          {/* Sección de Info (Badges y Usuario) - Ahora fluye con el scroll */}
          <div className="mt-4 pt-6 border-t border-gray-100 dark:border-zinc-800 flex flex-col gap-4 shrink-0 pb-4">
              <div className="flex flex-col gap-2">
                {/* Badge E2EE */}
                <div className="flex items-center gap-2 px-3 py-1.5 bg-green-500/10 border border-green-500/20 rounded-xl w-fit">
                   <div className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse"></div>
                   <span className="text-[9px] font-black text-green-600 dark:text-green-400 uppercase tracking-widest flex items-center gap-1"><Lock size={9} strokeWidth={3} /> E2EE ACTIVO</span>
                </div>
                
                {/* Badge Plan */}
                <div onClick={onOpenPricing} className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-xl px-4 py-3 text-white shadow-lg hover:scale-[1.02] active:scale-95 transition-all cursor-pointer relative overflow-hidden flex items-center justify-between">
                  <div className="relative z-10">
                    <span className="text-[9px] font-bold uppercase tracking-widest opacity-80 block leading-none">PLAN ACTUAL</span>
                    <p className="text-sm font-black uppercase tracking-tight">{currentUser.plan}</p>
                  </div>
                  <div className="relative z-10 text-right">
                    <span className="text-[8px] opacity-70 block">IA DISPONIBLE</span>
                    <p className="text-[10px] font-bold">{monthlyAILimit}</p>
                  </div>
                  <div className="absolute top-0 right-0 w-16 h-16 bg-white/10 blur-xl rounded-full"></div>
                </div>
              </div>

              {/* Perfil de Usuario */}
              <div className="flex items-center justify-between bg-gray-50 dark:bg-zinc-900 rounded-2xl p-3">
                  <div className="flex items-center gap-3 overflow-hidden">
                      <div className="w-8 h-8 rounded-full bg-orange-500 flex items-center justify-center text-white font-bold shrink-0">{currentUser.name[0]}</div>
                      <div className="min-w-0">
                          <p className="text-[11px] font-bold dark:text-white truncate">{currentUser.name}</p>
                          <p className="text-[9px] text-gray-400 truncate capitalize">{currentUser.email}</p>
                      </div>
                  </div>
                  <button onClick={onLogout} className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 rounded-lg transition-all active:scale-90"><LogOut size={16} /></button>
              </div>
          </div>

        </div>
      </aside>

      <CalendarEditModal 
        isOpen={!!editingCalendar} 
        onClose={() => setEditingCalendar(null)} 
        calendar={editingCalendar} 
        onSave={handleUpdateCalendar} 
        onDelete={handleDeleteCalendar}
        canDelete={calendars.length > 1}
      />
    </>
  );
};

export default Sidebar;
