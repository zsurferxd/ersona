/**
 * Ersona Workspace - Storage Quota & Tier Utility (Didukung Cloudflare R2 10 GB)
 * 
 * Aturan Kuota:
 * - 500 MB: User baru / Email belum dikonfirmasi
 * - 2 GB: User dengan email terkonfirmasi
 * - 10 GB: User yang di-upgrade (Ersona Pro - Kapasitas Penuh Cloudflare R2 Free Tier)
 */

export const QUOTA_UNCONFIRMED = 500 * 1024 * 1024;       // 500 MB
export const QUOTA_CONFIRMED = 2 * 1024 * 1024 * 1024;   // 2 GB
export const QUOTA_UPGRADED = 10 * 1024 * 1024 * 1024;   // 10 GB (Cloudflare R2 Free Tier)

export const QUOTA_TIERS = {
  unconfirmed: {
    maxPhotos: 50,
    maxVideos: 0,
    tierName: 'Free (Email Belum Verif)',
    tierNameEn: 'Free (Unverified)',
    tierCode: 'unconfirmed',
    desc: '50 foto & 0 video',
  },
  confirmed: {
    maxPhotos: 150,
    maxVideos: 2,
    tierName: 'Free (Terverifikasi)',
    tierNameEn: 'Free (Verified)',
    tierCode: 'confirmed',
    desc: '150 foto & 2 video',
  },
  pro: {
    maxPhotos: 1000,
    maxVideos: 5,
    tierName: 'Ersona Pro',
    tierNameEn: 'Ersona Pro',
    tierCode: 'pro',
    desc: '1.000 foto & 5 video',
  },
};

/**
 * Mendapatkan konfigurasi kuota pengguna berdasarkan objek user Supabase
 */
export function getUserQuotaConfig(user) {
  if (!user) {
    return {
      ...QUOTA_TIERS.unconfirmed,
      isEmailConfirmed: false,
      isUpgraded: false,
    };
  }

  const isUpgraded = Boolean(user.user_metadata?.is_upgraded || user.user_metadata?.tier === 'pro');
  
  // Google OAuth otomatis dianggap terverifikasi oleh Google
  const isGoogleOAuth = user.app_metadata?.provider === 'google' || 
    (Array.isArray(user.identities) && user.identities.some(i => i.provider === 'google'));

  // Akun email/password diperiksa berdasarkan flag custom ersona_verified di user_metadata
  const isEmailConfirmed = isGoogleOAuth || Boolean(user.user_metadata?.ersona_verified === true);

  if (isUpgraded) {
    return {
      ...QUOTA_TIERS.pro,
      isEmailConfirmed,
      isUpgraded: true,
    };
  }

  if (isEmailConfirmed) {
    return {
      ...QUOTA_TIERS.confirmed,
      isEmailConfirmed: true,
      isUpgraded: false,
    };
  }

  return {
    ...QUOTA_TIERS.unconfirmed,
    isEmailConfirmed: false,
    isUpgraded: false,
  };
}

/**
 * Mendapatkan konfigurasi kuota untuk Ruang Kerja Bersama (Team Workspace)
 * Mengikuti arsitektur Owner-Centric Storage Pool:
 * - Jika user yang login adalah pemilik (owner), ikuti tingkatan akun pemilik
 * - Jika user adalah anggota tim (member), kuota mengikuti status Pro workspace
 */
export function getWorkspaceQuotaConfig(workspace, currentUser) {
  if (!workspace) {
    return getUserQuotaConfig(currentUser);
  }

  const isOwner = currentUser && workspace.owner_id === currentUser.id;
  let baseConfig;

  if (isOwner) {
    baseConfig = getUserQuotaConfig(currentUser);
  } else {
    const isWsPro = Boolean(workspace.is_upgraded || workspace.tier === 'pro');
    const baseTier = isWsPro ? QUOTA_TIERS.pro : QUOTA_TIERS.confirmed;
    baseConfig = {
      ...baseTier,
      isEmailConfirmed: true,
      isUpgraded: isWsPro,
    };
  }

  // Cek apakah ada batas foto kustom yang diatur pemilik untuk workspace ini
  let effectiveMaxPhotos = baseConfig.maxPhotos;
  const customLimit = workspace.custom_photo_limit;
  if (typeof customLimit === 'number' && customLimit > 0) {
    effectiveMaxPhotos = Math.min(baseConfig.maxPhotos, customLimit);
  }

  return {
    ...baseConfig,
    maxPhotos: effectiveMaxPhotos,
    customPhotoLimit: typeof customLimit === 'number' && customLimit > 0 ? customLimit : null,
    isWorkspacePool: true,
    workspaceName: workspace.name,
    isOwner: Boolean(isOwner),
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
