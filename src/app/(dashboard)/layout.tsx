import { AppShell } from "@/components/layout/AppShell";

/**
 * (dashboard) layout — all authenticated app pages.
 *
 * Wraps children in AppShell which renders the sidebar grid.
 * AppShell is a client component, so this layout itself is a
 * lightweight Server Component with no dynamic data.
 *
 * Individual pages that call createClient() export their own
 * `export const dynamic = "force-dynamic"` as required.
 */
import { createClient } from "@/utils/supabase/server";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  let role = "student";
  if (user) {
    const { data: profile } = await supabase.from("profiles").select("role").eq("id", user.id).single();
    if (profile) role = profile.role;
  }

  return <AppShell role={role}>{children}</AppShell>;
}
