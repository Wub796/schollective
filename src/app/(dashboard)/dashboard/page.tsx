import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { StudentProfileForm } from "@/app/(dashboard)/profile/StudentProfileForm";
import { InteractiveOnboardingTour, TourStep } from "@/components/features/InteractiveOnboardingTour";

export const dynamic = "force-dynamic";

const STUDENT_TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-profile-editor",
    title: "Student Profile Manager",
    description: "Manage your academic standing, school, major, coursework, skills, bio, and portfolio link right from your dashboard.",
  },
  {
    targetId: "tour-tab-switcher",
    title: "Live Faculty View Preview",
    description: "Toggle between 'Edit Profile' and 'Faculty View Preview' to test how professors view your candidate profile card.",
  },
];

export default async function StudentDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Allow admins to preview as student
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "student";

  if (!isAdminPreviewing && profile.role !== "student") {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/prof/dashboard");
  }

  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "950px", paddingBottom: "6rem" }}>

      {/* Interactive Tour for First Time Users */}
      <InteractiveOnboardingTour role="student" steps={STUDENT_TOUR_STEPS} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{
            fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em",
            textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)",
          }}>
            Student Portal
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900,
            color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1,
          }}>
            Welcome back,{" "}
            <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>{displayName}</em>
          </h1>
        </div>
        <p style={{
          fontSize: "0.95rem", color: "#475569", opacity: 0.85, fontWeight: 400,
          maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", margin: 0,
        }}>
          Manage your research profile, academic standing, project accomplishments, coursework, skills, and portfolio directly from your dashboard.
        </p>
      </header>

      {/* ── Hairline ───────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.2)" }} />

      {/* ── Main Profile Fields Manager ──────────────────────────── */}
      <StudentProfileForm profile={profile} />
    </div>
  );
}
