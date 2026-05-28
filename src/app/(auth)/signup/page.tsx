"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { InstitutionInput } from "@/components/ui/InstitutionInput";
import { validateEmail, type EmailValidationResult } from "@/lib/validators";


export const dynamic = "force-dynamic";

type Role = "student" | "professor";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

/* ── Underline field with animated focus state ── */
function Field({
  id, name, type = "text", label, placeholder, required = false,
}: {
  id: string; name: string; type?: string; label: string;
  placeholder: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div className="relative">
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "0.6rem",
          fontWeight: 600,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: focused ? "rgba(15, 23, 42, 0.65)" : "rgba(15, 23, 42, 0.3)",
          marginBottom: "0.55rem",
          transition: "color 0.25s",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </label>
      <input
        id={id} name={name} type={type}
        placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "transparent",
          border: "none",
          borderBottom: `1px solid ${focused ? "rgba(37, 99, 235, 0.6)" : "rgba(37, 99, 235, 0.15)"}`,
          padding: "0.85rem 0",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          outline: "none",
          transition: "border-color 0.3s",
          fontFamily: "var(--font-sans)",
        }}
      />
    </div>
  );
}

/* ── Custom select ── */
function FieldSelect({ id, name, label, children, required }: {
  id: string; name: string; label: string; children: React.ReactNode; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div>
      <label htmlFor={id} style={{ display: "block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: focused ? "rgba(15, 23, 42, 0.65)" : "rgba(15, 23, 42, 0.3)", marginBottom: "0.55rem", transition: "color 0.25s", fontFamily: "var(--font-sans)" }}>
        {label}
      </label>
      <select
        id={id} name={name} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", background: "#111113", border: "none", borderBottom: `1px solid ${focused ? "rgba(37, 99, 235, 0.6)" : "rgba(37, 99, 235, 0.15)"}`, padding: "0.85rem 0", fontSize: "0.95rem", color: "var(--text-primary)", outline: "none", fontFamily: "var(--font-sans)", transition: "border-color 0.3s", cursor: "pointer" }}
      >
        {children}
      </select>
    </div>
  );
}

function SignupContent() {
  const router   = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [role,    setRole]    = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // If there's an error in the URL (e.g. from OAuth callback), show it
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "oauth_exchange_failed") {
        setError("Failed to exchange Google account information. Please try again.");
      } else if (errorParam === "oauth_missing_code") {
        setError("The authentication code is missing. Please try again.");
      } else {
        setError("An error occurred during sign up with Google.");
      }
    }
  }, [searchParams]);

  const [institution, setInstitution] = useState("");
  const [emailVal, setEmailVal] = useState<EmailValidationResult | null>(null);
  const [emailDirty, setEmailDirty] = useState(false);

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const val = e.target.value;
    if (!val) { setEmailVal(null); return; }
    setEmailDirty(true);
    setEmailVal(validateEmail(val, role));
  };

  // Re-validate when role changes (professor → stricter)
  const handleRoleChange = (r: Role) => {
    setRole(r);
    if (emailDirty) {
      const emailEl = document.getElementById("email") as HTMLInputElement | null;
      if (emailEl?.value) setEmailVal(validateEmail(emailEl.value, r));
    }
  };


  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd = new FormData(e.currentTarget);

    // Run validation on submit in case the user never blurred the field
    const emailInput = fd.get("email") as string;
    const finalValidation = validateEmail(emailInput, role);
    setEmailVal(finalValidation);
    setEmailDirty(true);
    if (!finalValidation.ok) {
      setError(finalValidation.message);
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email:    fd.get("email")    as string,
        password: fd.get("password") as string,
        options: {
          data: {
            role,
            first_name:      fd.get("first_name")      as string,
            preferred_name:  fd.get("preferred_name")  as string,
            last_name:       fd.get("last_name")        as string,
            education_level: fd.get("education_level") as string,
            institution:     institution || fd.get("institution") as string,

            expertise:       fd.get("expertise")       as string,
          },
        },
      });
      if (signUpError) throw signUpError;

      toast.success("Account created! Welcome to Schollective.");
      router.refresh();
      router.push(role === "professor" ? "/prof/pending" : "/dashboard");
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "An error occurred during signup.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      // Store the selected role in localStorage so the onboarding page
      // can read it after the OAuth redirect.
      localStorage.setItem("signup_role", role);

      const next = searchParams.get("next") || "/dashboard";
      const callbackUrl = new URL("/auth/callback", window.location.origin);
      callbackUrl.searchParams.set("next", next);

      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: callbackUrl.toString(),
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up with Google.");
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "var(--bg-base)",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* Background glow */}
      <div style={{
        position: "fixed", inset: 0, pointerEvents: "none",
        background: "radial-gradient(ellipse 60% 50% at 50% 0%, rgba(99, 102, 241, 0.15) 0%, transparent 70%)",
      }} />

      {/* ── Pill Nav ─────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: "1.5rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 50, display: "flex", alignItems: "center",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "2rem",
          background: "rgba(17, 17, 19, 0.85)",
          backdropFilter: "blur(20px)",
          border: "1px solid rgba(37, 99, 235, 0.12)",
          borderRadius: "100px",
          padding: "0.6rem 1.5rem",
          boxShadow: "0 8px 32px rgba(0,0,0,0.4)",
        }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Schollective
            </span>
          </Link>
          <div style={{ width: "1px", height: "1rem", background: "rgba(15, 23, 42, 0.1)" }} />
          <Link href="/login" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(15, 23, 42, 0.45)",
              fontFamily: "var(--font-sans)",
            }}>
              Sign In →
            </span>
          </Link>
        </div>
      </div>

      {/* ── Form centered ──────────────────────────────────────── */}
      <div style={{
        flex: 1, display: "flex", alignItems: "center", justifyContent: "center",
        padding: "8rem 1.5rem 4rem",
        position: "relative", zIndex: 1,
      }}>
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ width: "100%", maxWidth: "480px" }}
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.75rem" }}>
            <span style={{ width: "1.5rem", height: "1px", background: "rgba(37, 99, 235, 0.4)", display: "block" }} />
            <span style={{
              fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em",
              textTransform: "uppercase", color: "rgba(37, 99, 235, 0.7)",
              fontFamily: "var(--font-sans)",
            }}>
              Join the Collective
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.6rem, 6vw, 3.8rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: "2.5rem" }}>
            Create your<br />
            <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.38)" }}>account.</em>
          </motion.h1>

          {/* Role selector — pill tabs */}
          <motion.div variants={fadeUp} style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem", padding: "0.3rem", background: "rgba(15, 23, 42, 0.04)", borderRadius: "100px", border: "1px solid rgba(15, 23, 42, 0.07)", width: "100%" }}>
            {(["student", "professor"] as Role[]).map(r => (
              <button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                style={{
                  flex: 1,
                  padding: "0.65rem 1rem",
                  borderRadius: "100px",
                  border: "none",
                  background: role === r ? "var(--accent)" : "transparent",
                  color: role === r ? "var(--bg-base)" : "rgba(168, 179, 207, 0.5)",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.2em",
                  textTransform: "uppercase",
                  cursor: "pointer",
                  transition: "all 0.25s",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {r === "student" ? "Student" : "Professor"}
              </button>
            ))}
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>

              {/* Name row */}
              <motion.div variants={fadeUp} className="grid-2" style={{ gap: "1.5rem" }}>
                <Field id="first_name" name="first_name" label="First Name" placeholder="Jane" required />
                <Field id="last_name"  name="last_name"  label="Last Name"  placeholder="Doe"  required={role === "professor"} />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Field id="preferred_name" name="preferred_name" label="Preferred Name (optional)" placeholder="Janey" />
              </motion.div>

              <motion.div variants={fadeUp}>
                {/* Email field with inline validation feedback */}
                <div style={{ position: "relative" }}>
                  <label
                    htmlFor="email"
                    style={{
                      display: "block", fontSize: "0.6rem", fontWeight: 600,
                      letterSpacing: "0.22em", textTransform: "uppercase",
                      color: emailVal?.state === "error" ? "rgba(255,100,100,0.8)"
                           : emailVal?.state === "warn"  ? "rgba(255,190,80,0.8)"
                           : emailVal?.state === "valid" ? "rgba(120,220,120,0.8)"
                           : "rgba(15, 23, 42, 0.3)",
                      marginBottom: "0.55rem", transition: "color 0.25s",
                      fontFamily: "var(--font-sans)",
                    }}
                  >
                    {role === "professor" ? "Work / Institutional Email" : "Email Address"}
                  </label>
                  <input
                    id="email" name="email" type="email"
                    placeholder="jane@university.edu" required
                    onBlur={handleEmailBlur}
                    onChange={() => { if (emailDirty) setEmailVal(null); }}
                    style={{
                      width: "100%", background: "transparent", border: "none",
                      borderBottom: `1px solid ${
                        emailVal?.state === "error" ? "rgba(255,100,100,0.6)"
                      : emailVal?.state === "warn"  ? "rgba(255,190,80,0.6)"
                      : emailVal?.state === "valid" ? "rgba(120,220,120,0.5)"
                      : "rgba(37, 99, 235, 0.15)"
                      }`,
                      padding: "0.85rem 0", fontSize: "0.95rem", color: "var(--text-primary)",
                      outline: "none", transition: "border-color 0.3s",
                      fontFamily: "var(--font-sans)",
                    }}
                  />
                  {/* Inline validation badge */}
                  <AnimatePresence>
                    {emailVal && emailVal.state !== "idle" && (
                      <motion.div
                        key={emailVal.state}
                        initial={{ opacity: 0, y: -4 }}
                        animate={{ opacity: 1, y: 0 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.2 }}
                        style={{
                          marginTop: "0.5rem",
                          display: "inline-flex", alignItems: "center", gap: "0.4rem",
                          padding: "0.2rem 0.65rem", borderRadius: "100px",
                          fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.12em",
                          fontFamily: "var(--font-sans)",
                          background: emailVal.state === "error" ? "rgba(255,80,80,0.1)"
                                    : emailVal.state === "warn"  ? "rgba(255,190,80,0.1)"
                                    : "rgba(80,220,120,0.1)",
                          color: emailVal.state === "error" ? "rgba(255,110,110,0.9)"
                               : emailVal.state === "warn"  ? "rgba(255,200,90,0.9)"
                               : "rgba(100,220,130,0.9)",
                          border: `1px solid ${
                            emailVal.state === "error" ? "rgba(255,80,80,0.25)"
                          : emailVal.state === "warn"  ? "rgba(255,190,80,0.25)"
                          : "rgba(80,220,120,0.25)"
                          }`,
                        }}
                      >
                        <span style={{ fontSize: "0.7rem" }}>
                          {emailVal.state === "error" ? "✕"
                           : emailVal.state === "warn" ? "⚠"
                           : "✓"}
                        </span>
                        {emailVal.message}
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </motion.div>

              <AnimatePresence mode="wait">
                {role === "student" ? (
                  <motion.div key="student" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }}>
                    <FieldSelect id="education_level" name="education_level" label="Education Level" required>
                      <option value="high-school">High School</option>
                      <option value="college">College / Undergraduate</option>
                      <option value="graduate">Graduate (Masters / PhD)</option>
                    </FieldSelect>
                  </motion.div>
                ) : (
                  <motion.div key="prof" initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }} exit={{ opacity: 0, height: 0 }} transition={{ duration: 0.3 }} style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>
                    {/* Institution with smart autocomplete */}
                    <div>
                      <label
                        htmlFor="institution"
                        style={{
                          display: "block",
                          fontSize: "0.6rem",
                          fontWeight: 600,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "rgba(15, 23, 42, 0.3)",
                          marginBottom: "0.55rem",
                          fontFamily: "var(--font-sans)",
                        }}
                      >
                        Institution
                      </label>
      <InstitutionInput
                        id="institution"
                        name="institution"
                        value={institution}
                        onChange={setInstitution}
                        placeholder="e.g. Stanford University"
                        className=""
                      />

                      {/* Hidden input so FormData still picks it up */}
                      <input type="hidden" name="institution" value={institution} />
                    </div>

                    <Field id="expertise"   name="expertise"   label="Expertise Fields" placeholder="e.g. Machine Learning, Bio-Ethics" required />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={fadeUp}>
                <Field id="password" name="password" type="password" label="Password" placeholder="Min. 8 characters" required />
              </motion.div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>
                  {error}
                </motion.p>
              )}

              <motion.div variants={fadeUp} style={{ paddingTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.01 }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", padding: "1.15rem 2.5rem", background: "var(--accent)", color: "var(--bg-base)",
                    border: "none", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.28em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1, transition: "opacity 0.2s", fontFamily: "var(--font-sans)",
                  }}
                >
                  {loading ? "Creating account…" : "Enter the Collective"}
                </motion.button>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(15, 23, 42, 0.1)" }} />
                  <span style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans)" }}>Or</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(15, 23, 42, 0.1)" }} />
                </div>

                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(15, 23, 42, 0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", padding: "1.15rem 2.5rem", background: "rgba(15, 23, 42, 0.04)",
                    color: "var(--text-primary)", border: "1px solid rgba(15, 23, 42, 0.12)", borderRadius: "100px",
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-sans)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--text-primary)" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--text-primary)" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--text-primary)" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--text-primary)" />
                  </svg>
                  Sign up with Google
                </motion.button>
              </motion.div>

              <motion.p variants={fadeUp} style={{ textAlign: "center", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.1em", color: "rgba(15, 23, 42, 0.22)", fontFamily: "var(--font-sans)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "rgba(15, 23, 42, 0.55)", textDecoration: "none" }}>
                  Sign in →
                </Link>
              </motion.p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer note */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "1.5rem" }}>
        <span style={{ fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.14)", fontFamily: "var(--font-sans)" }}>
          Manually verified · Institutionally credentialed · © 2025 Schollective
        </span>
      </div>
    </div>
  );
}

export default function SignupPage() {
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
      <SignupContent />
    </Suspense>
  );
}
