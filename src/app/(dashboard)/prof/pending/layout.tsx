/**
 * prof/pending opt-out layout.
 *
 * This page is a standalone fullscreen "verification in progress"
 * screen — no sidebar needed. This layout overrides the parent
 * (dashboard)/layout.tsx so AppShell is NOT rendered here.
 */
export default function ProfPendingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
