import { AppShell } from "@/components/layout/AppShell";
import { AdminViewBanner } from "@/components/ui/AdminViewBanner";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { cookies } from "next/headers";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { profile } = await getCurrentUserAndProfile();
  const role = profile?.role || "student";

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
