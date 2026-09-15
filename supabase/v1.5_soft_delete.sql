-- ==============================================================================
-- SOLIST APP - UPGRADE v1.5: SOFT DELETE (TAB SAMPAH) & DATA LIFECYCLE
-- ==============================================================================
-- Jalankan query ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan dukungan pemindahan item ke Tempat Sampah (Soft Delete).
-- ==============================================================================

-- 1. Tambahkan kolom deleted_at ke tabel todos dan notes
ALTER TABLE public.todos 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

ALTER TABLE public.notes 
    ADD COLUMN IF NOT EXISTS deleted_at TIMESTAMPTZ DEFAULT NULL;

-- 2. Tambahkan index untuk mempercepat filter data aktif dan data sampah
CREATE INDEX IF NOT EXISTS idx_todos_deleted_at ON public.todos(user_id, deleted_at);
CREATE INDEX IF NOT EXISTS idx_notes_deleted_at ON public.notes(user_id, deleted_at);
