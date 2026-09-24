/**
 * (public) layout — marketing / informational pages (features, etc.).
 * No AppShell. Pages manage their own nav and layout.
 */
import { PageBackground } from "@/components/ui/PageBackground";
import { SmoothScroll } from "@/components/ui/SmoothScroll";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <PageBackground />
      <SmoothScroll />
      {children}
    </>
  );
}
