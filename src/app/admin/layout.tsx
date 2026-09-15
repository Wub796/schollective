import React from "react";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { clearAdminPreviewData } from "@/lib/admin-preview";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user, profile } = await getCurrentUserAndProfile();

  // Returning to the admin surface discards whatever the admin created while
  // previewing as a student or professor. Only ever for a verified admin's own id.
  if (session && user && profile?.role === "admin") {
    await clearAdminPreviewData(user.id);
  }

  return <>{children}</>;
}
