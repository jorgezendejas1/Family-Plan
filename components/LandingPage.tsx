
import React, { useState, useEffect } from 'react';
import { 
  Smartphone, Sparkles, ShieldCheck, Zap, ChevronRight, CheckCircle2, 
  ArrowRight, MessageSquare, Menu, X, RefreshCcw, Twitter, Github, 
  Linkedin, Mail, ArrowUp, Globe, Check
} from 'lucide-react';

interface LandingPageProps {
  onGetStarted: () => void;
}

const LandingPage: React.FC<LandingPageProps> = ({ onGetStarted }) => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);

  // Manejar el cambio de estilo del Navbar al hacer scroll
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 50);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  // Función para scroll suave
  const scrollTo = (id: string) => {
    setIsMobileMenuOpen(false);
    const element = document.getElementById(id);
    if (element) {
      const offset = 80;
      const elementPosition = element.getBoundingClientRect().top + window.pageYOffset;
      const offsetPosition = elementPosition - offset;

      window.scrollTo({
        top: offsetPosition,
        behavior: 'smooth'
      });
    }
  };

  return (
    <div className="min-h-screen bg-white dark:bg-black text-gray-900 dark:text-white font-sans selection:bg-blue-100 dark:selection:bg-blue-900/30 overflow-x-hidden">
      
      {/* Navbar Re-diseñado */}
      <nav className={`fixed top-0 left-0 right-0 z-[150] transition-all duration-500 ${
        scrolled 
          ? 'bg-white/90 dark:bg-black/90 backdrop-blur-xl h-16 border-b border-gray-100 dark:border-zinc-800/50' 
          : 'bg-transparent h-24 border-b border-transparent'
      }`}>
        <div className="max-w-7xl mx-auto px-6 h-full flex items-center justify-between">
          <div className="flex items-center gap-2 group cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-10 h-10 bg-black dark:bg-white rounded-xl flex items-center justify-center transition-all group-hover:rotate-6 group-hover:scale-110 shadow-lg">
              <Smartphone size={22} className="text-white dark:text-black" />
            </div>
            <span className="text-xl font-black tracking-tighter">Family Plan</span>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-bold text-gray-500 dark:text-gray-400">
            <button onClick={() => scrollTo('features')} className="hover:text-black dark:hover:text-white transition-colors">Funciones</button>
            <button onClick={() => scrollTo('how-it-works')} className="hover:text-black dark:hover:text-white transition-colors">Cómo funciona</button>
            <button onClick={() => scrollTo('pricing')} className="hover:text-black dark:hover:text-white transition-colors">Precios</button>
            <button 
              onClick={onGetStarted} 
              className="bg-black dark:bg-white text-white dark:text-black px-6 py-3 rounded-2xl hover:scale-105 active:scale-95 transition-all shadow-xl shadow-black/10 font-black"
            >
              Iniciar Sesión
            </button>
          </div>

          <button onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)} className="md:hidden p-2 text-gray-600 dark:text-gray-300">
            {isMobileMenuOpen ? <X size={28} /> : <Menu size={28} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isMobileMenuOpen && (
          <div className="md:hidden fixed inset-0 z-[200] bg-white dark:bg-black p-6 flex flex-col gap-8 animate-fade-in pt-24">
            <button onClick={() => setIsMobileMenuOpen(false)} className="absolute top-6 right-6 p-2"><X size={32} /></button>
            <button onClick={() => scrollTo('features')} className="text-3xl font-black text-left">Funciones</button>
            <button onClick={() => scrollTo('how-it-works')} className="text-3xl font-black text-left">Cómo funciona</button>
            <button onClick={() => scrollTo('pricing')} className="text-3xl font-black text-left">Precios</button>
            <button onClick={onGetStarted} className="w-full bg-black dark:bg-white text-white dark:text-black py-6 rounded-3xl font-black text-xl shadow-2xl mt-auto">Comenzar Ahora</button>
          </div>
        )}
      </nav>

      {/* Hero Section Corregida */}
      <section className="relative pt-48 pb-32 px-6">
        {/* Luces de fondo */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-6xl h-[700px] bg-gradient-to-b from-blue-500/10 dark:from-blue-600/10 to-transparent rounded-full blur-[120px] -z-10"></div>
        <div className="absolute top-40 right-0 w-80 h-80 bg-purple-500/10 dark:bg-purple-600/10 blur-[120px] -z-10"></div>

        <div className="max-w-6xl mx-auto text-center">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-50 dark:bg-blue-900/30 border border-blue-100 dark:border-blue-800/50 text-blue-600 dark:text-blue-400 text-[11px] font-black uppercase tracking-[0.2em] mb-12 animate-fade-in-up">
            <Sparkles size={14} className="animate-pulse" />
            <span>Calendario Potenciado por IA</span>
          </div>
          
          <h1 className="text-6xl md:text-[94px] font-black tracking-tighter mb-10 leading-[0.9] animate-fade-in-up">
            Tu familia,<br/>organizada por <span className="bg-clip-text text-transparent bg-gradient-to-r from-blue-600 via-indigo-500 to-purple-600 inline-block">IA</span>
          </h1>
          
          <p className="text-xl md:text-2xl text-gray-500 dark:text-gray-400 mb-16 max-w-3xl mx-auto leading-relaxed animate-fade-in-up font-medium" style={{ animationDelay: '0.1s' }}>
            Gestiona eventos, tareas y calendarios compartidos con el poder de Gemini. Una experiencia premium diseñada para familias que valoran cada segundo.
          </p>

          <div className="flex flex-col sm:flex-row items-center justify-center gap-5 animate-fade-in-up mb-24" style={{ animationDelay: '0.2s' }}>
            <button 
              onClick={onGetStarted}
              className="w-full sm:w-auto px-14 py-7 bg-black dark:bg-white text-white dark:text-black rounded-3xl font-black text-2xl shadow-2xl shadow-black/20 hover:scale-105 active:scale-95 transition-all flex items-center justify-center gap-3 group"
            >
              Comenzar Gratis
              <ArrowRight size={26} className="group-hover:translate-x-1 transition-transform" />
            </button>
            <button className="w-full sm:w-auto px-12 py-7 bg-gray-100 dark:bg-zinc-900 text-gray-900 dark:text-white rounded-3xl font-bold text-2xl hover:bg-gray-200 dark:hover:bg-zinc-800 transition-all">
              Ver Demo
            </button>
          </div>

          {/* Mockup de Interfaz Corregido */}
          <div className="relative mt-12 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
             <div className="relative mx-auto max-w-5xl rounded-[56px] border border-gray-200/60 dark:border-zinc-800/50 bg-white dark:bg-zinc-950 p-4 shadow-[0_60px_120px_-20px_rgba(0,0,0,0.25)] dark:shadow-[0_60px_120px_-20px_rgba(0,0,0,0.7)]">
                {/* Barra de Ventana (Estilo MacOS) */}
                <div className="flex items-center gap-2 mb-4 px-4 pt-2">
                    <div className="w-3 h-3 rounded-full bg-red-400"></div>
                    <div className="w-3 h-3 rounded-full bg-yellow-400"></div>
                    <div className="w-3 h-3 rounded-full bg-green-400"></div>
                </div>
                
                <div className="overflow-hidden rounded-[42px] bg-gray-50 dark:bg-zinc-900 aspect-[16/10] relative">
                  <img 
                    src="https://images.unsplash.com/photo-1484480974693-6ca0a78fb36b?q=80&w=2072&auto=format&fit=crop" 
                    alt="Product Interface Mockup" 
                    className="w-full h-full object-cover transition-transform duration-[3s] hover:scale-110"
                  />
                  {/* Capa de acabado premium */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/20 via-transparent to-transparent pointer-events-none"></div>
                </div>

                {/* Decoración extra para el mockup */}
                <div className="absolute -bottom-12 -left-12 w-48 h-48 bg-blue-500/20 blur-[100px] -z-10 rounded-full"></div>
                <div className="absolute -top-12 -right-12 w-48 h-48 bg-purple-500/20 blur-[100px] -z-10 rounded-full"></div>
             </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-24 border-y border-gray-100 dark:border-zinc-900 bg-gray-50/50 dark:bg-zinc-950/50">
        <div className="max-w-7xl mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-12 text-center">
          {[
            { label: 'Familias Activas', value: '10k+' },
            { label: 'Eventos Creados', value: '500k' },
            { label: 'Puntuación App Store', value: '4.9/5' },
            { label: 'Uptime Cloud', value: '99.9%' }
          ].map((stat, i) => (
            <div key={i} className="space-y-2">
              <div className="text-5xl font-black tracking-tighter">{stat.value}</div>
              <div className="text-[10px] text-gray-400 font-black uppercase tracking-[0.2em]">{stat.label}</div>
            </div>
          ))}
        </div>
      </section>

      {/* Features Section */}
      <section id="features" className="py-40 px-6 scroll-mt-20">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-24">
            <h2 className="text-5xl md:text-7xl font-black mb-10 tracking-tight leading-[0.95]">Diseñado para el ritmo <br/> de la vida real</h2>
            <p className="text-gray-500 dark:text-gray-400 text-xl max-w-2xl mx-auto font-medium">Eliminamos el estrés de la organización con herramientas inteligentes que trabajan para ti.</p>
          </div>

          <div className="grid md:grid-cols-3 gap-12">
            {[
              { 
                icon: <MessageSquare size={36} />, 
                color: 'bg-blue-600',
                title: 'Chat con Gemini', 
                desc: 'No más formularios aburridos. Solo di "Cena el jueves a las 9" y nuestra IA agendará todo con precisión absoluta.' 
              },
              { 
                icon: <ShieldCheck size={36} />, 
                color: 'bg-indigo-600',
                title: 'Privacidad Total', 
                desc: 'Tus datos están aislados y encriptados. Tú eres el único dueño de tu información familiar.' 
              },
              { 
                icon: <RefreshCcw size={36} />, 
                color: 'bg-purple-600',
                title: 'Multicuentas Sync', 
                desc: 'Sincroniza todas tus cuentas de Google en una sola vista coherente y limpia. Olvida los solapamientos.' 
              }
            ].map((f, i) => (
              <div key={i} className="p-12 rounded-[56px] bg-gray-50 dark:bg-zinc-900/50 border border-transparent hover:border-blue-500/20 transition-all group">
                <div className={`w-18 h-18 ${f.color} rounded-3xl flex items-center justify-center text-white mb-10 shadow-2xl group-hover:scale-110 group-hover:rotate-6 transition-transform`}>
                  {f.icon}
                </div>
                <h3 className="text-3xl font-black mb-6 tracking-tight">{f.title}</h3>
                <p className="text-gray-500 dark:text-gray-400 text-lg leading-relaxed font-medium">{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Steps Section */}
      <section id="how-it-works" className="py-40 bg-black text-white px-6 scroll-mt-20 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[600px] h-[600px] bg-blue-600/10 blur-[150px] -z-10"></div>
        <div className="max-w-5xl mx-auto">
          <h2 className="text-5xl md:text-7xl font-black text-center mb-32 tracking-tight">Organización en 3 pasos</h2>
          
          <div className="space-y-32">
            {[
              { step: "01", title: "Conecta tu cuenta", desc: "Regístrate en segundos y enlaza tus calendarios existentes para tener una vista unificada.", color: "bg-white text-black" },
              { step: "02", title: "Habla con la IA", desc: "Usa el chatbot para añadir planes, subir fotos de volantes de escuela o capturas de pantalla.", color: "bg-blue-600 text-white" },
              { step: "03", title: "Relájate", desc: "Recibe recordatorios inteligentes y mantén a toda tu familia sincronizada automáticamente.", color: "bg-purple-600 text-white" }
            ].map((item, i) => (
              <div key={i} className={`flex flex-col md:flex-row items-center gap-16 ${i % 2 !== 0 ? 'md:flex-row-reverse' : ''}`}>
                <div className={`w-32 h-32 rounded-[40px] ${item.color} flex items-center justify-center text-5xl font-black shrink-0 shadow-2xl animate-pulse`}>
                  {item.step}
                </div>
                <div className="text-center md:text-left max-w-lg">
                  <h4 className="text-4xl font-black mb-6 tracking-tight">{item.title}</h4>
                  <p className="text-gray-400 text-xl font-medium leading-relaxed">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="py-40 px-6 scroll-mt-20">
        <div className="max-w-5xl mx-auto p-16 md:p-32 rounded-[80px] bg-gradient-to-br from-zinc-900 to-black text-white text-center relative overflow-hidden shadow-3xl">
           <div className="absolute top-0 right-0 w-96 h-96 bg-blue-600/30 blur-[150px]"></div>
           <div className="relative z-10">
              <h2 className="text-5xl md:text-8xl font-black mb-10 tracking-tight leading-[0.9]">Empieza gratis hoy</h2>
              <p className="text-gray-400 text-2xl mb-16 max-w-2xl mx-auto font-medium">Únete a miles de familias que ya recuperaron su tiempo. El plan básico es gratuito para siempre.</p>
              <button 
                onClick={onGetStarted}
                className="px-16 py-8 bg-white text-black rounded-[40px] font-black text-3xl hover:scale-105 active:scale-95 transition-all shadow-2xl mb-16"
              >
                Crear Cuenta Gratis
              </button>
              <div className="flex flex-wrap items-center justify-center gap-12 text-sm text-gray-500 font-black uppercase tracking-[0.2em]">
                  <div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-blue-500" /> Sin tarjeta</div>
                  <div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-blue-500" /> Setup instantáneo</div>
                  <div className="flex items-center gap-3"><CheckCircle2 size={20} className="text-blue-500" /> IA Gemini Pro</div>
              </div>
           </div>
        </div>
      </section>

      {/* Footer SaaS Profesional */}
      <footer className="pt-32 pb-16 bg-white dark:bg-black border-t border-gray-100 dark:border-zinc-900 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-16 mb-24">
            <div className="col-span-2 lg:col-span-2 space-y-10">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-black dark:bg-white rounded-2xl flex items-center justify-center shadow-xl">
                  <Smartphone size={24} className="text-white dark:text-black" />
                </div>
                <span className="text-3xl font-black tracking-tighter">Family Plan</span>
              </div>
              <p className="text-gray-500 dark:text-gray-400 max-w-sm text-lg leading-relaxed font-medium">
                La plataforma de organización familiar número uno, impulsada por IA para devolverte lo más valioso: tu tiempo.
              </p>
              <div className="flex gap-5">
                {[Twitter, Github, Linkedin, Mail].map((Icon, i) => (
                  <button key={i} className="w-12 h-12 rounded-2xl border border-gray-100 dark:border-zinc-800 flex items-center justify-center text-gray-400 hover:text-black dark:hover:text-white hover:border-black dark:hover:border-white transition-all bg-gray-50 dark:bg-zinc-900/50">
                    <Icon size={22} />
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Producto</h4>
              <ul className="space-y-6 text-gray-500 font-bold text-sm">
                <li><button onClick={() => scrollTo('features')} className="hover:text-black dark:hover:text-white transition-colors">Funciones</button></li>
                <li><button onClick={() => scrollTo('how-it-works')} className="hover:text-black dark:hover:text-white transition-colors">Cómo funciona</button></li>
                <li><button onClick={() => scrollTo('pricing')} className="hover:text-black dark:hover:text-white transition-colors">Precios</button></li>
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Desktop App</button></li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Compañía</h4>
              <ul className="space-y-6 text-gray-500 font-bold text-sm">
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Sobre nosotros</button></li>
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Blog</button></li>
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Carreras</button></li>
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Legal</button></li>
              </ul>
            </div>

            <div className="space-y-8">
              <h4 className="font-black text-xs uppercase tracking-[0.2em] text-gray-400">Soporte</h4>
              <ul className="space-y-6 text-gray-500 font-bold text-sm">
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Ayuda</button></li>
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Contacto</button></li>
                <li><button className="hover:text-black dark:hover:text-white transition-colors">Estatus</button></li>
              </ul>
            </div>
          </div>

          <div className="pt-12 border-t border-gray-100 dark:border-zinc-900 flex flex-col md:flex-row justify-between items-center gap-8">
            <p className="text-gray-400 text-sm font-bold">© 2024 Family Plan Inc. Hecho con ❤️ para familias modernas.</p>
            <div className="flex gap-10 text-xs font-black text-gray-400 uppercase tracking-[0.1em]">
              <button className="hover:text-black dark:hover:text-white transition-colors">Privacidad</button>
              <button className="hover:text-black dark:hover:text-white transition-colors">Términos</button>
              <button 
                onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
                className="w-10 h-10 bg-gray-50 dark:bg-zinc-900 rounded-xl flex items-center justify-center text-gray-500 hover:text-black dark:hover:text-white transition-all shadow-sm"
              >
                <ArrowUp size={20} />
              </button>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
