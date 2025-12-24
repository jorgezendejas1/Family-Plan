
import React from 'react';
import { X, Check, Zap, Smartphone, Cpu } from 'lucide-react';

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
      limit: '10 EVENTOS IA/SEMANA',
      monthlyLabel: '(40 al mes)',
      subtitle: 'Ideal para individuos.',
      features: ['Uso de App Libre e Ilimitado', 'Hasta 1 Miembro Familia', 'Sincronización local', '1 cuenta Google', 'IA Básica', 'Con anuncios'],
      color: 'bg-gray-50 dark:bg-zinc-900 border-gray-100 dark:border-zinc-800', 
      btn: 'Plan actual',
      btnStyle: 'bg-gray-200 dark:bg-zinc-800 text-gray-500'
    },
    {
      name: 'Basic', 
      price: '$1.99', 
      limit: '40 EVENTOS IA/SEMANA',
      monthlyLabel: '(160 al mes)',
      subtitle: 'Perfecto para parejas.',
      features: ['Todo lo del plan Gratis', 'Hasta 2 Miembros', 'Sincronización Premium (2 cuentas)', 'Soporte prioritario', 'IA Ampliada', 'Fotos/Docs', 'Anuncios Limitados'],
      color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50', 
      btn: 'Mejorar ahora', 
      highlight: true,
      btnStyle: 'bg-blue-600 text-white shadow-blue-500/20 hover:bg-blue-700'
    },
    {
      name: 'PRO', 
      price: '$4.99', 
      limit: '200 EVENTOS IA/SEMANA',
      monthlyLabel: '(800 al mes)',
      subtitle: 'Para familias PRO.',
      features: ['Todo lo del plan Basic', 'Hasta 20 Miembros', 'Sincronización Pro (5 cuentas)', 'Acceso anticipado', 'Límite IA masivo', 'Sin anuncios'],
      color: 'bg-zinc-900 dark:bg-zinc-950 text-white border-zinc-800 shadow-xl', 
      btn: 'Elegir PRO',
      btnStyle: 'bg-white text-black hover:bg-gray-100 shadow-xl'
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-black rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-zinc-800">
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
          <div className="flex flex-col">
            <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
                <Cpu className="text-blue-500" size={24} /> Planes de Inteligencia Artificial
            </h2>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest mt-1">El uso de la App es libre, solo pagas por la potencia de IA</p>
          </div>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500 hover:scale-110 transition-transform"><X size={20} /></button>
        </div>
        
        <div className="flex-1 overflow-y-auto p-8 grid md:grid-cols-3 gap-6 custom-scrollbar">
          {plans.map((plan, idx) => (
            <div key={idx} className={`relative p-8 rounded-[32px] border transition-all ${plan.color} flex flex-col hover:scale-[1.02] shadow-xl group`}>
              <div className="mb-2 flex items-center justify-between">
                <h3 className="text-xl font-bold dark:text-white">{plan.name}</h3>
                {plan.highlight && <div className="bg-blue-500 text-white text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-tighter shadow-sm">RECOMENDADO</div>}
              </div>
              
              <div className="flex items-baseline gap-1 mb-4">
                <span className="text-4xl font-black dark:text-white">{plan.price}</span>
                <span className="text-gray-500 text-sm font-medium">/mes</span>
              </div>
              
              <div className="mb-8 px-3 py-1.5 bg-black/5 dark:bg-white/5 rounded-xl border border-black/5 dark:border-white/5 w-fit relative">
                <span className="text-[10px] font-black text-gray-500 dark:text-gray-400 tracking-wider uppercase">{plan.limit}</span>
                <span className="absolute -bottom-4 left-0 text-[9px] font-bold text-blue-500 whitespace-nowrap">{plan.monthlyLabel}</span>
              </div>

              <ul className="space-y-3 mb-10 flex-1 pt-2">
                {plan.features.map((f, i) => (
                  <li key={i} className="flex items-start gap-2.5 text-xs text-gray-600 dark:text-gray-300 font-bold leading-tight">
                    <div className={`mt-0.5 w-4 h-4 rounded-full flex items-center justify-center shrink-0 ${plan.highlight ? 'bg-blue-500 text-white' : 'bg-green-500/20 text-green-600 dark:text-green-400'}`}>
                        <Check size={10} strokeWidth={4} />
                    </div>
                    {f}
                  </li>
                ))}
              </ul>
              
              <button className={`w-full py-4 rounded-2xl font-bold transition-all shadow-lg active:scale-95 ${plan.btnStyle}`}>
                {plan.btn}
              </button>
            </div>
          ))}
        </div>

        <div className="p-6 bg-gray-50 dark:bg-zinc-900 border-t border-gray-100 dark:border-zinc-800 text-center">
            <p className="text-xs text-gray-400 font-bold flex items-center justify-center gap-2">
                <Smartphone size={14} /> La App Family Plan es el centro gratuito de organización para tu hogar. Solo pagas si usas IA avanzada.
            </p>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
