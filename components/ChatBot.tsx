
import React, { useState, useRef, useEffect } from 'react';
import { 
  X, Check, ArrowUp, CalendarDays, MessageSquare, Sparkles, AlertCircle, Info, Zap, Send, AtSign
} from 'lucide-react';
import { format, parseISO } from 'date-fns';
import { es } from 'date-fns/locale';
import { CalendarConfig, User, FamilyChatMessage } from '../types';
import { dataService } from '../services/dataService'; 
import { GoogleGenAI, Type } from "@google/genai";
import { AI_WEEKLY_LIMITS } from '../constants';

interface ChatBotProps {
  onAddEvent: (eventData: any) => void;
  calendars?: CalendarConfig[];
  currentUser: User;
  onOpenPricing: () => void;
}

interface AIMessage {
  id: string;
  role: 'user' | 'model' | 'error';
  text?: string;
  eventJSON?: any;
}

const ChatBot: React.FC<ChatBotProps> = ({ onAddEvent, calendars = [], currentUser, onOpenPricing }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<'chat' | 'ai'>('chat');
  
  // State for AI
  const [aiInput, setAiInput] = useState('');
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [aiMessages, setAiMessages] = useState<AIMessage[]>([]);
  const [aiCount, setAiCount] = useState(0);
  
  // State for Chat
  const [chatInput, setChatInput] = useState('');
  const [chatMessages, setChatMessages] = useState<FamilyChatMessage[]>([]);
  
  const scrollRef = useRef<HTMLDivElement>(null);

  const limit = AI_WEEKLY_LIMITS[currentUser.plan] || 10;
  const isLimitReached = aiCount >= limit;

  // Cargar datos iniciales
  useEffect(() => {
    if (isOpen) {
      const fetchData = async () => {
        const [count, msgs] = await Promise.all([
          dataService.getWeeklyAiCount(),
          dataService.getChatMessages()
        ]);
        setAiCount(count);
        setChatMessages(msgs);
      };
      fetchData();
    }
  }, [isOpen]);

  // Scroll al final cuando hay nuevos mensajes o cambios de pestaña
  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' });
  }, [aiMessages, chatMessages, activeTab]);

  const handleSendChat = async () => {
    const text = chatInput.trim();
    if (!text) return;

    const newMessage: FamilyChatMessage = {
      id: Date.now().toString(),
      family_id: 'default_family',
      user_id: currentUser.id,
      user_name: currentUser.name,
      text,
      timestamp: new Date().toISOString(),
      mentions: [] // La lógica de menciones se puede expandir aquí
    };

    setChatMessages(prev => [...prev.slice(-199), newMessage]); // Optimistic update
    setChatInput('');
    await dataService.sendChatMessage(newMessage);
  };

  const handleSendAI = async () => {
    if (isLimitReached) return;
    const text = aiInput.trim();
    if (!text || isAiLoading) return;

    setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', text }]);
    setAiInput('');
    setIsAiLoading(true);

    try {
      const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
      const systemInstruction = `
        Eres Family Plan IA. Solo creas eventos.
        FECHA ACTUAL: ${new Date().toISOString()}.
        Busca el calendario más apto entre: ${calendars.map(c => c.label).join(', ')}.
        Responde SIEMPRE en formato JSON estricto.
      `;

      const response = await ai.models.generateContent({
        model: 'gemini-3-flash-preview',
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
              calendar: { type: Type.STRING },
              notes: { type: Type.STRING }
            },
            required: ["title", "start_datetime", "end_datetime", "calendar"]
          }
        }
      });

      const json = JSON.parse(response.text || '{}');
      setAiMessages(prev => [...prev, { id: (Date.now() + 1).toString(), role: 'model', eventJSON: json }]);
    } catch (e) {
      setAiMessages(prev => [...prev, { id: Date.now().toString(), role: 'error', text: "No pude procesar esa solicitud. Prueba con algo como 'Cena mañana a las 8'." }]);
    } finally {
      setIsAiLoading(false);
    }
  };

  // Renderizador de texto con resaltado de menciones
  const renderMessageText = (text: string) => {
    return text.split(' ').map((word, i) => (
      word.startsWith('@') ? 
        <span key={i} className="text-blue-500 font-bold bg-blue-500/10 px-1 rounded mx-0.5">{word} </span> : 
        word + ' '
    ));
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)} 
        className="fixed bottom-[92px] right-6 z-[160] w-16 h-16 rounded-3xl shadow-premium bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 flex items-center justify-center hover:scale-110 active:scale-95 transition-all group overflow-hidden"
      >
        <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5 group-hover:opacity-100 opacity-0 transition-opacity"></div>
        <div className="relative">
          <MessageSquare size={28} className="text-blue-600 dark:text-blue-400 group-hover:scale-0 transition-transform duration-300" />
          <Sparkles size={28} className="text-purple-500 absolute inset-0 scale-0 group-hover:scale-100 transition-transform duration-300" />
        </div>
        {isLimitReached && <div className="absolute top-4 right-4 bg-red-500 w-2.5 h-2.5 rounded-full ring-4 ring-white dark:ring-zinc-900"></div>}
      </button>

      {isOpen && (
        <div className="fixed inset-0 md:inset-auto md:bottom-6 md:right-6 z-[200] w-full md:w-[420px] h-full md:h-[650px] bg-white dark:bg-zinc-950 flex flex-col shadow-2xl animate-fade-in-up md:rounded-[40px] border border-gray-100 dark:border-zinc-800 overflow-hidden">
           
           {/* Header con Tabs */}
           <div className="pt-6 px-6 pb-2 border-b border-gray-100 dark:border-zinc-800">
              <div className="flex items-center justify-between mb-6">
                 <h3 className="text-lg font-bold dark:text-white flex items-center gap-2">
                    {activeTab === 'chat' ? 'Chat Familiar' : 'Asistente IA'}
                    {activeTab === 'ai' && <Sparkles size={16} className="text-purple-500" />}
                 </h3>
                 <button onClick={() => setIsOpen(false)} className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-900 rounded-full"><X size={20} /></button>
              </div>

              <div className="flex bg-gray-100 dark:bg-zinc-900 rounded-2xl p-1 relative">
                 <div 
                    className={`absolute top-1 bottom-1 w-[calc(50%-4px)] bg-white dark:bg-zinc-800 rounded-xl shadow-sm transition-all duration-300 ease-out`}
                    style={{ left: activeTab === 'chat' ? '4px' : 'calc(50% + 0px)' }}
                 ></div>
                 <button 
                    onClick={() => setActiveTab('chat')}
                    className={`flex-1 relative z-10 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors ${activeTab === 'chat' ? 'text-blue-600 dark:text-white' : 'text-gray-500'}`}
                 >
                    <MessageSquare size={14} /> Chat Familiar
                 </button>
                 <button 
                    onClick={() => setActiveTab('ai')}
                    className={`flex-1 relative z-10 py-2.5 text-xs font-bold text-center flex items-center justify-center gap-2 transition-colors ${activeTab === 'ai' ? 'text-purple-600 dark:text-white' : 'text-gray-500'}`}
                 >
                    <Sparkles size={14} /> Asistente IA
                 </button>
              </div>
           </div>

           {/* Área de Mensajes */}
           <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-6 custom-scrollbar bg-gray-50/30 dark:bg-zinc-950/30">
              
              {activeTab === 'chat' ? (
                <div className="space-y-4">
                   <div className="bg-blue-50/50 dark:bg-blue-900/10 p-4 rounded-3xl border border-blue-100/50 dark:border-blue-900/30 mb-6">
                      <p className="text-[10px] text-blue-600 dark:text-blue-400 font-black uppercase tracking-widest text-center">Protocolo FIFO 200 Activo</p>
                      <p className="text-[9px] text-gray-500 dark:text-gray-400 text-center mt-1">Solo los últimos 200 mensajes se conservan.</p>
                   </div>
                   {chatMessages.map(msg => (
                      <div key={msg.id} className={`flex flex-col ${msg.user_id === currentUser.id ? 'items-end' : 'items-start'}`}>
                         <span className="text-[9px] font-bold text-gray-400 mb-1 px-1">{msg.user_name}</span>
                         <div className={`max-w-[85%] px-4 py-2.5 rounded-2xl text-sm shadow-sm ${msg.user_id === currentUser.id ? 'bg-blue-600 text-white rounded-tr-none' : 'bg-white dark:bg-zinc-900 dark:text-gray-200 rounded-tl-none border border-gray-100 dark:border-zinc-800'}`}>
                            {renderMessageText(msg.text)}
                         </div>
                         <span className="text-[8px] text-gray-400 mt-1 px-1">{format(parseISO(msg.timestamp), 'HH:mm')}</span>
                      </div>
                   ))}
                </div>
              ) : (
                <div className="space-y-4">
                   <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-3xl border border-purple-100 dark:border-purple-900/30 mb-6">
                      <div className="flex justify-between items-center mb-2">
                        <span className="text-[10px] text-purple-600 dark:text-purple-400 font-black uppercase tracking-widest">Cuota Semanal</span>
                        <span className="text-[10px] font-bold dark:text-white">{aiCount} / {limit}</span>
                      </div>
                      <div className="h-1.5 w-full bg-gray-200 dark:bg-zinc-800 rounded-full overflow-hidden">
                        <div 
                          className="h-full bg-gradient-to-r from-purple-500 to-blue-500 transition-all duration-1000" 
                          style={{ width: `${Math.min((aiCount/limit)*100, 100)}%` }}
                        ></div>
                      </div>
                   </div>

                   {isLimitReached && (
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-6 rounded-[32px] border border-orange-100 dark:border-orange-800/50 text-center">
                      <Zap size={32} className="text-orange-500 mx-auto mb-3" />
                      <h4 className="font-bold text-orange-900 dark:text-orange-200">Límite alcanzado</h4>
                      <p className="text-xs text-orange-700 dark:text-orange-400 mt-2 mb-4">Sube de plan para seguir agendando con IA.</p>
                      <button onClick={onOpenPricing} className="w-full py-3 bg-orange-500 text-white rounded-2xl font-bold text-xs shadow-lg shadow-orange-500/30">Subir de Plan</button>
                    </div>
                   )}

                   {aiMessages.map(msg => (
                      <div key={msg.id} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                        {msg.eventJSON ? (
                          <div className="bg-white dark:bg-zinc-900 p-5 rounded-[32px] border border-gray-100 dark:border-zinc-800 shadow-xl w-full max-w-[300px] animate-scale-in">
                            <div className="flex items-center gap-3 mb-4">
                               <div className="w-10 h-10 rounded-2xl bg-blue-600 flex items-center justify-center text-white shadow-lg shadow-blue-500/20">
                                  <CalendarDays size={20} />
                               </div>
                               <div className="min-w-0">
                                  <h4 className="font-bold text-sm truncate dark:text-white">{msg.eventJSON.title}</h4>
                                  <p className="text-[10px] text-gray-500 font-medium">{msg.eventJSON.calendar}</p>
                               </div>
                            </div>
                            <div className="bg-gray-50 dark:bg-zinc-800/50 p-3 rounded-xl mb-4">
                               <p className="text-[10px] text-gray-400 uppercase font-black mb-1">Fecha Detectada</p>
                               <p className="text-xs font-bold dark:text-white">{format(parseISO(msg.eventJSON.start_datetime), "EEEE d MMMM, HH:mm", { locale: es })}</p>
                            </div>
                            <button 
                              onClick={async () => {
                                onAddEvent(msg.eventJSON);
                                await dataService.incrementAiCount();
                                setAiCount(prev => prev + 1);
                                setAiMessages(prev => prev.filter(m => m.id !== msg.id));
                              }}
                              className="w-full py-3 bg-blue-600 text-white rounded-2xl text-xs font-black flex items-center justify-center gap-2 shadow-lg shadow-blue-500/20 active:scale-95 transition-all"
                            >
                              <Check size={16} strokeWidth={3} /> AGENDAR AHORA
                            </button>
                          </div>
                        ) : (
                          <div className={`px-4 py-2.5 rounded-2xl text-sm ${msg.role === 'user' ? 'bg-purple-600 text-white' : 'bg-gray-100 dark:bg-zinc-900 dark:text-gray-200'}`}>
                            {msg.text}
                          </div>
                        )}
                      </div>
                   ))}
                </div>
              )}
           </div>

           {/* Input Bar */}
           <div className="p-6 bg-white dark:bg-zinc-950 border-t border-gray-100 dark:border-zinc-800">
              <div className="flex items-center gap-3 bg-gray-100 dark:bg-zinc-900 rounded-[24px] px-4 py-2 shadow-sm border border-gray-100 dark:border-zinc-800 focus-within:ring-2 ring-blue-500/20 transition-all">
                {activeTab === 'chat' ? (
                  <>
                    <button className="text-gray-400 hover:text-blue-500 transition-colors"><AtSign size={18} /></button>
                    <input 
                      className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white py-2"
                      placeholder="Escribe a la familia..."
                      value={chatInput}
                      onChange={(e) => setChatInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendChat()}
                    />
                    <button onClick={handleSendChat} className="p-2 bg-blue-600 text-white rounded-xl active:scale-90 transition-transform shadow-lg shadow-blue-500/20">
                      <Send size={18} />
                    </button>
                  </>
                ) : (
                  <>
                    <input 
                      disabled={isLimitReached || isAiLoading}
                      className="flex-1 bg-transparent border-none outline-none text-sm dark:text-white py-2 disabled:opacity-50"
                      placeholder={isLimitReached ? "Límite agotado..." : "Ej: Fútbol el martes a las 18..."}
                      value={aiInput}
                      onChange={(e) => setAiInput(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSendAI()}
                    />
                    <button onClick={handleSendAI} disabled={isLimitReached || isAiLoading} className="p-2 bg-purple-600 text-white rounded-xl active:scale-90 transition-transform shadow-lg shadow-purple-500/20 disabled:opacity-30">
                      {isAiLoading ? <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div> : <ArrowUp size={18} />}
                    </button>
                  </>
                )}
              </div>
           </div>
        </div>
      )}
    </>
  );
};

export default ChatBot;
