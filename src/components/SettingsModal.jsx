import React, { useState, useEffect } from 'react';
import {
  X, User, HardDrive, CheckCircle2, AlertTriangle,
  Sparkles, Mail, Trash2, Sun, Moon, Globe,
  Download, FileText, Check, Image as ImageIcon, Film, Loader2, Bell, Smartphone,
  Sliders, ArrowRight
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

  const { theme, setTheme, language, setLanguage, t } = useThemeLanguage();
  const isEn = language === 'en';

  const [activeTab, setActiveTab] = useState('general'); // 'general' | 'account' | 'storage' | 'backup'

  const [notifPermission, setNotifPermission] = useState(() => getNotificationPermission());
  const [notifEnabled, setNotifEnabled] = useState(() => isNotificationEnabled());
  const [testNotifSent, setTestNotifSent] = useState(false);

  const [isInstalled, setIsInstalled] = useState(() => isPWAInstalled());
  const [canInstallPWA, setCanInstallPWA] = useState(false);

  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);
  const [exportedType, setExportedType] = useState(null);

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

  // Helper menghitung media tanpa double counting
  const getNoteItems = (n) => {
    if (Array.isArray(n.media_items) && n.media_items.length > 0) {
      return n.media_items;
    }
    if (n.media_url) {
      return [{ url: n.media_url, type: n.media_type || 'image' }];
    }
    return [];
  };

  const ownedWsIds = new Set((workspaces || []).filter(w => w.owner_id === user?.id).map(w => w.id));

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

  // Handler Ekspor JSON
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

  // Handler Ekspor CSV
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

  // Handler Kirim Tautan Konfirmasi ke Email
  const handleSendVerificationLink = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setEmailSentNotice(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
        options: {
          emailRedirectTo: `${window.location.origin}/workspace?type=signup`,
        }
      });
      if (error) {
        throw error;
      }
      setEmailSentNotice(true);
    } catch (err) {
      alert(isEn 
        ? 'Failed to send verification email: ' + (err?.message || 'Please try again.') 
        : 'Gagal mengirim email verifikasi: ' + (err?.message || 'Silakan coba lagi.'));
    } finally {
      setResendingEmail(false);
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

  const tabs = [
    { id: 'general', label: isEn ? 'General' : 'Umum', icon: Sliders },
    { 
      id: 'account', 
      label: isEn ? 'Account' : 'Akun', 
      icon: User, 
      badge: !quotaConfig?.isEmailConfirmed ? '!' : null 
    },
    { 
      id: 'storage', 
      label: isEn ? 'Storage & Plan' : 'Penyimpanan & Paket', 
      icon: HardDrive, 
      badge: quotaConfig?.isUpgraded ? 'PRO' : null 
    },
    { id: 'backup', label: isEn ? 'Data & Backup' : 'Data & Cadangan', icon: Download },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-6 bg-black/60 backdrop-blur-xs animate-fade-in">
      <div className="bg-white dark:bg-[#1E1E1E] rounded-2xl max-w-4xl w-full h-[90vh] sm:h-[620px] shadow-2xl border border-neutral-200/80 dark:border-neutral-800 flex flex-col overflow-hidden animate-scale-in transition-colors duration-200">
        
        {/* Header Modal */}
        <div className="px-5 sm:px-6 py-4 border-b border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-white dark:bg-[#1A1A1A] shrink-0">
          <div className="flex items-center space-x-3">
            <div className="w-9 h-9 rounded-xl bg-neutral-100 dark:bg-neutral-800 flex items-center justify-center text-neutral-700 dark:text-neutral-300">
              <Sliders className="w-4.5 h-4.5" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900 dark:text-white">
                {t('settings.title')}
              </h2>
              <p className="text-xs text-neutral-500 dark:text-neutral-400">
                {t('settings.subtitle')}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 dark:hover:text-white p-1.5 rounded-lg hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
            aria-label="Close"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Mobile Navigation Tabs Strip (< sm) */}
        <div className="sm:hidden flex items-center space-x-1 px-3 py-2 bg-neutral-100/70 dark:bg-[#161616] border-b border-neutral-200 dark:border-neutral-800 overflow-x-auto no-scrollbar shrink-0">
          {tabs.map((tab) => {
            const Icon = tab.icon;
            const isActive = activeTab === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap flex items-center space-x-1.5 transition shrink-0 cursor-pointer ${
                  isActive
                    ? 'bg-white dark:bg-[#2A2A2A] text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Icon className="w-3.5 h-3.5" />
                <span>{tab.label}</span>
                {tab.badge && (
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500 inline-block" />
                )}
              </button>
            );
          })}
        </div>

        {/* Modal Body: Left Sidebar + Right Content */}
        <div className="flex-1 flex min-h-0 overflow-hidden">
          
          {/* Desktop Left Sidebar (>= sm) */}
          <aside className="hidden sm:flex flex-col w-56 p-3 space-y-1 bg-[#FAF9F7]/70 dark:bg-[#161616]/70 border-r border-neutral-200/80 dark:border-neutral-800 shrink-0 justify-between">
            <div className="space-y-1">
              <div className="px-2.5 py-1 text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                {isEn ? 'Preferences' : 'Preferensi'}
              </div>
              {tabs.map((tab) => {
                const Icon = tab.icon;
                const isActive = activeTab === tab.id;
                return (
                  <button
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id)}
                    className={`w-full px-3 py-2 rounded-xl text-xs font-medium flex items-center justify-between transition cursor-pointer ${
                      isActive
                        ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-white shadow-xs font-semibold'
                        : 'text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-200/40 dark:hover:bg-neutral-800/40'
                    }`}
                  >
                    <div className="flex items-center space-x-2.5">
                      <Icon className={`w-4 h-4 ${isActive ? 'text-neutral-900 dark:text-white' : 'text-neutral-400'}`} />
                      <span>{tab.label}</span>
                    </div>
                    {tab.badge && (
                      <span className="px-1.5 py-0.2 text-[10px] font-bold rounded-md bg-amber-100 text-amber-800 dark:bg-amber-950 dark:text-amber-300">
                        {tab.badge}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Subtle branding / info at bottom of sidebar */}
            <div className="p-2.5 rounded-xl bg-neutral-200/40 dark:bg-neutral-800/40 text-[11px] text-neutral-500 dark:text-neutral-400 space-y-0.5">
              <div className="font-semibold text-neutral-700 dark:text-neutral-300">Ersona Workspace</div>
              <div className="text-[10px] text-neutral-400 dark:text-neutral-500">v2.4 • Clean & Focused</div>
            </div>
          </aside>

          {/* Right Main Content Pane */}
          <main className="flex-1 overflow-y-auto p-5 sm:p-7 min-w-0">

            {/* TAB 1: GENERAL */}
            {activeTab === 'general' && (
              <div className="space-y-6 animate-fade-in max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {isEn ? 'General Preferences' : 'Pengaturan Umum'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isEn ? 'Customize appearance, language, and system features.' : 'Sesuaikan tampilan tema, bahasa antarmuka, dan fitur sistem.'}
                  </p>
                </div>

                {/* Theme & Language Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-4">
                  <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                    <Globe className="w-4 h-4 text-neutral-500" />
                    <span>{t('settings.appearanceAndLang')}</span>
                  </div>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {/* Language Selector */}
                    <div>
                      <label className="block text-[11px] font-medium text-neutral-500 dark:text-neutral-400 mb-1.5">
                        {t('settings.langLabel')}
                      </label>
                      <div className="grid grid-cols-2 gap-1.5 bg-neutral-200/70 dark:bg-neutral-800 p-1 rounded-lg">
                        <button
                          type="button"
                          onClick={() => setLanguage('id')}
                          className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center space-x-1.5 ${
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
                          className={`py-1.5 text-xs font-medium rounded-md transition cursor-pointer flex items-center justify-center space-x-1.5 ${
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

                    {/* Theme Selector */}
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

                {/* Notifications Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {t('settings.notificationsTitle')}
                      </h4>
                    </div>
                    <div>
                      {!isNotificationSupported() ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 font-medium">
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
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
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
                        className="px-3 py-1.5 text-xs font-medium rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white hover:bg-neutral-100 dark:bg-[#2c2c2c] dark:hover:bg-[#353535] text-neutral-700 dark:text-neutral-300 transition flex items-center space-x-1.5 cursor-pointer"
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

                {/* PWA App Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-3.5">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <Smartphone className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {t('settings.pwaTitle')}
                      </h4>
                    </div>
                    <div>
                      {isInstalled ? (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 font-medium border border-emerald-200 dark:border-emerald-800 flex items-center space-x-1">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>{t('settings.pwaInstalled')}</span>
                        </span>
                      ) : (
                        <span className="text-[11px] px-2 py-0.5 rounded-full bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 font-medium">
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
              </div>
            )}

            {/* TAB 2: ACCOUNT */}
            {activeTab === 'account' && (
              <div className="space-y-6 animate-fade-in max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {isEn ? 'Account Profile' : 'Profil & Keamanan Akun'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isEn ? 'Manage authentication and email verification status.' : 'Kelola autentikasi dan status verifikasi email Anda.'}
                  </p>
                </div>

                {/* Profile Information Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-4">
                  <div className="flex items-center space-x-3.5">
                    <div className="w-12 h-12 rounded-full bg-neutral-900 dark:bg-neutral-700 text-white flex items-center justify-center font-bold text-base shadow-sm">
                      {user?.email?.charAt(0).toUpperCase() || 'U'}
                    </div>
                    <div className="space-y-1">
                      <div className="text-sm font-semibold text-neutral-900 dark:text-white">
                        {user?.email}
                      </div>
                      <div className="flex items-center space-x-2">
                        {quotaConfig?.isEmailConfirmed ? (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 dark:text-emerald-300 bg-emerald-50 dark:bg-emerald-950/50 px-2.5 py-0.5 rounded-full border border-emerald-200 dark:border-emerald-800">
                            <CheckCircle2 className="w-3 h-3" />
                            <span className="font-medium">{t('settings.emailStatusConfirmed')}</span>
                          </span>
                        ) : (
                          <span className="inline-flex items-center space-x-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2.5 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                            <AlertTriangle className="w-3 h-3" />
                            <span className="font-medium">{t('settings.emailStatusUnconfirmed')}</span>
                          </span>
                        )}
                        <span className="text-[11px] font-mono text-neutral-400 dark:text-neutral-500">
                          {quotaConfig?.isUpgraded ? 'PRO TIER' : 'FREE TIER'}
                        </span>
                      </div>
                    </div>
                  </div>

                  {/* If unverified: Explanation + Send Confirmation Link Button */}
                  {!quotaConfig?.isEmailConfirmed ? (
                    <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-3">
                      <div className="p-3 bg-amber-50/80 dark:bg-amber-950/30 border border-amber-200/70 dark:border-amber-800/60 rounded-xl text-xs text-amber-900 dark:text-amber-200 space-y-1">
                        <div className="font-semibold flex items-center space-x-1.5">
                          <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
                          <span>{isEn ? 'Email not verified' : 'Email belum terverifikasi'}</span>
                        </div>
                        <p className="text-[11px] text-amber-800 dark:text-amber-300/90 leading-relaxed">
                          {isEn 
                            ? 'Unverified accounts are limited to 100 notes and cannot upload photo or video attachments. Click below to receive a confirmation link in your inbox and unlock full features.'
                            : 'Akun yang belum terverifikasi dibatasi maksimal 100 catatan dan belum dapat mengunggah lampiran foto/video. Klik tombol di bawah untuk menerima tautan konfirmasi di email Anda dan membuka fitur lengkap.'}
                        </p>
                      </div>

                      {/* Success banner after clicking send link */}
                      {emailSentNotice && (
                        <div className="p-3.5 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-xl text-xs text-emerald-800 dark:text-emerald-200 flex items-start space-x-2.5 animate-fade-in">
                          <CheckCircle2 className="w-4 h-4 shrink-0 text-emerald-600 dark:text-emerald-400 mt-0.5" />
                          <div className="space-y-0.5">
                            <div className="font-semibold">
                              {isEn ? 'Verification link sent!' : 'Tautan verifikasi telah dikirim!'}
                            </div>
                            <p className="text-[11px] text-emerald-700/90 dark:text-emerald-300/90 leading-relaxed">
                              {isEn 
                                ? `A confirmation link has been sent to ${user?.email}. Please check your inbox or spam folder and click the link to activate your account.` 
                                : `Kami telah mengirim tautan konfirmasi ke ${user?.email}. Buka kotak masuk atau folder spam email Anda, lalu klik tautan tersebut untuk menyelesaikan verifikasi.`}
                            </p>
                          </div>
                        </div>
                      )}

                      <div className="flex flex-wrap items-center gap-2 pt-1">
                        <button
                          type="button"
                          onClick={handleSendVerificationLink}
                          disabled={resendingEmail}
                          className="px-4 py-2 text-xs bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-xl font-medium shadow-xs transition flex items-center space-x-2 cursor-pointer disabled:opacity-50"
                        >
                          {resendingEmail ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Mail className="w-3.5 h-3.5" />}
                          <span>{resendingEmail ? (isEn ? 'Sending link...' : 'Mengirim tautan...') : (isEn ? 'Send Verification Link' : 'Kirim Tautan Verifikasi')}</span>
                        </button>

                        {onToggleEmailVerified && (
                          <button
                            type="button"
                            onClick={() => onToggleEmailVerified(true)}
                            className="px-3 py-2 text-xs bg-blue-50 dark:bg-blue-950/50 hover:bg-blue-100 dark:hover:bg-blue-900/60 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-800 rounded-xl transition font-medium cursor-pointer"
                            title="Verifikasi instan untuk kemudahan pengujian akun"
                          >
                            {isEn ? 'Verify Now (Test Mode)' : 'Verif Instan (Mode Tes)'}
                          </button>
                        )}
                      </div>
                    </div>
                  ) : (
                    /* If verified */
                    <div className="pt-3 border-t border-neutral-200/80 dark:border-neutral-800 space-y-3">
                      <div className="p-3 bg-emerald-50/70 dark:bg-emerald-950/30 border border-emerald-200/70 dark:border-emerald-800/60 rounded-xl text-xs text-emerald-900 dark:text-emerald-200 flex items-start space-x-2.5">
                        <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                        <div className="space-y-0.5">
                          <div className="font-semibold">
                            {isEn ? 'Account fully verified' : 'Akun terverifikasi penuh'}
                          </div>
                          <p className="text-[11px] text-emerald-800 dark:text-emerald-300/90 leading-relaxed">
                            {isEn 
                              ? 'Your email is verified. You have access to unlimited notes, 150 photos, and 2 video attachments.' 
                              : 'Email Anda sudah terkonfirmasi. Anda dapat membuat catatan tanpa batas serta mengunggah hingga 150 foto dan 2 video.'}
                          </p>
                        </div>
                      </div>

                      {onToggleEmailVerified && !quotaConfig?.isUpgraded && (
                        <div className="pt-1">
                          <button
                            type="button"
                            onClick={() => onToggleEmailVerified(false)}
                            className="text-[11px] text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 underline cursor-pointer"
                            title="Kembalikan ke status Belum Verif untuk pengujian"
                          >
                            {isEn ? 'Reset to Unverified (Test Mode)' : 'Kembalikan ke Belum Verif (Mode Tes)'}
                          </button>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* TAB 3: STORAGE & PLAN */}
            {activeTab === 'storage' && (
              <div className="space-y-6 animate-fade-in max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {isEn ? 'Storage & Subscription Tier' : 'Penyimpanan & Status Paket'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isEn ? 'Monitor photo and video attachment quotas across your workspaces.' : 'Pantau pemakaian slot foto, video, dan status tingkatan akun Anda.'}
                  </p>
                </div>

                {/* Quota Progress Cards */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-2">
                      <ImageIcon className="w-4 h-4 text-blue-500" />
                      <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                        {quotaConfig?.isWorkspacePool 
                          ? (isEn ? `Team Media Pool (${quotaConfig.workspaceName || 'Workspace'})` : `Pool Media Tim (${quotaConfig.workspaceName || 'Ruang Kerja'})`)
                          : (isEn ? 'Personal Media Limits (Photos & Videos)' : 'Batas Lampiran Foto & Video')}
                      </h4>
                    </div>
                    <span className="text-[11px] font-mono px-2 py-0.5 rounded-md font-semibold bg-white dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 shadow-2xs">
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
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#202020] border border-neutral-200/70 dark:border-neutral-700/70 space-y-2">
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
                          maxPhotos === 0 ? 'bg-neutral-300 dark:bg-neutral-600' : (photoCount / maxPhotos) >= 1 ? 'bg-red-500' : (photoCount / maxPhotos) > 0.8 ? 'bg-amber-500' : 'bg-blue-500'
                        }`}
                        style={{ width: `${maxPhotos > 0 ? Math.min(100, Math.max(2, (photoCount / maxPhotos) * 100)) : 0}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-neutral-400 dark:text-neutral-500 pt-0.5">
                      <span>
                        {!activeWorkspace && workspacePhotoCount > 0
                          ? (isEn ? `${personalOnlyPhotoCount} personal • ${workspacePhotoCount} in workspaces` : `${personalOnlyPhotoCount} pribadi • ${workspacePhotoCount} di ruang kerja tim`)
                          : (maxPhotos === 0 ? (isEn ? '🔒 Verify email to unlock 150 photos' : '🔒 Verifikasi email untuk membuka 150 foto') : (isEn ? 'Auto WebP compression active (~200 KB/photo)' : 'Kompresi WebP otomatis aktif (~200 KB/foto)'))}
                      </span>
                      <span>{maxPhotos === 0 ? '0' : `${Math.max(0, maxPhotos - photoCount)} ${isEn ? 'slots left' : 'tersisa'}`}</span>
                    </div>
                  </div>

                  {/* Video Quota Card */}
                  <div className="p-3.5 rounded-xl bg-white dark:bg-[#202020] border border-neutral-200/70 dark:border-neutral-700/70 space-y-2">
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
                              : (isEn ? 'Max 15 MB per video' : 'Maksimal 15 MB per video'))}
                      </span>
                      <span>{maxVideos === 0 ? '0' : `${Math.max(0, maxVideos - videoCount)} ${isEn ? 'slots left' : 'tersisa'}`}</span>
                    </div>
                  </div>

                  <div className="pt-2 border-t border-neutral-200/70 dark:border-neutral-800 flex items-center justify-between text-xs">
                    <span className="text-neutral-500 dark:text-neutral-400">
                      {isEn ? 'Need to free up slots? Check trash.' : 'Ingin menambah kuota? Cek tempat sampah.'}
                    </span>
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

                {/* Account Tier Comparison & Pro Toggle */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-linear-to-br from-neutral-50 to-[#FAF9F7] dark:from-[#252525] dark:to-[#212121] space-y-4">
                  <div className="flex items-start justify-between">
                    <div>
                      <div className="flex items-center space-x-2">
                        <Sparkles className="w-4 h-4 text-amber-500" />
                        <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                          {quotaConfig?.isUpgraded 
                            ? (isEn ? 'Ersona Pro Account' : 'Akun Ersona Pro')
                            : (isEn ? 'Account Tier Comparison' : 'Perbandingan Tingkatan Akun')}
                        </h4>
                      </div>
                      <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                        {quotaConfig?.isUpgraded
                          ? (isEn ? 'You have unlocked the maximum quota: 1,000 photos and 5 videos.' : 'Anda menikmati batas kuota maksimal: 1.000 foto dan 5 video.')
                          : (!quotaConfig?.isEmailConfirmed
                            ? (isEn ? 'Verify your email to unlock unlimited notes & media.' : 'Verifikasi email Anda untuk membuka catatan tanpa batas & media.')
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
                      {isEn ? 'Instant activation (testing mode):' : 'Aktivasi instan (mode testing):'}
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
              </div>
            )}

            {/* TAB 4: DATA & BACKUP */}
            {activeTab === 'backup' && (
              <div className="space-y-6 animate-fade-in max-w-2xl">
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">
                    {isEn ? 'Data Backup & Privacy' : 'Cadangan Data & Privasi'}
                  </h3>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-0.5">
                    {isEn ? 'Export your tasks and notes for offline backups.' : 'Unduh salinan cadangan tugas dan catatan Anda ke berkas lokal.'}
                  </p>
                </div>

                {/* Export Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-3.5">
                  <div className="flex items-center space-x-2">
                    <Download className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {isEn ? 'Export Local Backup' : 'Ekspor Berkas Cadangan'}
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {isEn 
                      ? 'Download a safe local copy of all your tasks, notes, checklists, and workspaces anytime.' 
                      : 'Unduh salinan cadangan seluruh tugas, catatan, checklist, dan ruang kerja Anda secara instan ke komputer atau ponsel Anda.'}
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
                    <button
                      type="button"
                      onClick={handleExportJSON}
                      className="px-3 py-2.5 bg-white dark:bg-[#2c2c2c] hover:bg-neutral-100 dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-center space-x-2 transition cursor-pointer shadow-2xs"
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
                      className="px-3 py-2.5 bg-white dark:bg-[#2c2c2c] hover:bg-neutral-100 dark:hover:bg-[#353535] border border-neutral-200 dark:border-neutral-700 rounded-xl text-xs font-medium text-neutral-800 dark:text-neutral-200 flex items-center justify-center space-x-2 transition cursor-pointer shadow-2xs"
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

                {/* Trash & Cleanup Card */}
                <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-neutral-50/50 dark:bg-[#252525] space-y-3">
                  <div className="flex items-center space-x-2">
                    <Trash2 className="w-4 h-4 text-red-500" />
                    <h4 className="text-xs font-semibold text-neutral-900 dark:text-white">
                      {isEn ? 'Trash Management' : 'Pengelolaan Tempat Sampah'}
                    </h4>
                  </div>
                  <p className="text-xs text-neutral-500 dark:text-neutral-400 leading-relaxed">
                    {isEn 
                      ? 'Deleted tasks and notes are kept in the trash until you empty it permanently. Free up media quotas anytime.' 
                      : 'Tugas dan catatan yang dihapus tersimpan di tempat sampah sampai Anda membersihkannya secara permanen untuk membebaskan kuota.'}
                  </p>
                  <div>
                    <button
                      type="button"
                      onClick={() => {
                        onClose();
                        onNavigateToTab('trash');
                      }}
                      className="px-3.5 py-1.5 text-xs font-medium text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60 bg-red-50/50 dark:bg-red-950/20 hover:bg-red-100 dark:hover:bg-red-900/40 rounded-lg transition flex items-center space-x-1.5 cursor-pointer"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{isEn ? 'Open Trash Tab' : 'Buka Tempat Sampah'}</span>
                      <ArrowRight className="w-3 h-3 ml-0.5" />
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>

        {/* Footer Modal */}
        <div className="px-5 sm:px-6 py-3.5 border-t border-neutral-200/80 dark:border-neutral-800 flex items-center justify-between bg-[#FAF9F7] dark:bg-[#1A1A1A] shrink-0">
          <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
            <span className="hidden sm:inline">{user?.email}</span>
            <span className="hidden sm:inline">•</span>
            <span className="font-medium text-neutral-700 dark:text-neutral-300">
              {quotaConfig?.isUpgraded ? 'Pro Account' : (quotaConfig?.isEmailConfirmed ? 'Verified Free' : 'Unverified Free')}
            </span>
          </div>
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
