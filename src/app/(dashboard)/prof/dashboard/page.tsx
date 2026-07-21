import React from "react";
import { redirect } from "next/navigation";
import { cookies } from "next/headers";
import { createClient } from "@/utils/supabase/server";
import { RequestQueueCard } from "@/components/features/RequestQueueCard";
import { AcceptingToggle } from "@/components/features/AcceptingToggle";
import { ProfProfileForm } from "@/app/(dashboard)/prof/profile/ProfProfileForm";
import { InteractiveOnboardingTour, TourStep } from "@/components/features/InteractiveOnboardingTour";
import { Inbox } from "lucide-react";
import { Button } from "@/components/ui/Button";

export const dynamic = "force-dynamic";

const PROF_TOUR_STEPS: TourStep[] = [
  {
    targetId: "tour-availability-toggle",
    title: "Mentorship Availability Toggle",
    description: "Control whether your lab is currently accepting research mentorship requests with one click.",
  },
  {
    targetId: "tour-request-queue",
    title: "Incoming Request Queue",
    description: "Evaluate incoming student outreach cards, review candidate credentials, and accept or decline mentorship requests.",
  },
  {
    targetId: "tour-prof-profile-editor",
    title: "Faculty Profile & Research Focus",
    description: "Manage your academic position, department, lab website, office hours, and research focus areas directly from your dashboard.",
  },
];

export default async function ProfessorDashboard() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  if (!profile) redirect("/login");

  // Allow admins to preview as professor
  const cookieStore = await cookies();
  const isAdminPreviewing = profile.role === "admin" && cookieStore.get("x-admin-view-as")?.value === "professor";

  if (!isAdminPreviewing && profile.role !== "professor") {
    redirect(profile?.role === "admin" ? "/admin/dashboard" : "/dashboard");
  }
  // Skip status check for admin previewing
  if (!isAdminPreviewing && profile.status !== "approved") redirect("/prof/pending");

  const isAccepting = profile.is_accepting_requests !== false; // default true
  const displayName = profile.preferred_name || profile.first_name || "Professor";

  const { data: allRequests } = await supabase
    .from("requests")
    .select(`
      id, status, topic, created_at, updated_at,
      student:student_id ( first_name, last_name, preferred_name, education_level, bio, academic_interests, extracurriculars ),
      messages ( content, created_at, read_at, sender_id )
    `)
    .eq("professor_id", user.id)
    .order("created_at", { ascending: false });

  const pendingRequests = (allRequests || [])
    .filter((r) => r.status === "pending")
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
      <InteractiveOnboardingTour role="professor" steps={PROF_TOUR_STEPS} />

      {/* ── Header ──────────────────────────────────────────────── */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{
            fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em",
            textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)",
            fontFamily: "var(--font-sans, monospace)",
          }}>
            Faculty Portal
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
          <h1 className="font-display" style={{
            fontSize: "clamp(2.6rem, 5vw, 4rem)", fontWeight: 900,
            color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05,
          }}>
            Dr. <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>{displayName}</em>
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
          <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
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
            {pendingRequests.map((req) => (
              <RequestQueueCard key={req.id} request={req as any} />
            ))}
          </div>
        )}
      </div>

      {/* ── Hairline ─────────────────────────────────────────────── */}
      <div style={{ height: "1px", background: "rgba(79, 70, 229, 0.1)" }} />

      {/* ── Faculty Profile Manager ─────────────────────────────── */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <h2 className="font-display" style={{ fontSize: "1.3rem", fontWeight: 800, color: "#0f172a", letterSpacing: "-0.025em" }}>
            Faculty Profile & Preferences
          </h2>
        </div>
        <ProfProfileForm profile={profile} />
      </div>

    </div>
  );
}
