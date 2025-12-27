
import React, { useState, useRef, useEffect, useMemo } from 'react';
import { 
  X, Check, ArrowUp, CalendarDays, MessageSquare, Sparkles, ChevronDown
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
  
  const aiEndRef = useRef<HTMLDivElement>(null);
  const familyEndRef = useRef<HTMLDivElement>(null);

  const [aiMessages, setAiMessages] = useState<Message[]>([]);
  const [familyMessages, setFamilyMessages] = useState<FamilyChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);
  const [historyLoaded, setHistoryLoaded] = useState(false);

  // Sync family messages polling
  useEffect(() => {
    const fetchMsgs = async () => {
      const msgs = await dataService.getFamilyMessages();
      if (msgs.length > familyMessages.length) {
        if (!isOpen || activeTab !== 'family') {
          setUnreadCount(prev => prev + (msgs.length - familyMessages.length));
        }
      }
      setFamilyMessages(msgs);
    };
    fetchMsgs();
    const interval = setInterval(fetchMsgs, 5000);
    return () => clearInterval(interval);
  }, [familyMessages.length, isOpen, activeTab]);

  useEffect(() => {
    if (isOpen && activeTab === 'family') setUnreadCount(0);
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (activeTab === 'ai') aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    else familyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, familyMessages, activeTab, isOpen]);

  const handleSendFamily = async () => {
    if (!familyInput.trim()) return;
    const mentions = calendars.filter(c => familyInput.toLowerCase().includes(`@${c.label.toLowerCase()}`)).map(c => c.label);
    const newMsg = await dataService.sendFamilyMessage({ sender_label: currentUser.name, content: familyInput, mentions });
    if (newMsg) {
      setFamilyMessages(prev => [...prev, newMsg]);
      setFamilyInput('');
    }
  };

  const handleSendAI = async () => {
    const userText = aiInput.trim();
    if (!userText || isLoading) return;

    // Coding Guideline: obtain apiKey exclusively from process.env.API_KEY
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
    setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text: userText }]);
    setAiInput('');
    setIsLoading(true);

    try {
      const systemInstruction = `ERES: Asistente Family Plan. ROL: Solo agendar eventos. Sin charla. Tono corto. FECHA: ${new Date().toISOString()}.`;
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

      // Coding Guideline: Use gemini-3-pro-preview for complex reasoning task
      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: aiMessages.slice(-5).map(m => ({ role: m.role, parts: [{ text: m.text || '' }] })).concat({ role: 'user', parts: [{ text: userText }] }),
        config: { systemInstruction, tools: [{ functionDeclarations: [createEventTool] }] }
      });

      // Coding Guideline: Access .functionCalls as a property
      if (response.functionCalls?.length) {
          const args = response.functionCalls[0].args as any;
          const foundCal = calendars.find(c => c.label.toLowerCase().includes(args.calendarName?.toLowerCase()));
          setAiMessages(prev => [...prev, { 
            id: Date.now().toString(), 
            role: 'system', 
            eventDraft: { ...args, start: parseISO(args.start) }, 
            selectedCalendarId: foundCal?.id || calendars[0].id 
          }]);
      }
      // Coding Guideline: Access .text as a property
      if (response.text) setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', text: response.text }]);
    } catch (e) {
      setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'system', text: 'Error.' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFamilyMessage = (msg: FamilyChatMessage) => {
    const isMe = msg.sender_label === currentUser.name;
    // Fix for Error in file components/ChatBot.tsx on line 135: Cannot find namespace 'JSX'
    // Using React.ReactNode instead of JSX.Element to fix missing namespace error
    let parts: React.ReactNode[] = [msg.content];

    // Lógica avanzada de resaltado de menciones
    calendars.forEach(cal => {
      const mentionTag = `@${cal.label}`;
      // Fix for Error in file components/ChatBot.tsx on line 140: Cannot find namespace 'JSX'
      // Using React.ReactNode instead of JSX.Element to fix missing namespace error
      const newParts: React.ReactNode[] = [];
      parts.forEach(part => {
        if (typeof part === 'string') {
          const split = part.split(new RegExp(`(${mentionTag})`, 'gi'));
          split.forEach(s => {
            if (s.toLowerCase() === mentionTag.toLowerCase()) {
              newParts.push(<span key={Math.random()} className="font-bold px-1.5 py-0.5 rounded-md mx-0.5" style={{ backgroundColor: `${cal.color}25`, color: cal.color }}>{s}</span>);
            } else if (s !== "") {
              newParts.push(s);
            }
          });
        } else {
          newParts.push(part);
        }
      });
      parts = newParts;
    });

    return (
      <div className={`flex flex-col mb-4 ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
        {!isMe && <span className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase tracking-widest">{msg.sender_label}</span>}
        <div className={`px-4 py-2.5 rounded-[22px] text-sm shadow-sm max-w-full ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
          {parts}
        </div>
        <span className="text-[9px] text-gray-300 mt-1 mx-1">{format(new Date(msg.created_at), 'HH:mm')}</span>
      </div>
    );
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-2xl shadow-2xl bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
        <MessageSquare size={28} className="text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white dark:border-zinc-900 animate-bounce">{unreadCount}</div>}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 md:bottom-6 md:right-6 md:left-auto z-[100] w-full h-[70vh] md:w-[420px] md:h-[650px] bg-white/90 dark:bg-black/90 backdrop-blur-3xl md:rounded-[40px] rounded-t-[40px] border-t md:border border-gray-200/50 dark:border-zinc-800/50 flex flex-col shadow-premium animate-fade-in-up">
           <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/50">
              <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl w-full max-w-[280px]">
                 <button onClick={() => setActiveTab('family')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'family' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}><MessageSquare size={14} /> Familia</button>
                 <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}><Sparkles size={14} /> Asistente IA</button>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600"><X size={20} /></button>
           </div>

           <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {activeTab === 'family' ? (
                <>
                  {familyMessages.map(msg => renderFamilyMessage(msg))}
                  <div ref={familyEndRef}></div>
                </>
              ) : (
                <>
                  {aiMessages.map(msg => (
                    <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4 animate-fade-in`}>
                       {msg.eventDraft ? (
                         <div className="bg-white dark:bg-zinc-900 p-5 rounded-3xl border border-gray-100 dark:border-zinc-800 shadow-xl w-full max-w-[300px]">
                            <span className="text-[10px] font-bold text-blue-500 uppercase tracking-widest block mb-2">Borrador IA</span>
                            <h4 className="font-bold text-gray-900 dark:text-white mb-3">{msg.eventDraft.title}</h4>
                            <div className="text-xs text-gray-400 font-bold mb-5 flex items-center gap-2"><CalendarDays size={14} />{format(msg.eventDraft.start, "EEEE d MMMM, HH:mm", { locale: es })}</div>
                            <button onClick={() => { onAddEvent({ ...msg.eventDraft, calendarId: msg.selectedCalendarId }); setAiMessages(prev => prev.map(m => m.id === msg.id ? { ...m, actionTaken: 'confirmed' } : m)); }} className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold active:scale-95 transition-all">Confirmar Evento</button>
                         </div>
                       ) : (
                        <div className={`px-4 py-2.5 rounded-[22px] text-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
                          <ReactMarkdown>{msg.text || ''}</ReactMarkdown>
                        </div>
                       )}
                    </div>
                  ))}
                  {isLoading && <div className="flex gap-1.5 p-3 bg-gray-100 dark:bg-zinc-900 rounded-full w-fit animate-pulse"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span></div>}
                  <div ref={aiEndRef}></div>
                </>
              )}
           </div>

           <div className="p-6 border-t border-gray-100 dark:border-zinc-800/50 bg-white/50 dark:bg-black/50 md:rounded-b-[40px] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-900 rounded-[24px] px-5 py-2.5 shadow-inner">
                 <textarea 
                   className="flex-1 bg-transparent border-none outline-none text-[14px] dark:text-white py-1 resize-none h-10 max-h-32 placeholder-gray-400"
                   placeholder={activeTab === 'family' ? "Mensaje a la familia..." : "Pide agendar algo..."}
                   value={activeTab === 'family' ? familyInput : aiInput}
                   onChange={(e) => activeTab === 'family' ? setFamilyInput(e.target.value) : setAiInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), activeTab === 'family' ? handleSendFamily() : handleSendAI())}
                 />
                 <button onClick={activeTab === 'family' ? handleSendFamily : handleSendAI} className="text-white p-2.5 bg-blue-600 rounded-xl shadow-lg active:scale-90 transition-transform"><ArrowUp size={18} strokeWidth={3} /></button>
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
