// Intercept early auth action tokens (recovery, signup, verify email) before Supabase client or React wipes the URL
try {
  if (typeof window !== 'undefined') {
    const href = window.location.href;
    const hash = window.location.hash || '';
    const search = window.location.search || '';

    if (
      hash.includes('type=recovery') || 
      search.includes('type=recovery') || 
      search.includes('mode=reset') ||
      href.includes('type=recovery')
    ) {
      sessionStorage.setItem('ersona_auth_action', 'recovery');
    } else if (
      hash.includes('type=signup') || 
      hash.includes('type=magiclink') || 
      hash.includes('type=email') || 
      hash.includes('type=email_change') ||
      search.includes('type=signup') || 
      search.includes('type=magiclink') || 
      search.includes('type=email') || 
      search.includes('type=email_change')
    ) {
      sessionStorage.setItem('ersona_auth_action', 'verify_email');
    }
  }
} catch (e) {
  console.warn('Early auth token intercept error:', e);
}

import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
import { registerServiceWorker } from './utils/pwaManager'

// Register PWA Service Worker
registerServiceWorker();

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

