
import React from 'react';
import { X, Check, Zap, Star, Shield } from 'lucide-react';

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
      limit: '10 eventos/semana',
      features: ['Calendario básico', 'Sincronización local', '1 cuenta Google', 'ChatBot limitado'],
      color: 'bg-gray-50 dark:bg-zinc-900',
      btn: 'Plan actual'
    },
    {
      name: 'Basic',
      price: '$1.99',
      limit: '40 eventos/semana',
      features: ['Todo lo del plan Gratis', 'Sincronización Premium', 'Soporte prioritario', 'Límite IA ampliado'],
      color: 'bg-blue-50 dark:bg-blue-900/10 border-blue-200 dark:border-blue-900/50',
      btn: 'Subir a Basic',
      highlight: true
    },
    {
      name: 'Pro',
      price: '$4.99',
      limit: '200 eventos/semana',
      features: ['Todo lo del plan Basic', 'Sin anuncios', 'Acceso anticipado', 'Límite IA masivo'],
      color: 'bg-purple-50 dark:bg-purple-900/10 border-purple-200 dark:border-purple-900/50',
      btn: 'Subir a Pro'
    }
  ];

  return (
    <div className="fixed inset-0 z-[150] flex items-center justify-center bg-black/60 backdrop-blur-md p-4 animate-fade-in">
      <div className="bg-white dark:bg-black rounded-[40px] shadow-2xl w-full max-w-5xl overflow-hidden flex flex-col max-h-[90vh] border border-white/20 dark:border-zinc-800">
        <div className="p-6 flex items-center justify-between border-b border-gray-100 dark:border-zinc-800">
          <h2 className="text-2xl font-bold dark:text-white flex items-center gap-2">
            <Zap className="text-blue-500" fill="currentColor" size={20} />
            Mejora tu Plan SaaS
          </h2>
          <button onClick={onClose} className="p-2 bg-gray-100 dark:bg-zinc-800 rounded-full text-gray-500"><X size={20} /></button>
        </div>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          <div className="grid md:grid-cols-3 gap-6">
            {plans.map((plan, idx) => (
              <div key={idx} className={`relative p-8 rounded-[32px] border ${plan.color} flex flex-col`}>
                {plan.highlight && (
                   <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-blue-600 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-widest shadow-lg">Más popular</div>
                )}
                <div className="mb-6">
                  <h3 className="text-xl font-bold dark:text-white mb-2">{plan.name}</h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-4xl font-black dark:text-white">{plan.price}</span>
                    <span className="text-gray-500 text-sm">/mes</span>
                  </div>
                  <p className="text-blue-600 dark:text-blue-400 font-bold text-xs mt-3 bg-blue-100 dark:bg-blue-900/20 w-fit px-3 py-1 rounded-lg">
                    {plan.limit} con IA
                  </p>
                </div>
                
                <ul className="space-y-4 mb-10 flex-1">
                  {plan.features.map((f, i) => (
                    <li key={i} className="flex items-start gap-3 text-sm text-gray-600 dark:text-gray-300">
                      <div className="mt-1 w-4 h-4 rounded-full bg-green-500/10 flex items-center justify-center text-green-500 shrink-0">
                        <Check size={10} strokeWidth={3} />
                      </div>
                      {f}
                    </li>
                  ))}
                </ul>

                <button className={`w-full py-4 rounded-2xl font-bold transition-all active:scale-95 ${plan.highlight ? 'bg-blue-600 text-white shadow-xl shadow-blue-500/20' : 'bg-black dark:bg-white text-white dark:text-black'}`}>
                  {plan.btn}
                </button>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PricingModal;
