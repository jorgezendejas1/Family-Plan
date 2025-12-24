
import React, { useState, useEffect } from 'react';
import { Shield, Zap, User as UserIcon, MoreVertical, Loader2 } from 'lucide-react';
import { authService } from '../services/authService';
import { User } from '../types';

const UserManagement: React.FC = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
        const data = await authService.getAllUsers();
        setUsers(data);
        setLoading(false);
    };
    load();
  }, []);

  const getPlanBadge = (plan: string) => {
    switch(plan) {
      case 'unlimited': return <span className="px-2 py-1 bg-purple-100 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 text-[10px] font-bold rounded-full border border-purple-200 dark:border-purple-800 uppercase">Ilimitado</span>;
      case 'pro': return <span className="px-2 py-1 bg-blue-100 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 text-[10px] font-bold rounded-full border border-blue-200 dark:border-blue-800 uppercase">Premium $4.99</span>;
      case 'basic': return <span className="px-2 py-1 bg-green-100 dark:bg-green-900/30 text-green-600 dark:text-green-400 text-[10px] font-bold rounded-full border border-green-200 dark:border-green-800 uppercase">Basic $1.99</span>;
      default: return <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-gray-500 text-[10px] font-bold rounded-full border border-gray-200 dark:border-gray-700 uppercase">Gratis</span>;
    }
  };

  return (
    <div className="h-full flex flex-col bg-white dark:bg-zinc-950 p-6">
      <div className="mb-8">
        <h2 className="text-2xl font-bold dark:text-white tracking-tight">Gestión de Usuarios</h2>
        <p className="text-gray-500 text-sm mt-1">Panel administrativo Cloud para control de planes SaaS</p>
      </div>

      <div className="flex-1 overflow-hidden border border-gray-100 dark:border-zinc-800 rounded-[32px] relative">
        {loading ? (
            <div className="absolute inset-0 flex items-center justify-center bg-white/50 dark:bg-black/50 backdrop-blur-sm z-20">
                <Loader2 className="animate-spin text-blue-500" size={32} />
            </div>
        ) : null}
        
        <div className="overflow-x-auto h-full custom-scrollbar">
          <table className="w-full text-left border-collapse">
            <thead className="sticky top-0 bg-gray-50 dark:bg-zinc-900 z-10 border-b border-gray-100 dark:border-zinc-800">
              <tr>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Usuario</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Plan Actual</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Rol</th>
                <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Acciones</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-50 dark:divide-zinc-900">
              {users.map(user => (
                <tr key={user.id} className="hover:bg-gray-50/50 dark:hover:bg-white/5 transition-colors">
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 rounded-full bg-gray-100 dark:bg-zinc-800 flex items-center justify-center text-gray-500">
                        <UserIcon size={20} />
                      </div>
                      <div>
                        <p className="text-sm font-bold dark:text-white">{user.name}</p>
                        <p className="text-xs text-gray-400">{user.email}</p>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    {getPlanBadge(user.plan)}
                  </td>
                  <td className="px-6 py-4">
                    <div className="flex items-center gap-2 text-xs text-gray-500 dark:text-gray-400">
                       {user.role === 'master' ? <Shield size={14} className="text-orange-500" /> : <UserIcon size={14} />}
                       <span className="capitalize">{user.role}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4">
                    <button className="p-2 text-gray-400 hover:bg-gray-100 dark:hover:bg-zinc-800 rounded-xl transition-colors">
                      <MoreVertical size={18} />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;
