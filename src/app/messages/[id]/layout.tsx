/**
 * messages/[id] opt-out layout.
 *
 * The chat page is a full-viewport h-screen layout with its own
 * sticky header. Opting out of AppShell here so the sidebar
 * grid does not conflict with the chat's flex column structure.
 */
export default function MessageThreadLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
