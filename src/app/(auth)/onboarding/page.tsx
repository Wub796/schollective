"use client";

import React, { useState, useEffect, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
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
        letterSpacing: "0.18em", textTransform: "uppercase",
        color: focused ? "rgba(250, 250, 249, 0.65)" : "rgba(250, 250, 249, 0.3)",
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
          width: "100%", background: "transparent", border: "none",
          borderBottom: `1px solid ${focused ? "rgba(129, 140, 248, 0.6)" : "rgba(129, 140, 248, 0.15)"}`,
          padding: "0.7rem 0", fontSize: "0.95rem", color: "#fafaf9",
          outline: "none", transition: "border-color 0.3s",
          fontFamily: "var(--font-sans)",
        }}
      />
    </div>
  );
}

function OnboardingContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  // Pre-select role from URL param (passed by signup page Google button)
  const roleParam = searchParams.get("role");
  const initialRole: Role = roleParam === "professor" ? "professor" : "student";

  const [role, setRole]               = useState<Role>(initialRole);
  const [loading, setLoading]         = useState(false);
  const [checking, setChecking]       = useState(true);
  const [userName, setUserName]       = useState("");
  const [institution, setInstitution] = useState("");
  const [error, setError]             = useState<string | null>(null);

  // Verify the user is logged in; if profile is already complete, skip onboarding
  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }

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
        if (profile.role === "professor") router.push("/prof/pending");
        else router.push("/dashboard");
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
    if (!user) { router.push("/login"); return; }

    // Build the profile upsert payload
    const payload: Record<string, any> = {
      id:             user.id,
      email:          user.email ?? "",
      role,
      first_name:     fd.get("first_name") as string,
      preferred_name: fd.get("preferred_name") as string,
      last_name:      fd.get("last_name") as string,
      institution:    institution || fd.get("institution") as string,
      updated_at:     new Date().toISOString(),
    };

    if (role === "student") {
      payload.education_level = fd.get("education_level") as string;
    }
    if (role === "professor") {
      const raw = fd.get("expertise") as string;
      payload.expertise_fields = raw
        ? raw.split(",").map((s) => s.trim()).filter(Boolean)
        : [];
      payload.status = "pending"; // professors await approval
    }

    const { error: upsertError } = await supabase
      .from("profiles")
      .upsert(payload, { onConflict: "id" });

    if (upsertError) {
      console.error("[onboarding] upsert error:", upsertError.message);
      setError("Could not save your profile. Please try again.");
      setLoading(false);
      return;
    }

    toast.success("Welcome to Schollective!");
    router.push(role === "professor" ? "/prof/pending" : "/dashboard");
  };

  if (checking) {
    return (
      <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <div style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)" }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-sans)" }}>
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
          width: "100%", maxWidth: "500px",
        }}
      >
        {/* Wordmark */}
        <motion.div variants={fadeUp} style={{ marginBottom: "3rem" }}>
          <span className="font-display" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em" }}>
            Schollective
          </span>
        </motion.div>

        {/* Eyebrow */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.32)", fontFamily: "var(--font-sans)" }}>
            One last step
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="font-display" style={{
          fontSize: "clamp(2rem, 5vw, 3rem)", fontWeight: 900, color: "#fafaf9",
          letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: "0.75rem",
        }}>
          Complete your<br />
          <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.35)" }}>profile.</em>
        </motion.h1>

        <motion.p variants={fadeUp} style={{
          fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.55)",
          marginBottom: "2.5rem", lineHeight: 1.7,
        }}>
          Tell us a bit about yourself so we can connect you with the right people.
        </motion.p>

        {/* Role selector */}
        <motion.div variants={fadeUp} style={{
          display: "flex", gap: "0.5rem", marginBottom: "2.5rem",
          padding: "0.3rem", background: "rgba(250, 250, 249, 0.04)",
          borderRadius: "100px", border: "1px solid rgba(250, 250, 249, 0.07)",
        }}>
          {(["student", "professor"] as Role[]).map((r) => (
            <button
              key={r} type="button" onClick={() => setRole(r)}
              style={{
                flex: 1, padding: "0.65rem 1rem", borderRadius: "100px",
                border: "none",
                background: role === r ? "#818cf8" : "transparent",
                color: role === r ? "#09090b" : "rgba(168, 179, 207, 0.5)",
                fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
                textTransform: "uppercase", cursor: "pointer",
                transition: "all 0.25s", fontFamily: "var(--font-sans)",
              }}
            >
              {r === "student" ? "Student" : "Professor"}
            </button>
          ))}
        </motion.div>

        <form onSubmit={handleSubmit}>
          <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

            {/* Name row */}
            <div className="grid-2" style={{ gap: "1.5rem" }}>
              <Field id="first_name" name="first_name" label="First Name" placeholder="Jane" defaultValue={defaultFirst} required />
              <Field id="last_name" name="last_name" label="Last Name" placeholder="Doe" defaultValue={defaultLast} required={role === "professor"} />
            </div>

            <Field id="preferred_name" name="preferred_name" label="Preferred Name (optional)" placeholder="Janey" />

            {/* Institution */}
            <div>
              <label htmlFor="institution" style={{
                display: "block", fontSize: "0.6rem", fontWeight: 600,
                letterSpacing: "0.18em", textTransform: "uppercase",
                color: "rgba(250, 250, 249, 0.3)", marginBottom: "0.55rem",
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

            {/* Role-specific fields */}
            <AnimatePresence mode="wait">
              {role === "student" ? (
                <motion.div key="student" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <div>
                    <label htmlFor="education_level" style={{ display: "block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", marginBottom: "0.55rem", fontFamily: "var(--font-sans)" }}>
                      Education Level
                    </label>
                    <select id="education_level" name="education_level" required
                      style={{ width: "100%", background: "#111113", border: "none", borderBottom: "1px solid rgba(129, 140, 248, 0.15)", padding: "0.7rem 0", fontSize: "0.95rem", color: "#fafaf9", outline: "none", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
                      <option value="high-school">High School</option>
                      <option value="college">College / Undergraduate</option>
                      <option value="graduate">Graduate (Masters / PhD)</option>
                    </select>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="prof" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.25 }}>
                  <Field id="expertise" name="expertise" label="Expertise Fields (comma-separated)" placeholder="e.g. Machine Learning, Bio-Ethics" required />
                </motion.div>
              )}
            </AnimatePresence>

            {error && (
              <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>
                {error}
              </motion.p>
            )}

            <motion.button
              type="submit" disabled={loading}
              whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
              style={{
                width: "100%", padding: "1.1rem 2rem",
                background: "#818cf8", color: "#09090b",
                border: "none", borderRadius: "100px",
                fontSize: "0.6rem", fontWeight: 700,
                letterSpacing: "0.28em", textTransform: "uppercase",
                cursor: loading ? "not-allowed" : "pointer",
                opacity: loading ? 0.6 : 1,
                transition: "opacity 0.2s", fontFamily: "var(--font-sans)",
              }}
            >
              {loading ? "Setting up your account…" : "Enter the Collective →"}
            </motion.button>
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
          <div style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)" }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-sans)" }}>
            Loading…
          </span>
        </div>
      </div>
    }>
      <OnboardingContent />
    </Suspense>
  );
}
