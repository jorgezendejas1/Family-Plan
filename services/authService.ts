
import { User, UserRole, PlanType } from '../types';
import { supabase } from './supabaseClient';

export const authService = {
  login: async (email: string, pass: string): Promise<User | null> => {
    if (!supabase) return null;

    const { data, error } = await supabase
      .from('users')
      .select('*')
      .eq('email', email)
      .eq('pass', pass)
      .single();

    if (error || !data) return null;
    
    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      plan: data.plan as PlanType,
      createdAt: data.created_at
    };
    
    localStorage.setItem('fp_current_user', JSON.stringify(user));
    return user;
  },

  register: async (name: string, email: string, pass: string): Promise<User | null> => {
    if (!supabase) return null;

    const id = btoa(email);
    const newUser = {
      id,
      name,
      email,
      pass,
      role: 'standard',
      plan: 'free'
    };

    const { data, error } = await supabase
      .from('users')
      .insert(newUser)
      .select()
      .single();

    if (error) return null;

    const user: User = {
      id: data.id,
      email: data.email,
      name: data.name,
      role: data.role as UserRole,
      plan: data.plan as PlanType,
      createdAt: data.created_at
    };

    localStorage.setItem('fp_current_user', JSON.stringify(user));
    return user;
  },

  getCurrentUser: (): User | null => {
    const data = localStorage.getItem('fp_current_user');
    if (!data) return null;
    try {
        return JSON.parse(data);
    } catch (e) {
        localStorage.removeItem('fp_current_user');
        return null;
    }
  },

  logout: () => {
    // 1. Limpiamos la persistencia
    localStorage.removeItem('fp_current_user');
    // 2. Forzamos recarga total para limpiar estado de React y memoria
    // Esto garantiza que el flujo de redirección sea atómico.
    window.location.reload();
  },

  getAllUsers: async (): Promise<User[]> => {
    if (!supabase) return [];
    const { data } = await supabase.from('users').select('*');
    return (data || []).map(u => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role as UserRole,
      plan: u.plan as PlanType,
      createdAt: u.created_at
    }));
  }
};
