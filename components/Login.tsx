
import React, { useState } from 'react';
import { Smartphone, Lock, Mail, ChevronRight, AlertCircle, User as UserIcon, ArrowLeft, Loader2, Zap, Shield, Crown } from 'lucide-react';
import { authService } from '../services/authService';

interface LoginProps {
  onLogin: (user: any) => void;
  onBack: () => void;
}

const Login: React.FC<LoginProps> = ({ onLogin, onBack }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [loading, setLoading] = useState(false);
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [pass, setPass] = useState('');
  const [error, setError] = useState('');

  const testUserGroups = [
    {
      title: 'Master (Admin)',
      icon: <Crown size={12} className="text-yellow-500" />,
      users: [
        { label: 'Admin 1', email: 'admin@familyplan.com', pass: 'admin' },
        { label: 'Admin 2', email: 'admin2@familyplan.com', pass: 'admin2' }
      ]
    },
    {
      title: 'Usuarios de Casa',
      icon: <Shield size={12} className="text-blue-500" />,
      users: [
        { label: 'Casa 1', email: 'casa@familyplan.com', pass: 'casa' },
        { label: 'Casa 2', email: 'casa2@familyplan.com', pass: 'casa2' }
      ]
    },
    {
      title: 'Planes Premium (SaaS)',
      icon: <Zap size={12} className="text-purple-500" />,
      users: [
        { label: 'Pro 1', email: 'pro@familyplan.com', pass: 'pro' },
        { label: 'Pro 2', email: 'pro2@familyplan.com', pass: 'pro2' },
        { label: 'Basic 1', email: 'basic@familyplan.com', pass: 'basico' },
        { label: 'Basic 2', email: 'basic2@familyplan.com', pass: 'basico2' }
      ]
    },
    {
      title: 'Plan Free',
      icon: <UserIcon size={12} className="text-gray-400" />,
      users: [
        { label: 'Gratis 1', email: 'gratis@familyplan.com', pass: 'gratis' },
        { label: 'Gratis 2', email: 'gratis2@familyplan.com', pass: 'gratis2' }
      ]
    }
  ];

  const handleTestUserClick = (userEmail: string, userPass: string) => {
    setEmail(userEmail);
    setPass(userPass);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      if (isRegistering) {
        if (!name.trim()) {
          setError('Por favor, ingresa tu nombre.');
          setLoading(false);
          return;
        }
        const user = await authService.register(name, email, pass);
        if (user) onLogin(user);
        else setError('El email ya está registrado o error de conexión.');
      } else {
        const user = await authService.login(email, pass);
        if (user) onLogin(user);
        else setError('Credenciales inválidas o error de conexión.');
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-50 dark:bg-black font-sans overflow-y-auto py-10">
      <button 
        onClick={onBack}
        className="absolute top-8 left-8 flex items-center gap-2 text-sm font-bold text-gray-500 hover:text-black dark:hover:text-white transition-all group"
      >
        <div className="p-2 rounded-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 shadow-sm group-hover:scale-110 transition-transform">
          <ArrowLeft size={18} />
        </div>
        <span>Regresar</span>
      </button>

      <div className="w-full max-w-sm px-6 animate-scale-in">
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-black dark:bg-white rounded-[22px] flex items-center justify-center shadow-2xl mb-6 transition-transform hover:scale-110">
            <Smartphone size={32} className="text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">Family Plan</h1>
          <p className="text-gray-500 mt-2 text-sm text-center">Inicia sesión para gestionar tu hogar</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-3">
          {isRegistering && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" placeholder="Nombre completo" required disabled={loading}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="email" placeholder="Email" required disabled={loading}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="password" placeholder="Contraseña" required disabled={loading}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-bold outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
              value={pass} onChange={(e) => setPass(e.target.value)}
            />
          </div>

          {error && (
            <div className="flex items-center gap-2 text-red-500 text-xs font-bold px-1 animate-shake">
              <AlertCircle size={14} />
              <span>{error}</span>
            </div>
          )}

          <button 
            type="submit" disabled={loading}
            className="w-full bg-black dark:bg-white text-white dark:text-black rounded-2xl py-4 font-black flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl mt-4 group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Crear mi cuenta' : 'Iniciar Sesión')}
            {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        {!isRegistering && (
          <div className="mt-8 p-5 border border-gray-200 dark:border-zinc-800 rounded-[32px] bg-white dark:bg-zinc-900/50 shadow-inner max-h-[350px] overflow-y-auto custom-scrollbar">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-[0.2em] mb-4 px-1 sticky top-0 bg-white dark:bg-zinc-900 py-1 z-10">Laboratorio de Pruebas</p>
            
            <div className="space-y-6">
              {testUserGroups.map((group) => (
                <div key={group.title}>
                  <div className="flex items-center gap-2 mb-3 px-1">
                    {group.icon}
                    <span className="text-[10px] font-bold text-gray-500 uppercase">{group.title}</span>
                  </div>
                  <div className="grid grid-cols-2 gap-2">
                    {group.users.map((u) => (
                      <button
                        key={u.email}
                        type="button"
                        onClick={() => handleTestUserClick(u.email, u.pass)}
                        className="flex flex-col items-start px-3 py-2.5 bg-gray-50 dark:bg-zinc-800 border border-gray-200 dark:border-zinc-700 rounded-xl text-left hover:border-blue-500 dark:hover:border-blue-400 transition-all active:scale-95 group"
                      >
                        <span className="text-[10px] font-black text-gray-900 dark:text-white">{u.label}</span>
                        <span className="text-[8px] text-gray-400 truncate w-full">{u.email}</span>
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        <div className="mt-8 text-center pb-8">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm font-bold text-blue-600 dark:text-blue-400 hover:underline transition-all"
          >
            {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate ahora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
