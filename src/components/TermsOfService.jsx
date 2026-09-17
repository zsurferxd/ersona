import React from 'react';
import BrandLogo from './BrandLogo';
import { ArrowLeft, FileCheck, Mail } from 'lucide-react';

export default function TermsOfService({ onBack }) {
  return (
    <div className="min-h-screen bg-[#FAFAFA] dark:bg-[#121212] text-neutral-900 dark:text-neutral-100 font-sans selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900">
      {/* Header */}
      <header className="sticky top-0 z-30 bg-white/80 dark:bg-[#181818]/80 backdrop-blur-md border-b border-neutral-200/80 dark:border-neutral-800">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <button
              type="button"
              onClick={() => onBack ? onBack() : (window.location.href = '/')}
              className="p-2 rounded-xl text-neutral-500 hover:text-neutral-900 dark:text-neutral-400 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              title="Kembali ke Beranda"
            >
              <ArrowLeft className="w-4 h-4" />
            </button>
            <BrandLogo size="sm" showText={true} />
          </div>
          <a
            href="/"
            className="text-xs font-semibold text-neutral-600 dark:text-neutral-300 hover:underline"
          >
            ersona.site
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-3xl mx-auto px-4 sm:px-6 py-12 sm:py-16 space-y-10">
        <div>
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-blue-50 dark:bg-blue-950/50 border border-blue-200/80 dark:border-blue-800 text-blue-700 dark:text-blue-300 text-xs font-semibold mb-4">
            <FileCheck className="w-3.5 h-3.5" />
            <span>Terms of Service</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Terms of Service
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: September 17, 2026 • Effective immediately
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-8 text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              1. Acceptance of Terms
            </h2>
            <p>
              By accessing or using Ersona (located at <a href="https://ersona.site" className="text-blue-600 dark:text-blue-400 hover:underline">https://ersona.site</a>), you agree to be bound by these Terms of Service. If you do not agree to these terms, please do not use the application.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              2. User Accounts & Security
            </h2>
            <p>
              You are responsible for maintaining the confidentiality of your account credentials (whether created via email/password or authenticated through Google OAuth). You are responsible for all activities that occur under your account.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              3. User Content & Ownership
            </h2>
            <p>
              You retain all rights and intellectual property ownership over the notes, tasks, checklists, media files, and messages you create or upload in Ersona. We claim no ownership over your data.
            </p>
            <p>
              You agree not to upload any content that is illegal, defamatory, infringes upon copyright, or violates applicable laws.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              4. Service Availability & Modifications
            </h2>
            <p>
              Ersona provides services on an &quot;as is&quot; and &quot;as available&quot; basis. While we strive for 99.9% uptime and implement continuous backups and offline caching via PWA technology, we reserve the right to modify, suspend, or update features to improve service reliability and user experience.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              5. Contact & Inquiries
            </h2>
            <p>
              For questions or clarifications regarding these Terms, please contact:
            </p>
            <div className="p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Ersona Support</p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>Email: </span>
                <a href="mailto:support@ersona.site" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  support@ersona.site
                </a>
              </p>
            </div>
          </section>
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-neutral-200/80 dark:border-neutral-800 py-8 text-center text-xs text-neutral-400">
        <p>&copy; {new Date().getFullYear()} Ersona. All rights reserved.</p>
      </footer>
    </div>
  );
}
