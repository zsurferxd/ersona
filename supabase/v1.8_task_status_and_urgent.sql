-- ==============================================================================
-- SOLIST APP - UPGRADE v1.8: TASK STATUS & URGENT PRIORITY
-- ==============================================================================
-- Jalankan query ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan kolom status tugas dan memperbarui batasan prioritas (urgent).
-- ==============================================================================

-- 1. Tambahkan kolom status pada tabel todos (default: 'todo')
ALTER TABLE public.todos 
    ADD COLUMN IF NOT EXISTS status TEXT DEFAULT 'todo';

-- 2. Perbarui batasan nilai prioritas agar mendukung 'urgent' dan 'none'
ALTER TABLE public.todos 
    DROP CONSTRAINT IF EXISTS todos_priority_check,
    DROP CONSTRAINT IF EXISTS check_todo_priority;

ALTER TABLE public.todos 
    ADD CONSTRAINT check_todo_priority 
    CHECK (priority IN ('none', 'low', 'medium', 'high', 'urgent'));

-- 3. Sinkronisasi data lama: jika is_completed true maka status 'completed', selain itu 'todo'
UPDATE public.todos 
SET status = 'completed' 
WHERE is_completed = TRUE AND (status IS NULL OR status = 'todo');

UPDATE public.todos 
SET status = 'todo' 
WHERE status IS NULL;

-- 4. Tambahkan index untuk mempercepat query pengelompokan status
CREATE INDEX IF NOT EXISTS idx_todos_user_status ON public.todos(user_id, status);
