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
  Sun, Moon
} from 'lucide-react';
import { format, isPast, isToday, parseISO, differenceInDays } from 'date-fns';
import { id as localeId, enUS as localeEn } from 'date-fns/locale';
import { compressImage } from '../utils/compressor';
import { parseMediaUrl } from '../utils/embedHelper';
import SettingsModal from './SettingsModal';
import { getUserQuotaConfig, calculateUserStorageUsage, formatBytes } from '../utils/storageQuota';

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
  const { user, signOut } = useAuth();
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
    emptyTrash: t('dashboard.emptyTrash'),
  };

  // State Pengaturan & Kuota Penyimpanan
  const [isSettingsOpen, setIsSettingsOpen] = useState(false);
  const [storageUsage, setStorageUsage] = useState(0);

  const quotaConfig = getUserQuotaConfig(user);

  const refreshStorageUsage = async () => {
    if (user?.id) {
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

  // Validasi Batas Kuota Sebelum Upload File
  const validateStorageLimit = (incomingBytes) => {
    const maxBytes = quotaConfig.maxBytes;
    if (storageUsage + incomingBytes > maxBytes) {
      const currentMB = (storageUsage / (1024 * 1024)).toFixed(1);
      const maxMB = quotaConfig.maxMB;
      const fileMB = (incomingBytes / (1024 * 1024)).toFixed(1);

      let suggestion = '';
      if (!quotaConfig.isEmailConfirmed && !quotaConfig.isUpgraded) {
        suggestion = '\n\n💡 Tip: Konfirmasi email akun Anda di Pengaturan untuk menaikkan kuota menjadi 300 MB!';
      } else if (!quotaConfig.isUpgraded) {
        suggestion = '\n\n💡 Tip: Upgrade ke Ersona Pro di Pengaturan untuk mendapatkan kuota 1 GB!';
      }

      alert(`⚠️ Batas Kuota Penyimpanan Terlampaui!\n\nPenggunaan saat ini: ${currentMB} MB dari ${maxMB} MB.\nFile yang ingin diunggah: ${fileMB} MB.${suggestion}\n\nSilakan hapus file lama atau kosongkan tempat sampah.`);
      return false;
    }
    return true;
  };

  // State Data
  const [todos, setTodos] = useState([]);
  const [notes, setNotes] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('all'); // 'all', 'todos', 'notes', 'reminders', 'trash'
  const [searchQuery, setSearchQuery] = useState('');

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
    return localStorage.getItem('ersona_task_view_mode') || localStorage.getItem('solist_task_view_mode') || 'list'; // 'list' | 'board'
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

  // Helper untuk menghapus file fisik di Supabase Storage secara aman
  const deleteStorageFilesByUrls = async (urls) => {
    if (!urls || urls.length === 0) return;
    const paths = urls
      .filter(u => u && typeof u === 'string' && u.includes('/attachments/'))
      .map(u => {
        try {
          const afterBucket = u.split('/attachments/')[1];
          if (!afterBucket) return null;
          const cleanPath = afterBucket.split('?')[0];
          return decodeURIComponent(cleanPath);
        } catch {
          return null;
        }
      })
      .filter(Boolean);

    if (paths.length > 0) {
      try {
        await supabase.storage.from('attachments').remove(paths);
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

  useEffect(() => {
    fetchData();
    refreshStorageUsage();
  }, []);

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

  // Filter Data Aktif vs Sampah
  const activeTodos = todos.filter(t => !t.deleted_at);
  const activeNotes = notes.filter(n => !n.deleted_at);
  const trashTodos = todos.filter(t => Boolean(t.deleted_at));
  const trashNotes = notes.filter(n => Boolean(n.deleted_at));
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

    if (!validateStorageLimit(rawFile.size)) {
      clearTodoFile();
      return;
    }

    const isImg = rawFile.type.startsWith('image/');
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

    if (!validateStorageLimit(rawFile.size)) {
      setEditFile(null);
      setEditFilePreview(null);
      if (editTodoFileInputRef.current) editTodoFileInputRef.current.value = '';
      return;
    }

    const isImg = rawFile.type.startsWith('image/');
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
    const totalIncomingBytes = filesToProcess.reduce((acc, f) => acc + f.size, 0);
    if (!validateStorageLimit(totalIncomingBytes)) {
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
    if (file.size > 25 * 1024 * 1024) {
      setUploadError('Ukuran video maksimal 25 MB.');
      return;
    }

    if (!validateStorageLimit(file.size)) {
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
          const fileExt = item.file.name.split('.').pop();
          const safeName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { data, error } = await supabase.storage.from('attachments').upload(safeName, item.file);
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(data.path);
          return { url: publicUrl, type: 'image' };
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
        const fileExt = noteVideo.file.name.split('.').pop();
        const safeName = `${user.id}/video-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('attachments').upload(safeName, noteVideo.file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(data.path);
        mediaItems.push({ url: publicUrl, type: 'video' });
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
    const totalIncomingBytes = filesToProcess.reduce((sum, f) => sum + f.size, 0);
    if (!validateStorageLimit(totalIncomingBytes)) {
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
    if (file.size > 25 * 1024 * 1024) {
      alert('Ukuran video maksimal 25 MB.');
      return;
    }

    if (!validateStorageLimit(file.size)) {
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
          const fileExt = item.file.name.split('.').pop();
          const safeName = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(2, 7)}.${fileExt}`;
          const { data, error } = await supabase.storage.from('attachments').upload(safeName, item.file);
          if (error) throw error;
          const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(data.path);
          return { url: publicUrl, type: 'image' };
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
        const fileExt = editNewVideo.file.name.split('.').pop();
        const safeName = `${user.id}/video-${Date.now()}.${fileExt}`;
        const { data, error } = await supabase.storage.from('attachments').upload(safeName, editNewVideo.file);
        if (error) throw error;
        const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(data.path);
        finalMediaItems.push({ url: publicUrl, type: 'video' });
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
      {/* Mobile Top Header (Hanya di Layar Kecil / HP) */}
      <div className="md:hidden flex items-center justify-between px-3 py-2.5 bg-[#F7F6F3] dark:bg-[#202020] border-b border-neutral-200/80 dark:border-neutral-800 sticky top-0 z-30 shadow-2xs">
        <div className="flex items-center space-x-2 min-w-0">
          <span className="text-base">🪐</span>
          <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate max-w-[110px]">
            {user?.email?.split('@')[0]}
          </span>
          <span className="text-[10px] bg-neutral-200/70 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded font-medium shrink-0">
            {activeTab === 'reminders' ? labels.remindersTab : activeTab === 'todos' ? labels.todosTab : activeTab === 'notes' ? labels.notesTab : activeTab === 'trash' ? labels.trashTab : t('dashboard.allTab')}
          </span>
        </div>

        <div className="flex items-center space-x-1.5 shrink-0">
          {/* Mobile Theme Toggle */}
          <button
            onClick={toggleTheme}
            className="p-1.5 text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white bg-white dark:bg-[#282828] border border-neutral-200 dark:border-neutral-700 rounded-lg transition cursor-pointer"
            title={isDark ? t('common.lightMode') : t('common.darkMode')}
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />}
          </button>

          <button
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            className="p-1.5 rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#282828] text-neutral-800 dark:text-neutral-200 flex items-center space-x-1.5 text-xs font-medium cursor-pointer shadow-2xs"
          >
            {isMobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            <span className="text-xs">{isMobileMenuOpen ? t('common.close') : 'Menu'}</span>
          </button>
        </div>
      </div>

      {/* Sidebar Khas Notion (Desktop: Selalu Terbuka | Mobile: Dropdown / Tersembunyi saat tidak dipanggil) */}
      <aside className={`
        ${isMobileMenuOpen ? 'flex' : 'hidden'} md:flex
        w-full md:w-64 bg-[#F7F6F3] dark:bg-[#202020] border-b md:border-b-0 md:border-r border-neutral-200/80 dark:border-neutral-800 p-4 flex-col justify-between shrink-0
        ${isMobileMenuOpen ? 'animate-in fade-in slide-in-from-top-2' : ''}
      `}>
        <div>
          {/* User Workspace Info */}
          <div className="flex items-center justify-between pb-4 border-b border-neutral-200/60 dark:border-neutral-800 mb-4">
            <div className="flex items-center space-x-2">
              <span className="text-xl">🪐</span>
              <span className="font-semibold text-sm text-neutral-800 dark:text-neutral-100 truncate max-w-[130px]">
                {user?.email?.split('@')[0]}
              </span>
            </div>
            <button 
              onClick={signOut}
              title={t('dashboard.signOut')}
              className="text-neutral-400 hover:text-neutral-700 dark:hover:text-neutral-200 p-1.5 rounded-md hover:bg-neutral-200/50 dark:hover:bg-neutral-800 transition cursor-pointer"
            >
              <LogOut className="w-4 h-4" />
            </button>
          </div>

          {/* Navigasi / Filter */}
          <nav className="space-y-1">
            <button
              onClick={() => {
                setActiveTab('all');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center space-x-2 px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'all' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'
              }`}
            >
              <CheckSquare className="w-4 h-4 text-neutral-500" />
              <span>{t('dashboard.allTab')}</span>
            </button>

            {/* TAB PENGINGAT (REMINDERS) */}
            <button
              onClick={() => {
                setActiveTab('reminders');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'reminders' ? 'bg-amber-100/70 dark:bg-amber-950/40 text-amber-900 dark:text-amber-200 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Bell className={`w-4 h-4 ${activeReminders.length > 0 ? 'text-amber-600 animate-pulse' : 'text-neutral-500'}`} />
                <span>{labels.remindersTab}</span>
              </div>
              {activeReminders.length > 0 && (
                <span className="text-xs bg-amber-500 text-white font-bold px-1.5 py-0.2 rounded-full text-[10px]">
                  {activeReminders.length}
                </span>
              )}
            </button>

            <button
              onClick={() => {
                setActiveTab('todos');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'todos' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <CheckCircle2 className="w-4 h-4 text-emerald-600" />
                <span>{labels.todosTab}</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">
                {activeTodos.filter(t => !t.is_completed).length}
              </span>
            </button>

            <button
              onClick={() => {
                setActiveTab('notes');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'notes' ? 'bg-neutral-200/70 dark:bg-neutral-800 text-neutral-900 dark:text-neutral-100 font-semibold' : 'text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <FileText className="w-4 h-4 text-blue-600" />
                <span>{labels.notesTab}</span>
              </div>
              <span className="text-xs text-neutral-400 font-mono">{activeNotes.length}</span>
            </button>

            {/* TAB TEMPAT SAMPAH (TRASH) */}
            <button
              onClick={() => {
                setActiveTab('trash');
                setIsMobileMenuOpen(false);
              }}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium transition cursor-pointer ${
                activeTab === 'trash' ? 'bg-red-50 dark:bg-red-950/30 text-red-900 dark:text-red-300 font-semibold' : 'text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800/60'
              }`}
            >
              <div className="flex items-center space-x-2">
                <Trash2 className="w-4 h-4 text-neutral-400" />
                <span>{labels.trashTab}</span>
              </div>
              {totalTrashCount > 0 && (
                <span className="text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 font-mono px-1.5 py-0.2 rounded-full text-[10px]">
                  {totalTrashCount}
                </span>
              )}
            </button>

            {/* TOMBOL PENGATURAN */}
            <button
              onClick={() => {
                setIsSettingsOpen(true);
                setIsMobileMenuOpen(false);
              }}
              className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium text-neutral-600 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer mt-1"
            >
              <div className="flex items-center space-x-2">
                <Settings className="w-4 h-4 text-neutral-500" />
                <span>{t('dashboard.settingsTab')}</span>
              </div>
              <span className={`text-[10px] font-mono px-1.5 py-0.2 rounded font-bold uppercase ${
                quotaConfig.isUpgraded ? 'bg-amber-100 dark:bg-amber-950/50 text-amber-800 dark:text-amber-300' : 'bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300'
              }`}>
                {quotaConfig.isUpgraded ? 'PRO' : 'FREE'}
              </span>
            </button>

            {/* TOMBOL BERANDA / LANDING PAGE */}
            {onGoToLanding && (
              <button
                onClick={() => {
                  onGoToLanding();
                  setIsMobileMenuOpen(false);
                }}
                className="w-full flex items-center justify-between px-2.5 py-2 rounded-lg text-sm font-medium text-neutral-500 dark:text-neutral-400 hover:bg-neutral-200/40 dark:hover:bg-neutral-800 hover:text-neutral-900 dark:hover:text-neutral-100 transition cursor-pointer mt-0.5"
                title={t('dashboard.homeTab')}
              >
                <div className="flex items-center space-x-2">
                  <Globe className="w-4 h-4 text-neutral-400" />
                  <span>{t('dashboard.homeTab')}</span>
                </div>
              </button>
            )}
          </nav>
        </div>

        {/* Footer Sidebar & Mini Storage Widget */}
        <div className="pt-3 border-t border-neutral-200/60 dark:border-neutral-800 space-y-3">
          <div 
            onClick={() => {
              setIsSettingsOpen(true);
              setIsMobileMenuOpen(false);
            }}
            className="p-2.5 bg-neutral-200/40 dark:bg-neutral-800/40 hover:bg-neutral-200/70 dark:hover:bg-neutral-800/70 rounded-xl border border-neutral-200/60 dark:border-neutral-800 transition cursor-pointer group"
            title="Klik untuk melihat kuota storage di Pengaturan"
          >
            <div className="flex items-center justify-between text-[11px] mb-1.5">
              <div className="flex items-center space-x-1.5 font-medium text-neutral-700 dark:text-neutral-300">
                <HardDrive className="w-3.5 h-3.5 text-neutral-500 group-hover:text-neutral-900 dark:group-hover:text-white transition" />
                <span>Storage</span>
              </div>
              <span className="text-[10px] font-mono text-neutral-500 dark:text-neutral-400">
                {formatBytes(storageUsage)} / {formatBytes(quotaConfig.maxBytes)}
              </span>
            </div>
            <div className="w-full bg-neutral-200/80 dark:bg-neutral-700 rounded-full h-1.5 overflow-hidden">
              <div 
                className={`h-full rounded-full transition-all duration-300 ${
                  (storageUsage / quotaConfig.maxBytes) > 0.9 ? 'bg-red-500' :
                  (storageUsage / quotaConfig.maxBytes) > 0.7 ? 'bg-amber-500' : 'bg-emerald-500'
                }`}
                style={{ width: `${Math.min(100, Math.max(3, (storageUsage / quotaConfig.maxBytes) * 100))}%` }}
              />
            </div>
          </div>

          <div className="text-[11px] text-neutral-400 dark:text-neutral-500 flex items-center justify-between px-1">
            <span>Ersona Workspace</span>
            <span className="bg-emerald-100 dark:bg-emerald-950/40 text-emerald-800 dark:text-emerald-300 px-1.5 py-0.5 rounded text-[10px] font-mono">v1.7</span>
          </div>
        </div>
      </aside>

      {/* Konten Utama */}
      <main className="flex-1 max-w-4xl mx-auto w-full p-3 sm:p-6 md:p-10 space-y-4 sm:space-y-6 overflow-y-auto">
        {/* Search & Header Bar */}
        <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3">
          <div className="hidden md:block">
            <h1 className="text-2xl font-bold text-neutral-900 dark:text-neutral-100 flex items-center space-x-2">
              <span>{t('dashboard.workspaceTitle')}</span>
              <span className="text-xs bg-neutral-200 dark:bg-neutral-800 text-neutral-700 dark:text-neutral-300 px-2 py-0.5 rounded-full font-normal">v1.7</span>
            </h1>
            <p className="text-xs text-neutral-500 dark:text-neutral-400 mt-1">{t('dashboard.workspaceSubtitle')}</p>
          </div>

          <div className="flex items-center space-x-2 w-full sm:w-auto">
            <div className="relative flex-1 sm:w-64">
              <Search className="w-4 h-4 text-neutral-400 absolute left-3 top-2.5" />
              <input
                type="text"
                placeholder={t('dashboard.searchPlaceholder')}
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-9 pr-3 py-2 sm:py-1.5 text-xs bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 text-neutral-900 dark:text-neutral-100 placeholder:text-neutral-400 dark:placeholder:text-neutral-500 rounded-lg focus:outline-none focus:ring-1 focus:ring-neutral-800 dark:focus:ring-neutral-400"
              />
            </div>

            {/* Desktop Only: Language + Theme + Settings */}
            <div className="hidden sm:flex items-center space-x-2">
              {/* Language Switcher */}
              <button
                onClick={toggleLanguage}
                className="px-2.5 py-1.5 text-xs font-bold rounded-lg border border-neutral-200 dark:border-neutral-700 bg-white dark:bg-[#232323] text-neutral-700 dark:text-neutral-200 hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] transition cursor-pointer shrink-0"
                title="Ganti Bahasa / Switch Language"
              >
                {language.toUpperCase()}
              </button>

              {/* Dark Mode Toggle */}
              <button
                onClick={toggleTheme}
                className="p-1.5 text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] border border-neutral-200 dark:border-neutral-700 rounded-lg transition cursor-pointer shrink-0 bg-white dark:bg-[#232323]"
                title={isDark ? t('common.lightMode') : t('common.darkMode')}
              >
                {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-neutral-600 dark:text-neutral-300" />}
              </button>

              <button
                onClick={() => setIsSettingsOpen(true)}
                title={t('settings.title')}
                className="p-1.5 text-neutral-500 dark:text-neutral-300 hover:text-neutral-900 dark:hover:text-white hover:bg-neutral-100 dark:hover:bg-[#2c2c2c] border border-neutral-200 dark:border-neutral-700 rounded-lg transition cursor-pointer shrink-0 bg-white dark:bg-[#232323]"
              >
                <Settings className="w-4 h-4" />
              </button>
            </div>

            {/* Mobile Only: Settings button */}
            <button
              onClick={() => setIsSettingsOpen(true)}
              title={t('settings.title')}
              className="sm:hidden p-2 text-neutral-500 dark:text-neutral-300 bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 rounded-lg transition cursor-pointer shrink-0"
            >
              <Settings className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* BANNER PENGINGAT PRIORITAS PALING ATAS */}
        {activeReminders.length > 0 && activeTab !== 'notes' && activeTab !== 'trash' && (
          <div className="p-4 bg-amber-50 dark:bg-amber-950/30 border border-amber-200/90 dark:border-amber-800/60 rounded-2xl shadow-xs space-y-2 animate-in fade-in">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2 text-amber-900 dark:text-amber-200 font-semibold text-xs">
                <Bell className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-bounce" />
                <span>🔔 {labels.remindersTab} {t('common.active')} ({activeReminders.length} {isEn ? 'tasks need your attention' : 'Tugas Membutuhkan Perhatian Anda'})</span>
              </div>
              <button
                onClick={() => setActiveTab('reminders')}
                className="text-[11px] text-amber-800 dark:text-amber-300 underline hover:text-amber-950 dark:hover:text-amber-100 font-medium cursor-pointer"
              >
                {isEn ? `View All ${labels.remindersTab}` : `Lihat Semua ${labels.remindersTab}`}
              </button>
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
                {/* One-line compact header: title + count + view switcher + controls */}
                <div className="flex items-center justify-between gap-2 pb-2 border-b border-neutral-200 dark:border-neutral-800">
                  {/* Kiri: Title + Jumlah + View Switcher */}
                  <div className="flex items-center gap-2 min-w-0 overflow-x-auto no-scrollbar">
                    <div className="flex items-center space-x-1.5 shrink-0">
                      <CheckSquare className="w-3.5 h-3.5 text-neutral-500" />
                      <h2 className="text-xs font-semibold uppercase tracking-wider text-neutral-600 dark:text-neutral-300 whitespace-nowrap">
                        {activeTab === 'reminders' ? labels.remindersTab : labels.todosTab}
                      </h2>
                      <span className="text-xs bg-neutral-100 dark:bg-neutral-800 text-neutral-500 dark:text-neutral-400 px-1.5 py-0.5 rounded-full font-mono font-medium">
                        {filteredActiveTodos.length}
                      </span>
                    </div>

                    {/* View Switcher */}
                    <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700 text-xs shrink-0">
                      <button
                        type="button"
                        onClick={() => toggleViewMode('list')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                          taskViewMode === 'list'
                            ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                        title="List View"
                      >
                        <List className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('dashboard.viewList')}</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => toggleViewMode('board')}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-md font-medium transition cursor-pointer ${
                          taskViewMode === 'board'
                            ? 'bg-white dark:bg-[#282828] text-neutral-900 dark:text-neutral-100 shadow-2xs'
                            : 'text-neutral-500 dark:text-neutral-400 hover:text-neutral-800 dark:hover:text-neutral-200'
                        }`}
                        title="Board View"
                      >
                        <Columns3 className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('dashboard.viewBoard')}</span>
                      </button>
                    </div>

                    {/* Tombol Geser Kolom Cepat */}
                    {taskViewMode === 'board' && (
                      <div className="flex items-center bg-neutral-100 dark:bg-neutral-800/80 p-0.5 rounded-lg border border-neutral-200/80 dark:border-neutral-700 text-xs shrink-0 space-x-0.5">
                        <button
                          type="button"
                          onClick={() => boardRef.current?.scrollBy({ left: -320, behavior: 'smooth' })}
                          className="p-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#282828] hover:text-neutral-900 dark:hover:text-white transition cursor-pointer shadow-2xs"
                        >
                          <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <button
                          type="button"
                          onClick={() => boardRef.current?.scrollBy({ left: 320, behavior: 'smooth' })}
                          className="p-1 rounded-md text-neutral-600 dark:text-neutral-300 hover:bg-white dark:hover:bg-[#282828] hover:text-neutral-900 dark:hover:text-white transition cursor-pointer shadow-2xs"
                        >
                          <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    )}
                  </div>

                  {/* Kanan: Group + Statuses + Sort — compact, icon-only on mobile */}
                  <div className="flex items-center gap-1.5 shrink-0">
                    {/* Group Toggle */}
                    {taskViewMode === 'list' && (
                      <button
                        type="button"
                        onClick={toggleGroupByStatus}
                        className={`flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium border transition cursor-pointer ${
                          isGroupedByStatus
                            ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100 shadow-2xs'
                            : 'bg-white dark:bg-[#232323] text-neutral-600 dark:text-neutral-300 border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800'
                        }`}
                        title={t('dashboard.groupByStatus')}
                      >
                        <Layers className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">{t('dashboard.groupByStatus')}</span>
                      </button>
                    )}

                    {/* Status Manager */}
                    <button
                      type="button"
                      onClick={() => setIsStatusManagerOpen(true)}
                      className="flex items-center space-x-1 px-2 py-1 rounded-lg text-xs font-medium bg-white dark:bg-[#232323] text-neutral-600 dark:text-neutral-300 border border-neutral-200 dark:border-neutral-700 hover:bg-neutral-50 dark:hover:bg-neutral-800 transition cursor-pointer"
                      title={t('dashboard.statusBtn')}
                    >
                      <Settings2 className="w-3.5 h-3.5 text-neutral-500" />
                      <span className="hidden sm:inline">{t('dashboard.statusBtn')}</span>
                    </button>

                    {/* Sort Dropdown */}
                    <div className="flex items-center space-x-1 text-xs text-neutral-600 dark:text-neutral-300 bg-white dark:bg-[#232323] border border-neutral-200 dark:border-neutral-700 rounded-lg px-2 py-1">
                      <ArrowUpDown className="w-3 h-3 text-neutral-400 shrink-0" />
                      <select
                        value={todoSortBy}
                        onChange={(e) => setTodoSortBy(e.target.value)}
                        className="bg-transparent focus:outline-none cursor-pointer text-xs font-medium text-neutral-700 dark:text-neutral-200 max-w-[80px] sm:max-w-none"
                      >
                        <option value="created_desc" className="dark:bg-[#232323]">{t('dashboard.sortLatest')}</option>
                        <option value="created_asc" className="dark:bg-[#232323]">{t('dashboard.sortOldest')}</option>
                        <option value="due_date_asc" className="dark:bg-[#232323]">{t('dashboard.sortDueNearest')}</option>
                        <option value="due_date_desc" className="dark:bg-[#232323]">{t('dashboard.sortDueFurthest')}</option>
                        <option value="priority_desc" className="dark:bg-[#232323]">{t('dashboard.sortPriorityHighest')}</option>
                      </select>
                    </div>
                  </div>
                </div>

                {/* Quick Add Bar - Compact on mobile */}
                {activeTab !== 'reminders' && (
                  <form onSubmit={handleAddTodo} className="bg-white dark:bg-[#202020] p-3 rounded-xl border border-neutral-200/90 dark:border-neutral-800 shadow-2xs space-y-2.5">
                    {/* Baris 1: Input Judul Tugas Full-Width */}
                    <div className="w-full">
                      <input
                        type="text"
                        maxLength={200}
                        placeholder={t('dashboard.quickAddPlaceholder')}
                        value={newTaskTitle}
                        onChange={(e) => setNewTaskTitle(e.target.value)}
                        className="w-full px-2 py-1 text-sm bg-transparent focus:outline-none placeholder:text-neutral-400 dark:placeholder:text-neutral-500 font-medium text-neutral-800 dark:text-neutral-100"
                      />
                    </div>

                    {/* Baris 2: Toolbar Chip Opsi (Prioritas, Status, Jatuh Tempo, Foto) & Tombol Simpan */}
                    <div className="flex items-center justify-between gap-2 pt-2 border-t border-neutral-100 dark:border-neutral-800">
                      <div className="flex flex-wrap items-center gap-1.5">
                        {/* Prioritas Chip */}
                        <div className="flex items-center space-x-1 bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] border border-neutral-200/80 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs transition">
                          <Flag className="w-3 h-3 text-neutral-400 shrink-0" />
                          <select
                            value={newTaskPriority}
                            onChange={(e) => setNewTaskPriority(e.target.value)}
                            className="bg-transparent focus:outline-none text-xs font-medium text-neutral-700 dark:text-neutral-200 cursor-pointer max-w-[80px] sm:max-w-none"
                            title={t('dashboard.priorityChip')}
                          >
                            <option value="urgent" className="dark:bg-[#282828]">{t('dashboard.priorityUrgent')}</option>
                            <option value="high" className="dark:bg-[#282828]">{t('dashboard.priorityHigh')}</option>
                            <option value="medium" className="dark:bg-[#282828]">{t('dashboard.priorityMedium')}</option>
                            <option value="low" className="dark:bg-[#282828]">{t('dashboard.priorityLow')}</option>
                          </select>
                        </div>

                        {/* Jatuh Tempo Chip */}
                        <div className="flex items-center space-x-1 bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] border border-neutral-200/80 dark:border-neutral-700 rounded-lg px-2 py-1 text-xs transition">
                          <Calendar className="w-3 h-3 text-neutral-400 shrink-0" />
                          <input
                            type="date"
                            value={newTaskDate}
                            title={t('dashboard.dueDateChip')}
                            onChange={(e) => setNewTaskDate(e.target.value)}
                            className="bg-transparent focus:outline-none text-xs text-neutral-700 dark:text-neutral-200 cursor-pointer w-[100px] sm:w-auto"
                          />
                        </div>

                        {/* Tombol Opsi Catatan & Pengingat */}
                        <button
                          type="button"
                          onClick={() => setShowTodoAdvanced(!showTodoAdvanced)}
                          className={`text-xs px-2 py-1 rounded-lg border transition cursor-pointer flex items-center space-x-1 ${
                            showTodoAdvanced || newTaskDesc || newTaskReminderDate || todoFile
                              ? 'bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 border-neutral-900 dark:border-neutral-100'
                              : 'bg-neutral-50 dark:bg-[#282828] hover:bg-neutral-100 dark:hover:bg-[#323232] text-neutral-600 dark:text-neutral-300 border-neutral-200/80 dark:border-neutral-700'
                          }`}
                          title={t('dashboard.advancedOptions')}
                        >
                          <Paperclip className="w-3 h-3 shrink-0" />
                          <span className="hidden sm:inline">{showTodoAdvanced ? t('dashboard.closeDetails') : t('dashboard.advancedOptions')}</span>
                        </button>
                      </div>

                      {/* Tombol Simpan */}
                      <button
                        type="submit"
                        disabled={isSubmittingTask || !newTaskTitle.trim()}
                        className="bg-neutral-900 hover:bg-neutral-800 dark:bg-white dark:hover:bg-neutral-100 dark:text-neutral-900 text-white text-xs font-medium px-3 py-1.5 rounded-lg transition flex items-center space-x-1.5 disabled:opacity-50 cursor-pointer shadow-xs shrink-0"
                      >
                        {isSubmittingTask ? (
                          <Loader2 className="w-3.5 h-3.5 animate-spin" />
                        ) : (
                          <>
                            <Plus className="w-3.5 h-3.5" />
                            <span className="hidden sm:inline">{t('dashboard.saveTaskBtn')}</span>
                            <span className="sm:hidden">{isEn ? 'Add' : 'Tambah'}</span>
                          </>
                        )}
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

      {/* MODAL PENGATURAN AKUN & TAMPILAN */}
      <SettingsModal
        isOpen={isSettingsOpen}
        onClose={() => setIsSettingsOpen(false)}
        user={user}
        storageUsage={storageUsage}
        onRefreshStorage={refreshStorageUsage}
        quotaConfig={quotaConfig}
        preferences={preferences}
        onSavePreferences={handleSavePreferences}
        onResetPreferences={handleResetPreferences}
        onToggleProTier={handleToggleProTier}
        onNavigateToTab={(tab) => {
          setActiveTab(tab);
          setIsSettingsOpen(false);
        }}
      />
    </div>
  );
}
