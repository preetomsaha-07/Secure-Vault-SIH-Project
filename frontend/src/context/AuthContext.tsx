import React, { createContext, useContext, useState, useEffect } from 'react';
import { User } from '../types';
import { api } from '../api/client';

export type PersonaType = 'admin' | 'inv_a' | 'inv_b' | 'auditor';

export interface PersonaInfo {
  id: PersonaType;
  email: string;
  name: string;
  role: string;
  department: string;
  badge: string;
  summary: string;
}

export const DEMO_PERSONAS: Record<PersonaType, PersonaInfo> = {
  admin: {
    id: 'admin',
    email: 'admin@securevault.local',
    name: 'Chief Inspector Arthur Pendelton',
    role: 'ADMINISTRATOR',
    department: 'Investigation Division',
    badge: 'SV-ADM-001',
    summary: 'Full governance, case assignment, user administration, and system policy control.',
  },
  inv_a: {
    id: 'inv_a',
    email: 'inv.a@securevault.local',
    name: 'Senior Investigator Sharma',
    role: 'INVESTIGATOR',
    department: 'Investigation Division',
    badge: 'SV-INV-104',
    summary: 'Lead Investigator on CASE-2026-104 (Operation Nightshade). Full access to Case 104 evidence.',
  },
  inv_b: {
    id: 'inv_b',
    email: 'inv.b@securevault.local',
    name: 'Detective Marcus Vance',
    role: 'INVESTIGATOR',
    department: 'Cyber Crime Division',
    badge: 'SV-INV-102',
    summary: 'Assigned to CASE-2026-102. Strictly unauthorized on CASE-2026-104 (Demonstrates 403 Forbidden).',
  },
  auditor: {
    id: 'auditor',
    email: 'auditor@securevault.local',
    name: 'Inspector General Elena Rostova',
    role: 'AUDITOR',
    department: 'Legal Affairs',
    badge: 'SV-AUD-900',
    summary: 'Read-only compliance auditor. Verifies hash chains, document integrity, and security incidents.',
  },
};

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  activePersona: PersonaType;
  login: (email: string, pass: string) => Promise<void>;
  logout: () => Promise<void>;
  switchPersona: (persona: PersonaType) => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(true);
  const [activePersona, setActivePersona] = useState<PersonaType>('admin');

  // Clean up any legacy long-lived localStorage auth state on startup
  useEffect(() => {
    try {
      localStorage.removeItem('securevault_token');
      localStorage.removeItem('securevault_logged_in');
      localStorage.removeItem('securevault_active_persona');
    } catch {}
    checkSession();
  }, []);

  const checkSession = async () => {
    try {
      const res = await api.get<{ user: User }>('/auth/me');
      if (res && res.user) {
        setUser(res.user);
        if (res.user.email?.includes('inv.a')) setActivePersona('inv_a');
        else if (res.user.email?.includes('inv.b')) setActivePersona('inv_b');
        else if (res.user.email?.includes('auditor')) setActivePersona('auditor');
        else setActivePersona('admin');
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (email: string, pass: string) => {
    setIsLoading(true);
    try {
      let pKey: PersonaType = 'admin';
      if (email.includes('inv.a')) pKey = 'inv_a';
      else if (email.includes('inv.b')) pKey = 'inv_b';
      else if (email.includes('auditor')) pKey = 'auditor';

      sessionStorage.setItem('securevault_active_persona', pKey);

      const res = await api.post<{ token: string; user: User }>('/auth/login', {
        email,
        password: pass,
      });

      if (res && res.token) {
        sessionStorage.setItem('securevault_token', res.token);
      }
      if (res && res.user) {
        setUser(res.user);
      } else {
        const p = DEMO_PERSONAS[pKey];
        setUser({
          id: `user_${pKey}`,
          email: p.email,
          fullName: p.name,
          role: p.role as any,
          departmentId: 'dept_inv',
          departmentName: p.department,
          badgeNumber: p.badge,
        });
      }

      setActivePersona(pKey);
    } finally {
      setIsLoading(false);
    }
  };

  const switchPersona = async (persona: PersonaType) => {
    const p = DEMO_PERSONAS[persona];
    sessionStorage.setItem('securevault_active_persona', persona);
    await login(p.email, 'Password123!');
  };

  const logout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {}
    sessionStorage.removeItem('securevault_token');
    sessionStorage.removeItem('securevault_logged_in');
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        activePersona,
        login,
        logout,
        switchPersona,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};
