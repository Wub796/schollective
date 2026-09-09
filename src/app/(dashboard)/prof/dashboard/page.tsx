import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { AcceptingToggle } from "@/components/features/AcceptingToggle";
import { ProfProfileForm } from "@/app/(dashboard)/prof/profile/ProfProfileForm";
import { InteractiveOnboardingTour, TourStep } from "@/components/features/InteractiveOnboardingTour";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const PROF_TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-prof-header",
    title: "Your Faculty Dashboard",
    description: "Welcome to your command center. From here you can manage availability, review student requests, and fine-tune your research profile — all in one place.",
    emoji: "🏛️",
  },
  {
    targetId: "tour-availability-toggle",
    title: "Mentorship Availability",
    description: "Toggle whether your lab is currently accepting mentorship requests. When off, students won't be able to submit new requests — existing conversations remain open.",
    emoji: "🟢",
  },
  {
    targetId: "tour-request-queue",
    title: "Incoming Request Queue",
    description: "This is where student outreach cards appear. Review their credentials, read their research statement, and accept or decline mentorship requests directly from here.",
    emoji: "📬",
  },
  {
    targetId: "tour-prof-profile-section",
    title: "Faculty Profile & Preferences",
    description: "This section header leads into your full editable faculty profile below — academic position, department, research focus, publications, office hours, and more.",
    emoji: "📝",
  },
  {
    targetId: "tour-prof-profile-editor",
    title: "Edit Profile Details",
    description: "Update your academic credentials, research interests, accepted mentee levels, lab website, and featured publications. Students see this info when browsing mentors.",
    emoji: "✏️",
  },
  {
    targetId: "tour-prof-tab-switcher",
    title: "Student View Preview",
    description: "Switch to 'Student View Preview' to see exactly how your profile card appears to prospective mentees. Perfect for testing your presentation before going live.",
    emoji: "👁️",
  },
  {
    targetId: "tour-prof-save-button",
    title: "Save Faculty Profile",
    description: "After making changes, click 'Save Faculty Profile' to update your listing. Changes are immediately visible to students browsing the mentor directory.",
    emoji: "💾",
  },
];

export default async function ProfessorDashboard() {
  const { user, profile } = await getCurrentUserAndProfile();
  if (!user || !profile) redirect("/login");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") {
    redirect(profile?.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }
  if (!isAdminPreviewing && !profile.profile_complete && profile.role !== "admin") {
    redirect("/onboarding");
  }
  // Skip status check for admin previewing
  if (!isAdminPreviewing && profile.status !== "approved") redirect("/prof/pending");

  const isAccepting = profile.is_accepting_requests !== false; // default true
  const displayName = profile.preferred_name || profile.first_name || "Professor";

  // RLS scopes requests to their participants: the query must run under the
  // signed-in user's database identity or every row is filtered out.
  const allRequests = await runAs(user.id, async () => sql`
    SELECT 
      r.id, r.status, r.topic, r.created_at, r.updated_at,
      json_build_object(
        'first_name', s.first_name,
        'last_name', s.last_name,
        'preferred_name', s.preferred_name,
        'education_level', s.education_level,
        'major', s.major,
        'graduation_year', s.graduation_year,
        'bio', s.bio,
        'academic_interests', s.academic_interests,
        'skills_and_tools', s.skills_and_tools,
        'portfolio_url', s.portfolio_url,
        'extracurriculars', s.extracurriculars
      ) as student,
      COALESCE(
        (SELECT json_agg(json_build_object('content', m.content, 'created_at', m.created_at, 'sender_id', m.sender_id))
         FROM messages m WHERE m.request_id = r.id), '[]'::json
      ) as messages
    FROM requests r
    LEFT JOIN profiles s ON r.student_id = s.id
    WHERE r.professor_id = ${user.id}
    ORDER BY r.created_at DESC;
  `);

  const pendingRequests = (allRequests || [])
    .filter((r: any) => r.status === "pending" || r.status === "viewed")
    .map((req: any) => {
      const student = Array.isArray(req.student) ? req.student[0] : req.student;
      return {
        ...req,
        student: student ?? { first_name: "Unknown", last_name: "", preferred_name: null, education_level: "" },
        initial_message:
          req.messages?.length > 0
            ? [...req.messages].sort(
                (a: any, b: any) =>
                  new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
              )[0].content
            : undefined,
      };
    });

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "3.5rem", maxWidth: "950px", paddingBottom: "6rem" }}>

      {/* Interactive Onboarding Tour for Faculty */}
      <InteractiveOnboardingTour role="professor" steps={PROF_TOUR_STEPS} suppressAutoLaunch={isAdminPreviewing} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header data-tour="tour-prof-header" style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.6rem, 5vw, 4rem)", fontWeight: 900,
            color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05,
          }}>
            Dr. <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>{displayName}</em>
          </h1>

          {/* DB-backed availability toggle */}
          <AcceptingToggle initialValue={isAccepting} />
        </div>

        <p style={{
          fontSize: "0.95rem", color: "rgba(15, 23, 42, 0.4)", fontWeight: 300,
          maxWidth: "42rem", lineHeight: 1.8, fontFamily: "var(--font-sans)", marginTop: "0.25rem",
        }}>
          Manage your incoming student requests, faculty profile details, research focus, and availability directly from your dashboard.
        </p>
      </header>

      {profile.profile_complete === false && (
        <div style={{
          padding: "1.75rem 2rem",
          border: "1px solid rgba(245, 158, 11, 0.2)",
          borderRadius: "14px",
          background: "rgba(245, 158, 11, 0.04)",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: "2rem",
          flexWrap: "wrap",
        }}>
          <div style={{ display: "flex", flexDirection: "column", gap: "0.4rem", maxWidth: "32rem", textAlign: "left" }}>
            <h3 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 700, color: "#d97706", display: "flex", alignItems: "center", gap: "0.5rem", margin: 0 }}>
              <span style={{ display: "inline-block", width: "8px", height: "8px", borderRadius: "50%", background: "#f59e0b" }} />
              Your Profile is Incomplete
            </h3>
            <p style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.5)", lineHeight: 1.6, fontFamily: "var(--font-sans)", margin: 0 }}>
              To receive outreach requests from students, complete your faculty profile below.
            </p>
          </div>
        </div>
      )}

      {/* ── Hairline ─────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(79, 70, 229, 0.1)" }} />

      {/* ── Request Queue ─────────────────────────────────────── */}
      <div data-tour="tour-request-queue" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <h2 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", letterSpacing: "-0.025em" }}>
            Incoming Request Queue
          </h2>
          <span style={{
            marginLeft: "auto",
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            {pendingRequests.length} pending
          </span>
        </div>

        {pendingRequests.length === 0 ? (
          <div style={{
            border: "1px dashed rgba(79, 70, 229, 0.1)",
            borderRadius: "16px", padding: "2.5rem 1.5rem", textAlign: "center",
          }}>
            <Inbox size={20} color="rgba(120, 220, 120, 0.4)" style={{ margin: "0 auto 0.75rem" }} />
            <h3 className="font-display" style={{ fontSize: "1rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.7)", margin: "0 0 0.3rem" }}>
              You&apos;re all caught up!
            </h3>
            <p style={{ fontSize: "0.78rem", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)", margin: 0 }}>
              No pending mentorship requests in your queue.
            </p>
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(340px, 1fr))", gap: "1.5rem" }}>
            {pendingRequests.map((req: any) => (
              <RequestQueueCard key={req.id} request={req as any} />
            ))}
          </div>
        )}
      </div>

      {/* ── Hairline ─────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(79, 70, 229, 0.1)" }} />

      {/* ── Faculty Profile Manager ─────────────────────────────── */}
      <div data-tour="tour-prof-profile-section" style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <h2 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
          Faculty Profile & Preferences
        </h2>
        <ProfProfileForm profile={profile} />
      </div>

    </div>
  );
}
