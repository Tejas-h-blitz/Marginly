import React, { createContext, useContext, useEffect, useState } from 'react';
import { useClerk, useUser } from '@clerk/react';
import { User, Workspace } from '../types/index.js';
import { isClerkConfigured } from './ClerkProviderWrapper.js';

interface AuthContextType {
  user: User | null;
  workspace: Workspace;
  isAuthenticated: boolean;
  logout: () => Promise<void>;
  setWorkspace: (workspace: Workspace) => void;
}

const DEFAULT_WORKSPACE: Workspace = {
  id: 'ws_default',
  name: 'My workspace',
  tier: 'Free'
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

interface AuthStateProps {
  children: React.ReactNode;
  workspace: Workspace;
  setWorkspace: (workspace: Workspace) => void;
}

const ClerkAuthState: React.FC<AuthStateProps> = ({ children, workspace, setWorkspace }) => {
  const { isSignedIn, user: clerkUser } = useUser();
  const { signOut } = useClerk();
  const user: User | null = clerkUser
    ? {
        id: clerkUser.id,
        name: clerkUser.fullName || clerkUser.firstName || 'Founder',
        email: clerkUser.primaryEmailAddress?.emailAddress || '',
        role: 'Founder',
        companyName: workspace.name,
        avatarUrl: clerkUser.imageUrl
      }
    : null;

  return (
    <AuthContext.Provider
      value={{
        user,
        workspace,
        isAuthenticated: isSignedIn === true,
        logout: () => signOut(),
        setWorkspace
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [workspace, setWorkspace] = useState<Workspace>(() => {
    try {
      const stored = localStorage.getItem('marginly_workspace');
      return stored ? JSON.parse(stored) : DEFAULT_WORKSPACE;
    } catch {
      return DEFAULT_WORKSPACE;
    }
  });

  useEffect(() => {
    localStorage.removeItem('marginly_auth_user');
    localStorage.setItem('marginly_workspace', JSON.stringify(workspace));
  }, [workspace]);

  if (isClerkConfigured()) {
    return (
      <ClerkAuthState workspace={workspace} setWorkspace={setWorkspace}>
        {children}
      </ClerkAuthState>
    );
  }

  return (
    <AuthContext.Provider
      value={{
        user: null,
        workspace,
        isAuthenticated: false,
        logout: async () => {},
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
