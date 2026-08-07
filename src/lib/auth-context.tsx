'use client';

import { createContext, useContext } from 'react';
import { useSession } from 'next-auth/react';

interface AuthContextType {
  isAuthenticated: boolean;
  user: {
    id?: string;
    email?: string;
    name?: string;
    image?: string;
    roles?: string[];
    profileCompleted?: boolean;
  } | null;
  isLoading: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  const value: AuthContextType = {
    isAuthenticated: status === 'authenticated',
    user: session?.user
        ? {
          id: session.user.id ?? undefined,
          email: session.user.email ?? undefined,
          name: session.user.name ?? undefined,
          image: session.user.image ?? undefined,
          roles: session.user.roles,
          profileCompleted: session.user.profileCompleted,
        }
        : null,
    isLoading: status === 'loading',
  };

  return (
      <AuthContext.Provider value={value}>
              {children}
      </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within AuthProvider');
  }
  return context;
}