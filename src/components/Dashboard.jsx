import { useState, useEffect, useRef } from 'react';
import { supabase } from '../lib/supabaseClient';
import { useAuth } from '../context/AuthContext';
import { useThemeLanguage } from '../context/ThemeLanguageContext';
import { 
  CheckCircle2, Circle, Calendar, Trash2, Plus, LogOut, 
  FileText, CheckSquare, Search, Tag, AlertCircle, Clock, Loader2,
  Sparkles, X, Image, Video, Paperclip, Link, ExternalLink, Bell,
  ArrowUpDown, ChevronDown, ChevronUp, ChevronLeft, ChevronRight, ZoomIn, Eye, MessageSquare,
  Edit3, Flag, Check, RotateCcw, AlertTriangle, Film, Settings,
  HardDrive, Flame, Columns3, List, Layers, Settings2, ArrowRight, Menu, Globe,
  Sun, Moon, Users, UserPlus, Copy, Share2
} from 'lucide-react';
import { format, isPast, isToday, parseISO, differenceInDays } from 'date-fns';
import { id as localeId, enUS as localeEn } from 'date-fns/locale';
import { compressImage } from '../utils/compressor';
import { parseMediaUrl } from '../utils/embedHelper';
import SettingsModal from './SettingsModal';
import { getUserQuotaConfig, getWorkspaceQuotaConfig, calculateUserStorageUsage, formatBytes } from '../utils/storageQuota';
import { uploadMediaToR2OrSupabase, deleteMediaByUrl } from '../utils/r2Storage';
import {
  isNotificationSupported, getNotificationPermission, isNotificationEnabled,
  requestNotificationPermission, enableNotifications, disableNotifications,
  startReminderChecker, stopReminderChecker, sendTestNotification
} from '../utils/notificationManager';

// Helper normalisasi warna status untuk Notion-style Dark Mode
export const normalizeStatusColor = (color) => {
  if (!color) return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800/90 dark:text-neutral-300 dark:border-neutral-700';

  // Bersihkan kelas dark: sebelumnya untuk normalisasi konsisten
  const base = color.replace(/\s*dark:[^\s]+/g, '').trim();

  if (base.includes('blue')) {
    return 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60';
  }
  if (base.includes('purple')) {
    return 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60';
  }
  if (base.includes('emerald') || base.includes('green')) {
    return 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60';
  }
  if (base.includes('amber') || base.includes('yellow')) {
    return 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60';
  }
  if (base.includes('red') || base.includes('rose')) {
    return 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60';
  }
  return 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800/90 dark:text-neutral-300 dark:border-neutral-700';
};

export const DEFAULT_TASK_STATUSES = [
  { id: 'todo', label: 'To Do', color: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800/90 dark:text-neutral-300 dark:border-neutral-700' },
  { id: 'in_progress', label: 'In Progress', color: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60' },
  { id: 'review', label: 'Review', color: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60' },
  { id: 'completed', label: 'Complete', color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60', isLocked: true },
];

export const STATUS_COLOR_OPTIONS = [
  { label: 'Abu-abu (Default)', labelId: 'Abu-abu (Default)', labelEn: 'Gray (Default)', value: 'bg-neutral-100 text-neutral-700 border-neutral-200 dark:bg-neutral-800/90 dark:text-neutral-300 dark:border-neutral-700' },
  { label: 'Biru (Progress)', labelId: 'Biru (Progress)', labelEn: 'Blue (In Progress)', value: 'bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-950/60 dark:text-blue-300 dark:border-blue-800/60' },
  { label: 'Ungu (Review)', labelId: 'Ungu (Review)', labelEn: 'Purple (Review)', value: 'bg-purple-50 text-purple-700 border-purple-200 dark:bg-purple-950/60 dark:text-purple-300 dark:border-purple-800/60' },
  { label: 'Amber (Menunggu)', labelId: 'Amber (Menunggu)', labelEn: 'Amber (Pending)', value: 'bg-amber-50 text-amber-700 border-amber-200 dark:bg-amber-950/60 dark:text-amber-300 dark:border-amber-800/60' },
  { label: 'Merah (Blocked)', labelId: 'Merah (Blocked)', labelEn: 'Red (Blocked)', value: 'bg-rose-50 text-rose-700 border-rose-200 dark:bg-rose-950/60 dark:text-rose-300 dark:border-rose-800/60' },
  { label: 'Emerald (Complete)', labelId: 'Emerald (Complete)', labelEn: 'Emerald (Complete)', value: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60' },
];

const DEFAULT_PREFERENCES = {
  themeColor: 'emerald',
  defaultSort: 'created_desc',
};

export default function Dashboard({ onGoToLanding }) {
  const { user, signOut, refreshUser } = useAuth();
  const { theme, toggleTheme, isDark, language, setLanguage, toggleLanguage, isEn, t } = useThemeLanguage();
  const notePhotoInputRef = useRef(null);
  const noteVideoInputRef = useRef(null);
  const editNotePhotoInputRef = useRef(null);
  const editNoteVideoInputRef = useRef(null);
  const todoFileInputRef = useRef(null);
  const editTodoFileInputRef = useRef(null);
  const boardRef = useRef(null);

  // State menu navigasi di perangkat mobile
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  // State expand Quick Add form (collapsed by default on mobile)
  const [quickAddExpanded, setQuickAddExpanded] = useState(false);

  // ─── Workspace Collaboration State (Personal vs Shared Workspaces) ───
  const [activeWorkspaceId, setActiveWorkspaceId] = useState(() => {
    try {
      return localStorage.getItem('ersona_active_workspace_id') || null;
    } catch {
      return null;
    }
  });
  const [workspaces, setWorkspaces] = useState([]);
  const [workspaceMembers, setWorkspaceMembers] = useState([]);
  const [isWorkspaceMenuOpen, setIsWorkspaceMenuOpen] = useState(false);
  const [isCreateWsModalOpen, setIsCreateWsModalOpen] = useState(false);
  const [isJoinWsModalOpen, setIsJoinWsModalOpen] = useState(false);
  const [isWsMembersModalOpen, setIsWsMembersModalOpen] = useState(false);
  const [newWsName, setNewWsName] = useState('');
  const [joinInviteCode, setJoinInviteCode] = useState('');
  const [wsActionLoading, setWsActionLoading] = useState(false);
  const [wsError, setWsError] = useState('');
  const [copiedInvite, setCopiedInvite] = useState(false);
  const [wsCustomPhotoLimit, setWsCustomPhotoLimit] = useState('');
  const [isSavingWsLimit, setIsSavingWsLimit] = useState(false);
  const [wsLimitSaveMsg, setWsLimitSaveMsg] = useState('');
  const [isUnverifiedBannerDismissed, setIsUnverifiedBannerDismissed] = useState(() => {
    try {
      return sessionStorage.getItem('ersona_unverified_banner_dismissed') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissUnverifiedBanner = () => {
    setIsUnverifiedBannerDismissed(true);
    try {
      sessionStorage.setItem('ersona_unverified_banner_dismissed', 'true');
    } catch {}
  };

  const [showVerifiedToast, setShowVerifiedToast] = useState(() => {
    try {
      return sessionStorage.getItem('ersona_email_verified_just_now') === 'true';
    } catch {
      return false;
    }
  });

  const handleDismissVerifiedToast = () => {
    setShowVerifiedToast(false);
    try {
      sessionStorage.removeItem('ersona_email_verified_just_now');
    } catch {}
  };

  // Preferensi Tampilan & Kustomisasi Teks
  const [preferences, setPreferences] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_preferences') || localStorage.getItem('solist_preferences');
      return saved ? JSON.parse(saved) : DEFAULT_PREFERENCES;
    } catch {
      return DEFAULT_PREFERENCES;
    }
  });

  const handleSavePreferences = (newPrefs) => {
    setPreferences(newPrefs);
    try {
      localStorage.setItem('ersona_preferences', JSON.stringify(newPrefs));
    } catch (e) {
      console.warn('Gagal menyimpan preferensi:', e);
    }
  };

  const handleResetPreferences = () => {
    setPreferences(DEFAULT_PREFERENCES);
    try {
      localStorage.removeItem('ersona_preferences');
      localStorage.removeItem('solist_preferences');
    } catch (e) {
      console.warn('Gagal mereset preferensi:', e);
    }
  };

  const currentLocale = isEn ? localeEn : localeId;

  // Labels dinamis yang selalu sinkron dengan bahasa aktif (ID/EN)
  const labels = {
    trashTab: t('dashboard.trashTab'),
    remindersTab: t('dashboard.remindersTab'),
    todosTab: t('dashboard.todosTab'),
    notesTab: t('dashboard.notesTab'),
    moveToTrash: t('dashboard.moveToTrash'),
    emptyTrash: t('dashboard.emptyTrashBtn'),
  };

  // State Pengaturan & Kuota Penyimpanan
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0);

  const currentWorkspace = workspaces.find(w => w.id === activeWorkspaceId) || null;

  // Kuota aktif: jika di dalam Team Workspace, ikuti Owner-Centric Workspace Pool
  // jika di personal, ikuti kuota pribadi user
  const quotaConfig = activeWorkspaceId 
    ? getWorkspaceQuotaConfig(currentWorkspace, user)
    : getUserQuotaConfig(user);

  const refreshStorageUsage = async () => {
    if (user?.id) {
      if (refreshUser) await refreshUser();
      const bytes = await calculateUserStorageUsage(supabase, user.id);
      setStorageUsage(bytes);
    }
  };

  const handleToggleProTier = async (enablePro) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { is_upgraded: enablePro, tier: enablePro ? 'pro' : 'free' }
      });
      if (error) throw error;
      await refreshStorageUsage();
    } catch (err) {
      alert('Gagal mengubah status tier: ' + err.message);
    }
  };

  const handleToggleEmailVerified = async (isVerified) => {
    try {
      const { error } = await supabase.auth.updateUser({
        data: { ersona_verified: isVerified }
      });
      if (error) throw error;
      await refreshStorageUsage();
    } catch (err) {
      alert('Gagal mengubah status verifikasi email: ' + err.message);
    }
  };

  // State Data
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'todos', 'notes', 'reminders', 'trash'
  const [searchQuery, setSearchQuery] = useState('');

  // Helper menghitung media catatan tanpa double counting
  const getNoteItems = (n) => {
    if (Array.isArray(n.media_items) && n.media_items.length > 0) {
      return n.media_items;
    }
    if (n.media_url) {
      return [{ url: n.media_url, type: n.media_type || 'image' }];
    }
    return [];
  };

  // Item yang dihitung untuk kuota:
  // - Jika berada di workspace tim (activeWorkspaceId != null): hanya hitung item dalam workspace tersebut
  // - Jika berada di personal (activeWorkspaceId == null): hanya hitung item personal (!workspace_id)
  const quotaTodos = activeWorkspaceId 
    ? todos.filter(t => t.workspace_id === activeWorkspaceId)
    : todos.filter(t => !t.workspace_id);

  const quotaNotes = activeWorkspaceId 
    ? notes.filter(n => n.workspace_id === activeWorkspaceId)
    : notes.filter(n => !n.workspace_id);

  const currentPhotoCount = (quotaTodos?.filter(t => t.media_url && t.media_type !== 'video' && !t.deleted_at).length || 0) +
    (quotaNotes?.filter(n => !n.deleted_at).reduce((acc, n) => {
      return acc + getNoteItems(n).filter(m => m?.type !== 'video').length;
    }, 0) || 0);

  const currentVideoCount = (quotaTodos?.filter(t => t.media_url && t.media_type === 'video' && !t.deleted_at).length || 0) +
    (quotaNotes?.filter(n => !n.deleted_at).reduce((acc, n) => {
      return acc + getNoteItems(n).filter(m => m?.type === 'video').length;
    }, 0) || 0);

  // Validasi Batas Kuota Media (Foto & Video) Sebelum Upload
  const validateMediaQuota = (mediaType = 'image', count = 1) => {
    const isWs = Boolean(activeWorkspaceId && currentWorkspace);

    if (mediaType === 'video') {
      const maxVideos = quotaConfig.maxVideos;
      if (maxVideos === 0) {
        alert(isEn
          ? (isWs 
              ? '🔒 Video upload is locked for this workspace.\nThe workspace owner needs to verify email or upgrade to Pro.' 
              : '🔒 Video upload is locked for unverified accounts.\nPlease verify your email in Settings to get 2 video slots, or upgrade to Pro for 5 videos.')
          : (isWs 
              ? '🔒 Fitur upload video terkunci untuk workspace ini.\nPemilik workspace perlu verifikasi email atau upgrade ke Ersona Pro.' 
              : '🔒 Fitur upload video terkunci untuk akun belum terverifikasi.\nSilakan verifikasi email Anda di Pengaturan untuk mendapatkan kuota 2 video, atau upgrade ke Ersona Pro untuk 5 video.'));
        return false;
      }
      if (currentVideoCount + count > maxVideos) {
        alert(isEn
          ? (isWs 
              ? `⚠️ Team Workspace video quota reached! (${currentVideoCount} of ${maxVideos} videos used).\nAsk workspace owner to upgrade to Pro or delete older videos.` 
              : `⚠️ Video quota reached! (${currentVideoCount} of ${maxVideos} videos used).\nUpgrade to Pro or delete older videos to upload more.`)
          : (isWs 
              ? `⚠️ Batas kuota video Ruang Kerja Tim tercapai! (${currentVideoCount} dari ${maxVideos} video terpakai).\nMinta pemilik ruang kerja untuk upgrade ke Ersona Pro atau hapus video lama.` 
              : `⚠️ Batas kuota video tercapai! (${currentVideoCount} dari ${maxVideos} video terpakai).\nUpgrade ke Ersona Pro atau hapus video lama untuk mengunggah.`));
        return false;
      }
      return true;
    }

    const maxPhotos = quotaConfig.maxPhotos;
    if (currentPhotoCount + count > maxPhotos) {
      alert(isEn
        ? (isWs
            ? `⚠️ Team Workspace photo quota reached! (${currentPhotoCount} of ${maxPhotos} photos used).\nAsk workspace owner to upgrade to Pro (up to 1,000 photos) or delete older photos.`
            : `⚠️ Photo quota reached! (${currentPhotoCount} of ${maxPhotos} photos used).\n${!quotaConfig.isEmailConfirmed ? 'Verify your email to get 150 photos, or upgrade to Pro for 1,000 photos.' : (!quotaConfig.isUpgraded ? 'Upgrade to Pro for up to 1,000 photos.' : 'Please delete older photos to free up slots.')}`)
        : (isWs
            ? `⚠️ Batas kuota foto Ruang Kerja Tim tercapai! (${currentPhotoCount} dari ${maxPhotos} foto terpakai).\nMinta pemilik ruang kerja untuk upgrade ke Ersona Pro (hingga 1.000 foto) atau hapus foto lama.`
            : `⚠️ Batas kuota foto tercapai! (${currentPhotoCount} dari ${maxPhotos} foto terpakai).\n${!quotaConfig.isEmailConfirmed ? 'Verifikasi email Anda di Pengaturan untuk mendapatkan kuota 150 foto, atau upgrade ke Pro untuk 1.000 foto.' : (!quotaConfig.isUpgraded ? 'Upgrade ke Ersona Pro untuk kuota hingga 1.000 foto.' : 'Hapus foto lama untuk menambah ruang.')}`));
      return false;
    }
    return true;
  };

  const validateStorageLimit = validateMediaQuota;

  // To-Do Sorting State
  const [todoSortBy, setTodoSortBy] = useState(preferences.defaultSort || 'created_desc');

  // Status Task Kustom & Mode Tampilan (Baris vs Kolom Board)
  const [taskStatuses, setTaskStatuses] = useState(() => {
    try {
      const saved = localStorage.getItem('ersona_task_statuses') || localStorage.getItem('solist_task_statuses');
      if (saved) {
        const parsed = JSON.parse(saved);
        const normalized = parsed.map(s => ({
          ...s,
          color: normalizeStatusColor(s.color)
        }));
        if (!normalized.some(s => s.id === 'completed')) {
          normalized.push({ 
            id: 'completed', 
            label: 'Complete', 
            color: 'bg-emerald-50 text-emerald-700 border-emerald-200 dark:bg-emerald-950/60 dark:text-emerald-300 dark:border-emerald-800/60', 
            isLocked: true 
          });
        }
        return normalized;
      }
      return DEFAULT_TASK_STATUSES;
    } catch {
      return DEFAULT_TASK_STATUSES;
    }
  });

  const saveTaskStatuses = (newStatuses) => {
    const normalized = newStatuses.map(s => ({
      ...s,
      color: normalizeStatusColor(s.color)
    }));
    setTaskStatuses(normalized);
    try {
      localStorage.setItem('ersona_task_statuses', JSON.stringify(normalized));
    } catch (e) {
      console.warn('Gagal menyimpan task statuses:', e);
    }
  };

  // Mengambil status ID yang valid untuk sebuah todo, auto-fallback jika status telah dihapus
  const getTaskStatusId = (todo) => {
    if (todo.is_completed) return 'completed';
    if (todo.status && taskStatuses.some(s => s.id === todo.status)) {
      return todo.status;
    }
    const fallback = taskStatuses.find(s => s.id !== 'completed') || taskStatuses[0];
    return fallback?.id || 'completed';
  };

  const getStatusObj = (statusId) => {
    const raw = taskStatuses.find(s => s.id === statusId) || 
      taskStatuses.find(s => s.id !== 'completed') || 
      taskStatuses[0] || 
      DEFAULT_TASK_STATUSES[0];
    return {
      ...raw,
      color: normalizeStatusColor(raw.color)
    };
  };

  const [taskViewMode, setTaskViewMode] = useState(() => {
    return localStorage.getItem('ersona_task_view_mode') || 'board'; // Default: 'board' (tabel/kolom)
  });

  const [isGroupedByStatus, setIsGroupedByStatus] = useState(() => {
    return (localStorage.getItem('ersona_grouped_by_status') || localStorage.getItem('solist_grouped_by_status')) === 'true';
  });

  const toggleViewMode = (mode) => {
    setTaskViewMode(mode);
    try {
      localStorage.setItem('ersona_task_view_mode', mode);
    } catch (e) {
      console.warn(e);
    }
  };

  const toggleGroupByStatus = () => {
    setIsGroupedByStatus(prev => {
      const next = !prev;
      try {
        localStorage.setItem('ersona_grouped_by_status', String(next));
      } catch (e) {
        console.warn(e);
      }
      return next;
    });
  };

  const [isStatusManagerOpen, setIsStatusManagerOpen] = useState(false);
  const [newStatusLabel, setNewStatusLabel] = useState('');
  const [newStatusColor, setNewStatusColor] = useState(STATUS_COLOR_OPTIONS[0].value);

  const handleAddCustomStatus = (e) => {
    e.preventDefault();
    const clean = newStatusLabel.trim();
    if (!clean) return;
    const newId = clean.toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + Date.now().toString(36).substring(4);
    
    const completedIndex = taskStatuses.findIndex(s => s.id === 'completed');
    const updated = [...taskStatuses];
    const newStatusObj = { id: newId, label: clean, color: normalizeStatusColor(newStatusColor) };
    if (completedIndex !== -1) {
      updated.splice(completedIndex, 0, newStatusObj);
    } else {
      updated.push(newStatusObj);
    }
    saveTaskStatuses(updated);
    setNewStatusLabel('');
  };

  const handleDeleteCustomStatus = (statusId) => {
    if (statusId === 'completed') {
      alert(isEn ? 'Status "Complete" is a required system status and cannot be deleted.' : 'Status "Complete" adalah status wajib dan tidak dapat dihapus.');
      return;
    }

    const remainingActive = taskStatuses.filter(s => s.id !== 'completed' && s.id !== statusId);
    if (remainingActive.length === 0) {
      alert(isEn ? 'Cannot delete this status. There must be at least one active status.' : 'Tidak dapat menghapus status ini. Minimal harus ada satu status aktif selain "Complete".');
      return;
    }

    const targetStatus = remainingActive[0];
    const statusToDelete = getStatusObj(statusId);

    if (!confirm(isEn ? `Delete status "${statusToDelete.label}"? All tasks with this status will be moved to "${targetStatus.label}".` : `Hapus status "${statusToDelete.label}"? Semua tugas dengan status ini akan otomatis dipindahkan ke status "${targetStatus.label}".`)) {
      return;
    }

    // Pindahkan tugas secara lokal di state
    setTodos(prev => prev.map(t => (t.status === statusId) ? { ...t, status: targetStatus.id } : t));

    // Pindahkan tugas di Supabase
    supabase.from('todos').update({ status: targetStatus.id, updated_at: new Date().toISOString() }).eq('status', statusId).then(({ error }) => {
      if (error) console.warn('Gagal memindahkan status tugas di Supabase:', error);
    });

    const updated = taskStatuses.filter(s => s.id !== statusId);
    saveTaskStatuses(updated);
  };

  const handleResetStatuses = () => {
    if (confirm(isEn ? 'Reset task statuses to default (To Do, In Progress, Review, Complete)?' : 'Kembalikan status task ke standar (To Do, In Progress, Review, Complete)?')) {
      saveTaskStatuses(DEFAULT_TASK_STATUSES);
    }
  };

  // Form State untuk Tambah Task Baru
  const [newTaskTitle, setNewTaskTitle] = useState('');
  const [newTaskDate, setNewTaskDate] = useState('');
  const [newTaskReminderDate, setNewTaskReminderDate] = useState('');
  const [newTaskDesc, setNewTaskDesc] = useState('');
  const [newTaskPriority, setNewTaskPriority] = useState(preferences.defaultPriority !== 'none' ? preferences.defaultPriority : 'medium');
  const [newTaskStatus, setNewTaskStatus] = useState('todo');
  const [showTodoAdvanced, setShowTodoAdvanced] = useState(false);
  const [isSubmittingTask, setIsSubmittingTask] = useState(false);

  // To-Do Task Media Attachment saat Buat Baru
  const [todoFile, setTodoFile] = useState(null);
  const [todoFilePreview, setTodoFilePreview] = useState(null);
  const [todoFileType, setTodoFileType] = useState(null);
  const [isCompressingTodoFile, setIsCompressingTodoFile] = useState(false);

  // MODAL EDIT TUGAS
  const [editingTodo, setEditingTodo] = useState(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');
  const [editDueDate, setEditDueDate] = useState('');
  const [editReminderDate, setEditReminderDate] = useState('');
  const [editPriority, setEditPriority] = useState('medium');
  const [editStatus, setEditStatus] = useState('todo');
  const [editMediaUrl, setEditMediaUrl] = useState(null);
  const [editMediaType, setEditMediaType] = useState(null);
  const [editFile, setEditFile] = useState(null);
  const [editFilePreview, setEditFilePreview] = useState(null);
  const [isCompressingEditFile, setIsCompressingEditFile] = useState(false);
  const [isUpdatingTodo, setIsUpdatingTodo] = useState(false);
  const [editSubtasks, setEditSubtasks] = useState([]);
  const [newSubtaskInput, setNewSubtaskInput] = useState('');

  // FORM STATE BUAT CATATAN BARU (MULTI-MEDIA: MAKS 5 FOTO & 1 VIDEO)
  const [showNoteModal, setShowNoteModal] = useState(false);
  const [newNoteTitle, setNewNoteTitle] = useState('');
  const [newNoteContent, setNewNoteContent] = useState('');
  const [newNoteEmoji, setNewNoteEmoji] = useState('💡');
  const [mediaMode, setMediaMode] = useState('upload'); 
  const [embedLinkInput, setEmbedLinkInput] = useState('');
  const [notePhotos, setNotePhotos] = useState([]); // Array of { file, preview, original, compressed, ratio }
  const [noteVideo, setNoteVideo] = useState(null);   // { file, preview }
  const [isCompressingNotePhotos, setIsCompressingNotePhotos] = useState(false);
  const [isSubmittingNote, setIsSubmittingNote] = useState(false);
  const [uploadError, setUploadError] = useState(null);

  // MODAL EDIT CATATAN (MULTI-MEDIA SUPPORT)
  const [editingNote, setEditingNote] = useState(null);
  const [editNoteTitle, setEditNoteTitle] = useState('');
  const [editNoteContent, setEditNoteContent] = useState('');
  const [editNoteEmoji, setEditNoteEmoji] = useState('📝');
  const [editExistingMedia, setEditExistingMedia] = useState([]); // Array of { url, type }
  const [editNewPhotos, setEditNewPhotos] = useState([]);         // Array of { file, preview }
  const [editNewVideo, setEditNewVideo] = useState(null);          // { file, preview }
  const [isCompressingEditPhotos, setIsCompressingEditPhotos] = useState(false);
  const [isUpdatingNote, setIsUpdatingNote] = useState(false);

  // Lightbox Modal State (Perbesar Foto & Video)
  const [lightboxMedia, setLightboxMedia] = useState(null);

  // Helper untuk menghapus file fisik di Cloudflare R2 / Supabase Storage secara aman
  const deleteStorageFilesByUrls = async (urls) => {
    if (!urls || urls.length === 0) return;
    for (const u of urls) {
      try {
        await deleteMediaByUrl(u, supabase);
      } catch (err) {
        console.warn('Gagal menghapus file dari storage:', err);
      }
    }
  };

  // 1. Fetch Data dari Supabase & Auto-Purge Sampah > 5 Hari (Termasuk File Storage)
  const fetchData = async () => {
    setLoading(true);
    try {
      const fiveDaysAgo = new Date(Date.now() - 5 * 24 * 60 * 60 * 1000).toISOString();

      // Cari media sampah yang akan terhapus permanen untuk dibersihkan dari Storage
      const [oldTodosRes, oldNotesRes] = await Promise.allSettled([
        supabase.from('todos').select('media_url').not('deleted_at', 'is', null).lt('deleted_at', fiveDaysAgo),
        supabase.from('notes').select('media_url, media_items').not('deleted_at', 'is', null).lt('deleted_at', fiveDaysAgo),
      ]);

      const purgeUrls = [];
      if (oldTodosRes.status === 'fulfilled' && oldTodosRes.value.data) {
        oldTodosRes.value.data.forEach(t => t.media_url && purgeUrls.push(t.media_url));
      }
      if (oldNotesRes.status === 'fulfilled' && oldNotesRes.value.data) {
        oldNotesRes.value.data.forEach(n => {
          if (n.media_url) purgeUrls.push(n.media_url);
          if (Array.isArray(n.media_items)) n.media_items.forEach(m => m?.url && purgeUrls.push(m.url));
        });
      }
      if (purgeUrls.length > 0) {
        await deleteStorageFilesByUrls(purgeUrls);
      }

      await Promise.allSettled([
        supabase.from('todos').delete().not('deleted_at', 'is', null).lt('deleted_at', fiveDaysAgo),
        supabase.from('notes').delete().not('deleted_at', 'is', null).lt('deleted_at', fiveDaysAgo),
      ]);

      const [todosRes, notesRes] = await Promise.all([
        supabase.from('todos').select('*').order('created_at', { ascending: false }),
        supabase.from('notes').select('*').order('created_at', { ascending: false }),
      ]);

      if (todosRes.error) throw todosRes.error;
      if (notesRes.error) throw notesRes.error;

      setTodos(todosRes.data || []);
      setNotes(notesRes.data || []);
      refreshStorageUsage();
    } catch (error) {
      console.error('Error fetching data:', error.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchWorkspaces = async () => {
    if (!user) return;
    try {
      let wsList = [];
      const { data, error } = await supabase
        .from('workspaces')
        .select('id, name, owner_id, invite_code, created_at, is_upgraded, tier, custom_photo_limit')
        .order('created_at', { ascending: true });

      if (!error && data) {
        wsList = data;
      } else {
        const fallbackRes = await supabase
          .from('workspaces')
          .select('id, name, owner_id, invite_code, created_at')
          .order('created_at', { ascending: true });
        if (!fallbackRes.error && fallbackRes.data) {
          wsList = fallbackRes.data;
        }
      }

      if (wsList.length > 0) {
        const isUserPro = Boolean(user.user_metadata?.is_upgraded || user.user_metadata?.tier === 'pro');
        const updatedList = wsList.map(w => {
          if (w.owner_id === user.id) {
            return { ...w, is_upgraded: isUserPro, tier: isUserPro ? 'pro' : 'free' };
          }
          return w;
        });

        // Background sync: update database record if owner is Pro
        if (isUserPro) {
          const ownedWs = wsList.filter(w => w.owner_id === user.id && !w.is_upgraded);
          for (const ow of ownedWs) {
            supabase.from('workspaces').update({ is_upgraded: true, tier: 'pro' }).eq('id', ow.id).then(() => {});
          }
        }

        setWorkspaces(updatedList);
        if (activeWorkspaceId && !updatedList.some(w => w.id === activeWorkspaceId)) {
          setActiveWorkspaceId(null);
          try { localStorage.removeItem('ersona_active_workspace_id'); } catch {}
        }
      } else {
        setWorkspaces([]);
      }
    } catch (err) {
      console.warn('Gagal memuat workspaces:', err);
    }
  };

  const fetchWorkspaceMembers = async (wsId) => {
    if (!wsId) {
      setWorkspaceMembers([]);
      return;
    }
    try {
      const { data, error } = await supabase
        .from('workspace_members')
        .select('id, user_id, user_email, role, joined_at')
        .eq('workspace_id', wsId)
        .order('joined_at', { ascending: true });
      if (!error && data) {
        setWorkspaceMembers(data);
      }
    } catch (err) {
      console.warn('Gagal memuat anggota workspace:', err);
    }
  };

  const handleSwitchWorkspace = (wsId) => {
    setActiveWorkspaceId(wsId);
    try {
      if (wsId) {
        localStorage.setItem('ersona_active_workspace_id', wsId);
      } else {
        localStorage.removeItem('ersona_active_workspace_id');
      }
    } catch {}
    setIsWorkspaceMenuOpen(false);
  };

  const handleCreateWorkspace = async (e) => {
    e?.preventDefault();
    if (!newWsName.trim()) return;

    const isUserPro = Boolean(user?.user_metadata?.is_upgraded || user?.user_metadata?.tier === 'pro');
    const maxOwnedWorkspaces = isUserPro ? 5 : 1;
    const ownedCount = workspaces.filter(w => w.owner_id === user?.id).length;

    if (ownedCount >= maxOwnedWorkspaces) {
      setWsError(isEn
        ? `Workspace limit reached (${ownedCount} of ${maxOwnedWorkspaces} workspaces created). ${!isUserPro ? 'Upgrade to Pro to create up to 5 workspaces.' : 'Maximum 5 workspaces reached.'}`
        : `Batas ruang kerja tercapai (${ownedCount} dari ${maxOwnedWorkspaces} ruang kerja dibuat). ${!isUserPro ? 'Upgrade ke Pro untuk membuat hingga 5 ruang kerja.' : 'Batas maksimal 5 ruang kerja.'}`);
      return;
    }

    setWsActionLoading(true);
    setWsError('');
    try {
      const inviteCode = Math.random().toString(36).substring(2, 10).toUpperCase();
      
      let wsData = null;
      const { data, error } = await supabase
        .from('workspaces')
        .insert({
          name: newWsName.trim(),
          owner_id: user.id,
          invite_code: inviteCode,
          is_upgraded: isUserPro,
          tier: isUserPro ? 'pro' : 'free',
          custom_photo_limit: null,
        })
        .select()
        .single();

      if (error) {
        // Fallback jika kolom is_upgraded belum dibuat di database
        const { data: fbData, error: fbError } = await supabase
          .from('workspaces')
          .insert({
            name: newWsName.trim(),
            owner_id: user.id,
            invite_code: inviteCode,
          })
          .select()
          .single();
        if (fbError) throw fbError;
        wsData = { ...fbData, is_upgraded: isUserPro, tier: isUserPro ? 'pro' : 'free', custom_photo_limit: null };
      } else {
        wsData = data;
      }

      await supabase.from('workspace_members').insert({
        workspace_id: wsData.id,
        user_id: user.id,
        user_email: user.email,
        role: 'owner',
      });

      setWorkspaces(prev => [...prev, wsData]);
      handleSwitchWorkspace(wsData.id);
      setNewWsName('');
      setIsCreateWsModalOpen(false);
    } catch (err) {
      setWsError(err.message || 'Gagal membuat ruang kerja');
    } finally {
      setWsActionLoading(false);
    }
  };

  const handleSaveWorkspacePhotoLimit = async (e) => {
    e?.preventDefault();
    if (!currentWorkspace || currentWorkspace.owner_id !== user.id) return;
    setIsSavingWsLimit(true);
    setWsLimitSaveMsg('');
    try {
      const trimmed = wsCustomPhotoLimit.trim();
      const parsed = trimmed === '' ? null : parseInt(trimmed, 10);
      const finalLimit = isNaN(parsed) || parsed <= 0 ? null : parsed;
      const { error } = await supabase
        .from('workspaces')
        .update({ custom_photo_limit: finalLimit, updated_at: new Date().toISOString() })
        .eq('id', currentWorkspace.id);
      if (error) throw error;
      setWorkspaces(prev => prev.map(w => w.id === currentWorkspace.id ? { ...w, custom_photo_limit: finalLimit } : w));
      setWsLimitSaveMsg(isEn ? 'Photo limit saved!' : 'Batas foto berhasil disimpan!');
      setTimeout(() => setWsLimitSaveMsg(''), 3000);
    } catch (err) {
      alert('Gagal menyimpan batas foto: ' + err.message);
    } finally {
      setIsSavingWsLimit(false);
    }
  };

  const handleJoinWorkspace = async (e) => {
    e?.preventDefault();
    if (!joinInviteCode.trim()) return;
    setWsActionLoading(true);
    setWsError('');
    try {
      const { data: rpcData, error: rpcErr } = await supabase
        .rpc('join_workspace_by_code', { code_input: joinInviteCode.trim() });

      if (!rpcErr && rpcData) {
        if (!rpcData.success) {
          throw new Error(rpcData.message);
        }
        await fetchWorkspaces();
        handleSwitchWorkspace(rpcData.workspace_id);
        setJoinInviteCode('');
        setIsJoinWsModalOpen(false);
        return;
      }

      const { data: wsData, error: wsErr } = await supabase
        .from('workspaces')
        .select('id, name, owner_id')
        .ilike('invite_code', joinInviteCode.trim())
        .single();
      if (wsErr || !wsData) throw new Error('Kode undangan tidak ditemukan');

      const { error: joinErr } = await supabase
        .from('workspace_members')
        .insert({
          workspace_id: wsData.id,
          user_id: user.id,
          user_email: user.email,
          role: 'member'
        });
      if (joinErr && !joinErr.message?.includes('duplicate')) throw joinErr;

      await fetchWorkspaces();
      handleSwitchWorkspace(wsData.id);
      setJoinInviteCode('');
      setIsJoinWsModalOpen(false);
    } catch (err) {
      setWsError(err.message || 'Gagal bergabung ke ruang kerja');
    } finally {
      setWsActionLoading(false);
    }
  };

  const handleLeaveWorkspace = async (wsId) => {
    if (!window.confirm(t('dashboard.confirmLeaveWorkspace'))) return;
    try {
      await supabase
        .from('workspace_members')
        .delete()
        .eq('workspace_id', wsId)
        .eq('user_id', user.id);
      handleSwitchWorkspace(null);
      fetchWorkspaces();
      setIsWsMembersModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  const handleDeleteWorkspace = async (wsId) => {
    if (!window.confirm(t('dashboard.confirmDeleteWorkspace'))) return;
    try {
      await supabase.from('workspaces').delete().eq('id', wsId);
      handleSwitchWorkspace(null);
      fetchWorkspaces();
      setIsWsMembersModalOpen(false);
    } catch (err) {
      alert(err.message);
    }
  };

  useEffect(() => {
    fetchData();
    fetchWorkspaces();
    refreshStorageUsage();

    // Cek query param ?join=... di URL untuk auto-open modal gabung
    const params = new URLSearchParams(window.location.search);
    const joinCode = params.get('join');
    if (joinCode) {
      setJoinInviteCode(joinCode.toUpperCase());
      setIsJoinWsModalOpen(true);
      window.history.replaceState(null, '', window.location.pathname);
    }

    // Setup Supabase Realtime channel untuk sinkronisasi tim multi-user secara langsung
    const channel = supabase
      .channel('ersona_workspace_realtime')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'todos' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setTodos(prev => prev.some(t => t.id === payload.new.id) ? prev : [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setTodos(prev => prev.map(t => t.id === payload.new.id ? payload.new : t));
        } else if (payload.eventType === 'DELETE') {
          setTodos(prev => prev.filter(t => t.id === payload.old.id));
        }
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'notes' }, (payload) => {
        if (payload.eventType === 'INSERT') {
          setNotes(prev => prev.some(n => n.id === payload.new.id) ? prev : [payload.new, ...prev]);
        } else if (payload.eventType === 'UPDATE') {
          setNotes(prev => prev.map(n => n.id === payload.new.id ? payload.new : n));
        } else if (payload.eventType === 'DELETE') {
          setNotes(prev => prev.filter(n => n.id === payload.old.id));
        }
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, []);

  useEffect(() => {
    if (activeWorkspaceId) {
      fetchWorkspaceMembers(activeWorkspaceId);
    }
  }, [activeWorkspaceId]);

  useEffect(() => {
    if (currentWorkspace) {
      setWsCustomPhotoLimit(currentWorkspace.custom_photo_limit ? String(currentWorkspace.custom_photo_limit) : '');
      setWsLimitSaveMsg('');
    }
  }, [currentWorkspace?.id, currentWorkspace?.custom_photo_limit]);

  // Auto-heal: Deteksi dan sinkronkan tugas yang memiliki status yatim (status yang sudah dihapus dari daftar status)
  useEffect(() => {
    if (loading || todos.length === 0 || taskStatuses.length === 0) return;

    const validStatusIds = new Set(taskStatuses.map(s => s.id));
    const fallbackStatusId = taskStatuses.find(s => s.id !== 'completed')?.id || taskStatuses[0]?.id || 'completed';

    const orphaned = todos.filter(t => !t.is_completed && t.status && !validStatusIds.has(t.status));

    if (orphaned.length > 0) {
      setTodos(prev => prev.map(t => {
        if (!t.is_completed && t.status && !validStatusIds.has(t.status)) {
          return { ...t, status: fallbackStatusId };
        }
        return t;
      }));

      const orphanedIds = orphaned.map(t => t.id);
      supabase
        .from('todos')
        .update({ status: fallbackStatusId, updated_at: new Date().toISOString() })
        .in('id', orphanedIds)
        .then(({ error }) => {
          if (error) console.warn('Gagal migrasi tugas berstatus yatim di Supabase:', error);
        });
    }
  }, [loading, taskStatuses]);

  // Push Notification: Start reminder checker when todos are loaded
  const [isNotifActive, setIsNotifActive] = useState(() => isNotificationSupported() && isNotificationEnabled() && getNotificationPermission() === 'granted');
  const todosRef = useRef(todos);
  todosRef.current = todos;
  const isEnRef = useRef(isEn);
  isEnRef.current = isEn;

  useEffect(() => {
    if (loading || !isNotifActive) return;
    
    startReminderChecker(
      () => todosRef.current,
      () => isEnRef.current
    );

    return () => stopReminderChecker();
  }, [loading, isNotifActive]);

  // Filter Data berdasarkan Workspace Aktif (Personal jika activeWorkspaceId null, atau Workspace Tim)
  const scopedTodos = activeWorkspaceId 
    ? todos.filter(t => t.workspace_id === activeWorkspaceId)
    : todos.filter(t => !t.workspace_id);

  const scopedNotes = activeWorkspaceId 
    ? notes.filter(n => n.workspace_id === activeWorkspaceId)
    : notes.filter(n => !n.workspace_id);

  // Filter Data Aktif vs Sampah
  const activeTodos = scopedTodos.filter(t => !t.deleted_at);
  const activeNotes = scopedNotes.filter(n => !n.deleted_at);
  const trashTodos = scopedTodos.filter(t => Boolean(t.deleted_at));
  const trashNotes = scopedNotes.filter(n => Boolean(n.deleted_at));
  const totalTrashCount = trashTodos.length + trashNotes.length;

  // Helper untuk membaca daftar media catatan (kompatibel dengan schema lama & baru)
  const getNoteMediaItems = (note) => {
    if (Array.isArray(note.media_items) && note.media_items.length > 0) {
      return note.media_items;
    }
    if (note.media_url) {
      return [{ url: note.media_url, type: note.media_type || 'image' }];
    }
    return [];
  };

  // 2. Handlers File To-Do
  const handleTodoFileChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const isImg = rawFile.type.startsWith('image/');
    if (!validateMediaQuota(isImg ? 'image' : 'video', 1)) {
      clearTodoFile();
      return;
    }

    if (isImg) {
      setIsCompressingTodoFile(true);
      try {
        const res = await compressImage(rawFile, { maxWidth: 1400, quality: 0.8 });
        const finalFile = res.file || rawFile;
        setTodoFile(finalFile);
        setTodoFileType('image');
        setTodoFilePreview(URL.createObjectURL(finalFile));
      } catch {
        setTodoFile(rawFile);
        setTodoFileType('image');
        setTodoFilePreview(URL.createObjectURL(rawFile));
      } finally {
        setIsCompressingTodoFile(false);
      }
    } else {
      if (rawFile.size > 15 * 1024 * 1024) {
        alert(isEn 
          ? '⚠️ Maximum file size for video or attachment (PDF/file) is 15 MB.' 
          : '⚠️ Ukuran maksimal untuk file video atau lampiran (PDF/berkas) adalah 15 MB.');
        clearTodoFile();
        return;
      }
      setTodoFile(rawFile);
      setTodoFileType(rawFile.type.startsWith('video/') ? 'video' : 'file');
      setTodoFilePreview(URL.createObjectURL(rawFile));
    }
  };

  const clearTodoFile = () => {
    setTodoFile(null);
    setTodoFilePreview(null);
    setTodoFileType(null);
    if (todoFileInputRef.current) todoFileInputRef.current.value = '';
  };

  const handleEditTodoFileChange = async (e) => {
    const rawFile = e.target.files?.[0];
    if (!rawFile) return;

    const isImg = rawFile.type.startsWith('image/');
    if (!validateMediaQuota(isImg ? 'image' : 'video', 1)) {
      setEditFile(null);
      setEditFilePreview(null);
      if (editTodoFileInputRef.current) editTodoFileInputRef.current.value = '';
      return;
    }

    if (isImg) {
      setIsCompressingEditFile(true);
      try {
        const res = await compressImage(rawFile, { maxWidth: 1400, quality: 0.8 });
        const finalFile = res.file || rawFile;
        setEditFile(finalFile);
        setEditFilePreview(URL.createObjectURL(finalFile));
      } catch {
        setEditFile(rawFile);
        setEditFilePreview(URL.createObjectURL(rawFile));
      } finally {
        setIsCompressingEditFile(false);
      }
    } else {
      if (rawFile.size > 15 * 1024 * 1024) {
        alert(isEn 
          ? '⚠️ Maximum file size for video or attachment (PDF/file) is 15 MB.' 
          : '⚠️ Ukuran maksimal untuk file video atau lampiran (PDF/berkas) adalah 15 MB.');
        setEditFile(null);
        if (editTodoFileInputRef.current) editTodoFileInputRef.current.value = '';
        return;
      }
      setEditFile(rawFile);
      setEditFilePreview(URL.createObjectURL(rawFile));
    }
  };

  // 3. Handlers Edit & Tambah To-Do
  const openEditTodoModal = (todo) => {
    setEditingTodo(todo);
    setEditTitle(todo.title || '');
    setEditDesc(todo.description || '');
    setEditDueDate(todo.due_date ? todo.due_date.substring(0, 10) : '');
    setEditReminderDate(todo.reminder_date ? todo.reminder_date.substring(0, 10) : '');
    setEditPriority(todo.priority || 'medium');
    setEditStatus(getTaskStatusId(todo));
    setEditMediaUrl(todo.media_url || null);
    setEditMediaType(todo.media_type || null);
    setEditFile(null);
    setEditFilePreview(null);
    setEditSubtasks(Array.isArray(todo.subtasks) ? todo.subtasks : []);
    setNewSubtaskInput('');
  };

  const handleAddEditSubtask = (e) => {
    e?.preventDefault();
    const cleanText = newSubtaskInput.trim();
    if (!cleanText) return;
    const newSt = {
      id: 'st_' + Date.now().toString(36) + '_' + Math.random().toString(36).substring(2, 6),
      title: cleanText,
      completed: false,
    };
    setEditSubtasks(prev => [...prev, newSt]);
    setNewSubtaskInput('');
  };

  const handleToggleEditSubtask = (subtaskId) => {
    setEditSubtasks(prev => prev.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st));
  };

  const handleDeleteEditSubtask = (subtaskId) => {
    setEditSubtasks(prev => prev.filter(st => st.id !== subtaskId));
  };

  const handleToggleSubtaskInList = async (todoId, subtaskId, e) => {
    e?.stopPropagation();
    const targetTodo = todos.find(t => t.id === todoId);
    if (!targetTodo) return;
    const currentSubtasks = Array.isArray(targetTodo.subtasks) ? targetTodo.subtasks : [];
    const updatedSubtasks = currentSubtasks.map(st => st.id === subtaskId ? { ...st, completed: !st.completed } : st);

    setTodos(prev => prev.map(t => t.id === todoId ? { ...t, subtasks: updatedSubtasks } : t));

    try {
      await supabase.from('todos').update({ subtasks: updatedSubtasks, updated_at: new Date().toISOString() }).eq('id', todoId);
    } catch (err) {
      console.warn('Gagal sinkronisasi subtask:', err);
    }
  };

  const handleUpdateTodo = async (e) => {
    e.preventDefault();
    if (!editingTodo) return;
    const cleanTitle = editTitle.trim();
    if (!cleanTitle) return;

    setIsUpdatingTodo(true);
    let finalMediaUrl = editMediaUrl;
    let finalMediaType = editMediaType;

    if (editFile) {
      try {
        const fileExt = editFile.name.split('.').pop();
        const safeName = `${user.id}/todos-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('attachments')
          .upload(safeName, editFile);

        if (!uploadErr && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(uploadData.path);
          finalMediaUrl = publicUrl;
          finalMediaType = editFile.type.startsWith('video/') ? 'video' : 'image';
        }
      } catch (err) {
        console.warn('Gagal upload lampiran:', err);
      }
    }

    const isCompleted = editStatus === 'completed';
    const updates = {
      title: cleanTitle,
      description: editDesc.trim() || null,
      due_date: editDueDate ? new Date(editDueDate).toISOString() : null,
      reminder_date: editReminderDate ? new Date(editReminderDate).toISOString() : null,
      priority: editPriority,
      status: editStatus,
      is_completed: isCompleted,
      media_url: finalMediaUrl,
      media_type: finalMediaType,
      subtasks: editSubtasks,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('todos')
      .update(updates)
      .eq('id', editingTodo.id)
      .select();

    setIsUpdatingTodo(false);

    if (!error && data) {
      if (editingTodo.media_url && editingTodo.media_url !== finalMediaUrl) {
        deleteStorageFilesByUrls([editingTodo.media_url]);
      }
      refreshStorageUsage();
      setTodos(todos.map(t => t.id === editingTodo.id ? data[0] : t));
      setEditingTodo(null);
    } else {
      alert('Gagal memperbarui tugas: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleAddTodo = async (e) => {
    e.preventDefault();
    const cleanTitle = newTaskTitle.trim();
    if (!cleanTitle) return;

    setIsSubmittingTask(true);
    let uploadedMediaUrl = null;
    let uploadedMediaType = null;

    if (todoFile) {
      try {
        const fileExt = todoFile.name.split('.').pop();
        const safeName = `${user.id}/todos-${Date.now()}.${fileExt}`;
        const { data: uploadData, error: uploadErr } = await supabase.storage
          .from('attachments')
          .upload(safeName, todoFile);

        if (!uploadErr && uploadData) {
          const { data: { publicUrl } } = supabase.storage
            .from('attachments')
            .getPublicUrl(uploadData.path);
          uploadedMediaUrl = publicUrl;
          uploadedMediaType = todoFileType;
        }
      } catch (err) {
        console.warn('Gagal upload lampiran tugas:', err);
      }
    }

    const initialStatus = taskStatuses.find(s => s.id !== 'completed')?.id || taskStatuses[0]?.id || 'todo';
    const payload = {
      title: cleanTitle,
      description: newTaskDesc.trim() || null,
      due_date: newTaskDate ? new Date(newTaskDate).toISOString() : null,
      reminder_date: newTaskReminderDate ? new Date(newTaskReminderDate).toISOString() : null,
      priority: newTaskPriority,
      status: initialStatus,
      is_completed: false,
      media_url: uploadedMediaUrl,
      media_type: uploadedMediaType,
      subtasks: [],
      workspace_id: activeWorkspaceId || null,
    };

    const { data, error } = await supabase.from('todos').insert([payload]).select();
    setIsSubmittingTask(false);

    if (!error && data) {
      if (uploadedMediaUrl) refreshStorageUsage();
      setTodos([data[0], ...todos]);
      setNewTaskTitle('');
      setNewTaskDate('');
      setNewTaskReminderDate('');
      setNewTaskDesc('');
      setNewTaskPriority(preferences.defaultPriority !== 'none' ? preferences.defaultPriority : 'medium');
      setNewTaskStatus(initialStatus);
      clearTodoFile();
      setShowTodoAdvanced(false);
    } else {
      alert('Gagal menambah tugas: ' + (error?.message || 'Unknown error'));
    }
  };

  const handleToggleTodo = async (id, currentStatus) => {
    const newCompleted = !currentStatus;
    const defaultActiveStatus = taskStatuses.find(s => s.id !== 'completed')?.id || taskStatuses[0]?.id || 'todo';
    const newStatus = newCompleted ? 'completed' : defaultActiveStatus;
    setTodos(todos.map(t => t.id === id ? { ...t, is_completed: newCompleted, status: newStatus } : t));
    const { error } = await supabase
      .from('todos')
      .update({ is_completed: newCompleted, status: newStatus, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating todo:', error);
      fetchData();
    }
  };

  const handleUpdateTaskStatus = async (id, newStatus) => {
    const isComp = newStatus === 'completed';
    setTodos(todos.map(t => t.id === id ? { ...t, status: newStatus, is_completed: isComp } : t));
    const { error } = await supabase
      .from('todos')
      .update({ status: newStatus, is_completed: isComp, updated_at: new Date().toISOString() })
      .eq('id', id);

    if (error) {
      console.error('Error updating status:', error);
      fetchData();
    }
  };

  // 4. SOFT DELETE HANDLERS (Pindahkan ke Sampah)
  const handleSoftDeleteTodo = async (id) => {
    const now = new Date().toISOString();
    setTodos(todos.map(t => t.id === id ? { ...t, deleted_at: now } : t));
    if (editingTodo?.id === id) setEditingTodo(null);

    const { error } = await supabase
      .from('todos')
      .update({ deleted_at: now })
      .eq('id', id);

    if (error) {
      alert('Gagal memindahkan tugas ke sampah');
      fetchData();
    }
  };

  const handleSoftDeleteNote = async (id) => {
    const now = new Date().toISOString();
    setNotes(notes.map(n => n.id === id ? { ...n, deleted_at: now } : n));
    if (editingNote?.id === id) setEditingNote(null);

    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: now })
      .eq('id', id);

    if (error) {
      alert('Gagal memindahkan catatan ke sampah');
      fetchData();
    }
  };

  // 5. RESTORE HANDLERS (Pulihkan dari Sampah)
  const handleRestoreTodo = async (id) => {
    setTodos(todos.map(t => t.id === id ? { ...t, deleted_at: null } : t));
    const { error } = await supabase
      .from('todos')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) fetchData();
  };

  const handleRestoreNote = async (id) => {
    setNotes(notes.map(n => n.id === id ? { ...n, deleted_at: null } : n));
    const { error } = await supabase
      .from('notes')
      .update({ deleted_at: null })
      .eq('id', id);

    if (error) fetchData();
  };

  // 6. PERMANENT DELETE HANDLERS
  const handlePermanentDeleteTodo = async (id, mediaUrl) => {
    if (!confirm('Hapus tugas ini secara permanen?')) return;
    setTodos(todos.filter(t => t.id !== id));

    if (mediaUrl) {
      await deleteStorageFilesByUrls([mediaUrl]);
    }

    const { error } = await supabase.from('todos').delete().eq('id', id);
    if (error) {
      fetchData();
    } else {
      refreshStorageUsage();
    }
  };

  const handlePermanentDeleteNote = async (note) => {
    if (!confirm('Hapus catatan ini secara permanen?')) return;
    setNotes(notes.filter(n => n.id !== note.id));

    // Hapus semua media files catatan dari storage
    const items = getNoteMediaItems(note);
    const urls = items.map(m => m.url).filter(Boolean);
    if (urls.length > 0) {
      await deleteStorageFilesByUrls(urls);
    }

    const { error } = await supabase.from('notes').delete().eq('id', note.id);
    if (error) {
      fetchData();
    } else {
      refreshStorageUsage();
    }
  };

  // 7. EMPTY TRASH
  const handleEmptyTrash = async () => {
    if (totalTrashCount === 0) return;
    if (!confirm(`Hapus permanen ${totalTrashCount} item di Tempat Sampah? Tindakan ini TIDAK DAPAT DIBATALKAN.`)) return;

    setLoading(true);
    try {
      // 1. Kumpulkan semua URL file media di tempat sampah untuk dibersihkan dari Storage
      const trashUrls = [];
      trashTodos.forEach(t => {
        if (t.media_url) trashUrls.push(t.media_url);
      });
      trashNotes.forEach(n => {
        const items = getNoteMediaItems(n);
        items.forEach(m => {
          if (m?.url) trashUrls.push(m.url);
        });
      });

      if (trashUrls.length > 0) {
        await deleteStorageFilesByUrls(trashUrls);
      }

      // 2. Hapus data baris dari database
      await Promise.all([
        supabase.from('todos').delete().not('deleted_at', 'is', null),
        supabase.from('notes').delete().not('deleted_at', 'is', null),
      ]);
      setTodos(todos.filter(t => !t.deleted_at));
      setNotes(notes.filter(n => !n.deleted_at));
      refreshStorageUsage();
    } catch (err) {
      alert('Gagal mengosongkan sampah: ' + err.message);
    } finally {
      setLoading(false);
    }
  };

  // 8. HANDLERS MULTI-MEDIA UNTUK CATATAN BARU (MAKS 5 FOTO & 1 VIDEO)
  const handleNotePhotosSelect = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    setUploadError(null);
    if (rawFiles.length === 0) return;

    // Batasan maksimal 5 foto
    const remainingSlots = 5 - notePhotos.length;
    if (remainingSlots <= 0) {
      setUploadError('Maksimal 5 foto per catatan telah tercapai.');
      return;
    }

    const filesToProcess = rawFiles.slice(0, remainingSlots);
    if (!validateMediaQuota('image', filesToProcess.length)) {
      if (notePhotoInputRef.current) notePhotoInputRef.current.value = '';
      return;
    }

    if (rawFiles.length > remainingSlots) {
      setUploadError(`Hanya ${remainingSlots} foto yang ditambahkan (batas maksimal 5 foto).`);
    }

    setIsCompressingNotePhotos(true);
    try {
      const processed = await Promise.all(
        filesToProcess.map(async (f) => {
          if (!f.type.startsWith('image/')) return null;
          try {
            const res = await compressImage(f, { maxWidth: 1600, quality: 0.8 });
            const finalFile = res.file || f;
            return {
              file: finalFile,
              preview: URL.createObjectURL(finalFile),
              original: (res.originalSize ? res.originalSize / (1024 * 1024) : f.size / (1024 * 1024)).toFixed(2),
              compressed: (res.compressedSize ? res.compressedSize / 1024 : finalFile.size / 1024).toFixed(0),
              ratio: res.ratio || 0,
            };
          } catch {
            return {
              file: f,
              preview: URL.createObjectURL(f),
              original: (f.size / (1024 * 1024)).toFixed(2),
              compressed: (f.size / 1024).toFixed(0),
              ratio: 0,
            };
          }
        })
      );
      setNotePhotos([...notePhotos, ...processed.filter(Boolean)]);
    } finally {
      setIsCompressingNotePhotos(false);
      if (notePhotoInputRef.current) notePhotoInputRef.current.value = '';
    }
  };

  const removeNotePhoto = (index) => {
    setNotePhotos(notePhotos.filter((_, i) => i !== index));
  };

  const handleNoteVideoSelect = (e) => {
    const file = e.target.files?.[0];
    setUploadError(null);
    if (!file) return;

    if (!file.type.startsWith('video/')) {
      setUploadError('Hanya file video (MP4, WebM) yang diperbolehkan.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      setUploadError(isEn ? 'Maximum video size is 15 MB.' : 'Ukuran video maksimal 15 MB.');
      return;
    }

    if (!validateMediaQuota('video', 1)) {
      if (noteVideoInputRef.current) noteVideoInputRef.current.value = '';
      return;
    }

    setNoteVideo({
      file,
      preview: URL.createObjectURL(file),
      name: file.name,
      size: (file.size / (1024 * 1024)).toFixed(2),
    });
    if (noteVideoInputRef.current) noteVideoInputRef.current.value = '';
  };

  const removeNoteVideo = () => {
    setNoteVideo(null);
    if (noteVideoInputRef.current) noteVideoInputRef.current.value = '';
  };

  const clearNoteCreateModal = () => {
    setNewNoteTitle('');
    setNewNoteContent('');
    setNewNoteEmoji('💡');
    setNotePhotos([]);
    setNoteVideo(null);
    setEmbedLinkInput('');
    setUploadError(null);
    setShowNoteModal(false);
  };

  const handleAddNote = async (e) => {
    e.preventDefault();
    const cleanTitle = newNoteTitle.trim();
    if (!cleanTitle) return;

    setIsSubmittingNote(true);
    const mediaItems = [];

    // Jika mode embed
    if (mediaMode === 'embed' && embedLinkInput.trim()) {
      const parsed = parseMediaUrl(embedLinkInput.trim());
      if (parsed) {
        mediaItems.push({ url: parsed.embedUrl, type: parsed.type });
      }
    }

    // Upload semua foto jika ada
    if (notePhotos.length > 0) {
      try {
        const uploadPromises = notePhotos.map(async (item) => {
          const res = await uploadMediaToR2OrSupabase({ file: item.file, userId: user.id, supabase });
          return { url: res.url, type: 'image' };
        });
        const uploadedImages = await Promise.all(uploadPromises);
        mediaItems.push(...uploadedImages);
      } catch (err) {
        alert('Gagal mengunggah foto: ' + err.message);
        setIsSubmittingNote(false);
        return;
      }
    }

    // Upload video jika ada
    if (noteVideo) {
      try {
        const res = await uploadMediaToR2OrSupabase({ file: noteVideo.file, userId: user.id, supabase });
        mediaItems.push({ url: res.url, type: 'video' });
      } catch (err) {
        alert('Gagal mengunggah video: ' + err.message);
        setIsSubmittingNote(false);
        return;
      }
    }

    const payload = {
      title: cleanTitle,
      content: newNoteContent.trim(),
      icon_emoji: newNoteEmoji || '📝',
      media_items: mediaItems,
      media_url: mediaItems[0]?.url || null,
      media_type: mediaItems[0]?.type || null,
      workspace_id: activeWorkspaceId || null,
    };

    const { data, error } = await supabase.from('notes').insert([payload]).select();
    setIsSubmittingNote(false);

    if (!error && data) {
      if (mediaItems.length > 0) refreshStorageUsage();
      setNotes([data[0], ...notes]);
      clearNoteCreateModal();
    } else {
      alert('Gagal membuat catatan: ' + (error?.message || 'Unknown error'));
    }
  };

  // 9. HANDLERS MULTI-MEDIA SAAT EDIT CATATAN
  const openEditNoteModal = (note) => {
    setEditingNote(note);
    setEditNoteTitle(note.title || '');
    setEditNoteContent(note.content || '');
    setEditNoteEmoji(note.icon_emoji || '📝');
    setEditExistingMedia(getNoteMediaItems(note));
    setEditNewPhotos([]);
    setEditNewVideo(null);
  };

  const removeEditExistingMedia = (index) => {
    setEditExistingMedia(editExistingMedia.filter((_, i) => i !== index));
  };

  const handleEditNotePhotosSelect = async (e) => {
    const rawFiles = Array.from(e.target.files || []);
    if (rawFiles.length === 0) return;

    const currentImageCount = editExistingMedia.filter(m => m.type === 'image').length + editNewPhotos.length;
    const remainingSlots = 5 - currentImageCount;
    if (remainingSlots <= 0) {
      alert('Maksimal 5 foto per catatan.');
      return;
    }

    const filesToProcess = rawFiles.slice(0, remainingSlots);
    if (!validateMediaQuota('image', filesToProcess.length)) {
      if (editNotePhotoInputRef.current) editNotePhotoInputRef.current.value = '';
      return;
    }

    setIsCompressingEditPhotos(true);
    try {
      const processed = await Promise.all(
        filesToProcess.map(async (f) => {
          if (!f.type.startsWith('image/')) return null;
          try {
            const res = await compressImage(f, { maxWidth: 1600, quality: 0.8 });
            const finalFile = res.file || f;
            return { file: finalFile, preview: URL.createObjectURL(finalFile) };
          } catch {
            return { file: f, preview: URL.createObjectURL(f) };
          }
        })
      );
      setEditNewPhotos([...editNewPhotos, ...processed.filter(Boolean)]);
    } finally {
      setIsCompressingEditPhotos(false);
      if (editNotePhotoInputRef.current) editNotePhotoInputRef.current.value = '';
    }
  };

  const handleEditNoteVideoSelect = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const hasVideoAlready = editExistingMedia.some(m => m.type === 'video') || Boolean(editNewVideo);
    if (hasVideoAlready) {
      alert('Catatan hanya boleh memiliki maksimal 1 video.');
      return;
    }
    if (file.size > 15 * 1024 * 1024) {
      alert(isEn ? 'Maximum video size is 15 MB.' : 'Ukuran video maksimal 15 MB.');
      return;
    }

    if (!validateMediaQuota('video', 1)) {
      if (editNoteVideoInputRef.current) editNoteVideoInputRef.current.value = '';
      return;
    }

    setEditNewVideo({ file, preview: URL.createObjectURL(file), name: file.name });
    if (editNoteVideoInputRef.current) editNoteVideoInputRef.current.value = '';
  };

  const handleUpdateNote = async (e) => {
    e.preventDefault();
    if (!editingNote) return;
    const cleanTitle = editNoteTitle.trim();
    if (!cleanTitle) return;

    setIsUpdatingNote(true);
    const finalMediaItems = [...editExistingMedia];

    // Upload foto baru
    if (editNewPhotos.length > 0) {
      try {
        const uploadPromises = editNewPhotos.map(async (item) => {
          const res = await uploadMediaToR2OrSupabase({ file: item.file, userId: user.id, supabase });
          return { url: res.url, type: 'image' };
        });
        const uploadedImages = await Promise.all(uploadPromises);
        finalMediaItems.push(...uploadedImages);
      } catch (err) {
        alert('Gagal mengunggah foto baru: ' + err.message);
        setIsUpdatingNote(false);
        return;
      }
    }

    // Upload video baru jika ada
    if (editNewVideo) {
      try {
        const res = await uploadMediaToR2OrSupabase({ file: editNewVideo.file, userId: user.id, supabase });
        finalMediaItems.push({ url: res.url, type: 'video' });
      } catch (err) {
        alert('Gagal mengunggah video baru: ' + err.message);
        setIsUpdatingNote(false);
        return;
      }
    }

    const updates = {
      title: cleanTitle,
      content: editNoteContent.trim() || null,
      icon_emoji: editNoteEmoji || '📝',
      media_items: finalMediaItems,
      media_url: finalMediaItems[0]?.url || null,
      media_type: finalMediaItems[0]?.type || null,
      updated_at: new Date().toISOString(),
    };

    const { data, error } = await supabase
      .from('notes')
      .update(updates)
      .eq('id', editingNote.id)
      .select();

    setIsUpdatingNote(false);

    if (!error && data) {
      // Hapus media lama yang di-remove oleh user selama sesi edit catatan
      const originalItems = getNoteMediaItems(editingNote);
      const removedUrls = originalItems
        .map(m => m.url)
        .filter(url => url && !finalMediaItems.some(f => f.url === url));
      if (removedUrls.length > 0) {
        deleteStorageFilesByUrls(removedUrls);
      }
      refreshStorageUsage();

      setNotes(notes.map(n => n.id === editingNote.id ? data[0] : n));
      setEditingNote(null);
    } else {
      alert('Gagal memperbarui catatan: ' + (error?.message || 'Unknown error'));
    }
  };

  // 10. Helpers & Sorting
  const isReminderActive = (todo) => {
    if (!todo.reminder_date || todo.is_completed || todo.deleted_at) return false;
    try {
      const remDate = parseISO(todo.reminder_date);
      return isPast(remDate) || isToday(remDate);
    } catch {
      return false;
    }
  };

  const activeReminders = activeTodos.filter(isReminderActive);

  const renderDateBadge = (dateString) => {
    if (!dateString) return null;
    try {
      const date = parseISO(dateString);
      const past = isPast(date) && !isToday(date);
      const today = isToday(date);

      return (
        <span className={`inline-flex items-center space-x-1 text-xs px-2 py-0.5 rounded-md ${
          past ? 'bg-red-50 dark:bg-red-950/40 text-red-600 dark:text-red-400 border border-red-200 dark:border-red-900/60' :
          today ? 'bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-800/60' :
          'bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'
        }`}>
          <Calendar className="w-3 h-3" />
          <span>{format(date, 'dd MMM yyyy', { locale: currentLocale })}</span>
        </span>
      );
    } catch {
      return null;
    }
  };

  const renderPriorityBadge = (priority) => {
    if (priority === 'urgent') {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-red-100 dark:bg-red-950/50 text-red-700 dark:text-red-300 border border-red-300 dark:border-red-800 font-bold shadow-2xs">
          <Flame className="w-3 h-3 text-red-600 dark:text-red-400 fill-red-500 animate-pulse" />
          <span>{t('dashboard.priorityUrgent').replace('🔥 ', '')}</span>
        </span>
      );
    }
    if (priority === 'high') {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-rose-50 dark:bg-rose-950/40 text-rose-700 dark:text-rose-300 border border-rose-200 dark:border-rose-900/60 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-rose-500"></span>
          <span>{t('dashboard.priorityHigh').replace('🔴 ', '')}</span>
        </span>
      );
    }
    if (priority === 'low') {
      return (
        <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 border border-blue-200 dark:border-blue-900/60 font-medium">
          <span className="w-1.5 h-1.5 rounded-full bg-blue-500"></span>
          <span>{t('dashboard.priorityLow').replace('🔵 ', '')}</span>
        </span>
      );
    }
    return (
      <span className="inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-full bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300 border border-amber-200 dark:border-amber-900/60 font-medium">
        <span className="w-1.5 h-1.5 rounded-full bg-amber-500"></span>
        <span>{t('dashboard.priorityMedium').replace('🟡 ', '')}</span>
      </span>
    );
  };

  const renderStatusBadge = (todo) => {
    const currentStatusId = getTaskStatusId(todo);
    const statusObj = getStatusObj(currentStatusId);

    return (
      <div className="relative inline-flex items-center" onClick={(e) => e.stopPropagation()}>
        <select
          value={currentStatusId}
          onChange={(e) => handleUpdateTaskStatus(todo.id, e.target.value)}
          className={`cursor-pointer text-[11px] font-medium px-2.5 py-0.5 rounded-full border transition hover:opacity-85 focus:outline-none ${statusObj.color}`}
          title={t('dashboard.statusLabel')}
        >
          {taskStatuses.map((s) => (
            <option key={s.id} value={s.id} className="bg-white dark:bg-[#202020] text-neutral-800 dark:text-neutral-200 font-normal">
              {s.label}
            </option>
          ))}
        </select>
      </div>
    );
  };

  const getSortedTodos = (list) => {
    return [...list].sort((a, b) => {
      if (todoSortBy === 'created_desc') return new Date(b.created_at) - new Date(a.created_at);
      if (todoSortBy === 'created_asc') return new Date(a.created_at) - new Date(b.created_at);
      if (todoSortBy === 'due_date_asc') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(a.due_date) - new Date(b.due_date);
      }
      if (todoSortBy === 'due_date_desc') {
        if (!a.due_date) return 1;
        if (!b.due_date) return -1;
        return new Date(b.due_date) - new Date(a.due_date);
      }
      if (todoSortBy === 'priority_desc') {
        const order = { urgent: 4, high: 3, medium: 2, low: 1, none: 0 };
        return (order[b.priority] ?? 2) - (order[a.priority] ?? 2);
      }
      return 0;
    });
  };

  const renderTaskRow = (todo, hideStatus = false) => {
    const reminderActive = isReminderActive(todo);
    return (
      <div
        key={todo.id}
        className={`group flex flex-col ${preferences.viewDensity === 'compact' ? 'p-2' : 'p-2.5 sm:p-3'} bg-white dark:bg-[#232323] border rounded-xl hover:shadow-2xs transition ${
          reminderActive 
            ? 'border-amber-300/80 dark:border-amber-700/80 bg-amber-50/20 dark:bg-amber-950/20' 
            : 'border-neutral-200/80 dark:border-neutral-800 hover:border-neutral-300 dark:hover:border-neutral-700'
        }`}
      >
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 sm:gap-3">
          {/* Sisi Kiri / Atas: Checkbox + Status Badge + Judul Tugas */}
          <div className="flex items-center space-x-2.5 flex-1 min-w-0">
            <button
              onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
              className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer shrink-0"
              title={todo.is_completed ? 'Tandai belum selesai' : 'Tandai selesai'}
            >
              {todo.is_completed ? (
                <CheckCircle2 className="w-4.5 h-4.5 text-emerald-600" />
              ) : (
                <Circle className="w-4.5 h-4.5" />
              )}
            </button>

            {!hideStatus && renderStatusBadge(todo)}

            <div 
              onClick={() => openEditTodoModal(todo)}
              className="flex items-center space-x-2 flex-1 min-w-0 cursor-pointer"
            >
              <span className={`text-sm truncate font-medium hover:underline ${todo.is_completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-100'}`}>
                {todo.title}
              </span>

              {todo.description && (
                <span title="Tugas ini memiliki catatan" className="text-neutral-400 dark:text-neutral-500 shrink-0">
                  <MessageSquare className="w-3.5 h-3.5" />
                </span>
              )}

              {todo.media_url && (
                <span title="Tugas ini memiliki lampiran foto" className="text-blue-500 shrink-0">
                  <Image className="w-3.5 h-3.5" />
                </span>
              )}

              {Array.isArray(todo.subtasks) && todo.subtasks.length > 0 && (
                <span 
                  title={isEn ? `Checklist: ${todo.subtasks.filter(s => s.completed).length}/${todo.subtasks.length} completed` : `Checklist: ${todo.subtasks.filter(s => s.completed).length}/${todo.subtasks.length} selesai`}
                  className="inline-flex items-center space-x-1 text-[11px] font-medium text-neutral-600 dark:text-neutral-300 bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded shrink-0 border border-neutral-200/60 dark:border-neutral-700/60"
                >
                  <CheckSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                  <span>{todo.subtasks.filter(s => s.completed).length}/{todo.subtasks.length}</span>
                </span>
              )}
            </div>
          </div>

          {/* Sisi Kanan / Bawah (Mobile): Prioritas, Jatuh Tempo, Foto, Hapus */}
          <div className="flex items-center justify-between sm:justify-end space-x-2 shrink-0 pl-7 sm:pl-0 sm:ml-3 pt-0.5 sm:pt-0">
            <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
              {renderPriorityBadge(todo.priority)}

              {todo.reminder_date && (
                <span className={`inline-flex items-center space-x-1 text-[10px] px-2 py-0.5 rounded-md font-mono ${
                  reminderActive 
                    ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 border border-amber-300 dark:border-amber-800 font-semibold' 
                    : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                }`}>
                  <Bell className="w-2.5 h-2.5" />
                  <span>{format(parseISO(todo.reminder_date), 'dd MMM', { locale: currentLocale })}</span>
                </span>
              )}

              {renderDateBadge(todo.due_date)}

              {todo.media_url && (
                <button
                  onClick={() => setLightboxMedia({ url: todo.media_url, type: todo.media_type, title: todo.title })}
                  className="relative group/thumb w-6 h-6 sm:w-7 sm:h-7 rounded-md overflow-hidden border border-neutral-200 dark:border-neutral-700 shrink-0 cursor-pointer"
                  title="Klik untuk perbesar foto"
                >
                  <img src={todo.media_url} alt="Thumb" className="w-full h-full object-cover" />
                  <div className="absolute inset-0 bg-black/40 opacity-0 group-hover/thumb:opacity-100 flex items-center justify-center text-white transition">
                    <ZoomIn className="w-3 h-3" />
                  </div>
                </button>
              )}
            </div>

            {/* Tombol Hapus */}
            <button
              onClick={() => handleSoftDeleteTodo(todo.id)}
              className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition p-1 cursor-pointer"
              title={labels.moveToTrash}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        </div>

        {todo.description && (
          <div 
            onClick={() => openEditTodoModal(todo)}
            className="mt-2 text-xs text-neutral-500 dark:text-neutral-400 pl-8 line-clamp-1 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 transition"
          >
            💬 {todo.description}
          </div>
        )}
      </div>
    );
  };

  // Render Galeri Media di Kartu Catatan (1-5 Foto & 1 Video)
  const renderNoteCardMedia = (note) => {
    const items = getNoteMediaItems(note);
    if (items.length === 0) return null;

    const images = items.filter(m => m.type === 'image');
    const video = items.find(m => m.type === 'video');
    const embed = items.find(m => m.type?.includes('embed'));

    return (
      <div className="border-b border-neutral-100 bg-neutral-900 overflow-hidden">
        {/* Jika ada Video atau Embed */}
        {embed && (
          <div className="relative w-full h-44 bg-neutral-900">
            <iframe
              src={embed.url}
              title={note.title}
              className="w-full h-full border-0"
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen
            />
          </div>
        )}

        {video && !embed && (
          <div className="relative w-full h-40 bg-neutral-900">
            <video src={video.url} controls className="w-full h-full object-cover" />
          </div>
        )}

        {/* Galeri Gambar */}
        {images.length > 0 && (
          <div className="relative w-full">
            {images.length === 1 && (
              <div 
                onClick={(e) => {
                  e.stopPropagation();
                  setLightboxMedia({ url: images[0].url, type: 'image', title: note.title });
                }}
                className="relative w-full h-44 cursor-zoom-in group/img"
              >
                <img src={images[0].url} alt={note.title} className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300" loading="lazy" />
                <div className="absolute inset-0 bg-black/30 opacity-0 group-hover/img:opacity-100 flex items-center justify-center text-white text-xs space-x-1 transition">
                  <ZoomIn className="w-4 h-4" />
                  <span>Perbesar</span>
                </div>
              </div>
            )}

            {images.length === 2 && (
              <div className="grid grid-cols-2 gap-0.5 h-40">
                {images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxMedia({ url: img.url, type: 'image', title: `${note.title} (${idx + 1})` });
                    }}
                    className="relative h-full cursor-zoom-in group/img overflow-hidden"
                  >
                    <img src={img.url} alt="Media" className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            {images.length === 3 && (
              <div className="grid grid-cols-3 gap-0.5 h-36">
                {images.map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxMedia({ url: img.url, type: 'image', title: `${note.title} (${idx + 1})` });
                    }}
                    className="relative h-full cursor-zoom-in group/img overflow-hidden"
                  >
                    <img src={img.url} alt="Media" className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300" loading="lazy" />
                  </div>
                ))}
              </div>
            )}

            {images.length >= 4 && (
              <div className="grid grid-cols-2 gap-0.5 h-44">
                {images.slice(0, 4).map((img, idx) => (
                  <div 
                    key={idx} 
                    onClick={(e) => {
                      e.stopPropagation();
                      setLightboxMedia({ url: img.url, type: 'image', title: `${note.title} (${idx + 1})` });
                    }}
                    className="relative h-full cursor-zoom-in group/img overflow-hidden"
                  >
                    <img src={img.url} alt="Media" className="w-full h-full object-cover group-hover/img:scale-105 transition duration-300" loading="lazy" />
                    {idx === 3 && images.length > 4 && (
                      <div className="absolute inset-0 bg-black/60 flex items-center justify-center text-white font-bold text-sm">
                        +{images.length - 3} lagi
                      </div>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    );
  };

  // Filter Search & Tab
  const filteredActiveTodos = getSortedTodos(activeTodos.filter(t => {
    const matchSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (t.description && t.description.toLowerCase().includes(searchQuery.toLowerCase()));
    if (activeTab === 'reminders') return matchSearch && isReminderActive(t);
    return matchSearch;
  }));

  const filteredActiveNotes = activeNotes.filter(n => 
    n.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
    (n.content && n.content.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  const filteredTrashTodos = trashTodos.filter(t => t.title.toLowerCase().includes(searchQuery.toLowerCase()));
  const filteredTrashNotes = trashNotes.filter(n => n.title.toLowerCase().includes(searchQuery.toLowerCase()));

  return (
    <div className="min-h-screen flex flex-col md:flex-row bg-[#FBFBFA] dark:bg-[#191919] text-neutral-800 dark:text-neutral-200 transition-colors duration-200">

      {/* ─── MOBILE: Fixed Top Bar (Gemini-style) ─── */}
      <div className="md:hidden fixed top-0 left-0 right-0 z-30 flex items-center px-3 h-12 bg-[#F7F6F3]/95 dark:bg-[#202020]/95 backdrop-blur-sm border-b border-neutral-200/80 dark:border-neutral-800">
        {/* Hamburger */}
        <button
          onClick={() => setIsMobileMenuOpen(true)}
          className="p-2 -ml-1 rounded-xl text-neutral-600 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition cursor-pointer"
          aria-label="Open menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        {/* Logo + Workspace / Section name */}
        <div className="flex items-center space-x-1.5 ml-1 min-w-0 flex-1">
          <span className="text-base shrink-0">🪐</span>
          <span className="text-sm font-semibold text-neutral-800 dark:text-neutral-100 truncate max-w-[120px]">
            {currentWorkspace ? currentWorkspace.name : 'Ersona'}
          </span>
          <span className="text-[10px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded font-medium shrink-0 truncate">
            {activeTab === 'reminders' ? labels.remindersTab
              : activeTab === 'todos' ? labels.todosTab
              : activeTab === 'notes' ? labels.notesTab
              : activeTab === 'trash' ? labels.trashTab
              : activeTab === 'settings' ? t('dashboard.settingsTab')
              : t('dashboard.allTab')}
          </span>
        </div>

        {/* Right: theme toggle only */}
        <button
          onClick={toggleTheme}
          className="p-2 rounded-xl text-neutral-500 dark:text-neutral-300 hover:bg-neutral-200/60 dark:hover:bg-neutral-800 transition cursor-pointer"
          title={isDark ? t('common.lightMode') : t('common.darkMode')}
        >
          {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4" />}
        </button>
      </div>

      {/* ─── MOBILE: Slide-in Drawer Overlay ─── */}
      {isMobileMenuOpen && (
        <div className="md:hidden fixed inset-0 z-40 flex">
          {/* Backdrop */}
          <div
            className="absolute inset-0 bg-black/40 backdrop-blur-xs"
            onClick={() => setIsMobileMenuOpen(false)}
          />
          {/* Drawer panel */}
          <aside className="relative z-50 w-72 max-w-[85vw] h-full bg-[#F7F6F3] dark:bg-[#202020] flex flex-col shadow-2xl animate-in slide-in-from-left duration-200">
            {/* Drawer header */}
            <div className="flex items-center justify-between px-4 pt-4 pb-3 border-b border-neutral-200/60 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <span className="text-xl">🪐</span>
                <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate max-w-[130px]">
                  {user?.email?.split('@')[0]}
                </span>
              </div>
              <div className="flex items-center space-x-1">
                {/* Language toggle inside drawer */}
                <button
                  onClick={toggleLanguage}
                  className="px-2 py-1 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#282828] text-neutral-700 dark:text-neutral-200 cursor-pointer transition"
                >
                  {language.toUpperCase()}
                </button>
                <button
                  onClick={signOut}
                  title={t('dashboard.signOut')}
                  className="text-neutral-400 hover:text-red-500 p-1.5 rounded-lg hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <LogOut className="w-4 h-4" />
                </button>
              </div>
            </div>

            {/* Nav tabs */}
            <nav className="flex-1 overflow-y-auto p-3 space-y-0.5">
              {/* Mobile Workspace Switcher */}
              <div className="relative mb-3">
                <button
                  type="button"
                  onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
                  className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#282828] border border-neutral-200/90 dark:border-neutral-700/80 transition cursor-pointer shadow-2xs"
                >
                  <div className="flex items-center space-x-2 min-w-0">
                    <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                      activeWorkspaceId ? 'bg-blue-600 text-white' : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                    }`}>
                      {activeWorkspaceId ? <Users className="w-3.5 h-3.5" /> : '👤'}
                    </div>
                    <div className="text-left min-w-0">
                      <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                        {currentWorkspace ? currentWorkspace.name : t('dashboard.personalWorkspace')}
                      </div>
                      <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                        {currentWorkspace ? t('dashboard.sharedWorkspace') : 'Private'}
                      </div>
                    </div>
                  </div>
                  <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform shrink-0 ml-1 ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
                </button>

                {isWorkspaceMenuOpen && (
                  <div className="mt-1 bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-lg p-1.5 space-y-0.5 animate-in fade-in">
                    <button
                      type="button"
                      onClick={() => handleSwitchWorkspace(null)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        activeWorkspaceId === null ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <span>👤</span>
                        <span className="truncate">{t('dashboard.personalWorkspace')}</span>
                      </div>
                      {activeWorkspaceId === null && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>

                    {workspaces.map(ws => (
                      <button
                        key={ws.id}
                        type="button"
                        onClick={() => handleSwitchWorkspace(ws.id)}
                        className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                          activeWorkspaceId === ws.id ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white' : 'text-neutral-700 dark:text-neutral-300'
                        }`}
                      >
                        <div className="flex items-center space-x-2 truncate">
                          <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                          <span className="truncate">{ws.name}</span>
                        </div>
                        {activeWorkspaceId === ws.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                      </button>
                    ))}

                    <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                    <button
                      type="button"
                      onClick={() => { setIsWorkspaceMenuOpen(false); setIsCreateWsModalOpen(true); }}
                      className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer font-medium"
                    >
                      <Plus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{t('dashboard.createWorkspace')}</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => { setIsWorkspaceMenuOpen(false); setIsJoinWsModalOpen(true); }}
                      className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer font-medium"
                    >
                      <UserPlus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                      <span>{t('dashboard.joinWorkspace')}</span>
                    </button>
                  </div>
                )}
              </div>

              {/* Mobile Member Badge for Team Workspace */}
              {currentWorkspace && (
                <div className="mb-3 flex items-center justify-between p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs">
                  <div className="flex items-center space-x-1.5 text-blue-900 dark:text-blue-300 min-w-0">
                    <Users className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                    <span className="font-medium truncate">{workspaceMembers.length} {isEn ? 'members' : 'anggota'}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setIsWsMembersModalOpen(true)}
                    className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition cursor-pointer shrink-0"
                  >
                    {t('dashboard.workspaceMembers')}
                  </button>
                </div>
              )}

              <button
                onClick={() => { setActiveTab('all'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center space-x-2 px-2.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${
                  activeTab === 'all' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'
                }`}
              >
                <CheckSquare className="w-4 h-4 text-neutral-500 shrink-0" />
                <span>{t('dashboard.allTab')}</span>
              </button>

              <button onClick={() => { setActiveTab('reminders'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'reminders' ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}`}
              >
                <div className="flex items-center space-x-2">
                  <Bell className={`w-4 h-4 shrink-0 ${activeReminders.length > 0 ? 'text-amber-600 animate-pulse' : 'text-neutral-500'}`} />
                  <span>{labels.remindersTab}</span>
                </div>
                {activeReminders.length > 0 && <span className="text-[10px] bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full">{activeReminders.length}</span>}
              </button>

              <button onClick={() => { setActiveTab('todos'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'todos' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}`}
              >
                <div className="flex items-center space-x-2">
                  <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
                  <span>{labels.todosTab}</span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">{activeTodos.filter(t => !t.is_completed).length}</span>
              </button>

              <button onClick={() => { setActiveTab('notes'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'notes' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}`}
              >
                <div className="flex items-center space-x-2">
                  <FileText className="w-4 h-4 text-blue-600 shrink-0" />
                  <span>{labels.notesTab}</span>
                </div>
                <span className="text-xs text-neutral-400 font-mono">{activeNotes.length}</span>
              </button>

              <button onClick={() => { setActiveTab('trash'); setIsMobileMenuOpen(false); }}
                className={`w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm font-medium transition cursor-pointer ${activeTab === 'trash' ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800/60'}`}
              >
                <div className="flex items-center space-x-2">
                  <Trash2 className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{labels.trashTab}</span>
                </div>
                {totalTrashCount > 0 && <span className="text-[10px] bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 font-mono px-1.5 py-0.5 rounded-full">{totalTrashCount}</span>}
              </button>

              <div className="my-2 border-t border-neutral-200/60 dark:border-neutral-800" />

              <button onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                className="w-full flex items-center justify-between px-2.5 py-2.5 rounded-xl text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
              >
                <div className="flex items-center space-x-2">
                  <Settings className="w-4 h-4 text-neutral-500 shrink-0" />
                  <span>{t('dashboard.settingsTab')}</span>
                </div>
                <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${quotaConfig.isUpgraded ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300'}`}>
                  {quotaConfig.isUpgraded ? 'PRO' : 'FREE'}
                </span>
              </button>

              {onGoToLanding && (
                <button onClick={() => { onGoToLanding(); setIsMobileMenuOpen(false); }}
                  className="w-full flex items-center space-x-2 px-2.5 py-2.5 rounded-xl text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer"
                >
                  <Globe className="w-4 h-4 text-neutral-400 shrink-0" />
                  <span>{t('dashboard.homeTab')}</span>
                </button>
              )}
            </nav>

            {/* Drawer Footer */}
            <div className="p-3 border-t border-neutral-200/60 dark:border-neutral-800 space-y-2">
              <div onClick={() => { setIsSettingsOpen(true); setIsMobileMenuOpen(false); }}
                className="p-2.5 bg-neutral-200/40 dark:bg-neutral-800/40 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 rounded-xl border border-neutral-200/60 dark:border-neutral-800 transition cursor-pointer group"
              >
                <div className="flex items-center justify-between text-[11px] mb-1.5">
                  <div className="flex items-center space-x-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                    <Image className="w-3.5 h-3.5 text-blue-500" />
                    <span>{quotaConfig.isWorkspacePool ? (isEn ? 'Team Media Pool' : 'Pool Media Tim') : (isEn ? 'Media Quota' : 'Kuota Media')}</span>
                  </div>
                  <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                    {currentPhotoCount}/{quotaConfig.maxPhotos} foto
                  </span>
                </div>
                <div className="w-full bg-neutral-200/80 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
                  <div className={`h-full rounded-full transition-all duration-300 ${(currentPhotoCount / quotaConfig.maxPhotos) > 0.9 ? 'bg-red-500' : (currentPhotoCount / quotaConfig.maxPhotos) > 0.7 ? 'bg-amber-500' : 'bg-blue-500'}`}
                    style={{ width: `${Math.min(100, Math.max(3, (currentPhotoCount / quotaConfig.maxPhotos) * 100))}%` }} />
                </div>
              </div>
              <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between px-1">
                <span>Ersona Workspace</span>
                <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">v1.7</span>
              </div>
            </div>
          </aside>
        </div>
      )}

      {/* ─── DESKTOP: Sidebar (always visible, md+) ─── */}
      <aside className="hidden md:flex md:w-64 bg-[#F7F6F3] dark:bg-[#202020] border-r border-neutral-200/80 dark:border-neutral-800 p-4 flex-col justify-between shrink-0">
        <div>
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 dark:border-neutral-800 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🪐</span>
              <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate max-w-[130px]">{user?.email?.split('@')[0]}</span>
            </div>
            <button onClick={signOut} title={t('dashboard.signOut')} className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1.5 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition cursor-pointer">
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Workspace Switcher Dropdown */}
          <div className="relative mb-3">
            <button
              type="button"
              onClick={() => setIsWorkspaceMenuOpen(!isWorkspaceMenuOpen)}
              className="w-full flex items-center justify-between p-2 rounded-xl bg-white dark:bg-[#282828] border border-neutral-200/90 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600 transition cursor-pointer shadow-2xs"
            >
              <div className="flex items-center space-x-2 min-w-0">
                <div className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                  activeWorkspaceId ? 'bg-blue-600 text-white' : 'bg-neutral-900 dark:bg-white text-white dark:text-neutral-900'
                }`}>
                  {activeWorkspaceId ? <Users className="w-3.5 h-3.5" /> : '👤'}
                </div>
                <div className="text-left min-w-0">
                  <div className="text-xs font-semibold text-neutral-800 dark:text-neutral-100 truncate">
                    {currentWorkspace ? currentWorkspace.name : t('dashboard.personalWorkspace')}
                  </div>
                  <div className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {currentWorkspace ? t('dashboard.sharedWorkspace') : 'Private'}
                  </div>
                </div>
              </div>
              <ChevronDown className={`w-3.5 h-3.5 text-neutral-400 transition-transform shrink-0 ml-1 ${isWorkspaceMenuOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isWorkspaceMenuOpen && (
              <>
                <div className="fixed inset-0 z-40" onClick={() => setIsWorkspaceMenuOpen(false)} />
                <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-white dark:bg-[#252525] border border-neutral-200 dark:border-neutral-700 rounded-xl shadow-xl p-1.5 space-y-0.5 animate-in fade-in zoom-in-95">
                  <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500">
                    Workspaces
                  </div>

                  {/* Personal Workspace Option */}
                  <button
                    type="button"
                    onClick={() => handleSwitchWorkspace(null)}
                    className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                      activeWorkspaceId === null 
                        ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white' 
                        : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                    }`}
                  >
                    <div className="flex items-center space-x-2 truncate">
                      <span>👤</span>
                      <span className="truncate">{t('dashboard.personalWorkspace')}</span>
                    </div>
                    {activeWorkspaceId === null && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                  </button>

                  {/* Team Workspaces List */}
                  {workspaces.map(ws => (
                    <button
                      key={ws.id}
                      type="button"
                      onClick={() => handleSwitchWorkspace(ws.id)}
                      className={`w-full flex items-center justify-between px-2 py-1.5 rounded-lg text-xs transition cursor-pointer ${
                        activeWorkspaceId === ws.id 
                          ? 'bg-neutral-100 dark:bg-neutral-800 font-semibold text-neutral-900 dark:text-white' 
                          : 'text-neutral-700 dark:text-neutral-300 hover:bg-neutral-50 dark:hover:bg-neutral-800/60'
                      }`}
                    >
                      <div className="flex items-center space-x-2 truncate">
                        <Users className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        <span className="truncate">{ws.name}</span>
                      </div>
                      {activeWorkspaceId === ws.id && <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />}
                    </button>
                  ))}

                  <div className="my-1 border-t border-neutral-100 dark:border-neutral-800" />

                  {/* Create New Workspace Button */}
                  <button
                    type="button"
                    onClick={() => { setIsWorkspaceMenuOpen(false); setIsCreateWsModalOpen(true); }}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer font-medium"
                  >
                    <Plus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{t('dashboard.createWorkspace')}</span>
                  </button>

                  {/* Join Workspace Button */}
                  <button
                    type="button"
                    onClick={() => { setIsWorkspaceMenuOpen(false); setIsJoinWsModalOpen(true); }}
                    className="w-full flex items-center space-x-2 px-2 py-1.5 rounded-lg text-xs text-neutral-700 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 transition cursor-pointer font-medium"
                  >
                    <UserPlus className="w-3.5 h-3.5 text-neutral-500 shrink-0" />
                    <span>{t('dashboard.joinWorkspace')}</span>
                  </button>
                </div>
              </>
            )}
          </div>

          {/* Quick Member Badge & Settings for Team Workspace */}
          {currentWorkspace && (
            <div className="mb-3 flex items-center justify-between p-2 rounded-xl bg-blue-50/80 dark:bg-blue-950/30 border border-blue-200/80 dark:border-blue-900/50 text-xs">
              <div className="flex items-center space-x-1.5 text-blue-900 dark:text-blue-300 min-w-0">
                <Users className="w-3.5 h-3.5 shrink-0 text-blue-600" />
                <span className="font-medium truncate">{workspaceMembers.length} {isEn ? 'members' : 'anggota'}</span>
              </div>
              <button
                type="button"
                onClick={() => setIsWsMembersModalOpen(true)}
                className="px-2 py-0.5 rounded-md bg-blue-600 hover:bg-blue-700 text-white text-[11px] font-medium transition cursor-pointer shrink-0"
              >
                {t('dashboard.workspaceMembers')}
              </button>
            </div>
          )}
          <nav className="space-y-1">
            <button onClick={() => setActiveTab('all')} className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === 'all' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'}`}>
              <CheckSquare className="w-4 h-4 text-neutral-500" /><span>{t('dashboard.allTab')}</span>
            </button>
            <button onClick={() => setActiveTab('reminders')} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === 'reminders' ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'}`}>
              <div className="flex items-center space-x-2"><Bell className={`w-4 h-4 ${activeReminders.length > 0 ? 'text-amber-600 animate-pulse' : 'text-neutral-500'}`} /><span>{labels.remindersTab}</span></div>
              {activeReminders.length > 0 && <span className="text-xs bg-amber-500 text-white font-bold px-1.5 py-0.5 rounded-full text-[10px]">{activeReminders.length}</span>}
            </button>
            <button onClick={() => setActiveTab('todos')} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === 'todos' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'}`}>
              <div className="flex items-center space-x-2"><CheckCircle2 className="w-4 h-4 text-emerald-600" /><span>{labels.todosTab}</span></div>
              <span className="text-xs text-neutral-400 font-mono">{activeTodos.filter(t => !t.is_completed).length}</span>
            </button>
            <button onClick={() => setActiveTab('notes')} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === 'notes' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'}`}>
              <div className="flex items-center space-x-2"><FileText className="w-4 h-4 text-blue-600" /><span>{labels.notesTab}</span></div>
              <span className="text-xs text-neutral-400 font-mono">{activeNotes.length}</span>
            </button>
            <button onClick={() => setActiveTab('trash')} className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${activeTab === 'trash' ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 font-semibold' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'}`}>
              <div className="flex items-center space-x-2"><Trash2 className="w-4 h-4 text-neutral-400" /><span>{labels.trashTab}</span></div>
              {totalTrashCount > 0 && <span className="text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono px-1.5 py-0.5 rounded-full text-[10px]">{totalTrashCount}</span>}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer mt-1">
              <div className="flex items-center space-x-2"><Settings className="w-4 h-4 text-neutral-500" /><span>{t('dashboard.settingsTab')}</span></div>
              <span className={`text-[10px] font-mono px-1.5 py-0.5 rounded font-bold uppercase ${quotaConfig.isUpgraded ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'}`}>{quotaConfig.isUpgraded ? 'PRO' : 'FREE'}</span>
            </button>
            {onGoToLanding && (
              <button onClick={onGoToLanding} className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer mt-0.5">
                <div className="flex items-center space-x-2"><Globe className="w-4 h-4 text-neutral-400" /><span>{t('dashboard.homeTab')}</span></div>
              </button>
            )}
          </nav>
        </div>
        <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800 space-y-3">
          <div onClick={() => setIsSettingsOpen(true)} className="p-2.5 bg-neutral-200/40 dark:bg-neutral-800/40 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 rounded-xl border border-neutral-200/60 dark:border-neutral-800 transition cursor-pointer group">
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <div className="flex items-center space-x-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                <Image className="w-3.5 h-3.5 text-blue-500" />
                <span>{quotaConfig.isWorkspacePool ? (isEn ? 'Team Media Pool' : 'Pool Media Tim') : (isEn ? 'Media Quota' : 'Kuota Media')}</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                {currentPhotoCount}/{quotaConfig.maxPhotos} foto
              </span>
            </div>
            <div className="w-full bg-neutral-200/80 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
              <div className={`h-full rounded-full transition-all duration-300 ${(currentPhotoCount / quotaConfig.maxPhotos) > 0.9 ? 'bg-red-500' : (currentPhotoCount / quotaConfig.maxPhotos) > 0.7 ? 'bg-amber-500' : 'bg-blue-500'}`} style={{ width: `${Math.min(100, Math.max(3, (currentPhotoCount / quotaConfig.maxPhotos) * 100))}%` }} />
            </div>
          </div>
          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between px-1">
            <span>Ersona Workspace</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">v1.7</span>
          </div>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 max-w-4xl mx-auto w-full pt-16 md:pt-8 px-3 pb-6 sm:px-6 md:px-10 space-y-4 sm:space-y-6 overflow-y-auto">
        {/* Search & Header Bar (Desktop Only) */}
        <div className="hidden md:flex flex-row items-center justify-between gap-3">
          <div>
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <span>{t('dashboard.workspaceTitle')}</span>
              <span className="text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full font-normal">v1.7</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.workspaceSubtitle')}</p>
          </div>
          <div className="flex items-center space-x-2">
            <div className="relative w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input type="text" placeholder={t('dashboard.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-1.5 text-xs bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400" />
            </div>
            <button onClick={toggleLanguage} className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#232323] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] transition cursor-pointer shrink-0" title="Switch Language">{language.toUpperCase()}</button>
            <button onClick={toggleTheme} className="p-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg transition cursor-pointer shrink-0 bg-white dark:bg-[#232323]" title={isDark ? t('common.lightMode') : t('common.darkMode')}>
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600" />}
            </button>
            <button onClick={() => setIsSettingsOpen(true)} title={t('settings.title')} className="p-1.5 border border-neutral-200 dark:border-neutral-700 rounded-lg transition cursor-pointer shrink-0 bg-white dark:bg-[#232323]"><Settings className="w-4 h-4 text-neutral-500" /></button>
          </div>
        </div>

        {/* Mobile: Search bar only */}
        <div className="md:hidden">
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input type="text" placeholder={t('dashboard.searchPlaceholder')} value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)}
              className="w-full pl-9 pr-3 py-2.5 text-sm bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400" />
          </div>
        </div>

        {/* Banner Sukses Verifikasi Email Baru */}
        {showVerifiedToast && (
          <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs animate-in fade-in duration-300">
            <div className="flex items-center space-x-2 text-emerald-800 dark:text-emerald-300 min-w-0">
              <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="font-medium">
                {isEn 
                  ? '🎉 Email verified successfully! Your account quota has been upgraded to 150 photos & 2 videos.' 
                  : '🎉 Email berhasil diverifikasi! Kuota akun Anda kini meningkat menjadi 150 foto & 2 video.'}
              </span>
            </div>
            <button
              type="button"
              onClick={handleDismissVerifiedToast}
              className="p-1 text-emerald-700 hover:text-emerald-900 dark:text-emerald-300 dark:hover:text-emerald-100 rounded-md hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition cursor-pointer shrink-0"
              title={isEn ? 'Close' : 'Tutup'}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>
        )}

        {/* Banner Akun Belum Terverifikasi (Limit 50 Foto & 0 Video) */}
        {!quotaConfig.isEmailConfirmed && !quotaConfig.isUpgraded && !isUnverifiedBannerDismissed && (
          <div className="p-3 bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800/80 rounded-xl flex items-center justify-between gap-3 text-xs shadow-2xs">
            <div className="flex items-center space-x-2 text-amber-800 dark:text-amber-300 min-w-0">
              <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
              <span className="truncate">
                {isEn 
                  ? 'Email not verified (Limit: 50 photos & 0 videos). Verify to unlock 150 photos & 2 videos!' 
                  : 'Email belum diverifikasi (Batas: 50 foto & 0 video). Verifikasi untuk membuka 150 foto & 2 video!'}
              </span>
            </div>
            <div className="flex items-center space-x-1.5 shrink-0">
              <button
                type="button"
                onClick={() => setIsSettingsOpen(true)}
                className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white rounded-lg font-medium text-xs transition cursor-pointer"
              >
                {isEn ? 'Verify' : 'Verifikasi'}
              </button>
              <button
                type="button"
                onClick={handleDismissUnverifiedBanner}
                className="p-1 text-amber-700 hover:text-amber-900 dark:text-amber-300 dark:hover:text-amber-100 rounded-md hover:bg-amber-100 dark:hover:bg-amber-900/50 transition cursor-pointer"
                title={isEn ? 'Dismiss for this session' : 'Tutup pemberitahuan'}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>
        )}

        {/* Mobile: Compact toolbar for view/group/sort controls — only when relevant tab */}
        {(activeTab === 'all' || activeTab === 'todos' || activeTab === 'reminders') && (
          <div className="md:hidden flex items-center gap-1.5 overflow-x-auto no-scrollbar">
            {/* View Switcher */}
            <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700 text-xs shrink-0">
              <button type="button" onClick={() => toggleViewMode('list')} className={`flex items-center px-2.5 py-1.5 rounded-md font-medium transition cursor-pointer ${taskViewMode === 'list' ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500 dark:text-neutral-400'}`} title="List">
                <List className="w-3.5 h-3.5" />
              </button>
              <button type="button" onClick={() => toggleViewMode('board')} className={`flex items-center px-2.5 py-1.5 rounded-md font-medium transition cursor-pointer ${taskViewMode === 'board' ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-neutral-100 shadow-xs' : 'text-neutral-500 dark:text-neutral-400'}`} title="Board">
                <Columns3 className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Group by status (list mode only) */}
            {taskViewMode === 'list' && (
              <button type="button" onClick={toggleGroupByStatus} className={`flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium border transition cursor-pointer shrink-0 ${isGroupedByStatus ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100' : 'bg-white dark:bg-[#232323] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700'}`} title={t('dashboard.groupByStatus')}>
                <Layers className="w-3.5 h-3.5" />
                <span>{t('dashboard.groupByStatus')}</span>
              </button>
            )}

            {/* Status Manager */}
            <button type="button" onClick={() => setIsStatusManagerOpen(true)} className="flex items-center space-x-1 px-2.5 py-1.5 rounded-lg text-xs font-medium bg-white dark:bg-[#232323] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer shrink-0" title={t('dashboard.statusBtn')}>
              <Settings2 className="w-3.5 h-3.5" />
              <span>{t('dashboard.statusBtn')}</span>
            </button>

            {/* Sort */}
            <div className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1.5 shrink-0">
              <ArrowUpDown className="w-3 h-3 text-neutral-400 shrink-0" />
              <select value={todoSortBy} onChange={(e) => setTodoSortBy(e.target.value)} className="bg-transparent focus:outline-none cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-200 max-w-[90px]">
                <option value="created_desc" className="dark:bg-[#232323]">{t('dashboard.sortLatest')}</option>
                <option value="created_asc" className="dark:bg-[#232323]">{t('dashboard.sortOldest')}</option>
                <option value="due_date_asc" className="dark:bg-[#232323]">{t('dashboard.sortDueNearest')}</option>
                <option value="due_date_desc" className="dark:bg-[#232323]">{t('dashboard.sortDueFurthest')}</option>
                <option value="priority_desc" className="dark:bg-[#232323]">{t('dashboard.sortPriorityHighest')}</option>
              </select>
            </div>
          </div>
        )}

        {/* BANNER PENGINGAT PRIORITAS PALING ATAS */}
        {activeReminders.length > 0 && activeTab !== 'notes' && activeTab !== 'trash' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl shadow-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between flex-wrap gap-2">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-semibold text-xs">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                <span>🔔 {labels.remindersTab} {t('common.active')} ({activeReminders.length} {isEn ? 'tasks need your attention' : 'Tugas Membutuhkan Perhatian Anda'})</span>
              </div>
              <div className="flex items-center space-x-2.5">
                {isNotificationSupported() && !isNotifActive && (
                  <button
                    type="button"
                    onClick={async () => {
                      const res = await requestNotificationPermission();
                      if (res === 'granted') {
                        enableNotifications();
                        setIsNotifActive(true);
                        sendTestNotification(isEn);
                      }
                    }}
                    className="text-[11px] bg-amber-600 hover:bg-amber-700 text-white font-medium px-2 py-0.5 rounded-md transition cursor-pointer shadow-2xs flex items-center space-x-1"
                  >
                    <span>🔔</span>
                    <span>{isEn ? 'Enable Notifications' : 'Aktifkan Notifikasi'}</span>
                  </button>
                )}
                <button
                  onClick={() => setActiveTab('reminders')}
                  className="text-[11px] text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 font-medium cursor-pointer"
                >
                  {isEn ? `View All ${labels.remindersTab}` : `Lihat Semua ${labels.remindersTab}`}
                </button>
              </div>
            </div>

            <div className="space-y-1.5">
              {activeReminders.slice(0, 3).map(rem => (
                <div key={rem.id} className="flex items-center justify-between bg-white/80 dark:bg-[#232323] p-2 rounded-lg border border-amber-200 dark:border-amber-800/50 text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <button
                      onClick={() => handleToggleTodo(rem.id, rem.is_completed)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 cursor-pointer"
                    >
                      <Circle className="w-4 h-4" />
                    </button>
                    <span 
                      onClick={() => openEditTodoModal(rem)}
                      className="font-medium text-neutral-800 dark:text-neutral-200 truncate cursor-pointer hover:underline"
                    >
                      {rem.title}
                    </span>
                  </div>
                  <div className="flex items-center space-x-2 shrink-0">
                    {renderPriorityBadge(rem.priority)}
                    {rem.due_date && renderDateBadge(rem.due_date)}
                    <button 
                      onClick={() => openEditTodoModal(rem)}
                      className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1"
                      title="Edit Tugas"
                    >
                      <Edit3 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Loading Spinner State */}
        {loading ? (
          <div className="py-16 flex flex-col items-center justify-center space-y-2 text-neutral-400">
            <Loader2 className="w-6 h-6 animate-spin text-neutral-600" />
            <span className="text-xs">{isEn ? 'Loading data from Supabase...' : 'Memuat data dari Supabase...'}</span>
          </div>
        ) : (
          <>
            {/* VIEW TEMPAT SAMPAH (TRASH TAB) */}
            {activeTab === 'trash' && (
              <section className="space-y-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <div>
                    <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 flex items-center space-x-2">
                      <Trash2 className="w-4 h-4 text-red-600" />
                      <span>{labels.trashTab}</span>
                      <span className="text-xs text-neutral-400 font-mono">({totalTrashCount} {isEn ? 'items' : 'item'})</span>
                    </h2>
                    <p className="text-xs text-neutral-400 dark:text-neutral-500 mt-0.5">
                      {t('dashboard.trashHeaderDesc')}
                    </p>
                  </div>

                  {totalTrashCount > 0 && (
                    <button
                      onClick={handleEmptyTrash}
                      className="px-3 py-1.5 bg-red-50 dark:bg-red-950/40 hover:bg-red-100 dark:hover:bg-red-900/60 text-red-700 dark:text-red-300 border border-red-200 dark:border-red-800 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1.5 self-start sm:self-auto"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                      <span>{labels.emptyTrash}</span>
                    </button>
                  )}
                </div>

                {totalTrashCount === 0 ? (
                  <div className="text-center py-16 text-neutral-400 dark:text-neutral-500 text-xs italic bg-white/40 dark:bg-[#202020]/40 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                    {t('dashboard.emptyTrash')}
                  </div>
                ) : (
                  <div className="space-y-3">
                    {filteredTrashTodos.map(todo => {
                      const daysOld = differenceInDays(new Date(), parseISO(todo.deleted_at));
                      const daysLeft = Math.max(0, 5 - daysOld);
                      return (
                        <div key={todo.id} className="p-3 bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="text-xs px-2 py-0.5 bg-neutral-100 dark:bg-neutral-800 text-neutral-600 dark:text-neutral-300 rounded font-medium shrink-0">
                              {isEn ? 'Task' : 'Tugas'}
                            </span>
                            <span className="text-sm text-neutral-800 dark:text-neutral-300 font-medium truncate line-through opacity-75">
                              {todo.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                              {t('dashboard.daysLeft', { days: daysLeft })}
                            </span>
                            <button
                              onClick={() => handleRestoreTodo(todo.id)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                              title={t('dashboard.restore')}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{t('dashboard.restore')}</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDeleteTodo(todo.id, todo.media_url)}
                              className="p-1 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                              title={t('dashboard.deletePermanently')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}

                    {filteredTrashNotes.map(note => {
                      const daysOld = differenceInDays(new Date(), parseISO(note.deleted_at));
                      const daysLeft = Math.max(0, 5 - daysOld);
                      return (
                        <div key={note.id} className="p-3 bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-800 rounded-xl flex items-center justify-between gap-3">
                          <div className="flex items-center space-x-2.5 min-w-0">
                            <span className="text-xs px-2 py-0.5 bg-blue-50 dark:bg-blue-950/40 text-blue-700 dark:text-blue-300 rounded font-medium shrink-0">
                              {isEn ? 'Note' : 'Catatan'} {note.icon_emoji}
                            </span>
                            <span className="text-sm text-neutral-800 dark:text-neutral-300 font-medium truncate opacity-75">
                              {note.title}
                            </span>
                          </div>

                          <div className="flex items-center space-x-2 shrink-0">
                            <span className="text-[10px] text-neutral-400 dark:text-neutral-500 hidden sm:inline">
                              {t('dashboard.daysLeft', { days: daysLeft })}
                            </span>
                            <button
                              onClick={() => handleRestoreNote(note.id)}
                              className="px-2.5 py-1 bg-emerald-50 dark:bg-emerald-950/40 hover:bg-emerald-100 dark:hover:bg-emerald-900/60 text-emerald-700 dark:text-emerald-300 border border-emerald-200 dark:border-emerald-800 rounded-lg text-xs font-medium transition cursor-pointer flex items-center space-x-1"
                              title={t('dashboard.restore')}
                            >
                              <RotateCcw className="w-3 h-3" />
                              <span>{t('dashboard.restore')}</span>
                            </button>
                            <button
                              onClick={() => handlePermanentDeleteNote(note)}
                              className="p-1 text-neutral-400 hover:text-red-600 transition cursor-pointer"
                              title={t('dashboard.deletePermanently')}
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                            </button>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 1: TO-DO LIST AKTIF */}
            {(activeTab === 'all' || activeTab === 'todos' || activeTab === 'reminders') && (
              <section className="space-y-3">
                {/* Section header - desktop shows full controls, mobile is minimal */}
                <div className="hidden md:flex items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  {/* Title + Count + View Switcher */}
                  <div className="flex items-center gap-2">
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <CheckSquare className="w-3.5 h-3.5 text-neutral-500" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {activeTab === 'reminders' ? labels.remindersTab : labels.todosTab}
                      </h2>
                      <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-full font-mono font-medium">{filteredActiveTodos.length}</span>
                    </div>
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700 text-xs shrink-0">
                      <button type="button" onClick={() => toggleViewMode('list')} className={`flex items-center space-x-1 px-2 py-1 rounded-md font-medium transition cursor-pointer ${taskViewMode === 'list' ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-neutral-100 shadow-2xs' : 'text-neutral-500 dark:text-neutral-400'}`} title="List View">
                        <List className="w-3.5 h-3.5" /><span>{t('dashboard.viewList')}</span>
                      </button>
                      <button type="button" onClick={() => toggleViewMode('board')} className={`flex items-center space-x-1 px-2 py-1 rounded-md font-medium transition cursor-pointer ${taskViewMode === 'board' ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-neutral-100 shadow-2xs' : 'text-neutral-500 dark:text-neutral-400'}`} title="Board View">
                        <Columns3 className="w-3.5 h-3.5" /><span>{t('dashboard.viewBoard')}</span>
                      </button>
                    </div>
                    {taskViewMode === 'board' && (
                      <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700 text-xs shrink-0 space-x-0.5">
                        <button type="button" onClick={() => boardRef.current?.scrollBy({ left: -320, behavior: 'smooth' })} className="p-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#282828] transition cursor-pointer"><ChevronLeft className="w-3.5 h-3.5" /></button>
                        <button type="button" onClick={() => boardRef.current?.scrollBy({ left: 320, behavior: 'smooth' })} className="p-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#282828] transition cursor-pointer"><ChevronRight className="w-3.5 h-3.5" /></button>
                      </div>
                    )}
                  </div>
                  {/* Desktop Controls */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {taskViewMode === 'list' && (
                      <button type="button" onClick={toggleGroupByStatus} className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${isGroupedByStatus ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-2xs' : 'bg-white dark:bg-[#232323] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'}`} title={t('dashboard.groupByStatus')}>
                        <Layers className="w-3.5 h-3.5" /><span>{t('dashboard.groupByStatus')}</span>
                      </button>
                    )}
                    <button type="button" onClick={() => setIsStatusManagerOpen(true)} className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-[#232323] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer" title={t('dashboard.statusBtn')}>
                      <Settings2 className="w-3.5 h-3.5 text-neutral-500" /><span>{t('dashboard.statusBtn')}</span>
                    </button>
                    <div className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1">
                      <ArrowUpDown className="w-3 h-3 text-neutral-400 shrink-0" />
                      <select value={todoSortBy} onChange={(e) => setTodoSortBy(e.target.value)} className="bg-transparent focus:outline-none cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-200">
                        <option value="created_desc" className="dark:bg-[#232323]">{t('dashboard.sortLatest')}</option>
                        <option value="created_asc" className="dark:bg-[#232323]">{t('dashboard.sortOldest')}</option>
                        <option value="due_date_asc" className="dark:bg-[#232323]">{t('dashboard.sortDueNearest')}</option>
                        <option value="due_date_desc" className="dark:bg-[#232323]">{t('dashboard.sortDueFurthest')}</option>
                        <option value="priority_desc" className="dark:bg-[#232323]">{t('dashboard.sortPriorityHighest')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Mobile: minimal section header - just title + count */}
                <div className="md:hidden flex items-center space-x-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <CheckSquare className="w-3.5 h-3.5 text-neutral-500" />
                  <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300">{activeTab === 'reminders' ? labels.remindersTab : labels.todosTab}</h2>
                  <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-full font-mono">{filteredActiveTodos.length}</span>
                </div>

                {/* Quick Add Bar - Collapsible on mobile */}
                {activeTab !== 'reminders' && (
                  <form onSubmit={handleAddTodo} className="bg-white dark:bg-[#202020] rounded-xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs overflow-hidden">
                    {/* Baris 1: Input + Add button (always visible) */}
                    <div className="flex items-center gap-2 px-3 py-2.5">
                      <input
                        type="text"
                        maxLength={200}
                        placeholder={isEn ? '+ Add a task...' : '+ Tambah tugas...'}
                        value={newTaskTitle}
                        onFocus={() => setQuickAddExpanded(true)}
                        onChange={(e) => { setNewTaskTitle(e.target.value); if (e.target.value) setQuickAddExpanded(true); }}
                        className="flex-1 text-sm bg-transparent focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium text-neutral-800 dark:text-neutral-100"
                      />
                      {/* Expand toggle on mobile when not expanded */}
                      {!quickAddExpanded && (
                        <button type="button" onClick={() => setQuickAddExpanded(true)}
                          className="md:hidden p-1.5 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 transition cursor-pointer shrink-0"
                          title={t('dashboard.advancedOptions')}
                        >
                          <ChevronDown className="w-4 h-4" />
                        </button>
                      )}
                      <button
                        type="submit"
                        disabled={isSubmittingTask || !newTaskTitle.trim()}
                        className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center space-x-1 disabled:opacity-40 cursor-pointer shadow-xs shrink-0"
                      >
                        {isSubmittingTask ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                        <span className="hidden sm:inline">{t('dashboard.saveTaskBtn')}</span>
                      </button>
                    </div>

                    {/* Baris 2: Options - collapsed by default on mobile, always visible on desktop */}
                    <div className={`${quickAddExpanded ? 'flex' : 'hidden md:flex'} items-center justify-between gap-2 px-3 pb-3 pt-0.5 border-t border-neutral-100 dark:border-neutral-800`}>
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Prioritas Chip */}
                        <div className="flex items-center space-x-1 bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] border border-neutral-200/80 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs transition">
                          <Flag className="w-3 h-3 text-neutral-400 shrink-0" />
                          <select value={newTaskPriority} onChange={(e) => setNewTaskPriority(e.target.value)} className="bg-transparent focus:outline-none text-xs font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer max-w-[70px] sm:max-w-none" title={t('dashboard.priorityChip')}>
                            <option value="urgent" className="dark:bg-[#282828]">{t('dashboard.priorityUrgent')}</option>
                            <option value="high" className="dark:bg-[#282828]">{t('dashboard.priorityHigh')}</option>
                            <option value="medium" className="dark:bg-[#282828]">{t('dashboard.priorityMedium')}</option>
                            <option value="low" className="dark:bg-[#282828]">{t('dashboard.priorityLow')}</option>
                          </select>
                        </div>

                        {/* Jatuh Tempo Chip */}
                        <div className="flex items-center space-x-1 bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] border border-neutral-200/80 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs transition">
                          <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                          <input type="date" value={newTaskDate} title={t('dashboard.dueDateChip')} onChange={(e) => setNewTaskDate(e.target.value)}
                            className="bg-transparent focus:outline-none text-xs text-neutral-700 dark:text-neutral-200 cursor-pointer w-[90px] sm:w-auto" />
                        </div>

                        {/* Tombol Opsi Catatan */}
                        <button type="button" onClick={() => setShowTodoAdvanced(!showTodoAdvanced)}
                          className={`text-xs px-2 py-1 rounded-lg border transition cursor-pointer flex items-center space-x-1 ${showTodoAdvanced || newTaskDesc || newTaskReminderDate || todoFile ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100' : 'bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] text-neutral-600 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700'}`}
                          title={t('dashboard.advancedOptions')}
                        >
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span>{showTodoAdvanced ? t('dashboard.closeDetails') : t('dashboard.advancedOptions')}</span>
                        </button>
                      </div>

                      {/* Collapse button on mobile */}
                      <button type="button" onClick={() => setQuickAddExpanded(false)}
                        className="md:hidden p-1 text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-200 cursor-pointer shrink-0"
                        title="Collapse"
                      >
                        <ChevronUp className="w-3.5 h-3.5" />
                      </button>
                    </div>

                    {showTodoAdvanced && (
                      <div className="pt-2.5 border-t border-neutral-100 dark:border-neutral-800 space-y-2.5 animate-in fade-in">
                        <div>
                          <textarea
                            rows={2}
                            maxLength={2000}
                            placeholder={t('dashboard.notesChecklistPlaceholder')}
                            value={newTaskDesc}
                            onChange={(e) => setNewTaskDesc(e.target.value)}
                            className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 leading-relaxed"
                          />
                        </div>

                        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-2">
                          <div className="flex items-center space-x-2">
                            <label className="text-xs text-neutral-600 dark:text-neutral-300 font-medium flex items-center space-x-1">
                              <Bell className="w-3.5 h-3.5 text-amber-600" />
                              <span>{t('dashboard.remindMe')}</span>
                            </label>
                            <input
                              type="date"
                              value={newTaskReminderDate}
                              onChange={(e) => setNewTaskReminderDate(e.target.value)}
                              className="text-xs bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-600 dark:text-neutral-200 rounded-lg px-2 py-1 focus:outline-none"
                            />
                          </div>

                          <div className="flex items-center space-x-2">
                            <input
                              type="file"
                              ref={todoFileInputRef}
                              onChange={handleTodoFileChange}
                              accept="image/*,video/mp4"
                              className="hidden"
                              id="todo-file-input"
                            />
                            <label
                              htmlFor="todo-file-input"
                              className="text-xs text-neutral-600 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-neutral-100 dark:bg-[#282828] hover:bg-neutral-200 dark:hover:bg-[#323232] border border-neutral-200/60 dark:border-neutral-700 px-2.5 py-1 rounded-lg cursor-pointer transition flex items-center space-x-1"
                            >
                              <Paperclip className="w-3 h-3" />
                              <span>{todoFile ? t('dashboard.changePhoto') : t('dashboard.attachPhoto')}</span>
                            </label>
                            {todoFile && (
                              <div className="flex items-center space-x-1">
                                {todoFileType === 'image' && (
                                  <img src={todoFilePreview} alt="Preview" className="w-6 h-6 rounded object-cover" />
                                )}
                                <span className="text-[10px] text-neutral-500 dark:text-neutral-400 truncate max-w-[80px]">{todoFile.name}</span>
                                <button type="button" onClick={clearTodoFile} className="text-neutral-400 hover:text-red-500">
                                  <X className="w-3 h-3" />
                                </button>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    )}
                  </form>
                )}

                {/* TAMPILAN TUGAS: KOLOM (BOARD) VS BARIS (LIST) */}
                {taskViewMode === 'board' ? (
                  /* MODE KOLOM BERSIH (KANBAN BOARD) */
                  <div 
                    ref={boardRef}
                    className="flex gap-3 sm:gap-4 overflow-x-auto pb-3 pt-1 items-start scroll-smooth snap-x snap-mandatory sm:snap-none -mx-3.5 px-3.5 sm:mx-0 sm:px-0"
                  >
                    {taskStatuses.map((status) => {
                      const todosInStatus = filteredActiveTodos.filter(t => {
                        const sId = getTaskStatusId(t);
                        return sId === status.id;
                      });

                      return (
                        <div
                          key={status.id}
                          className="w-[82vw] max-w-[300px] sm:w-72 shrink-0 bg-[#F7F6F3]/90 dark:bg-[#202020] border border-neutral-200/80 dark:border-neutral-800 rounded-2xl p-3 flex flex-col shadow-2xs max-h-[calc(100vh-270px)] min-h-[420px] snap-center sm:snap-align-none"
                        >
                          {/* Header Kolom - Pinned di Atas */}
                          <div className="flex items-center space-x-2 px-1 pb-2.5 mb-2 border-b border-neutral-200/60 dark:border-neutral-800 shrink-0">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${normalizeStatusColor(status.color)}`}>
                              {status.label}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono font-medium">
                              ({todosInStatus.length})
                            </span>
                          </div>

                          {/* Kartu dalam Kolom - Scroll Vertikal Mandiri */}
                          <div className="flex-1 overflow-y-auto space-y-2.5 pr-1 focus:outline-none">
                            {todosInStatus.length === 0 ? (
                              <div className="h-32 flex items-center justify-center text-xs text-neutral-400 dark:text-neutral-500 border border-dashed border-neutral-200/80 dark:border-neutral-800 rounded-xl bg-white/40 dark:bg-[#252525]/40">
                                {t('dashboard.noTasksInStatus')}
                              </div>
                            ) : (
                              todosInStatus.map(todo => {
                                const reminderActive = isReminderActive(todo);
                                return (
                                  <div
                                    key={todo.id}
                                    className={`group/card bg-white dark:bg-[#262626] border rounded-xl p-3 shadow-2xs hover:shadow-xs transition space-y-2.5 ${
                                      reminderActive 
                                        ? 'border-amber-300 dark:border-amber-700 bg-amber-50/20 dark:bg-amber-950/20' 
                                        : 'border-neutral-200/80 dark:border-neutral-700/80 hover:border-neutral-300 dark:hover:border-neutral-600'
                                    }`}
                                  >
                                    {/* Card Header: Prioritas di kiri & Selector Pindah di kanan */}
                                    <div className="flex items-center justify-between">
                                      <div>
                                        {renderPriorityBadge(todo.priority)}
                                      </div>
                                      <div className="relative" onClick={(e) => e.stopPropagation()}>
                                        <select
                                          value={status.id}
                                          onChange={(e) => handleUpdateTaskStatus(todo.id, e.target.value)}
                                          className="text-[10px] text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 bg-neutral-50 dark:bg-[#303030] hover:bg-neutral-100 dark:hover:bg-[#383838] border border-neutral-200/70 dark:border-neutral-700 rounded-md px-1.5 py-0.5 cursor-pointer focus:outline-none transition"
                                          title="Pindahkan ke status lain"
                                        >
                                          {taskStatuses.map(s => (
                                            <option key={s.id} value={s.id} className="dark:bg-[#303030]">
                                              {s.id === status.id ? s.label : `→ ${s.label}`}
                                            </option>
                                          ))}
                                        </select>
                                      </div>
                                    </div>

                                    {/* Card Title & Checkbox */}
                                    <div className="flex items-start space-x-2.5">
                                      <button
                                        onClick={() => handleToggleTodo(todo.id, todo.is_completed)}
                                        className="text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition cursor-pointer shrink-0 mt-0.5"
                                        title={todo.is_completed ? 'Tandai belum selesai' : 'Tandai selesai'}
                                      >
                                        {todo.is_completed ? (
                                          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                                        ) : (
                                          <Circle className="w-4 h-4" />
                                        )}
                                      </button>
                                      <div
                                        onClick={() => openEditTodoModal(todo)}
                                        className="cursor-pointer flex-1 min-w-0"
                                      >
                                        <h4 className={`text-xs font-semibold leading-snug line-clamp-2 hover:underline ${
                                          todo.is_completed ? 'line-through text-neutral-400 dark:text-neutral-500' : 'text-neutral-800 dark:text-neutral-100'
                                        }`}>
                                          {todo.title}
                                        </h4>
                                      </div>
                                    </div>

                                    {todo.description && (
                                      <p
                                        onClick={() => openEditTodoModal(todo)}
                                        className="text-[11px] text-neutral-500 dark:text-neutral-400 line-clamp-2 cursor-pointer hover:text-neutral-700 dark:hover:text-neutral-300 pl-6"
                                      >
                                        💬 {todo.description}
                                      </p>
                                    )}

                                    {Array.isArray(todo.subtasks) && todo.subtasks.length > 0 && (() => {
                                      const doneCount = todo.subtasks.filter(s => s.completed).length;
                                      const totalCount = todo.subtasks.length;
                                      const pct = Math.round((doneCount / totalCount) * 100);
                                      return (
                                        <div 
                                          onClick={() => openEditTodoModal(todo)}
                                          className="pl-6 space-y-1 cursor-pointer group/st"
                                        >
                                          <div className="flex items-center justify-between text-[10px] text-neutral-500 dark:text-neutral-400">
                                            <span className="flex items-center space-x-1">
                                              <CheckSquare className="w-3 h-3 text-emerald-600 dark:text-emerald-400" />
                                              <span>{isEn ? 'Subtasks' : 'Subtugas'}</span>
                                            </span>
                                            <span className="font-medium font-mono">{doneCount}/{totalCount} ({pct}%)</span>
                                          </div>
                                          <div className="w-full bg-neutral-100 dark:bg-neutral-800 h-1.5 rounded-full overflow-hidden">
                                            <div 
                                              className="bg-emerald-500 h-full rounded-full transition-all duration-300"
                                              style={{ width: `${pct}%` }}
                                            />
                                          </div>
                                        </div>
                                      );
                                    })()}

                                    {/* Lampiran Foto */}
                                    {todo.media_url && (
                                      <div 
                                        onClick={() => setLightboxMedia({ url: todo.media_url, type: todo.media_type, title: todo.title })}
                                        className="relative h-24 rounded-lg overflow-hidden border border-neutral-100 dark:border-neutral-800 cursor-zoom-in group/media"
                                      >
                                        <img src={todo.media_url} alt="Attachment" className="w-full h-full object-cover group-hover/media:scale-105 transition" />
                                        <div className="absolute inset-0 bg-black/20 opacity-0 group-hover/media:opacity-100 flex items-center justify-center text-white text-xs transition">
                                          <ZoomIn className="w-4 h-4" />
                                        </div>
                                      </div>
                                    )}

                                    {/* Card Footer */}
                                    <div className="flex items-center justify-between pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[11px]">
                                      <div className="flex items-center space-x-1.5 flex-wrap gap-y-1">
                                        {todo.due_date && renderDateBadge(todo.due_date)}
                                        {todo.reminder_date && (
                                          <span className={`inline-flex items-center space-x-1 text-[10px] px-1.5 py-0.5 rounded font-mono ${
                                            reminderActive ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-200 font-semibold' : 'bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400'
                                          }`}>
                                            <Bell className="w-2.5 h-2.5" />
                                            <span>{format(parseISO(todo.reminder_date), 'dd MMM', { locale: currentLocale })}</span>
                                          </span>
                                        )}
                                      </div>
                                      <div className="flex items-center space-x-1 opacity-70 sm:opacity-0 sm:group-hover/card:opacity-100 transition">
                                        <button
                                          onClick={() => handleSoftDeleteTodo(todo.id)}
                                          className="text-neutral-400 hover:text-red-600 p-1 cursor-pointer"
                                          title={labels.moveToTrash}
                                        >
                                          <Trash2 className="w-3.5 h-3.5" />
                                        </button>
                                      </div>
                                    </div>
                                  </div>
                                );
                              })
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : isGroupedByStatus ? (
                  /* MODE BARIS DIKELOMPOKKAN PER STATUS */
                  <div className="space-y-6">
                    {taskStatuses.map(status => {
                      const todosInGroup = filteredActiveTodos.filter(t => {
                        const sId = getTaskStatusId(t);
                        return sId === status.id;
                      });

                      return (
                        <div key={status.id} className="space-y-2">
                          <div className="flex items-center space-x-2 px-1 pb-1.5 border-b border-neutral-200/60 dark:border-neutral-800">
                            <span className={`px-2.5 py-0.5 rounded-full text-xs font-semibold border ${normalizeStatusColor(status.color)}`}>
                              {status.label}
                            </span>
                            <span className="text-xs text-neutral-400 font-mono font-medium">({todosInGroup.length})</span>
                          </div>

                          <div className="space-y-2">
                            {todosInGroup.length === 0 ? (
                              <div className="text-xs text-neutral-400 dark:text-neutral-500 italic py-3 px-4 bg-white/40 dark:bg-[#202020]/40 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                                {isEn ? `No tasks with status "${status.label}"` : `Tidak ada tugas berstatus "${status.label}"`}
                              </div>
                            ) : (
                              todosInGroup.map(todo => renderTaskRow(todo, true))
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                ) : (
                  /* MODE BARIS STANDAR (FLAT LIST) */
                  <div className="space-y-2">
                    {filteredActiveTodos.length === 0 ? (
                      <div className="text-center py-6 text-neutral-400 dark:text-neutral-500 text-xs italic bg-white/40 dark:bg-[#202020]/40 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                        {activeTab === 'reminders' 
                          ? t('dashboard.emptyReminders')
                          : t('dashboard.emptyTodos')}
                      </div>
                    ) : (
                      filteredActiveTodos.map(todo => renderTaskRow(todo, false))
                    )}
                  </div>
                )}
              </section>
            )}

            {/* SECTION 2: CATATAN & MEDIA AKTIF (MULTI-MEDIA GRID) */}
            {(activeTab === 'all' || activeTab === 'notes') && (
              <section className="space-y-4 pt-4">
                <div className="flex items-center justify-between pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  <h2 className="text-sm font-semibold uppercase tracking-wider text-neutral-500 dark:text-neutral-400 flex items-center space-x-2">
                    <FileText className="w-4 h-4" />
                    <span>{labels.notesTab}</span>
                  </h2>
                  <button
                    onClick={() => {
                      clearNoteCreateModal();
                      setShowNoteModal(true);
                    }}
                    className="text-xs font-medium text-neutral-700 dark:text-neutral-200 bg-neutral-200/60 dark:bg-neutral-800 hover:bg-neutral-200 dark:hover:bg-neutral-700 px-3 py-1.5 rounded-lg flex items-center space-x-1.5 transition cursor-pointer"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isEn ? 'New Note & Media' : 'Catatan & Media Baru'}</span>
                  </button>
                </div>

                {/* Grid Catatan */}
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  {filteredActiveNotes.length === 0 ? (
                    <div className="col-span-full text-center py-8 text-neutral-400 dark:text-neutral-500 text-xs italic bg-white/40 dark:bg-[#202020]/40 rounded-xl border border-dashed border-neutral-200 dark:border-neutral-800">
                      {t('dashboard.emptyNotes')}
                    </div>
                  ) : (
                    filteredActiveNotes.map((note) => {
                      const mediaCount = getNoteMediaItems(note).length;
                      return (
                        <div
                          key={note.id}
                          className="group bg-white dark:bg-[#232323] border border-neutral-200/80 dark:border-neutral-800 rounded-xl overflow-hidden flex flex-col justify-between hover:shadow-md hover:border-neutral-300 dark:hover:border-neutral-700 transition"
                        >
                          {/* Render Galeri Media Catatan */}
                          {renderNoteCardMedia(note)}

                          {/* Konten Catatan */}
                          <div 
                            onClick={() => openEditNoteModal(note)}
                            className="p-4 flex-1 cursor-pointer"
                          >
                            <div className="flex items-center justify-between mb-2">
                              <span className="text-2xl">{note.icon_emoji || '📝'}</span>
                              <div className="flex items-center space-x-1">
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    openEditNoteModal(note);
                                  }}
                                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 transition p-1 cursor-pointer"
                                  title="Edit catatan"
                                >
                                  <Edit3 className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  type="button"
                                  onClick={(e) => {
                                    e.stopPropagation();
                                    handleSoftDeleteNote(note.id);
                                  }}
                                  className="opacity-70 sm:opacity-0 sm:group-hover:opacity-100 text-neutral-400 hover:text-red-600 transition p-1 cursor-pointer"
                                  title={labels.moveToTrash}
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                            <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100 mb-1 line-clamp-1 hover:underline">
                              {note.title}
                            </h3>
                            <p className="text-xs text-neutral-600 dark:text-neutral-300 line-clamp-3 whitespace-pre-wrap leading-relaxed">
                              {note.content || t('dashboard.noExtraText')}
                            </p>
                          </div>

                          <div className="px-4 pb-3 pt-1 border-t border-neutral-100 dark:border-neutral-800 text-[10px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between">
                            <span>{format(parseISO(note.created_at), 'dd MMM yyyy', { locale: currentLocale })}</span>
                            {mediaCount > 0 && (
                              <span className="inline-flex items-center space-x-1 text-neutral-500 dark:text-neutral-400 font-mono text-[9px] bg-neutral-100 dark:bg-neutral-800 px-1.5 py-0.5 rounded">
                                <Paperclip className="w-2.5 h-2.5" />
                                <span>{mediaCount} media</span>
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            )}
          </>
        )}
      </main>

      {/* 1. MODAL EDIT CATATAN (MULTI-MEDIA: MAKS 5 FOTO & 1 VIDEO) */}
      {editingNote && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.editNoteTitle')}</h3>
              <button 
                onClick={() => setEditingNote(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateNote} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={editNoteEmoji}
                  onChange={(e) => setEditNoteEmoji(e.target.value)}
                  className="w-12 text-center text-xl bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                  title="Ganti emoji"
                  maxLength={2}
                />
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editNoteTitle}
                  onChange={(e) => setEditNoteTitle(e.target.value)}
                  placeholder={t('dashboard.noteTitlePlaceholder')}
                  className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 font-medium"
                />
              </div>

              <div>
                <textarea
                  rows={4}
                  maxLength={30000}
                  value={editNoteContent}
                  onChange={(e) => setEditNoteContent(e.target.value)}
                  placeholder={t('dashboard.noteContentPlaceholder')}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 leading-relaxed"
                />
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right">
                  {editNoteContent.length} / 30.000 karakter
                </div>
              </div>

              {/* Lampiran Media (5 Foto + 1 Video) */}
              <div className="p-3 bg-neutral-50 dark:bg-[#262626] border border-neutral-200/90 dark:border-neutral-700 rounded-xl space-y-2.5">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-300 flex items-center space-x-1.5">
                    <Paperclip className="w-3.5 h-3.5 text-neutral-500" />
                    <span>{t('dashboard.mediaAttachmentTitle')}</span>
                  </label>
                  <span className="text-[10px] text-neutral-400 dark:text-neutral-500">
                    {editExistingMedia.length + editNewPhotos.length + (editNewVideo ? 1 : 0)} media
                  </span>
                </div>

                {/* Galeri Media yang Sudah Ada */}
                {editExistingMedia.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{t('dashboard.currentMedia')}</span>
                    <div className="grid grid-cols-4 gap-2">
                      {editExistingMedia.map((m, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 h-16 group/thumb">
                          {m.type === 'video' ? (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-white text-[10px]">
                              🎬 Video
                            </div>
                          ) : (
                            <img src={m.url} alt="Media" className="w-full h-full object-cover" />
                          )}
                          <button
                            type="button"
                            onClick={() => removeEditExistingMedia(idx)}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-0.5 rounded-full transition cursor-pointer"
                            title="Hapus media ini"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Foto Baru yang Ditambahkan */}
                {editNewPhotos.length > 0 && (
                  <div className="space-y-1">
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500">{t('dashboard.newPhotosToUpload')}</span>
                    <div className="grid grid-cols-4 gap-2">
                      {editNewPhotos.map((p, idx) => (
                        <div key={idx} className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 h-16">
                          <img src={p.preview} alt="New" className="w-full h-full object-cover" />
                          <button
                            type="button"
                            onClick={() => setEditNewPhotos(editNewPhotos.filter((_, i) => i !== idx))}
                            className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-0.5 rounded-full transition cursor-pointer"
                          >
                            <X className="w-3 h-3" />
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Preview Video Baru yang Ditambahkan */}
                {editNewVideo && (
                  <div className="flex items-center justify-between p-2 bg-white dark:bg-[#202020] rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                    <div className="flex items-center space-x-1.5 truncate">
                      <Film className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                      <span className="truncate text-neutral-800 dark:text-neutral-200">{editNewVideo.name}</span>
                    </div>
                    <button type="button" onClick={() => setEditNewVideo(null)} className="text-neutral-400 hover:text-red-600">
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                )}

                {/* Tombol Tambah Foto & Tambah Video */}
                <div className="flex items-center gap-2 pt-1">
                  <input
                    type="file"
                    ref={editNotePhotoInputRef}
                    onChange={handleEditNotePhotosSelect}
                    multiple
                    accept="image/*"
                    className="hidden"
                    id="edit-note-photos-input"
                  />
                  <label
                    htmlFor="edit-note-photos-input"
                    className="text-xs bg-white dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center space-x-1 shadow-2xs"
                  >
                    <Image className="w-3.5 h-3.5 text-blue-600" />
                    <span>+ {t('dashboard.uploadPhoto')}</span>
                  </label>

                  <input
                    type="file"
                    ref={editNoteVideoInputRef}
                    onChange={handleEditNoteVideoSelect}
                    accept="video/mp4,video/webm"
                    className="hidden"
                    id="edit-note-video-input"
                  />
                  <label
                    htmlFor="edit-note-video-input"
                    className="text-xs bg-white dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center space-x-1 shadow-2xs"
                  >
                    <Film className="w-3.5 h-3.5 text-emerald-600" />
                    <span>+ {t('dashboard.uploadVideo')}</span>
                  </label>

                  {isCompressingEditPhotos && (
                    <span className="text-xs text-neutral-400 flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Mengompres...</span>
                    </span>
                  )}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleSoftDeleteNote(editingNote.id)}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('dashboard.moveToTrash')}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingNote(null)}
                    className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingNote || isCompressingEditPhotos}
                    className="px-4 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                  >
                    {isUpdatingNote ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('common.saving')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('dashboard.saveNoteBtn')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 2. MODAL EDIT TUGAS */}
      {editingTodo && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <span className="text-xs font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('dashboard.editTaskModalTitle')}</span>
              <button 
                onClick={() => setEditingTodo(null)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <form onSubmit={handleUpdateTodo} className="space-y-4">
              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1">{t('dashboard.taskTitleLabel')}</label>
                <input
                  type="text"
                  required
                  maxLength={200}
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 font-medium"
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-3 p-3 bg-neutral-50/80 dark:bg-[#262626] rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center space-x-1">
                    <Layers className="w-3 h-3 text-neutral-500" />
                    <span>{t('dashboard.statusLabel')}</span>
                  </label>
                  <select
                    value={editStatus}
                    onChange={(e) => setEditStatus(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-1.5 focus:outline-none font-medium cursor-pointer"
                  >
                    {taskStatuses.map(s => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center space-x-1">
                    <Flag className="w-3 h-3 text-neutral-500" />
                    <span>{t('dashboard.priorityChip')}</span>
                  </label>
                  <select
                    value={editPriority}
                    onChange={(e) => setEditPriority(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-1.5 focus:outline-none font-medium cursor-pointer"
                  >
                    <option value="urgent">{t('dashboard.priorityUrgent')}</option>
                    <option value="high">{t('dashboard.priorityHigh')}</option>
                    <option value="medium">{t('dashboard.priorityMedium')}</option>
                    <option value="low">{t('dashboard.priorityLow')}</option>
                  </select>
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center space-x-1">
                    <Calendar className="w-3 h-3 text-neutral-500" />
                    <span>{t('dashboard.dueDateChip')}</span>
                  </label>
                  <input
                    type="date"
                    value={editDueDate}
                    onChange={(e) => setEditDueDate(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg p-1.5 focus:outline-none"
                  />
                </div>

                <div>
                  <label className="block text-[11px] font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center space-x-1">
                    <Bell className="w-3 h-3 text-amber-600" />
                    <span>{t('dashboard.remindMe')}</span>
                  </label>
                  <input
                    type="date"
                    value={editReminderDate}
                    onChange={(e) => setEditReminderDate(e.target.value)}
                    className="w-full text-xs bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-700 text-neutral-700 dark:text-neutral-200 rounded-lg p-1.5 focus:outline-none"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center space-x-1">
                  <MessageSquare className="w-3 h-3" />
                  <span>{t('dashboard.notesLabel')}</span>
                </label>
                <textarea
                  rows={4}
                  maxLength={2000}
                  placeholder={t('dashboard.notesPlaceholder')}
                  value={editDesc}
                  onChange={(e) => setEditDesc(e.target.value)}
                  className="w-full px-3 py-2 text-xs bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 leading-relaxed"
                />
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right">
                  {editDesc.length} / 2.000 karakter
                </div>
              </div>

              {/* SUBTASKS & CHECKLIST */}
              <div className="space-y-2.5 p-3.5 bg-neutral-50/80 dark:bg-[#262626] rounded-xl border border-neutral-200/80 dark:border-neutral-700">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-medium text-neutral-700 dark:text-neutral-200 flex items-center space-x-1.5">
                    <CheckSquare className="w-3.5 h-3.5 text-emerald-600 dark:text-emerald-400" />
                    <span>{t('dashboard.subtasksLabel')}</span>
                  </label>
                  {editSubtasks.length > 0 && (
                    <span className="text-[11px] font-medium text-neutral-500 dark:text-neutral-400 font-mono">
                      {editSubtasks.filter(s => s.completed).length} / {editSubtasks.length} {isEn ? 'done' : 'selesai'}
                    </span>
                  )}
                </div>

                {/* Progress bar */}
                {editSubtasks.length > 0 && (
                  <div className="w-full bg-neutral-200 dark:bg-neutral-700 h-1.5 rounded-full overflow-hidden">
                    <div 
                      className="bg-emerald-500 h-full transition-all duration-300 rounded-full"
                      style={{ 
                        width: `${(editSubtasks.filter(s => s.completed).length / editSubtasks.length) * 100}%` 
                      }}
                    />
                  </div>
                )}

                {/* Subtask list */}
                {editSubtasks.length > 0 && (
                  <div className="space-y-1.5 max-h-48 overflow-y-auto pr-1">
                    {editSubtasks.map((st) => (
                      <div 
                        key={st.id} 
                        className="flex items-center space-x-2 bg-white dark:bg-[#202020] px-2.5 py-1.5 rounded-lg border border-neutral-200/70 dark:border-neutral-700 group/st"
                      >
                        <button
                          type="button"
                          onClick={() => handleToggleEditSubtask(st.id)}
                          className="text-neutral-400 hover:text-emerald-600 dark:hover:text-emerald-400 transition cursor-pointer shrink-0"
                        >
                          {st.completed ? (
                            <CheckCircle2 className="w-4 h-4 text-emerald-600 dark:text-emerald-400" />
                          ) : (
                            <Circle className="w-4 h-4" />
                          )}
                        </button>
                        <span 
                          onClick={() => handleToggleEditSubtask(st.id)}
                          className={`text-xs flex-1 cursor-pointer select-none ${
                            st.completed 
                              ? 'line-through text-neutral-400 dark:text-neutral-500' 
                              : 'text-neutral-700 dark:text-neutral-200'
                          }`}
                        >
                          {st.title}
                        </span>
                        <button
                          type="button"
                          onClick={() => handleDeleteEditSubtask(st.id)}
                          className="opacity-0 group-hover/st:opacity-100 text-neutral-400 hover:text-red-500 p-0.5 rounded transition cursor-pointer"
                          title={isEn ? 'Delete subtask' : 'Hapus subtugas'}
                        >
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}

                {/* Add new subtask input */}
                <div className="flex items-center space-x-1.5 pt-1">
                  <input
                    type="text"
                    value={newSubtaskInput}
                    onChange={(e) => setNewSubtaskInput(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') {
                        e.preventDefault();
                        handleAddEditSubtask(e);
                      }
                    }}
                    placeholder={t('dashboard.subtasksPlaceholder')}
                    className="flex-1 px-3 py-1.5 text-xs bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                  />
                  <button
                    type="button"
                    onClick={handleAddEditSubtask}
                    disabled={!newSubtaskInput.trim()}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-900 dark:bg-neutral-100 hover:bg-neutral-800 dark:hover:bg-neutral-200 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-40 cursor-pointer shrink-0 flex items-center space-x-1"
                  >
                    <Plus className="w-3 h-3" />
                    <span>{t('dashboard.addSubtaskBtn')}</span>
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-xs font-medium text-neutral-600 dark:text-neutral-300 mb-1 flex items-center space-x-1">
                  <Paperclip className="w-3 h-3" />
                  <span>{t('dashboard.photoAttachmentLabel')}</span>
                </label>

                {(editFilePreview || editMediaUrl) && (
                  <div className="relative mb-2 rounded-xl overflow-hidden border border-neutral-200 dark:border-neutral-700 bg-neutral-50 dark:bg-[#262626] p-2">
                    <button
                      type="button"
                      onClick={() => {
                        setEditFile(null);
                        setEditFilePreview(null);
                        setEditMediaUrl(null);
                      }}
                      className="absolute top-3 right-3 bg-black/70 hover:bg-black text-white p-1 rounded-full transition z-10 cursor-pointer"
                      title="Hapus foto"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                    <img 
                      src={editFilePreview || editMediaUrl} 
                      alt="Lampiran" 
                      onClick={() => setLightboxMedia({ url: editFilePreview || editMediaUrl, type: 'image', title: editTitle })}
                      className="w-full max-h-40 object-cover rounded-lg cursor-zoom-in" 
                    />
                    <span className="text-[10px] text-neutral-400 dark:text-neutral-500 block mt-1">Klik gambar untuk perbesar</span>
                  </div>
                )}

                <div className="flex items-center space-x-2">
                  <input
                    type="file"
                    ref={editTodoFileInputRef}
                    onChange={handleEditTodoFileChange}
                    accept="image/*,video/mp4"
                    className="hidden"
                    id="edit-todo-file"
                  />
                  <label
                    htmlFor="edit-todo-file"
                    className="text-xs text-neutral-700 dark:text-neutral-200 bg-neutral-100 dark:bg-[#282828] hover:bg-neutral-200 dark:hover:bg-[#323232] border border-neutral-200/60 dark:border-neutral-700 px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center space-x-1"
                  >
                    <Image className="w-3.5 h-3.5 text-blue-600" />
                    <span>{editFile || editMediaUrl ? t('dashboard.changePhoto') : t('dashboard.attachPhoto')}</span>
                  </label>
                  {isCompressingEditFile && (
                    <span className="text-xs text-neutral-400 flex items-center space-x-1">
                      <Loader2 className="w-3 h-3 animate-spin" />
                      <span>Mengompres...</span>
                    </span>
                  )}
                </div>
              </div>

              <div className="flex items-center justify-between pt-3 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={() => handleSoftDeleteTodo(editingTodo.id)}
                  className="px-3 py-1.5 text-xs text-red-600 hover:bg-red-50 dark:hover:bg-red-950/40 rounded-lg transition flex items-center space-x-1 cursor-pointer"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('dashboard.moveToTrash')}</span>
                </button>

                <div className="flex items-center space-x-2">
                  <button
                    type="button"
                    onClick={() => setEditingTodo(null)}
                    className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                  >
                    {t('common.cancel')}
                  </button>
                  <button
                    type="submit"
                    disabled={isUpdatingTodo || isCompressingEditFile}
                    className="px-4 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                  >
                    {isUpdatingTodo ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        <span>{t('common.saving')}</span>
                      </>
                    ) : (
                      <>
                        <Check className="w-3.5 h-3.5" />
                        <span>{t('dashboard.saveChanges')}</span>
                      </>
                    )}
                  </button>
                </div>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* 3. MODAL LIGHTBOX (PERBESAR FOTO & MEDIA FULLSCREEN) */}
      {lightboxMedia && (
        <div 
          onClick={() => setLightboxMedia(null)}
          className="fixed inset-0 bg-black/85 backdrop-blur-md flex flex-col items-center justify-center p-4 z-50 animate-in fade-in duration-200"
        >
          <div className="w-full max-w-4xl flex items-center justify-between pb-3 text-white">
            <h4 className="text-sm font-medium truncate max-w-md">{lightboxMedia.title || 'Foto Lampiran'}</h4>
            <div className="flex items-center space-x-3">
              <a 
                href={lightboxMedia.url} 
                target="_blank" 
                rel="noreferrer"
                onClick={(e) => e.stopPropagation()}
                className="text-neutral-400 hover:text-white transition flex items-center space-x-1 text-xs bg-white/10 px-3 py-1.5 rounded-lg"
              >
                <ExternalLink className="w-3.5 h-3.5" />
                <span>Buka Penuh</span>
              </a>
              <button 
                onClick={() => setLightboxMedia(null)}
                className="text-neutral-400 hover:text-white p-1 rounded-full bg-white/10 hover:bg-white/20 transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
          </div>

          <div 
            onClick={(e) => e.stopPropagation()} 
            className="relative max-w-4xl max-h-[80vh] flex items-center justify-center"
          >
            {lightboxMedia.type === 'video' ? (
              <video src={lightboxMedia.url} controls autoPlay className="max-w-full max-h-[80vh] rounded-xl shadow-2xl" />
            ) : (
              <img 
                src={lightboxMedia.url} 
                alt={lightboxMedia.title} 
                className="max-w-full max-h-[80vh] object-contain rounded-xl shadow-2xl select-none"
              />
            )}
          </div>
        </div>
      )}

      {/* 4. MODAL BUAT CATATAN BARU (MULTI-MEDIA: MAKS 5 FOTO & 1 VIDEO) */}
      {showNoteModal && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-lg w-full p-4 sm:p-6 shadow-xl animate-in fade-in zoom-in-95 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between mb-4 pb-2 border-b border-neutral-100 dark:border-neutral-800">
              <h3 className="text-base font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.createNoteTitle')}</h3>
              <button 
                onClick={clearNoteCreateModal}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {uploadError && (
              <div className="mb-4 p-3 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 text-red-700 dark:text-red-300 text-xs rounded-xl flex items-center space-x-2">
                <AlertCircle className="w-4 h-4 shrink-0" />
                <span>{uploadError}</span>
              </div>
            )}

            <form onSubmit={handleAddNote} className="space-y-4">
              <div className="flex gap-2">
                <input
                  type="text"
                  value={newNoteEmoji}
                  onChange={(e) => setNewNoteEmoji(e.target.value)}
                  className="w-12 text-center text-xl bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                  title="Pilih emoji"
                  maxLength={2}
                />
                <input
                  type="text"
                  required
                  maxLength={200}
                  placeholder={t('dashboard.noteTitlePlaceholder')}
                  value={newNoteTitle}
                  onChange={(e) => setNewNoteTitle(e.target.value)}
                  className="flex-1 px-3 py-2 text-sm bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 font-medium"
                />
              </div>

              <div className="space-y-1">
                <textarea
                  rows={4}
                  maxLength={30000}
                  placeholder={t('dashboard.noteContentPlaceholder')}
                  value={newNoteContent}
                  onChange={(e) => setNewNoteContent(e.target.value)}
                  className="w-full px-3 py-2 text-sm bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400 leading-relaxed"
                />
                <div className="text-[10px] text-neutral-400 dark:text-neutral-500 text-right">
                  {newNoteContent.length} / 30.000 karakter
                </div>
              </div>

              {/* Pilihan Lampiran Media */}
              <div className="p-3 bg-neutral-50 dark:bg-[#262626] border border-neutral-200/90 dark:border-neutral-700 rounded-xl space-y-3">
                <div className="flex items-center space-x-2 pb-2 border-b border-neutral-200 dark:border-neutral-700">
                  <button
                    type="button"
                    onClick={() => {
                      setMediaMode('upload');
                      setEmbedLinkInput('');
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                      mediaMode === 'upload' ? 'bg-white dark:bg-[#303030] shadow-xs text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Paperclip className="w-3 h-3" />
                    <span>Upload Foto/Video (Maks 5 Foto & 1 Video)</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      setMediaMode('embed');
                      setNotePhotos([]);
                      setNoteVideo(null);
                    }}
                    className={`text-xs px-2.5 py-1 rounded-md font-medium transition cursor-pointer flex items-center space-x-1.5 ${
                      mediaMode === 'embed' ? 'bg-white dark:bg-[#303030] shadow-xs text-neutral-900 dark:text-neutral-100' : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                    }`}
                  >
                    <Link className="w-3 h-3" />
                    <span>Embed Link (Drive / YouTube)</span>
                  </button>
                </div>

                {mediaMode === 'upload' && (
                  <div className="space-y-3">
                    {/* Galeri Preview Foto Terpilih */}
                    {notePhotos.length > 0 && (
                      <div>
                        <div className="flex items-center justify-between text-[11px] text-neutral-600 dark:text-neutral-300 mb-1.5">
                          <span>Foto Terpilih ({notePhotos.length}/5 foto):</span>
                        </div>
                        <div className="grid grid-cols-5 gap-2">
                          {notePhotos.map((item, idx) => (
                            <div key={idx} className="relative rounded-lg overflow-hidden border border-neutral-200 dark:border-neutral-700 h-16 group/item">
                              <img src={item.preview} alt="Foto" className="w-full h-full object-cover" />
                              <button
                                type="button"
                                onClick={() => removeNotePhoto(idx)}
                                className="absolute top-1 right-1 bg-black/70 hover:bg-red-600 text-white p-0.5 rounded-full transition cursor-pointer"
                                title="Hapus foto ini"
                              >
                                <X className="w-3 h-3" />
                              </button>
                              {item.ratio > 0 && (
                                <span className="absolute bottom-0 inset-x-0 bg-black/60 text-[8px] text-white text-center font-mono py-0.5">
                                  -{item.ratio}%
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Preview Video Terpilih */}
                    {noteVideo && (
                      <div className="flex items-center justify-between p-2.5 bg-white dark:bg-[#202020] rounded-lg border border-neutral-200 dark:border-neutral-700 text-xs">
                        <div className="flex items-center space-x-2 truncate">
                          <Film className="w-4 h-4 text-emerald-600 shrink-0" />
                          <span className="truncate font-medium text-neutral-800 dark:text-neutral-200">{noteVideo.name}</span>
                          <span className="text-[10px] text-neutral-400 font-mono">({noteVideo.size} MB)</span>
                        </div>
                        <button type="button" onClick={removeNoteVideo} className="text-neutral-400 hover:text-red-600">
                          <X className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}

                    {/* Tombol Input File Foto & Video */}
                    <div className="flex items-center gap-2 pt-1">
                      {notePhotos.length < 5 && (
                        <div>
                          <input
                            type="file"
                            ref={notePhotoInputRef}
                            onChange={handleNotePhotosSelect}
                            multiple
                            accept="image/*"
                            className="hidden"
                            id="modal-note-photos"
                          />
                          <label
                            htmlFor="modal-note-photos"
                            className="text-xs bg-white dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center space-x-1.5 shadow-2xs"
                          >
                            <Image className="w-3.5 h-3.5 text-blue-600" />
                            <span>+ {t('dashboard.uploadPhoto')} ({notePhotos.length}/5)</span>
                          </label>
                        </div>
                      )}

                      {!noteVideo && (
                        <div>
                          <input
                            type="file"
                            ref={noteVideoInputRef}
                            onChange={handleNoteVideoSelect}
                            accept="video/mp4,video/webm"
                            className="hidden"
                            id="modal-note-video"
                          />
                          <label
                            htmlFor="modal-note-video"
                            className="text-xs bg-white dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] text-neutral-700 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 px-3 py-1.5 rounded-lg cursor-pointer transition flex items-center space-x-1.5 shadow-2xs"
                          >
                            <Film className="w-3.5 h-3.5 text-emerald-600" />
                            <span>+ {t('dashboard.uploadVideo')}</span>
                          </label>
                        </div>
                      )}

                      {isCompressingNotePhotos && (
                        <span className="text-xs text-neutral-400 flex items-center space-x-1">
                          <Loader2 className="w-3 h-3 animate-spin" />
                          <span>Mengompres foto...</span>
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {mediaMode === 'embed' && (
                  <div className="space-y-2">
                    <input
                      type="url"
                      placeholder="Tempel link Google Drive, YouTube, atau URL gambar..."
                      value={embedLinkInput}
                      onChange={(e) => setEmbedLinkInput(e.target.value)}
                      className="w-full px-3 py-1.5 text-xs bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                    />
                    <div className="text-[10px] text-neutral-400 dark:text-neutral-500 leading-relaxed">
                      💡 <strong>Tips:</strong> Link Google Drive otomatis diubah ke viewer tanpa memakan kuota storage.
                    </div>
                  </div>
                )}
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-end space-x-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                <button
                  type="button"
                  onClick={clearNoteCreateModal}
                  className="px-3.5 py-1.5 text-xs font-medium text-neutral-600 dark:text-neutral-300 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={isSubmittingNote || isCompressingNotePhotos || !newNoteTitle.trim()}
                  className="px-4 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {isSubmittingNote ? (
                    <>
                      <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      <span>{t('common.saving')}</span>
                    </>
                  ) : (
                    <span>{t('dashboard.saveNoteBtn')}</span>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL KELOLA STATUS TUGAS */}
      {isStatusManagerOpen && (
        <div className="fixed inset-0 bg-black/40 backdrop-blur-xs flex items-center justify-center p-4 z-50 animate-in fade-in">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl max-w-md w-full p-4 sm:p-6 shadow-xl space-y-4 max-h-[90vh] overflow-y-auto">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-100 dark:border-neutral-800">
              <div className="flex items-center space-x-2">
                <Settings2 className="w-4 h-4 text-neutral-600 dark:text-neutral-400" />
                <h3 className="font-semibold text-sm text-neutral-900 dark:text-neutral-100">{t('dashboard.manageStatusTitle')}</h3>
              </div>
              <button
                onClick={() => setIsStatusManagerOpen(false)}
                className="text-neutral-400 hover:text-neutral-600 dark:hover:text-neutral-300 p-1 rounded-md cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-neutral-500 dark:text-neutral-400">
              {t('dashboard.manageStatusDesc')}
            </p>

            {/* List Status Saat Ini */}
            <div className="space-y-2">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider">{t('dashboard.statusList')}</span>
              <div className="space-y-1.5">
                {taskStatuses.map((s) => (
                  <div key={s.id} className="flex items-center justify-between p-2.5 bg-neutral-50 dark:bg-[#282828] rounded-xl border border-neutral-200/70 dark:border-neutral-700 text-xs">
                    <div className="flex items-center space-x-2">
                      <span className={`px-2.5 py-0.5 rounded-md font-medium border ${normalizeStatusColor(s.color)}`}>
                        {s.label}
                      </span>
                      {s.isLocked && (
                        <span className="text-[10px] text-neutral-400 dark:text-neutral-500 italic">{t('dashboard.systemRequired')}</span>
                      )}
                    </div>
                    {!s.isLocked && (
                      <button
                        type="button"
                        disabled={taskStatuses.filter(st => !st.isLocked).length <= 1}
                        onClick={() => handleDeleteCustomStatus(s.id)}
                        className={`p-1 transition ${
                          taskStatuses.filter(st => !st.isLocked).length <= 1
                            ? 'text-neutral-300 dark:text-neutral-600 cursor-not-allowed'
                            : 'text-neutral-400 hover:text-red-600 cursor-pointer'
                        }`}
                        title={
                          taskStatuses.filter(st => !st.isLocked).length <= 1
                            ? (isEn ? 'At least one active status is required' : 'Minimal harus ada satu status aktif')
                            : (isEn ? `Delete status ${s.label}` : `Hapus status ${s.label}`)
                        }
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Tambah Status Baru */}
            <form onSubmit={handleAddCustomStatus} className="pt-3 border-t border-neutral-100 dark:border-neutral-800 space-y-3">
              <span className="text-[11px] font-semibold text-neutral-400 dark:text-neutral-500 uppercase tracking-wider block">{t('dashboard.addNewStatus')}</span>
              <div className="space-y-2">
                <input
                  type="text"
                  placeholder={t('dashboard.newStatusPlaceholder')}
                  maxLength={30}
                  value={newStatusLabel}
                  onChange={(e) => setNewStatusLabel(e.target.value)}
                  className="w-full px-3 py-1.5 text-xs bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-100 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                />

                <div className="flex items-center space-x-2">
                  <span className="text-xs text-neutral-500 dark:text-neutral-400 shrink-0">{t('dashboard.colorLabel')}</span>
                  <select
                    value={newStatusColor}
                    onChange={(e) => setNewStatusColor(e.target.value)}
                    className="flex-1 text-xs bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 rounded-lg p-1.5 focus:outline-none cursor-pointer"
                  >
                    {STATUS_COLOR_OPTIONS.map((c, i) => (
                      <option key={i} value={c.value} className="dark:bg-[#282828]">{isEn ? c.labelEn : c.labelId}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex items-center justify-between pt-2">
                <button
                  type="button"
                  onClick={handleResetStatuses}
                  className="text-xs text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200 underline cursor-pointer"
                >
                  {t('dashboard.resetDefault')}
                </button>
                <button
                  type="submit"
                  disabled={!newStatusLabel.trim()}
                  className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>{t('dashboard.addStatusBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: BUAT WORKSPACE BARU */}
      {isCreateWsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-50 dark:bg-blue-950/50 text-blue-600 dark:text-blue-300 flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.createWorkspace')}</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{isEn ? 'Collaborate with team & friends' : 'Berkolaborasi dengan tim & teman'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsCreateWsModalOpen(false); setWsError(''); }}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {wsError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{wsError}</span>
              </div>
            )}

            {/* Status Kuota Pembuatan Workspace (Free: 1, Pro: 5) */}
            {(() => {
              const isUserPro = Boolean(user?.user_metadata?.is_upgraded || user?.user_metadata?.tier === 'pro');
              const maxOwnedWorkspaces = isUserPro ? 5 : 1;
              const ownedCount = workspaces.filter(w => w.owner_id === user?.id).length;
              const isLimitReached = ownedCount >= maxOwnedWorkspaces;

              if (isLimitReached) {
                return (
                  <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 text-xs space-y-2">
                    <div className="flex items-center space-x-1.5 font-semibold text-amber-800 dark:text-amber-300">
                      <AlertTriangle className="w-4 h-4 text-amber-600 dark:text-amber-400 shrink-0" />
                      <span>
                        {isEn 
                          ? `Workspace limit reached (${ownedCount} of ${maxOwnedWorkspaces} created)` 
                          : `Batas ruang kerja tercapai (${ownedCount} dari ${maxOwnedWorkspaces} dibuat)`}
                      </span>
                    </div>
                    <p className="text-amber-700 dark:text-amber-300 leading-relaxed">
                      {isUserPro
                        ? (isEn ? 'You have reached the maximum 5 workspaces on Ersona Pro.' : 'Anda telah mencapai batas maksimal 5 ruang kerja pada paket Ersona Pro.')
                        : (isEn ? 'Free accounts can create 1 workspace. Upgrade to Pro to create up to 5 workspaces!' : 'Akun Free dapat membuat maksimal 1 ruang kerja. Upgrade ke Ersona Pro untuk membuat hingga 5 ruang kerja!')}
                    </p>
                    {!isUserPro && (
                      <button
                        type="button"
                        onClick={() => {
                          setIsCreateWsModalOpen(false);
                          setIsSettingsOpen(true);
                        }}
                        className="px-3 py-1.5 bg-amber-500 hover:bg-amber-600 text-white rounded-lg font-medium text-xs transition cursor-pointer flex items-center space-x-1.5"
                      >
                        <Sparkles className="w-3.5 h-3.5" />
                        <span>{isEn ? 'Upgrade to Pro (5 Workspaces)' : 'Upgrade ke Ersona Pro (5 Workspace)'}</span>
                      </button>
                    )}
                  </div>
                );
              }

              return (
                <div className="flex items-center justify-between text-[11px] px-2.5 py-1.5 bg-neutral-50 dark:bg-[#282828] rounded-xl border border-neutral-200/80 dark:border-neutral-700/80">
                  <span className="text-neutral-500 dark:text-neutral-400">{isEn ? 'Your Workspace Slots:' : 'Kuota Ruang Kerja Anda:'}</span>
                  <span className="font-semibold font-mono text-neutral-800 dark:text-neutral-200">
                    {ownedCount} / {maxOwnedWorkspaces} {isEn ? 'created' : 'dibuat'} ({isUserPro ? 'PRO 5' : 'FREE 1'})
                  </span>
                </div>
              );
            })()}

            <form onSubmit={handleCreateWorkspace} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {isEn ? 'Workspace Name' : 'Nama Ruang Kerja'}
                </label>
                <input
                  type="text"
                  maxLength={100}
                  required
                  placeholder={t('dashboard.workspaceNamePlaceholder')}
                  value={newWsName}
                  onChange={(e) => setNewWsName(e.target.value)}
                  className="w-full text-xs p-2.5 bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsCreateWsModalOpen(false); setWsError(''); }}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={
                    wsActionLoading || 
                    !newWsName.trim() || 
                    (workspaces.filter(w => w.owner_id === user?.id).length >= (Boolean(user?.user_metadata?.is_upgraded || user?.user_metadata?.tier === 'pro') ? 5 : 1))
                  }
                  className="px-4 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {wsActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Plus className="w-3.5 h-3.5" />}
                  <span>{t('dashboard.createWorkspaceBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: GABUNG WORKSPACE DENGAN KODE */}
      {isJoinWsModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-md p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-emerald-50 dark:bg-emerald-950/50 text-emerald-600 dark:text-emerald-300 flex items-center justify-center">
                  <UserPlus className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{t('dashboard.joinWorkspace')}</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{isEn ? 'Join using an 8-character invite code' : 'Gabung menggunakan kode undangan 8 digit'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => { setIsJoinWsModalOpen(false); setWsError(''); }}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {wsError && (
              <div className="p-2.5 rounded-lg bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900 text-xs text-red-600 dark:text-red-300 flex items-center space-x-1.5">
                <AlertCircle className="w-3.5 h-3.5 shrink-0" />
                <span>{wsError}</span>
              </div>
            )}

            <form onSubmit={handleJoinWorkspace} className="space-y-3">
              <div>
                <label className="block text-xs font-medium text-neutral-700 dark:text-neutral-300 mb-1.5">
                  {t('dashboard.inviteCode')}
                </label>
                <input
                  type="text"
                  maxLength={12}
                  required
                  placeholder={t('dashboard.inviteCodePlaceholder')}
                  value={joinInviteCode}
                  onChange={(e) => setJoinInviteCode(e.target.value.toUpperCase())}
                  className="w-full text-sm font-mono tracking-wider text-center uppercase p-2.5 bg-neutral-50 dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 rounded-xl focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
                />
              </div>

              <div className="flex items-center justify-end space-x-2 pt-2">
                <button
                  type="button"
                  onClick={() => { setIsJoinWsModalOpen(false); setWsError(''); }}
                  className="px-3 py-1.5 text-xs text-neutral-600 dark:text-neutral-400 hover:bg-neutral-100 dark:hover:bg-neutral-800 rounded-lg transition cursor-pointer"
                >
                  {t('common.cancel')}
                </button>
                <button
                  type="submit"
                  disabled={wsActionLoading || !joinInviteCode.trim()}
                  className="px-4 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer flex items-center space-x-1.5"
                >
                  {wsActionLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <UserPlus className="w-3.5 h-3.5" />}
                  <span>{t('dashboard.joinWorkspaceBtn')}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* MODAL: MANAJEMEN ANGGOTA & PENGATURAN WORKSPACE TIM */}
      {isWsMembersModalOpen && currentWorkspace && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-xs">
          <div className="bg-white dark:bg-[#202020] border border-neutral-200 dark:border-neutral-800 rounded-2xl w-full max-w-lg p-5 shadow-2xl space-y-4 animate-in fade-in zoom-in-95 max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between shrink-0">
              <div className="flex items-center space-x-2">
                <div className="w-8 h-8 rounded-lg bg-blue-600 text-white flex items-center justify-center">
                  <Users className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-sm font-semibold text-neutral-900 dark:text-neutral-100">{currentWorkspace.name}</h3>
                  <p className="text-[11px] text-neutral-400 dark:text-neutral-500">{workspaceMembers.length} {isEn ? 'collaborators in this workspace' : 'kolaborator dalam ruang kerja ini'}</p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsWsMembersModalOpen(false)}
                className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1 cursor-pointer"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Invite Code & Link Box */}
            <div className="p-3 bg-neutral-50 dark:bg-[#282828] rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2 shrink-0">
              <div className="flex items-center justify-between text-xs">
                <span className="font-medium text-neutral-700 dark:text-neutral-300">{t('dashboard.inviteCode')}</span>
                <span className="font-mono font-bold bg-white dark:bg-[#202020] px-2 py-0.5 rounded border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100">
                  {currentWorkspace.invite_code}
                </span>
              </div>
              <button
                type="button"
                onClick={() => {
                  const inviteLink = `${window.location.origin}/workspace?join=${currentWorkspace.invite_code}`;
                  navigator.clipboard?.writeText(inviteLink);
                  setCopiedInvite(true);
                  setTimeout(() => setCopiedInvite(false), 2500);
                }}
                className="w-full flex items-center justify-center space-x-1.5 p-2 bg-white dark:bg-[#202020] hover:bg-neutral-100 dark:hover:bg-[#303030] text-neutral-800 dark:text-neutral-200 border border-neutral-200 dark:border-neutral-700 rounded-lg text-xs font-medium transition cursor-pointer"
              >
                {copiedInvite ? (
                  <>
                    <Check className="w-3.5 h-3.5 text-emerald-600 shrink-0" />
                    <span className="text-emerald-600 font-semibold">{t('dashboard.inviteLinkCopied')}</span>
                  </>
                ) : (
                  <>
                    <Copy className="w-3.5 h-3.5 text-neutral-400 shrink-0" />
                    <span>{t('dashboard.copyInviteLink')}</span>
                  </>
                )}
              </button>
            </div>

            {/* Live Sync Active Banner */}
            <div className="flex items-center space-x-2 text-[11px] text-emerald-700 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/40 p-2 rounded-lg border border-emerald-200 dark:border-emerald-900/60 shrink-0">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse"></span>
              <span>{t('dashboard.liveSyncActive')}</span>
            </div>

            {/* Daftar Anggota */}
            <div className="flex-1 overflow-y-auto space-y-1.5 min-h-[120px]">
              <div className="text-[11px] font-semibold uppercase tracking-wider text-neutral-400 dark:text-neutral-500 mb-1">
                {t('dashboard.workspaceMembers')}
              </div>
              {workspaceMembers.map(m => (
                <div key={m.id} className="flex items-center justify-between p-2 rounded-lg bg-neutral-50 dark:bg-[#252525] border border-neutral-100 dark:border-neutral-800 text-xs">
                  <div className="flex items-center space-x-2 truncate">
                    <div className="w-6 h-6 rounded-full bg-neutral-200 dark:bg-neutral-700 text-neutral-700 dark:text-neutral-300 flex items-center justify-center text-[10px] font-bold uppercase shrink-0">
                      {(m.user_email || 'U')[0]}
                    </div>
                    <span className="text-neutral-800 dark:text-neutral-200 truncate">{m.user_email || 'Member'}</span>
                    {m.user_id === user.id && (
                      <span className="text-[10px] bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1 rounded font-medium shrink-0">You</span>
                    )}
                  </div>
                  <span className={`text-[10px] px-1.5 py-0.5 rounded font-medium shrink-0 ${
                    m.role === 'owner' 
                      ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' 
                      : 'bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300'
                  }`}>
                    {m.role === 'owner' ? t('dashboard.roleOwner') : t('dashboard.roleMember')}
                  </span>
                </div>
              ))}
            </div>

            {/* Pengaturan Batas Foto Khusus Workspace */}
            <div className="p-3 bg-neutral-50 dark:bg-[#282828] rounded-xl border border-neutral-200 dark:border-neutral-700 space-y-2 shrink-0">
              <div className="flex items-center justify-between">
                <div className="flex items-center space-x-1.5 text-xs font-semibold text-neutral-800 dark:text-neutral-200">
                  <Image className="w-3.5 h-3.5 text-neutral-500" />
                  <span>{isEn ? 'Workspace Photo Limit' : 'Batas Foto Workspace'}</span>
                </div>
                {currentWorkspace.custom_photo_limit ? (
                  <span className="text-[10px] font-medium bg-blue-100 dark:bg-blue-950/60 text-blue-700 dark:text-blue-300 px-1.5 py-0.5 rounded">
                    {currentWorkspace.custom_photo_limit} {isEn ? 'photos' : 'foto'}
                  </span>
                ) : (
                  <span className="text-[10px] font-medium bg-neutral-200 dark:bg-neutral-700 text-neutral-600 dark:text-neutral-300 px-1.5 py-0.5 rounded">
                    {isEn ? 'Default (Tier limit)' : 'Default (Ikuti akun)'}
                  </span>
                )}
              </div>
              <p className="text-[11px] text-neutral-500 dark:text-neutral-400 leading-tight">
                {isEn 
                  ? 'Set a custom photo limit for this workspace, or leave blank to follow your account tier limit (Free: 50/150, Pro: 1,000).'
                  : 'Atur batas foto khusus untuk workspace ini, atau kosongkan untuk mengikuti limit akun Anda (Free: 50/150, Pro: 1.000).'}
              </p>
              {currentWorkspace.owner_id === user.id ? (
                <form onSubmit={handleSaveWorkspacePhotoLimit} className="flex items-center space-x-2 pt-1">
                  <input
                    type="number"
                    min="1"
                    placeholder={isEn ? "e.g. 100 (blank for default)" : "contoh: 100 (kosongkan = default)"}
                    value={wsCustomPhotoLimit}
                    onChange={(e) => setWsCustomPhotoLimit(e.target.value)}
                    className="flex-1 px-3 py-1.5 text-xs rounded-lg bg-white dark:bg-[#1f1f1f] border border-neutral-200 dark:border-neutral-700 text-neutral-800 dark:text-neutral-200 focus:outline-hidden focus:ring-1 focus:ring-neutral-400 dark:focus:ring-neutral-500"
                  />
                  <button
                    type="submit"
                    disabled={isSavingWsLimit}
                    className="px-3 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition disabled:opacity-50 cursor-pointer shrink-0 flex items-center space-x-1"
                  >
                    {isSavingWsLimit && <Loader2 className="w-3 h-3 animate-spin" />}
                    <span>{isEn ? 'Save' : 'Simpan'}</span>
                  </button>
                </form>
              ) : (
                <div className="text-[11px] text-neutral-500 dark:text-neutral-400 italic">
                  {isEn ? 'Only workspace owner can change photo limit.' : 'Hanya pemilik workspace yang dapat mengubah batas foto.'}
                </div>
              )}
              {wsLimitSaveMsg && (
                <div className="text-[11px] text-emerald-600 dark:text-emerald-400 font-medium flex items-center space-x-1">
                  <Check className="w-3 h-3" />
                  <span>{wsLimitSaveMsg}</span>
                </div>
              )}
            </div>

            {/* Danger Zone Actions */}
            <div className="pt-3 border-t border-neutral-100 dark:border-neutral-800 flex items-center justify-between shrink-0">
              {currentWorkspace.owner_id === user.id ? (
                <button
                  type="button"
                  onClick={() => handleDeleteWorkspace(currentWorkspace.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>{t('dashboard.deleteWorkspace')}</span>
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => handleLeaveWorkspace(currentWorkspace.id)}
                  className="text-xs text-red-600 dark:text-red-400 hover:underline cursor-pointer flex items-center space-x-1"
                >
                  <LogOut className="w-3.5 h-3.5" />
                  <span>{t('dashboard.leaveWorkspace')}</span>
                </button>
              )}
              <button
                type="button"
                onClick={() => setIsWsMembersModalOpen(false)}
                className="px-3.5 py-1.5 text-xs font-medium bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 text-white dark:text-neutral-900 rounded-lg transition cursor-pointer"
              >
                {t('common.close')}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL PENGATURAN AKUN & TAMPILAN */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => {
          setIsSettingsOpen(false);
          setIsNotifActive(isNotificationSupported() && isNotificationEnabled() && getNotificationPermission() === 'granted');
        }}
        user={user}
        todos={todos}
        notes={notes}
        workspaces={workspaces}
        activeWorkspace={currentWorkspace}
        storageUsage={storageUsage}
        onRefreshStorage={refreshStorageUsage}
        quotaConfig={quotaConfig}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onResetPreferences={handleResetPreferences}
        onToggleProTier={handleToggleProTier}
        onToggleEmailVerified={handleToggleEmailVerified}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}
