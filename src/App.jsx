import React, { useState, useEffect } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeLanguageProvider, useThemeLanguage } from './context/ThemeLanguageContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import EmailVerifiedScreen from './components/EmailVerifiedScreen';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';
import { Loader2 } from 'lucide-react';

function getPathView() {
  if (typeof window === 'undefined') return 'landing';
  try {
    if (sessionStorage.getItem('ersona_auth_action') === 'recovery') return 'auth';
  } catch {}
  const path = window.location.pathname.toLowerCase();
  const hash = window.location.hash || '';
  const search = window.location.search || '';
  if (hash.includes('type=recovery') || search.includes('mode=reset') || search.includes('type=recovery')) {
    return 'auth';
  }
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  if (path === '/workspace') return 'dashboard';
  if (path === '/auth') return 'auth';
  return 'landing';
}

function AppContent() {
  const { user, loading, isPasswordRecovery, setIsPasswordRecovery, isEmailVerifiedJustNow, setIsEmailVerifiedJustNow } = useAuth();
  const { setCurrentScope } = useThemeLanguage();
  const [currentView, setCurrentView] = useState(() => getPathView());
  const [authIsSignUp, setAuthIsSignUp] = useState(false);
  const [explicitLanding, setExplicitLanding] = useState(false);

  // Periksa apakah sedang dalam alur reset password
  const isRecovery = Boolean(
    isPasswordRecovery || 
    (typeof window !== 'undefined' && (
      window.location.hash.includes('type=recovery') || 
      window.location.search.includes('mode=reset') ||
      window.location.search.includes('type=recovery') ||
      sessionStorage.getItem('ersona_auth_action') === 'recovery'
    ))
  );

  // Cek apakah ada token session yang tersimpan di localStorage
  const hasSavedSession = typeof window !== 'undefined' && Object.keys(localStorage).some(
    k => k.startsWith('sb-') && k.endsWith('-auth-token')
  );

  // Efek sinkronisasi view saat status autentikasi selesai dimuat
  useEffect(() => {
    if (loading) return;

    // Halaman publik resmi (Privacy Policy & Terms of Service) tidak boleh dialihkan ke workspace!
    const currentPath = window.location.pathname.toLowerCase();
    if (currentPath === '/privacy' || currentPath === '/terms') {
      setCurrentView(currentPath.substring(1));
      return;
    }

    // Jika sedang dalam proses reset kata sandi, JANGAN arahkan ke workspace!
    if (isRecovery) {
      setCurrentView('auth');
      if (window.location.pathname !== '/auth') {
        window.history.replaceState(null, '', '/auth?mode=reset');
      }
      return;
    }

    if (user) {
      if (!explicitLanding) {
        setCurrentView('dashboard');
        if (window.location.pathname !== '/workspace') {
          window.history.replaceState(null, '', '/workspace');
        }
      }
    } else {
      if (window.location.pathname === '/workspace') {
        setCurrentView('landing');
        window.history.replaceState(null, '', '/');
      }
    }
  }, [user, loading, explicitLanding, isRecovery]);

  // Efek sinkronisasi scope tema (Landing = light by default, Workspace = HP/system theme)
  useEffect(() => {
    if (currentView === 'dashboard') {
      setCurrentScope('workspace');
    } else {
      setCurrentScope('landing');
    }
  }, [currentView, setCurrentScope]);

  // Listener tombol browser Back / Forward (popstate)
  useEffect(() => {
    const handlePopState = () => {
      const view = getPathView();
      if (view === 'privacy' || view === 'terms') {
        setCurrentView(view);
        return;
      }
      if (view === 'dashboard' && !user) {
        setCurrentView('landing');
        window.history.replaceState(null, '', '/');
      } else {
        if (view === 'landing') setExplicitLanding(true);
        if (view === 'dashboard') setExplicitLanding(false);
        setCurrentView(view);
      }
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, [user]);

  // Navigasi manual antar halaman
  const handleGoToDashboard = () => {
    setExplicitLanding(false);
    setCurrentView('dashboard');
    window.history.pushState(null, '', '/workspace');
  };

  const handleGoToLanding = () => {
    setExplicitLanding(true);
    setCurrentView('landing');
    window.history.pushState(null, '', '/');
  };

  const handleStartAuth = (isSignUp) => {
    setAuthIsSignUp(Boolean(isSignUp));
    setCurrentView('auth');
    window.history.pushState(null, '', '/auth');
  };

  // Loading screen saat session sedang diperiksa
  if (loading && (hasSavedSession || window.location.pathname === '/workspace')) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#191919]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500 dark:text-neutral-400" />
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium tracking-wide">Membuka Ersona Workspace...</p>
        </div>
      </div>
    );
  }

  // Tampilkan layar konfirmasi verifikasi email jika pengguna baru saja mengklik tautan email
  if (isEmailVerifiedJustNow) {
    return (
      <EmailVerifiedScreen
        onRefresh={() => {
          try {
            sessionStorage.removeItem('ersona_email_verified_just_now');
          } catch {}
          if (setIsEmailVerifiedJustNow) setIsEmailVerifiedJustNow(false);
          window.location.href = '/workspace';
        }}
        onContinue={() => {
          try {
            sessionStorage.removeItem('ersona_email_verified_just_now');
          } catch {}
          if (setIsEmailVerifiedJustNow) setIsEmailVerifiedJustNow(false);
          handleGoToDashboard();
        }}
      />
    );
  }

  // Jika membuka halaman Kebijakan Privasi (Privacy Policy)
  if (currentView === 'privacy') {
    return <PrivacyPolicy onBack={handleGoToLanding} />;
  }

  // Jika membuka halaman Ketentuan Layanan (Terms of Service)
  if (currentView === 'terms') {
    return <TermsOfService onBack={handleGoToLanding} />;
  }

  // Jika pengguna memilih form Masuk / Daftar atau sedang reset password
  if (isRecovery || currentView === 'auth') {
    return (
      <Auth
        initialIsSignUp={authIsSignUp}
        initialMode={isRecovery ? 'reset' : (authIsSignUp ? 'signup' : 'signin')}
        onBackToHome={handleGoToLanding}
        onResetSuccess={() => {
          try {
            sessionStorage.removeItem('ersona_auth_action');
          } catch {}
          if (setIsPasswordRecovery) setIsPasswordRecovery(false);
          handleGoToDashboard();
        }}
      />
    );
  }

  // Jika pengguna sudah login dan view aktif adalah dashboard
  if (user && currentView === 'dashboard') {
    return <Dashboard onGoToLanding={handleGoToLanding} />;
  }

  // Default: Tampilkan Home Page / Landing Page
  return (
    <LandingPage
      user={user}
      onStartAuth={handleStartAuth}
      onGoToDashboard={handleGoToDashboard}
    />
  );
}

export default function App() {
  return (
    <ThemeLanguageProvider>
      <AuthProvider>
        <AppContent />
      </AuthProvider>
    </ThemeLanguageProvider>
  );
}
