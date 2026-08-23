"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";
import { Button } from "@/components/ui/Button";
import { InstitutionInput } from "@/components/ui/InstitutionInput";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { validateEmail, type EmailValidationResult } from "@/lib/validators-client";

export const dynamic = "force-dynamic";

type Role = "student" | "professor";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
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
          fontSize: "0.62rem",
          fontWeight: 800,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: focused ? "var(--accent)" : "var(--text-primary)",
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
          background: "var(--bg-surface-1)",
          border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "100px",
          padding: "1rem 1.75rem",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          outline: "none",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          fontFamily: "var(--font-sans)",
          boxShadow: focused ? "0 0 0 4px var(--accent-dim)" : "none",
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
      <label htmlFor={id} style={{ display: "block", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: focused ? "var(--accent)" : "var(--text-primary)", marginBottom: "0.55rem", transition: "color 0.25s", fontFamily: "var(--font-sans)" }}>
        {label}
      </label>
      <select
        id={id} name={name} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{
          width: "100%",
          background: "var(--bg-surface-1)",
          border: `1.5px solid ${focused ? "var(--accent)" : "var(--border)"}`,
          borderRadius: "100px",
          padding: "1rem 3rem 1rem 1.85rem",
          fontSize: "0.95rem",
          color: "var(--text-primary)",
          outline: "none",
          fontFamily: "var(--font-sans)",
          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
          cursor: "pointer",
          boxShadow: focused ? "0 0 0 4px var(--accent-dim)" : "none",
          appearance: "none",
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='10' height='10' viewBox='0 0 24 24' fill='none' stroke='%234f46e5' stroke-width='2.2'%3E%3Cpolyline points='6 9 12 15 18 9'/%3E%3C/svg%3E")`,
          backgroundRepeat: "no-repeat",
          backgroundPosition: "right 1.5rem center",
        }}
      >
        {children}
      </select>
    </div>
  );
}

function SignupContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();
  const [role, setRole] = useState<Role>("student");
  const [institution, setInstitution] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Email validation state
  const [emailVal, setEmailVal] = useState<EmailValidationResult | null>(null);
  const [emailDirty, setEmailDirty] = useState(false);

  useEffect(() => {
    const roleParam = searchParams.get("role");
    if (roleParam === "professor" || roleParam === "student") {
      setRole(roleParam);
    }
  }, [searchParams]);

  const handleRoleChange = (newRole: Role) => {
    setRole(newRole);
    setEmailVal(null);
    setEmailDirty(false);
  };

  const handleEmailBlur = (e: React.FocusEvent<HTMLInputElement>) => {
    const email = e.target.value.trim();
    if (!email) return;
    setEmailDirty(true);
    const result = validateEmail(email, role);
    setEmailVal(result);
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const fd = new FormData(e.currentTarget);
    const email = (fd.get("email") as string).trim();
    const password = fd.get("password") as string;
    const first_name = (fd.get("first_name") as string).trim();
    const last_name = (fd.get("last_name") as string)?.trim() || "";
    const preferred_name = (fd.get("preferred_name") as string)?.trim() || "";
    const education_level = fd.get("education_level") as string || "";
    const expertise = (fd.get("expertise") as string)?.trim() || "";

    const valResult = validateEmail(email, role);
    if (!valResult.ok) {
      setError(valResult.message);
      setLoading(false);
      return;
    }

    try {
      const { data, error: signUpError } = await supabase.auth.signUp({
        email,
        password,
        options: {
          data: {
            first_name,
            last_name,
            preferred_name,
            role,
            institution: role === "professor" ? institution : "",
            education_level: role === "student" ? education_level : "",
            expertise: role === "professor" ? expertise : "",
          },
        },
      });

      if (signUpError) throw signUpError;

      if (data.session) {
        if (role === "professor") {
          toast.success("Application submitted for verification.");
          router.push("/prof/pending");
        } else {
          toast.success("Welcome to Schollective.");
          router.push("/dashboard");
        }
      } else {
        toast.success("Check your email for the confirmation link.");
        router.push("/verify-email");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Sign up failed";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
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
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Failed to sign up with Google.";
      toast.error(msg);
    }
  };

  return (
    <div
      className="page-bg"
      style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        position: "relative",
        overflow: "hidden",
      }}
    >
      {/* ── Pill Nav ─────────────────────────────────────────── */}
      <div style={{
        position: "fixed", top: "1.5rem", left: "50%", transform: "translateX(-50%)",
        zIndex: 50, display: "flex", alignItems: "center",
      }}>
        <div style={{
          display: "flex", alignItems: "center", gap: "1.25rem",
          background: "var(--glass-bg)",
          backdropFilter: "blur(20px)",
          border: "1px solid var(--border)",
          borderRadius: "100px",
          padding: "0.5rem 1.25rem",
          boxShadow: "0 4px 30px rgba(0, 0, 0, 0.05)",
        }}>
          <Link href="/" style={{ display: "flex", alignItems: "center", gap: "0.5rem", textDecoration: "none" }}>
            <SchollectiveLogo size={18} />
            <span className="font-display hover:text-indigo-600 transition-colors" style={{ fontSize: "0.95rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Schollective
            </span>
          </Link>
          <div style={{ width: "1px", height: "1rem", background: "var(--border)" }} />
          <ThemeToggle />
          <div style={{ width: "1px", height: "1rem", background: "var(--border)" }} />
          <Link href="/login" style={{ textDecoration: "none" }}>
            <span className="hover:text-indigo-700 transition-colors" style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "var(--accent)",
              fontFamily: "var(--font-sans)",
              whiteSpace: "nowrap",
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
            <span style={{ width: "1.5rem", height: "1px", background: "var(--accent)", display: "block" }} />
            <span style={{
              fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em",
              textTransform: "uppercase", color: "var(--accent)",
              fontFamily: "var(--font-sans)",
            }}>
              Join the Collective
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.6rem, 6vw, 3.8rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 0.95, marginBottom: "3.5rem" }}>
            Create your<br />
            <em style={{ fontStyle: "italic", color: "var(--text-tertiary)" }}>account.</em>
          </motion.h1>

          {/* Role selector — pill tabs */}
          <motion.div variants={fadeUp} style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem", padding: "0.3rem", background: "var(--bg-surface-2)", borderRadius: "100px", border: "1px solid var(--border)", width: "100%" }}>
            {(["student", "professor"] as Role[]).map(r => (
              <Button
                key={r}
                type="button"
                onClick={() => handleRoleChange(r)}
                variant={role === r ? "primary" : "ghost"}
                size="md"
                className={`flex-1 ${role !== r && 'border-transparent text-slate-500 dark:text-slate-400'}`}
              >
                {r === "student" ? "Student" : "Professor"}
              </Button>
            ))}
          </motion.div>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>

              {/* Name row */}
              <motion.div variants={fadeUp} className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <Field id="first_name" name="first_name" label="First Name" placeholder="Jane" required />
                <Field id="last_name" name="last_name" label="Last Name" placeholder="Doe" required={role === "professor"} />
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
                      display: "block", fontSize: "0.62rem", fontWeight: 800,
                      letterSpacing: "0.22em", textTransform: "uppercase",
                      color: emailVal?.state === "error" ? "#ef4444"
                        : emailVal?.state === "warn" ? "#f59e0b"
                          : emailVal?.state === "valid" ? "#10b981"
                            : "var(--text-primary)",
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
                      width: "100%",
                      background: "var(--bg-surface-1)",
                      border: `1.5px solid ${emailVal?.state === "error" ? "#ef4444"
                          : emailVal?.state === "warn" ? "#f59e0b"
                            : emailVal?.state === "valid" ? "#10b981"
                              : "var(--border)"
                        }`,
                      borderRadius: "100px",
                      padding: "1rem 1.75rem",
                      fontSize: "0.95rem",
                      color: "var(--text-primary)",
                      outline: "none",
                      transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)",
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
                          background: emailVal.state === "error" ? "rgba(239, 68, 68, 0.1)"
                            : emailVal.state === "warn" ? "rgba(245, 158, 11, 0.1)"
                              : "rgba(16, 185, 129, 0.1)",
                          color: emailVal.state === "error" ? "#ef4444"
                            : emailVal.state === "warn" ? "#f59e0b"
                              : "#10b981",
                          border: `1px solid ${emailVal.state === "error" ? "rgba(239, 68, 68, 0.3)"
                              : emailVal.state === "warn" ? "rgba(245, 158, 11, 0.3)"
                                : "rgba(16, 185, 129, 0.3)"
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
                          fontSize: "0.62rem",
                          fontWeight: 800,
                          letterSpacing: "0.22em",
                          textTransform: "uppercase",
                          color: "var(--text-primary)",
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

                    <Field id="expertise" name="expertise" label="Expertise Fields" placeholder="e.g. Machine Learning, Bio-Ethics" required />
                  </motion.div>
                )}
              </AnimatePresence>

              <motion.div variants={fadeUp}>
                <Field id="password" name="password" type="password" label="Password" placeholder="Min. 8 characters" required />
              </motion.div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "0.78rem", color: "#ef4444", fontFamily: "var(--font-sans)" }}>
                  {error}
                </motion.p>
              )}

              <motion.div variants={fadeUp} style={{ paddingTop: "0.25rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
                <Button
                  type="submit"
                  disabled={loading}
                  variant="primary"
                  size="lg"
                  className="w-full uppercase tracking-widest text-[0.6rem]"
                >
                  {loading ? "Creating account…" : "Enter the Collective"}
                </Button>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                  <span style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>Or</span>
                  <div style={{ flex: 1, height: "1px", background: "var(--border)" }} />
                </div>

                <Button
                  type="button"
                  onClick={handleGoogleSignIn}
                  variant="ghost"
                  size="lg"
                  className="w-full uppercase tracking-widest text-[0.6rem]"
                  icon={
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--text-primary)" />
                      <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--text-primary)" />
                      <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--text-primary)" />
                      <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--text-primary)" />
                    </svg>
                  }
                >
                  Sign up with Google
                </Button>
              </motion.div>

              <motion.p variants={fadeUp} style={{ textAlign: "center", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.1em", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
                Already have an account?{" "}
                <Link href="/login" style={{ color: "var(--accent)", textDecoration: "none" }}>
                  Sign in →
                </Link>
              </motion.p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer note */}
      <div style={{ position: "relative", zIndex: 1, textAlign: "center", padding: "1.5rem" }}>
        <span style={{ fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--text-tertiary)", fontFamily: "var(--font-sans)" }}>
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
          <div style={{ width: "1.5rem", height: "1px", background: "var(--accent)" }} />
          <span style={{ fontSize: "0.55rem", letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--text-secondary)", fontFamily: "var(--font-sans)" }}>
            Loading…
          </span>
        </div>
      </div>
    }>
      <SignupContent />
    </Suspense>
  );
}
