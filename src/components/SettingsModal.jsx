import React, { useState } from 'react';
import {
  X, User, HardDrive, Layout, CheckCircle2, AlertTriangle,
  RefreshCw, Sparkles, Mail, Trash2, Check, Undo2, ArrowUpRight
} from 'lucide-react';
import { formatBytes } from '../utils/storageQuota';
import { supabase } from '../lib/supabaseClient';

export default function SettingsModal({
  isOpen,
  onClose,
  user,
  storageUsage,
  onRefreshStorage,
  quotaConfig,
  preferences,
  onSavePreferences,
  onResetPreferences,
  onToggleProTier,
  onNavigateToTab,
}) {
  if (!isOpen) return null;

  const [activeTab, setActiveTab] = useState('account'); // 'account' | 'interface'
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [resendingEmail, setResendingEmail] = useState(false);
  const [emailSentNotice, setEmailSentNotice] = useState(false);
  const [isUpgrading, setIsUpgrading] = useState(false);

  // Form state untuk preferensi tampilan & kustomisasi teks
  const [density, setDensity] = useState(preferences.viewDensity || 'cozy');
  const [defaultSort, setDefaultSort] = useState(preferences.defaultSort || 'created_desc');
  const [defaultPriority, setDefaultPriority] = useState(preferences.defaultPriority || 'none');
  const [customLabels, setCustomLabels] = useState({
    trashTab: preferences.customLabels?.trashTab || 'Sampah',
    remindersTab: preferences.customLabels?.remindersTab || 'Pengingat',
    todosTab: preferences.customLabels?.todosTab || 'To-Do List',
    notesTab: preferences.customLabels?.notesTab || 'Catatan & Media',
    moveToTrash: preferences.customLabels?.moveToTrash || 'Pindahkan ke Tempat Sampah',
    emptyTrash: preferences.customLabels?.emptyTrash || 'Kosongkan Sampah',
  });
  const [saveFeedback, setSaveFeedback] = useState(false);

  // Kalkulasi persentase kuota
  const usedBytes = storageUsage || 0;
  const maxBytes = quotaConfig.maxBytes || 100 * 1024 * 1024;
  const usagePercent = Math.min(100, Math.max(0, (usedBytes / maxBytes) * 100));
  const remainingBytes = Math.max(0, maxBytes - usedBytes);

  // Handler Refresh Storage
  const handleRefresh = async () => {
    setIsRefreshing(true);
    try {
      await onRefreshStorage();
    } finally {
      setIsRefreshing(false);
    }
  };

  // Handler Kirim Ulang Email Konfirmasi
  const handleResendConfirmation = async () => {
    if (!user?.email) return;
    setResendingEmail(true);
    setEmailSentNotice(false);
    try {
      const { error } = await supabase.auth.resend({
        type: 'signup',
        email: user.email,
      });
      if (error) throw error;
      setEmailSentNotice(true);
      setTimeout(() => setEmailSentNotice(false), 5000);
    } catch (err) {
      alert('Gagal mengirim ulang email konfirmasi: ' + err.message);
    } finally {
      setResendingEmail(false);
    }
  };

  // Handler Toggle Pro / Upgrade
  const handleToggleUpgrade = async () => {
    setIsUpgrading(true);
    try {
      await onToggleProTier(!quotaConfig.isUpgraded);
    } finally {
      setIsUpgrading(false);
    }
  };

  // Handler Simpan Preferensi
  const handleSaveSettings = (e) => {
    e.preventDefault();
    onSavePreferences({
      viewDensity: density,
      defaultSort,
      defaultPriority,
      customLabels,
    });
    setSaveFeedback(true);
    setTimeout(() => setSaveFeedback(false), 2500);
  };

  // Handler Reset ke Default
  const handleResetSettings = () => {
    if (confirm('Kembalikan semua preferensi dan penamaan teks ke setelan standar?')) {
      onResetPreferences();
      setDensity('cozy');
      setDefaultSort('created_desc');
      setDefaultPriority('none');
      setCustomLabels({
        trashTab: 'Sampah',
        remindersTab: 'Pengingat',
        todosTab: 'To-Do List',
        notesTab: 'Catatan & Media',
        moveToTrash: 'Pindahkan ke Tempat Sampah',
        emptyTrash: 'Kosongkan Sampah',
      });
      setSaveFeedback(true);
      setTimeout(() => setSaveFeedback(false), 2500);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40 backdrop-blur-xs animate-fade-in">
      <div className="bg-white rounded-2xl max-w-2xl w-full max-h-[90vh] shadow-2xl border border-neutral-200/80 flex flex-col overflow-hidden animate-scale-in">
        
        {/* Header Modal */}
        <div className="px-6 py-4 border-b border-neutral-100 flex items-center justify-between bg-[#FBFBFA]">
          <div className="flex items-center space-x-2.5">
            <div className="w-8 h-8 rounded-lg bg-neutral-200/70 flex items-center justify-center text-neutral-700">
              <HardDrive className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-semibold text-neutral-900">Pengaturan Workspace</h2>
              <p className="text-xs text-neutral-500">Kelola akun, kuota penyimpanan, dan preferensi antarmuka</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-neutral-700 p-1.5 rounded-lg hover:bg-neutral-200/50 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Tab Navigation */}
        <div className="flex border-b border-neutral-200/70 px-6 bg-[#FAF9F7] text-xs font-medium">
          <button
            onClick={() => setActiveTab('account')}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'account'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <User className="w-3.5 h-3.5" />
            <span>Akun & Kuota Storage</span>
          </button>
          <button
            onClick={() => setActiveTab('interface')}
            className={`py-3 px-4 flex items-center space-x-2 border-b-2 transition cursor-pointer ${
              activeTab === 'interface'
                ? 'border-neutral-900 text-neutral-900 font-semibold'
                : 'border-transparent text-neutral-500 hover:text-neutral-800'
            }`}
          >
            <Layout className="w-3.5 h-3.5" />
            <span>Tampilan & Kustomisasi Teks</span>
          </button>
        </div>

        {/* Body Konten */}
        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          
          {/* TAB 1: AKUN & KUOTA STORAGE */}
          {activeTab === 'account' && (
            <div className="space-y-6">
              
              {/* Kartu Profil & Email Status */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-neutral-50/60 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div className="flex items-center space-x-3">
                  <div className="w-10 h-10 rounded-full bg-neutral-800 text-white flex items-center justify-center font-bold text-sm">
                    {user?.email?.charAt(0).toUpperCase() || 'U'}
                  </div>
                  <div>
                    <div className="text-sm font-semibold text-neutral-900">{user?.email}</div>
                    <div className="flex items-center space-x-2 mt-0.5">
                      {quotaConfig.isEmailConfirmed ? (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-full border border-emerald-200">
                          <CheckCircle2 className="w-3 h-3" />
                          <span>Email Terverifikasi (Kuota 300 MB)</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center space-x-1 text-[11px] text-amber-700 bg-amber-50 px-2 py-0.5 rounded-full border border-amber-200">
                          <AlertTriangle className="w-3 h-3" />
                          <span>Belum Konfirmasi Email (Batas 100 MB)</span>
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                {!quotaConfig.isEmailConfirmed && (
                  <button
                    type="button"
                    onClick={handleResendConfirmation}
                    disabled={resendingEmail}
                    className="self-start sm:self-center px-3 py-1.5 text-xs bg-white hover:bg-neutral-100 text-neutral-700 border border-neutral-300 rounded-lg transition font-medium flex items-center space-x-1.5 cursor-pointer disabled:opacity-50"
                  >
                    <Mail className="w-3.5 h-3.5" />
                    <span>{resendingEmail ? 'Mengirim...' : 'Kirim Ulang Email'}</span>
                  </button>
                )}
              </div>

              {emailSentNotice && (
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-xs text-emerald-800 flex items-center space-x-2 animate-fade-in">
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Email konfirmasi telah dikirim! Silakan periksa inbox / folder spam email Anda.</span>
                </div>
              )}

              {/* Visual Storage Meter */}
              <div className="p-5 rounded-xl border border-neutral-200 bg-white space-y-4 shadow-2xs">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-2">
                    <HardDrive className="w-4 h-4 text-neutral-700" />
                    <h3 className="text-sm font-semibold text-neutral-900">Penyimpanan Media (Supabase Storage)</h3>
                  </div>
                  <button
                    onClick={handleRefresh}
                    disabled={isRefreshing}
                    title="Hitung ulang ukuran penyimpanan"
                    className="text-xs text-neutral-500 hover:text-neutral-900 flex items-center space-x-1 p-1 rounded hover:bg-neutral-100 transition cursor-pointer"
                  >
                    <RefreshCw className={`w-3.5 h-3.5 ${isRefreshing ? 'animate-spin text-neutral-800' : ''}`} />
                    <span>{isRefreshing ? 'Menghitung...' : 'Segarkan'}</span>
                  </button>
                </div>

                {/* Progress Bar */}
                <div>
                  <div className="flex items-baseline justify-between text-xs mb-1.5">
                    <span className="font-semibold text-neutral-800">
                      {formatBytes(usedBytes)} <span className="font-normal text-neutral-500">dari {formatBytes(maxBytes)}</span>
                    </span>
                    <span className="font-mono text-neutral-500 text-[11px]">
                      {usagePercent.toFixed(1)}% terpakai
                    </span>
                  </div>

                  <div className="w-full bg-neutral-100 rounded-full h-3 overflow-hidden p-0.5 border border-neutral-200/70">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        usagePercent > 90
                          ? 'bg-red-500'
                          : usagePercent > 70
                          ? 'bg-amber-500'
                          : 'bg-emerald-500'
                      }`}
                      style={{ width: `${usagePercent}%` }}
                    />
                  </div>

                  <div className="flex items-center justify-between text-[11px] text-neutral-400 mt-2">
                    <span>Sisa kapasitas: <strong className="text-neutral-600">{formatBytes(remainingBytes)}</strong></span>
                    <span>Tingkat Kuota: <strong className="text-neutral-700">{quotaConfig.tierName}</strong></span>
                  </div>
                </div>

                {/* Storage Info Tips */}
                <div className="pt-3 border-t border-neutral-100 flex items-center justify-between text-xs">
                  <span className="text-neutral-500">Kapasitas penuh? Bersihkan sampah untuk melegakan storage.</span>
                  <button
                    onClick={() => {
                      onClose();
                      onNavigateToTab('trash');
                    }}
                    className="text-xs text-red-600 hover:text-red-700 font-medium flex items-center space-x-1 cursor-pointer"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Buka Tempat Sampah</span>
                  </button>
                </div>
              </div>

              {/* Status Paket & Tier Upgrade Section */}
              <div className="p-5 rounded-xl border border-neutral-200 bg-linear-to-br from-neutral-50 to-[#FAF9F7] space-y-4">
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center space-x-2">
                      <Sparkles className="w-4 h-4 text-amber-500" />
                      <h3 className="text-sm font-semibold text-neutral-900">
                        {quotaConfig.isUpgraded ? 'Akun Solist Pro (1 GB Aktif)' : 'Upgrade ke Solist Pro'}
                      </h3>
                    </div>
                    <p className="text-xs text-neutral-500 mt-1">
                      {quotaConfig.isUpgraded
                        ? 'Anda menikmati kuota upload maksimal 1 GB untuk semua lampiran foto dan video.'
                        : 'Dapatkan kapasitas upload hingga 1 GB (1.024 MB) untuk foto dan video beresolusi tinggi.'}
                    </p>
                  </div>
                  <span className={`text-[10px] font-mono px-2 py-0.5 rounded-full font-bold uppercase ${
                    quotaConfig.isUpgraded ? 'bg-amber-100 text-amber-800' : 'bg-neutral-200 text-neutral-700'
                  }`}>
                    {quotaConfig.isUpgraded ? 'PRO 1GB' : 'FREE'}
                  </span>
                </div>

                <div className="grid grid-cols-3 gap-2 text-center text-xs">
                  <div className={`p-2.5 rounded-lg border ${!quotaConfig.isEmailConfirmed && !quotaConfig.isUpgraded ? 'border-neutral-800 bg-white ring-1 ring-neutral-800' : 'border-neutral-200 bg-white/60'}`}>
                    <div className="text-[10px] text-neutral-400 font-medium">Belum Konfirmasi</div>
                    <div className="font-bold text-neutral-800 mt-0.5">100 MB</div>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${quotaConfig.isEmailConfirmed && !quotaConfig.isUpgraded ? 'border-neutral-800 bg-white ring-1 ring-neutral-800' : 'border-neutral-200 bg-white/60'}`}>
                    <div className="text-[10px] text-neutral-400 font-medium">Terkonfirmasi</div>
                    <div className="font-bold text-neutral-800 mt-0.5">300 MB</div>
                  </div>
                  <div className={`p-2.5 rounded-lg border ${quotaConfig.isUpgraded ? 'border-amber-600 bg-amber-50/50 ring-1 ring-amber-600' : 'border-neutral-200 bg-white/60'}`}>
                    <div className="text-[10px] text-amber-600 font-medium flex items-center justify-center space-x-0.5">
                      <Sparkles className="w-2.5 h-2.5" />
                      <span>Upgraded Pro</span>
                    </div>
                    <div className="font-bold text-amber-900 mt-0.5">1 GB</div>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between">
                  <span className="text-[11px] text-neutral-400">
                    Opsi pengujian / demo tier langsung:
                  </span>
                  <button
                    type="button"
                    onClick={handleToggleUpgrade}
                    disabled={isUpgrading}
                    className={`px-3 py-1.5 text-xs font-semibold rounded-lg transition flex items-center space-x-1.5 cursor-pointer ${
                      quotaConfig.isUpgraded
                        ? 'bg-neutral-200 hover:bg-neutral-300 text-neutral-800'
                        : 'bg-neutral-900 hover:bg-neutral-800 text-white shadow-xs'
                    }`}
                  >
                    <Sparkles className="w-3 h-3" />
                    <span>
                      {isUpgrading
                        ? 'Menyimpan...'
                        : quotaConfig.isUpgraded
                        ? 'Kembalikan ke Akun Free'
                        : 'Aktifkan Kuota Pro 1 GB'}
                    </span>
                  </button>
                </div>
              </div>

            </div>
          )}

          {/* TAB 2: TAMPILAN & KUSTOMISASI TEKS */}
          {activeTab === 'interface' && (
            <form onSubmit={handleSaveSettings} className="space-y-6">
              
              {/* Kerapatan Tampilan (Density) */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">Kerapatan Tampilan (View Density)</h3>
                <div className="grid grid-cols-2 gap-3">
                  <button
                    type="button"
                    onClick={() => setDensity('cozy')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      density === 'cozy'
                        ? 'border-neutral-800 bg-neutral-50 ring-1 ring-neutral-800'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-neutral-900">Mode Nyaman (Cozy)</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Tata letak standar Notion, baris lebih luas & lapang.</div>
                  </button>

                  <button
                    type="button"
                    onClick={() => setDensity('compact')}
                    className={`p-3 rounded-lg border text-left transition cursor-pointer ${
                      density === 'compact'
                        ? 'border-neutral-800 bg-neutral-50 ring-1 ring-neutral-800'
                        : 'border-neutral-200 hover:border-neutral-300'
                    }`}
                  >
                    <div className="font-semibold text-xs text-neutral-900">Mode Ringkas (Compact)</div>
                    <div className="text-[11px] text-neutral-500 mt-0.5">Jarak lebih padat, cocok untuk melihat banyak daftar sekaligus.</div>
                  </button>
                </div>
              </div>

              {/* Default Sort & Priority */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-4">
                <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">Preferensi Tugas Bawaan</h3>
                
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Urutan Default Tugas</label>
                    <select
                      value={defaultSort}
                      onChange={(e) => setDefaultSort(e.target.value)}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    >
                      <option value="created_desc">Terbaru Dibuat</option>
                      <option value="due_date">Jatuh Tempo Terdekat</option>
                      <option value="priority">Prioritas Tertinggi (High - Low)</option>
                    </select>
                  </div>

                  <div>
                    <label className="block text-xs font-medium text-neutral-700 mb-1">Prioritas Default Tugas Baru</label>
                    <select
                      value={defaultPriority}
                      onChange={(e) => setDefaultPriority(e.target.value)}
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    >
                      <option value="none">Tanpa Prioritas</option>
                      <option value="low">Rendah (Low)</option>
                      <option value="medium">Sedang (Medium)</option>
                      <option value="high">Tinggi (High)</option>
                    </select>
                  </div>
                </div>
              </div>

              {/* Kustomisasi Teks / Label Bebas */}
              <div className="p-4 rounded-xl border border-neutral-200 bg-white space-y-3">
                <div className="flex items-center justify-between">
                  <div>
                    <h3 className="text-xs font-semibold text-neutral-900 uppercase tracking-wider">Kustomisasi Teks & Label</h3>
                    <p className="text-[11px] text-neutral-500 mt-0.5">Ubah penamaan menu dan tombol sesuai gaya bahasa Anda.</p>
                  </div>
                  <button
                    type="button"
                    onClick={handleResetSettings}
                    className="text-xs text-neutral-500 hover:text-neutral-800 flex items-center space-x-1 cursor-pointer"
                  >
                    <Undo2 className="w-3.5 h-3.5" />
                    <span>Reset Label</span>
                  </button>
                </div>

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-2">
                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Label Tab Sampah</label>
                    <input
                      type="text"
                      value={customLabels.trashTab}
                      onChange={(e) => setCustomLabels({ ...customLabels, trashTab: e.target.value })}
                      placeholder="Contoh: Tempat Sampah, Recycle Bin"
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Label Tombol Hapus ke Sampah</label>
                    <input
                      type="text"
                      value={customLabels.moveToTrash}
                      onChange={(e) => setCustomLabels({ ...customLabels, moveToTrash: e.target.value })}
                      placeholder="Contoh: Buang ke Sampah"
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Label Tab Pengingat</label>
                    <input
                      type="text"
                      value={customLabels.remindersTab}
                      onChange={(e) => setCustomLabels({ ...customLabels, remindersTab: e.target.value })}
                      placeholder="Contoh: Pengingat, Alarm, Due Soon"
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Label Tab To-Do List</label>
                    <input
                      type="text"
                      value={customLabels.todosTab}
                      onChange={(e) => setCustomLabels({ ...customLabels, todosTab: e.target.value })}
                      placeholder="Contoh: To-Do List, Daftar Tugas"
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Label Tab Catatan</label>
                    <input
                      type="text"
                      value={customLabels.notesTab}
                      onChange={(e) => setCustomLabels({ ...customLabels, notesTab: e.target.value })}
                      placeholder="Contoh: Catatan & Media, Notes"
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>

                  <div>
                    <label className="block text-[11px] font-medium text-neutral-600 mb-1">Label Tombol Kosongkan Sampah</label>
                    <input
                      type="text"
                      value={customLabels.emptyTrash}
                      onChange={(e) => setCustomLabels({ ...customLabels, emptyTrash: e.target.value })}
                      placeholder="Contoh: Kosongkan Sampah"
                      className="w-full text-xs p-2 bg-neutral-50 border border-neutral-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800"
                    />
                  </div>
                </div>

                <div className="pt-3 flex items-center justify-end space-x-3">
                  {saveFeedback && (
                    <span className="text-xs text-emerald-600 flex items-center space-x-1 animate-fade-in">
                      <Check className="w-3.5 h-3.5" />
                      <span>Pengaturan berhasil disimpan!</span>
                    </span>
                  )}
                  <button
                    type="submit"
                    className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-white rounded-lg text-xs font-medium transition cursor-pointer shadow-xs"
                  >
                    Simpan Perubahan
                  </button>
                </div>
              </div>

            </form>
          )}

        </div>

        {/* Footer Modal */}
        <div className="px-6 py-3.5 border-t border-neutral-100 flex items-center justify-between bg-[#FBFBFA]">
          <span className="text-[11px] text-neutral-400">Solist Workspace Settings</span>
          <button
            type="button"
            onClick={onClose}
            className="px-3.5 py-1.5 text-xs text-neutral-600 hover:bg-neutral-200/60 rounded-lg transition cursor-pointer font-medium"
          >
            Tutup
          </button>
        </div>

      </div>
    </div>
  );
}
