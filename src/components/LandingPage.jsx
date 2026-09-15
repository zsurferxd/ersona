import React, { useState } from 'react';
import {
  CheckCircle2, Circle, Flag, Calendar, Bell, Paperclip,
  Columns3, List, Layers, Trash2, Sparkles, ArrowRight,
  ShieldCheck, Smartphone, Eye, ExternalLink, Check,
  Search, ArrowUpDown, ChevronDown
} from 'lucide-react';

export default function LandingPage({ onStartAuth, user, onGoToDashboard }) {
  // State untuk Switcher Tampilan (Papan Kolom vs Baris) di dalam Preview Mockup
  const [previewMode, setPreviewMode] = useState('board'); // 'board' | 'list'

  // Data Representasi Visual Antarmuka Ersona (Statis & Rapi)
  const previewTasks = [
    {
      id: 1,
      title: 'Rancang arsitektur database Supabase & RLS',
      status: 'todo',
      statusLabel: 'To Do',
      statusColor: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      priority: 'urgent',
      priorityLabel: '🔥 Mendesak',
      priorityColor: 'bg-red-50 text-red-700 border-red-200',
      date: '16 Sep',
      reminder: '15 Sep',
      completed: false,
    },
    {
      id: 2,
      title: 'Implementasi alur kerja kanban & drag responsive',
      status: 'todo',
      statusLabel: 'To Do',
      statusColor: 'bg-neutral-100 text-neutral-700 border-neutral-200',
      priority: 'high',
      priorityLabel: '🔴 Tinggi',
      priorityColor: 'bg-amber-50 text-amber-700 border-amber-200',
      date: '17 Sep',
      completed: false,
    },
    {
      id: 3,
      title: 'Optimalisasi kompresi foto & lampiran catatan',
      status: 'in_progress',
      statusLabel: 'In Progress',
      statusColor: 'bg-blue-50 text-blue-700 border-blue-200',
      priority: 'medium',
      priorityLabel: '🟡 Sedang',
      priorityColor: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      date: '18 Sep',
      hasImage: true,
      completed: false,
    },
    {
      id: 4,
      title: 'Uji responsivitas mobile & drawer navigasi HP',
      status: 'review',
      statusLabel: 'Review',
      statusColor: 'bg-purple-50 text-purple-700 border-purple-200',
      priority: 'medium',
      priorityLabel: '🟡 Sedang',
      priorityColor: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      date: '19 Sep',
      completed: false,
    },
    {
      id: 5,
      title: 'Konfigurasi deployment otomatis di Vercel',
      status: 'completed',
      statusLabel: 'Complete',
      statusColor: 'bg-emerald-50 text-emerald-700 border-emerald-200',
      priority: 'low',
      priorityLabel: '🔵 Rendah',
      priorityColor: 'bg-neutral-100 text-neutral-600 border-neutral-200',
      date: '14 Sep',
      completed: true,
    },
  ];

  const previewStatuses = [
    { id: 'todo', label: 'To Do', color: 'bg-neutral-100 text-neutral-700 border-neutral-200', count: 2 },
    { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200', count: 1 },
    { id: 'review', label: 'Review', color: 'bg-purple-50 text-purple-700 border-purple-200', count: 1 },
    { id: 'completed', label: 'Complete', color: 'bg-emerald-50 text-emerald-700 border-emerald-200', count: 1 },
  ];

  return (
    <div className="min-h-screen bg-[#FBFBFA] text-neutral-900 selection:bg-neutral-900 selection:text-white font-sans antialiased">
      {/* 1. STICKY NAVBAR */}
      <header className="sticky top-0 z-40 bg-[#FBFBFA]/90 backdrop-blur-md border-b border-neutral-200/70 transition">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          {/* Brand Logo */}
          <div className="flex items-center space-x-2.5 cursor-pointer" onClick={() => window.scrollTo({ top: 0, behavior: 'smooth' })}>
            <div className="w-8 h-8 rounded-lg bg-neutral-900 text-white flex items-center justify-center text-base shadow-xs">
              🪐
            </div>
            <div className="flex items-baseline space-x-1.5">
              <span className="font-bold text-lg tracking-tight text-neutral-900">Ersona</span>
              <span className="text-[10px] font-mono text-neutral-400 font-medium uppercase tracking-wider">Workspace</span>
            </div>
          </div>

          {/* Nav Links (Desktop) */}
          <nav className="hidden md:flex items-center space-x-8 text-xs font-medium text-neutral-600">
            <a href="#fitur" className="hover:text-neutral-900 transition">Fitur Utama</a>
            <a href="#preview" className="hover:text-neutral-900 transition">Preview Tampilan</a>
            <a href="#keunggulan" className="hover:text-neutral-900 transition">Kenapa Ersona?</a>
            <a href="#faq" className="hover:text-neutral-900 transition">FAQ</a>
          </nav>

          {/* Action Buttons */}
          <div className="flex items-center space-x-3">
            {user ? (
              <button
                onClick={onGoToDashboard}
                className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
              >
                <span>Buka Workspace</span>
                <ArrowRight className="w-3.5 h-3.5" />
              </button>
            ) : (
              <>
                <button
                  onClick={() => onStartAuth(false)}
                  className="text-xs font-semibold text-neutral-600 hover:text-neutral-900 px-3 py-2 transition cursor-pointer"
                >
                  Masuk
                </button>
                <button
                  onClick={() => onStartAuth(true)}
                  className="bg-neutral-900 hover:bg-neutral-800 text-white text-xs font-semibold px-4 py-2 rounded-xl transition flex items-center space-x-1.5 cursor-pointer shadow-xs"
                >
                  <span>Mulai Gratis</span>
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
          <div className="inline-flex items-center space-x-2 bg-neutral-100 border border-neutral-200/80 px-3.5 py-1.5 rounded-full text-xs text-neutral-700 shadow-2xs animate-fade-in">
            <Sparkles className="w-3.5 h-3.5 text-amber-500" />
            <span className="font-semibold text-neutral-900">Ersona v1.7</span>
            <span className="text-neutral-400">•</span>
            <span>Minimalist Personal Productivity Workspace</span>
          </div>

          {/* Main Headline */}
          <h1 className="text-3xl sm:text-5xl md:text-6xl font-bold tracking-tight text-neutral-900 leading-[1.15] sm:leading-[1.15]">
            Satu Ruang Tenang untuk Menata Setiap Ide, Jadwal, dan Tugas Anda.
          </h1>

          {/* Subtitle Deskripsi */}
          <p className="text-sm sm:text-base md:text-lg text-neutral-600 max-w-2xl mx-auto leading-relaxed font-normal">
            Bebaskan pikiran dari keruwetan. <strong>Ersona</strong> menggabungkan fleksibilitas To-Do list (mode Baris & Kolom Kanban), catatan multi-media dengan foto/video, serta sistem pengingat dalam satu antarmuka minimalis bergaya Notion.
          </p>

          {/* Call to Action Buttons */}
          <div className="pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => user ? onGoToDashboard() : onStartAuth(true)}
              className="w-full sm:w-auto px-6 py-3 bg-neutral-900 hover:bg-neutral-800 text-white text-sm font-semibold rounded-xl transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer group"
            >
              <span>{user ? 'Buka Workspace Saya' : 'Coba Ersona Sekarang — Gratis'}</span>
              <ArrowRight className="w-4 h-4 group-hover:translate-x-0.5 transition-transform" />
            </button>
            <a
              href="#preview"
              className="w-full sm:w-auto px-5 py-3 bg-white hover:bg-neutral-50 text-neutral-700 text-sm font-semibold border border-neutral-200/90 rounded-xl transition flex items-center justify-center space-x-2 cursor-pointer shadow-2xs"
            >
              <Eye className="w-4 h-4 text-neutral-500" />
              <span>Lihat Preview Tampilan</span>
            </a>
          </div>

          {/* Social Proof / Trust Bullets */}
          <div className="pt-6 flex flex-wrap items-center justify-center gap-y-2 gap-x-6 text-xs text-neutral-500 font-medium">
            <div className="flex items-center space-x-1.5">
              <Check className="w-3.5 h-3.5 text-emerald-600" />
              <span>Tanpa Kartu Kredit</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <ShieldCheck className="w-3.5 h-3.5 text-emerald-600" />
              <span>Privasi Terlindungi (Supabase RLS)</span>
            </div>
            <div className="flex items-center space-x-1.5">
              <Smartphone className="w-3.5 h-3.5 text-emerald-600" />
              <span>100% Responsif di Smartphone & PC</span>
            </div>
          </div>
        </div>
      </section>

      {/* 3. SHOWCASE SECTION (PREVIEW MOCKUP ELEGAN & REALISTIS) */}
      <section id="preview" className="max-w-5xl mx-auto px-4 sm:px-6 pb-20 sm:pb-32">
        <div className="text-center space-y-2 mb-8">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
            Preview Antarmuka
          </span>
          <h2 className="text-2xl sm:text-3xl font-bold text-neutral-900 tracking-tight">
            Desain Jernih, Alur Kerja yang Mengalir
          </h2>
          <p className="text-xs sm:text-sm text-neutral-500 max-w-lg mx-auto">
            Lihat bagaimana antarmuka Ersona membantu Anda fokus pada hal terpenting tanpa distraksi visual.
          </p>
        </div>

        {/* Browser Mockup Window */}
        <div className="bg-white border border-neutral-200/90 rounded-2xl shadow-xl overflow-hidden transition-all">
          {/* Top Window Chrome */}
          <div className="bg-[#F7F6F3] border-b border-neutral-200/70 px-4 py-3 flex items-center justify-between gap-3">
            {/* Window Dots */}
            <div className="flex items-center space-x-1.5">
              <div className="w-3 h-3 rounded-full bg-red-400/80" />
              <div className="w-3 h-3 rounded-full bg-amber-400/80" />
              <div className="w-3 h-3 rounded-full bg-emerald-400/80" />
            </div>

            {/* Simulated Address Bar */}
            <div className="flex-1 max-w-md mx-auto bg-white border border-neutral-200/80 rounded-lg px-3 py-1 text-center text-xs text-neutral-500 font-mono select-none flex items-center justify-center space-x-1.5 shadow-2xs">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              <span>https://ersona.app/workspace</span>
            </div>

            {/* View Mode Switcher: Baris vs Kolom */}
            <div className="flex items-center bg-neutral-200/70 p-0.5 rounded-lg text-xs">
              <button
                type="button"
                onClick={() => setPreviewMode('list')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  previewMode === 'list'
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <List className="w-3 h-3" />
                <span>Baris</span>
              </button>
              <button
                type="button"
                onClick={() => setPreviewMode('board')}
                className={`flex items-center space-x-1 px-2.5 py-1 rounded-md font-medium transition cursor-pointer ${
                  previewMode === 'board'
                    ? 'bg-white text-neutral-900 shadow-2xs font-semibold'
                    : 'text-neutral-500 hover:text-neutral-900'
                }`}
              >
                <Columns3 className="w-3 h-3" />
                <span>Kolom</span>
              </button>
            </div>
          </div>

          {/* Window Body (Workspace Preview) */}
          <div className="p-4 sm:p-6 bg-[#FBFBFA] space-y-4">
            {/* Mockup Toolbar Header */}
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-neutral-200/80">
              <div className="flex items-center space-x-2">
                <span className="text-sm font-semibold text-neutral-800">Daftar Tugas & Jadwal</span>
                <span className="text-[11px] font-mono bg-neutral-100 text-neutral-600 px-2 py-0.5 rounded-full font-medium">
                  {previewTasks.length}
                </span>
              </div>

              <div className="flex items-center space-x-2 text-xs text-neutral-500">
                <span className="bg-white border border-neutral-200/80 px-2.5 py-1 rounded-lg flex items-center space-x-1 text-neutral-600 shadow-2xs font-medium">
                  <ArrowUpDown className="w-3 h-3 text-neutral-400" />
                  <span>Jatuh Tempo Terdekat</span>
                </span>
              </div>
            </div>

            {/* Mockup Quick Add Bar */}
            <div className="bg-white border border-neutral-200/90 rounded-xl p-3 shadow-2xs space-y-2">
              <div className="text-xs text-neutral-400 font-medium select-none">
                + Tambah tugas baru... (tekan Enter untuk menyimpan)
              </div>
              <div className="flex flex-wrap items-center justify-between gap-2 pt-1 border-t border-neutral-100 text-[11px] text-neutral-600">
                <div className="flex items-center gap-1.5">
                  <span className="bg-neutral-50 border border-neutral-200/80 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-700">
                    <Flag className="w-2.5 h-2.5 text-neutral-400" />
                    <span>🔥 Mendesak</span>
                  </span>
                  <span className="bg-neutral-50 border border-neutral-200/80 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-700">
                    <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                    <span>18 Sep 2026</span>
                  </span>
                  <span className="bg-neutral-50 border border-neutral-200/80 px-2 py-0.5 rounded-md flex items-center space-x-1 text-neutral-600">
                    <Paperclip className="w-2.5 h-2.5 text-neutral-400" />
                    <span>+ Catatan / Foto</span>
                  </span>
                </div>
                <div className="bg-neutral-900 text-white text-[10px] font-semibold px-2.5 py-1 rounded-lg shadow-2xs">
                  Simpan Tugas
                </div>
              </div>
            </div>

            {/* Tampilan Sesuai Mode: Kolom (Board) vs Baris (List) */}
            {previewMode === 'board' ? (
              /* PREVIEW KANBAN BOARD */
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3 pt-1">
                {previewStatuses.map(status => {
                  const tasksInCol = previewTasks.filter(t => t.status === status.id);
                  return (
                    <div key={status.id} className="bg-[#F7F6F3] border border-neutral-200/80 rounded-2xl p-3 flex flex-col min-h-[310px] shadow-2xs">
                      {/* Header Kolom */}
                      <div className="flex items-center justify-between pb-2 mb-2 border-b border-neutral-200/60">
                        <span className={`px-2 py-0.5 rounded-full text-[11px] font-semibold border ${status.color}`}>
                          {status.label}
                        </span>
                        <span className="text-xs text-neutral-400 font-mono font-medium">({status.count})</span>
                      </div>

                      {/* Kartu-Kartu Tugas dalam Kolom */}
                      <div className="space-y-2.5 flex-1">
                        {tasksInCol.map(task => (
                          <div
                            key={task.id}
                            className={`bg-white border rounded-xl p-3 shadow-2xs space-y-2 select-none ${
                              task.completed ? 'border-neutral-200/60 opacity-75' : 'border-neutral-200/90'
                            }`}
                          >
                            {/* Card Top: Prioritas Badge */}
                            <div className="flex items-center justify-between">
                              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-md border ${task.priorityColor}`}>
                                {task.priorityLabel}
                              </span>
                              <span className="text-[10px] text-neutral-400 font-mono font-medium">
                                #{task.id}
                              </span>
                            </div>

                            {/* Card Title & Checkbox */}
                            <div className="flex items-start space-x-2">
                              <div className="mt-0.5 shrink-0 text-neutral-400">
                                {task.completed ? (
                                  <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                ) : (
                                  <Circle className="w-4 h-4" />
                                )}
                              </div>
                              <p className={`text-xs font-semibold leading-snug ${
                                task.completed ? 'line-through text-neutral-400' : 'text-neutral-800'
                              }`}>
                                {task.title}
                              </p>
                            </div>

                            {/* Contoh Lampiran Gambar Mini */}
                            {task.hasImage && (
                              <div className="h-16 rounded-lg bg-neutral-100 border border-neutral-200/70 flex items-center justify-center text-[10px] text-neutral-500 space-x-1">
                                <Paperclip className="w-3 h-3 text-neutral-400" />
                                <span>Preview_Foto_Lampiran.jpg</span>
                              </div>
                            )}

                            {/* Card Footer: Due Date & Reminder */}
                            <div className="flex items-center justify-between pt-1 border-t border-neutral-100 text-[10px] text-neutral-500">
                              <div className="flex items-center space-x-1 font-mono">
                                <Calendar className="w-2.5 h-2.5 text-neutral-400" />
                                <span>{task.date}</span>
                              </div>
                              {task.reminder && (
                                <span className="bg-amber-100/70 text-amber-800 px-1.5 py-0.2 rounded font-semibold flex items-center space-x-0.5 text-[9px]">
                                  <Bell className="w-2 h-2" />
                                  <span>{task.reminder}</span>
                                </span>
                              )}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            ) : (
              /* PREVIEW BARIS (LIST) */
              <div className="space-y-2 pt-1">
                {previewTasks.map(task => (
                  <div
                    key={task.id}
                    className="p-3 bg-white border border-neutral-200/80 rounded-xl shadow-2xs flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 select-none"
                  >
                    <div className="flex items-center space-x-2.5 min-w-0">
                      <div className="text-neutral-400 shrink-0">
                        {task.completed ? (
                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                        ) : (
                          <Circle className="w-4 h-4" />
                        )}
                      </div>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border shrink-0 ${task.statusColor}`}>
                        {task.statusLabel}
                      </span>
                      <span className={`text-xs font-medium truncate ${
                        task.completed ? 'line-through text-neutral-400' : 'text-neutral-800'
                      }`}>
                        {task.title}
                      </span>
                    </div>

                    <div className="flex items-center space-x-2 pl-6 sm:pl-0 shrink-0 text-xs">
                      <span className={`text-[10px] font-medium px-2 py-0.5 rounded-md border ${task.priorityColor}`}>
                        {task.priorityLabel}
                      </span>
                      <span className="text-[11px] text-neutral-400 font-mono flex items-center space-x-1 bg-neutral-50 px-2 py-0.5 rounded">
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
      <section id="fitur" className="max-w-6xl mx-auto px-4 sm:px-6 py-16 sm:py-24 border-t border-neutral-200/70">
        <div className="max-w-2xl mx-auto text-center space-y-3 mb-14">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">
            Nilai & Kemampuan Utama
          </span>
          <h2 className="text-2xl sm:text-4xl font-bold text-neutral-900 tracking-tight">
            Semua yang Anda Butuhkan untuk Produktivitas Tenang
          </h2>
          <p className="text-xs sm:text-sm text-neutral-600 leading-relaxed">
            Tidak ada fitur rumit yang tidak pernah Anda pakai. Ersona dirancang secara presisi untuk fokus, kenyamanan mata, dan kecepatan kerja.
          </p>
        </div>

        {/* 6 Bento Grid Feature Cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {/* Fitur 1: Dua Mode Tampilan */}
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Columns3 className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900">Dua Sudut Pandang (Baris & Kolom)</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Beralih antara daftar to-do baris yang ringkas atau papan kolom Kanban yang visual hanya dengan <strong>1x klik</strong>. Scroll internal per kolom memastikan kanban tetap nyaman digunakan walau memiliki ratusan tugas.
            </p>
          </div>

          {/* Fitur 2: Alur Status Kustom */}
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Layers className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900">Alur Kerja Status Sesuai Gaya Anda</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Anda tidak terkunci pada status baku. Tambahkan status kustom seperti <em>"Testing"</em>, <em>"Waiting Client"</em>, atau <em>"On Hold"</em> dengan pilihan palet warna Notion yang serasi.
            </p>
          </div>

          {/* Fitur 3: Multi-Media Notes */}
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Paperclip className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900">Catatan Kaya Foto & Video</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Bukan hanya teks biasa. Lampirkan hingga <strong>5 foto</strong> dan <strong>1 video</strong> pada setiap catatan, lengkap dengan mode lightbox layar penuh untuk memeriksa detail gambar.
            </p>
          </div>

          {/* Fitur 4: Prioritas Mendesak & Pengingat */}
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Flag className="w-5 h-5 text-red-600" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900">Prioritas Mendesak & Pengingat</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tandai tugas yang butuh tindakan cepat dengan prioritas <strong>🔥 Mendesak (Urgent)</strong>. Atur tanggal jatuh tempo dan aktifkan pengingat agar target harian Anda selalu terpantau.
            </p>
          </div>

          {/* Fitur 5: Tempat Sampah & Pemulihan */}
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Trash2 className="w-5 h-5 text-amber-600" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900">Tempat Sampah & Pemulihan 5 Hari</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Tenang saat merapikan workspace. Tugas dan catatan yang dihapus masuk ke tab Tempat Sampah dan bisa dipulihkan seketika dengan 1 klik sebelum otomatis dibersihkan dalam 5 hari.
            </p>
          </div>

          {/* Fitur 6: Mobile First */}
          <div className="p-6 bg-white border border-neutral-200/80 rounded-2xl shadow-2xs space-y-3 hover:shadow-xs transition">
            <div className="w-10 h-10 rounded-xl bg-neutral-100 border border-neutral-200/80 flex items-center justify-center text-neutral-800">
              <Smartphone className="w-5 h-5" />
            </div>
            <h3 className="font-semibold text-base text-neutral-900">Akses Nyaman di Smartphone</h3>
            <p className="text-xs text-neutral-600 leading-relaxed">
              Didukung drawer navigasi atas yang ringkas, baris tugas dua tingkat adaptif, dan kanban horizontal yang mendukung gestur usap jempol (*CSS scroll snap*).
            </p>
          </div>
        </div>
      </section>

      {/* 5. PERBANDINGAN: KENAPA ERSONA? */}
      <section id="keunggulan" className="max-w-4xl mx-auto px-4 sm:px-6 py-16">
        <div className="bg-[#F7F6F3] border border-neutral-200/90 rounded-3xl p-6 sm:p-10 space-y-8">
          <div className="text-center space-y-2">
            <h2 className="text-xl sm:text-2xl font-bold text-neutral-900 tracking-tight">
              Dirancang untuk Pikiran yang Bersih
            </h2>
            <p className="text-xs sm:text-sm text-neutral-500 max-w-md mx-auto">
              Perbedaan nyata antara aplikasi produktivitas yang rumit dengan Ersona.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            {/* Aplikasi Konvensional */}
            <div className="p-5 bg-white/70 border border-neutral-200/60 rounded-2xl space-y-3">
              <span className="font-semibold text-neutral-400 uppercase tracking-wider text-[10px]">Aplikasi Lain</span>
              <ul className="space-y-2 text-neutral-500">
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>Terlalu banyak tombol, menu, dan notifikasi berisik</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>Mode tampilan kaku dan tidak bisa disesuaikan seketika</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>Tidak bisa melampirkan foto/video atau berbayar mahal</span>
                </li>
                <li className="flex items-start space-x-2">
                  <span className="text-red-500 font-bold shrink-0">✕</span>
                  <span>Tampilan mobile sempit dan sulit ditekan</span>
                </li>
              </ul>
            </div>

            {/* Ersona Workspace */}
            <div className="p-5 bg-white border border-neutral-900/20 rounded-2xl space-y-3 shadow-xs ring-1 ring-neutral-900/5">
              <span className="font-bold text-neutral-900 uppercase tracking-wider text-[10px] flex items-center space-x-1">
                <span>🪐 Ersona Workspace</span>
                <span className="bg-emerald-100 text-emerald-800 px-1.5 py-0.2 rounded font-normal text-[9px]">Rekomendasi</span>
              </span>
              <ul className="space-y-2 text-neutral-800">
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Antarmuka Notion yang menenangkan dan bebas distraksi</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Bebas ganti antara Baris & Papan Kanban 1x klik</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>Mendukung lampiran multi-media foto & video beresolusi tinggi</span>
                </li>
                <li className="flex items-start space-x-2">
                  <Check className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                  <span>100% Responsif di smartphone dengan menu drawer yang rapi</span>
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* 6. FAQ (PERTANYAAN UMUM) */}
      <section id="faq" className="max-w-3xl mx-auto px-4 sm:px-6 py-16 border-t border-neutral-200/70">
        <div className="text-center space-y-2 mb-10">
          <span className="text-xs font-mono font-semibold uppercase tracking-wider text-neutral-400">FAQ</span>
          <h2 className="text-2xl font-bold text-neutral-900 tracking-tight">Pertanyaan yang Sering Diajukan</h2>
        </div>

        <div className="space-y-4 text-xs">
          <div className="p-4 bg-white border border-neutral-200/80 rounded-xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 text-sm">Apakah Ersona gratis?</h4>
            <p className="text-neutral-600 leading-relaxed">
              Ya, 100% gratis untuk penggunaan personal. Anda langsung mendapatkan kapasitas penyimpanan awan untuk lampiran foto & catatan Anda.
            </p>
          </div>

          <div className="p-4 bg-white border border-neutral-200/80 rounded-xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 text-sm">Apakah data saya aman dan privat?</h4>
            <p className="text-neutral-600 leading-relaxed">
              Sangat aman. Ersona menggunakan arsitektur PostgreSQL Supabase dengan <strong>Row Level Security (RLS)</strong>. Artinya, hanya akun Anda yang memiliki hak akses untuk membaca dan mengubah data tugas dan catatan milik Anda.
            </p>
          </div>

          <div className="p-4 bg-white border border-neutral-200/80 rounded-xl space-y-1.5">
            <h4 className="font-semibold text-neutral-900 text-sm">Bisa digunakan di handphone?</h4>
            <p className="text-neutral-600 leading-relaxed">
              Tentu saja! Buka tautan web Ersona di browser ponsel Anda (Chrome, Safari, Firefox), dan tampilan otomatis menyesuaikan menjadi aplikasi mobile yang intuitif.
            </p>
          </div>
        </div>
      </section>

      {/* 7. BOTTOM CTA BANNER */}
      <section className="max-w-5xl mx-auto px-4 sm:px-6 pb-20">
        <div className="bg-neutral-900 text-white rounded-3xl p-8 sm:p-14 text-center space-y-6 shadow-2xl relative overflow-hidden">
          <div className="relative z-10 space-y-3 max-w-xl mx-auto">
            <h2 className="text-2xl sm:text-4xl font-bold tracking-tight">
              Mulai Hari Anda dengan Pikiran yang Lebih Tertata.
            </h2>
            <p className="text-xs sm:text-sm text-neutral-400 leading-relaxed">
              Daftar dalam waktu kurang dari 30 detik dan rasakan bagaimana Ersona membantu Anda menyelesaikan target harian dengan tenang.
            </p>
          </div>

          <div className="relative z-10 pt-2 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={() => user ? onGoToDashboard() : onStartAuth(true)}
              className="w-full sm:w-auto px-6 py-3 bg-white text-neutral-900 text-xs sm:text-sm font-semibold rounded-xl hover:bg-neutral-100 transition flex items-center justify-center space-x-2 shadow-sm cursor-pointer"
            >
              <span>{user ? 'Buka Workspace Saya' : 'Daftar Sekarang — Gratis'}</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            {!user && (
              <button
                onClick={() => onStartAuth(false)}
                className="w-full sm:w-auto px-5 py-3 bg-white/10 hover:bg-white/15 text-white text-xs sm:text-sm font-semibold rounded-xl border border-white/10 transition cursor-pointer"
              >
                Sudah Punya Akun? Masuk
              </button>
            )}
          </div>
        </div>
      </section>

      {/* 8. FOOTER */}
      <footer className="border-t border-neutral-200/70 py-8 bg-[#F7F6F3]">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-neutral-500">
          <div className="flex items-center space-x-2">
            <span className="text-sm">🪐</span>
            <span className="font-semibold text-neutral-800">Ersona Workspace</span>
            <span>• Hak Cipta © {new Date().getFullYear()}</span>
          </div>

          <div className="flex items-center space-x-6">
            <a
              href="https://github.com/Efrson/Ersona"
              target="_blank"
              rel="noreferrer"
              className="hover:text-neutral-900 transition flex items-center space-x-1"
            >
              <span>GitHub</span>
              <ExternalLink className="w-3 h-3" />
            </a>
            <span className="text-neutral-400">Minimalist Productivity</span>
          </div>
        </div>
      </footer>
    </div>
  );
}
