/**
 * Cloudflare Worker for Ersona
 * Handles:
 * 1. Cloudflare R2 Object Storage uploads, streaming & deletions (/api/upload)
 * 2. Serving React SPA frontend via Assets binding
 * 
 * Fitur Keamanan:
 * - Autentikasi JWT Supabase wajib untuk operasi tulis & hapus (POST, PUT, DELETE)
 * - Whitelist format media (hanya image/* dan video/* yang diizinkan)
 * - Pemblokiran keras file eksekutabel / skrip (.html, .js, .exe, .php, dll.)
 * - Isolasi hak akses folder per pengguna (attachments/{userId}/...)
 * - Security headers pada GET (X-Content-Type-Options: nosniff, CSP)
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

// Whitelist tipe MIME yang diizinkan untuk diunggah
const ALLOWED_MIME_TYPES = new Set([
  'image/jpeg',
  'image/png',
  'image/webp',
  'image/gif',
  'image/svg+xml',
  'video/mp4',
  'video/webm',
  'video/quicktime',
  'video/x-matroska',
]);

// Blacklist ekstensi file berbahaya
const FORBIDDEN_EXTENSIONS = new Set([
  'html', 'htm', 'js', 'mjs', 'jsx', 'ts', 'tsx', 'php', 'phtml',
  'exe', 'bat', 'cmd', 'sh', 'vbs', 'scr', 'pif', 'dll', 'jar', 'apk', 'wasm'
]);

// Maksimal ukuran upload: 100 MB (104,857,600 bytes)
const MAX_UPLOAD_SIZE = 100 * 1024 * 1024;

/**
 * Verifikasi token autentikasi Supabase pengguna
 */
async function verifySupabaseUser(request, env) {
  const authHeader = request.headers.get('Authorization');
  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return { error: 'Unauthorized: Header Authorization (Bearer token) diperlukan.', status: 401 };
  }

  const token = authHeader.replace(/^Bearer\s+/i, '').trim();
  if (!token) {
    return { error: 'Unauthorized: Token autentikasi kosong.', status: 401 };
  }

  const supabaseUrl = (env.SUPABASE_URL || 'https://ykbyuwhpwrbsjfwpazty.supabase.co').replace(/\/+$/, '');
  const supabaseAnonKey = env.SUPABASE_ANON_KEY || 'sb_publishable_eTFwmG_i7o0CZYamHiT4OQ_bU-vr5sp';

  try {
    const userRes = await fetch(`${supabaseUrl}/auth/v1/user`, {
      headers: {
        'Authorization': `Bearer ${token}`,
        'apikey': supabaseAnonKey,
      },
    });

    if (!userRes.ok) {
      return { error: 'Unauthorized: Sesi Supabase tidak valid atau telah kedaluwarsa.', status: 401 };
    }

    const user = await userRes.json();
    if (!user || !user.id) {
      return { error: 'Unauthorized: Identitas pengguna tidak ditemukan.', status: 401 };
    }

    return { user };
  } catch (err) {
    return { error: 'Gagal memverifikasi token ke Supabase: ' + err.message, status: 500 };
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url);

    // 1. Tangani preflight request CORS
    if (request.method === 'OPTIONS') {
      return new Response(null, { headers: CORS_HEADERS });
    }

    // 2. Endpoint API Cloudflare R2 (/api/upload)
    if (url.pathname === '/api/upload' || url.pathname.startsWith('/api/upload/')) {
      if (!env.BUCKET) {
        return new Response(
          JSON.stringify({ error: 'R2 BUCKET binding tidak ditemukan. Pastikan bucket "ersona" sudah terikat di wrangler.json.' }),
          { status: 500, headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' } }
        );
      }

      // GET: Sajikan file langsung dari R2 (Streaming gambar & video tanpa blokir dev domain)
      if (request.method === 'GET') {
        const key = url.searchParams.get('key') || url.pathname.replace(/^\/api\/upload\/?/, '');
        if (!key) {
          return new Response(JSON.stringify({ error: 'File key diperlukan' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        try {
          const object = await env.BUCKET.get(key);
          if (!object) {
            return new Response('File tidak ditemukan di R2', { status: 404, headers: CORS_HEADERS });
          }

          const headers = new Headers(CORS_HEADERS);
          object.writeHttpMetadata(headers);
          headers.set('etag', object.httpEtag);
          headers.set('cache-control', 'public, max-age=31536000, immutable');
          // Proteksi keamanan MIME sniffing dan XSS
          headers.set('X-Content-Type-Options', 'nosniff');
          headers.set('Content-Security-Policy', "default-src 'none'; media-src 'self'; img-src 'self'");

          return new Response(object.body, { headers });
        } catch (err) {
          return new Response('Gagal membaca file dari R2: ' + err.message, { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE: Hapus file dari R2 (Wajib terautentikasi dan hanya boleh menghapus file milik sendiri)
      if (request.method === 'DELETE') {
        const authResult = await verifySupabaseUser(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify({ error: authResult.error }), {
            status: authResult.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const key = url.searchParams.get('key') || url.pathname.replace(/^\/api\/upload\/?/, '');
        if (!key) {
          return new Response(JSON.stringify({ error: 'File key diperlukan' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        // Verifikasi kepemilikan: Pengguna hanya boleh menghapus file di dalam foldernya
        const expectedPrefix = `attachments/${authResult.user.id}/`;
        if (!key.startsWith(expectedPrefix)) {
          return new Response(JSON.stringify({ error: 'Forbidden: Anda tidak memiliki izin menghapus file ini.' }), {
            status: 403,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        try {
          await env.BUCKET.delete(key);
          return new Response(JSON.stringify({ success: true, key }), {
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        } catch (err) {
          return new Response(JSON.stringify({ error: 'Gagal menghapus file dari R2: ' + err.message }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }
      }

      // POST / PUT: Upload file ke R2 (Wajib terautentikasi & lolos filter keamanan)
      if (request.method === 'POST' || request.method === 'PUT') {
        const authResult = await verifySupabaseUser(request, env);
        if (authResult.error) {
          return new Response(JSON.stringify({ error: authResult.error }), {
            status: authResult.status,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        const rawContentType = request.headers.get('content-type') || '';
        const contentType = rawContentType.split(';')[0].trim().toLowerCase();

        // Validasi ukuran Content-Length
        const contentLength = parseInt(request.headers.get('content-length') || '0', 10);
        if (contentLength > MAX_UPLOAD_SIZE) {
          return new Response(JSON.stringify({ error: 'Ukuran file melebihi batas maksimal 100 MB.' }), {
            status: 413,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        // Validasi Whitelist MIME Type
        if (!contentType || (!ALLOWED_MIME_TYPES.has(contentType) && !contentType.startsWith('image/') && !contentType.startsWith('video/'))) {
          return new Response(JSON.stringify({ error: 'Tipe file tidak diizinkan. Hanya foto dan video yang diperbolehkan.' }), {
            status: 415,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        // Sanitasi key dan ekstensi file
        const requestedKey = url.searchParams.get('key') || url.pathname.replace(/^\/api\/upload\/?/, '');
        let fileExt = 'dat';
        if (requestedKey) {
          const parts = requestedKey.split('.');
          if (parts.length > 1) {
            fileExt = parts.pop().toLowerCase();
          }
        } else if (contentType.includes('/')) {
          fileExt = contentType.split('/')[1].replace('+xml', '');
        }

        if (FORBIDDEN_EXTENSIONS.has(fileExt)) {
          return new Response(JSON.stringify({ error: 'Ekstensi file berbahaya tidak diizinkan.' }), {
            status: 400,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }

        // Pastikan file tersimpan di folder ID pengguna yang terautentikasi
        const safeKey = `attachments/${authResult.user.id}/${Date.now()}-${crypto.randomUUID()}.${fileExt}`;

        try {
          await env.BUCKET.put(safeKey, request.body, {
            httpMetadata: {
              contentType: contentType || 'application/octet-stream',
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              key: safeKey,
              url: `/api/upload/${safeKey}`,
            }),
            {
              headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
            }
          );
        } catch (err) {
          return new Response(JSON.stringify({ error: 'Gagal mengunggah ke R2: ' + err.message }), {
            status: 500,
            headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
          });
        }
      }

      return new Response(JSON.stringify({ error: 'Method not allowed' }), {
        status: 405,
        headers: { ...CORS_HEADERS, 'Content-Type': 'application/json' },
      });
    }

    // 3. Fallback: Sajikan file statis React SPA (dist/index.html & assets)
    if (env.ASSETS) {
      return env.ASSETS.fetch(request);
    }

    return new Response('Ersona Worker ready. Static assets binding not found.', { status: 200 });
  },
};
