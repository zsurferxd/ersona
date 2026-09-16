import React, { useState, useRef } from 'react';
import {
  CheckCircle2, Circle, Flag, Calendar, Bell, Paperclip,
  Columns3, List, Layers, Trash2, Sparkles, ArrowRight,
  ShieldCheck, Smartphone, Eye, ExternalLink, Check,
  ArrowUpDown, Sun, Moon, Users, Zap, Image as ImageIcon,
  Lock, RefreshCw, ChevronLeft, ChevronRight, Film
} from 'lucide-react';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import BrandLogo from './BrandLogo';

export default function LandingPage({ onStartAuth, user, onGoToDashboard }) {
  const { isDark, toggleTheme, language, isEn, setLanguage, t } = useThemeLanguage();

  // State untuk Switcher Tampilan (Daftar vs Papan) di Mockup Interaktif
  const [previewMode, setPreviewMode] = useState('board'); // 'board' | 'list'
  const [sampleTaskTitle, setSampleTaskTitle] = useState('');
  const previewBoardRef = useRef(null);

  // Data representasi visual interaktif antarmuka Ersona (Model Kanban Workspace)
  const [tasks, setTasks] = useState([
    {
      id: 1,
      title: isEn ? 'Finalize team workspace permissions and access controls' : 'Finalisasi izin ruang kerja tim dan kendali akses',
      status: 'in_progress',
      priority: 'urgent',
      priorityLabel: isEn ? 'Urgent' : 'Mendesak',
      priorityColor: 'bg-red-50 dark:bg-red-950/60 text-red-700 dark:text-red-300 border-red-200 dark:border-red-900',
      date: '18 Sep',
      reminder: '17 Sep',
      completed: false,
    },
    {
      id: 2,
      title: isEn ? 'Review Q4 design assets & creative moodboard' : 'Tinjau aset desain Q4 dan moodboard kreatif',
      status: 'todo',
      priority: 'high',
      priorityLabel: isEn ? 'High' : 'Tinggi',
      priorityColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      date: '19 Sep',
      completed: false,
    },
    {
      id: 3,
      title: isEn ? 'Attach high-resolution visuals and video references' : 'Sematkan visual beresolusi tinggi dan referensi video',
      status: 'review',
      priority: 'medium',
      priorityLabel: isEn ? 'Medium' : 'Sedang',
      priorityColor: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700',
      date: '20 Sep',
      hasImage: true,
      completed: false,
    },
    {
      id: 4,
      title: isEn ? 'Deploy progressive web app with offline persistence' : 'Rilis progressive web app dengan penyimpanan offline',
      status: 'completed',
      priority: 'low',
      priorityLabel: isEn ? 'Low' : 'Rendah',
      priorityColor: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900',
      date: '16 Sep',
      completed: true,
    },
  ]);

  const handleToggleTask = (id) => {
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const nextCompleted = !t.completed;
        return {
          ...t,
          completed: nextCompleted,
          status: nextCompleted ? 'completed' : (t.status === 'completed' ? 'in_progress' : t.status),
        };
      }
      return t;
    }));
  };

  const handleMoveTaskStage = (id) => {
    const stageOrder = ['todo', 'in_progress', 'review', 'completed'];
    setTasks(prev => prev.map(t => {
      if (t.id === id) {
        const currentIndex = stageOrder.indexOf(t.status);
        const nextStage = stageOrder[(currentIndex + 1) % stageOrder.length];
        return {
          ...t,
          status: nextStage,
          completed: nextStage === 'completed',
        };
      }
      return t;
    }));
  };

  const handleAddSampleTask = () => {
    if (!sampleTaskTitle.trim()) return;
    const newTask = {
      id: Date.now(),
      title: sampleTaskTitle.trim(),
      status: 'todo',
      priority: 'high',
      priorityLabel: isEn ? 'High' : 'Tinggi',
      priorityColor: 'bg-amber-50 dark:bg-amber-950/60 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-900',
      date: isEn ? 'Today' : 'Hari Ini',
      completed: false,
    };
    setTasks(prev => [newTask, ...prev]);
    setSampleTaskTitle('');
  };

  const previewStatuses = [
    { id: 'todo', label: isEn ? 'To Do' : 'Rencana', color: 'bg-neutral-100 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700' },
    { id: 'in_progress', label: isEn ? 'In Progress' : 'Berjalan', color: 'bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border-blue-200 dark:border-blue-900' },
    { id: 'review', label: isEn ? 'Review' : 'Tinjau', color: 'bg-purple-50 dark:bg-purple-950/60 text-purple-700 dark:text-purple-300 border-purple-200 dark:border-purple-900' },
    { id: 'completed', label: isEn ? 'Complete' : 'Selesai', color: 'bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-900' },
  ];

  return (
    <div className="min-h-[100dvh] bg-[#FBFBFA] dark:bg-[#151515] text-neutral-900 dark:text-neutral-100 selection:bg-neutral-900 selection:text-white dark:selection:bg-white dark:selection:text-neutral-900 font-sans antialiased transition-colors duration-200 flex flex-col">
      
      {/* 1. STICKY TOP NAVIGATION BAR */}
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 dark:bg-[#151515]/90 backdrop-blur-md border-b border-neutral-200/70 dark:border-neutral-800/80 transition">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          {/* Centralized Brand Logo Component */}
          <div
            className="flex items-center space-x-2 cursor-pointer group"
            onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}
          >
            <BrandLogo size="md" showText={true} />
            <span className="hidden sm:inline-block text-[10px] font-mono uppercase tracking-widest px-2 py-0.5 rounded-full bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 border border-neutral-200/60 dark:border-neutral-700/60">
              v1.8
            </span>
          </div>

          {/* Clean Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-neutral-600 dark:text-neutral-400">
            <a href="#fitur" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.features')}</a>
            <a href="#preview" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.preview')}</a>
            <a href="#keunggulan" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.advantages')}</a>
            <a href="#faq" className="hover:text-neutral-900 dark:hover:text-white transition">{t('landing.nav.faq')}</a>
          </nav>

          {/* Action Area: Theme Toggle, Language Switcher & Auth CTA */}
          <div className="flex items-center space-x-2 sm:space-x-3">
            {/* Language Switcher Pill */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700/80 text-[11px] font-medium">
              <button
                type="button"
                onClick={() => setLanguage('id')}
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
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
                className={`px-2 py-0.5 rounded-md transition cursor-pointer ${
                  language === 'en'
                    ? 'bg-white dark:bg-neutral-700 text-neutral-900 dark:text-white shadow-2xs font-semibold'
                    : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white'
                }`}
                title="English"
              >
                EN
              </button>
            </div>

            {/* Dark Mode Toggle */}
            <button
              type="button"
              onClick={toggleTheme}
              className="p-1.5 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700/80 text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white transition cursor-pointer"
              title={isDark ? t('common.lightMode') : t('common.darkMode')}
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>

            {/* Auth Buttons */}
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
              >
                <span>{t('landing.nav.openWorkspace')}</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onStartAuth(false)}
                  className="hidden sm:inline-block text-xs font-semibold text-neutral-600 dark:text-neutral-400 hover:text-neutral-900 dark:hover:text-white px-2.5 py-1.5 transition cursor-pointer"
                >
                  {t('landing.nav.signIn')}
                </button>
                <button
                  onClick={() => onStartAuth(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-900 text-xs font-semibold px-3.5 sm:px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs active:scale-[0.98]"
                >
                  <span>{t('landing.nav.getStarted')}</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        </div>
      </header>

      {/* 2. HERO SECTION (Taste Skill Viewport Fit & Clean Typography) */}
      <section className="relative pt-14 sm:pt-20 pb-16 sm:pb-24 overflow-hidden">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center space-y-6">
          
          {/* Badge Pengumuman Tunggal */}
          <div className="inline-flex items-center space-x-2 bg-white dark:bg-neutral-900 border border-neutral-200/90 dark:border-neutral-800 px-3.5 py-1.5 rounded-full text-xs text-neutral-700 dark:text-neutral-300 shadow-xs">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse shrink-0" />
            <span className="font-semibold text-neutral-900 dark:text-white">{t('landing.hero.badge')}</span>
          </div>

          {/* Slogan Resmi: Heading utama 'Ersona', di bawahnya 'Your Personal Workspace' */}
          <div className="space-y-1.5 sm:space-y-2 pt-1">
            <h1 className="text-5xl sm:text-7xl md:text-8xl font-black tracking-tight text-neutral-950 dark:text-white leading-none">
              {t('landing.hero.title')}
            </h1>
            <p className="text-2xl sm:text-4xl md:text-5xl font-bold tracking-tight text-neutral-800 dark:text-neutral-200 leading-tight">
              {t('landing.hero.slogan')}
            </p>
          </div>

          {/* Deskripsi Resmi Ersona */}
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 dark:text-neutral-400 max-w-2xl mx-auto leading-relaxed font-normal pt-1">
            {t('landing.hero.subtitle')}
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => user ? onGoToDashboard() : onStartAuth(true)}
              className="w-full sm:w-auto px-6 py-3.5 bg-neutral-950 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-200 text-white dark:text-neutral-950 text-sm font-semibold rounded-2xl transition flex items-center justify-center space-x-2 shadow-md cursor-pointer group active:scale-[0.98]"
            >
              <span>{user ? t('landing.hero.ctaDashboard') : t('landing.hero.ctaPrimary')}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-1 transition-transform" />
            </button>
            <a
              href="#preview"
              className="w-full sm:w-auto px-5 py-3.5 bg-white dark:bg-[#202020] hover:bg-neutral-50 dark:hover:bg-[#262626] text-neutral-700 dark:text-neutral-200 text-sm font-semibold border border-neutral-200/90 dark:border-neutral-700/80 rounded-2xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs active:scale-[0.98]"
            >
              <Eye className="w-4 h-4 text-neutral-500 dark:text-neutral-400" />
              <span>{t('landing.hero.ctaSecondary')}</span>
            </a>
          </div>

          {/* Trust Value Points */}
          <div className="pt-4 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-neutral-500 dark:text-neutral-400 font-medium">
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

      {/* 3. SHOWCASE SECTION (Interactive Live Mockup Window - Kanban Model) */}
      <section id="preview" className="w-full max-w-5xl mx-auto px-3 sm:px-6 pb-20 sm:pb-32 overflow-hidden">
        <div className="text-center space-y-2 mb-8">
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 dark:text-white tracking-tight">
            {t('landing.preview.title')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 dark:text-neutral-400 max-w-lg mx-auto">
            {t('landing.preview.subtitle')}
          </p>
        </div>

        {/* Browser Mockup Window */}
        <div className="w-full max-w-full bg-white dark:bg-[#1e1e1e] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl sm:rounded-3xl shadow-2xl overflow-hidden transition-all">
          {/* Top Window Bar */}
          <div className="bg-[#F7F6F3] dark:bg-[#181818] border-b border-neutral-200/70 dark:border-neutral-800 px-3.5 sm:px-5 py-3 flex items-center justify-between gap-3">
            {/* Window Dots */}
            <div className="flex items-center space-x-1.5 shrink-0">
              <div className="w-2.5 h-2.5 rounded-full bg-red-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-amber-400/80" />
              <div className="w-2.5 h-2.5 rounded-full bg-emerald-400/80" />
            </div>

            {/* Window Address Bar */}
            <div className="hidden sm:flex items-center space-x-2 bg-white dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl px-3 py-1 text-xs text-neutral-600 dark:text-neutral-300 font-mono shadow-2xs">
              <span className="text-[11px] text-emerald-600 dark:text-emerald-400 font-bold">https://</span>
              <span>ersona.app/workspace/team</span>
            </div>

            {/* Toolbar: Scroll Controls + View Mode Switcher */}
            <div className="flex items-center gap-2 shrink-0">
              {previewMode === 'board' && (
                <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-xl border border-neutral-200/80 dark:border-neutral-700 text-xs shrink-0 space-x-0.5">
                  <button
                    type="button"
                    onClick={() => previewBoardRef.current?.scrollBy({ left: -270, behavior: 'smooth' })}
                    className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#282828] transition cursor-pointer"
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-3.5 h-3.5" />
                  </button>
                  <button
                    type="button"
                    onClick={() => previewBoardRef.current?.scrollBy({ left: 270, behavior: 'smooth' })}
                    className="p-1 rounded-lg text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#282828] transition cursor-pointer"
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
              <div className="flex items-center bg-neutral-200/70 dark:bg-neutral-800 p-0.5 rounded-xl text-xs shrink-0">
                <button
                  type="button"
                  onClick={() => setPreviewMode('list')}
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
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
                  className={`flex items-center space-x-1.5 px-2.5 sm:px-3 py-1 rounded-lg font-medium transition cursor-pointer text-[11px] ${
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
          </div>

          {/* Window Content */}
          <div className="p-3.5 sm:p-6 bg-[#FBFBFA] dark:bg-[#171717] space-y-4">
            {/* Toolbar Header */}
            <div className="flex items-center justify-between pb-3 border-b border-neutral-200/80 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="text-xs sm:text-sm font-semibold text-neutral-800 dark:text-neutral-200">
                  {isEn ? 'Core Deliverables' : 'Target Utama'}
                </span>
                <span className="text-[11px] font-mono bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-400 px-2 py-0.5 rounded-full font-medium">
                  {tasks.length} {t('landing.preview.tasksCount')}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-neutral-500 dark:text-neutral-400">
                <span className="bg-white dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2.5 py-1 rounded-lg flex items-center space-x-1 text-neutral-600 dark:text-neutral-300 shadow-2xs font-medium text-[11px]">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400 shrink-0" />
                  <span>{t('landing.preview.sortBy')}</span>
                </span>
              </div>
            </div>

            {/* Interactive Quick Add Bar */}
            <div className="bg-white dark:bg-[#202020] border border-neutral-200/90 dark:border-neutral-800 rounded-2xl p-2.5 sm:p-3 shadow-2xs space-y-2">
              <div className="flex items-center gap-2">
                <input
                  type="text"
                  maxLength={120}
                  value={sampleTaskTitle}
                  onChange={(e) => setSampleTaskTitle(e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      e.preventDefault();
                      handleAddSampleTask();
                    }
                  }}
                  placeholder={t('landing.preview.quickAddPlaceholder')}
                  className="flex-1 text-xs sm:text-sm bg-transparent focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium text-neutral-800 dark:text-neutral-100"
                />
                <button
                  type="button"
                  onClick={handleAddSampleTask}
                  disabled={!sampleTaskTitle.trim()}
                  className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white text-[11px] font-semibold px-3 py-1.5 rounded-xl transition flex items-center space-x-1 disabled:opacity-40 cursor-pointer shadow-2xs shrink-0"
                >
                  <Sparkles className="w-3 h-3" />
                  <span>{t('landing.preview.saveTask')}</span>
                </button>
              </div>
              <div className="flex items-center justify-between gap-2 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] sm:text-[11px] text-neutral-500 dark:text-neutral-400">
                <div className="flex items-center gap-1.5 flex-wrap">
                  <span className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-700 dark:text-neutral-300">
                    <Flag className="w-2.5 h-2.5 text-neutral-400" />
                    <span>{t('landing.preview.urgentChip')}</span>
                  </span>
                  <span className="bg-neutral-50 dark:bg-neutral-800 border border-neutral-200/80 dark:border-neutral-700 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-700 dark:text-neutral-300">
                    <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                    <span>18 Sep</span>
                  </span>
                </div>
                <span className="text-[10px] text-neutral-400 hidden sm:inline">
                  {isEn ? 'Interactive preview: click tasks to complete or move' : 'Preview interaktif: klik tugas untuk selesai atau geser'}
                </span>
              </div>
            </div>

            {/* Render Mode: Kanban Board (Workspace Model) vs List */}
            {previewMode === 'board' ? (
              <div
                ref={previewBoardRef}
                className="flex gap-3 overflow-x-auto pb-4 pt-1 items-start scroll-smooth snap-x snap-mandatory -mx-3 px-3 sm:mx-0 sm:px-0 no-scrollbar"
              >
                {previewStatuses.map((status) => {
                  const tasksInCol = tasks.filter(t => t.status === status.id);
                  return (
                    <div
                      key={status.id}
                      className="w-[78vw] max-w-[270px] sm:w-64 md:w-68 shrink-0 bg-[#F7F6F3] dark:bg-[#1d1d1d] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 flex flex-col min-h-[300px] shadow-2xs snap-center sm:snap-align-none"
                    >
                      {/* Header Kolom */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60 dark:border-neutral-800 shrink-0">
                        <span className={`px-2.5 py-0.5 rounded-full text-[11px] font-semibold border ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono font-medium">
                          ({tasksInCol.length})
                        </span>
                      </div>

                      {/* Kartu dalam Kolom */}
                      <div className="space-y-2.5 flex-1">
                        {tasksInCol.length === 0 ? (
                          <div className="h-28 flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200/80 dark:border-neutral-800 rounded-xl bg-white/40 dark:bg-[#252525]/40">
                            {isEn ? 'No tasks in this stage' : 'Tidak ada tugas di tahap ini'}
                          </div>
                        ) : (
                          tasksInCol.map(task => (
                            <div
                              key={task.id}
                              className={`bg-white dark:bg-[#252525] border rounded-xl p-3 shadow-2xs hover:shadow-xs transition space-y-2 select-none ${
                                task.completed ? 'border-neutral-200/60 dark:border-neutral-800 opacity-75' : 'border-neutral-200/90 dark:border-neutral-700/80'
                              }`}
                            >
                              {/* Header: Priority + Move Stage Button */}
                              <div className="flex items-center justify-between">
                                <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${task.priorityColor}`}>
                                  {task.priorityLabel}
                                </span>
                                <button
                                  type="button"
                                  onClick={() => handleMoveTaskStage(task.id)}
                                  className="text-[10px] text-neutral-500 hover:text-neutral-800 dark:text-neutral-400 dark:hover:text-neutral-200 bg-neutral-50 hover:bg-neutral-100 dark:bg-[#303030] dark:hover:bg-[#383838] border border-neutral-200/70 dark:border-neutral-700 rounded-md px-1.5 py-0.5 transition cursor-pointer flex items-center space-x-1"
                                  title={isEn ? 'Move to next stage' : 'Geser ke tahap berikutnya'}
                                >
                                  <span>{isEn ? 'Move' : 'Geser'}</span>
                                  <ArrowRight className="w-2.5 h-2.5" />
                                </button>
                              </div>

                              {/* Title & Checkbox */}
                              <div className="flex items-start space-x-2">
                                <button
                                  type="button"
                                  onClick={() => handleToggleTask(task.id)}
                                  className="mt-0.5 shrink-0 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer"
                                  title={task.completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                                >
                                  {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                                </button>
                                <p
                                  onClick={() => handleToggleTask(task.id)}
                                  className={`text-xs font-semibold leading-snug cursor-pointer ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}
                                >
                                  {task.title}
                                </p>
                              </div>

                              {/* Media Attachment Preview */}
                              {task.hasImage && (
                                <div className="h-9 rounded-lg bg-neutral-100 dark:bg-neutral-800 border border-neutral-200/70 dark:border-neutral-700 flex items-center justify-center text-[10px] text-neutral-500 dark:text-neutral-400 space-x-1.5 font-medium">
                                  <Paperclip className="w-3 h-3" />
                                  <span>Design_Moodboard.webp</span>
                                </div>
                              )}

                              {/* Footer: Date & Reminder */}
                              <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400">
                                <div className="flex items-center space-x-1 font-mono">
                                  <Calendar className="w-2.5 h-2.5" />
                                  <span>{task.date}</span>
                                </div>
                                {task.reminder && (
                                  <span className="bg-amber-100 dark:bg-amber-950 text-amber-800 dark:text-amber-300 px-1.5 py-0.2 rounded font-semibold flex items-center space-x-0.5 text-[9px]">
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
            ) : (
              /* Mode List */
              <div className="space-y-2 pt-1">
                {tasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-white dark:bg-[#252525] border border-neutral-200/80 dark:border-neutral-700/80 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <button
                        type="button"
                        onClick={() => handleToggleTask(task.id)}
                        className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer shrink-0"
                      >
                        {task.completed ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Circle className="w-4 h-4" />}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleMoveTaskStage(task.id)}
                        className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border shrink-0 cursor-pointer ${
                          previewStatuses.find(s => s.id === task.status)?.color || 'bg-neutral-100 text-neutral-700 border-neutral-200'
                        }`}
                        title={isEn ? 'Click to change stage' : 'Klik untuk ubah status'}
                      >
                        {previewStatuses.find(s => s.id === task.status)?.label || task.status}
                      </button>
                      <span
                        onClick={() => handleToggleTask(task.id)}
                        className={`text-xs font-medium truncate cursor-pointer ${task.completed ? 'line-through text-neutral-400' : 'text-neutral-800 dark:text-neutral-200'}`}
                      >
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pl-6 sm:pl-0 shrink-0 text-xs">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${task.priorityColor}`}>
                        {task.priorityLabel}
                      </span>
                      <span className="text-[11px] text-neutral-400 dark:text-neutral-500 font-mono flex items-center space-x-1 bg-neutral-50 dark:bg-neutral-800 px-2 py-0.5 rounded">
                        <Calendar className="w-3 h-3" />
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

      {/* 4. WHY ERSONA (Highlighting Core Uniqueness: Work with Team & Unified Flow) */}
      <section id="keunggulan" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-neutral-200/70 dark:border-neutral-800">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <h2 className="text-2xl sm:text-4xl font-bold text-neutral-950 dark:text-white tracking-tight">
            {t('landing.comparison.title')}
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed">
            {t('landing.comparison.subtitle')}
          </p>
        </div>

        {/* Asymmetric Bento Grid highlighting Standout Strengths */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          
          {/* Bento Card 1 (Span 2): Work with your Team */}
          <div className="md:col-span-2 p-6 sm:p-8 bg-white dark:bg-[#1f1f1f] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400 border border-blue-200/80 dark:border-blue-800/80 flex items-center justify-center">
                <Users className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-blue-50 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 border border-blue-200/80 dark:border-blue-800/80 uppercase tracking-wider">
                {isEn ? 'Collaborative' : 'Kolaborasi'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-neutral-900 dark:text-white">
                {t('landing.features.f1Title')}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                {t('landing.features.f1Desc')}
              </p>
            </div>
            {/* Visual Team Pill Strip */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800/80 flex flex-col sm:flex-row sm:items-center gap-3">
              <div className="flex items-center -space-x-2 shrink-0">
                <div className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#1f1f1f] bg-neutral-900 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">T</div>
                <div className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#1f1f1f] bg-blue-600 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">A</div>
                <div className="w-8 h-8 rounded-full ring-2 ring-white dark:ring-[#1f1f1f] bg-emerald-600 text-white text-xs font-bold flex items-center justify-center shadow-xs shrink-0">E</div>
              </div>
              <span className="text-xs text-neutral-500 dark:text-neutral-400 font-medium leading-relaxed">
                {isEn ? 'Live realtime updates, invite approval controls & member roles' : 'Pembaruan realtime langsung, kontrol persetujuan undangan & peran akses'}
              </span>
            </div>
          </div>

          {/* Bento Card 2: Multimedia Attachments */}
          <div className="p-6 sm:p-8 bg-white dark:bg-[#1f1f1f] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-2xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400 border border-purple-200/80 dark:border-purple-800/80 flex items-center justify-center">
              <ImageIcon className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-neutral-900 dark:text-white">
                {t('landing.features.f3Title')}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                {t('landing.features.f3Desc')}
              </p>
            </div>
            <div className="text-xs text-neutral-600 dark:text-neutral-300 bg-neutral-50 dark:bg-neutral-800/60 p-2.5 rounded-xl border border-neutral-200/60 dark:border-neutral-700/60 flex items-center space-x-2 font-medium">
              <Film className="w-4 h-4 text-purple-500 shrink-0" />
              <span>{isEn ? 'Inline photo galleries & video embeds' : 'Galeri foto & sematan video terpadu'}</span>
            </div>
          </div>

          {/* Bento Card 3: Adaptive Custom Workflows */}
          <div className="p-6 sm:p-8 bg-white dark:bg-[#1f1f1f] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4 hover:shadow-md transition">
            <div className="w-10 h-10 rounded-2xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400 border border-amber-200/80 dark:border-amber-800/80 flex items-center justify-center">
              <Layers className="w-5 h-5" />
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-neutral-900 dark:text-white">
                {t('landing.features.f2Title')}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                {t('landing.features.f2Desc')}
              </p>
            </div>
            <div className="flex items-center gap-1.5 flex-wrap pt-1">
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-blue-50 dark:bg-blue-950 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900">Sprint</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900">Testing</span>
              <span className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-emerald-50 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-900">Shipped</span>
            </div>
          </div>

          {/* Bento Card 4 (Span 2): Quiet, Distraction-Free Flow */}
          <div className="md:col-span-2 p-6 sm:p-8 bg-white dark:bg-[#1f1f1f] border border-neutral-200/80 dark:border-neutral-800 rounded-3xl shadow-xs space-y-4 hover:shadow-md transition">
            <div className="flex items-center justify-between">
              <div className="w-10 h-10 rounded-2xl bg-emerald-50 dark:bg-emerald-950/60 text-emerald-600 dark:text-emerald-400 border border-emerald-200/80 dark:border-emerald-800/80 flex items-center justify-center">
                <Zap className="w-5 h-5" />
              </div>
              <span className="text-[10px] font-semibold px-2.5 py-1 rounded-full bg-emerald-50 dark:bg-emerald-950/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200/80 dark:border-emerald-800/80 uppercase tracking-wider">
                {isEn ? 'Pure Velocity' : 'Kecepatan Murni'}
              </span>
            </div>
            <div>
              <h3 className="font-bold text-lg sm:text-xl text-neutral-900 dark:text-white">
                {t('landing.features.f4Title')}
              </h3>
              <p className="text-xs sm:text-sm text-neutral-600 dark:text-neutral-400 leading-relaxed mt-1">
                {t('landing.features.f4Desc')}
              </p>
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3 pt-2 text-xs text-neutral-700 dark:text-neutral-300 font-medium">
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>PWA Offline Cache</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Web Push Alerts</span>
              </div>
              <div className="flex items-center space-x-1.5">
                <Check className="w-3.5 h-3.5 text-emerald-500 shrink-0" />
                <span>Subtasks Checklist</span>
              </div>
            </div>
          </div>

        </div>
      </section>

      {/* 5. FAQ SECTION */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 sm:py-20 border-t border-neutral-200/70 dark:border-neutral-800">
        <div className="text-center space-y-2 mb-10">
          <h2 className="text-2xl font-bold text-neutral-900 dark:text-white tracking-tight">{t('landing.faq.title')}</h2>
        </div>

        <div className="space-y-3.5 text-xs">
          <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1e1e] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{t('landing.faq.q1')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-xs">
              {t('landing.faq.a1')}
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1e1e] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{t('landing.faq.q2')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-xs">
              {t('landing.faq.a2')}
            </p>
          </div>

          <div className="p-4 sm:p-5 bg-white dark:bg-[#1e1e1e] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 dark:text-white text-sm">{t('landing.faq.q3')}</h4>
            <p className="text-neutral-600 dark:text-neutral-400 leading-relaxed text-xs">
              {t('landing.faq.a3')}
            </p>
          </div>
        </div>
      </section>

      {/* 6. BOTTOM CTA BANNER (High-Contrast Modern Dark Tile) */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-neutral-950 dark:bg-[#1f1f1f] text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden border border-neutral-800">
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
              className="w-full sm:w-auto px-6 py-3.5 bg-white hover:bg-neutral-100 text-neutral-950 text-xs sm:text-sm font-semibold rounded-2xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer active:scale-[0.98]"
            >
              <span>{user ? t('landing.cta.dashboardButton') : t('landing.cta.primaryButton')}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => onStartAuth(false)}
                className="w-full sm:w-auto px-5 py-3.5 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold rounded-2xl border border-white/10 transition cursor-pointer active:scale-[0.98]"
              >
                {t('landing.cta.secondaryButton')}
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 7. FOOTER */}
      <footer className="mt-auto border-t border-neutral-200/70 dark:border-neutral-800 py-8 bg-[#F7F6F3] dark:bg-[#121212]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500 dark:text-neutral-400">
          <div className="flex items-center space-x-2">
            <BrandLogo size="xs" showText={true} />
            <span className="text-neutral-400 dark:text-neutral-600">•</span>
            <span>{new Date().getFullYear()} Ersona</span>
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
