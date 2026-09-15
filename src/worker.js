/**
 * Cloudflare Worker for Ersona
 * Handles:
 * 1. Cloudflare R2 Object Storage uploads, streaming & deletions (/api/upload)
 * 2. Serving React SPA frontend via Assets binding
 */

const CORS_HEADERS = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization, X-Requested-With',
};

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

          return new Response(object.body, { headers });
        } catch (err) {
          return new Response('Gagal membaca file dari R2: ' + err.message, { status: 500, headers: CORS_HEADERS });
        }
      }

      // DELETE: Hapus file dari R2
      if (request.method === 'DELETE') {
        const key = url.searchParams.get('key') || url.pathname.replace(/^\/api\/upload\/?/, '');
        if (!key) {
          return new Response(JSON.stringify({ error: 'File key diperlukan' }), {
            status: 400,
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

      // POST / PUT: Upload file ke R2
      if (request.method === 'POST' || request.method === 'PUT') {
        const key = url.searchParams.get('key') || url.pathname.replace(/^\/api\/upload\/?/, '') || `attachments/${Date.now()}-${crypto.randomUUID()}`;
        const contentType = request.headers.get('content-type') || 'application/octet-stream';

        try {
          await env.BUCKET.put(key, request.body, {
            httpMetadata: {
              contentType,
            },
          });

          return new Response(
            JSON.stringify({
              success: true,
              key,
              url: `/api/upload/${key}`,
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
