import React from 'react';

const LOGO_URL = '/logo.svg';

export default function BrandLogo({
  size = 'md',
  showText = true,
  inverted = false,
  className = '',
  textClassName = '',
  iconClassName = '',
}) {
  const sizeMap = {
    xs: { box: 'w-6 h-6', px: 24, text: 'text-sm' },
    sm: { box: 'w-7 h-7', px: 28, text: 'text-base' },
    md: { box: 'w-8 h-8', px: 32, text: 'text-lg' },
    lg: { box: 'w-10 h-10', px: 40, text: 'text-xl' },
    xl: { box: 'w-12 h-12', px: 48, text: 'text-2xl' },
  };

  const currentSize = sizeMap[size] || sizeMap.md;

  return (
    <span className={`inline-flex items-center gap-2.5 select-none ${className}`}>
      <img
        src={LOGO_URL}
        alt="Logo Ersona"
        width={currentSize.px}
        height={currentSize.px}
        className={`${currentSize.box} object-contain shrink-0 transition-transform duration-200 ${iconClassName}`}
      />
      {showText && (
        <span
          className={`font-display font-semibold tracking-tight leading-none ${
            inverted ? 'text-white' : 'text-[#09090B]'
          } ${currentSize.text} ${textClassName}`}
        >
          Ersona
        </span>
      )}
    </span>
  );
}
