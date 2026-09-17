import React, { useState, useEffect } from 'react';
import {
  X, User, HardDrive, CheckCircle2, AlertTriangle,
  RefreshCw, Sparkles, Mail, Trash2, Sun, Moon, Globe,
  Download, FileText, Check, Image as ImageIcon, Film, Loader2, Bell, Smartphone
} from 'lucide-react';
import { formatBytes } from '../utils/storageQuota';
import { supabase } from '../lib/supabaseClient';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import {
  isNotificationSupported,
  getNotificationPermission,
  isNotificationEnabled,
  requestNotificationPermission,
  enableNotifications,
  disableNotifications,
  sendTestNotification
} from '../utils/notificationManager';
import {
  isPWAInstalled,
  promptPWAInstall,
  onInstallAvailabilityChange
} from '../utils/pwaManager';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  storageUsage,
  onRefreshStorage,
  quotaConfig,
  onToggleProTier,
  onToggleEmailVerified,
  onNavigateToTab,
  todos = [],
  notes = [],
  workspaces = [],
  activeWorkspace = null,
}) {
  if (!isOpen) return null;

  const { theme, setTheme, isDark, language, setLanguage, t } = useThemeLanguage();
  const isEn = language === 'en';

  const [notifPermission, setNotifPermission] = useState(() => getNotificationPermission());
  const [notifEnabled, setNotifEnabled] = useState(() => isNotificationEnabled());
  const [testNotifSent, setTestNotifSent] = useState(false);

  const [isInstalled, setIsInstalled] = useState(() => isPWAInstalled());
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  useEffect(() => {
    if (isOpen) {
      if (onRefreshStorage) onRefreshStorage();
      setNotifPermission(getNotificationPermission());
      setNotifEnabled(isNotificationEnabled());
      setIsInstalled(isPWAInstalled());
    }
  }, [isOpen]);

  useEffect(() => {
    const cleanup = onInstallAvailabilityChange((available) => {
      setCanInstallPWA(available);
    });
    return cleanup;
  }, []);

  const handleInstallPWA = async () => {
    const outcome = await promptPWAInstall();
    if (outcome === 'accepted') {
      setIsInstalled(true);
    } else if (outcome === 'unavailable') {
      alert(isEn 
        ? 'To install on iOS Safari, tap the Share icon and select "Add to Home Screen". On Chrome/Edge, click the install icon in the address bar.' 
        : 'Untuk memasang di iOS Safari, tekan tombol Bagikan lalu pilih "Tambah ke Layar Utama". Di Chrome/Edge PC, klik ikon pasang di bilah alamat browser.');
    }
  };

  const handleToggleNotification = async () => {
    if (!isNotificationSupported()) {
      alert(isEn ? 'Browser does not support notifications.' : 'Browser tidak mendukung notifikasi.');
      return;
    }

    if (notifPermission !== 'granted') {
      const result = await requestNotificationPermission();
      setNotifPermission(result);
      if (result === 'granted') {
        enableNotifications();
        setNotifEnabled(true);
      } else if (result === 'denied') {
        alert(isEn 
          ? 'Notification permission was denied. Please allow notifications in your browser address bar or site settings.' 
          : 'Izin notifikasi ditolak. Silakan izinkan notifikasi melalui ikon gembok di bilah alamat browser Anda.');
      }
    } else {
      if (notifEnabled) {
        disableNotifications();
        setNotifEnabled(false);
      } else {
        enableNotifications();
        setNotifEnabled(true);
      }
    }
  };

  const handleTestNotification = () => {
    sendTestNotification(isEn);
    setTestNotifSent(true);
    setTimeout(() => setTestNotifSent(false), 3000);
  };

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [exportedType, setExportedType] = useState(null);
  const [showOtpInput, setShowOtpInput] = useState(false);
  const [otpCode, setOtpCode] = useState('');
  const [isVerifyingOtp, setIsVerifyingOtp] = useState(false);
  const [otpSuccessMsg, setOtpSuccessMsg] = useState('');

  // Helper menghitung media tanpa double counting media_url vs media_items
  const getNoteItems = (n) => {
    if (Array.isArray(n.media_items) && n.media_items.length > 0) {
      return n.media_items;
    }
    if (n.media_url) {
      return [{ url: n.media_url, type: n.media_type || 'image' }];
    }
    return [];
  };

  // Set ID workspace yang dimiliki oleh user saat ini (Owner)
  const ownedWsIds = new Set((workspaces || []).filter(w => w.owner_id === user?.id).map(w => w.id));

  // Hitung kuota berbasis kuantitas file (Foto & Video)
  // Scoped ke activeWorkspace jika ada, atau ke personal + owned workspaces jika null (Opsi 2: Unified Owner Quota)
  const relevantTodos = activeWorkspace 
    ? todos.filter(t => t.workspace_id === activeWorkspace.id)
    : todos.filter(t => !t.workspace_id || ownedWsIds.has(t.workspace_id));

  const relevantNotes = activeWorkspace
    ? notes.filter(n => n.workspace_id === activeWorkspace.id)
    : notes.filter(n => !n.workspace_id || ownedWsIds.has(n.workspace_id));

  const photoCount = (relevantTodos?.filter(t => t.media_url && t.media_type !== 'video' && !t.deleted_at).length || 0) +
    (relevantNotes?.filter(n => !n.deleted_at).reduce((acc, n) => {
      return acc + getNoteItems(n).filter(m => m?.type !== 'video').length;
    }, 0) || 0);

  const videoCount = (relevantTodos?.filter(t => t.media_url && t.media_type === 'video' && !t.deleted_at).length || 0) +
    (relevantNotes?.filter(n => !n.deleted_at).reduce((acc, n) => {
      return acc + getNoteItems(n).filter(m => m?.type === 'video').length;
    }, 0) || 0);

  // Rincian pemakaian foto untuk mode pribadi (Pribadi vs Ruang Kerja yang dimiliki)
  const personalOnlyPhotoCount = (todos?.filter(t => !t.workspace_id && t.media_url && t.media_type !== 'video' && !t.deleted_at).length || 0) +
    (notes?.filter(n => !n.workspace_id && !n.deleted_at).reduce((acc, n) => {
      return acc + getNoteItems(n).filter(m => m?.type !== 'video').length;
    }, 0) || 0);
  const workspacePhotoCount = Math.max(0, photoCount - personalOnlyPhotoCount);

  const personalOnlyVideoCount = (todos?.filter(t => !t.workspace_id && t.media_url && t.media_type === 'video' && !t.deleted_at).length || 0) +
    (notes?.filter(n => !n.workspace_id && !n.deleted_at).reduce((acc, n) => {
      return acc + getNoteItems(n).filter(m => m?.type === 'video').length;
    }, 0) || 0);
  const workspaceVideoCount = Math.max(0, videoCount - personalOnlyVideoCount);

  const maxPhotos = quotaConfig?.maxPhotos ?? (quotaConfig?.isUpgraded ? 1000 : (quotaConfig?.isEmailConfirmed ? 150 : 0));
  const maxVideos = quotaConfig?.maxVideos ?? (quotaConfig?.isUpgraded ? 5 : (quotaConfig?.isEmailConfirmed ? 2 : 0));

  // Handler Ekspor Data JSON
  const handleExportJSON = () => {
    const exportData = {
      appName: 'Ersona',
      exportedAt: new Date().toISOString(),
      account: { email: user?.email, id: user?.id },
      todos: todos || [],
      notes: notes || [],
      workspaces: workspaces || [],
    };
    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ersona-backup-${new Date().toISOString().substring(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    setExportedType('json');
    setTimeout(() => setExportedType(null), 2500);
  };

  // Handler Ekspor Data CSV
  const handleExportCSV = () => {
    if (!todos || todos.length === 0) {
      alert(isEn ? 'No tasks to export.' : 'Belum ada tugas untuk diekspor.');
      return;
    }
    const headers = ['Title', 'Status', 'Priority', 'Due Date', 'Reminder Date', 'Completed', 'Created At'];
    const rows = todos.map(t => [
      `"${(t.title || '').replace(/"/g, '""')}"`,
      `"${t.status || (t.is_completed ? 'completed' : 'todo')}"`,
      `"${t.priority || 'medium'}"`,
      `"${t.due_date ? t.due_date.substring(0, 10) : ''}"`,
      `"${t.reminder_date ? t.reminder_date.substring(0, 10) : ''}"`,
      t.is_completed ? 'TRUE' : 'FALSE',
      `"${t.created_at ? t.created_at.substring(0, 10) : ''}"`
    ]);
    const csvContent = [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `ersona-tasks-${new Date().toISOString().substring(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExportedType('csv');
    setTimeout(() => setExportedType(null), 2500);
  };

  // Kalkulasi persentase kuota
  const usedBytes = storageUsage || 0;
  const maxBytes = quotaConfig?.maxBytes || 100 * 1024 * 1024;
  const usagePercent = Math.min(100, Math.max(0, (usedBytes / maxBytes) * 100));
  const remainingBytes = Math.max(0, maxBytes - usedBytes);

  // Handler Refresh Storage
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStorage();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler Kirim Kode Verifikasi ke Email (Supabase OTP / Magic Link)
  const handleSendVerificationOtp = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setEmailSentNotice(false);
    setOtpSuccessMsg('');
    try {
      const { error } = await supabase.auth.signInWithOtp({
        email: user.email,
        options: {
          shouldCreateUser: false,
          emailRedirectTo: `${window.location.origin}/workspace?type=email`,
        }
      });
      if (error) {
        const fallback = await supabase.auth.resend({
          type: 'signup',
          email: user.email,
          options: {
            emailRedirectTo: `${window.location.origin}/workspace?type=email`,
          }
        });
        if (fallback.error) throw error;
      }
      setShowOtpInput(true);
      setEmailSentNotice(true);
    } catch (err) {
      alert(isEn ? 'Failed to send verification email: ' + err.message : 'Gagal mengirim email verifikasi: ' + err.message);
    } finally {
      setResendingEmail(false);
    }
  };

  const handleVerifyOtp = async (e) => {
    e?.preventDefault();
    if (!otpCode.trim() || !user?.email) return;
    setIsVerifyingOtp(true);
    try {
      const { error } = await supabase.auth.verifyOtp({
        email: user.email,
        token: otpCode.trim(),
        type: 'email',
      });
      if (error) {
        throw error;
      }
      if (onToggleEmailVerified) {
        await onToggleEmailVerified(true);
      }
      setShowOtpInput(false);
      setOtpCode('');
      setOtpSuccessMsg(isEn ? 'Email verified! Unlocked unlimited notes, 150 photos & 2 videos.' : 'Email berhasil diverifikasi! Catatan tanpa batas, 150 foto & 2 video telah terbuka.');
      setTimeout(() => setOtpSuccessMsg(''), 4000);
    } catch (err) {
      alert(isEn ? 'Verification failed: ' + err.message : 'Verifikasi gagal: ' + err.message);
    } finally {
      setIsVerifyingOtp(false);
    }
  };

  // Handler Toggle Pro / Upgrade
  const handleToggleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await onToggleProTier(!quotaConfig?.isUpgraded);
    } finally {
      setIsUpgrading(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#202020] rounded-2xl max-w-lg w-full max-h-[90vh] shadow-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col overflow-hidden animate-scale-in transition-colors duration-200">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-[#FBFBFA] dark:bg-[#1A1A1A]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-200/70 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <User className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">{t('settings.title')}</h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">{t('settings.subtitle')}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body Konten */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-6 space-y-4 sm:space-y-5">
          
          {/* 1. KARTU PENGATURAN TEMA & BAHASA */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#262626] space-y-3">
            <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
              <Globe className="w-4 h-4 text-neutral-500" />
              <span>{t('settings.appearanceAndLang')}</span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
              {/* Pilihan Bahasa */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  {t('settings.langLabel')}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-neutral-200/70 dark:bg-neutral-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setLanguage('id')}
                    className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center space-x-1 ${
                      language === 'id'
                        ? 'bg-white dark:bg-[#333333] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🇮🇩</span>
                    <span>Indonesia</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setLanguage('en')}
                    className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center space-x-1 ${
                      language === 'en'
                        ? 'bg-white dark:bg-[#333333] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <span>🇬🇧</span>
                    <span>English</span>
                  </button>
                </div>
              </div>

              {/* Pilihan Tema */}
              <div>
                <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                  {t('settings.themeLabel')}
                </label>
                <div className="grid grid-cols-2 gap-1.5 bg-neutral-200/70 dark:bg-neutral-800 p-1 rounded-lg">
                  <button
                    type="button"
                    onClick={() => setTheme('light')}
                    className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      theme === 'light'
                        ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Sun className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t('common.lightMode')}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setTheme('dark')}
                    className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center space-x-1.5 ${
                      theme === 'dark'
                        ? 'bg-[#333333] text-white shadow-2xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                    }`}
                  >
                    <Moon className="w-3.5 h-3.5 text-blue-400" />
                    <span>{t('common.darkMode')}</span>
                  </button>
                </div>
              </div>
            </div>
          </div>

          {/* 2. KARTU PROFIL & EMAIL STATUS */}
          <div className="p-4 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/60 dark:bg-[#262626] flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 rounded-full bg-neutral-800 dark:bg-neutral-700 text-white flex items-center justify-center font-bold text-sm">
                {user?.email?.charAt(0).toUpperCase() || 'U'}
              </div>
              <div>
                <div className="text-sm font-semibold text-neutral-900 dark:text-white">{user?.email}</div>
                <div className="flex items-center space-x-2 mt-0.5">
                  {quotaConfig?.isEmailConfirmed ? (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                      <CheckCircle2 className="w-3 h-3" />
                      <span>{t('settings.emailStatusConfirmed')}</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('settings.emailStatusUnconfirmed')}</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!quotaConfig?.isEmailConfirmed && (
              <div className="flex flex-wrap items-center gap-2 self-start sm:self-center">
                <button
                  type="button"
                  onClick={handleSendVerificationOtp}
                  disabled={resendingEmail}
                  className="px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg transition font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                >
                  {resendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                  <span>{resendingEmail ? t('common.saving') : (isEn ? 'Send Verification Email' : 'Kirim Verifikasi')}</span>
                </button>
                {onToggleEmailVerified && (
                  <button
                    type="button"
                    onClick={() => onToggleEmailVerified(true)}
                    className="px-2.5 py-1.5 text-xs bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-lg transition font-medium cursor-pointer"
                    title="Verifikasi instan untuk kemudahan pengujian akun"
                  >
                    {isEn ? 'Verify Now (Test)' : 'Verif Instan (Tes)'}
                  </button>
                )}
              </div>
            )}
            {quotaConfig?.isEmailConfirmed && !quotaConfig?.isUpgraded && onToggleEmailVerified && (
              <button
                type="button"
                onClick={() => onToggleEmailVerified(false)}
                className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline cursor-pointer self-start sm:self-center"
                title="Kembalikan ke status Belum Verif untuk pengujian"
              >
                {isEn ? 'Reset to Unverified (Test)' : 'Set ke Belum Verif (Tes)'}
              </button>
            )}
          </div>

          {/* Form Masukkan Kode OTP */}
          {showOtpInput && !quotaConfig?.isEmailConfirmed && (
            <form onSubmit={handleVerifyOtp} className="p-3.5 bg-blue-50/70 dark:bg-blue-950/40 border border-blue-200 dark:border-blue-800/80 rounded-xl text-xs space-y-2.5">
              <div className="flex items-center justify-between">
                <span className="font-semibold text-blue-900 dark:text-blue-200">
                  {isEn ? 'Enter 6-Digit Verification Code' : 'Masukkan 6 Digit Kode Verifikasi'}
                </span>
                <button
                  type="button"
                  onClick={() => setShowOtpInput(false)}
                  className="text-blue-400 hover:text-blue-700 dark:hover:text-blue-200 cursor-pointer"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
              <p className="text-[11px] text-blue-800/80 dark:text-blue-300/80 leading-relaxed">
                {isEn 
                  ? `We've sent a verification code to ${user?.email}. Enter it below to unlock unlimited notes, 150 photos & 2 videos:`
                  : `Kode verifikasi telah dikirim ke ${user?.email}. Masukkan kode di bawah untuk membuka catatan tanpa batas, 150 foto & 2 video:`}
              </p>
              <div className="flex items-center space-x-2">
                <input
                  type="text"
                  maxLength="8"
                  placeholder="123456"
                  value={otpCode}
                  onChange={(e) => setOtpCode(e.target.value.trim())}
                  className="w-36 px-3 py-1.5 text-center font-mono font-bold tracking-widest text-sm bg-white dark:bg-[#1f1f1f] border border-blue-300 dark:border-blue-700 rounded-lg text-neutral-900 dark:text-white focus:outline-none"
                />
                <button
                  type="submit"
                  disabled={isVerifyingOtp || !otpCode.trim()}
                  className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-medium rounded-lg disabled:opacity-50 transition cursor-pointer flex items-center space-x-1.5"
                >
                  {isVerifyingOtp && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                  <span>{isEn ? 'Verify' : 'Verifikasi'}</span>
                </button>
              </div>
            </form>
          )}

          {otpSuccessMsg && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400" />
              <span>{otpSuccessMsg}</span>
            </div>
          )}

          {emailSentNotice && !showOtpInput && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('settings.emailSentNotice')}</span>
            </div>
          )}

          {/* 3. BATAS KUOTA FOTO & VIDEO (MEDIA QUOTA) */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#252525] space-y-3.5 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <ImageIcon className="w-4 h-4 text-blue-500" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {quotaConfig?.isWorkspacePool 
                    ? (isEn ? `Team Media Pool (${quotaConfig.workspaceName || 'Workspace'})` : `Pool Media Tim (${quotaConfig.workspaceName || 'Ruang Kerja'})`)
                    : (isEn ? 'Personal Media Limits (Photos & Videos)' : 'Batas Lampiran Foto & Video')}
                </h3>
              </div>
              <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200/60 dark:border-neutral-700">
                {isEn ? (quotaConfig?.tierNameEn || quotaConfig?.tierName) : quotaConfig?.tierName}
              </span>
            </div>

            {quotaConfig?.isWorkspacePool && (
              <div className="text-[11px] text-blue-700 dark:text-blue-300 bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800/80 p-2.5 rounded-lg flex items-center justify-between">
                <span>
                  {isEn 
                    ? '👥 This quota is shared across all members of this Team Workspace.' 
                    : '👥 Kuota ini digunakan bersama oleh seluruh anggota di ruang kerja tim ini.'}
                </span>
                <span className="font-semibold shrink-0 ml-2">
                  {quotaConfig.isOwner ? (isEn ? 'You are Owner' : 'Anda Pemilik') : (isEn ? 'Funded by Owner' : 'Disediakan Pemilik')}
                </span>
              </div>
            )}

            {/* Photo Quota Card */}
            <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-[#202020] border border-neutral-200/70 dark:border-neutral-700/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-neutral-700 dark:text-neutral-200 font-medium">
                  <ImageIcon className="w-3.5 h-3.5 text-blue-500" />
                  <span>{isEn ? 'Photos' : 'Foto'}</span>
                </div>
                <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                  {photoCount} / {maxPhotos}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    (photoCount / maxPhotos) >= 1 ? 'bg-red-500' : (photoCount / maxPhotos) > 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                  }`}
                  style={{ width: `${Math.min(100, Math.max(2, (photoCount / maxPhotos) * 100))}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5">
                <span>
                  {!activeWorkspace && workspacePhotoCount > 0
                    ? (isEn ? `${personalOnlyPhotoCount} personal • ${workspacePhotoCount} in workspaces` : `${personalOnlyPhotoCount} pribadi • ${workspacePhotoCount} di ruang kerja tim`)
                    : (isEn ? 'Auto WebP compressor active (~200 KB/photo)' : 'Kompresi WebP otomatis aktif (~200 KB/foto)')}
                </span>
                <span>{Math.max(0, maxPhotos - photoCount)} {isEn ? 'slots left' : 'tersisa'}</span>
              </div>
            </div>

            {/* Video Quota Card */}
            <div className="p-3 rounded-xl bg-neutral-50/80 dark:bg-[#202020] border border-neutral-200/70 dark:border-neutral-700/70 space-y-2">
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center space-x-1.5 text-neutral-700 dark:text-neutral-200 font-medium">
                  <Film className="w-3.5 h-3.5 text-purple-500" />
                  <span>Video (MP4/WebM)</span>
                </div>
                <span className="font-mono font-semibold text-neutral-800 dark:text-neutral-200 text-xs">
                  {videoCount} / {maxVideos}
                </span>
              </div>
              <div className="w-full bg-neutral-200 dark:bg-neutral-700 rounded-full h-2 overflow-hidden">
                <div 
                  className={`h-full rounded-full transition-all duration-300 ${
                    maxVideos === 0 ? 'bg-neutral-300 dark:bg-neutral-600' : (videoCount / maxVideos) >= 1 ? 'bg-red-500' : 'bg-purple-500'
                  }`}
                  style={{ width: `${maxVideos > 0 ? Math.min(100, Math.max(3, (videoCount / maxVideos) * 100)) : 0}%` }}
                />
              </div>
              <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5">
                <span>
                  {!activeWorkspace && workspaceVideoCount > 0
                    ? (isEn ? `${personalOnlyVideoCount} personal • ${workspaceVideoCount} in workspaces` : `${personalOnlyVideoCount} pribadi • ${workspaceVideoCount} di ruang kerja tim`)
                    : (maxVideos === 0 
                        ? (isEn ? '🔒 Locked: verify email to unlock 2 videos' : '🔒 Terkunci: verifikasi email untuk membuka 2 video') 
                        : (isEn ? 'Max 15 MB per video/file' : 'Maksimal 15 MB per video/berkas'))}
                </span>
                <span>{maxVideos === 0 ? (isEn ? '0 video' : '0 video') : `${Math.max(0, maxVideos - videoCount)} ${isEn ? 'slots left' : 'tersisa'}`}</span>
              </div>
            </div>

            <div className="pt-2 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">{isEn ? 'Need to free up slots? Check trash.' : 'Ingin menambah kuota? Cek tempat sampah.'}</span>
              <button
                onClick={() => {
                  onClose();
                  onNavigateToTab('trash');
                }}
                className="text-xs text-red-600 dark:text-red-400 hover:underline font-medium flex items-center space-x-1 cursor-pointer"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t('dashboard.trashTab')}</span>
              </button>
            </div>
          </div>

          {/* 4. STATUS PAKET & TIER UPGRADE SECTION */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-[#FAF9F7] dark:from-[#252525] dark:to-[#212121] space-y-4">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center space-x-2">
                  <Sparkles className="w-4 h-4 text-amber-500" />
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {quotaConfig?.isUpgraded 
                      ? (isEn ? 'Ersona Pro Account' : 'Akun Ersona Pro')
                      : (isEn ? 'Account Tier Status' : 'Tingkatan Akun')}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {quotaConfig?.isUpgraded
                    ? (isEn ? 'You have unlocked the maximum quota: 1,000 photos and 5 videos.' : 'Anda menikmati batas kuota maksimal: 1.000 foto dan 5 video.')
                    : (!quotaConfig?.isEmailConfirmed
                      ? (isEn ? 'Verify your email to unlock more features!' : 'Verifikasi email Anda untuk membuka lebih banyak fitur!')
                      : (isEn ? 'Email verified! Upgrade to Pro for 1,000 photos & 5 videos.' : 'Email terverifikasi! Upgrade ke Pro untuk 1.000 foto & 5 video.'))}
                </p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                quotaConfig?.isUpgraded ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
                {quotaConfig?.isUpgraded ? 'PRO 1000' : 'FREE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-lg border ${!quotaConfig?.isEmailConfirmed && !quotaConfig?.isUpgraded ? 'border-neutral-800 dark:border-white bg-white dark:bg-[#303030] ring-1 ring-neutral-800 dark:ring-white' : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60'}`}>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-400 font-medium">{isEn ? 'Unverified' : 'Belum Verif'}</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{isEn ? '100 Notes' : '100 Catatan'}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{isEn ? '0 Attachments' : '0 Lampiran'}</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${quotaConfig?.isEmailConfirmed && !quotaConfig?.isUpgraded ? 'border-neutral-800 dark:border-white bg-white dark:bg-[#303030] ring-1 ring-neutral-800 dark:ring-white' : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60'}`}>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-400 font-medium">{isEn ? 'Verified' : 'Terverifikasi'}</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">{isEn ? 'Unlimited' : 'Bebas Catatan'}</div>
                <div className="text-[10px] text-neutral-500 dark:text-neutral-400">{isEn ? '150 Photos & 2 Videos' : '150 Foto & 2 Video'}</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${quotaConfig?.isUpgraded ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 ring-1 ring-amber-600' : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60'}`}>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center space-x-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Pro</span>
                </div>
                <div className="font-bold text-amber-900 dark:text-amber-300 mt-0.5">{isEn ? 'Unlimited' : 'Bebas Catatan'}</div>
                <div className="text-[10px] text-amber-700 dark:text-amber-400">{isEn ? '1,000 Photos & 5 Videos' : '1.000 Foto & 5 Video'}</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                {isEn ? 'Instant activation (test mode):' : 'Aktivasi instan (mode testing):'}
              </span>
              <button
                type="button"
                onClick={handleToggleUpgrade}
                disabled={isUpgrading}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                  quotaConfig?.isUpgraded
                    ? 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200'
                    : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                }`}
              >
                <Sparkles className="w-3.5 h-3.5" />
                <span>
                  {isUpgrading
                    ? t('common.saving')
                    : quotaConfig?.isUpgraded
                    ? t('settings.revertFree')
                    : t('settings.activatePro')}
                </span>
              </button>
            </div>
          </div>

          {/* 5. PUSH NOTIFICATION SETTINGS */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#252525] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t('settings.notificationsTitle')}
                </h3>
              </div>
              <div>
                {!isNotificationSupported() ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 font-medium">
                    {t('settings.notificationsUnsupported')}
                  </span>
                ) : notifPermission === 'denied' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-red-50 dark:bg-red-950/40 text-red-700 dark:text-red-300 font-medium border border-red-200 dark:border-red-900">
                    {t('settings.notificationsDenied')}
                  </span>
                ) : notifEnabled && notifPermission === 'granted' ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('settings.notificationsGranted')}</span>
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                    {isEn ? 'Disabled' : 'Nonaktif'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {t('settings.notificationsDesc')}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              <button
                type="button"
                onClick={handleToggleNotification}
                disabled={!isNotificationSupported()}
                className={`px-3.5 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                  notifEnabled && notifPermission === 'granted'
                    ? 'bg-neutral-200 hover:bg-neutral-300 dark:bg-neutral-700 dark:hover:bg-neutral-600 text-neutral-800 dark:text-neutral-200'
                    : 'bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs'
                }`}
              >
                <Bell className="w-3.5 h-3.5" />
                <span>
                  {notifEnabled && notifPermission === 'granted'
                    ? t('settings.notificationsDisable')
                    : t('settings.notificationsEnable')}
                </span>
              </button>

              {notifEnabled && notifPermission === 'granted' && (
                <button
                  type="button"
                  onClick={handleTestNotification}
                  className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#2c2c2c] dark:hover:bg-[#353535] text-neutral-700 dark:text-neutral-300 transition flex items-center space-x-1.5 cursor-pointer"
                >
                  {testNotifSent ? (
                    <>
                      <Check className="w-3.5 h-3.5 text-emerald-600" />
                      <span className="text-emerald-600 font-semibold">{t('settings.testNotifSent')}</span>
                    </>
                  ) : (
                    <span>{t('settings.sendTestNotif')}</span>
                  )}
                </button>
              )}
            </div>
          </div>

          {/* 6. PWA INSTALLATION CARD */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#252525] space-y-3 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <Smartphone className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                  {t('settings.pwaTitle')}
                </h3>
              </div>
              <div>
                {isInstalled ? (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                    <CheckCircle2 className="w-3 h-3" />
                    <span>{t('settings.pwaInstalled')}</span>
                  </span>
                ) : (
                  <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
                    {isEn ? 'Browser Mode' : 'Mode Browser'}
                  </span>
                )}
              </div>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {t('settings.pwaDesc')}
            </p>

            <div className="flex flex-wrap items-center gap-2 pt-1">
              {!isInstalled ? (
                <button
                  type="button"
                  onClick={handleInstallPWA}
                  className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 shadow-xs transition flex items-center space-x-1.5 cursor-pointer"
                >
                  <Smartphone className="w-3.5 h-3.5" />
                  <span>{t('settings.pwaInstallBtn')}</span>
                </button>
              ) : (
                <div className="text-xs text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1.5">
                  <Check className="w-4 h-4" />
                  <span>{isEn ? 'Running as standalone application' : 'Berjalan sebagai aplikasi mandiri'}</span>
                </div>
              )}
            </div>

            <p className="text-[11px] text-neutral-400 dark:text-neutral-500 italic pt-0.5">
              💡 {t('settings.pwaIosTip')}
            </p>
          </div>

          {/* 7. DATA BACKUP & EKSPOR */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#252525] space-y-3 shadow-2xs">
            <div className="flex items-center space-x-2">
              <Download className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
              <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                {isEn ? 'Data Backup & Export' : 'Cadangan & Ekspor Data'}
              </h3>
            </div>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
              {isEn 
                ? 'Download a safe local copy of all your tasks, notes, checklists, and workspaces anytime.' 
                : 'Unduh salinan cadangan seluruh tugas, catatan, checklist, dan ruang kerja Anda secara instan.'}
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 pt-1">
              <button
                type="button"
                onClick={handleExportJSON}
                className="px-3 py-2 bg-neutral-50 dark:bg-[#2c2c2c] hover:bg-neutral-100 dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-center space-x-2 transition cursor-pointer shadow-2xs"
              >
                {exportedType === 'json' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">{isEn ? 'Downloaded!' : 'Tersimpan!'}</span>
                  </>
                ) : (
                  <>
                    <FileText className="w-3.5 h-3.5 text-blue-500" />
                    <span>{isEn ? 'Export All (.json)' : 'Ekspor Lengkap (.json)'}</span>
                  </>
                )}
              </button>
              <button
                type="button"
                onClick={handleExportCSV}
                className="px-3 py-2 bg-neutral-50 dark:bg-[#2c2c2c] hover:bg-neutral-100 dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-center space-x-2 transition cursor-pointer shadow-2xs"
              >
                {exportedType === 'csv' ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600" />
                    <span className="text-emerald-600 font-semibold">{isEn ? 'Downloaded!' : 'Tersimpan!'}</span>
                  </>
                ) : (
                  <>
                    <Download className="w-3.5 h-3.5 text-emerald-500" />
                    <span>{isEn ? 'Export Tasks (.csv)' : 'Ekspor Tugas (.csv)'}</span>
                  </>
                )}
              </button>
            </div>
          </div>

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between bg-[#FBFBFA] dark:bg-[#1A1A1A]">
          <span className="text-[11px] text-neutral-400 dark:text-neutral-500">{t('settings.footerAccount')}</span>
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-1.5 text-xs text-white dark:text-neutral-900 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 rounded-lg transition cursor-pointer font-medium"
          >
            {t('common.close')}
          </button>
        </div>

      </div>
    </div>
  );
}
