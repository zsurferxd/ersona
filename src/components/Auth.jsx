import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { Mail, Lock, ArrowRight, Loader2, AlertTriangle, ArrowLeft, Sun, Moon } from 'lucide-react';

export default function Auth({ onBackToHome, initialIsSignUp = false }) {
  const [isSignUp, setIsSignUp] = useState(initialIsSignUp);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { signIn, signUp, signInWithGoogle, isSupabaseConfigured } = useAuth();
  const { language, setLanguage, isDark, toggleTheme, t } = useThemeLanguage();
  const isEn = language === 'en';

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setMessage(t('auth.accountCreatedMsg'));
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || (language === 'en' ? 'An authentication error occurred.' : 'Terjadi kesalahan saat autentikasi.'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBFA] dark:bg-[#191919] transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#232323] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-sm p-6 sm:p-8 transition-all relative">
        {/* Top Bar: Tombol Kembali & Controls (Lang & Theme) */}
        <div className="flex items-center justify-between pb-3 mb-2">
          {onBackToHome ? (
            <button
              type="button"
              onClick={onBackToHome}
              className="inline-flex items-center space-x-1.5 text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer p-1 rounded-md"
            >
              <ArrowLeft className="w-3.5 h-3.5" />
              <span>{t('common.backToHome')}</span>
            </button>
          ) : <div />}

          <div className="flex items-center space-x-2">
            {/* Lang Pill */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 text-[10px] font-medium">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  language === 'id'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-1.5 py-0.5 rounded transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white font-bold shadow-2xs'
                    : 'text-neutral-400 dark:text-neutral-500 hover:text-neutral-800 dark:hover:text-neutral-200'
                }`}
              >
                EN
              </button>
            </div>

            {/* Theme Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
              title={isDark ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDark ? <Sun className="w-3 h-3 text-amber-400" /> : <Moon className="w-3 h-3 text-neutral-600" />}
            </button>
          </div>
        </div>

        {/* Supabase Not Configured Alert */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-3.5 bg-amber-50/80 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-amber-900 dark:text-amber-200 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-amber-800 dark:text-amber-300">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400" />
              <span>{t('auth.supabaseNoticeTitle')}</span>
            </div>
            <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
              {t('auth.supabaseNoticeText')}
            </p>
          </div>
        )}

        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-2xl shadow-inner border border-neutral-200/60 dark:border-neutral-700">
            🪐
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight">Ersona</h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('auth.tagline')}</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-neutral-800 dark:text-neutral-100 mb-1">
          {isSignUp ? t('auth.signUpTitle') : t('auth.signInTitle')}
        </h2>
        <p className="text-xs text-neutral-500 dark:text-neutral-400 mb-6 leading-relaxed">
          {isSignUp ? t('auth.signUpSubtitle') : t('auth.signInSubtitle')}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-xs rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-900 text-emerald-700 dark:text-emerald-300 text-xs rounded-lg">
            {message}
          </div>
        )}

        {/* Google OAuth 1-Click Button */}
        <button
          type="button"
          onClick={async () => {
            try {
              setError(null);
              await signInWithGoogle();
            } catch (err) {
              setError(err.message || 'Gagal masuk dengan Google');
            }
          }}
          disabled={loading || !isSupabaseConfigured}
          className="w-full mb-4 py-2.5 px-4 bg-white dark:bg-[#282828] hover:bg-neutral-50 dark:hover:bg-[#303030] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-xl text-xs font-semibold flex items-center justify-center space-x-2.5 shadow-2xs transition cursor-pointer disabled:opacity-50"
        >
          <svg className="w-4 h-4 shrink-0" viewBox="0 0 24 24">
            <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.06H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.94l2.85-2.22.81-.63z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.06l3.66 2.84c.87-2.6 3.3-4.52 6.16-4.52z" />
          </svg>
          <span>{isEn ? 'Continue with Google' : 'Lanjutkan dengan Google'}</span>
        </button>

        {/* Divider */}
        <div className="relative mb-5 text-center">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-neutral-200 dark:border-neutral-800" />
          </div>
          <span className="relative bg-white dark:bg-[#202020] px-3 text-[11px] text-neutral-400 dark:text-neutral-500">
            {isEn ? 'or continue with email' : 'atau masuk dengan email'}
          </span>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">{t('auth.emailLabel')}</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t('auth.emailPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 dark:focus:ring-neutral-400 transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">{t('auth.passwordLabel')}</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 dark:text-neutral-500 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder={t('auth.passwordPlaceholder')}
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 dark:bg-[#1E1E1E] text-neutral-900 dark:text-neutral-100 border border-neutral-200 dark:border-neutral-700 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 dark:focus:ring-neutral-400 transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm cursor-pointer"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? t('auth.submitSignUp') : t('auth.submitSignIn')}</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 text-center">
          <button
            type="button"
            onClick={() => {
              setIsSignUp(!isSignUp);
              setError(null);
              setMessage(null);
            }}
            className="text-xs text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition underline underline-offset-4 cursor-pointer"
          >
            {isSignUp ? t('auth.haveAccount') : t('auth.noAccount')}
          </button>
        </div>
      </div>
    </div>
  );
}
