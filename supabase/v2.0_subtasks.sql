-- ==============================================================================
-- ERSONA APP - UPGRADE v2.0: SUBTASKS / TASK CHECKLISTS
-- ==============================================================================
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan kolom subtasks berbasis JSONB pada tabel todos.
-- ==============================================================================

-- 1. Tambahkan kolom subtasks jika belum ada
ALTER TABLE public.todos 
    ADD COLUMN IF NOT EXISTS subtasks JSONB DEFAULT '[]'::jsonb;

-- 2. Berikan index GIN untuk pencarian performa tinggi jika diperlukan
CREATE INDEX IF NOT EXISTS idx_todos_subtasks ON public.todos USING GIN (subtasks);
