import { createContext, useContext, useEffect, useState } from 'react';
import { supabase, isSupabaseConfigured } from '../lib/supabaseClient';

const AuthContext = createContext({});

const checkIsRecoveryMode = () => {
  if (typeof window === 'undefined') return false;
  try {
    if (sessionStorage.getItem('ersona_auth_action') === 'recovery') return true;
  } catch {}
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  return hash.includes('type=recovery') || search.includes('mode=reset') || search.includes('type=recovery');
};

export const AuthProvider = ({ children }) => {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [isPasswordRecovery, setIsPasswordRecovery] = useState(checkIsRecoveryMode);
  const [isEmailVerifiedJustNow, setIsEmailVerifiedJustNow] = useState(() => {
    try {
      return sessionStorage.getItem('ersona_email_verified_just_now') === 'true';
    } catch {
      return false;
    }
  });

  useEffect(() => {
    if (!isSupabaseConfigured) {
      setLoading(false);
      return;
    }

    // Helper untuk memverifikasi akun jika user datang dari link konfirmasi email
    const handleAutoVerifyIfPending = async (sessionUser) => {
      if (!sessionUser) return sessionUser;
      try {
        const action = sessionStorage.getItem('ersona_auth_action');
        if (action === 'verify_email') {
          sessionStorage.removeItem('ersona_auth_action');
          const { data, error } = await supabase.auth.updateUser({
            data: { ersona_verified: true }
          });
          if (!error && data?.user) {
            sessionStorage.setItem('ersona_email_verified_just_now', 'true');
            setIsEmailVerifiedJustNow(true);
            sessionStorage.removeItem('ersona_unverified_banner_dismissed');
            return data.user;
          }
        }
      } catch (err) {
        console.error('Error auto-verifying user email:', err);
      }
      return sessionUser;
    };

    // Ambil session saat pertama kali aplikasi dimuat
    supabase.auth.getSession().then(async ({ data: { session } }) => {
      let activeUser = session?.user ?? null;
      if (activeUser) {
        // Ambil data user segar langsung dari server Supabase agar selalu sinkron jika user memverifikasi dari perangkat lain (HP)
        try {
          const { data: serverUserData, error: serverUserErr } = await supabase.auth.getUser();
          if (!serverUserErr && serverUserData?.user) {
            activeUser = serverUserData.user;
          }
        } catch (e) {
          console.warn('Could not fetch server user on mount:', e);
        }
        activeUser = await handleAutoVerifyIfPending(activeUser);
      }
      setUser(activeUser);
      setLoading(false);
    }).catch((err) => {
      console.error('Error fetching session:', err);
      setLoading(false);
    });

    // Listener realtime untuk event autentikasi (SIGN_IN, SIGN_OUT, PASSWORD_RECOVERY, TOKEN_REFRESHED)
    const { data: { subscription } } = supabase.auth.onAuthStateChange(async (event, session) => {
      if (event === 'PASSWORD_RECOVERY') {
        setIsPasswordRecovery(true);
        try {
          sessionStorage.setItem('ersona_auth_action', 'recovery');
        } catch {}
      }

      let activeUser = session?.user ?? null;
      if (activeUser) {
        activeUser = await handleAutoVerifyIfPending(activeUser);
      }

      setUser(activeUser);
      setLoading(false);
    });

    // Auto-sync lintas perangkat: saat user berpindah tab atau fokus kembali ke tab PC
    const handleTabSync = async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user) {
          const { data: serverData, error } = await supabase.auth.getUser();
          if (!error && serverData?.user) {
            setUser((prev) => {
              if (JSON.stringify(prev?.user_metadata) !== JSON.stringify(serverData.user.user_metadata)) {
                return serverData.user;
              }
              return prev;
            });
          }
        }
      } catch {}
    };

    window.addEventListener('focus', handleTabSync);
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') handleTabSync();
    };
    document.addEventListener('visibilitychange', handleVisibility);

    // Polling aktif setiap 3 detik jika akun belum terverifikasi, agar PC otomatis langsung terverifikasi begitu link diklik di HP
    const pollInterval = setInterval(async () => {
      try {
        const { data: { session } } = await supabase.auth.getSession();
        if (session?.user && session.user.user_metadata?.ersona_verified !== true) {
          const { data, error } = await supabase.auth.getUser();
          if (!error && data?.user) {
            if (data.user.user_metadata?.ersona_verified === true) {
              setUser(data.user);
              clearInterval(pollInterval);
            }
          }
        }
      } catch {}
    }, 3000);

    return () => {
      subscription.unsubscribe();
      window.removeEventListener('focus', handleTabSync);
      document.removeEventListener('visibilitychange', handleVisibility);
      clearInterval(pollInterval);
    };
  }, []);

  const refreshUser = async () => {
    if (!isSupabaseConfigured) return null;
    try {
      const { data, error } = await supabase.auth.getUser();
      if (!error && data?.user) {
        setUser(data.user);
        return data.user;
      }
    } catch (err) {
      console.warn('Error refreshing user from server:', err);
    }
    return null;
  };

  const signUp = (email, password) => {
    if (!isSupabaseConfigured) throw new Error('Supabase belum dikonfigurasi di file .env');
    return supabase.auth.signUp({ 
      email, 
      password,
      options: {
        data: {
          ersona_verified: false,
        },
        emailRedirectTo: `${window.location.origin}/workspace?type=signup`,
      }
    });
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
    <AuthContext.Provider value={{ 
      user, 
      refreshUser,
      signUp, 
      signIn, 
      signInWithGoogle, 
      signOut, 
      loading, 
      isSupabaseConfigured,
      isPasswordRecovery,
      setIsPasswordRecovery,
      isEmailVerifiedJustNow,
      setIsEmailVerifiedJustNow,
    }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => useContext(AuthContext);
