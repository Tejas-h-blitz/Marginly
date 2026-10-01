import React, { createContext, useContext, useState, useEffect } from 'react';
import { User, Workspace } from '../types/index.js';

interface AuthContextType {
  user: User | null;
  workspace: Workspace;
  isAuthenticated: boolean;
  loginAsDemo: () => void;
  loginWithEmail: (email: string) => void;
  logout: () => void;
  setWorkspace: (ws: Workspace) => void;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_prod',
  name: 'Acme AI / Production',
  tier: 'Pro'
};

const DEMO_USER: User = {
  id: 'usr_founder_01',
  name: 'Alex Vance',
  email: 'alex@acme-ai.com',
  role: 'Founder & CEO',
  companyName: 'Acme AI, Inc.',
  avatarUrl: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=128&q=80'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    try {
      const stored = localStorage.getItem('marginly_auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  });

  const [workspace, setWorkspace] = useState<Workspace>(() => {
    try {
      const stored = localStorage.getItem('marginly_workspace');
      return stored ? JSON.parse(stored) : DEFAULT_WORKSPACE;
    } catch {
      return DEFAULT_WORKSPACE;
    }
  });

  useEffect(() => {
    if (user) {
      localStorage.setItem('marginly_auth_user', JSON.stringify(user));
    } else {
      localStorage.removeItem('marginly_auth_user');
    }
  }, [user]);

  useEffect(() => {
    localStorage.setItem('marginly_workspace', JSON.stringify(workspace));
  }, [workspace]);

  const loginAsDemo = () => {
    setUser(DEMO_USER);
  };

  const loginWithEmail = (email: string) => {
    const username = email.split('@')[0] || 'Founder';
    const formattedName = username.charAt(0).toUpperCase() + username.slice(1);
    setUser({
      id: `usr_${Date.now()}`,
      name: formattedName,
      email: email,
      role: 'Founder',
      companyName: 'My SaaS Studio'
    });
  };

  const logout = () => {
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isAuthenticated: !!user,
        loginAsDemo,
        loginWithEmail,
        logout,
        setWorkspace
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
