import React, { useState } from 'react';
import { AuthProvider, useAuth } from './context/AuthContext';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import Auth from './components/Auth';
import Dashboard from './components/Dashboard';
import LandingPage from './components/LandingPage';
import { Loader2 } from 'lucide-react';

function AppContent() {
  const { user, loading } = useAuth();
  const [currentView, setCurrentView] = useState('landing'); // 'landing' | 'auth' | 'dashboard'
  const [authIsSignUp, setAuthIsSignUp] = useState(false);

  // Cek apakah ada token session yang tersimpan di localStorage
  const hasSavedSession = typeof window !== 'undefined' && Object.keys(localStorage).some(
    k => k.startsWith('sb-') && k.endsWith('-auth-token')
  );

  // Jika pengunjung baru (tidak ada token tersimpan) dan belum login, langsung tampilkan LandingPage tanpa loading page
  if (loading && hasSavedSession) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#FBFBFA] dark:bg-[#191919]">
        <div className="flex flex-col items-center space-y-3">
          <Loader2 className="w-8 h-8 animate-spin text-neutral-500 dark:text-neutral-400" />
          <p className="text-xs text-neutral-400 dark:text-neutral-500 font-medium tracking-wide">Membuka Ersona Workspace...</p>
        </div>
      </div>
    );
  }

  // Jika pengguna sudah login, langsung tampilkan Dashboard utama
  if (user && currentView !== 'landing') {
    return <Dashboard onGoToLanding={() => setCurrentView('landing')} />;
  }

  // Jika pengguna memilih form Masuk / Daftar
  if (currentView === 'auth') {
    return (
      <Auth
        initialIsSignUp={authIsSignUp}
        onBackToHome={() => setCurrentView('landing')}
      />
    );
  }

  // Default: Tampilkan Home Page / Landing Page
  return (
    <LandingPage
      user={user}
      onStartAuth={(isSignUp) => {
        setAuthIsSignUp(Boolean(isSignUp));
        setCurrentView('auth');
      }}
      onGoToDashboard={() => setCurrentView('dashboard')}
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
