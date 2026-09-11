/**
 * (public) layout — marketing / informational pages (features, etc.).
 * No AppShell. Pages manage their own nav and layout.
 */
import { PageBackground } from "@/components/ui/PageBackground";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageBackground />
      {children}
    </>
  );
}
