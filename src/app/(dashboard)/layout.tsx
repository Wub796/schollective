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
export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <AppShell>{children}</AppShell>;
}
