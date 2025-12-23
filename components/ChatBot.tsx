
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  Send, X, Paperclip, Image as ImageIcon, Video, Mic, 
  Minimize2, Maximize2, StopCircle, CalendarCheck, Trash2, 
  CheckCircle2, Volume2, Loader2, Sparkles, User as UserIcon, Bot, MapPin, Clock, CalendarDays, XCircle, AlertTriangle, ArrowUp, Zap, Check
} from 'lucide-react';
import { format, addMinutes, subDays, addDays, isWithinInterval, isValid, startOfISOWeek, endOfISOWeek } from 'date-fns';
import parseISO from 'date-fns/parseISO';
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
  video?: string;
  isThinking?: boolean;
  eventDraft?: any; 
  selectedCalendarId?: string;
  actionTaken?: 'confirmed' | 'discarded';
  conflictWarning?: string; 
  limitReached?: boolean;
}

const ChatBot: React.FC<ChatBotProps> = ({ onAddEvent, calendars = [], events = [], currentUser, onOpenPricing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'video', data: string, mimeType: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  const weeklyUsage = useMemo(() => {
    const start = startOfISOWeek(new Date());
    const end = endOfISOWeek(new Date());
    return events.filter(e => e.createdByBot && isWithinInterval(new Date(e.start), { start, end })).length;
  }, [events]);

  const maxWeeklyEvents = useMemo(() => {
    if (currentUser.plan === 'unlimited') return Infinity;
    if (currentUser.plan === 'pro') return 200;
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
                text: `¡Hola ${currentUser.name}! Soy tu asistente. ¿Qué necesitas agendar hoy?`
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
    if ((!input.trim() && !attachment) || isLoading) return;

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
      image: attachment?.type === 'image' ? `data:${attachment.mimeType};base64,${attachment.data}` : undefined,
    };

    await appendMessage(userMessage);
    setInput('');
    setAttachment(null);
    setIsLoading(true);

    try {
      const currentDate = new Date().toISOString();
      const eventsContext = events.slice(-30).map(e => ({ title: e.title, start: e.start, end: e.end }));

      const createEventTool = {
        name: 'create_calendar_event',
        description: 'FINAL STEP ONLY. Create event draft.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            start: { type: Type.STRING },
            end: { type: Type.STRING },
            description: { type: Type.STRING },
            location: { type: Type.STRING },
            calendarName: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Escuela', 'Deporte', 'Trabajo', 'Salud', 'Social', 'Hogar', 'Otro'] },
            conflict_detected: { type: Type.BOOLEAN }
          },
          required: ['title', 'start', 'category']
        }
      };

      const systemInstruction = `Eres Family Plan IA. Usuario: ${currentUser.name} (Plan: ${currentUser.plan}). Contexto actual: ${JSON.stringify(eventsContext)}. Fecha base: ${currentDate}.`;

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
                  const eventData = { ...args, start: parseISO(args.start), end: args.end ? parseISO(args.end) : addMinutes(parseISO(args.start), 60), createdByBot: true };
                  await appendMessage({ id: Date.now().toString(), role: 'system', eventDraft: eventData });
              }
          }
      }
      if (text) await appendMessage({ id: Date.now().toString(), role: 'model', text });
    } catch (e) {
      await appendMessage({ id: Date.now().toString(), role: 'system', text: '❌ Error al procesar tu solicitud.' });
    } finally {
      setIsLoading(false);
    }
  };

  const handleConfirmDraft = async (msg: Message) => {
    // 1. Ejecutar la acción de agendar
    onAddEvent(msg.eventDraft);
    
    // 2. Marcar como confirmado localmente para cambiar el UI inmediatamente
    setMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionTaken: 'confirmed' } : m));
    
    // 3. Opcional: Agregar un mensaje de éxito de la IA para cerrar el flujo
    setTimeout(() => {
        appendMessage({
            id: Date.now().toString() + '_success',
            role: 'model',
            text: `¡Listo! He agendado **${msg.eventDraft.title}** para ti.`
        });
    }, 400);
  };

  const renderMessageContent = (msg: Message, index: number) => {
    if (msg.limitReached) {
        return (
            <div className="w-full p-4 bg-orange-50 dark:bg-orange-900/20 border border-orange-200 dark:border-orange-800/50 rounded-2xl flex flex-col items-center text-center gap-3 animate-scale-in">
                <div className="w-12 h-12 bg-orange-100 dark:bg-orange-900/40 rounded-full flex items-center justify-center text-orange-600">
                    <Zap size={24} fill="currentColor" />
                </div>
                <div className="space-y-1">
                    <h4 className="text-sm font-bold text-orange-900 dark:text-orange-200">Límite de IA alcanzado</h4>
                    <p className="text-xs text-orange-700 dark:text-orange-400">Has usado tus {maxWeeklyEvents} creaciones semanales del plan {currentUser.plan}.</p>
                </div>
                <button onClick={onOpenPricing} className="bg-orange-600 text-white px-4 py-2 rounded-xl text-xs font-bold shadow-lg shadow-orange-500/30 active:scale-95 transition-all">Mejorar mi plan</button>
            </div>
        );
    }

    if (msg.eventDraft) {
        // SI YA ESTÁ CONFIRMADO: Mostrar versión compacta de "Agendado"
        if (msg.actionTaken === 'confirmed') {
            return (
                <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-[20px] border border-green-100 dark:border-green-800/50 flex items-center gap-3 animate-fade-in shadow-sm">
                    <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center text-white shrink-0 shadow-lg shadow-green-500/30">
                        <Check size={16} strokeWidth={4} />
                    </div>
                    <div className="min-w-0">
                        <p className="text-xs font-bold text-green-800 dark:text-green-300">Evento agendado</p>
                        <p className="text-[10px] text-green-600 dark:text-green-500 truncate w-40">{msg.eventDraft.title}</p>
                    </div>
                </div>
            );
        }

        // SI NO ESTÁ CONFIRMADO: Mostrar borrador interactivo
        return (
            <div className="bg-white dark:bg-zinc-900 p-4 rounded-2xl border border-gray-100 dark:border-zinc-800 shadow-xl w-72 animate-scale-in">
                <div className="flex justify-between items-start mb-3">
                   <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest">Borrador IA</span>
                   <div className="w-2 h-2 rounded-full bg-blue-500 animate-pulse"></div>
                </div>
                <h4 className="font-bold text-gray-900 dark:text-white truncate">{msg.eventDraft.title}</h4>
                <p className="text-[11px] text-gray-500 mt-1 capitalize">{format(msg.eventDraft.start, "EEEE d MMMM, h:mm a", { locale: es })}</p>
                <div className="flex gap-2 mt-4">
                    <button 
                        onClick={() => setMessages(p => p.filter(m => m.id !== msg.id))} 
                        className="flex-1 py-2 text-xs font-bold bg-gray-100 dark:bg-zinc-800 rounded-lg hover:bg-gray-200 transition-colors"
                    >
                        No
                    </button>
                    <button 
                        onClick={() => handleConfirmDraft(msg)} 
                        className="flex-1 py-2 text-xs font-bold bg-blue-600 text-white rounded-lg hover:bg-blue-700 shadow-md active:scale-95 transition-all"
                    >
                        Agendar
                    </button>
                </div>
            </div>
        );
    }

    const isUser = msg.role === 'user';
    return (
        <div className={`px-4 py-2.5 rounded-[20px] shadow-sm text-sm leading-relaxed max-w-[85%] ${isUser ? 'bg-blue-600 text-white rounded-br-sm' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-sm'}`}>
            <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
        </div>
    );
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-6 right-6 z-50 w-16 h-16 rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <img src={BOT_AVATAR_URL} className="w-8 h-8 object-contain relative z-10" alt="IA" />
        {isLimitReached && <div className="absolute -top-1 -right-1 w-5 h-5 bg-orange-500 rounded-full flex items-center justify-center text-[8px] text-white font-black border-2 border-white dark:border-zinc-900 z-20">!</div>}
      </button>

      {isOpen && (
        <div className="fixed bottom-6 right-6 z-[100] w-[90vw] h-[75vh] md:w-[400px] md:h-[600px] bg-white/95 dark:bg-black/95 backdrop-blur-2xl rounded-[32px] border border-gray-200/50 dark:border-zinc-800 flex flex-col shadow-2xl animate-scale-in origin-bottom-right">
           <div className="p-4 border-b border-gray-100 dark:border-zinc-800 flex justify-between items-center bg-white/50 dark:bg-black/50 rounded-t-[32px]">
              <div className="flex items-center gap-3">
                 <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-900 flex items-center justify-center shadow-inner">
                    <img src={BOT_AVATAR_URL} className="w-6 h-6 object-contain" alt="Bot" />
                 </div>
                 <div>
                    <h3 className="text-sm font-bold dark:text-white">Asistente IA</h3>
                    <div className="flex items-center gap-1.5">
                       <span className="w-1.5 h-1.5 bg-green-500 rounded-full animate-pulse"></span>
                       <span className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">{weeklyUsage}/{maxWeeklyEvents} USADOS</span>
                    </div>
                 </div>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 bg-gray-50 dark:bg-zinc-800 rounded-full text-gray-500 hover:bg-gray-100 transition-colors"><X size={18} /></button>
           </div>

           <div className="flex-1 overflow-y-auto p-4 space-y-4 custom-scrollbar bg-white dark:bg-black">
              {messages.map((msg, idx) => (
                 <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                    {renderMessageContent(msg, idx)}
                 </div>
              ))}
              {isLoading && <div className="flex gap-1 p-3 bg-gray-50 dark:bg-zinc-900 rounded-full w-fit animate-pulse"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span></div>}
              <div ref={messagesEndRef}></div>
           </div>

           <div className="p-4 border-t border-gray-100 dark:border-zinc-800 bg-white/50 dark:bg-black/50 rounded-b-[32px]">
              <div className="flex items-center gap-2 bg-gray-100 dark:bg-zinc-900 rounded-2xl px-4 py-2 focus-within:ring-2 ring-blue-500/30 transition-all">
                 <textarea 
                   className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white py-1 resize-none max-h-24 h-8"
                   placeholder="Escribe un mensaje..."
                   value={input}
                   onChange={(e) => setInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())}
                 />
                 <button onClick={handleSend} disabled={isLoading} className="text-blue-600 active:scale-90 transition-transform"><ArrowUp size={22} /></button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
