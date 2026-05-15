import { AppShell } from "@/components/layout/AppShell";
import { AdminViewBanner } from "@/components/ui/AdminViewBanner";
import { createClient } from "@/utils/supabase/server";
import { cookies } from "next/headers";

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

  // Check for admin preview-as mode
  const cookieStore = await cookies();
  const viewAsCookie = cookieStore.get("x-admin-view-as");
  const adminViewAs = (role === "admin" && viewAsCookie?.value) ? viewAsCookie.value as "student" | "professor" : null;

  // When admin is previewing, the AppShell should show the preview role's navigation
  const effectiveRole = adminViewAs ?? role;

  return (
    <AppShell role={effectiveRole}>
      {adminViewAs && <AdminViewBanner role={adminViewAs} />}
      {children}
    </AppShell>
  );
}
