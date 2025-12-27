
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Check, Bot, Zap, ArrowUp, CalendarDays, Edit3, Mic, ChevronDown
} from 'lucide-react';
import { format, addMinutes, isWithinInterval, startOfISOWeek, endOfISOWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarConfig, CalendarEvent, User } from '../types';
import { dataService } from '../services/dataService'; 
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Type } from "@google/genai";

const BOT_AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/8943/8943377.png";

interface ChatBotProps {
  onAddEvent: (eventData: any) => void;
  calendars?: CalendarConfig[];
  events?: CalendarEvent[];
  currentUser: User;
  onOpenPricing: () => void;
}

interface Message {
  id: string;
  role: 'user' | 'model' | 'system';
  text?: string;
  image?: string;
  isThinking?: boolean;
  eventDraft?: any; 
  selectedCalendarId?: string; 
  actionTaken?: 'confirmed' | 'discarded';
  limitReached?: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ onAddEvent, calendars = [], events = [], currentUser, onOpenPricing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Swipe logic state
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const weeklyUsage = useMemo(() => {
    const start = startOfISOWeek(new Date());
    const end = endOfISOWeek(new Date());
    return events.filter(e => e.createdByBot && isWithinInterval(new Date(e.start), { start, end })).length;
  }, [events]);

  const maxWeeklyEvents = useMemo(() => {
    if (currentUser.plan === 'unlimited' || currentUser.plan === 'admin') return Infinity;
    if (currentUser.plan === 'pro' || currentUser.plan === 'casa') return 200;
    if (currentUser.plan === 'basic') return 40;
    return 10;
  }, [currentUser]);

  const isLimitReached = weeklyUsage >= maxWeeklyEvents;

  useEffect(() => {
    const loadHistory = async () => {
        const history = await dataService.getChatHistory();
        if (history && history.length > 0) {
            setMessages(history);
        } else {
            setMessages([{ 
                id: 'welcome', 
                role: 'model', 
                text: `¡Hola Familia! Soy vuestro asistente. ¿Qué plan o tarea necesitáis agendar hoy para alguno de los miembros?`
            }]);
        }
        setHistoryLoaded(true);
    };
    if (isOpen && !historyLoaded) {
        loadHistory();
    }
  }, [isOpen, historyLoaded, currentUser]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading]);

  const appendMessage = async (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      await dataService.saveChatMessage(msg);
  };

  const handleSend = async () => {
    if (!input.trim() || isLoading) return;

    if (isLimitReached) {
        await appendMessage({
            id: Date.now().toString() + '_limit',
            role: 'system',
            limitReached: true,
            text: 'Has alcanzado tu límite semanal de eventos creados por IA.'
        });
        setInput('');
        return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      text: input,
    };

    await appendMessage(userMessage);
    setInput('');
    setIsLoading(true);

    try {
      const currentDate = new Date().toISOString();
      const eventsContext = events.slice(-30).map(e => ({ title: e.title, start: e.start, end: e.end }));

      const createEventTool = {
        name: 'create_calendar_event',
        description: 'FINAL STEP ONLY. Create event or task draft.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            start: { type: Type.STRING },
            end: { type: Type.STRING },
            description: { type: Type.STRING },
            location: { type: Type.STRING },
            calendarName: { type: Type.STRING, description: 'Sugerencia de miembro de la familia (ej: Mama, Papa, Hijo, Hija)' },
            category: { type: Type.STRING, enum: ['Escuela', 'Deporte', 'Trabajo', 'Salud', 'Social', 'Hogar', 'Otro'] },
            isTask: { type: Type.BOOLEAN, description: 'True si es una tarea pendiente, False si es un evento con hora.' }
          },
          required: ['title', 'start', 'category']
        }
      };

      const systemInstruction = `
        ERES: El asistente inteligente de "Family Plan". 
        VISIÓN: Una familia usa una sola cuenta. Tu trabajo es organizar a todos los miembros.
        CONTEXTO FAMILIAR: ${JSON.stringify(eventsContext)}. 
        FECHA ACTUAL: ${currentDate}.
        MIEMBROS DISPONIBLES (Calendarios): ${calendars.map(c => c.label).join(', ')}.
        
        REGLAS:
        1. Si el usuario menciona a un miembro (ej: "Papá"), sugiere el calendario correspondiente.
        2. Puedes crear tanto eventos (citas con hora) como tareas (pendientes).
        3. Sé amable, eficiente y conciso. Eres parte de la familia.
      `;

      const apiHistory = messages.filter(m => m.role !== 'system' && !m.eventDraft).slice(-10).map(m => ({ role: m.role, parts: [{ text: m.text || '' }] }));

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [...apiHistory, { role: 'user', parts: [{ text: userMessage.text || '' }] }],
        config: { systemInstruction, tools: [{ functionDeclarations: [createEventTool] }] }
      });

      const toolCalls = response.functionCalls;
      const text = response.text;

      if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
              if (call.name === 'create_calendar_event') {
                  const args = call.args as any;
                  
                  let suggestedId = calendars[0]?.id || 'default';
                  if (args.calendarName) {
                      const found = calendars.find(c => c.label.toLowerCase().includes(args.calendarName.toLowerCase()));
                      if (found) suggestedId = found.id;
                  }

                  const eventData = { 
                    ...args, 
                    start: parseISO(args.start), 
                    end: args.end ? parseISO(args.end) : addMinutes(parseISO(args.start), 60), 
                    createdByBot: true 
                  };
                  
                  await appendMessage({ 
                    id: Date.now().toString(), 
                    role: 'system', 
                    eventDraft: eventData,
                    selectedCalendarId: suggestedId 
                  });
              }
          }
      }
      if (text) await appendMessage({ id: Date.now().toString(), role: 'model', text });
    } catch (e) {
      await appendMessage({ id: Date.now().toString(), role: 'system', text: '❌ Error al procesar tu solicitud familiar.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDraft = async (msg: Message) => {
    const finalEvent = {
        ...msg.eventDraft,
        calendarId: msg.selectedCalendarId
    };
    
    onAddEvent(finalEvent);
    
    const calLabel = calendars.find(c => c.id === msg.selectedCalendarId)?.label || 'Familiar';
    
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionTaken: 'confirmed' } : m));
    
    setTimeout(() => {
        appendMessage({
            id: Date.now().toString() + '_success',
            role: 'model',
            text: `¡Listo! He agendado **${msg.eventDraft.title}** para **${calLabel}**.`
        });
    }, 400);
  };

  const changeDraftCalendar = (msgId: string, calId: string) => {
    setMessages(prev => prev.map(m => m.id === msgId ? { ...m, selectedCalendarId: calId } : m));
  };

  // Swipe handlers
  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientY);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientY);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchEnd - touchStart;
    const isSwipeDown = distance > 100;
    if (isSwipeDown) {
      setIsOpen(false);
    }
  };

  const renderMessageContent = (msg: Message) => {
    if (msg.limitReached) {
        return (
            <div className="w-full p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl flex flex-col items-center text-center gap-3 animate-scale-in">
                <Zap size={24} className="text-orange-600" fill="currentColor" />
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">Límite de IA alcanzado</h4>
                    <p className="text-xs text-orange-700 dark:text-orange-400">Has usado tus creaciones semanales para el plan {currentUser.plan}.</p>
                </div>
                <button onClick={onOpenPricing} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg active:scale-95 transition-all">Mejorar mi plan</button>
            </div>
        );
    }

    if (msg.eventDraft) {
        if (msg.actionTaken === 'confirmed') {
            return (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-[20px] border border-green-100 dark:border-green-800/50 flex items-center gap-3 animate-fade-in shadow-sm">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0">
                        <Check size={16} strokeWidth={4} />
                    </div>
                    <p className="text-xs font-bold text-green-800 dark:text-green-300">¡Agendado!</p>
                </div>
            );
        }

        return (
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl w-full max-w-[320px] animate-scale-in flex flex-col gap-4">
                <div className="flex justify-between items-start">
                   <div className="flex flex-col">
                        <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Borrador IA</span>
                        <h4 className="font-bold text-gray-900 dark:text-white truncate text-lg mt-1">{msg.eventDraft.title}</h4>
                   </div>
                   <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/30 flex items-center justify-center text-blue-600">
                        <CalendarDays size={18} />
                   </div>
                </div>
                
                <div className="space-y-2">
                    <div className="flex items-center gap-2 text-xs text-gray-500">
                        <span className="capitalize">{format(msg.eventDraft.start, "EEEE d MMMM", { locale: es })}</span>
                        <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                        <span>{format(msg.eventDraft.start, "h:mm a")}</span>
                    </div>
                    
                    <div className="pt-2 border-t border-gray-50 dark:border-zinc-800">
                        <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2 px-1">¿Para quién es?</p>
                        <div className="flex gap-2 overflow-x-auto pb-2 custom-scrollbar -mx-1 px-1">
                            {calendars.map(cal => {
                                const isSelected = msg.selectedCalendarId === cal.id;
                                return (
                                    <button
                                        key={cal.id}
                                        onClick={() => changeDraftCalendar(msg.id, cal.id)}
                                        className={`px-3 py-1.5 rounded-full border text-[11px] font-bold transition-all shrink-0 flex items-center gap-2 ${
                                            isSelected 
                                            ? 'bg-blue-600 text-white border-blue-600 shadow-md scale-105' 
                                            : 'bg-gray-50 dark:bg-zinc-800 border-gray-200 dark:border-zinc-700 text-gray-500 hover:border-blue-400'
                                        }`}
                                    >
                                        {!isSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cal.color }}></div>}
                                        {cal.label}
                                    </button>
                                );
                            })}
                        </div>
                    </div>
                </div>

                <div className="flex gap-2">
                    <button 
                        onClick={() => setMessages(p => p.filter(m => m.id !== msg.id))} 
                        className="flex-1 py-3 text-xs font-bold bg-gray-100 dark:bg-zinc-800 rounded-2xl text-gray-600 hover:bg-gray-200 transition-colors"
                    >
                        Borrar
                    </button>
                    <button 
                        onClick={() => handleConfirmDraft(msg)} 
                        className="flex-1 py-3 text-xs font-bold bg-blue-600 text-white rounded-2xl hover:bg-blue-700 shadow-lg active:scale-95 transition-all"
                    >
                        Confirmar
                    </button>
                </div>
            </div>
        );
    }

    const isUser = msg.role === 'user';
    return (
        <div className={`px-4 py-2.5 rounded-[22px] shadow-sm text-sm leading-relaxed max-w-[85%] ${isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
            <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
        </div>
    );
  };

  return (
    <>
      {/* FAB SECUNDARIO IA - Movido a bottom-24 */}
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <img src={BOT_AVATAR_URL} className="w-8 h-8 object-contain relative z-10" alt="IA" />
        {isLimitReached && <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[8px] text-white font-black border-2 border-white dark:border-zinc-900 z-20">!</div>}
      </button>

      {isOpen && (
        <div 
          className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[100] w-full h-full md:w-[400px] md:h-[600px] bg-white dark:bg-black md:bg-white/95 md:dark:bg-black/95 backdrop-blur-2xl md:rounded-[32px] md:border border-gray-200/50 dark:border-zinc-800 flex flex-col shadow-2xl animate-fade-in md:animate-scale-in origin-bottom-right"
          onTouchStart={onTouchStart}
          onTouchMove={onTouchMove}
          onTouchEnd={onTouchEnd}
        >
           {/* Handle visual para swipe down en móvil */}
           <div className="w-full flex justify-center pt-2 md:hidden">
              <div className="w-12 h-1.5 bg-gray-200 dark:bg-gray-800 rounded-full"></div>
           </div>

           <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-black/50 md:rounded-t-[32px]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center">
                    <img src={BOT_AVATAR_URL} className="w-6 h-6 object-contain" alt="Bot" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold dark:text-white">IA Familiar</h3>
                    <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{weeklyUsage}/{maxWeeklyEvents === Infinity ? '∞' : maxWeeklyEvents} IA</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full text-gray-500 hover:bg-gray-100 transition-colors active:scale-90"><X size={18} /></button>
           </div>

           {/* Mensajes arriba */}
           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-black">
              {messages.map((msg) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {renderMessageContent(msg)}
                 </div>
              ))}
              {isLoading && <div className="flex gap-1 p-3 bg-gray-50 dark:bg-zinc-900 rounded-full w-fit animate-pulse"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span></div>}
              <div ref={messagesEndRef}></div>
           </div>

           {/* Input abajo con Safe Area en móvil */}
           <div className="p-4 pb-[calc(env(safe-area-inset-bottom,0px)+1rem)] border-t border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-black/50 md:rounded-b-[32px]">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded-2xl px-4 py-2 focus-within:ring-2 ring-blue-500/30 transition-all">
                 <textarea 
                   className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white py-1 resize-none h-10 max-h-24"
                   placeholder="Escribe un mensaje..."
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                 />
                 <button onClick={handleSend} disabled={isLoading} className="text-blue-600 p-2 bg-white dark:bg-zinc-800 rounded-xl shadow-sm active:scale-90 transition-transform"><ArrowUp size={20} strokeWidth={3} /></button>
              </div>
              <div className="flex items-center justify-center gap-2 mt-3 md:hidden">
                 <button onClick={() => setIsOpen(false)} className="text-[10px] font-bold text-gray-400 flex items-center gap-1 uppercase tracking-widest">
                    <ChevronDown size={12} /> Desliza para cerrar
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
