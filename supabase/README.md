# Supabase security hardening

Apply the SQL migration in `migrations/20260828000000_harden_is_admin_and_storage.sql` using the Supabase CLI or the SQL editor.

The migration:

- Pins `public.is_admin()` to `public, pg_temp`.
- Revokes anonymous and authenticated RPC execution for `public.is_admin()`.
- Removes the broad avatar-bucket listing policy and permits reads only for avatar-shaped object paths.

Also enable leaked-password protection in the Supabase dashboard:

1. Open **Authentication → Configuration → Password Security**.
2. Enable **Leaked password protection**.
3. Save the setting.

After applying the migration, rerun the Supabase database linter. The storage policy name may differ from the warning if it was changed manually; inspect existing policies and remove any other broad `SELECT` policy on `storage.objects` for the `avatars` bucket.
