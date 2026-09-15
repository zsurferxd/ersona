import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Mail, Lock, ArrowRight, Loader2, KeyRound, AlertTriangle } from 'lucide-react';

export default function Auth() {
  const [isSignUp, setIsSignUp] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState(null);
  const [error, setError] = useState(null);

  const { signIn, signUp, isSupabaseConfigured } = useAuth();

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    setMessage(null);

    try {
      if (isSignUp) {
        const { error: signUpError } = await signUp(email, password);
        if (signUpError) throw signUpError;
        setMessage('Akun berhasil dibuat! Silakan cek email Anda untuk konfirmasi (atau langsung login jika konfirmasi email dinonaktifkan di Supabase).');
      } else {
        const { error: signInError } = await signIn(email, password);
        if (signInError) throw signInError;
      }
    } catch (err) {
      setError(err.message || 'Terjadi kesalahan saat autentikasi.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBFA]">
      <div className="w-full max-w-md bg-white border border-neutral-200/90 rounded-2xl shadow-sm p-8 transition-all">
        {/* Supabase Not Configured Alert */}
        {!isSupabaseConfigured && (
          <div className="mb-6 p-3.5 bg-amber-50/80 border border-amber-200 text-amber-900 rounded-xl text-xs space-y-1.5">
            <div className="flex items-center space-x-1.5 font-semibold text-amber-800">
              <AlertTriangle className="w-4 h-4 text-amber-600" />
              <span>Konfigurasi Supabase Diperlukan</span>
            </div>
            <p className="text-amber-700 leading-relaxed">
              Buka file <code className="bg-amber-100/80 px-1 py-0.5 rounded font-mono">.env</code> lalu masukkan kredensial <code className="font-mono">VITE_SUPABASE_URL</code> dan <code className="font-mono">VITE_SUPABASE_ANON_KEY</code> dari dashboard proyek Supabase Anda.
            </p>
          </div>
        )}

        {/* Brand Header */}
        <div className="flex items-center space-x-3 mb-6">
          <div className="w-11 h-11 rounded-xl bg-neutral-100 flex items-center justify-center text-2xl shadow-inner border border-neutral-200/60">
            🪐
          </div>
          <div>
            <h1 className="text-xl font-bold text-neutral-900 tracking-tight">Solist</h1>
            <p className="text-xs text-neutral-500">Workspace To-Do & Catatan Minimalis</p>
          </div>
        </div>

        <h2 className="text-lg font-semibold text-neutral-800 mb-1">
          {isSignUp ? 'Buat akun baru' : 'Selamat datang kembali'}
        </h2>
        <p className="text-xs text-neutral-500 mb-6 leading-relaxed">
          {isSignUp 
            ? 'Daftar sekarang untuk mengelola jadwal dan catatan Anda dengan tenang.' 
            : 'Masuk untuk mengakses tugas dan catatan pribadi Anda.'}
        </p>

        {error && (
          <div className="mb-4 p-3 bg-red-50 border border-red-200 text-red-700 text-xs rounded-lg">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-4 p-3 bg-emerald-50 border border-emerald-200 text-emerald-700 text-xs rounded-lg">
            {message}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Email</label>
            <div className="relative">
              <Mail className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="nama@email.com"
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition"
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-neutral-600 mb-1">Password</label>
            <div className="relative">
              <Lock className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Minimal 6 karakter"
                className="w-full pl-9 pr-3 py-2 text-sm bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-neutral-800 focus:bg-white transition"
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading || !isSupabaseConfigured}
            className="w-full mt-2 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-medium py-2.5 px-4 rounded-lg flex items-center justify-center space-x-2 transition disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
          >
            {loading ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <>
                <span>{isSignUp ? 'Daftar Akun' : 'Masuk'}</span>
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
            className="text-xs text-neutral-600 hover:text-neutral-900 transition underline underline-offset-4"
          >
            {isSignUp ? 'Sudah punya akun? Masuk di sini' : 'Belum punya akun? Buat akun baru'}
          </button>
        </div>
      </div>
    </div>
  );
}
