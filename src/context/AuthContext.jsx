import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext({});

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Ambil session saat pertama kali aplikasi dimuat
    supabase.auth.getSession().then(({ data: { session } }) => {
      setUser(session?.user ?? null);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching session:', err);
      setLoading(false);
    });

    // Listener realtime untuk event autentikasi (SIGN_IN, SIGN_OUT, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const signUp = (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi di file .env');
    return supabase.auth.signUp({ email, password });
  };

  const signIn = (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi di file .env');
    return supabase.auth.signInWithPassword({ email, password });
  };

  const signInWithGoogle = () => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi di file .env');
    return supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/workspace`,
      },
    });
  };

  const signOut = () => {
    if (!isSupabaseConfigured) return Promise.resolve();
    return supabase.auth.signOut();
  };

  return (
    <AuthContext.Provider value={{ user, signUp, signIn, signInWithGoogle, signOut, loading, isSupabaseConfigured }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
