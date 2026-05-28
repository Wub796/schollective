/**
 * (auth) layout — centered auth pages (login, signup).
 * No AppShell. The pages handle their own min-h-screen centering.
 */
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

export default function AuthLayout({
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
