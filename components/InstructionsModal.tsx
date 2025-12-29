
import React from 'react';
import { X, Sparkles, MessageSquare, ShieldCheck, RefreshCcw, CheckSquare, Smartphone, Lock, Globe } from 'lucide-react';

interface InstructionsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const InstructionsModal: React.FC<InstructionsModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const sections = [
    {
      title: "IA de Precisión (Solo Eventos)",
      icon: <Sparkles className="text-yellow-500" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Misión Única:</strong> El asistente IA no charla ni responde preguntas generales. Solo crea eventos de calendario.</li>
          <li><strong>Borradores Rápidos:</strong> Di "Cena mañana a las 8" y verás una tarjeta interactiva para confirmar en un toque.</li>
          <li><strong>Ahorro de Tokens:</strong> Al ser estricta, la IA consume menos cuota mensual para que agendes más.</li>
        </ul>
      )
    },
    {
      title: "Chat Familiar FIFO 200",
      icon: <MessageSquare className="text-blue-600 dark:text-blue-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Menciones @:</strong> Escribe @seguido del nombre de un miembro para resaltar el mensaje.</li>
          <li><strong>Eficiencia FIFO:</strong> Solo guardamos los últimos 200 mensajes. Lo importante queda en el calendario.</li>
          <li><strong>Privacidad:</strong> Los mensajes antiguos se eliminan automáticamente para mantener el historial limpio.</li>
        </ul>
      )
    },
    {
      title: "Seguridad E2EE AES-256",
      icon: <ShieldCheck className="text-green-600 dark:text-green-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Cifrado Local:</strong> Tus datos se cifran en tu dispositivo antes de enviarse a la base de datos.</li>
          <li><strong>Cero Conocimiento:</strong> Nadie, ni siquiera los administradores, puede leer tus planes privados.</li>
          <li><strong>Llaves Propias:</strong> Tu contraseña es la base de la llave de cifrado.</li>
        </ul>
      )
    },
    {
      title: "Multi-Sync Google",
      icon: <RefreshCcw className="text-purple-600 dark:text-purple-400" size={24} />,
      content: (
        <ul className="list-disc list-inside space-y-2 text-sm text-gray-600 dark:text-gray-300">
          <li><strong>Cuentas Separadas:</strong> Cada miembro puede tener su propia cuenta de Google sincronizada.</li>
          <li><strong>Globos de Estado:</strong> El icono 🌐 indica que el calendario está vinculado a la nube.</li>
        </ul>
      )
    }
  ];

  return (
    <div className="fixed inset-0 z-[170] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-[40px] shadow-2xl w-full max-w-4xl max-h-[90vh] flex flex-col border border-gray-100 dark:border-gray-700 overflow-hidden">
        <div className="flex items-center justify-between px-8 py-6 border-b border-gray-100 dark:border-gray-700">
          <div>
            <h2 className="text-2xl font-black text-gray-800 dark:text-white">Manual Premium</h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">Saca el máximo provecho a tu Family Plan</p>
          </div>
          <button onClick={onClose} className="p-3 bg-gray-50 dark:bg-gray-700 rounded-full text-gray-400"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid md:grid-cols-2 gap-8">
            {sections.map((section, idx) => (
              <div key={idx} className="bg-gray-50 dark:bg-zinc-900/50 rounded-3xl p-6 border border-gray-100 dark:border-gray-800 hover:shadow-xl transition-all">
                <div className="flex items-center gap-4 mb-4">
                  <div className="p-3 bg-white dark:bg-gray-800 rounded-2xl shadow-sm">{section.icon}</div>
                  <h3 className="font-bold text-lg text-gray-800 dark:text-gray-200">{section.title}</h3>
                </div>
                {section.content}
              </div>
            ))}
          </div>
        </div>

        <div className="px-8 py-6 border-t border-gray-100 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 flex justify-end">
          <button onClick={onClose} className="px-10 py-3 bg-blue-600 text-white font-black rounded-full shadow-lg text-xs tracking-widest uppercase active:scale-95 transition-all">Entendido</button>
        </div>
      </div>
    </div>
  );
};

export default InstructionsModal;
