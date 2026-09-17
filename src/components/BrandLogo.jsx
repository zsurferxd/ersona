import React from 'react';

/**
 * ==============================================================================
 * ERSONA BRAND LOGO COMPONENT (LOGO READY)
 * ==============================================================================
 * Komponen sentral untuk menampilkan logo dan identitas visual Ersona.
 * 
 * 💡 CARA MEMASANG LOGO KUSTOM DI MASA DEPAN:
 * 1. Simpan file logo Anda di folder `public/logo.svg` atau `public/logo.png`.
 * 2. Cukup ubah konstanta `CUSTOM_LOGO_URL` di bawah ini menjadi:
 *    const CUSTOM_LOGO_URL = '/logo.svg'; (atau path file gambar logo Anda)
 * ==============================================================================
 */
const CUSTOM_LOGO_URL = '/logo.svg'; // Menggunakan logo resmi Ersona yang baru dibuat

export default function BrandLogo({
  size = 'md', // 'xs' | 'sm' | 'md' | 'lg' | 'xl'
  showText = true,
  className = '',
  textClassName = '',
  iconClassName = '',
  onClick,
}) {
  const sizeMap = {
    xs: { box: 'w-6 h-6', icon: 'w-3.5 h-3.5', text: 'text-sm' },
    sm: { box: 'w-7 h-7', icon: 'w-4 h-4', text: 'text-base' },
    md: { box: 'w-8 h-8', icon: 'w-4.5 h-4.5', text: 'text-lg' },
    lg: { box: 'w-10 h-10', icon: 'w-5.5 h-5.5', text: 'text-xl' },
    xl: { box: 'w-12 h-12', icon: 'w-7 h-7', text: 'text-2xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center space-x-2.5 select-none ${onClick ? 'cursor-pointer' : ''} ${className}`}
    >
      {/* 1. BAGIAN IKON / SIMBOL LOGO */}
      {CUSTOM_LOGO_URL ? (
        <img
          src={CUSTOM_LOGO_URL}
          alt="Ersona Logo"
          className={`${currentSize.box} object-contain shrink-0 transition-transform duration-200 group-hover:scale-105 ${iconClassName}`}
        />
      ) : (
        /* Modern Geometric Monogram Mark */
        <div
          className={`${currentSize.box} rounded-xl bg-neutral-900 dark:bg-white text-white dark:text-neutral-950 flex items-center justify-center shrink-0 shadow-xs transition-transform duration-200 group-hover:scale-105 ${iconClassName}`}
        >
          <svg
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`${currentSize.icon}`}
          >
            {/* Minimalist modern planetary orbit & core */}
            <circle cx="12" cy="12" r="3.5" fill="currentColor" fillOpacity="0.9" />
            <ellipse cx="12" cy="12" rx="8.5" ry="3.5" transform="rotate(-30 12 12)" strokeWidth="1.75" />
            <circle cx="19" cy="8" r="1" fill="currentColor" />
          </svg>
        </div>
      )}

      {/* 2. BAGIAN TEKS BRAND */}
      {showText && (
        <div className="flex items-baseline space-x-1.5 leading-none">
          <span className={`font-bold tracking-tight text-neutral-900 dark:text-white ${currentSize.text} ${textClassName}`}>
            Ersona
          </span>
        </div>
      )}
    </div>
  );
}
