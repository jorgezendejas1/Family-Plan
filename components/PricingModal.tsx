
import React from 'react';
import { X, Check, Zap, Smartphone, Cpu, Crown, Star } from 'lucide-react';

interface PricingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const PricingModal: React.FC<PricingModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  const plans = [
    {
      name: 'Gratis', 
      price: '$0', 
      limit: '10 / semana',
      subtitle: 'Para empezar.',
      features: ['Uso de App ilimitado', 'Hasta 5 Miembros', 'Chat Familiar', 'Cifrado E2EE Real', 'Sincronización Local'],
      color: 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800', 
      btn: 'Plan actual',
      btnStyle: 'bg-gray-200 dark:bg-zinc-800 text-gray-500'
    },
    {
      name: 'Basic', 
      price: '$2.99', 
      limit: '50 / semana',
      subtitle: 'Parejas y familias.',
      features: ['Todo lo del plan Gratis', 'Hasta 20 Miembros', 'Sincronización Google (2)', 'Soporte prioritario', 'Análisis de fotos/docs'],
      color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50', 
      btn: 'Mejorar ahora', 
      highlight: true,
      btnStyle: 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
    },
    {
      name: 'PRO', 
      price: '$5.99', 
      limit: '125 / semana',
      subtitle: 'Familias activas.',
      features: ['Todo lo del plan Basic', 'IA Avanzada (Audio/Video)', 'Sincronización Pro (5)', 'Acceso anticipado', 'Reportes de actividad'],
      color: 'bg-zinc-900 dark:bg-zinc-950 text-white border-zinc-800 shadow-xl', 
      btn: 'Elegir PRO',
      btnStyle: 'bg-white text-black hover:bg-gray-100 shadow-xl'
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-black rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[95vh] border border-white/20 dark:border-zinc-800">
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <Crown className="text-yellow-500" size={24} /> Planes Family Plan
            </h2>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Sincroniza tu hogar con el poder de la IA</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-4 md:p-8 grid md:grid-cols-3 gap-6 custom-scrollbar">
          {plans.map((plan, idx) => (
            <div key={idx} className={`relative p-6 md:p-8 rounded-[32px] border transition-all ${plan.color} flex flex-col hover:scale-[1.02] shadow-xl`}>
              {plan.highlight && <div className="absolute top-4 right-4 bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase">POPULAR</div>}
              <h3 className="text-xl font-bold dark:text-white mb-1">{plan.name}</h3>
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black dark:text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm font-medium">/ mes</span>
              </div>
              
              <div className="mb-6 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-2xl border border-black/5 dark:border-white/5 w-fit flex flex-col">
                <span className="text-[10px] font-black text-blue-600 dark:text-blue-400 tracking-wider uppercase">{plan.limit} IA</span>
              </div>

              <ul className="space-y-3 mb-10 flex-1">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300 font-bold">
                    <Check size={14} className={plan.highlight ? 'text-blue-500' : 'text-green-500'} strokeWidth={3} />
                    {f}
                  </li>
                ))}
              </ul>
              <button className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${plan.btnStyle}`}>
                {plan.btn}
              </button>
            </div>
          ))}

          <div className="md:col-span-3 bg-gray-50 dark:bg-zinc-900 rounded-[32px] p-8 flex flex-col md:flex-row items-center justify-between border border-dashed border-gray-300 dark:border-zinc-800">
             <div className="text-center md:text-left mb-6 md:mb-0">
                <h4 className="text-lg font-black dark:text-white uppercase tracking-tighter">Enterprise</h4>
                <p className="text-sm text-gray-500 font-bold">Para organizaciones grandes y grupos ilimitados.</p>
             </div>
             <button className="px-10 py-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl font-black text-xs uppercase tracking-widest shadow-xl">Contactar Ventas</button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
