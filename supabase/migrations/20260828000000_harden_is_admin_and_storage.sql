-- Security hardening for Supabase database linter warnings.
-- Apply this migration in the Supabase SQL editor or through the Supabase CLI.

-- Pin the function search path so object resolution cannot be influenced by a caller.
alter function public.is_admin()
  set search_path = public, pg_temp;

-- is_admin() is used by server-side authorization checks, not as a public RPC.
revoke execute on function public.is_admin() from anon;
revoke execute on function public.is_admin() from authenticated;

-- Public object URLs do not require a bucket-wide SELECT policy. Remove the broad
-- listing policy. Supabase public bucket access serves individual object URLs;
-- do not replace this with another broad SELECT policy that permits listing.
drop policy if exists "Public can view avatar images" on storage.objects;
