/**
 * (public) layout — marketing / informational pages (features, etc.).
 * No AppShell. Pages manage their own nav and layout.
 */
export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return <>{children}</>;
}
