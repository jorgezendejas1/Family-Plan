
import { User, UserRole, PlanType } from '../types';

const INITIAL_USERS: any[] = [
  // Master Admins (Unlimited AI)
  { email: 'admin@familyplan.com', pass: 'admin', role: 'master', plan: 'unlimited', name: 'Admin Master' },
  { email: 'admin2@familyplan.com', pass: 'admin2', role: 'master', plan: 'unlimited', name: 'Admin Master 2' },
  { email: 'admin3@familyplan.com', pass: 'admin3', role: 'master', plan: 'unlimited', name: 'Admin Master 3' },
  
  // Family Users (Unlimited AI)
  { email: 'casa@familyplan.com', pass: 'casa', role: 'family', plan: 'unlimited', name: 'Casa Principal' },
  { email: 'casa1@familyplan.com', pass: 'casa1', role: 'family', plan: 'unlimited', name: 'Casa 1' },
  { email: 'casa2@familyplan.com', pass: 'casa2', role: 'family', plan: 'unlimited', name: 'Casa 2' },
  
  // Standard and Free Users
  ...Array.from({ length: 5 }, (_, i) => ({ email: `usuario0${i+1}@familyplan.com`, pass: `clave0${i+1}`, role: 'standard', plan: 'basic', name: `Usuario ${i+1}` })),
  ...Array.from({ length: 5 }, (_, i) => ({ email: `usuario0${i+6}@familyplan.com`, pass: `clave0${i+6}`, role: 'standard', plan: 'pro', name: `Usuario ${i+6}` })),
  ...Array.from({ length: 5 }, (_, i) => ({ email: `gratis0${i+1}@familyplan.com`, pass: `gratis0${i+1}`, role: 'free', plan: 'free', name: `Gratis ${i+1}` }))
];

const getStoredUsers = (): any[] => {
  const stored = localStorage.getItem('fp_all_users');
  if (stored) return JSON.parse(stored);
  localStorage.setItem('fp_all_users', JSON.stringify(INITIAL_USERS));
  return INITIAL_USERS;
};

export const authService = {
  login: (email: string, pass: string): User | null => {
    const users = getStoredUsers();
    const found = users.find(u => u.email === email && u.pass === pass);
    if (!found) return null;
    
    const user: User = {
      id: btoa(found.email),
      email: found.email,
      name: found.name,
      role: found.role as UserRole,
      plan: found.plan as PlanType,
      createdAt: new Date().toISOString()
    };
    
    localStorage.setItem('fp_current_user', JSON.stringify(user));
    return user;
  },

  register: (name: string, email: string, pass: string): User | null => {
    const users = getStoredUsers();
    if (users.find(u => u.email === email)) return null;

    const newUser = {
      name,
      email,
      pass,
      role: 'standard',
      plan: 'free',
      createdAt: new Date().toISOString()
    };

    const updatedUsers = [...users, newUser];
    localStorage.setItem('fp_all_users', JSON.stringify(updatedUsers));

    const user: User = {
      id: btoa(newUser.email),
      email: newUser.email,
      name: newUser.name,
      role: newUser.role as UserRole,
      plan: newUser.plan as PlanType,
      createdAt: newUser.createdAt
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
    localStorage.removeItem('fp_current_user');
    window.location.href = window.location.origin + window.location.pathname;
  },

  getAllUsers: (): User[] => {
    return getStoredUsers().map(u => ({
      id: btoa(u.email),
      email: u.email,
      name: u.name,
      role: u.role,
      plan: u.plan,
      createdAt: u.createdAt || '2024-01-01T00:00:00Z'
    }));
  }
};
