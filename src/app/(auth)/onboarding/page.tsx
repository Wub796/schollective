"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { InstitutionInput } from "@/components/ui/InstitutionInput";
import { scoreApplication } from "@/app/admin/dashboard/actions";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 0.9, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.09, delayChildren: 0.05 } },
};



type Role = "student" | "professor";

function Field({
  id, name, type = "text", label, placeholder, defaultValue = "", required = false,
}: {
  id: string; name: string; type?: string; label: string;
  placeholder: string; defaultValue?: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <label htmlFor={id} style={{
        display: "block", fontSize: "0.62rem", fontWeight: 800,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: focused ? "#4f46e5" : "#0f172a",
        marginBottom: "0.55rem", transition: "color 0.25s",
        fontFamily: "var(--font-sans)",
      }}>
        {label}
      </label>
      <input
        id={id} name={name} type={type}
        placeholder={placeholder} required={required}
        defaultValue={defaultValue}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "rgba(255, 255, 255, 0.9)",
          border: `1.5px solid ${focused ? "#4f46e5" : "rgba(99, 102, 241, 0.5)"}`,
          borderRadius: "100px",
          padding: "1rem 1.75rem",
          fontSize: "0.95rem",
          color: "#0f172a",
          outline: "none",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          fontFamily: "var(--font-sans)",
          boxShadow: focused ? "0 0 0 3px rgba(79, 70, 229, 0.1)" : "none",
        }}
      />
    </div>
  );
}

function TextArea({
  id, name, label, placeholder, maxLength = 280, required = false,
}: {
  id: string; name: string; label: string;
  placeholder: string; maxLength?: number; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  const [charCount, setCharCount] = useState(0);
  return (
    <div style={{ position: "relative" }}>
      <label htmlFor={id} style={{
        display: "flex", justifyContent: "space-between", alignItems: "baseline",
        fontSize: "0.62rem", fontWeight: 800,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: focused ? "#4f46e5" : "#0f172a",
        marginBottom: "0.55rem", transition: "color 0.25s",
        fontFamily: "var(--font-sans)",
      }}>
        <span>{label}</span>
        <span style={{
          fontSize: "0.52rem", fontWeight: 500, letterSpacing: "0.05em",
          textTransform: "none",
          color: charCount > maxLength ? "#ef4444" : "rgba(15, 23, 42, 0.4)",
        }}>
          {charCount}/{maxLength}
        </span>
      </label>
      <textarea
        id={id} name={name}
        placeholder={placeholder} required={required}
        maxLength={maxLength}
        rows={3}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        onChange={(e) => setCharCount(e.target.value.length)}
        style={{
          width: "100%",
          background: "rgba(255, 255, 255, 0.9)",
          border: `1.5px solid ${focused ? "#4f46e5" : "rgba(99, 102, 241, 0.5)"}`,
          borderRadius: "20px",
          padding: "1rem 1.5rem",
          fontSize: "0.92rem",
          color: "#0f172a",
          outline: "none",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          fontFamily: "var(--font-sans)",
          boxShadow: focused ? "0 0 0 3px rgba(79, 70, 229, 0.1)" : "none",
          resize: "none",
          lineHeight: 1.7,
        }}
      />
    </div>
  );
}

function OnboardingContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  // Role can come from: (1) URL param (legacy), (2) localStorage set by signup page before OAuth
  const roleParam = searchParams.get("role");
  const initialRole: Role = roleParam === "professor" ? "professor" : "student";

  const [role, setRole]               = useState<Role>(initialRole);
  const [hasFixedRole, setHasFixedRole] = useState<boolean>(!!roleParam);
  const [loading, setLoading]         = useState(false);
  const [checking, setChecking]       = useState(true);
  const [userName, setUserName]       = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError]             = useState<string | null>(null);
  const [isDirty, setIsDirty]         = useState(false);

  // Warning when leaving page with unsaved changes
  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (isDirty) {
        e.preventDefault();
        e.returnValue = "";
      }
    };
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      window.removeEventListener("beforeunload", handleBeforeUnload);
    };
  }, [isDirty]);

  // Verify the user is logged in; detect role and enforce role-based onboarding view
  useEffect(() => {
    // Read role from localStorage (set by signup page before Google OAuth redirect)
    const storedRole = localStorage.getItem("signup_role");
    if (storedRole === "professor" || storedRole === "student") {
      setRole(storedRole);
      setHasFixedRole(true);
    }
    // Clear it so it doesn't persist for future visits
    localStorage.removeItem("signup_role");

    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.replace("/login"); return; }

      // Pre-fill name from Google account metadata
      const meta = user.user_metadata;
      if (meta?.full_name) setUserName(meta.full_name);
      else if (meta?.name) setUserName(meta.name);

      if (meta?.role === "professor" || meta?.role === "student") {
        setRole(meta.role);
        setHasFixedRole(true);
      }

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, role, status")
        .eq("id", user.id)
        .single();

      if (profile?.role === "professor" || profile?.role === "student") {
        setRole(profile.role);
        setHasFixedRole(true);
      }

      // Already onboarded — redirect to the right dashboard
      // Must match middleware's check: both first_name AND role required
      if (profile?.first_name && profile?.role) {
        if (profile.role === "professor") {
          router.replace(profile.status === "approved" ? "/prof/dashboard" : "/prof/pending");
        } else {
          router.replace("/dashboard");
        }
        return;
      }

      setChecking(false);
    })();
  }, []);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { router.replace("/login"); return; }

    // Build the profile upsert payload
    const payload: Record<string, any> = {
      id:             user.id,
      email:          user.email ?? "",
      role,
      first_name:     fd.get("first_name") as string,
      preferred_name: fd.get("preferred_name") as string,
      last_name:      fd.get("last_name") as string,
      institution:    role === "professor"
        ? (institution || fd.get("institution") as string)
        : (fd.get("institution") as string ?? ""),
      updated_at:     new Date().toISOString(),
    };

    if (role === "student") {
      payload.education_level = fd.get("education_level") as string;
      payload.major = (fd.get("major") as string ?? "").trim();
      payload.graduation_year = (fd.get("graduation_year") as string ?? "").trim();
      payload.bio = (fd.get("bio") as string ?? "").trim();
      payload.portfolio_url = (fd.get("portfolio_url") as string ?? "").trim();
      payload.seeking_mentorship_type = (fd.get("seeking_mentorship_type") as string ?? "").trim();

      const interestsRaw = fd.get("academic_interests") as string;
      payload.academic_interests = interestsRaw
        ? interestsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const extrasRaw = fd.get("extracurriculars") as string;
      payload.extracurriculars = extrasRaw
        ? extrasRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const courseworkRaw = fd.get("coursework") as string;
      payload.coursework = courseworkRaw
        ? courseworkRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      const skillsRaw = fd.get("skills_and_tools") as string;
      payload.skills_and_tools = skillsRaw
        ? skillsRaw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
    }
    if (role === "professor") {
      payload.academic_title = (fd.get("academic_title") as string ?? "").trim();
      payload.department = (fd.get("department") as string ?? "").trim();
      payload.lab_website = (fd.get("lab_website") as string ?? "").trim();
      payload.office_hours = (fd.get("office_hours") as string ?? "").trim();

      const rawExpertise = fd.get("expertise") as string;
      const expertise = rawExpertise
        ? rawExpertise.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      payload.expertise_fields = expertise;

      const rawMenteeLevels = fd.get("accepting_student_types") as string;
      payload.accepting_student_types = rawMenteeLevels
        ? rawMenteeLevels.split(",").map((s) => s.trim()).filter(Boolean)
        : [];

      const rawPubs = fd.get("publications") as string;
      payload.publications = rawPubs
        ? rawPubs.split("\n").map((s) => s.trim()).filter(Boolean)
        : [];

      payload.status = "pending";

      const fName = payload.first_name || "";
      const lName = payload.last_name || "";
      const inst = payload.institution || "";
      payload.profile_complete = !!(fName.trim() && lName.trim() && inst.trim() && expertise.length > 0);
    }

    let { error: upsertError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    // Some deployments have an RLS policy that calls the hardened is_admin()
    // helper. Onboarding is a self-service write and must not depend on that
    // admin-only RPC permission; retry with the same user-owned profile data
    // after refreshing the auth session so the request carries the latest JWT.
    if (upsertError?.message?.toLowerCase().includes("permission denied for function is_admin")) {
      await supabase.auth.getSession();
      const retry = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      upsertError = retry.error;
    }

    if (upsertError && (upsertError.message?.includes("schema cache") || upsertError.message?.includes("academic_interests") || upsertError.message?.includes("extracurriculars") || upsertError.message?.includes("bio") || upsertError.message?.includes("major") || upsertError.message?.includes("coursework") || upsertError.message?.includes("skills_and_tools") || upsertError.message?.includes("portfolio_url") || upsertError.message?.includes("graduation_year") || upsertError.message?.includes("seeking_mentorship_type"))) {
      console.warn("[onboarding] Schema cache error — retrying with core student profile fields:", upsertError.message);
      delete payload.bio;
      delete payload.academic_interests;
      delete payload.extracurriculars;
      delete payload.major;
      delete payload.graduation_year;
      delete payload.coursework;
      delete payload.skills_and_tools;
      delete payload.portfolio_url;
      delete payload.seeking_mentorship_type;
      delete payload.academic_title;
      delete payload.department;
      delete payload.lab_website;
      delete payload.office_hours;
      delete payload.accepting_student_types;
      delete payload.publications;

      const retry = await supabase
        .from("profiles")
        .upsert(payload, { onConflict: "id" });
      upsertError = retry.error;
    }

    if (upsertError) {
      console.error("[onboarding] upsert error:", upsertError.message, upsertError.details, upsertError.hint);
      setError(`Save failed: ${upsertError.message}`);
      setLoading(false);
      return;
    }

    // Auto-run AI Professor Reviewer if the new account is a professor
    let isAutoApproved = false;
    if (role === "professor") {
      try {
        const reviewRes = await scoreApplication(user.id);
        if (reviewRes?.autoApproved) {
          isAutoApproved = true;
        }
      } catch (reviewErr) {
        console.warn("[onboarding] Auto-review background execution warning:", reviewErr);
      }
    }

    // Clear dirty state to allow normal navigation
    setIsDirty(false);

    if (role === "professor" && isAutoApproved) {
      toast.success("Welcome to Schollective! Your academic credentials have been verified.");
    } else {
      toast.success("Welcome to Schollective!");
    }
    
    const next = searchParams.get("next");
    if (next && next !== "/dashboard") {
      router.replace(next);
    } else {
      router.replace(
        role === "professor"
          ? (isAutoApproved ? "/prof/dashboard" : "/prof/pending")
          : "/dashboard"
      );
    }
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)" }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans)" }}>
            Loading…
          </span>
        </div>
      </div>
    );
  }

  // Parse first/last from Google display name if available
  const nameParts   = userName.trim().split(" ");
  const defaultFirst = nameParts[0] ?? "";
  const defaultLast  = nameParts.slice(1).join(" ");

  return (
    <div style={{
      background: "var(--bg-base)", minHeight: "100vh",
      display: "flex", alignItems: "center", justifyContent: "center",
      padding: "3rem 1.5rem",
    }}>
      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 70% 55% at 30% 40%, rgba(99,102,241,0.15) 0%, transparent 65%)",
        zIndex: 0,
      }} />

      <motion.div
        variants={stagger} initial="hidden" animate="show"
        style={{
          position: "relative", zIndex: 1,
          width: "100%", maxWidth: "560px",
        }}
      >
        {/* Wordmark */}
        <motion.div variants={fadeUp} style={{ marginBottom: "3rem", display: "flex", alignItems: "center", justifyContent: "space-between", gap: "1rem" }}>
          <span className="font-display" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Schollective
          </span>
          <Link
            href="/login"
            onClick={(event) => {
              if (isDirty && !window.confirm("You have unsaved changes. Leave onboarding?")) {
                event.preventDefault();
              }
            }}
            style={{ color: "#4f46e5", fontSize: "0.65rem", fontWeight: 800, letterSpacing: "0.14em", textTransform: "uppercase", textDecoration: "none", fontFamily: "var(--font-sans)" }}
          >
            Log in
          </Link>
        </motion.div>

        {/* Eyebrow */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.32)", fontFamily: "var(--font-sans)" }}>
            Complete Profile Setup
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="font-display" style={{
          fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)",
          letterSpacing: "-0.035em", lineHeight: 0.95, marginBottom: "2rem",
        }}>
          Set up your<br />
          <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>academic profile.</em>
        </motion.h1>

        <motion.p variants={fadeUp} style={{
          fontSize: "0.88rem", color: "rgba(15, 23, 42, 0.55)",
          marginBottom: "2.5rem", lineHeight: 1.7,
        }}>
          Configure your academic details so we can match you with the right research mentors and scholars.
        </motion.p>

        {/* Role indicator */}
        {hasFixedRole ? (
          <motion.div variants={fadeUp} style={{ marginBottom: "2.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.5rem 1.25rem", borderRadius: "100px",
              background: "rgba(79, 70, 229, 0.08)", border: "1px solid rgba(79, 70, 229, 0.25)",
              fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase",
              color: "#4f46e5", fontFamily: "var(--font-sans, monospace)",
            }}>
              <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#4f46e5" }} />
              {role === "student" ? "Scholar / Student Setup" : "Faculty / Professor Setup"}
            </div>
          </motion.div>
        ) : (
          <motion.div variants={fadeUp} style={{
            display: "flex", gap: "0.5rem", marginBottom: "2.5rem",
            padding: "0.3rem", background: "rgba(15, 23, 42, 0.04)",
            borderRadius: "100px", border: "1px solid rgba(15, 23, 42, 0.07)",
          }}>
            {(["student", "professor"] as Role[]).map((r) => (
              <Button
                key={r} type="button" onClick={() => { setRole(r); setIsDirty(true); }}
                variant={role === r ? "primary" : "ghost"}
                size="md"
                className={`flex-1 ${role !== r && 'border-transparent text-slate-400'}`}
              >
                {r === "student" ? "Student" : "Professor"}
              </Button>
            ))}
          </motion.div>
        )}

        <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>
          <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>

            {/* Name row */}
            <div className="grid-2" style={{ gap: "1.5rem" }}>
              <Field id="first_name" name="first_name" label="First Name" placeholder="Jane" defaultValue={defaultFirst} required />
              <Field id="last_name" name="last_name" label="Last Name" placeholder="Doe" defaultValue={defaultLast} required={role === "professor"} />
            </div>

            <Field id="preferred_name" name="preferred_name" label="Preferred Name (optional)" placeholder="Janey" />

            {/* Role-specific fields */}
            <AnimatePresence mode="wait">
              {role === "student" ? (
                <motion.div key="student" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div>
                      <label htmlFor="education_level" style={{ display: "block", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#0f172a", marginBottom: "0.55rem", fontFamily: "var(--font-sans)" }}>
                        Education Level
                      </label>
                      <select id="education_level" name="education_level" required
                        style={{
                          width: "100%",
                          background: "rgba(255, 255, 255, 0.9)",
                          border: "1.5px solid rgba(99, 102, 241, 0.5)",
                          borderRadius: "100px",
                          padding: "1rem 3rem 1rem 1.85rem",
                          fontSize: "0.95rem",
                          color: "#0f172a",
                          outline: "none",
                          fontFamily: "var(--font-sans)",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                          boxShadow: "0 2px 8px rgba(0, 0, 0, 0.02)",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2.2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1.5rem center",
                        }}>
                        <option value="high-school-senior">High School Senior (12th Grade)</option>
                        <option value="high-school-junior">High School Junior (11th Grade)</option>
                        <option value="high-school-underclassman">High School (9th/10th Grade)</option>
                        <option value="college">College / Undergraduate</option>
                        <option value="graduate">Graduate (Master&apos;s / PhD)</option>
                      </select>
                    </div>

                    <div className="grid-2" style={{ gap: "1.5rem" }}>
                      <Field
                        id="institution" name="institution"
                        label="School / Institution"
                        placeholder="e.g. Westwood High, Stanford..."
                      />
                      <Field
                        id="major" name="major"
                        label="Major / Field of Study (optional)"
                        placeholder="e.g. Computer Science, Bioengineering"
                      />
                    </div>

                    <div className="grid-2" style={{ gap: "1.5rem" }}>
                      <Field
                        id="graduation_year" name="graduation_year"
                        label="Expected Grad Year (optional)"
                        placeholder="e.g. 2026, 2027"
                      />
                      <Field
                        id="seeking_mentorship_type" name="seeking_mentorship_type"
                        label="Mentorship Type (optional)"
                        placeholder="e.g. Summer Science Fair, REU Prep"
                      />
                    </div>

                    <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.06)", margin: "0.25rem 0" }} />

                    <TextArea
                      id="bio" name="bio"
                      label="Short Bio / Research curiosity (optional)"
                      placeholder="Tell professors what scientific topics drive your curiosity and your goals..."
                      maxLength={280}
                    />

                    <Field
                      id="coursework" name="coursework"
                      label="AP/IB & Advanced Coursework (optional)"
                      placeholder="e.g. AP Bio, AP Physics C, Multivariable Calculus, Data Structures"
                    />

                    <Field
                      id="academic_interests" name="academic_interests"
                      label="Academic Interests (optional)"
                      placeholder="e.g. Machine Learning, Neuroscience, Astrophysics, Bioengineering"
                    />

                    <Field
                      id="extracurriculars" name="extracurriculars"
                      label="Extracurriculars & Projects (optional)"
                      placeholder="e.g. Science Fair / ISEF Finalist, USACO, MIT PRIMES, Robotics Captain"
                    />

                    <Field
                      id="skills_and_tools" name="skills_and_tools"
                      label="Technical Skills & Tools (optional)"
                      placeholder="e.g. Python, PyTorch, R, CRISPR lab bench, MATLAB"
                    />

                    <Field
                      id="portfolio_url" name="portfolio_url"
                      label="Portfolio / Github Link (optional)"
                      placeholder="e.g. https://github.com/scholar-jane"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="prof" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
                    <div>
                      <label htmlFor="institution" style={{
                        display: "block", fontSize: "0.62rem", fontWeight: 800,
                        letterSpacing: "0.22em", textTransform: "uppercase",
                        color: "#0f172a", marginBottom: "0.55rem",
                        fontFamily: "var(--font-sans)",
                      }}>
                        Institution
                      </label>
                      <InstitutionInput
                        id="institution" name="institution"
                        value={institution} onChange={setInstitution}
                        placeholder="e.g. Stanford University"
                      />
                      <input type="hidden" name="institution" value={institution} />
                    </div>

                    <div className="grid-2" style={{ gap: "1.5rem" }}>
                      <Field id="academic_title" name="academic_title" label="Academic Position / Title" placeholder="e.g. Associate Professor" />
                      <Field id="department" name="department" label="Department" placeholder="e.g. Computer Science" />
                    </div>

                    <Field id="expertise" name="expertise" label="Expertise Fields (comma-separated)" placeholder="e.g. Machine Learning, Computational Biology" required />

                    <div className="grid-2" style={{ gap: "1.5rem" }}>
                      <Field id="lab_website" name="lab_website" label="Lab Website URL (optional)" placeholder="https://lab.university.edu" />
                      <Field id="office_hours" name="office_hours" label="Office Hours (optional)" placeholder="e.g. Tue/Thu 2-4 PM PST" />
                    </div>

                    <Field id="accepting_student_types" name="accepting_student_types" label="Mentee Levels Accepted (optional)" placeholder="e.g. High School, Undergraduate, PhD" />

                    <TextArea id="publications" name="publications" label="Featured Publications (optional, one per line)" placeholder="1. Smith J. et al. (2025) Neural Networks in Genomics..." maxLength={500} />
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>
                {error}
              </motion.p>
            )}

            <Button
              type="submit" disabled={loading}
              variant="primary"
              size="lg"
              className="w-full uppercase tracking-widest text-[0.6rem]"
            >
              {loading ? "Setting up your account…" : "Enter the Collective →"}
            </Button>
          </motion.div>
        </form>
      </motion.div>
    </div>
  );
}

export default function OnboardingPage() {
  return (
    <Suspense fallback={
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)" }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans)" }}>
            Loading…
          </span>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
