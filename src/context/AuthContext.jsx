import React, { createContext, useContext, useEffect, useState } from 'react';
import { supabase, authAPI } from '../services/supabase';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [user, setUser]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Get initial session
    authAPI.getSession().then(session => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    // Listen for auth changes
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => subscription.unsubscribe();
  }, []);

  const value = {
    user,
    loading,
    isAdmin: authAPI.isAdmin(user),
    isLoggedIn: !!user,
    signIn:       (email, password) => authAPI.signIn(email, password),
    signUp:       (email, password, meta) => authAPI.signUp(email, password, meta),
    signOut:      () => authAPI.signOut(),
    resetPassword: (email) => authAPI.resetPassword(email),
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error('useAuth must be used inside AuthProvider');
  return ctx;
}
