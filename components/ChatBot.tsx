
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Check, Bot, Zap, ArrowUp, CalendarDays, Edit3, Mic, ChevronDown, MessageSquare, Sparkles, AtSign
} from 'lucide-react';
import { format, addMinutes, isWithinInterval, startOfISOWeek, endOfISOWeek, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarConfig, CalendarEvent, User, FamilyChatMessage } from '../types';
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
  const [activeTab, setActiveTab] = useState<'family' | 'ai'>('family');
  const [aiInput, setAiInput] = useState('');
  const [familyInput, setFamilyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const familyMessagesEndRef = useRef<HTMLDivElement>(null);

  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [familyMessages, setFamilyMessages] = useState<FamilyChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);

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

  // Sync family messages every 5 seconds
  useEffect(() => {
    const fetchFamilyMessages = async () => {
      const msgs = await dataService.getFamilyMessages();
      if (msgs.length > familyMessages.length) {
        if (!isOpen || activeTab !== 'family') {
          setUnreadCount(prev => prev + (msgs.length - familyMessages.length));
        }
      }
      setFamilyMessages(msgs);
    };

    fetchFamilyMessages();
    const interval = setInterval(fetchFamilyMessages, 5000);
    return () => clearInterval(interval);
  }, [familyMessages.length, isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'family') {
      setUnreadCount(0);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    const loadAIHistory = async () => {
        const history = await dataService.getChatHistory();
        if (history && history.length > 0) {
            setAiMessages(history);
        } else {
            setAiMessages([{ 
                id: 'welcome_ai', 
                role: 'model', 
                text: `Indique evento o tarea a agendar.`
            }]);
        }
        setHistoryLoaded(true);
    };
    if (isOpen && activeTab === 'ai' && !historyLoaded) {
        loadAIHistory();
    }
  }, [isOpen, activeTab, historyLoaded]);

  useEffect(() => {
    if (activeTab === 'ai') messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    else familyMessagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, familyMessages, activeTab, isOpen]);

  const handleSendFamily = async () => {
    if (!familyInput.trim()) return;
    
    // Extract mentions
    const mentions = calendars
      .filter(c => familyInput.toLowerCase().includes(`@${c.label.toLowerCase()}`))
      .map(c => c.label);

    const newMsg = await dataService.sendFamilyMessage({
      sender_label: currentUser.name,
      content: familyInput,
      mentions
    });

    if (newMsg) {
      setFamilyMessages(prev => [...prev, newMsg]);
      setFamilyInput('');
    }
  };

  const handleSendAI = async () => {
    const userText = aiInput.trim();
    if (!userText || isLoading) return;

    if (isLimitReached) {
        setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', limitReached: true }]);
        setAiInput('');
        return;
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    const userMessage: Message = { id: Date.now().toString(), role: 'user', text: userText };

    setAiMessages(prev => [...prev, userMessage]);
    setAiInput('');
    setIsLoading(true);

    try {
      const systemInstruction = `
        ERES: El asistente de creación de eventos de “Family Plan”.
        ROL ÚNICO: Solo ayudas a agendar. Sin conversación general.
        REGLAS:
        1. Devuelve BORRADOR estructurado mediante 'create_calendar_event'.
        2. Pregunta: “¿Lo creo así?”.
        3. Tono: Corto, eficiente, sin emojis.
        FECHA ACTUAL: ${new Date().toISOString()}.
      `;

      const createEventTool = {
        name: 'create_calendar_event',
        parameters: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            start: { type: Type.STRING },
            calendarName: { type: Type.STRING },
            category: { type: Type.STRING, enum: ['Escuela', 'Deporte', 'Trabajo', 'Salud', 'Social', 'Hogar', 'Otro'] },
            isTask: { type: Type.BOOLEAN }
          },
          required: ['title', 'start', 'category']
        }
      };

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: aiMessages.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.text || '' }] })).concat({ role: 'user', parts: [{ text: userText }] }),
        config: { systemInstruction, tools: [{ functionDeclarations: [createEventTool] }] }
      });

      const toolCalls = response.functionCalls;
      if (toolCalls && toolCalls.length > 0) {
          const args = toolCalls[0].args as any;
          const foundCal = calendars.find(c => c.label.toLowerCase().includes(args.calendarName?.toLowerCase()));
          const eventDraft = { ...args, start: parseISO(args.start), createdByBot: true };
          
          setAiMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'system', 
            eventDraft, 
            selectedCalendarId: foundCal?.id || calendars[0].id 
          }]);
      }
      if (response.text) {
          setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text.trim() }]);
      }
    } catch (e) {
      setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFamilyMessage = (msg: FamilyChatMessage) => {
    const isMe = msg.sender_label === currentUser.name;
    
    // Highlight mentions logic
    let content: any = msg.content;
    calendars.forEach(cal => {
       const regex = new RegExp(`@${cal.label}`, 'gi');
       if (regex.test(content)) {
          content = content.split(regex).reduce((prev: any, current: any, i: number) => {
             if (i === 0) return [current];
             return [...prev, <span key={i} className="font-black px-1 rounded mx-0.5" style={{ backgroundColor: `${cal.color}20`, color: cal.color }}>@{cal.label}</span>, current];
          }, []);
       }
    });

    return (
      <div className={`flex flex-col mb-4 ${isMe ? 'items-end' : 'items-start'}`}>
        {!isMe && <span className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase tracking-widest">{msg.sender_label}</span>}
        <div className={`px-4 py-2.5 rounded-[20px] text-sm shadow-sm ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
          {content}
        </div>
        <span className="text-[9px] text-gray-300 mt-1 mx-1">{format(new Date(msg.created_at), 'HH:mm')}</span>
      </div>
    );
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group"
      >
        <MessageSquare size={28} className="text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-zinc-900 animate-bounce">
            {unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 md:bottom-6 md:right-6 md:left-auto z-[100] w-full h-[70vh] md:w-[420px] md:h-[650px] bg-white/95 dark:bg-black/95 backdrop-blur-3xl md:rounded-[40px] rounded-t-[40px] border-t md:border border-gray-200/50 dark:border-zinc-800/50 flex flex-col shadow-premium animate-fade-in-up">
           
           <div className="p-4 flex items-center justify-between">
              <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl w-full">
                 <button 
                  onClick={() => setActiveTab('family')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'family' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
                 >
                    <MessageSquare size={14} /> Familia
                    {unreadCount > 0 && <span className="w-1.5 h-1.5 bg-red-500 rounded-full"></span>}
                 </button>
                 <button 
                  onClick={() => setActiveTab('ai')}
                  className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}
                 >
                    <Sparkles size={14} /> Asistente IA
                 </button>
              </div>
              <button onClick={() => setIsOpen(false)} className="ml-4 p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
           </div>

           <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {activeTab === 'family' ? (
                <>
                  {familyMessages.map(msg => <div key={msg.id}>{renderFamilyMessage(msg)}</div>)}
                  <div ref={familyMessagesEndRef}></div>
                </>
              ) : (
                <>
                  {aiMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
                       {msg.eventDraft ? (
                         <div className="bg-white dark:bg-zinc-900 p-4 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-lg w-full max-w-[300px] animate-scale-in">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-1">Borrador IA</span>
                            <h4 className="font-bold text-gray-900 dark:text-white truncate mb-2">{msg.eventDraft.title}</h4>
                            <div className="text-[11px] text-gray-400 font-bold mb-4">{format(msg.eventDraft.start, "EEEE d MMMM, HH:mm", { locale: es })}</div>
                            <button 
                              onClick={() => {
                                onAddEvent({ ...msg.eventDraft, calendarId: msg.selectedCalendarId });
                                setAiMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionTaken: 'confirmed' } : m));
                              }}
                              className="w-full py-2.5 bg-blue-600 text-white rounded-xl text-xs font-bold active:scale-95 transition-all"
                            >
                              Confirmar Evento
                            </button>
                         </div>
                       ) : (
                        <div className={`px-4 py-2.5 rounded-[22px] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                          <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
                        </div>
                       )}
                    </div>
                  ))}
                  <div ref={messagesEndRef}></div>
                </>
              )}
           </div>

           <div className="p-6 border-t border-gray-100 dark:border-zinc-800/50 bg-white/50 dark:bg-black/50 md:rounded-b-[40px]">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-900 rounded-[24px] px-5 py-2.5 border border-transparent focus-within:border-blue-500/20 shadow-inner">
                 <textarea 
                   className="flex-1 bg-transparent border-none outline-none text-[14px] dark:text-white py-1 resize-none h-10 max-h-32 placeholder-gray-400"
                   placeholder={activeTab === 'family' ? "Mensaje a la familia..." : "Pide agendar algo..."}
                   value={activeTab === 'family' ? familyInput : aiInput}
                   onChange={(e) => activeTab === 'family' ? setFamilyInput(e.target.value) : setAiInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), activeTab === 'family' ? handleSendFamily() : handleSendAI())}
                 />
                 <button 
                  onClick={activeTab === 'family' ? handleSendFamily : handleSendAI}
                  className="text-white p-2.5 bg-blue-600 rounded-xl shadow-lg active:scale-90 transition-transform"
                 >
                    <ArrowUp size={18} strokeWidth={3} />
                 </button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
