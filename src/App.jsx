import React, { useState, useEffect } from 'react';
import { ThemeLanguageProvider } from './context/ThemeLanguageContext';
import LandingPage from './components/LandingPage';
import PrivacyPolicy from './components/PrivacyPolicy';
import TermsOfService from './components/TermsOfService';

function getPathView() {
  if (typeof window === 'undefined') return 'landing';
  const path = window.location.pathname.toLowerCase();
  if (path === '/privacy') return 'privacy';
  if (path === '/terms') return 'terms';
  return 'landing';
}

function AppContent() {
  const [currentView, setCurrentView] = useState(() => getPathView());

  useEffect(() => {
    const path = window.location.pathname.toLowerCase();
    if (path !== '/' && path !== '/privacy' && path !== '/terms') {
      window.history.replaceState(null, '', '/');
    }

    const handlePopState = () => {
      setCurrentView(getPathView());
    };
    window.addEventListener('popstate', handlePopState);
    return () => window.removeEventListener('popstate', handlePopState);
  }, []);

  const navigateTo = (view, path) => {
    setCurrentView(view);
    if (window.location.pathname !== path) {
      window.history.pushState(null, '', path);
    }
    window.scrollTo({ top: 0, behavior: 'auto' });
  };

  if (currentView === 'privacy') {
    return <PrivacyPolicy onBack={() => navigateTo('landing', '/')} />;
  }

  if (currentView === 'terms') {
    return <TermsOfService onBack={() => navigateTo('landing', '/')} />;
  }

  return (
    <LandingPage
      onNavigatePrivacy={() => navigateTo('privacy', '/privacy')}
      onNavigateTerms={() => navigateTo('terms', '/terms')}
    />
  );
}

export default function App() {
  return (
    <ThemeLanguageProvider>
      <AppContent />
    </ThemeLanguageProvider>
  );
}
