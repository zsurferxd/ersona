import React, { useState } from 'react';
import {
  CheckCircle2, Circle, Flag, Calendar, Bell, Paperclip,
  Columns3, List, Layers, Trash2, Sparkles, ArrowRight,
  ShieldCheck, Smartphone, Eye, ExternalLink, Check,
  Search, ArrowUpDown, ChevronDown, Sun, Moon, Globe
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';

export default function LandingPage({ onStartAuth, user, onGoToDashboard }) {
  const { theme, isDark, toggleTheme, language, isEn, setLanguage, t } = useThemeLanguage();

  // State untuk Switcher Tampilan (Papan Kolom vs Baris) di dalam Preview Mockup
  const [previewMode, setPreviewMode] = useState('board'); // 'board' | 'list'

  // Data Representasi Visual Antarmuka Ersona (Statis & Rapi)
  const previewTasks = [
    {
      id: 1,
      title: isEn ? 'Design Supabase database architecture & RLS' : 'Rancang arsitektur database Supabase & RLS',
      status: 'todo',
      statusLabel: 'To Do',
      statusColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      priority: 'urgent',
      priorityLabel: isEn ? '🔥 Urgent' : '🔥 Mendesak',
      priorityColor: 'bg-red-50 dark:bg-red-950/50 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
      date: '16 Sep',
      reminder: '15 Sep',
      completed: false,
    },
    {
      id: 2,
      title: isEn ? 'Implement responsive kanban board & swipe gesture' : 'Implementasi alur kerja kanban & drag responsive',
      status: 'todo',
      statusLabel: 'To Do',
      statusColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      priority: 'high',
      priorityLabel: isEn ? '🔴 High' : '🔴 Tinggi',
      priorityColor: 'bg-amber-50 dark:bg-amber-950/50 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      date: '17 Sep',
      completed: false,
    },
    {
      id: 3,
      title: isEn ? 'Optimize image compression & multimedia attachments' : 'Optimalisasi kompresi foto & lampiran catatan',
      status: 'in_progress',
      statusLabel: 'In Progress',
      statusColor: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900',
      priority: 'medium',
      priorityLabel: isEn ? '🟡 Medium' : '🟡 Sedang',
      priorityColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      date: '18 Sep',
      hasImage: true,
      completed: false,
    },
    {
      id: 4,
      title: isEn ? 'Test smartphone layout & navigation drawer' : 'Uji responsivitas mobile & drawer navigasi HP',
      status: 'review',
      statusLabel: 'Review',
      statusColor: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900',
      priority: 'medium',
      priorityLabel: isEn ? '🟡 Medium' : '🟡 Sedang',
      priorityColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      date: '19 Sep',
      completed: false,
    },
    {
      id: 5,
      title: isEn ? 'Configure continuous auto deployment on Vercel' : 'Konfigurasi deployment otomatis di Vercel',
      status: 'completed',
      statusLabel: 'Complete',
      statusColor: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      priority: 'low',
      priorityLabel: isEn ? '🔵 Low' : '🔵 Rendah',
      priorityColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      date: '14 Sep',
      completed: true,
    },
  ];

  const previewStatuses = [
    { id: 'todo', label: 'To Do', color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700', count: 2 },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 dark:bg-blue-950/50 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900', count: 1 },
    { id: 'review', label: 'Review', color: 'bg-purple-50 dark:bg-purple-950/50 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900', count: 1 },
    { id: 'completed', label: 'Complete', color: 'bg-emerald-50 dark:bg-emerald-950/50 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900', count: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] dark:bg-[#191919] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-neutral-100 dark:selection:text-neutral-900 font-sans antialiased transition-colors duration-200">
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 dark:bg-[#191919]/90 backdrop-blur-md border-b border-neutral-200/70 dark:border-neutral-800/80 transition">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 flex items-center justify-center text-base shadow-xs">
              🪐
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-neutral-900 dark:text-white">Ersona</span>
              <span className="text-[10px] font-mono text-neutral-400 dark:text-neutral-500 font-medium uppercase tracking-wider">{t('common.workspace')}</span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-7 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#fitur" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.features')}</a>
            <a href="#preview" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.preview')}</a>
            <a href="#keunggulan" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.advantages')}</a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.faq')}</a>
          </nav>

          {/* Controls: Language, Theme, & Action Buttons */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  language === 'id'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="Bahasa Indonesia"
              >
                ID
              </button>
              <button
                type="button"
                onClick={() => setLanguage('en')}
                className={`px-2 py-1 rounded-md transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="English Language"
              >
                EN
              </button>
            </div>

            {/* Dark Mode Toggle Button */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
              title={isDark ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDark ? <Sun className="w-3.5 h-3.5 text-amber-400" /> : <Moon className="w-3.5 h-3.5 text-neutral-600" />}
            </button>

            {/* Auth Action Buttons */}
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>{t('landing.nav.openWorkspace')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onStartAuth(false)}
                  className="hidden sm:inline-block text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2.5 py-2 transition cursor-pointer"
                >
                  {t('landing.nav.signIn')}
                </button>
                <button
                  onClick={() => onStartAuth(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>{t('landing.nav.getStarted')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION */}
      <section className="relative pt-12 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          {/* Badge Pengumuman */}
          <div className="inline-flex items-center space-x-2 bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/80 dark:border-neutral-700/80 px-3.5 py-1.5 rounded-full text-xs text-neutral-700 dark:text-neutral-300 shadow-2xs">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-neutral-900 dark:text-white">Ersona v1.7</span>
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <span>{t('landing.hero.badge')}</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 dark:text-white leading-[1.15] sm:leading-[1.15]">
            {t('landing.hero.title')}
          </h1>

          {/* Subtitle Deskripsi */}
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-normal">
            {t('landing.hero.subtitle')}
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => user ? onGoToDashboard() : onStartAuth(true)}
              className="w-full sm:w-auto px-6 py-3 bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-sm font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer group"
            >
              <span>{user ? t('landing.hero.ctaDashboard') : t('landing.hero.ctaPrimary')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#preview"
              className="w-full sm:w-auto px-5 py-3 bg-white dark:bg-neutral-800/70 hover:bg-neutral-50 dark:hover:bg-neutral-800 text-neutral-700 dark:text-neutral-200 text-sm font-semibold border border-neutral-200/90 dark:border-neutral-700/80 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <Eye className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>{t('landing.hero.ctaSecondary')}</span>
            </a>
          </div>

          {/* Social Proof / Trust Bullets */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
            <div className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('landing.hero.badgeNoCreditCard')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('landing.hero.badgePrivacy')}</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
              <span>{t('landing.hero.badgeResponsive')}</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE SECTION (PREVIEW MOCKUP ELEGAN & REALISTIS) */}
      <section id="preview" className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t('landing.preview.tag')}
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {t('landing.preview.title')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            {t('landing.preview.subtitle')}
          </p>
        </div>

        {/* Browser Mockup Window */}
        <div className="bg-white dark:bg-[#202020] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl shadow-xl overflow-hidden transition-all">
          {/* Top Window Chrome */}
          <div className="bg-[#F7F6F3] dark:bg-[#1C1C1C] border-b border-neutral-200/70 dark:border-neutral-800 px-3 sm:px-4 py-2 sm:py-3 flex items-center justify-between gap-2 sm:gap-3">
            {/* Window Dots */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-red-400/80" />
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-amber-400/80" />
              <div className="w-2.5 sm:w-3 h-2.5 sm:h-3 rounded-full bg-emerald-400/80" />
            </div>

            {/* Window Title Bar */}
            <div className="hidden sm:flex flex-1 max-w-xs mx-auto bg-white dark:bg-[#282828] border border-neutral-200/80 dark:border-neutral-700/80 rounded-lg px-3 py-1 text-center text-xs text-neutral-600 dark:text-neutral-300 select-none items-center justify-center space-x-1.5 shadow-2xs font-medium">
              <span>🪐 ersona</span>
            </div>

            {/* View Mode Switcher: Baris vs Kolom */}
            <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-lg text-xs shrink-0">
              <button
                type="button"
                onClick={() => setPreviewMode('list')}
                className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md font-medium transition cursor-pointer text-[11px] sm:text-xs ${
                  previewMode === 'list'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <List className="w-3 h-3" />
                <span>{t('landing.preview.listView')}</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('board')}
                className={`flex items-center space-x-1 px-2 sm:px-2.5 py-1 rounded-md font-medium transition cursor-pointer text-[11px] sm:text-xs ${
                  previewMode === 'board'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
              >
                <Columns3 className="w-3 h-3" />
                <span>{t('landing.preview.boardView')}</span>
              </button>
            </div>
          </div>

          {/* Window Body (Workspace Preview) */}
          <div className="p-3.5 sm:p-6 bg-[#FBFBFA] dark:bg-[#191919] space-y-3.5 sm:space-y-4">
            {/* Mockup Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-3 pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-200">{t('dashboard.todosTab')} & Schedule</span>
                <span className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full font-medium">
                  {previewTasks.length} {t('landing.preview.tasksCount')}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2.5 py-1 rounded-lg flex items-center space-x-1 text-neutral-600 dark:text-neutral-300 shadow-2xs font-medium">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  <span>{t('landing.preview.sortBy')}</span>
                </span>
              </div>
            </div>

            {/* Mockup Quick Add Bar */}
            <div className="bg-white dark:bg-[#222222] border border-neutral-200/90 dark:border-neutral-800 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="text-xs text-neutral-400 dark:text-neutral-500 font-medium select-none">
                {t('landing.preview.quickAddPlaceholder')}
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px] text-neutral-600 dark:text-neutral-400 overflow-x-auto no-scrollbar">
                <div className="flex items-center gap-1.5 shrink-0">
                  <span className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-700 dark:text-neutral-300 shrink-0">
                    <Flag className="w-2.5 h-2.5 text-neutral-400" />
                    <span>{t('landing.preview.urgentChip')}</span>
                  </span>
                  <span className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-700 dark:text-neutral-300 shrink-0">
                    <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                    <span>18 Sep 2026</span>
                  </span>
                  <span className="hidden sm:flex bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2 py-0.5 rounded-md items-center space-x-1 text-neutral-600 dark:text-neutral-400 shrink-0">
                    <Paperclip className="w-2.5 h-2.5 text-neutral-400" />
                    <span>{t('dashboard.advancedOptions')}</span>
                  </span>
                </div>
                <div className="bg-neutral-900 dark:bg-white text-white dark:text-neutral-900 text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-2xs shrink-0">
                  {t('landing.preview.saveTask')}
                </div>
              </div>
            </div>

            {/* Tampilan Sesuai Mode: Kolom (Board) vs Baris (List) */}
            {previewMode === 'board' ? (
              /* PREVIEW KANBAN BOARD */
              <div className="space-y-2.5 pt-1">
                {/* Petunjuk swipe di layar mobile */}
                <div className="sm:hidden flex items-center justify-between text-[11px] text-neutral-400 dark:text-neutral-500 px-1">
                  <span className="flex items-center space-x-1">
                    <span>👉</span>
                    <span>{isEn ? 'Swipe horizontally to view all stages' : 'Geser ke samping untuk melihat semua tahap'}</span>
                  </span>
                  <span className="font-mono bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded text-[10px]">4 {isEn ? 'columns' : 'kolom'}</span>
                </div>

                {/* Kolom Papan: Horizontal Swipeable di Mobile, Grid Rapi di Desktop */}
                <div className="flex sm:grid sm:grid-cols-2 lg:grid-cols-4 gap-3 overflow-x-auto pb-2 no-scrollbar scroll-smooth snap-x snap-mandatory">
                  {previewStatuses.map(status => {
                    const tasksInCol = previewTasks.filter(t => t.status === status.id);
                    return (
                      <div
                        key={status.id}
                        className="w-[260px] sm:w-auto shrink-0 snap-start bg-[#F7F6F3] dark:bg-[#202020] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 flex flex-col min-h-[290px] shadow-2xs transition-all hover:border-neutral-300 dark:hover:border-neutral-700"
                      >
                        {/* Header Kolom */}
                        <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60 dark:border-neutral-800">
                          <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.color}`}>
                            {status.label}
                          </span>
                          <span className="text-xs text-neutral-400 dark:text-neutral-500 font-mono font-medium">({tasksInCol.length})</span>
                        </div>

                        {/* Kartu-Kartu Tugas dalam Kolom */}
                        <div className="space-y-2.5 flex-1">
                          {tasksInCol.length === 0 ? (
                            <div className="h-24 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800 flex items-center justify-center text-[11px] text-neutral-400 dark:text-neutral-500">
                              {isEn ? 'No tasks yet' : 'Belum ada tugas'}
                            </div>
                          ) : (
                            tasksInCol.map(task => (
                              <div
                                key={task.id}
                                className={`bg-white dark:bg-[#282828] border rounded-xl p-3 shadow-2xs space-y-2 select-none transition hover:shadow-xs ${
                                  task.completed ? 'border-neutral-200/60 dark:border-neutral-800 opacity-75' : 'border-neutral-200/90 dark:border-neutral-700/80'
                                }`}
                              >
                                {/* Card Top: Prioritas Badge */}
                                <div className="flex items-center justify-between">
                                  <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${task.priorityColor}`}>
                                    {task.priorityLabel}
                                  </span>
                                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500 font-mono font-medium">
                                    #{task.id}
                                  </span>
                                </div>

                                {/* Card Title & Checkbox */}
                                <div className="flex items-start space-x-2">
                                  <div className="mt-0.5 shrink-0 text-neutral-400 dark:text-neutral-500">
                                    {task.completed ? (
                                      <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                                    ) : (
                                      <Circle className="w-4 h-4" />
                                    )}
                                  </div>
                                  <p className={`text-xs font-semibold leading-snug ${
                                    task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                                  }`}>
                                    {task.title}
                                  </p>
                                </div>

                                {/* Contoh Lampiran Gambar Mini */}
                                {task.hasImage && (
                                  <div className="h-14 rounded-lg bg-neutral-100 dark:bg-neutral-800/80 border border-neutral-200/70 dark:border-neutral-700/80 flex items-center justify-center text-[10px] text-neutral-500 dark:text-neutral-400 space-x-1 font-medium">
                                    <Paperclip className="w-3 h-3 text-neutral-400" />
                                    <span>Preview_Foto.jpg</span>
                                  </div>
                                )}

                                {/* Card Footer: Due Date & Reminder */}
                                <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-500 dark:text-neutral-400">
                                  <div className="flex items-center space-x-1 font-mono">
                                    <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                                    <span>{task.date}</span>
                                  </div>
                                  {task.reminder && (
                                    <span className="bg-amber-100/70 dark:bg-amber-950/60 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold flex items-center space-x-0.5 text-[9px]">
                                      <Bell className="w-2 h-2" />
                                      <span>{task.reminder}</span>
                                    </span>
                                  )}
                                </div>
                              </div>
                            ))
                          )}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            ) : (
              /* PREVIEW BARIS (LIST) */
              <div className="space-y-2 pt-1">
                {previewTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-white dark:bg-[#282828] border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="text-neutral-400 dark:text-neutral-500 shrink-0">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${task.statusColor}`}>
                        {task.statusLabel}
                      </span>
                      <span className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-200'
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pl-6 sm:pl-0 shrink-0 text-xs">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${task.priorityColor}`}>
                        {task.priorityLabel}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono flex items-center space-x-1 bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3 text-neutral-400" />
                        <span>{task.date}</span>
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </section>

      {/* 4. PENJELASAN NILAI: APA ITU ERSONA? */}
      <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-neutral-200/70 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
            {t('landing.features.tag')}
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {t('landing.features.title')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {t('landing.features.subtitle')}
          </p>
        </div>

        {/* 6 Bento Grid Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fitur 1: Dua Mode Tampilan */}
          <div className="p-6 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Columns3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">{t('landing.features.f1Title')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.features.f1Desc')}
            </p>
          </div>

          {/* Fitur 2: Alur Status Kustom */}
          <div className="p-6 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">{t('landing.features.f2Title')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.features.f2Desc')}
            </p>
          </div>

          {/* Fitur 3: Multi-Media Notes */}
          <div className="p-6 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Paperclip className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">{t('landing.features.f3Title')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.features.f3Desc')}
            </p>
          </div>

          {/* Fitur 4: Prioritas Mendesak & Pengingat */}
          <div className="p-6 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Flag className="w-5 h-5 text-red-600 dark:text-red-400" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">{t('landing.features.f4Title')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.features.f4Desc')}
            </p>
          </div>

          {/* Fitur 5: Tempat Sampah & Pemulihan */}
          <div className="p-6 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Trash2 className="w-5 h-5 text-amber-600 dark:text-amber-400" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">{t('landing.features.f5Title')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.features.f5Desc')}
            </p>
          </div>

          {/* Fitur 6: Mobile First */}
          <div className="p-6 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 flex items-center justify-center text-neutral-800 dark:text-neutral-200">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900 dark:text-white">{t('landing.features.f6Title')}</h3>
            <p className="text-xs text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.features.f6Desc')}
            </p>
          </div>
        </div>
      </section>

      {/* 5. PERBANDINGAN: KENAPA ERSONA? */}
      <section id="keunggulan" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#F7F6F3] dark:bg-[#202020] border border-neutral-200/90 dark:border-neutral-800 rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">
              {t('landing.comparison.title')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-md mx-auto">
              {t('landing.comparison.subtitle')}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Aplikasi Konvensional */}
            <div className="p-5 bg-white/70 dark:bg-[#1A1A1A] border border-neutral-200/60 dark:border-neutral-800 rounded-2xl space-y-3">
              <span className="font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider text-[10px]">{t('landing.comparison.othersTag')}</span>
              <ul className="space-y-2 text-neutral-500 dark:text-neutral-400">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>{t('landing.comparison.othersP1')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>{t('landing.comparison.othersP2')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>{t('landing.comparison.othersP3')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>{t('landing.comparison.othersP4')}</span>
                </li>
              </ul>
            </div>

            {/* Ersona Workspace */}
            <div className="p-5 bg-white dark:bg-[#262626] border border-neutral-900/20 dark:border-neutral-700 rounded-2xl space-y-3 shadow-xs ring-1 ring-neutral-900/5 dark:ring-neutral-700">
              <span className="font-bold text-neutral-900 dark:text-white uppercase tracking-wider text-[10px] flex items-center space-x-1">
                <span>{t('landing.comparison.ersonaTag')}</span>
                <span className="bg-emerald-100 dark:bg-emerald-950 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.2 rounded font-normal text-[9px]">{t('landing.comparison.recommended')}</span>
              </span>
              <ul className="space-y-2 text-neutral-800 dark:text-neutral-200">
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t('landing.comparison.ersonaP1')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t('landing.comparison.ersonaP2')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t('landing.comparison.ersonaP3')}</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5" />
                  <span>{t('landing.comparison.ersonaP4')}</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ (PERTANYAAN UMUM) */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-neutral-200/70 dark:border-neutral-800">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">{t('landing.faq.tag')}</span>
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{t('landing.faq.title')}</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{t('landing.faq.q1')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.faq.a1')}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{t('landing.faq.q2')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.faq.a2')}
            </p>
          </div>

          <div className="p-4 bg-white dark:bg-[#222222] border border-neutral-200/80 dark:border-neutral-800 rounded-xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{t('landing.faq.q3')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed">
              {t('landing.faq.a3')}
            </p>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-neutral-900 dark:bg-[#202020] text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden border border-neutral-800">
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              {t('landing.cta.title')}
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              {t('landing.cta.subtitle')}
            </p>
          </div>

          <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => user ? onGoToDashboard() : onStartAuth(true)}
              className="w-full sm:w-auto px-6 py-3 bg-white hover:bg-neutral-100 text-neutral-900 text-xs sm:text-sm font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>{user ? t('landing.cta.dashboardButton') : t('landing.cta.primaryButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => onStartAuth(false)}
                className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition cursor-pointer"
              >
                {t('landing.cta.secondaryButton')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-neutral-200/70 dark:border-neutral-800 py-8 bg-[#F7F6F3] dark:bg-[#161616]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🪐</span>
            <span className="font-semibold text-neutral-800 dark:text-neutral-200">Ersona Workspace</span>
            <span>• {t('landing.footer.copyright')} {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/Efrson/Ersona"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 dark:hover:text-white transition flex items-center space-x-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-neutral-400 dark:text-neutral-500">{t('landing.footer.tagline')}</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
