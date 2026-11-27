import React from 'react';
import BrandLogo from './BrandLogo';
import { ArrowLeft, Mail, Phone } from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export default function TermsOfService({ onBack }) {
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
            {isEn ? 'Terms of Service' : 'Ketentuan Layanan'}
          </h1>
          <p className="mt-2 font-mono text-xs text-zinc-500">
            {isEn ? 'Updated: November 27, 2026' : 'Diperbarui: 27 November 2026'}
          </p>
        </div>

        <div className="space-y-8 text-sm sm:text-base leading-relaxed text-zinc-600">
          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '1. Scope of Consultation & Agreements' : '1. Konsultasi & Kesepakatan Proyek'}
            </h2>
            <p>
              {isEn
                ? 'Information presented on ersona.site serves as an overview of our custom web application and software development services. Exact feature scope, timeline, deliverables, and pricing are agreed upon in writing prior to starting work.'
                : 'Informasi di ersona.site merupakan gambaran layanan pembuatan sistem dan aplikasi web custom kami. Lingkup fitur, estimasi waktu pengerjaan, serta rincian biaya disepakati secara tertulis sebelum proyek dimulai.'}
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '2. Ownership of Deliverables' : '2. Kepemilikan Hasil Pekerjaan'}
            </h2>
            <p>
              {isEn
                ? 'Upon final project settlement as specified in the project agreement, the custom web system source deliverables and domain configurations belong to the client.'
                : 'Setelah penyelesaian proyek sesuai kesepakatan, hak penggunaan sistem web custom dan akses pengelolaan domain menjadi milik penuh pihak klien.'}
            </p>
          </section>

          <section className="space-y-3 border-t border-zinc-200 pt-6">
            <h2 className="font-display text-lg font-semibold text-zinc-900">
              {isEn ? '3. Inquiries & Support' : '3. Pertanyaan & Dukungan'}
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
