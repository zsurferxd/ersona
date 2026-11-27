import React from 'react';
import BrandLogo from './BrandLogo';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export default function PrivacyPolicy({ onBack }) {
  const { isEn } = useThemeLanguage();

  return (
    <div className="min-h-[100dvh] bg-white text-zinc-900 flex flex-col">
      <header className="sticky top-0 z-30 bg-white/95 backdrop-blur-sm border-b border-zinc-200">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => (onBack ? onBack() : (window.location.href = '/'))}
              className="w-11 h-11 inline-flex items-center justify-center rounded-lg text-zinc-600 hover:text-zinc-900 hover:bg-zinc-100 transition-colors"
              aria-label={isEn ? 'Back to Home' : 'Kembali ke Beranda'}
            >
              <ArrowLeft className="w-4 h-4" aria-hidden="true" />
            </button>
            <BrandLogo size="sm" showText={true} />
          </div>
          <a
            href="/"
            onClick={(e) => {
              if (onBack) {
                e.preventDefault();
                onBack();
              }
            }}
            className="font-mono text-xs font-medium text-zinc-600 hover:text-zinc-900 hover:underline min-h-[44px] inline-flex items-center"
          >
            ersona.site
          </a>
        </div>
      </header>

      <main className="flex-1 max-w-3xl w-full mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <div>
          <h1 className="font-display text-3xl sm:text-4xl font-semibold tracking-tight text-zinc-950">
            {isEn ? 'Privacy Policy' : 'Kebijakan Privasi'}
          </h1>
          <p className="mt-2 font-mono text-xs text-zinc-500">
            {isEn ? 'Updated: November 27, 2026' : 'Diperbarui: 27 November 2026'}
          </p>
        </div>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-zinc-600">
          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '1. Overview' : '1. Ringkasan Layanan'}
            </h2>
            <p>
              {isEn
                ? 'Ersona on ersona.site provides custom web application development, operational business software, and company websites for growing businesses.'
                : 'Ersona di situs ersona.site menyediakan layanan pembuatan aplikasi web custom, sistem operasional bisnis, dan website perusahaan untuk UMKM maupun kantor.'}
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '2. Information You Share' : '2. Informasi yang Anda Berikan'}
            </h2>
            <p>
              {isEn
                ? 'This website operates as an informational company profile and does not require account registration, login, or tracking cookies. We only receive contact details and project notes that you voluntarily share when reaching out via WhatsApp or Email for consultation.'
                : 'Situs ini berfungsi sebagai profil perusahaan statis tanpa fitur pendaftaran akun maupun pelacakan iklan. Kami hanya menerima detail kontak dan kebutuhan proyek yang Anda kirimkan secara langsung saat menghubungi kami melalui WhatsApp atau Email.'}
            </p>
            <p>
              {isEn
                ? 'Language selection between ID and EN is stored locally in your browser storage solely to remember your display setting.'
                : 'Pilihan bahasa antara ID dan EN hanya disimpan di penyimpanan lokal browser Anda agar tidak perlu diatur ulang.'}
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '3. Client Project Confidentiality' : '3. Kerahasiaan Data Proyek Klien'}
            </h2>
            <p>
              {isEn
                ? 'All business records, pricing sheets, credentials, and operational materials shared during software development are kept confidential and are never published in our public portfolio without explicit consent.'
                : 'Seluruh dokumen usaha, data operasional, akses akun, dan informasi proyek yang Anda bagikan selama pengerjaan sistem dijaga kerahasiaannya dan tidak dipublikasikan ke portofolio tanpa persetujuan Anda.'}
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '4. Contact' : '4. Kontak'}
            </h2>
            <div className="p-5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm space-y-2">
              <div className="flex items-center gap-2.5">
                <Mail className="w-4 h-4 text-[#121512] shrink-0" aria-hidden="true" />
                <a href="mailto:support@ersona.site" className="font-mono text-xs sm:text-sm text-zinc-900 hover:underline">
                  support@ersona.site
                </a>
              </div>
              <div className="flex items-center gap-2.5">
                <Phone className="w-4 h-4 text-[#121512] shrink-0" aria-hidden="true" />
                <a href="https://wa.me/62895629460463" target="_blank" rel="noopener noreferrer" className="font-mono text-xs sm:text-sm text-zinc-900 hover:underline">
                  0895-6294-60463 · WhatsApp
                </a>
              </div>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
}
