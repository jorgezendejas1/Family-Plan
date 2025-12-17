
import React, { useState, useRef, useEffect } from 'react';
import { 
  Send, X, Paperclip, Image as ImageIcon, Video, Mic, 
  Minimize2, Maximize2, StopCircle, CalendarCheck, Trash2, 
  CheckCircle2, Volume2, Loader2, Sparkles, User, Bot, MapPin, Clock, CalendarDays, XCircle, AlertTriangle, ArrowUp
} from 'lucide-react';
import { format, addMinutes, subDays, addDays, isWithinInterval, isValid } from 'date-fns';
import parseISO from 'date-fns/parseISO';
import { es } from 'date-fns/locale';
import { CalendarConfig, CalendarEvent } from '../types';
import { dataService } from '../services/dataService'; 
import ReactMarkdown from 'react-markdown';
import { GoogleGenAI, Type } from "@google/genai";

// 3D Robot Avatar URL
const BOT_AVATAR_URL = "https://cdn-icons-png.flaticon.com/512/8943/8943377.png";

interface ChatBotProps {
  onAddEvent: (eventData: any) => void;
  calendars?: CalendarConfig[];
  events?: CalendarEvent[];
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
  conflictWarning?: string; // UI for conflicts
}

const Typewriter: React.FC<{ text: string; speed?: number; onComplete?: () => void }> = ({ text, speed = 10, onComplete }) => {
  const [displayedText, setDisplayedText] = useState('');
  const [isComplete, setIsComplete] = useState(false);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  
  useEffect(() => {
    setDisplayedText(''); 
    setIsComplete(false);
    
    // Clear any existing interval
    if (intervalRef.current) clearInterval(intervalRef.current);

    let i = 0;
    
    // Safety check: if text is huge, just show it all to avoid lag
    if (text.length > 500) {
        setDisplayedText(text);
        setIsComplete(true);
        if (onComplete) onComplete();
        return;
    }

    const startDelay = setTimeout(() => {
        intervalRef.current = setInterval(() => {
          if (i < text.length) {
            setDisplayedText(text.slice(0, i + 1));
            i++;
          } else {
            if (intervalRef.current) clearInterval(intervalRef.current);
            setIsComplete(true);
            if (onComplete) onComplete();
          }
        }, speed);
    }, 300);

    return () => {
        clearTimeout(startDelay);
        if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, [text, speed, onComplete]);

  return (
    <div className="relative">
      <ReactMarkdown>{displayedText}</ReactMarkdown>
      {!isComplete && (
        <span className="inline-block w-1.5 h-4 bg-current ml-0.5 align-middle animate-pulse rounded-full opacity-50"></span>
      )}
    </div>
  );
};

const ChatBot: React.FC<ChatBotProps> = ({ onAddEvent, calendars = [], events = [] }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isExpanded, setIsExpanded] = useState(false);
  const [input, setInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [attachment, setAttachment] = useState<{ type: 'image' | 'video', data: string, mimeType: string } | null>(null);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const [messages, setMessages] = useState<Message[]>([]);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  useEffect(() => {
    const loadHistory = async () => {
        const history = await dataService.getChatHistory();
        if (history && history.length > 0) {
            setMessages(history);
        } else {
            setMessages([{ 
                id: 'welcome', 
                role: 'model', 
                text: '¡Hola! Soy tu asistente. ¿Qué necesitas agendar hoy?'
            }]);
        }
        setHistoryLoaded(true);
    };
    if (isOpen && !historyLoaded) {
        loadHistory();
    }
  }, [isOpen, historyLoaded]);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isOpen, isLoading, isExpanded]);

  const handleClearHistory = async () => {
    if (!window.confirm(`¿Borrar historial?`)) return;
    const welcomeMsg: Message = { 
        id: 'welcome_' + Date.now(), 
        role: 'model', 
        text: `Chat reiniciado.`
    };
    setMessages([welcomeMsg]);
    try {
        await dataService.clearChatHistory(); 
    } catch (e) {
        console.error("Error clearing history from DB", e);
    }
  };

  const appendMessage = async (msg: Message) => {
      setMessages(prev => [...prev, msg]);
      await dataService.saveChatMessage(msg);
  };

  const handleSend = async () => {
    if ((!input.trim() && !attachment) || isLoading) return;

    // Guideline: Create GoogleGenAI right before making the call
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
      const currentDate = new Date();
      const currentDateIso = currentDate.toISOString();
      
      // OPTIMIZATION: Reduce context window to 30 days instead of 45 to save tokens/memory
      const contextStart = subDays(currentDate, 1);
      const contextEnd = addDays(currentDate, 30);
      
      const relevantEvents = events.filter(e => {
          if (!e.start) return false;
          return isWithinInterval(e.start, { start: contextStart, end: contextEnd });
      });

      const eventsContext = relevantEvents.map(e => ({
          title: e.title,
          start: e.start,
          end: e.end,
          category: e.category
      }));

      const createEventTool = {
        name: 'create_calendar_event',
        description: 'FINAL STEP ONLY. Create event draft.',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            start: { type: Type.STRING, description: "ISO 8601" },
            end: { type: Type.STRING },
            description: { type: Type.STRING },
            location: { type: Type.STRING },
            calendarName: { type: Type.STRING },
            isBirthday: { type: Type.BOOLEAN },
            recurrence: { type: Type.STRING },
            reminderMinutes: { type: Type.ARRAY, items: { type: Type.NUMBER } },
            conflict_detected: { type: Type.BOOLEAN },
            conflict_message: { type: Type.STRING },
            category: {
              type: Type.STRING,
              enum: ['Escuela', 'Deporte', 'Trabajo', 'Salud', 'Social', 'Hogar', 'Otro']
            }
          },
          required: ['title', 'start', 'category', 'conflict_detected']
        }
      };

      const systemInstruction = `
        Eres Family Plan IA.
        **CONTEXTO:** ${JSON.stringify(eventsContext)}
        **REGLAS:**
        1. Detecta conflictos.
        2. Fecha base hoy: ${currentDateIso}.
        3. Sé breve y directo, estilo iMessage.
        4. Si el usuario NO especifica una fecha u hora, NO llames a la herramienta create_calendar_event. Pregunta por la fecha.
      `;

      const apiHistory = messages
        .filter(m => (m.role === 'user' || m.role === 'model') && !m.eventDraft && m.id !== userMessage.id)
        .slice(-8) // Reduced history window for lighter payload
        .map(m => ({ role: m.role, parts: [{ text: m.text || '' }] }));

      const currentContentParts: any[] = [];
      if (userMessage.text) currentContentParts.push({ text: userMessage.text });
      if (userMessage.image) {
          const base64Data = userMessage.image.split(',')[1]; 
          const mimeType = userMessage.image.split(';')[0].split(':')[1];
          currentContentParts.push({ inlineData: { mimeType, data: base64Data } });
      }

      // Guideline: Use gemini-3-pro-preview for complex reasoning tasks
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [
            ...apiHistory, 
            { role: 'user', parts: currentContentParts }
        ],
        config: { 
            systemInstruction, 
            tools: [{ functionDeclarations: [createEventTool] }] 
        }
      });

      // Guideline: Extract function calls from property
      const toolCalls = response.functionCalls;
      const text = response.text;

      if (toolCalls && toolCalls.length > 0) {
          for (const call of toolCalls) {
              if (call.name === 'create_calendar_event') {
                  const args = call.args as any;
                  
                  if (args.conflict_detected && args.conflict_message) {
                      const warningMsg: Message = {
                          id: Date.now().toString() + '_conflict',
                          role: 'system',
                          text: `⚠️ **Conflicto:** ${args.conflict_message}`,
                          conflictWarning: args.conflict_message
                      };
                      await appendMessage(warningMsg);
                  }

                  // === DATE VALIDATION LOGIC START ===
                  if (!args.start) {
                      await appendMessage({
                         id: Date.now().toString() + '_err_no_date',
                         role: 'model',
                         text: "He entendido qué quieres hacer, pero necesito saber la fecha y hora. ¿Cuándo será el evento?"
                      });
                      continue;
                  }

                  const startDate = parseISO(args.start);

                  if (!isValid(startDate)) {
                       await appendMessage({
                         id: Date.now().toString() + '_err_invalid_date',
                         role: 'model',
                         text: "La fecha proporcionada no es válida o no pude entenderla. Intenta con un formato como 'Mañana a las 5pm' o 'El 20 de octubre'."
                      });
                      continue;
                  }
                  // === DATE VALIDATION LOGIC END ===

                  let reminders = [15];
                  if (Array.isArray(args.reminderMinutes)) {
                      reminders = args.reminderMinutes;
                  } else if (typeof args.reminderMinutes === 'number') {
                      reminders = [args.reminderMinutes];
                  }

                  const endDate = args.end ? parseISO(args.end) : addMinutes(startDate, 60);

                  const eventData = {
                      title: args.title || 'Nuevo Evento',
                      start: startDate,
                      end: endDate,
                      description: args.description,
                      location: args.location,
                      calendarId: calendars.find(c => c.label.toLowerCase() === (args.calendarName || '').toLowerCase())?.id || calendars[0]?.id,
                      isBirthday: args.isBirthday,
                      recurrence: args.recurrence || 'none',
                      reminderMinutes: reminders,
                      category: args.category 
                  };

                  const systemMsg: Message = {
                      id: Date.now().toString() + Math.random().toString(), 
                      role: 'system',
                      text: `Evento preparado:`,
                      eventDraft: eventData,
                      selectedCalendarId: eventData.calendarId
                  };
                  await appendMessage(systemMsg);
              }
          }
      }

      if (text) {
         await appendMessage({
            id: Date.now().toString() + '_response',
            role: 'model',
            text: text
         });
      }

    } catch (error) {
      console.error("Gemini Error:", error);
      await appendMessage({
        id: Date.now().toString(),
        role: 'system',
        text: '❌ Error de conexión. Intenta de nuevo.'
      });
    } finally {
      setIsLoading(false);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onloadend = () => {
      const base64String = reader.result as string;
      const mimeType = base64String.split(';')[0].split(':')[1];
      const data = base64String.split(',')[1];
      if (file.type.startsWith('image/')) setAttachment({ type: 'image', data, mimeType });
    };
    reader.readAsDataURL(file);
  };

  const renderMessageContent = (msg: Message, index: number) => {
    const isLatestModelMessage = index === messages.length - 1 && msg.role === 'model';

    if (msg.conflictWarning) {
        return (
            <div className="w-full mt-2 p-3 bg-amber-100 dark:bg-amber-900/40 rounded-2xl flex items-start gap-3 animate-fade-in-up">
                <AlertTriangle className="text-amber-600 dark:text-amber-500 shrink-0 mt-0.5" size={18} />
                <div className="text-sm text-amber-900 dark:text-amber-100 font-medium leading-snug">
                    {msg.conflictWarning}
                </div>
            </div>
        );
    }

    if (msg.eventDraft) {
        const cal = calendars.find(c => c.id === msg.eventDraft.calendarId);
        
        return (
            <div className="w-[280px] mt-2 animate-scale-in">
                {msg.actionTaken === 'confirmed' ? (
                    <div className="flex flex-col items-center justify-center p-3 bg-green-50 dark:bg-green-900/30 rounded-2xl border border-green-100 dark:border-green-800/50">
                        <CheckCircle2 className="text-green-600 dark:text-green-400 mb-1" size={20} />
                        <p className="text-xs font-bold text-green-700 dark:text-green-300">Agendado</p>
                    </div>
                ) : msg.actionTaken === 'discarded' ? (
                    <div className="flex flex-col items-center justify-center p-3 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                        <XCircle className="text-gray-400 mb-1" size={20} />
                        <p className="text-xs font-bold text-gray-500">Descartado</p>
                    </div>
                ) : (
                    <div className="bg-white dark:bg-[#1C1C1E] rounded-2xl shadow-lg overflow-hidden border border-gray-100 dark:border-gray-800">
                        <div className="p-4 relative">
                            {/* Apple Wallet Style Header */}
                            <div className="flex items-center justify-between mb-3">
                                <span className="text-[10px] font-bold text-gray-400 uppercase tracking-wider">Borrador</span>
                                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cal?.color || '#3B82F6' }}></div>
                            </div>
                            
                            <h3 className="font-bold text-lg text-black dark:text-white leading-tight mb-3">
                                {msg.eventDraft.title}
                            </h3>

                            <div className="space-y-2">
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <CalendarDays size={14} className="text-gray-400" />
                                    <span className="capitalize">{format(new Date(msg.eventDraft.start), "EEE d MMM", { locale: es })}</span>
                                </div>
                                <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-300">
                                    <Clock size={14} className="text-gray-400" />
                                    <span>{format(new Date(msg.eventDraft.start), "h:mm a")} - {format(new Date(msg.eventDraft.end), "h:mm a")}</span>
                                </div>
                            </div>
                        </div>
                        <div className="grid grid-cols-2 border-t border-gray-100 dark:border-gray-700 divide-x divide-gray-100 dark:divide-gray-700">
                            <button 
                                onClick={() => {
                                    const updated = { ...msg, actionTaken: 'discarded' as const };
                                    setMessages(p => p.map(m => m.id === msg.id ? updated : m));
                                    dataService.saveChatMessage(updated);
                                }}
                                className="py-3 text-sm font-medium text-red-500 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors"
                            >
                                No
                            </button>
                            <button 
                                onClick={() => {
                                    onAddEvent(msg.eventDraft);
                                    const updated = { ...msg, actionTaken: 'confirmed' as const };
                                    setMessages(p => p.map(m => m.id === msg.id ? updated : m));
                                    dataService.saveChatMessage(updated);
                                }}
                                className="py-3 text-sm font-bold text-blue-600 dark:text-blue-400 hover:bg-blue-50 dark:hover:bg-blue-900/20 transition-colors"
                            >
                                Agendar
                            </button>
                        </div>
                    </div>
                )}
            </div>
        );
    }

    // iMessage Bubbles
    const isUser = msg.role === 'user';
    const bubbleClass = isUser 
        ? "bg-ios-blue text-white rounded-[20px] rounded-br-[4px] self-end" // Blue for User
        : "bg-ios-gray dark:bg-ios-darkGray text-black dark:text-white rounded-[20px] rounded-bl-[4px] self-start"; // Gray for Bot

    return (
      <div className={`relative max-w-[80%] px-4 py-2.5 text-[15px] shadow-sm leading-relaxed transition-all animate-fade-in-up ${bubbleClass}`}>
          {msg.role !== 'system' && (
              <div className="break-words prose-p:my-0 prose-ul:my-0">
                  {isLatestModelMessage ? <Typewriter text={msg.text || ''} /> : <ReactMarkdown>{msg.text || ''}</ReactMarkdown>}
              </div>
          )}
      </div>
    );
  };

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        className="fixed bottom-6 right-6 z-50 w-14 h-14 rounded-full shadow-2xl flex items-center justify-center border border-gray-200 dark:border-gray-700 bg-white dark:bg-[#1C1C1E] transition-all duration-300 hover:scale-105 active:scale-95 group"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/20 to-purple-500/20 rounded-full blur-md opacity-0 group-hover:opacity-100 transition-opacity"></div>
        <img src={BOT_AVATAR_URL} alt="IA" className="w-8 h-8 object-contain" />
      </button>
    );
  }

  return (
    <div className={`fixed z-50 bg-white/95 dark:bg-black/95 backdrop-blur-2xl shadow-2xl rounded-[32px] border border-gray-200/50 dark:border-gray-800/50 flex flex-col transition-all duration-500 cubic-bezier(0.32, 0.72, 0, 1) overflow-hidden ${isExpanded ? 'inset-0 md:inset-10 rounded-[0px] md:rounded-[32px]' : 'bottom-6 right-6 w-[92vw] h-[75vh] md:w-[400px] md:h-[650px]'}`}>
      
      {/* iOS Style Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-white/80 dark:bg-black/80 backdrop-blur-xl border-b border-gray-200/50 dark:border-gray-800/50 shrink-0 sticky top-0 z-20">
        <div className="w-8"></div> {/* Spacer for balance */}
        <div className="flex flex-col items-center">
            <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center mb-1 shadow-inner">
                <img src={BOT_AVATAR_URL} alt="Bot" className="w-6 h-6 object-contain" />
            </div>
            <span className="text-[11px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wider">Asistente</span>
        </div>
        <div className="w-8 flex justify-end">
            <button onClick={() => setIsOpen(false)} className="p-2 text-blue-600 dark:text-blue-400 font-bold text-sm bg-gray-100 dark:bg-gray-800 rounded-full w-8 h-8 flex items-center justify-center active:scale-90 transition-transform">
                <X size={16} strokeWidth={2.5} />
            </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 bg-white dark:bg-black custom-scrollbar">
         {messages.map((msg, index) => (
             <div key={msg.id} className={`flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                 {renderMessageContent(msg, index)}
                 {/* Timestamp simulation */}
                 <span className="text-[10px] text-gray-300 dark:text-gray-600 mt-1 px-1">
                    {format(new Date(), 'h:mm a')}
                 </span>
             </div>
         ))}
         {isLoading && (
             <div className="flex items-end gap-2">
                 <div className="w-6 h-6 rounded-full bg-gray-200 dark:bg-gray-800 flex items-center justify-center shrink-0">
                     <Bot size={14} className="text-gray-500" />
                 </div>
                 <div className="bg-ios-gray dark:bg-ios-darkGray rounded-[20px] rounded-bl-[4px] px-4 py-3 flex gap-1">
                     <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span>
                     <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></span>
                     <span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></span>
                 </div>
             </div>
         )}
         <div ref={messagesEndRef} />
      </div>

      {/* iMessage Input Area */}
      <div className="p-3 bg-white/90 dark:bg-black/90 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 shrink-0 safe-area-pb">
         {attachment && (
             <div className="flex items-center gap-3 mb-3 p-2 bg-gray-100 dark:bg-gray-900 rounded-xl mx-1">
                 <div className="w-10 h-10 bg-gray-200 dark:bg-gray-800 rounded-lg flex items-center justify-center">
                    <ImageIcon size={18} className="text-gray-500" />
                 </div>
                 <div className="flex-1 min-w-0">
                    <span className="text-xs font-semibold text-gray-700 dark:text-gray-200 truncate block">Imagen adjunta</span>
                    <span className="text-[10px] text-gray-400">Listo para enviar</span>
                 </div>
                 <button onClick={() => setAttachment(null)} className="p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200"><X size={14}/></button>
             </div>
         )}
         <div className="flex items-end gap-3">
             <button onClick={() => fileInputRef.current?.click()} className="p-2 text-gray-400 hover:text-blue-500 transition-colors h-[40px] flex items-center justify-center">
                 <Paperclip size={22} />
             </button>
             <input type="file" ref={fileInputRef} className="hidden" onChange={handleFileSelect} accept="image/*" />
             
             <div className="flex-1 min-h-[38px] border border-gray-300 dark:border-gray-700 rounded-[20px] bg-white dark:bg-black flex items-center px-4 focus-within:border-blue-500 transition-colors">
                 <textarea 
                    value={input} 
                    onChange={(e) => setInput(e.target.value)} 
                    onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), handleSend())} 
                    placeholder="iMessage" 
                    className="flex-1 bg-transparent border-none outline-none resize-none max-h-24 py-2 text-[16px] leading-tight text-gray-900 dark:text-white placeholder-gray-400" 
                    rows={1}
                    style={{ minHeight: '24px' }} 
                 />
             </div>

             <button 
                onClick={handleSend} 
                disabled={(!input.trim() && !attachment) || isLoading} 
                className={`w-[34px] h-[34px] rounded-full flex items-center justify-center mb-0.5 transition-all ${
                    (!input.trim() && !attachment) 
                        ? 'bg-gray-200 dark:bg-gray-700 text-gray-400' 
                        : 'bg-ios-blue text-white shadow-md active:scale-90'
                }`}
             >
                 <ArrowUp size={18} strokeWidth={3} />
             </button>
         </div>
      </div>
    </div>
  );
};

export default ChatBot;
