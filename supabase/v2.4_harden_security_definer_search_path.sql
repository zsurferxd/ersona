-- ==============================================================================
-- ERSONA APP - UPGRADE v2.4: HARDEN SECURITY DEFINER SEARCH PATH
-- ==============================================================================
-- Diterapkan langsung via Supabase MCP untuk memperbaiki database linter warning
-- (function_search_path_mutable) pada fungsi-fungsi workspace.
-- ==============================================================================

ALTER FUNCTION public.is_workspace_member(uuid, uuid) SET search_path = public;
ALTER FUNCTION public.join_workspace_by_code(text) SET search_path = public;
ALTER FUNCTION public.join_workspace_by_invite_code(text) SET search_path = public;
ALTER FUNCTION public.sync_workspace_owner_tier(uuid) SET search_path = public;
