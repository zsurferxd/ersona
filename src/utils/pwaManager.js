/**
 * PWA Helper & Install Prompt Manager for Ersona
 */

let deferredInstallPrompt = null;
const installListeners = new Set();

/**
 * Check if Ersona is running as an installed standalone PWA
 */
export function isPWAInstalled() {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    window.navigator.standalone === true ||
    document.referrer.includes('android-app://')
  );
}

/**
 * Register listener for when PWA installation becomes available
 */
export function onInstallAvailabilityChange(callback) {
  installListeners.add(callback);
  // Initial call
  callback(Boolean(deferredInstallPrompt));
  return () => installListeners.delete(callback);
}

function notifyListeners() {
  const isAvailable = Boolean(deferredInstallPrompt);
  installListeners.forEach((cb) => {
    try {
      cb(isAvailable);
    } catch (e) {
      console.warn('Install listener error:', e);
    }
  });
}

// Global listener for Chrome/Edge/Android beforeinstallprompt event
if (typeof window !== 'undefined') {
  window.addEventListener('beforeinstallprompt', (e) => {
    // Prevent default mini-infobar
    e.preventDefault();
    deferredInstallPrompt = e;
    notifyListeners();
  });

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null;
    notifyListeners();
    console.log('[Ersona] PWA was successfully installed');
  });
}

/**
 * Trigger the native PWA install prompt
 * @returns {Promise<'accepted'|'dismissed'|'unavailable'>}
 */
export async function promptPWAInstall() {
  if (!deferredInstallPrompt) {
    return 'unavailable';
  }

  try {
    await deferredInstallPrompt.prompt();
    const choice = await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    notifyListeners();
    return choice.outcome;
  } catch (err) {
    console.warn('[Ersona] PWA install prompt failed:', err);
    return 'dismissed';
  }
}

/**
 * Register Service Worker
 */
export function registerServiceWorker() {
  if (typeof window === 'undefined' || !('serviceWorker' in navigator)) return;

  window.addEventListener('load', () => {
    navigator.serviceWorker
      .register('/sw.js')
      .then((reg) => {
        console.log('[Ersona] Service Worker registered, scope:', reg.scope);
      })
      .catch((err) => {
        console.warn('[Ersona] Service Worker registration failed:', err);
      });
  });
}
