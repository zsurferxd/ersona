import React, { useState } from 'react';
import {
  X, User, HardDrive, CheckCircle2, AlertTriangle,
  RefreshCw, Sparkles, Mail, Trash2, Sun, Moon, Globe
} from 'lucide-react';
import { formatBytes } from '../utils/storageQuota';
import { supabase } from '../lib/supabaseClient';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  storageUsage,
  onRefreshStorage,
  quotaConfig,
  onToggleProTier,
  onNavigateToTab,
}) {
  if (!isOpen) return null;

  const { theme, setTheme, isDark, language, setLanguage, t } = useThemeLanguage();

  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

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

  // Handler Kirim Ulang Email Konfirmasi
  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setEmailSentNotice(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      setEmailSentNotice(true);
      setTimeout(() => setEmailSentNotice(false), 5000);
    } catch (err) {
      alert('Gagal mengirim ulang email konfirmasi: ' + err.message);
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
                      <span>{t('settings.emailStatusConfirmed')} (300 MB)</span>
                    </span>
                  ) : (
                    <span className="inline-flex items-center space-x-1 text-[11px] text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/50 px-2 py-0.5 rounded-full border border-amber-200 dark:border-amber-800">
                      <AlertTriangle className="w-3 h-3" />
                      <span>{t('settings.emailStatusUnconfirmed')} (100 MB)</span>
                    </span>
                  )}
                </div>
              </div>
            </div>

            {!quotaConfig?.isEmailConfirmed && (
              <button
                type="button"
                onClick={handleResendConfirmation}
                disabled={resendingEmail}
                className="self-start sm:self-center px-3 py-1.5 text-xs bg-white dark:bg-neutral-800 hover:bg-neutral-100 dark:hover:bg-neutral-700 text-neutral-700 dark:text-neutral-200 border border-neutral-300 dark:border-neutral-700 rounded-lg transition font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
              >
                <Mail className="w-3.5 h-3.5" />
                <span>{resendingEmail ? t('common.saving') : t('settings.resendEmail')}</span>
              </button>
            )}
          </div>

          {emailSentNotice && (
            <div className="p-3 bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs text-emerald-800 dark:text-emerald-200 flex items-center space-x-2 animate-fade-in">
              <CheckCircle2 className="w-4 h-4 shrink-0" />
              <span>{t('settings.emailSentNotice')}</span>
            </div>
          )}

          {/* 3. VISUAL STORAGE METER */}
          <div className="p-4 sm:p-5 rounded-xl border border-neutral-200 dark:border-neutral-800 bg-white dark:bg-[#252525] space-y-4 shadow-2xs">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <HardDrive className="w-4 h-4 text-neutral-700 dark:text-neutral-300" />
                <h3 className="text-sm font-semibold text-neutral-900 dark:text-white">{t('settings.storageUsage')}</h3>
              </div>
              <button
                onClick={handleRefresh}
                disabled={isRefreshing}
                title="Hitung ulang ukuran penyimpanan"
                className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white flex items-center space-x-1 p-1 rounded hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neutral-800 dark:text-white' : ''}`} />
                <span>{isRefreshing ? t('common.loading') : 'Refresh'}</span>
              </button>
            </div>

            {/* Progress Bar */}
            <div>
              <div className="flex items-baseline justify-between text-xs mb-1.5">
                <span className="font-semibold text-neutral-800 dark:text-neutral-200">
                  {formatBytes(usedBytes)} <span className="font-normal text-neutral-500 dark:text-neutral-400">{t('settings.usedOf')} {formatBytes(maxBytes)}</span>
                </span>
                <span className="font-mono text-neutral-500 dark:text-neutral-400 text-[11px]">
                  {usagePercent.toFixed(1)}%
                </span>
              </div>

              <div className="w-full bg-neutral-100 dark:bg-neutral-800 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-200/70 dark:border-neutral-700">
                <div
                  className={`h-full rounded-full transition-all duration-500 ${
                    usagePercent > 90
                      ? 'bg-red-500'
                      : usagePercent > 70
                      ? 'bg-amber-500'
                      : 'bg-emerald-500'
                  }`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>

              <div className="flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 mt-2">
                <span>Sisa: <strong className="text-neutral-600 dark:text-neutral-300">{formatBytes(remainingBytes)}</strong></span>
                <span>Tier: <strong className="text-neutral-700 dark:text-neutral-300">{quotaConfig?.tierName}</strong></span>
              </div>
            </div>

            {/* Storage Info Tips */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between text-xs">
              <span className="text-neutral-500 dark:text-neutral-400">Penuh? Bersihkan tempat sampah.</span>
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
                    {quotaConfig?.isUpgraded ? t('settings.proTierTitle') : t('settings.freeTierTitle')}
                  </h3>
                </div>
                <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">
                  {quotaConfig?.isUpgraded
                    ? t('settings.proDescActive')
                    : t('settings.proDescInactive')}
                </p>
              </div>
              <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                quotaConfig?.isUpgraded ? 'bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
                {quotaConfig?.isUpgraded ? 'PRO 1GB' : 'FREE'}
              </span>
            </div>

            <div className="grid grid-cols-3 gap-2 text-center text-xs">
              <div className={`p-2.5 rounded-lg border ${!quotaConfig?.isEmailConfirmed && !quotaConfig?.isUpgraded ? 'border-neutral-800 dark:border-white bg-white dark:bg-[#303030] ring-1 ring-neutral-800 dark:ring-white' : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60'}`}>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-400 font-medium">100 MB</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Free</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${quotaConfig?.isEmailConfirmed && !quotaConfig?.isUpgraded ? 'border-neutral-800 dark:border-white bg-white dark:bg-[#303030] ring-1 ring-neutral-800 dark:ring-white' : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60'}`}>
                <div className="text-[10px] text-neutral-400 dark:text-neutral-400 font-medium">300 MB</div>
                <div className="font-bold text-neutral-800 dark:text-neutral-200 mt-0.5">Verified</div>
              </div>
              <div className={`p-2.5 rounded-lg border ${quotaConfig?.isUpgraded ? 'border-amber-600 bg-amber-50/50 dark:bg-amber-950/40 ring-1 ring-amber-600' : 'border-neutral-200 dark:border-neutral-700 bg-white/60 dark:bg-neutral-800/60'}`}>
                <div className="text-[10px] text-amber-600 dark:text-amber-400 font-medium flex items-center justify-center space-x-0.5">
                  <Sparkles className="w-2.5 h-2.5" />
                  <span>Pro</span>
                </div>
                <div className="font-bold text-amber-900 dark:text-amber-300 mt-0.5">1 GB</div>
              </div>
            </div>

            <div className="pt-2 flex items-center justify-between">
              <span className="text-[11px] text-neutral-400 dark:text-neutral-500">
                Aktivasi instan (mode testing):
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
