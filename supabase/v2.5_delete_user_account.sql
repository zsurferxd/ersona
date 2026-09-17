-- ==============================================================================
-- ERSONA APP - UPGRADE v2.5: DELETE USER ACCOUNT RPC FUNCTION
-- ==============================================================================
-- Fungsi untuk menghapus akun pengguna beserta seluruh data terkait secara aman (Cascading).
-- Dijalankan sebagai SECURITY DEFINER dengan search_path terisolasi.
-- ==============================================================================

CREATE OR REPLACE FUNCTION public.delete_user_account()
RETURNS void
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  current_user_id uuid;
BEGIN
  current_user_id := auth.uid();
  IF current_user_id IS NULL THEN
    RAISE EXCEPTION 'Not authenticated';
  END IF;

  -- 1. Hapus catatan & tugas user
  DELETE FROM public.notes WHERE user_id = current_user_id;
  DELETE FROM public.todos WHERE user_id = current_user_id;

  -- 2. Hapus pesan & keanggotaan workspace
  DELETE FROM public.workspace_messages WHERE user_id = current_user_id;
  DELETE FROM public.workspace_members WHERE user_id = current_user_id;

  -- 3. Hapus workspace yang dimiliki oleh user (ini akan men-cascade semua entri terkait)
  DELETE FROM public.workspaces WHERE owner_id = current_user_id;

  -- 4. Hapus akun pengguna dari auth.users
  DELETE FROM auth.users WHERE id = current_user_id;
END;
$$;

REVOKE ALL ON FUNCTION public.delete_user_account() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.delete_user_account() TO authenticated;
