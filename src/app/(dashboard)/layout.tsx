import { AppShell } from "@/components/layout/AppShell";
import { AdminViewBanner } from "@/components/ui/AdminViewBanner";
import { MinorAnalyticsGuard } from "@/components/analytics/MinorAnalyticsGuard";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { isSuspended } from "@/lib/authz";
import { RESTORE_PATH, isDeactivated } from "@/lib/account-deletion";
import { cookies } from "next/headers";
import { redirect } from "next/navigation";

export const dynamic = "force-dynamic";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user) {
    redirect("/login");
  }
  // Suspending an account has to remove access, not just change a label.
  if (isSuspended(profile)) {
    redirect("/suspended");
  }
  // Same for an account its owner disabled: it keeps its session (that is how
  // it can be restored) but has no product surface. /deactivated sits outside
  // this layout, so this redirect cannot loop.
  if (isDeactivated(profile)) {
    redirect(RESTORE_PATH);
  }
  const role = profile?.role || "student";

  // Check for admin preview-as mode
  const cookieStore = await cookies();
  const viewAsCookie = cookieStore.get("x-admin-view-as");
  const adminViewAs = (role === "admin" && viewAsCookie?.value) ? viewAsCookie.value as "student" | "professor" : null;

  // When admin is previewing, the AppShell should show the preview role's navigation
  const effectiveRole = adminViewAs ?? role;

  return (
    <AppShell role={effectiveRole}>
      {/* Rendered from here because this layout is the first signed-in surface
          that knows the account's age. See the component: consent is not
          enough for a minor. */}
      <MinorAnalyticsGuard isMinor={profile?.is_minor === true} />
      {adminViewAs && <AdminViewBanner role={adminViewAs} />}
      {children}
    </AppShell>
  );
}
