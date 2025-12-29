
import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Sparkles, ShieldCheck, Zap, ChevronRight, CheckCircle2, 
  ArrowRight, MessageSquare, Menu, X, Globe, Check, Heart, Lock, 
  Cpu, Users, Star, ArrowDown, Layout, Shield
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 50);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    if (element) {
      const offset = 80; // Compensación por el nav fijo
      const bodyRect = document.body.getBoundingClientRect().top;
      const elementRect = element.getBoundingClientRect().top;
      const elementPosition = elementRect - bodyRect;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  const pricingPlans = [
    {
      name: 'Gratis',
      price: '$0',
      limit: '10 / semana',
      monthlyLabel: '(40 / mes)',
      subtitle: 'Para empezar.',
      features: ['Uso de App Libre', '1 Miembro Familia', 'Chat Familiar FIFO 200', 'Cifrado E2EE Real', 'Anuncios'],
      color: 'bg-white dark:bg-zinc-900 border-gray-100 dark:border-zinc-800 shadow-xl',
      buttonClass: 'bg-gray-100 dark:bg-zinc-800 text-gray-900 dark:text-white',
      accent: 'text-gray-400',
    },
    {
      name: 'Basic',
      price: '$2.99',
      limit: '50 / semana',
      monthlyLabel: '(200 / mes)',
      subtitle: 'Parejas y familias.',
      features: ['Todo lo del plan Gratis', 'Hasta 20 Miembros', 'Multi-Sincronización Google', 'Prioridad de Servidor IA', 'Sin anuncios'],
      color: 'bg-blue-600 text-white border-blue-500 shadow-2xl scale-105 z-10',
      buttonClass: 'bg-white text-blue-600 shadow-lg',
      accent: 'text-blue-200',
      highlight: true
    },
    {
      name: 'PRO',
      price: '$5.99',
      limit: '125 / semana',
      monthlyLabel: '(500 / mes)',
      subtitle: 'Uso profesional.',
      features: ['Todo lo del plan Basic', 'Capacidad IA Extendida', 'Análisis Fotos/PDFs', 'Gestión de Roles Pro', 'Soporte 24/7'],
      color: 'bg-zinc-900 dark:bg-zinc-950 text-white border-zinc-800 shadow-2xl',
      buttonClass: 'bg-blue-600 text-white shadow-lg border-none',
      accent: 'text-zinc-500'
    }
  ];

  const features = [
    {
      title: "IA Especializada",
      desc: "Nuestra IA no chatea. Está diseñada exclusivamente para entender lenguaje natural y convertirlo en eventos de calendario precisos.",
      icon: <Cpu className="text-blue-500" size={32} />
    },
    {
      title: "Privacidad Radical",
      desc: "Implementamos E2EE (End-to-End Encryption). Tus datos se cifran en tu móvil antes de tocar nuestra nube. Solo tú tienes la llave.",
      icon: <ShieldCheck className="text-green-500" size={32} />
    },
    {
      title: "Chat FIFO 200",
      desc: "Un chat que respeta tu espacio. Solo guarda los últimos 200 mensajes, forzando a que lo importante se agende en el calendario.",
      icon: <MessageSquare className="text-purple-500" size={32} />
    }
  ];

  return (
    <div className="w-full min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-blue-100 overflow-x-hidden">
      
      {/* Navigation */}
      <nav className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 ${scrolled ? 'bg-white/80 dark:bg-black/80 backdrop-blur-xl h-16 border-b border-gray-100 dark:border-zinc-800' : 'bg-transparent h-24 border-b border-transparent'}`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({top: 0, behavior: 'smooth'})}>
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center shadow-lg transition-transform group-hover:rotate-6">
              <Smartphone size={22} className="text-white dark:text-black" />
            </div>
            <span className="text-xl font-black tracking-tighter">Family Plan</span>
          </div>
          
          <div className="hidden md:flex items-center gap-8">
            <button onClick={() => scrollToSection('features')} className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors">Funciones</button>
            <button onClick={() => scrollToSection('pricing')} className="text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-colors">Planes</button>
            <button onClick={onGetStarted} className="bg-black dark:bg-white text-white dark:text-black px-6 py-2.5 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl font-black text-sm">Entrar</button>
          </div>
          
          <button className="md:hidden p-2 text-gray-500"><Menu size={24} /></button>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative pt-40 pb-24 px-6 md:pt-60 md:pb-40 text-center">
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[600px] bg-gradient-to-b from-blue-500/10 via-purple-500/5 to-transparent blur-[100px] -z-10"></div>
        
        <div className="max-w-5xl mx-auto">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] mb-10 animate-fade-in-up">
            <Shield size={14} className="text-green-500" /> Cifrado E2EE AES-256 Activo
          </div>
          
          <h1 className="text-5xl md:text-[90px] font-black tracking-tighter mb-10 leading-[0.85] animate-fade-in-up">
            Tu familia en <br/>
            <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600">perfecta sintonía.</span>
          </h1>
          
          <p className="text-lg md:text-2xl text-gray-500 dark:text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed animate-fade-in-up font-medium">
            Una cuenta única para todos. Calendario y chat <strong>libres para siempre</strong>. Potencia tu organización con IA de última generación.
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up">
            <button onClick={onGetStarted} className="w-full sm:w-auto px-12 py-6 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-xl shadow-2xl hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group">
              Empezar Gratis
              <ArrowRight size={22} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button onClick={() => scrollToSection('features')} className="w-full sm:w-auto px-12 py-6 bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white rounded-3xl font-black text-xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all">
              Ver más
            </button>
          </div>
        </div>

        {/* Visual Mockup placeholder */}
        <div className="mt-24 max-w-6xl mx-auto rounded-[40px] border border-gray-100 dark:border-zinc-800 bg-gray-50/50 dark:bg-zinc-900/50 p-4 shadow-2xl animate-fade-in-up">
            <div className="aspect-video bg-white dark:bg-black rounded-[32px] overflow-hidden flex items-center justify-center relative border border-gray-100 dark:border-zinc-800">
                <Layout size={60} className="text-gray-200 dark:text-zinc-800 animate-pulse" />
                <div className="absolute inset-0 bg-gradient-to-tr from-blue-500/5 to-purple-500/5"></div>
                <div className="absolute bottom-8 left-8 right-8 flex items-center justify-between">
                    <div className="flex gap-2">
                        <div className="w-3 h-3 rounded-full bg-red-400"></div>
                        <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                        <div className="w-3 h-3 rounded-full bg-green-400"></div>
                    </div>
                    <div className="flex items-center gap-2 px-4 py-2 bg-black/5 dark:bg-white/5 rounded-full">
                        <Sparkles size={14} className="text-blue-500" />
                        <span className="text-[10px] font-black uppercase tracking-widest text-gray-400">AI Powered Interface</span>
                    </div>
                </div>
            </div>
        </div>
      </section>

      {/* Features Grid */}
      <section id="features" className="py-32 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-3 gap-8">
            {features.map((f, i) => (
              <div key={i} className="p-12 rounded-[48px] bg-gray-50 dark:bg-zinc-900/50 border border-gray-100 dark:border-zinc-800 hover:border-blue-500/30 transition-all group">
                <div className="mb-8 p-4 bg-white dark:bg-black rounded-3xl w-fit shadow-sm group-hover:scale-110 transition-transform">
                  {f.icon}
                </div>
                <h3 className="text-2xl font-black mb-4 tracking-tight">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 font-bold leading-relaxed">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Social/Philosophy Section */}
      <section className="py-32 bg-black text-white px-6 overflow-hidden relative">
        <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/20 blur-[120px] rounded-full"></div>
        <div className="max-w-7xl mx-auto flex flex-col md:flex-row items-center gap-16">
          <div className="flex-1">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-white/10 border border-white/10 text-[10px] font-black uppercase tracking-widest mb-8">
              <Users size={14} className="text-blue-400" /> Un enfoque para la unidad familiar
            </div>
            <h2 className="text-4xl md:text-7xl font-black tracking-tighter mb-10 leading-none">
              Una cuenta.<br/>Cero complicaciones.
            </h2>
            <p className="text-xl text-gray-400 font-bold leading-relaxed mb-12">
              Basta de "invitar" a familiares. Crea una única cuenta familiar, comparte la contraseña de forma segura y todos verán lo mismo al instante. Es como un centro de mando para tu hogar.
            </p>
            <div className="grid grid-cols-2 gap-8">
                <div>
                    <span className="text-4xl font-black text-blue-500">100%</span>
                    <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Sincronizado</p>
                </div>
                <div>
                    <span className="text-4xl font-black text-purple-500">AES-256</span>
                    <p className="text-sm font-bold text-gray-500 mt-2 uppercase tracking-widest">Seguridad E2EE</p>
                </div>
            </div>
          </div>
          <div className="flex-1 relative">
            <div className="bg-gradient-to-br from-zinc-800 to-zinc-900 p-8 rounded-[48px] border border-white/10 shadow-2xl rotate-3 hover:rotate-0 transition-transform duration-500">
                <div className="space-y-4">
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-pink-500 flex items-center justify-center font-bold">M</div>
                        <div>
                            <p className="text-sm font-bold">Mamá agregó un evento</p>
                            <p className="text-[10px] text-gray-500 uppercase font-black">Hace 2 minutos</p>
                        </div>
                    </div>
                    <div className="flex items-center gap-3 p-4 bg-white/5 rounded-2xl">
                        <div className="w-10 h-10 rounded-full bg-blue-500 flex items-center justify-center font-bold">P</div>
                        <div>
                            <p className="text-sm font-bold">Papá confirmó la cena</p>
                            <p className="text-[10px] text-gray-400 uppercase font-black">Vía Chat Familiar</p>
                        </div>
                    </div>
                </div>
            </div>
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-32 px-6 bg-gray-50 dark:bg-zinc-900/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-20">
            <h2 className="text-4xl md:text-7xl font-black mb-6 tracking-tighter">Planes de Potencia IA</h2>
            <p className="text-gray-500 dark:text-gray-400 text-lg md:text-xl font-bold max-w-2xl mx-auto">
              Solo pagas por la intensidad de uso de la Inteligencia Artificial. El resto de las funciones son libres.
            </p>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 items-stretch max-w-6xl mx-auto">
            {pricingPlans.map((plan, i) => (
              <div key={i} className={`p-12 rounded-[56px] border-2 transition-all duration-500 flex flex-col relative overflow-hidden ${plan.color} ${plan.highlight ? 'hover:scale-[1.03]' : 'hover:scale-105'}`}>
                {plan.highlight && (
                  <div className="absolute top-0 right-0 bg-blue-500 px-8 py-2 rounded-bl-3xl text-[10px] font-black uppercase text-white shadow-lg">RECOMENDADO</div>
                )}
                
                <div className="mb-10">
                  <h3 className="text-2xl font-black mb-1">{plan.name}</h3>
                  <p className={`text-xs font-bold mb-6 ${plan.highlight ? 'text-blue-100' : 'text-gray-400'}`}>{plan.subtitle}</p>
                  
                  <div className="flex items-baseline gap-1">
                    <span className="text-7xl font-black tracking-tighter leading-none">{plan.price}</span>
                    <span className={`text-xl font-bold ${plan.accent}`}>/ mes</span>
                  </div>
                  
                  <div className={`mt-8 px-5 py-3 rounded-2xl w-fit font-black text-[11px] tracking-[0.1em] flex flex-col ${plan.highlight ? 'bg-blue-700 text-blue-100' : 'bg-black/5 dark:bg-white/5 text-gray-500'}`}>
                    <span>{plan.limit.toUpperCase()}</span>
                    <span className="opacity-70 text-[9px]">{plan.monthlyLabel}</span>
                  </div>
                </div>

                <ul className="space-y-5 mb-12 flex-1">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-3 text-sm font-bold">
                      <div className={`w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5 ${plan.highlight ? 'bg-blue-500 text-white' : 'bg-green-500 text-white'}`}>
                        <Check size={12} strokeWidth={4} />
                      </div>
                      <span>{feature}</span>
                    </li>
                  ))}
                </ul>

                <button 
                  onClick={onGetStarted} 
                  className={`w-full py-6 rounded-[24px] font-black text-xl transition-all active:scale-95 shadow-2xl ${plan.buttonClass}`}
                >
                  Elegir {plan.name}
                </button>
              </div>
            ))}
          </div>
          
          <div className="mt-16 text-center">
             <p className="text-sm font-bold text-gray-400 flex items-center justify-center gap-4">
                <span className="flex items-center gap-1"><Lock size={14} className="text-green-500" /> E2EE AES-256</span>
                <span className="flex items-center gap-1"><CheckCircle2 size={14} className="text-blue-500" /> Sin compromiso</span>
             </p>
          </div>
        </div>
      </section>

      {/* CTA Final */}
      <section className="py-32 px-6 text-center">
        <div className="max-w-4xl mx-auto bg-gradient-to-br from-blue-600 to-indigo-700 rounded-[64px] p-16 text-white shadow-2xl relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('https://www.transparenttextures.com/patterns/carbon-fibre.png')] opacity-10"></div>
            <h2 className="text-4xl md:text-6xl font-black mb-8 relative z-10 tracking-tighter">¿Listo para la armonía?</h2>
            <p className="text-xl text-blue-100 mb-12 relative z-10 font-bold">Únete a miles de familias que ya organizan su vida con IA.</p>
            <button onClick={onGetStarted} className="px-16 py-7 bg-white text-blue-600 rounded-[28px] font-black text-2xl shadow-xl hover:scale-105 active:scale-95 transition-all relative z-10">
                Empezar Ahora
            </button>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-20 px-6 border-t border-gray-100 dark:border-zinc-900 text-center">
        <div className="max-w-7xl mx-auto">
            <div className="flex items-center justify-center gap-2 mb-8">
                <div className="w-8 h-8 bg-black dark:bg-white rounded-lg flex items-center justify-center">
                    <Smartphone size={18} className="text-white dark:text-black" />
                </div>
                <span className="text-lg font-black tracking-tighter">Family Plan</span>
            </div>
            <p className="text-gray-400 text-sm font-bold mb-4">© 2024 Family Plan. Diseñado para la era de la IA.</p>
            <div className="flex justify-center gap-6 text-xs font-black text-gray-400 uppercase tracking-widest">
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Privacidad</a>
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Términos</a>
                <a href="#" className="hover:text-black dark:hover:text-white transition-colors">Soporte</a>
            </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
