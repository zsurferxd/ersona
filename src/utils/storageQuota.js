/**
 * Ersona Workspace - Storage Quota & Tier Utility
 * 
 * Aturan Kuota:
 * - 100 MB: User baru / Email belum dikonfirmasi
 * - 300 MB: User dengan email terkonfirmasi
 * - 1 GB: User yang di-upgrade (Ersona Pro)
 */

export const QUOTA_UNCONFIRMED = 100 * 1024 * 1024; // 100 MB
export const QUOTA_CONFIRMED = 300 * 1024 * 1024;   // 300 MB
export const QUOTA_UPGRADED = 1024 * 1024 * 1024;   // 1 GB

/**
 * Mendapatkan konfigurasi kuota pengguna berdasarkan objek user Supabase
 */
export function getUserQuotaConfig(user) {
  if (!user) {
    return {
      maxBytes: QUOTA_UNCONFIRMED,
      maxMB: 100,
      tierName: 'Free (Tamu)',
      tierCode: 'unconfirmed',
      isEmailConfirmed: false,
      isUpgraded: false,
    };
  }

  const isUpgraded = Boolean(user.user_metadata?.is_upgraded || user.user_metadata?.tier === 'pro');
  const isEmailConfirmed = Boolean(user.email_confirmed_at);

  if (isUpgraded) {
    return {
      maxBytes: QUOTA_UPGRADED,
      maxMB: 1024,
      tierName: 'Ersona Pro (1 GB)',
      tierCode: 'pro',
      isEmailConfirmed,
      isUpgraded: true,
    };
  }

  if (isEmailConfirmed) {
    return {
      maxBytes: QUOTA_CONFIRMED,
      maxMB: 300,
      tierName: 'Free Terverifikasi (300 MB)',
      tierCode: 'confirmed',
      isEmailConfirmed: true,
      isUpgraded: false,
    };
  }

  return {
    maxBytes: QUOTA_UNCONFIRMED,
    maxMB: 100,
    tierName: 'Free Belum Konfirmasi (100 MB)',
    tierCode: 'unconfirmed',
    isEmailConfirmed: false,
    isUpgraded: false,
  };
}

/**
 * Format bytes menjadi format string yang ramah dibaca (B, KB, MB, GB)
 */
export function formatBytes(bytes, decimals = 1) {
  if (!bytes || bytes === 0) return '0 B';
  const k = 1024;
  const dm = decimals < 0 ? 0 : decimals;
  const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  const val = parseFloat((bytes / Math.pow(k, i)).toFixed(dm));
  return `${val} ${sizes[i]}`;
}

/**
 * Menghitung penggunaan storage aktif user di bucket 'attachments'
 * Prioritas 1: Supabase RPC (get_user_storage_usage)
 * Prioritas 2 (Fallback): storage.from('attachments').list(userId)
 */
export async function calculateUserStorageUsage(supabase, userId) {
  if (!supabase || !userId) return 0;

  // 1. Coba lewat RPC function PostgreSQL jika tersedia
  try {
    const { data: rpcBytes, error: rpcErr } = await supabase.rpc('get_user_storage_usage');
    if (!rpcErr && typeof rpcBytes === 'number') {
      return rpcBytes;
    }
  } catch {
    // Lanjut ke fallback client-side
  }

  // 2. Fallback: list semua file di folder userId
  try {
    const { data: files, error: listErr } = await supabase.storage
      .from('attachments')
      .list(userId, { limit: 1000, offset: 0 });

    if (listErr || !files) return 0;

    const totalBytes = files.reduce((acc, f) => {
      const size = f.metadata?.size || f.size || 0;
      return acc + Number(size);
    }, 0);

    return totalBytes;
  } catch (err) {
    console.warn('Gagal menghitung penggunaan storage:', err);
    return 0;
  }
}
