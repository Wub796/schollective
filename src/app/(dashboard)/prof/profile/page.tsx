import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { ProfProfileForm } from "./ProfProfileForm";

export const dynamic = "force-dynamic";

export default async function ProfPublicProfilePage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/dashboard");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") redirect("/dashboard");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "900px", paddingBottom: "6rem" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
            Faculty Portal
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Faculty Profile <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Manager</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#475569", margin: 0, opacity: 0.85 }}>
          Manage your research focus, lab website, office hours, mentee preferences, and featured publications.
        </p>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

      {/* Interactive Form & Live Preview Component */}
      <ProfProfileForm profile={profile} />
    </div>
  );
}
