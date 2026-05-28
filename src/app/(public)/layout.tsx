/**
 * (public) layout — marketing / informational pages (features, etc.).
 * No AppShell. Pages manage their own nav and layout.
 */
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export default function PublicLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <>
      <AnimatedBackground />
      {children}
    </>
  );
}
