/**
 * (auth) layout — centered auth pages (login, signup).
 * No AppShell. The pages handle their own min-h-screen centering.
 */
import { PageBackground } from "@/components/ui/PageBackground";

export default function AuthLayout({
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
