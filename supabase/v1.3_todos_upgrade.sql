-- ==============================================================================
-- SOLIST APP - UPGRADE v1.3: TODOS NOTES, MEDIA & REMINDERS
-- ==============================================================================
-- Jalankan query ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan kolom catatan, lampiran foto, dan jadwal "Ingatkan Aku".
-- ==============================================================================

-- 1. Tambahkan kolom reminder_date, media_url, dan media_type ke tabel todos
ALTER TABLE public.todos 
    ADD COLUMN IF NOT EXISTS reminder_date TIMESTAMPTZ,
    ADD COLUMN IF NOT EXISTS media_url TEXT,
    ADD COLUMN IF NOT EXISTS media_type TEXT;

-- 2. Tambahkan index untuk mempercepat query pengingat
CREATE INDEX IF NOT EXISTS idx_todos_user_reminder ON public.todos(user_id, reminder_date);
