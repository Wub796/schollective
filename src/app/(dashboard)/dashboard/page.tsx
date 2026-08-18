import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { StudentProfileForm } from "@/app/(dashboard)/profile/StudentProfileForm";
import { InteractiveOnboardingTour, TourStep } from "@/components/features/InteractiveOnboardingTour";

export const dynamic = "force-dynamic";

const STUDENT_TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-dashboard-header",
    title: "Your Dashboard Hub",
    description: "This is your personalized research dashboard. Everything you need to manage your Schollective profile, track your progress, and connect with mentors lives here.",
    emoji: "🏠",
  },
  {
    targetId: "tour-profile-avatar",
    title: "Profile Photo & Identity",
    description: "Upload a professional profile picture and see your name, major, and institution at a glance. Professors form first impressions from this — make it count!",
    emoji: "📷",
  },
  {
    targetId: "tour-tab-switcher",
    title: "Edit vs Faculty View Preview",
    description: "Switch between editing your profile and seeing exactly how professors view your candidate card. Use this to test and perfect your presentation before reaching out.",
    emoji: "👁️",
  },
  {
    targetId: "tour-education-guidance",
    title: "Dynamic Education Guidance",
    description: "This smart banner updates with tailored advice based on your education level — high school, undergrad, or graduate. Follow its tips to strengthen your profile.",
    emoji: "💡",
  },
  {
    targetId: "tour-ai-reviewer",
    title: "AI-Powered Profile Review",
    description: "Get instant AI feedback on your profile strength. It analyzes your bio, interests, and experience to give you a score and actionable improvement suggestions.",
    emoji: "🤖",
  },
  {
    targetId: "tour-profile-editor",
    title: "Profile Form Sections",
    description: "Edit all your academic details here: personal info, education standing, research interests, coursework, technical skills, portfolio links, and mentorship preferences.",
    emoji: "✏️",
  },
  {
    targetId: "tour-save-button",
    title: "Save Your Changes",
    description: "Don't forget to save! After editing any field, click 'Save Student Profile' to persist your updates. Your profile will be immediately visible to professors.",
    emoji: "💾",
  },
];

export default async function StudentDashboard() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect("/login");

  // Allow admins to preview as student
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "student";

  if (!isAdminPreviewing && profile.role !== "student") {
    redirect(profile.role === "admin" ? "/admin/dashboard" : "/prof/dashboard");
  }

  if (!isAdminPreviewing && !profile.profile_complete && profile.role !== "admin") {
    redirect("/onboarding");
  }

  const displayName = profile.preferred_name || profile.first_name || "Scholar";

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem", maxWidth: "950px", paddingBottom: "6rem" }}>

      {/* Interactive Tour for First Time Users */}
      <InteractiveOnboardingTour role="student" steps={STUDENT_TOUR_STEPS} />

      {/* ── Header ─────────────────────────────────────────────── */}
      <header data-tour="tour-dashboard-header" style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
