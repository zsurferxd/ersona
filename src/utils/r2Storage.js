/**
 * Cloudflare R2 Storage Utility for Ersona
 * Memberikan kapasitas penyimpanan 10 GB gratis dengan zero egress fee.
 */

export const R2_PUBLIC_DEV_URL = 'https://pub-019510e7914f42e4ad614f3df51f087b.r2.dev';

export function getR2PublicBaseUrl() {
  const envUrl = import.meta.env.VITE_R2_PUBLIC_URL;
  if (envUrl && envUrl.trim() !== '') {
    return envUrl.trim().replace(/\/+$/, '');
  }
  return R2_PUBLIC_DEV_URL;
}

export function getR2ApiUrl() {
  const envApi = import.meta.env.VITE_R2_API_URL;
  if (envApi && envApi.trim() !== '') {
    return envApi.trim().replace(/\/+$/, '');
  }
  // Default: relatif ke domain saat ini (di Cloudflare Worker: /api/upload)
  return '/api/upload';
}

/**
 * Mengecek apakah URL media berasal dari Cloudflare R2
 */
export function isR2Url(url) {
  if (!url || typeof url !== 'string') return false;
  const baseUrl = getR2PublicBaseUrl();
  return url.startsWith(baseUrl) || url.includes('.r2.dev') || url.includes('.r2.cloudflarestorage.com');
}

/**
 * Unggah berkas ke Cloudflare R2 melalui Worker endpoint
 * Fallback ke Supabase Storage jika R2 tidak tersedia (misal di localhost tanpa proxy)
 */
export async function uploadMediaToR2OrSupabase({ file, userId, supabase, folder = 'attachments' }) {
  if (!file) throw new Error('File tidak ditemukan');

  const fileExt = file.name.split('.').pop()?.toLowerCase() || 'dat';
  const timestamp = Date.now();
  const randomStr = Math.random().toString(36).substring(2, 8);
  const safeKey = `${folder}/${userId || 'guest'}/${timestamp}-${randomStr}.${fileExt}`;
  const isVideo = file.type.startsWith('video/');

  // 1. Coba unggah ke Cloudflare R2
  try {
    const apiUrl = getR2ApiUrl();
    const uploadEndpoint = `${apiUrl}?key=${encodeURIComponent(safeKey)}`;

    const res = await fetch(uploadEndpoint, {
      method: 'POST',
      headers: {
        'Content-Type': file.type || 'application/octet-stream',
      },
      body: file,
    });

    if (res.ok) {
      const data = await res.json();
      const publicBase = getR2PublicBaseUrl();
      const publicUrl = `${publicBase}/${data.key || safeKey}`;
      return {
        url: publicUrl,
        type: isVideo ? 'video' : 'image',
        storage: 'r2',
        key: safeKey,
      };
    }
  } catch (r2Err) {
    console.warn('Gagal unggah ke Cloudflare R2, mencoba fallback ke Supabase Storage:', r2Err);
  }

  // 2. Fallback: Supabase Storage jika R2 gagal / tidak terjangkau
  if (supabase) {
    const supabasePath = `${userId}/${timestamp}-${randomStr}.${fileExt}`;
    const { data, error } = await supabase.storage.from('attachments').upload(supabasePath, file);
    if (error) throw error;

    const { data: { publicUrl } } = supabase.storage.from('attachments').getPublicUrl(data.path);
    return {
      url: publicUrl,
      type: isVideo ? 'video' : 'image',
      storage: 'supabase',
      path: data.path,
    };
  }

  throw new Error('Gagal mengunggah berkas ke Cloudflare R2 maupun Supabase Storage.');
}

/**
 * Hapus berkas dari Cloudflare R2 atau Supabase Storage berdasarkan URL
 */
export async function deleteMediaByUrl(url, supabase) {
  if (!url || typeof url !== 'string') return;

  // Jika URL adalah Cloudflare R2
  if (isR2Url(url)) {
    try {
      const baseUrl = getR2PublicBaseUrl();
      let key = url.replace(baseUrl, '').replace(/^\/+/, '');
      if (!key && url.includes('.r2.dev/')) {
        key = url.split('.r2.dev/')[1];
      }

      if (key) {
        const apiUrl = getR2ApiUrl();
        const deleteEndpoint = `${apiUrl}?key=${encodeURIComponent(key)}`;
        await fetch(deleteEndpoint, { method: 'DELETE' });
      }
      return;
    } catch (err) {
      console.warn('Gagal menghapus file dari R2:', err);
    }
  }

  // Jika URL adalah Supabase Storage
  if (supabase && url.includes('/storage/v1/object/public/attachments/')) {
    try {
      const path = url.split('/attachments/')[1]?.split('?')[0];
      if (path) {
        await supabase.storage.from('attachments').remove([decodeURIComponent(path)]);
      }
    } catch (err) {
      console.warn('Gagal menghapus file dari Supabase Storage:', err);
    }
  }
}
