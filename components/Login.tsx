
import React, { useState } from 'react';
import { Smartphone, Lock, Mail, ChevronRight, AlertCircle, User as UserIcon, ArrowLeft, Loader2 } from 'lucide-react';
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
        if (user) {
          onLogin(user);
        } else {
          setError('El email ya está registrado o error de conexión.');
        }
      } else {
        const user = await authService.login(email, pass);
        if (user) {
          onLogin(user);
        } else {
          setError('Credenciales inválidas o error de conexión.');
        }
      }
    } catch (err) {
      setError('Ocurrió un error inesperado.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-gray-50 dark:bg-black font-sans">
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
          <div className="w-16 h-16 bg-black dark:bg-white rounded-[20px] flex items-center justify-center shadow-2xl mb-6 transition-transform hover:scale-110">
            <Smartphone size={32} className="text-white dark:text-black" />
          </div>
          <h1 className="text-3xl font-bold text-gray-900 dark:text-white tracking-tight">
            {isRegistering ? 'Crear Cuenta' : 'Family Plan'}
          </h1>
          <p className="text-gray-500 mt-2 text-sm text-center">
            {isRegistering ? 'Únete a la mejor experiencia' : 'Ingresa a tu calendario premium'}
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {isRegistering && (
            <div className="relative group">
              <UserIcon className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
              <input 
                type="text" placeholder="Nombre completo" required disabled={loading}
                className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
                value={name} onChange={(e) => setName(e.target.value)}
              />
            </div>
          )}

          <div className="relative group">
            <Mail className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="email" placeholder="Email" required disabled={loading}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
              value={email} onChange={(e) => setEmail(e.target.value)}
            />
          </div>

          <div className="relative group">
            <Lock className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-blue-500 transition-colors" size={18} />
            <input 
              type="password" placeholder="Contraseña" required disabled={loading}
              className="w-full bg-white dark:bg-zinc-900 border border-gray-200 dark:border-zinc-800 rounded-2xl py-4 pl-12 pr-4 text-sm font-medium outline-none focus:ring-4 focus:ring-blue-500/10 transition-all dark:text-white"
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
            className="w-full bg-black dark:bg-white text-white dark:text-black rounded-2xl py-4 font-bold flex items-center justify-center gap-2 hover:scale-[1.02] active:scale-95 transition-all shadow-xl mt-6 group disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={20} /> : (isRegistering ? 'Crear mi cuenta' : 'Continuar')}
            {!loading && <ChevronRight size={18} className="group-hover:translate-x-1 transition-transform" />}
          </button>
        </form>

        <div className="mt-8 text-center">
          <button 
            onClick={() => { setIsRegistering(!isRegistering); setError(''); }}
            className="text-sm font-semibold text-blue-600 dark:text-blue-400 hover:underline transition-all"
          >
            {isRegistering ? '¿Ya tienes una cuenta? Inicia sesión' : '¿No tienes cuenta? Regístrate ahora'}
          </button>
        </div>
      </div>
    </div>
  );
};

export default Login;
