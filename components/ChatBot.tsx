
import React, { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, Check, ArrowUp, CalendarDays, MessageSquare, Sparkles, AlertCircle, Info, Bell, AtSign
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarConfig, CalendarEvent, User, FamilyChatMessage } from '../types';
import { dataService } from '../services/dataService'; 
import { GoogleGenAI, Type } from "@google/genai";

interface ChatBotProps {
  onAddEvent: (eventData: any) => void;
  calendars?: CalendarConfig[];
  events?: CalendarEvent[];
  currentUser: User;
  onOpenPricing: () => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'model' | 'error';
  text?: string;
  eventJSON?: {
    title: string;
    start_datetime: string;
    end_datetime: string;
    all_day: boolean;
    calendar: string;
    participants: string[];
    notifications: boolean;
    notes: string;
  };
}

const ChatBot: React.FC<ChatBotProps> = ({ onAddEvent, calendars = [], currentUser }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'family' | 'ai'>('family');
  const [aiInput, setAiInput] = useState('');
  const [familyInput, setFamilyInput] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [isSending, setIsSending] = useState(false); // Flag crucial para evitar el bug de borrado
  
  const aiEndRef = useRef<HTMLDivElement>(null);
  const familyEndRef = useRef<HTMLDivElement>(null);

  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [familyMessages, setFamilyMessages] = useState<FamilyChatMessage[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // --- LÓGICA CHAT FAMILIAR (PROMPT 1) ---
  const fetchFamilyMessages = useCallback(async () => {
    // Si estamos en proceso de envío, no actualizamos para evitar race conditions
    if (isSending) return;

    try {
      const msgs = await dataService.getFamilyMessages();
      
      // Lógica de contador de no leídos
      if (msgs.length > familyMessages.length) {
        if (!isOpen || activeTab !== 'family') {
          const diff = msgs.length - familyMessages.length;
          setUnreadCount(prev => prev + diff);
        }
      }
      
      setFamilyMessages(msgs);
    } catch (e) {
      console.error("Error al obtener mensajes familiares:", e);
    }
  }, [isSending, isOpen, activeTab, familyMessages.length]);

  useEffect(() => {
    fetchFamilyMessages();
    const interval = setInterval(fetchFamilyMessages, 4000);
    return () => clearInterval(interval);
  }, [fetchFamilyMessages]);

  useEffect(() => {
    // Resetear contador al abrir el tab de familia
    if (isOpen && activeTab === 'family') {
      setUnreadCount(0);
    }
  }, [isOpen, activeTab]);

  useEffect(() => {
    if (activeTab === 'ai') aiEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    else familyEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [aiMessages, familyMessages, activeTab, isOpen]);

  const handleSendFamily = async () => {
    const text = familyInput.trim();
    if (!text || isSending) return;

    setIsSending(true); // Bloquear polling
    const mentions = calendars
      .filter(c => text.toLowerCase().includes(`@${c.label.toLowerCase()}`))
      .map(c => c.label);

    try {
      // UI Optimista para evitar el parpadeo
      const tempId = crypto.randomUUID();
      const optimisticMsg: FamilyChatMessage = {
        id: tempId,
        family_id: currentUser.id,
        user_id: currentUser.id,
        user_name: currentUser.name,
        timestamp: new Date().toISOString(),
        text: text,
        mentions: mentions
      };
      
      setFamilyMessages(prev => [...prev, optimisticMsg]);
      setFamilyInput('');

      await dataService.sendFamilyMessage({ text, mentions });
      // Después del envío exitoso, fetchFamilyMessages() se encargará de traer la lista real
    } catch (e) {
      console.error("Error al enviar mensaje:", e);
      // Opcional: Notificar error
    } finally {
      setIsSending(false); // Liberar polling
      fetchFamilyMessages();
    }
  };

  // --- LÓGICA IA (PROMPT 2 - SOLO EVENTOS) ---
  const handleSendAI = async () => {
    const text = aiInput.trim();
    if (!text || isLoading) return;

    const userMsg: AIMessage = { id: Date.now().toString(), role: 'user', text };
    setAiMessages(prev => [...prev.slice(-49), userMsg]);
    setAiInput('');
    setIsLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        Eres una IA EXCLUSIVA para crear eventos de calendario.
        REGLAS ABSOLUTAS:
        - NO chateas. NO explicas. NO respondes preguntas.
        - Si el mensaje NO es para crear un evento, responde exactamente: "Solicitud no válida. Solo puedo crear eventos."
        - FORMATO DE SALIDA: JSON estricto.
        FECHA ACTUAL: ${new Date().toISOString()}.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-pro-preview',
        contents: [{ role: 'user', parts: [{ text }] }],
        config: { 
          systemInstruction, 
          responseMimeType: "application/json",
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              title: { type: Type.STRING },
              start_datetime: { type: Type.STRING },
              end_datetime: { type: Type.STRING },
              all_day: { type: Type.BOOLEAN },
              calendar: { type: Type.STRING },
              participants: { type: Type.ARRAY, items: { type: Type.STRING } },
              notifications: { type: Type.BOOLEAN },
              notes: { type: Type.STRING }
            },
            required: ["title", "start_datetime", "end_datetime", "all_day", "calendar"]
          }
        }
      });

      const resText = response.text || '';
      
      // Validar respuesta de error del prompt
      if (resText.includes("Solicitud no válida")) {
        setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', text: "Solicitud no válida. Solo puedo crear eventos." }]);
      } else {
        try {
          const json = JSON.parse(resText);
          setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'model', eventJSON: json }]);
        } catch (parseError) {
          setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', text: "Error al procesar el evento. Intenta ser más específico." }]);
        }
      }
    } catch (e) {
      setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', text: "Error de conexión con la IA." }]);
    } finally {
      setIsLoading(false);
    }
  };

  const renderFamilyMessage = (msg: FamilyChatMessage) => {
    const isMe = msg.user_id === currentUser.id;
    let contentParts: React.ReactNode[] = [msg.text];

    // Resaltar menciones
    calendars.forEach(cal => {
      const tag = `@${cal.label}`;
      const next: React.ReactNode[] = [];
      contentParts.forEach(part => {
        if (typeof part === 'string') {
          part.split(new RegExp(`(${tag})`, 'gi')).forEach(s => {
            if (s.toLowerCase() === tag.toLowerCase()) {
              next.push(<span key={Math.random()} className="font-black px-1.5 py-0.5 rounded-md mx-0.5 text-[12px]" style={{ backgroundColor: `${cal.color}20`, color: cal.color }}>{s}</span>);
            } else if (s) next.push(s);
          });
        } else next.push(part);
      });
      contentParts = next;
    });

    return (
      <div key={msg.id} className={`flex flex-col mb-4 ${isMe ? 'items-end' : 'items-start'} animate-fade-in`}>
        {!isMe && <span className="text-[10px] font-bold text-gray-400 mb-1 ml-2 uppercase tracking-widest">{msg.user_name}</span>}
        <div className={`px-4 py-2.5 rounded-[22px] text-sm shadow-premium max-w-[90%] ${isMe ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
          {contentParts}
        </div>
        <span className="text-[9px] text-gray-400 mt-1 mx-1 font-bold">{format(parseISO(msg.timestamp), 'HH:mm')}</span>
      </div>
    );
  };

  const renderAIMessage = (msg: AIMessage) => {
    if (msg.role === 'error') {
      return (
        <div key={msg.id} className="flex justify-center mb-4">
          <div className="bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[11px] font-bold px-4 py-2 rounded-full border border-red-100 dark:border-red-900/50 flex items-center gap-2">
            <AlertCircle size={14} /> {msg.text}
          </div>
        </div>
      );
    }

    if (msg.eventJSON) {
      const cal = calendars.find(c => c.label.toLowerCase().includes(msg.eventJSON!.calendar.toLowerCase())) || calendars[0];
      return (
        <div key={msg.id} className="flex justify-start mb-4 animate-fade-in">
          <div className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-2xl w-full max-w-[320px] relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-1" style={{ backgroundColor: cal.color }}></div>
            <div className="flex items-center gap-2 mb-3">
              <Sparkles size={14} className="text-blue-500" />
              <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Borrador de Evento</span>
            </div>
            <h4 className="font-bold text-gray-900 dark:text-white mb-2 text-lg leading-tight">{msg.eventJSON.title}</h4>
            <div className="space-y-2 mb-6">
              <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400 font-bold">
                <CalendarDays size={14} className="text-blue-500" />
                {format(parseISO(msg.eventJSON.start_datetime), "EEEE d MMM, HH:mm", { locale: es })}
              </div>
              {msg.eventJSON.notes && (
                <div className="flex items-start gap-2 text-[11px] text-gray-400 italic">
                  <Info size={14} className="shrink-0" />
                  <span>{msg.eventJSON.notes}</span>
                </div>
              )}
              <div className="flex items-center gap-2 text-[10px] font-bold" style={{ color: cal.color }}>
                <div className="w-2 h-2 rounded-full" style={{ backgroundColor: cal.color }}></div>
                En calendario: {cal.label}
              </div>
            </div>
            <button 
              onClick={() => {
                onAddEvent({
                  title: msg.eventJSON!.title,
                  start: parseISO(msg.eventJSON!.start_datetime),
                  end: parseISO(msg.eventJSON!.end_datetime),
                  description: msg.eventJSON!.notes,
                  calendarId: cal.id,
                  color: cal.color,
                  reminderMinutes: msg.eventJSON!.notifications ? [15] : [],
                  createdByBot: true
                });
                setAiMessages(prev => prev.filter(m => m.id !== msg.id));
              }}
              className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-bold shadow-lg shadow-blue-500/20 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <Check size={16} strokeWidth={3} /> Confirmar y Agendar
            </button>
          </div>
        </div>
      );
    }

    return (
      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'} mb-4`}>
        <div className={`px-4 py-2.5 rounded-[22px] text-sm shadow-sm ${msg.role === 'user' ? 'bg-blue-600 text-white rounded-br-none' : 'bg-gray-100 dark:bg-zinc-900 text-gray-800 dark:text-gray-200 rounded-bl-none'}`}>
          {msg.text}
        </div>
      </div>
    );
  };

  return (
    <>
      <button onClick={() => setIsOpen(true)} className="fixed bottom-24 right-6 z-50 w-16 h-16 rounded-2xl shadow-premium bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group">
        <MessageSquare size={28} className="text-gray-700 dark:text-gray-200" />
        {unreadCount > 0 && (
          <div className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] font-black px-2 py-0.5 rounded-full border-2 border-white dark:border-zinc-900 animate-bounce shadow-lg">
            {unreadCount > 99 ? '+99' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div className="fixed inset-x-0 bottom-0 md:bottom-6 md:right-6 md:left-auto z-[160] w-full h-[70vh] md:w-[420px] md:h-[650px] bg-white/95 dark:bg-black/95 backdrop-blur-3xl md:rounded-[40px] rounded-t-[40px] border-t md:border border-gray-200/50 dark:border-zinc-800/50 flex flex-col shadow-2xl animate-fade-in-up">
           <div className="p-4 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800/50">
              <div className="flex bg-gray-100 dark:bg-zinc-900 p-1 rounded-2xl w-full max-w-[280px]">
                 <button onClick={() => setActiveTab('family')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'family' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}><MessageSquare size={14} /> Familia</button>
                 <button onClick={() => setActiveTab('ai')} className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-2 ${activeTab === 'ai' ? 'bg-white dark:bg-zinc-800 shadow-sm text-black dark:text-white' : 'text-gray-400'}`}><Sparkles size={14} /> Asistente IA</button>
              </div>
              <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:text-gray-600 transition-colors"><X size={20} /></button>
           </div>

           <div className="flex-1 overflow-y-auto px-6 py-4 custom-scrollbar">
              {activeTab === 'family' ? (
                <>
                  {familyMessages.length === 0 && <div className="flex flex-col items-center justify-center h-full opacity-20"><AtSign size={40} className="mb-2" /><p className="text-sm font-bold">Chat familiar vacío</p></div>}
                  {familyMessages.map(renderFamilyMessage)}
                  <div ref={familyEndRef}></div>
                </>
              ) : (
                <>
                  {aiMessages.length === 0 && (
                    <div className="flex flex-col items-center justify-center h-full opacity-20 text-center px-10">
                      <Sparkles size={40} className="mb-2" />
                      <p className="text-sm font-bold">Asistente de Agendamiento</p>
                      <p className="text-[10px] uppercase font-bold tracking-widest mt-2 leading-relaxed">Solo puedo crear eventos. Di algo como: "Cena con los abuelos mañana a las 8pm"</p>
                    </div>
                  )}
                  {aiMessages.map(renderAIMessage)}
                  {isLoading && <div className="flex gap-1.5 p-3 bg-gray-100 dark:bg-zinc-900 rounded-full w-fit animate-pulse mb-4"><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce"></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.1s'}}></span><span className="w-1.5 h-1.5 bg-gray-400 rounded-full animate-bounce" style={{animationDelay:'0.2s'}}></span></div>}
                  <div ref={aiEndRef}></div>
                </>
              )}
           </div>

           <div className="p-6 border-t border-gray-100 dark:border-zinc-800/50 bg-white/50 dark:bg-black/50 md:rounded-b-[40px] pb-[calc(env(safe-area-inset-bottom,0px)+1.5rem)]">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-900 rounded-[24px] px-5 py-2.5 shadow-inner">
                 <textarea 
                   disabled={isSending || isLoading}
                   className="flex-1 bg-transparent border-none outline-none text-[15px] dark:text-white py-1 resize-none h-10 max-h-32 placeholder-gray-400 font-medium"
                   placeholder={activeTab === 'family' ? "Mensaje a la familia..." : "Pide crear un evento..."}
                   value={activeTab === 'family' ? familyInput : aiInput}
                   onChange={(e) => activeTab === 'family' ? setFamilyInput(e.target.value) : setAiInput(e.target.value)}
                   onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && (e.preventDefault(), activeTab === 'family' ? handleSendFamily() : handleSendAI())}
                 />
                 <button 
                  onClick={activeTab === 'family' ? handleSendFamily : handleSendAI} 
                  disabled={isSending || isLoading}
                  className="text-white p-2.5 bg-blue-600 rounded-xl shadow-lg active:scale-90 transition-transform disabled:opacity-50 disabled:active:scale-100"
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
