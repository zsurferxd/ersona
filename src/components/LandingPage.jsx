import React, { useState, useEffect } from 'react';
import {
  ArrowRight, ArrowUpRight, ArrowUp, Check, Copy, Mail, Menu, Phone, X
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import BrandLogo from './BrandLogo';

const WHATSAPP_NUMBER_DISPLAY = '0895-6294-60463';
const WHATSAPP_URL_ID =
  'https://wa.me/62895629460463?text=Halo%20Ersona%2C%20saya%20ingin%20konsultasi%20mengenai%20pembuatan%20sistem%20aplikasi%20web%20bisnis.';
const WHATSAPP_URL_EN =
  'https://wa.me/62895629460463?text=Hello%20Ersona%2C%20I%20would%20like%20to%20discuss%20building%20a%20custom%20web%20system.';
const EMAIL_ADDRESS = 'support@ersona.site';

export default function LandingPage({ onNavigatePrivacy, onNavigateTerms }) {
  const { language, isEn, setLanguage, t } = useThemeLanguage();

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [activeStepIndex, setActiveStepIndex] = useState(0);
  const [copiedField, setCopiedField] = useState(null);
  const [showBackToTop, setShowBackToTop] = useState(false);

  const steps = t('process.steps');
  const activeStep = Array.isArray(steps) ? steps[activeStepIndex] || steps[0] : null;
  const whatsappUrl = isEn ? WHATSAPP_URL_EN : WHATSAPP_URL_ID;

  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape' && mobileMenuOpen) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [mobileMenuOpen]);

  useEffect(() => {
    const handleScroll = () => {
      setShowBackToTop(window.scrollY > 480);
    };
    window.addEventListener('scroll', handleScroll, { passive: true });
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const handleCopy = async (value, fieldKey) => {
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        await navigator.clipboard.writeText(value);
      } else {
        const area = document.createElement('textarea');
        area.value = value;
        area.setAttribute('readonly', '');
        area.style.position = 'absolute';
        area.style.left = '-9999px';
        document.body.appendChild(area);
        area.select();
        document.execCommand('copy');
        document.body.removeChild(area);
      }
      setCopiedField(fieldKey);
      setTimeout(() => setCopiedField(null), 2200);
    } catch {
      // Fallback: nothing copied if clipboard blocked
    }
  };

  const navLinks = [
    { href: '#sistem', label: t('nav.systems') },
    { href: '#alur', label: t('nav.process') },
    { href: '#portofolio', label: t('nav.portfolio') },
    { href: '#kontak', label: t('nav.contact') },
  ];

  return (
    <div className="min-h-[100dvh] bg-white text-zinc-600 flex flex-col overflow-x-clip">
      {/* HEADER (Copora-inspired single row: Brand left, nav centered, sleek ID/EN + phone + solid CTA right) */}
      <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-zinc-100">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8 h-20 lg:h-24 flex items-center justify-between gap-4">
          <a
            href="#top"
            onClick={(e) => {
              e.preventDefault();
              window.scrollTo({ top: 0, behavior: 'smooth' });
            }}
            className="inline-flex items-center rounded-md min-h-[44px] py-1 shrink-0"
            aria-label="Ersona Home"
          >
            <BrandLogo size="md" showText={true} />
          </a>

          <nav
            aria-label={isEn ? 'Primary navigation' : 'Navigasi utama'}
            className="hidden lg:flex items-center mx-auto gap-1 text-sm font-medium text-zinc-600"
          >
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="min-h-[44px] px-3.5 inline-flex items-center hover:text-[#121512] transition-colors"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="flex items-center gap-3 sm:gap-5 shrink-0">
            {/* Airy inline ID / EN switcher (replaces bulky gray pill bar) */}
            <div
              className="inline-flex items-center"
              role="group"
              aria-label={isEn ? 'Select language' : 'Pilih bahasa'}
            >
              <button
                type="button"
                onClick={() => setLanguage('id')}
                aria-pressed={language === 'id'}
                className={`min-h-[44px] px-2 text-xs tracking-wide transition-colors ${
                  language === 'id'
                    ? 'font-semibold text-[#121512] underline decoration-[#121512] decoration-2 underline-offset-4'
                    : 'font-medium text-zinc-500 hover:text-zinc-900'
                }`}
              >
                ID
              </button>
              <span className="text-zinc-400 text-xs select-none" aria-hidden="true">/</span>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                aria-pressed={language === 'en'}
                className={`min-h-[44px] px-2 text-xs tracking-wide transition-colors ${
                  language === 'en'
                    ? 'font-semibold text-[#121512] underline decoration-[#121512] decoration-2 underline-offset-4'
                    : 'font-medium text-zinc-500 hover:text-zinc-900'
                }`}
              >
                EN
              </button>
            </div>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden md:inline-flex items-center min-h-[44px] font-mono text-sm font-medium text-zinc-900 hover:text-zinc-600 tabular-nums transition-colors"
            >
              {WHATSAPP_NUMBER_DISPLAY}
            </a>

            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center min-h-[44px] px-5 rounded-lg bg-[#121512] hover:bg-zinc-800 text-white text-sm font-medium transition-colors active:scale-[0.98]"
            >
              {t('nav.consultCta')}
            </a>

            <button
              type="button"
              onClick={() => setMobileMenuOpen((prev) => !prev)}
              aria-expanded={mobileMenuOpen}
              aria-label={mobileMenuOpen ? t('nav.closeMenu') : t('nav.openMenu')}
              className="lg:hidden w-11 h-11 inline-flex items-center justify-center rounded-md bg-[#121512] text-white"
            >
              {mobileMenuOpen ? <X className="w-5 h-5" aria-hidden="true" /> : <Menu className="w-5 h-5" aria-hidden="true" />}
            </button>
          </div>
        </div>

        {/* Mobile Drawer */}
        {mobileMenuOpen && (
          <nav
            aria-label={isEn ? 'Mobile navigation' : 'Navigasi ponsel'}
            className="lg:hidden border-t border-zinc-200 bg-white px-5 py-4 space-y-1"
          >
            {navLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                onClick={() => setMobileMenuOpen(false)}
                className="flex items-center justify-between min-h-[44px] px-3 rounded-lg text-sm font-medium text-zinc-800 hover:bg-zinc-100"
              >
                <span>{item.label}</span>
                <ArrowRight className="w-4 h-4 text-zinc-500" aria-hidden="true" />
              </a>
            ))}
            <a
              href={whatsappUrl}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="mt-3 flex items-center justify-center gap-2 min-h-[48px] w-full rounded-lg bg-[#121512] text-white text-sm font-medium"
            >
              <Phone className="w-4 h-4" aria-hidden="true" />
              <span>{t('hero.ctaWhatsapp')}</span>
            </a>
          </nav>
        )}
      </header>

      <main id="top" className="flex-1">
        {/* 1. HERO (Copora 2-column Bento with Full-Ratio Empty Canvases Ready for Real Images) */}
        <section className="max-w-[1440px] mx-auto px-5 sm:px-8 pt-6 pb-16 sm:pt-10 sm:pb-20 lg:pt-12 lg:pb-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-14 items-stretch">
            {/* Left Editorial Proposition */}
            <div className="lg:col-span-6 flex flex-col justify-between gap-10 py-1" data-enter>
              <div className="space-y-5">
                <h1 className="font-display text-4xl sm:text-5xl lg:text-[3.375rem] font-medium tracking-[-0.025em] leading-[1.14] text-[#09090B] max-w-[16ch] text-balance">
                  {t('hero.title')}
                </h1>

                <p className="text-base sm:text-lg text-zinc-600 leading-relaxed max-w-[46ch]">
                  {t('hero.subtitle')}
                </p>

                <div className="pt-3 flex flex-wrap items-center gap-4">
                  <a
                    id="hero-primary-cta"
                    href={whatsappUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center justify-center gap-2 min-h-[52px] px-7 rounded-lg bg-[#121512] hover:bg-zinc-800 text-white text-sm sm:text-base font-medium transition-colors active:scale-[0.98]"
                  >
                    <span>{t('hero.ctaWhatsapp')}</span>
                  </a>
                  <a
                    href="#sistem"
                    className="inline-flex items-center gap-1.5 min-h-[48px] px-3 text-sm sm:text-base font-medium text-zinc-700 hover:text-[#121512] transition-colors"
                  >
                    <span>{t('hero.ctaServices')}</span>
                    <ArrowRight className="w-4 h-4" aria-hidden="true" />
                  </a>
                </div>
              </div>

              {/* Bottom Left Anchor aligned to Bento footer edge */}
              <div className="pt-8 border-t border-zinc-200 flex flex-col sm:flex-row sm:items-end justify-between gap-6">
                <div className="space-y-1 max-w-[34ch]">
                  <div className="text-sm font-semibold text-zinc-900">
                    {t('hero.anchorTitle')}
                  </div>
                  <p className="text-sm text-zinc-600 leading-relaxed">
                    {t('hero.anchorDesc')}
                  </p>
                </div>
                <div className="shrink-0">
                  <div className="text-xs font-medium tracking-wider uppercase text-zinc-500">
                    {t('hero.coordEmailLabel')}
                  </div>
                  <a
                    href={`mailto:${EMAIL_ADDRESS}`}
                    className="font-mono text-sm font-medium text-zinc-900 hover:underline mt-0.5 inline-flex items-center min-h-[44px] sm:min-h-[28px]"
                  >
                    {EMAIL_ADDRESS}
                  </a>
                </div>
              </div>
            </div>

            {/* Right Asymmetric 3-Frame Bento (Full-Ratio Empty Image Canvases) */}
            <div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-3 min-h-[460px] lg:min-h-[560px]" data-enter>
              {/* Frame 1: Tall Portrait Canvas 01 (Drop full-bleed <img> with w-full h-full object-cover) */}
              <div className="rounded-lg overflow-hidden bg-[#F4F4F5] border border-zinc-200/80 min-h-[340px] sm:min-h-full relative flex flex-col justify-end">
                {/* TODO: Replace placeholder div with <img src="/images/hero-main.jpg" alt="..." className="w-full h-full object-cover" /> */}
                <div className="p-4 flex items-center justify-between gap-2 text-xs font-mono text-zinc-600">
                  <span>{t('hero.canvasMain')}</span>
                </div>
              </div>

              {/* Column 2: Two Stacked Landscape Empty Image Canvases */}
              <div className="flex flex-col gap-3">
                {/* Frame 2: Landscape Canvas 02 (Drop full-bleed <img> with w-full h-full object-cover) */}
                <div className="rounded-lg overflow-hidden bg-[#F4F4F5] border border-zinc-200/80 flex-1 min-h-[230px] relative flex flex-col justify-end">
                  {/* TODO: Replace placeholder div with <img src="/images/hero-top.jpg" alt="..." className="w-full h-full object-cover" /> */}
                  <div className="p-4 flex items-center justify-between gap-2 text-xs font-mono text-zinc-600">
                    <span>{t('hero.canvasTop')}</span>
                  </div>
                </div>

                {/* Frame 3: Landscape Canvas 03 (Drop full-bleed <img> with w-full h-full object-cover) */}
                <div className="rounded-lg overflow-hidden bg-[#F4F4F5] border border-zinc-200/80 flex-1 min-h-[220px] relative flex flex-col justify-end">
                  {/* TODO: Replace placeholder div with <img src="/images/hero-preview.jpg" alt="..." className="w-full h-full object-cover" /> */}
                  <div className="p-4 flex items-center justify-between gap-2 text-xs font-mono text-zinc-600">
                    <span>{t('hero.canvasSub')}</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* 2. SERVICES GRID (Soft Neutral Band matching Copora Section 2) */}
        <section id="sistem" className="scroll-mt-24 bg-[#F4F4F5] border-y border-zinc-200/80 py-20 lg:py-28">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 space-y-12">
            <div className="max-w-2xl space-y-4">
              <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.18] text-[#09090B] text-balance">
                {t('systems.title')}
              </h2>
              <p className="text-base text-zinc-600 leading-relaxed max-w-[50ch]">
                {t('systems.subtitle')}
              </p>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
              {t('systems.items').map((item) => (
                <article
                  key={item.chip}
                  className="rounded-lg bg-white border border-zinc-200/80 overflow-hidden flex flex-col justify-between transition-colors hover:border-zinc-300"
                >
                  {/* Full-ratio 4:3 empty canvas slot for future service screenshot/photo */}
                  <div className="aspect-[4/3] w-full bg-[#ECECEE] border-b border-zinc-200/70 p-4 flex flex-col justify-between">
                    <div className="flex justify-end">
                      <span className="font-mono text-xs text-zinc-600">{item.ratio}</span>
                    </div>
                    <div>
                      <span className="inline-block bg-white px-3 py-1.5 rounded text-xs font-medium text-[#121512]">
                        {item.chip}
                      </span>
                    </div>
                  </div>

                  <div className="p-6 space-y-2.5 flex-1">
                    <h3 className="font-display text-lg font-medium text-[#09090B] leading-snug">
                      {item.title}
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {item.desc}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 3. HOW WE WORK (Copora Charcoal Accent Section with Interactive Tabs & Full-Ratio Canvas) */}
        <section id="alur" className="scroll-mt-24 bg-[#121512] text-white py-20 lg:py-28">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-20 items-center">
              {/* Left 4:5 Full-Ratio Visual Canvas */}
              <div className="lg:col-span-5">
                <div className="aspect-[4/5] w-full rounded-lg overflow-hidden bg-[#1B1F1B] border border-zinc-800 p-5 flex flex-col justify-between">
                  <span className="font-mono text-xs text-zinc-400">
                    {t('process.canvasLabel')}
                  </span>
                  <div className="bg-white text-[#121512] rounded p-4 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium leading-snug">
                      {t('process.bannerPrompt')}
                    </span>
                    <a
                      href={whatsappUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="w-11 h-11 rounded bg-[#121512] text-white inline-flex items-center justify-center shrink-0 hover:bg-zinc-800 transition-colors"
                      aria-label={t('hero.ctaWhatsapp')}
                    >
                      <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
                    </a>
                  </div>
                </div>
              </div>

              {/* Right Interactive Step Tabs */}
              <div className="lg:col-span-7 space-y-8">
                <div className="space-y-4">
                  <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.18] text-white text-balance">
                    {t('process.title')}
                  </h2>
                  <p className="text-base text-zinc-400 leading-relaxed max-w-[48ch]">
                    {t('process.subtitle')}
                  </p>
                </div>

                {/* Tabs matching Copora dark underline switcher */}
                <div
                  role="tablist"
                  aria-label={t('process.title')}
                  className="grid grid-cols-3 border-b border-zinc-800 gap-2"
                >
                  {steps.map((step, idx) => {
                    const isSelected = idx === activeStepIndex;
                    return (
                      <button
                        key={step.id}
                        type="button"
                        role="tab"
                        aria-selected={isSelected}
                        onClick={() => setActiveStepIndex(idx)}
                        className={`min-h-[48px] py-3 text-left text-xs sm:text-sm font-medium flex items-center gap-2 border-b-2 -mb-[1px] transition-colors ${
                          isSelected
                            ? 'border-white text-white'
                            : 'border-transparent text-zinc-400 hover:text-zinc-200'
                        }`}
                      >
                        <span
                          className={`w-1.5 h-1.5 rounded-full shrink-0 transition-colors ${
                            isSelected ? 'bg-[#E07A28]' : 'bg-zinc-600'
                          }`}
                          aria-hidden="true"
                        />
                        <span>{step.num} · {step.tabLabel}</span>
                      </button>
                    );
                  })}
                </div>

                {activeStep && (
                  <div key={activeStep.id} data-panel-enter className="space-y-4 pt-2 min-h-[160px]">
                    <h3 className="font-display text-2xl font-medium text-white">
                      {activeStep.headline}
                    </h3>
                    <p className="text-base text-zinc-300 leading-relaxed max-w-[54ch]">
                      {activeStep.desc}
                    </p>
                    <ul className="space-y-2 pt-2">
                      {activeStep.points.map((pt) => (
                        <li key={pt} className="flex items-start gap-2.5 text-sm text-zinc-400">
                          <Check className="w-4 h-4 text-[#E07A28] shrink-0 mt-0.5" aria-hidden="true" />
                          <span>{pt}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          </div>
        </section>

        {/* 4. PORTFOLIO & DEMO BLUEPRINTS (Clean Full-Ratio 16:10 Canvases on White Canvas) */}
        <section id="portofolio" className="scroll-mt-24 bg-white py-20 lg:py-28">
          <div className="max-w-[1440px] mx-auto px-5 sm:px-8 space-y-12">
            <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 border-b border-zinc-200 pb-8">
              <div className="max-w-2xl space-y-3">
                <h2 className="font-display text-3xl sm:text-5xl font-medium tracking-[-0.025em] leading-[1.18] text-[#09090B]">
                  {t('portfolio.title')}
                </h2>
                <p className="text-base text-zinc-600 leading-relaxed">
                  {t('portfolio.subtitle')}
                </p>
              </div>
              <a
                href={whatsappUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 min-h-[44px] text-sm font-medium text-[#121512] underline underline-offset-4 hover:text-zinc-600 shrink-0"
              >
                <span>{t('portfolio.askDemoCta')}</span>
                <ArrowUpRight className="w-4 h-4" aria-hidden="true" />
              </a>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-7">
              {t('portfolio.slots').map((slot) => (
                <article key={slot.code} className="group flex flex-col">
                  {/* Full-ratio 16:10 clean empty canvas ready for edge-to-edge screenshot */}
                  <div className="aspect-[16/10] w-full rounded-lg overflow-hidden bg-[#F4F4F5] border border-zinc-200/80 p-4 flex flex-col justify-between transition-colors group-hover:border-zinc-300">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-mono tabular-nums text-xs font-semibold text-[#121512] bg-white px-2.5 py-1 rounded">
                        {slot.code}
                      </span>
                      <span className="text-xs font-medium text-zinc-600">
                        {t('portfolio.statusSoon')}
                      </span>
                    </div>
                    <span className="font-mono text-xs text-zinc-600">16:10</span>
                  </div>

                  <div className="pt-5 space-y-2">
                    <div className="text-xs font-medium text-zinc-600">
                      {slot.category}
                    </div>
                    <h3 className="font-display text-xl font-medium text-[#09090B] leading-snug">
                      {slot.title}
                    </h3>
                    <p className="text-sm text-zinc-600 leading-relaxed">
                      {slot.desc}
                    </p>
                  </div>
                </article>
              ))}
            </div>
          </div>
        </section>

        {/* 5. DIRECT CONTACT (Warm Light Band -> Clean White Ruled Card) */}
        <section id="kontak" className="scroll-mt-24 bg-[#F4F4F5] border-t border-zinc-200/80 py-20 lg:py-24">
          <div className="max-w-[1260px] mx-auto px-5 sm:px-8">
            <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16 items-center">
              <div className="lg:col-span-5 space-y-4">
                <h2 className="font-display text-3xl sm:text-4xl font-medium tracking-[-0.025em] leading-[1.2] text-[#09090B]">
                  {t('contact.cardTitle')}
                </h2>
                <p className="text-base text-zinc-600 leading-relaxed max-w-[44ch]">
                  {t('contact.cardDesc')}
                </p>
              </div>

              <div className="lg:col-span-7">
                <div className="rounded-xl border border-zinc-200 bg-white divide-y divide-zinc-200 overflow-hidden">
                  {/* WhatsApp Contact Row */}
                  <div className="p-6 sm:px-8 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {t('contact.waLabel')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy('0895629460463', 'wa')}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors"
                        aria-label={isEn ? 'Copy WhatsApp number' : 'Salin nomor WhatsApp'}
                      >
                        {copiedField === 'wa' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                            <span className="text-emerald-800">{t('common.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t('common.copy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="font-mono text-base sm:text-lg font-semibold text-[#09090B] tabular-nums">
                        {WHATSAPP_NUMBER_DISPLAY}
                      </span>
                      <a
                        href={whatsappUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg bg-[#121512] hover:bg-zinc-800 text-white text-xs sm:text-sm font-medium transition-colors"
                      >
                        <Phone className="w-3.5 h-3.5" aria-hidden="true" />
                        <span>{t('contact.waAction')}</span>
                      </a>
                    </div>
                  </div>

                  {/* Email Contact Row */}
                  <div className="p-6 sm:px-8 space-y-2.5">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                        {t('contact.emailLabel')}
                      </span>
                      <button
                        type="button"
                        onClick={() => handleCopy(EMAIL_ADDRESS, 'email')}
                        className="inline-flex items-center gap-1.5 min-h-[44px] px-3 text-xs font-medium text-zinc-600 hover:text-zinc-900 rounded-md hover:bg-zinc-100 transition-colors"
                        aria-label={isEn ? 'Copy email address' : 'Salin alamat email'}
                      >
                        {copiedField === 'email' ? (
                          <>
                            <Check className="w-3.5 h-3.5 text-emerald-700" aria-hidden="true" />
                            <span className="text-emerald-800">{t('common.copied')}</span>
                          </>
                        ) : (
                          <>
                            <Copy className="w-3.5 h-3.5" aria-hidden="true" />
                            <span>{t('common.copy')}</span>
                          </>
                        )}
                      </button>
                    </div>
                    <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
                      <span className="font-mono text-base font-semibold text-[#09090B] break-all">
                        {EMAIL_ADDRESS}
                      </span>
                      <a
                        href={`mailto:${EMAIL_ADDRESS}`}
                        className="inline-flex items-center justify-center gap-2 min-h-[44px] px-5 rounded-lg bg-white hover:bg-zinc-100 text-[#121512] border border-zinc-300 text-xs sm:text-sm font-medium transition-colors shrink-0"
                      >
                        <Mail className="w-3.5 h-3.5 text-zinc-600" aria-hidden="true" />
                        <span>{t('contact.emailAction')}</span>
                      </a>
                    </div>
                  </div>

                  <div aria-live="polite" className="sr-only">
                    {copiedField ? t('common.copied') : ''}
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>
      </main>

      {/* FOOTER (Dark #121512 Foundation matching Copora Footer) */}
      <footer className="bg-[#121512] text-zinc-400 pt-16 pb-10">
        <div className="max-w-[1440px] mx-auto px-5 sm:px-8">
          <div className="grid grid-cols-1 md:grid-cols-12 gap-10 pb-12 border-b border-zinc-800">
            <div className="md:col-span-6 space-y-4">
              <BrandLogo size="sm" showText={true} inverted={true} />
              <p className="text-sm text-zinc-400 max-w-sm leading-relaxed">
                {t('footer.tagline')}
              </p>
              <div className="pt-2 flex flex-col sm:flex-row sm:items-center gap-4 text-sm font-mono text-zinc-300">
                <a
                  href={`mailto:${EMAIL_ADDRESS}`}
                  className="hover:text-white hover:underline min-h-[44px] inline-flex items-center"
                >
                  {EMAIL_ADDRESS}
                </a>
                <a
                  href={whatsappUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white hover:underline tabular-nums min-h-[44px] inline-flex items-center"
                >
                  {WHATSAPP_NUMBER_DISPLAY}
                </a>
              </div>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t('footer.colNav')}
              </div>
              <ul className="space-y-1 text-sm">
                {navLinks.map((item) => (
                  <li key={item.href}>
                    <a
                      href={item.href}
                      className="min-h-[44px] inline-flex items-center text-zinc-300 hover:text-white transition-colors"
                    >
                      {item.label}
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            <div className="md:col-span-3 space-y-3">
              <div className="text-xs font-semibold uppercase tracking-wider text-zinc-400">
                {t('footer.colLegal')}
              </div>
              <ul className="space-y-1 text-sm">
                <li>
                  <a
                    href="/privacy"
                    onClick={(e) => {
                      if (onNavigatePrivacy) {
                        e.preventDefault();
                        onNavigatePrivacy();
                      }
                    }}
                    className="min-h-[44px] inline-flex items-center text-zinc-300 hover:text-white transition-colors"
                  >
                    {t('footer.privacy')}
                  </a>
                </li>
                <li>
                  <a
                    href="/terms"
                    onClick={(e) => {
                      if (onNavigateTerms) {
                        e.preventDefault();
                        onNavigateTerms();
                      }
                    }}
                    className="min-h-[44px] inline-flex items-center text-zinc-300 hover:text-white transition-colors"
                  >
                    {t('footer.terms')}
                  </a>
                </li>
              </ul>
            </div>
          </div>

          <div className="pt-8 flex flex-col sm:flex-row sm:items-center justify-between gap-2 text-xs text-zinc-400">
            <span>{t('footer.rights')}</span>
            <span className="font-mono">ersona.site</span>
          </div>
        </div>
      </footer>

      {/* Floating Back to Top */}
      {showBackToTop && (
        <button
          type="button"
          onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          aria-label={isEn ? 'Back to top' : 'Kembali ke atas'}
          className="fixed bottom-5 right-5 z-40 w-11 h-11 rounded-full bg-[#121512] hover:bg-zinc-800 text-white border border-zinc-700 inline-flex items-center justify-center transition-transform active:scale-95"
        >
          <ArrowUp className="w-4 h-4" aria-hidden="true" />
        </button>
      )}
    </div>
  );
}
