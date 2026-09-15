/**
 * Membantu mengenali dan memformat URL embed dari berbagai platform:
 * - Google Drive (mengubah /view atau /open menjadi /preview agar bisa di-embed di iframe)
 * - YouTube (mengubah watch?v= atau youtu.be menjadi embed URL)
 * - Direct image / video URL
 */
export function parseMediaUrl(url) {
  if (!url || typeof url !== 'string') return null;

  const trimmed = url.trim();

  // 1. Google Drive Link
  // Pola: https://drive.google.com/file/d/{id}/view... atau id=...
  const gDriveMatch = trimmed.match(/drive\.google\.com\/(?:file\/d\/|open\?id=)([a-zA-Z0-9_-]+)/);
  if (gDriveMatch && gDriveMatch[1]) {
    return {
      type: 'embed_gdrive',
      embedUrl: `https://drive.google.com/file/d/${gDriveMatch[1]}/preview`,
      originalUrl: trimmed,
    };
  }

  // 2. YouTube Link
  // Pola: youtube.com/watch?v={id} atau youtu.be/{id}
  const ytMatch = trimmed.match(/(?:youtube\.com\/(?:watch\?v=|embed\/)|youtu\.be\/)([a-zA-Z0-9_-]{11})/);
  if (ytMatch && ytMatch[1]) {
    return {
      type: 'embed_youtube',
      embedUrl: `https://www.youtube.com/embed/${ytMatch[1]}`,
      originalUrl: trimmed,
    };
  }

  // 3. Direct Video (.mp4, .webm, dsb)
  if (/\.(mp4|webm|ogg|mov)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'video',
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  // 4. Direct Image (.jpg, .jpeg, .png, .webp, .gif)
  if (/\.(jpg|jpeg|png|webp|gif|svg)(\?.*)?$/i.test(trimmed)) {
    return {
      type: 'image',
      embedUrl: trimmed,
      originalUrl: trimmed,
    };
  }

  // 5. Fallback ke embed iframe umum
  return {
    type: 'embed_generic',
    embedUrl: trimmed,
    originalUrl: trimmed,
  };
}
