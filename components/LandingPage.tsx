
import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Sparkles, ShieldCheck, Zap, ChevronRight, CheckCircle2, 
  ArrowRight, MessageSquare, Menu, X, RefreshCcw, Twitter, Github, 
  Linkedin, Mail, ArrowUp, Globe, Check, Star, Users, Heart
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const [showScrollTop, setShowScrollTop] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
      setShowScrollTop(window.scrollY > 400);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.scrollY;
      const offsetPosition = elementPosition - offset;
      window.scrollTo({ top: offsetPosition, behavior: 'smooth' });
    }
  };

  const scrollToTop = () => window.scrollTo({ top: 0, behavior: 'smooth' });

  const pricingPlans = [
    {
      name: 'Gratis',
      price: '$0',
      limit: '10 EVENTOS IA/SEMANA',
      monthlyLabel: '(40 al mes)',
      subtitle: 'Ideal para individuos que buscan orden.',
      description: 'Acceso total a la app para toda la familia.',
      features: ['Uso de la App Ilimitado', 'Hasta 1 miembro/calendario', 'Sincronización local', '1 cuenta Google', 'IA Básica', 'Con anuncios'],
      color: 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-xl',
      buttonClass: 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white',
      accent: 'text-gray-400',
      isCurrent: true
    },
    {
      name: 'Basic',
      price: '$1.99',
      limit: '40 EVENTOS IA/SEMANA',
      monthlyLabel: '(160 al mes)',
      subtitle: 'Perfecto para parejas y estudiantes.',
      description: 'Potencia el agendamiento inteligente.',
      features: ['Todo lo del plan Gratis', 'Hasta 2 miembros/calendarios', 'Sincronización Premium (2 cuentas)', 'Soporte prioritario', 'Límite IA ampliado', 'Análisis de fotos/documentos', 'Anuncios Limitados'],
      color: 'bg-blue-600 text-white border-blue-500 shadow-2xl shadow-blue-500/30 scale-105 z-10',
      buttonClass: 'bg-white text-blue-600',
      accent: 'text-blue-200',
      highlight: true
    },
    {
      name: 'PRO',
      price: '$4.99',
      limit: '200 EVENTOS IA/SEMANA',
      monthlyLabel: '(800 al mes)',
      subtitle: 'Para familias que no se detienen.',
      description: 'Para familias que viven en el futuro.',
      features: ['Todo lo del plan Basic', 'Hasta 20 miembros/calendarios', 'Sincronización Pro (5 cuentas)', 'Acceso anticipado', 'Límite IA masivo', 'Sin anuncios'],
      color: 'bg-zinc-900 dark:bg-zinc-950 text-white border-zinc-800 shadow-2xl',
      buttonClass: 'bg-white/10 backdrop-blur-md border border-white/20 text-white',
      accent: 'text-zinc-500'
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 overflow-x-hidden">
      
      <button 
        onClick={scrollToTop}
        className={`fixed bottom-8 right-8 z-[160] p-4 bg-black dark:bg-white text-white dark:text-black rounded-2xl shadow-2xl transition-all duration-500 hover:scale-110 active:scale-90 border border-white/10 dark:border-black/10 ${showScrollTop ? 'translate-y-0 opacity-100' : 'translate-y-20 opacity-0 pointer-events-none'}`}
      >
        <ArrowUp size={24} strokeWidth={3} />
      </button>

      <nav className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 ${scrolled ? 'bg-white/90 dark:bg-black/90 backdrop-blur-xl h-16 border-b border-gray-100 dark:border-zinc-800/50' : 'bg-transparent h-24 border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={scrollToTop}>
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg">
              <Smartphone size={22} className="text-white dark:text-black" />
            </div>
            <span className="text-xl font-black tracking-tighter">Family Plan</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-gray-500 dark:text-gray-400">
            <button onClick={() => scrollTo('vision')} className="hover:text-black dark:hover:text-white transition-colors">Nuestra Visión</button>
            <button onClick={() => scrollTo('features')} className="hover:text-black dark:hover:text-white transition-colors">IA Familiar</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-black dark:hover:text-white transition-colors">Planes IA</button>
            <button onClick={onGetStarted} className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl font-black">Iniciar Sesión</button>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[200] bg-white dark:bg-black p-6 flex flex-col gap-8 animate-fade-in pt-24">
            <button onClick={() => setIsMobileMenuOpen(false)} className="text-3xl font-black text-left">Nuestra Visión</button>
            <button onClick={() => scrollTo('features')} className="text-3xl font-black text-left">IA Familiar</button>
            <button onClick={() => scrollTo('pricing')} className="text-3xl font-black text-left">Precios</button>
            <button onClick={onGetStarted} className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-3xl font-black text-xl mt-auto">Comenzar Ahora</button>
          </div>
        )}
      </nav>

      <section className="relative pt-32 pb-24 px-6 md:pt-48 md:pb-32">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[700px] bg-gradient-to-b from-blue-500/10 dark:from-blue-600/10 to-transparent rounded-full blur-[120px] -z-10"></div>

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] mb-12 animate-fade-in-up">
            <Users size={14} className="animate-pulse" />
            <span>1 Familia = 1 Cuenta</span>
          </div>
          
          <h1 className="text-5xl md:text-[94px] font-black tracking-tighter mb-10 leading-[0.9] animate-fade-in-up">
            Un solo lugar,<br/>para <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 to-purple-600 inline-block px-1">toda la familia</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed animate-fade-in-up font-medium">
            Entra con un único usuario y organiza a todos. El uso de la aplicación es <strong>libre para todos</strong>. 
            <br className="hidden md:block" /> Solo pagas por la <strong>potencia de la IA</strong> que agende por ti.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up mb-24">
            <button onClick={onGetStarted} className="w-full sm:w-auto px-14 py-7 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-2xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
              Comenzar Ahora
              <ArrowRight size={26} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      </section>

      <section id="vision" className="py-20 bg-gray-50 dark:bg-zinc-900/50">
        <div className="max-w-4xl mx-auto px-6 text-center">
            <Heart size={40} className="mx-auto mb-6 text-red-500" />
            <h2 className="text-3xl md:text-5xl font-black mb-8">Nuestra Visión</h2>
            <p className="text-lg md:text-2xl text-gray-600 dark:text-gray-300 leading-relaxed italic">
                "La idea es que una familia tenga una sola aplicación gratuita. Todos entran con la misma clave, todos ven los eventos de todos. Mamá o Papá pueden asignar tareas a los hijos sin cambiar de cuenta. El servicio premium solo aplica al uso de la IA avanzada."
            </p>
        </div>
      </section>

      <section id="features" className="py-32 md:py-40 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8 md:gap-12">
            {[
              { 
                icon: <MessageSquare size={36} />, 
                color: 'bg-blue-600',
                title: 'IA Familiar Inteligente', 
                desc: 'Envía un audio, sube una foto o escribe. Nuestra IA entiende a quién de la familia le toca cada evento. Tú solo confirmas.' 
              },
              { 
                icon: <Users size={36} />, 
                color: 'bg-indigo-600',
                title: 'Acceso Universal', 
                desc: 'Un solo acceso para todos los miembros. Visualiza en segundos la agenda consolidada sin cambiar de sesión.' 
              },
              { 
                icon: <CheckCircle2 size={36} />, 
                color: 'bg-green-600',
                title: 'Tareas Compartidas', 
                desc: 'Asigna deberes a tus hijos al instante. El uso del panel de tareas y calendarios es libre e ilimitado.' 
              }
            ].map((f, i) => (
              <div key={i} className="p-8 md:p-12 rounded-[40px] bg-white dark:bg-zinc-900 border border-gray-100 dark:border-zinc-800 hover:border-blue-500/20 transition-all group shadow-sm">
                <div className={`w-14 h-14 ${f.color} rounded-2xl flex items-center justify-center text-white mb-8 group-hover:rotate-6 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      <section id="pricing" className="py-32 md:py-40 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16 md:mb-24">
            <h2 className="text-4xl md:text-7xl font-black mb-8 tracking-tight">SaaS basado en IA</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl max-w-2xl mx-auto font-medium">
                La aplicación es 100% libre para tu hogar. El costo está vinculado a los créditos de Inteligencia Artificial que decidas consumir.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-center max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`p-10 rounded-[48px] border-2 transition-all duration-500 flex flex-col h-full relative overflow-hidden ${plan.color}`}>
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-blue-500 dark:bg-blue-400 px-6 py-1 rounded-bl-3xl text-[10px] font-black uppercase tracking-widest text-white shadow-sm z-20">
                    RECOMENDADO
                  </div>
                )}
                
                {/* Monthly Blue Label floating next to the pill */}
                <div className="absolute top-[165px] right-4 text-[11px] font-bold text-blue-500/80 pointer-events-none z-10 md:block hidden">
                  {plan.monthlyLabel}
                </div>

                <div className="mb-8">
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className={`text-xs font-bold mb-4 ${plan.highlight ? 'text-blue-100' : 'text-gray-400'}`}>{plan.subtitle}</p>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-6xl font-black tracking-tighter">{plan.price}</span>
                    <span className={`text-lg font-bold ${plan.accent}`}>/mes</span>
                  </div>
                  
                  <div className={`mt-6 px-4 py-2 rounded-2xl w-fit flex flex-col shadow-inner ${plan.highlight ? 'bg-blue-700 text-blue-100' : 'bg-black/5 dark:bg-white/5 text-gray-500 dark:text-gray-400'}`}>
                    <span className="text-[10px] font-black uppercase tracking-[0.1em]">{plan.limit}</span>
                  </div>
                </div>

                <ul className="space-y-4 mb-12 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-bold">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? 'bg-blue-500 text-white' : 'bg-green-500/80 text-white'}`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span className="leading-tight">{feature}</span>
                    </li>
                  ))}
                </ul>

                <div className="relative group">
                  {!plan.highlight && !plan.isCurrent && (
                    <div className="absolute -inset-0.5 bg-gradient-to-r from-blue-500 to-purple-600 rounded-3xl blur opacity-30 group-hover:opacity-100 transition duration-1000 group-hover:duration-200"></div>
                  )}
                  <button 
                    onClick={onGetStarted} 
                    className={`relative w-full py-5 rounded-3xl font-black text-lg transition-all active:scale-95 shadow-xl ${plan.buttonClass}`}
                  >
                    {plan.isCurrent ? 'Plan Actual' : 'Elegir Plan'}
                  </button>
                </div>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
            <p className="text-gray-400 text-sm font-bold bg-gray-50 dark:bg-zinc-900/50 inline-block px-8 py-4 rounded-full border border-gray-100 dark:border-zinc-800">
               💡 <strong>Dato importante:</strong> Todos los planes incluyen acceso ilimitado a las funciones de Calendario, Tareas y Miembros. 
            </p>
          </div>
        </div>
      </section>

      <footer className="pt-24 pb-12 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900 px-6">
        <div className="max-w-7xl mx-auto text-center">
          <p className="text-gray-400 text-sm font-bold">© 2024 Family Plan. 1 Familia, 1 App, IA de Clase Mundial.</p>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
