import React, { useState } from 'react';
import { X, ChevronRight, ChevronLeft, Sparkles, ShieldCheck, Calendar, Layout } from 'lucide-react';

interface OnboardingModalProps {
  isOpen: boolean;
  onClose: () => void;
}

const OnboardingModal: React.FC<OnboardingModalProps> = ({ isOpen, onClose }) => {
  const [currentStep, setCurrentStep] = useState(0);

  if (!isOpen) return null;

  const steps = [
    {
      title: "Bienvenido a Family Plan",
      description: "Organiza tu vida con una experiencia rápida, moderna y potenciada por Inteligencia Artificial. Todo lo que necesitas, en un solo lugar.",
      icon: <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a5/Google_Calendar_icon_%282020%29.svg/512px-Google_Calendar_icon_%282020%29.svg.png" alt="Logo" className="w-20 h-20 mb-4" />,
      color: "bg-blue-50 dark:bg-blue-900/20"
    },
    {
      title: "Vistas Flexibles",
      description: "Cambia entre vista de Mes, Semana, Día o Agenda. Usa la barra lateral para navegar rápidamente entre fechas y gestionar tus calendarios.",
      icon: <Layout className="w-12 h-12 text-blue-600 dark:text-blue-400 mb-4" />,
      color: "bg-indigo-50 dark:bg-indigo-900/20"
    },
    {
      title: "Asistente IA Superdotado",
      description: "Usa el botón flotante con el robot 3D para chatear con Gemini. Puedes pedirle que cree eventos ('Cita mañana a las 5'), o subir fotos de volantes y capturas de pantalla para que extraiga los detalles por ti.",
      icon: <img src="https://cdn-icons-png.flaticon.com/512/8943/8943377.png" alt="Robot IA" className="w-20 h-20 mb-4 drop-shadow-lg" />,
      color: "bg-purple-50 dark:bg-purple-900/20"
    },
    {
      title: "Privacidad Primero",
      description: "Tus datos se guardan localmente en tu navegador. Si conectas tu cuenta de Google, la sincronización es directa. Tú tienes el control total.",
      icon: <ShieldCheck className="w-12 h-12 text-green-600 dark:text-green-400 mb-4" />,
      color: "bg-green-50 dark:bg-green-900/20"
    }
  ];

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep(prev => prev + 1);
    } else {
      onClose();
    }
  };

  const handlePrev = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4 transition-opacity animate-fade-in-up">
      <div className="bg-white dark:bg-gray-800 rounded-3xl shadow-2xl w-full max-w-md overflow-hidden flex flex-col relative border border-gray-100 dark:border-gray-700">
        
        {/* Close Button */}
        <button 
          onClick={onClose}
          className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors z-10"
        >
          <X size={20} />
        </button>

        {/* Content Area */}
        <div className={`flex-1 flex flex-col items-center justify-center p-8 text-center transition-all duration-300 ${steps[currentStep].color}`}>
            <div className="animate-fade-in-up flex flex-col items-center">
                {steps[currentStep].icon}
                <h2 className="text-2xl font-bold text-gray-800 dark:text-white mb-3">{steps[currentStep].title}</h2>
                <p className="text-gray-600 dark:text-gray-300 leading-relaxed">
                    {steps[currentStep].description}
                </p>
            </div>
        </div>

        {/* Footer / Navigation */}
        <div className="p-6 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 flex items-center justify-between">
            {/* Dots Indicator */}
            <div className="flex gap-2">
                {steps.map((_, idx) => (
                    <div 
                        key={idx}
                        className={`w-2.5 h-2.5 rounded-full transition-colors ${idx === currentStep ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'}`}
                    />
                ))}
            </div>

            <div className="flex gap-3">
                {currentStep > 0 && (
                    <button 
                        onClick={handlePrev}
                        className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors"
                    >
                        Anterior
                    </button>
                )}
                <button 
                    onClick={handleNext}
                    className="flex items-center gap-2 px-6 py-2 text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-full shadow-lg transition-all hover:scale-105"
                >
                    {currentStep === steps.length - 1 ? 'Empezar' : 'Siguiente'}
                    {currentStep !== steps.length - 1 && <ChevronRight size={16} />}
                </button>
            </div>
        </div>

      </div>
    </div>
  );
};

export default OnboardingModal;