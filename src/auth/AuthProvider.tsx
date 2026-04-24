import React, { createContext, useState, ReactNode, useEffect } from 'react';
import { STORAGE_KEYS } from '../config/storageKeys';
import { supabase } from '../lib/supabaseClient';
import { User } from '@supabase/supabase-js';
import { supabaseDataService } from '../services/supabaseDataService';

interface AuthContextType {
  isAuthenticated: boolean;
  user: User | any | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<{ error: any }>;
  logout: () => Promise<void>;
}

export const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | any | null>(null);
  const [isAuthenticated, setIsAuthenticated] = useState<boolean>(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Check active sessions and sets the user
    const checkSession = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        setUser(session?.user ?? null);
        setIsAuthenticated(!!session);
      } catch (error) {
        console.error('Error checking session:', error);
      } finally {
        setLoading(false);
      }
    };

    checkSession();

    // Listen for changes on auth state (logged in, signed out, etc.)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setIsAuthenticated(!!session);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = async (identifier: string, password: string) => {
    let email = identifier;

    // Check if identifier is a username (doesn't contain @)
    if (!identifier.includes('@')) {
      const foundEmail = await supabaseDataService.getProfileByUsername(identifier);
      if (!foundEmail) {
        return { error: { message: 'Usuário não encontrado' } };
      }
      email = foundEmail;
    }

    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (!error && data.user) {
      setIsAuthenticated(true);
      setUser(data.user);
    }
    
    return { error };
  };

  const logout = async () => {
    await supabase.auth.signOut();
    setIsAuthenticated(false);
    setUser(null);
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
};
