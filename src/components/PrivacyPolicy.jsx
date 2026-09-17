import React from 'react';
import BrandLogo from './BrandLogo';
import { ArrowLeft, Shield, Lock, Eye, Mail, FileText } from 'lucide-react';

export default function PrivacyPolicy({ onBack }) {
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
          <div className="inline-flex items-center space-x-2 px-3 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/50 border border-emerald-200/80 dark:border-emerald-800 text-emerald-700 dark:text-emerald-300 text-xs font-semibold mb-4">
            <Shield className="w-3.5 h-3.5" />
            <span>Official Privacy Document</span>
          </div>
          <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-neutral-950 dark:text-white">
            Privacy Policy
          </h1>
          <p className="mt-2 text-sm text-neutral-500 dark:text-neutral-400">
            Last updated: September 17, 2026 • Effective immediately
          </p>
        </div>

        <div className="prose prose-neutral dark:prose-invert max-w-none text-sm leading-relaxed space-y-8 text-neutral-700 dark:text-neutral-300">
          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <span>1. Overview & Commitment</span>
            </h2>
            <p>
              Welcome to <strong>Ersona</strong> (accessible at <a href="https://ersona.site" className="text-blue-600 dark:text-blue-400 hover:underline">https://ersona.site</a>). 
              Ersona is a minimalist, distraction-free workspace designed to help individuals and teams organize tasks, notes, and collaborative projects.
            </p>
            <p>
              We believe privacy is a fundamental human right. We do not sell your personal information, we do not show intrusive behavioral advertisements, and we only collect the minimum amount of data required to provide and secure our services.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              2. Information We Collect
            </h2>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Account Information:</strong> When you register via email and password, we collect your email address. When you sign in using Google OAuth, we receive your Google email address, display name, and profile picture avatar.
              </li>
              <li>
                <strong>User Content:</strong> Any tasks, checklists, subtasks, notes, comments, and media files (images/attachments) you create or upload in your private or team workspaces.
              </li>
              <li>
                <strong>Technical & Device Data:</strong> Basic log data such as IP address, browser type, and operating system required for security, session maintenance, and offline PWA functionality.
              </li>
            </ul>
          </section>

          <section className="space-y-3 p-5 rounded-2xl bg-neutral-100/70 dark:bg-[#1c1c1c] border border-neutral-200/80 dark:border-neutral-800">
            <h2 className="text-base font-semibold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <Lock className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
              <span>3. Google API Services User Data Policy Compliance</span>
            </h2>
            <p>
              Ersona requests only basic Google OAuth scopes (<code className="text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">openid</code>, <code className="text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">email</code>, <code className="text-xs bg-neutral-200 dark:bg-neutral-700 px-1.5 py-0.5 rounded">profile</code>) solely to authenticate your identity and facilitate seamless account login.
            </p>
            <p className="font-medium text-neutral-900 dark:text-neutral-100">
              Ersona's use and transfer to any other app of information received from Google APIs will adhere to the{' '}
              <a 
                href="https://developers.google.com/terms/api-services-user-data-policy" 
                target="_blank" 
                rel="noreferrer" 
                className="text-blue-600 dark:text-blue-400 underline"
              >
                Google API Services User Data Policy
              </a>
              , including the Limited Use requirements.
            </p>
            <ul className="list-disc pl-5 space-y-1.5 text-xs text-neutral-600 dark:text-neutral-300">
              <li>We never use Google user data for advertising purposes.</li>
              <li>We never sell or transfer Google user data to data brokers.</li>
              <li>We do not use your private task or notes data to train generalized AI models.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              4. How We Use Your Data
            </h2>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>To provide, operate, and maintain your personal and collaborative workspaces.</li>
              <li>To synchronize your tasks, notes, checklists, and comments in realtime across your devices.</li>
              <li>To send essential transactional notifications (password resets, invitation approvals, or assigned task alerts).</li>
              <li>To maintain data integrity, security, and prevent abuse or unauthorized access.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              5. Third-Party Service Providers
            </h2>
            <p>We work with trusted infrastructure providers to run Ersona securely:</p>
            <ul className="list-disc pl-5 space-y-2">
              <li>
                <strong>Supabase (PostgreSQL & Authentication):</strong> Secure cloud database storage, authentication, and realtime data synchronization.
              </li>
              <li>
                <strong>Vercel & Cloudflare:</strong> Edge hosting, encrypted SSL/TLS data transmission, and object storage for user-uploaded media files.
              </li>
              <li>
                <strong>Resend:</strong> Secure transactional email delivery for confirmation and password recovery.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              6. Data Retention & Your Rights
            </h2>
            <p>
              You maintain full ownership of your data at all times. You have the right to:
            </p>
            <ul className="list-disc pl-5 space-y-1.5">
              <li>Access, modify, or export your personal notes, tasks, and media files.</li>
              <li>Permanently delete any task, note, workspace, or attachment directly from the application.</li>
              <li>Request complete deletion of your account and all associated data by contacting our support team at <a href="mailto:support@ersona.site" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">support@ersona.site</a>.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-lg font-semibold text-neutral-900 dark:text-neutral-100">
              7. Contact Us
            </h2>
            <p>
              If you have any questions, concerns, or requests regarding this Privacy Policy or your data, please contact our Data Protection representative:
            </p>
            <div className="p-4 rounded-xl bg-white dark:bg-[#1a1a1a] border border-neutral-200 dark:border-neutral-800 text-xs space-y-1.5">
              <p className="font-semibold text-neutral-900 dark:text-neutral-100">Ersona Workspace</p>
              <p className="flex items-center space-x-2">
                <Mail className="w-3.5 h-3.5 text-neutral-500" />
                <span>Email Support: </span>
                <a href="mailto:support@ersona.site" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  support@ersona.site
                </a>
              </p>
              <p className="flex items-center space-x-2">
                <FileText className="w-3.5 h-3.5 text-neutral-500" />
                <span>Website: </span>
                <a href="https://ersona.site" className="text-blue-600 dark:text-blue-400 hover:underline font-medium">
                  https://ersona.site
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
