"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { InstitutionInput } from "@/components/ui/InstitutionInput";

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
        display: "block", fontSize: "0.6rem", fontWeight: 600,
        letterSpacing: "0.22em", textTransform: "uppercase",
        color: focused ? "rgba(15, 23, 42, 0.65)" : "rgba(15, 23, 42, 0.3)",
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
          background: "rgba(15, 23, 42, 0.02)",
          border: `1px solid ${focused ? "rgba(147, 51, 234, 0.4)" : "rgba(15, 23, 42, 0.08)"}`,
          borderRadius: "100px",
          padding: "0.95rem 1.75rem",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          outline: "none",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          fontFamily: "var(--font-sans)",
          boxShadow: focused ? "0 0 0 3px rgba(147, 51, 234, 0.1)" : "none",
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

  // Verify the user is logged in; if profile is already complete, skip onboarding
  useEffect(() => {
    // Read role from localStorage (set by signup page before Google OAuth redirect)
    const storedRole = localStorage.getItem("signup_role");
    if (storedRole === "professor" || storedRole === "student") {
      setRole(storedRole);
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

      const { data: profile } = await supabase
        .from("profiles")
        .select("first_name, role")
        .eq("id", user.id)
        .single();

      // Already onboarded — redirect to the right dashboard
      if (profile?.first_name) {
        if (profile.role === "professor") router.replace("/prof/dashboard");
        else router.replace("/dashboard");
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
    }
    if (role === "professor") {
      const raw = fd.get("expertise") as string;
      const expertise = raw
        ? raw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      payload.expertise_fields = expertise;
      payload.status = "pending";

      const fName = payload.first_name || "";
      const lName = payload.last_name || "";
      const inst = payload.institution || "";
      payload.profile_complete = !!(fName.trim() && lName.trim() && inst.trim() && expertise.length > 0);
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (upsertError) {
      console.error("[onboarding] upsert error:", upsertError.message, upsertError.details, upsertError.hint);
      setError(`Save failed: ${upsertError.message}`);
      setLoading(false);
      return;
    }

    // Clear dirty state to allow normal navigation
    setIsDirty(false);

    toast.success("Welcome to Schollective!");
    
    const next = searchParams.get("next");
    if (next && next !== "/dashboard") {
      router.replace(next);
    } else {
      router.replace(role === "professor" ? "/prof/pending" : "/dashboard");
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
          width: "100%", maxWidth: "480px",
        }}
      >
        {/* Wordmark */}
        <motion.div variants={fadeUp} style={{ marginBottom: "3rem" }}>
          <span className="font-display" style={{ fontSize: "1.1rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
            Schollective
          </span>
        </motion.div>

        {/* Eyebrow */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.32)", fontFamily: "var(--font-sans)" }}>
            One last step
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="font-display" style={{
          fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)",
          letterSpacing: "-0.035em", lineHeight: 0.95, marginBottom: "2rem",
        }}>
          Complete your<br />
          <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>profile.</em>
        </motion.h1>

        <motion.p variants={fadeUp} style={{
          fontSize: "0.88rem", color: "rgba(15, 23, 42, 0.55)",
          marginBottom: "2.5rem", lineHeight: 1.7,
        }}>
          Tell us a bit about yourself so we can connect you with the right people.
        </motion.p>

        {/* Role selector */}
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

        <form onSubmit={handleSubmit} onChange={() => setIsDirty(true)}>
          <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "3rem" }}>

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
                  <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
                    <div>
                      <label htmlFor="education_level" style={{ display: "block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", marginBottom: "0.55rem", fontFamily: "var(--font-sans)" }}>
                        Education Level
                      </label>
                      <select id="education_level" name="education_level" required
                        style={{
                          width: "100%",
                          background: "rgba(15, 23, 42, 0.02)",
                          border: "1px solid rgba(15, 23, 42, 0.08)",
                          borderRadius: "100px",
                          padding: "0.95rem 2.5rem 0.95rem 1.75rem",
                          fontSize: "0.95rem",
                          color: "var(--text-primary)",
                          outline: "none",
                          fontFamily: "var(--font-sans)",
                          cursor: "pointer",
                          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
                          appearance: "none",
                          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='rgba(15, 23, 42,0.3)' stroke-width='2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
                          backgroundRepeat: "no-repeat",
                          backgroundPosition: "right 1.5rem center",
                        }}>
                        <option value="high-school">High School</option>
                        <option value="college">College / Undergraduate</option>
                        <option value="graduate">Graduate (Masters / PhD)</option>
                      </select>
                    </div>
                    <Field
                      id="institution" name="institution"
                      label="School (optional)"
                      placeholder="e.g. Lincoln High School, MIT, …"
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="prof" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
                    <div>
                      <label htmlFor="institution" style={{
                        display: "block", fontSize: "0.6rem", fontWeight: 600,
                        letterSpacing: "0.18em", textTransform: "uppercase",
                        color: "rgba(15, 23, 42, 0.3)", marginBottom: "0.55rem",
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
                    <Field id="expertise" name="expertise" label="Expertise Fields (comma-separated)" placeholder="e.g. Machine Learning, Bio-Ethics" required />
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
