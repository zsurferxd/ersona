-- ==============================================================================
-- ERSONA APP - UPGRADE v2.3: HIDE TEAM INVITE CODE FROM MEMBERS
-- ==============================================================================
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan dukungan toggle sembunyikan kode undangan (hide_invite_code).
-- ==============================================================================

-- 1. TAMBAHKAN KOLOM HIDE_INVITE_CODE PADA TABEL WORKSPACES
ALTER TABLE public.workspaces 
    ADD COLUMN IF NOT EXISTS hide_invite_code BOOLEAN NOT NULL DEFAULT false;

-- 2. KOMENTAR DOKUMENTASI
COMMENT ON COLUMN public.workspaces.hide_invite_code IS 'Jika true, kode undangan hanya dapat dilihat dan dibagikan oleh pemilik workspace. Anggota biasa tidak dapat melihatnya.';
