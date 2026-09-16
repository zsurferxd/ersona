-- ==============================================================================
-- ERSONA APP - UPGRADE v2.1: WORKSPACE STORAGE POOL & PRO TIER UPGRADE
-- ==============================================================================
-- Jalankan skrip ini di Supabase SQL Editor (Dashboard > SQL Editor > New query)
-- untuk menambahkan dukungan kuota pool tim pada tabel workspaces.
-- ==============================================================================

-- 1. TAMBAHKAN KOLOM STATUS TIER PADA TABEL WORKSPACES
ALTER TABLE public.workspaces
    ADD COLUMN IF NOT EXISTS is_upgraded BOOLEAN NOT NULL DEFAULT false,
    ADD COLUMN IF NOT EXISTS tier TEXT NOT NULL DEFAULT 'free';

-- 2. BUAT INDEKS UNTUK PERFORMA QUERY
CREATE INDEX IF NOT EXISTS idx_workspaces_owner_tier ON public.workspaces(owner_id, is_upgraded);

-- 3. FUNGSI UNTUK SINKRONISASI TIER PEMILIK KE WORKSPACE SECARA OTOMATIS
CREATE OR REPLACE FUNCTION public.sync_workspace_owner_tier(ws_id UUID)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
    ws RECORD;
    owner_meta JSONB;
    is_pro BOOLEAN := false;
BEGIN
    -- Ambil data workspace
    SELECT * INTO ws FROM public.workspaces WHERE id = ws_id;
    IF NOT FOUND THEN
        RETURN jsonb_build_object('success', false, 'error', 'Workspace not found');
    END IF;

    -- Ambil metadata pemilik dari auth.users
    SELECT raw_user_meta_data INTO owner_meta
    FROM auth.users
    WHERE id = ws.owner_id;

    IF owner_meta IS NOT NULL THEN
        is_pro := COALESCE((owner_meta->>'is_upgraded')::boolean, false) OR (owner_meta->>'tier' = 'pro');
    END IF;

    -- Perbarui workspace
    UPDATE public.workspaces
    SET is_upgraded = is_pro,
        tier = CASE WHEN is_pro THEN 'pro' ELSE 'free' END,
        updated_at = NOW()
    WHERE id = ws_id;

    RETURN jsonb_build_object('success', true, 'is_upgraded', is_pro);
END;
$$;

GRANT EXECUTE ON FUNCTION public.sync_workspace_owner_tier(UUID) TO authenticated;
