import React from "react";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { clearAdminNonAdminData } from "@/app/admin/dashboard/admin-actions";

export const dynamic = "force-dynamic";

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const { session, user, profile } = await getCurrentUserAndProfile();

  if (session && user && profile?.role === "admin") {
    await clearAdminNonAdminData(user.id);
  }

  return <>{children}</>;
}
