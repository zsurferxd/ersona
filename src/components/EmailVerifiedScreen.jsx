import React from 'react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { CheckCircle2, RotateCcw, ArrowRight, Sun, Moon, Sparkles, Image, Video } from 'lucide-react';
import BrandLogo from './BrandLogo';

export default function EmailVerifiedScreen({ onRefresh, onContinue }) {
  const { language, setLanguage, isDark, toggleTheme, t } = useThemeLanguage();
  const isEn = language === 'en';

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-[#FBFBFA] dark:bg-[#191919] transition-colors duration-200">
      <div className="w-full max-w-md bg-white dark:bg-[#232323] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-sm p-6 sm:p-8 transition-all relative">
        {/* Top Controls: Lang & Theme */}
        <div className="flex items-center justify-between pb-3 mb-3 border-b border-neutral-100 dark:border-neutral-800/80">
          <BrandLogo size="xs" showText={true} />

          <div className="flex items-center space-x-2">
            {/* Lang Switcher */}
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
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-600" />}
            </button>
          </div>
        </div>

        {/* Centered Success Icon */}
        <div className="flex flex-col items-center text-center mt-2 mb-6">
          <div className="w-14 h-14 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-200 dark:border-emerald-800/80 flex items-center justify-center mb-4 text-emerald-600 dark:text-emerald-400 shadow-inner">
            <CheckCircle2 className="w-7 h-7" />
          </div>

          <h2 className="text-xl font-bold text-neutral-900 dark:text-white tracking-tight mb-1.5">
            {isEn ? 'Email Successfully Verified!' : 'Email Berhasil Diverifikasi!'}
          </h2>

          {/* Kotak Pesan Utama Sesuai Permintaan User */}
          <div className="w-full mt-3 p-3.5 bg-emerald-50/80 dark:bg-emerald-950/40 border border-emerald-200/90 dark:border-emerald-800/70 rounded-xl text-center">
            <p className="text-sm font-semibold text-emerald-800 dark:text-emerald-300">
              {isEn ? 'Account verified, please refresh your Ersona.' : 'Akun diverifikasi, silakan refresh Ersona Anda.'}
            </p>
          </div>
        </div>

        {/* Info Kuota Terbuka */}
        <div className="mb-6 p-4 bg-neutral-50 dark:bg-[#1E1E1E] border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-2.5">
          <div className="flex items-center space-x-2 text-xs font-semibold text-neutral-700 dark:text-neutral-300">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span>{isEn ? 'New Verified Quota Unlocked:' : 'Kuota Baru Akun Terverifikasi:'}</span>
          </div>

          <div className="grid grid-cols-2 gap-2 pt-1">
            <div className="p-2.5 bg-white dark:bg-[#262626] border border-neutral-200/60 dark:border-neutral-700/60 rounded-lg flex items-center space-x-2">
              <Image className="w-4 h-4 text-emerald-500 shrink-0" />
              <div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">{isEn ? 'Photo Limit' : 'Batas Foto'}</p>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{isEn ? '150 Photos' : '150 Foto'}</p>
              </div>
            </div>

            <div className="p-2.5 bg-white dark:bg-[#262626] border border-neutral-200/60 dark:border-neutral-700/60 rounded-lg flex items-center space-x-2">
              <Video className="w-4 h-4 text-blue-500 shrink-0" />
              <div>
                <p className="text-[10px] text-neutral-400 dark:text-neutral-500 font-medium">{isEn ? 'Video Limit' : 'Batas Video'}</p>
                <p className="text-xs font-bold text-neutral-800 dark:text-neutral-200">{isEn ? '2 Videos' : '2 Video'}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Action Buttons */}
        <div className="space-y-2.5">
          <button
            type="button"
            onClick={onRefresh}
            className="w-full py-2.5 px-4 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold rounded-xl flex items-center justify-center space-x-2 transition cursor-pointer shadow-sm active:scale-[0.99]"
          >
            <RotateCcw className="w-4 h-4" />
            <span>{isEn ? 'Refresh Ersona' : 'Refresh Ersona'}</span>
          </button>

          <button
            type="button"
            onClick={onContinue}
            className="w-full py-2 px-4 text-xs font-medium text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer flex items-center justify-center space-x-1"
          >
            <span>{isEn ? 'Or continue to Workspace' : 'Atau langsung buka Ruang Kerja'}</span>
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
