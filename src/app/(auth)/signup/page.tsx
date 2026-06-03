"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
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
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: focused ? "rgba(250, 250, 249, 0.65)" : "rgba(250, 250, 249, 0.3)",
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
          borderBottom: `1px solid ${focused ? "rgba(129, 140, 248, 0.6)" : "rgba(129, 140, 248, 0.15)"}`,
          padding: "0.7rem 0",
          fontSize: "0.95rem",
          color: "#fafaf9",
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
      <label htmlFor={id} style={{ display: "block", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.18em", textTransform: "uppercase", color: focused ? "rgba(250, 250, 249, 0.65)" : "rgba(250, 250, 249, 0.3)", marginBottom: "0.55rem", transition: "color 0.25s", fontFamily: "var(--font-sans)" }}>
        {label}
      </label>
      <select
        id={id} name={name} required={required}
        onFocus={() => setFocused(true)} onBlur={() => setFocused(false)}
        style={{ width: "100%", background: "#111113", border: "none", borderBottom: `1px solid ${focused ? "rgba(129, 140, 248, 0.6)" : "rgba(129, 140, 248, 0.15)"}`, padding: "0.7rem 0", fontSize: "0.95rem", color: "#fafaf9", outline: "none", fontFamily: "var(--font-sans)", transition: "border-color 0.3s", cursor: "pointer" }}
      >
        {children}
      </select>
    </div>
  );
}

export default function SignupPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [role,    setRole]    = useState<Role>("student");
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);
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
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to sign up with Google.");
    }
  };

  return (
    <div className="auth-two-col signup-layout" style={{ background: "var(--bg-base)" }}>

      {/* ════════════════════════════════════════
          LEFT — Brand panel (mirrors login's right)
      ════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem 5vw",
          position: "relative",
          overflow: "hidden",
          borderRight: "1px solid rgba(129, 140, 248, 0.08)",
          background: "linear-gradient(135deg, #09090b 0%, #111113 100%)",
        }}
      >
        {/* Glow orbs */}
        <div style={{ position: "absolute", top: "20%", left: "0%", width: "45vw", height: "45vw", maxWidth: 440, maxHeight: 440, borderRadius: "50%", background: "radial-gradient(circle, rgba(99, 102, 241, 0.18) 0%, transparent 70%)", filter: "blur(40px)", pointerEvents: "none" }} />
        <div style={{ position: "absolute", bottom: "10%", right: "-10%", width: "35vw", height: "35vw", maxWidth: 340, maxHeight: 340, borderRadius: "50%", background: "radial-gradient(circle, rgba(129, 140, 248, 0.07) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

        {/* Academic network SVG */}
        <svg viewBox="0 0 400 400" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(12deg)", width: "min(50vw, 420px)", opacity: 0.07, pointerEvents: "none" }}>
          <circle cx="200" cy="200" r="3" fill="white" />
          {[[90,150],[310,150],[90,280],[310,280],[200,60],[200,340]].map(([cx,cy],i) => (
            <React.Fragment key={i}>
              <circle cx={cx} cy={cy} r="2" fill="white" />
              <line x1="200" y1="200" x2={cx} y2={cy} stroke="white" strokeWidth="0.7" />
            </React.Fragment>
          ))}
          {[[140,130],[260,130],[140,290],[260,290]].map(([cx,cy],i) => (
            <circle key={`s${i}`} cx={cx} cy={cy} r="1.2" fill="white" opacity="0.7" />
          ))}
        </svg>

        {/* Wordmark */}
        <Link href="/" className="no-underline" style={{ position: "relative", zIndex: 1 }}>
          <span className="font-display" style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em" }}>
            Schollective
          </span>
        </Link>

        {/* Editorial content */}
        <div style={{ position: "relative", zIndex: 1, maxWidth: 400 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 1.4, ease: EASE }}
          >
            <p className="font-display" style={{ fontSize: "clamp(1.5rem, 2.8vw, 2.4rem)", fontWeight: 700, lineHeight: 1.2, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em", marginBottom: "2rem", maxWidth: 380 }}>
              Your research journey
              begins with the{" "}
              <em style={{ color: "rgba(250, 250, 249, 0.35)", fontStyle: "italic" }}>right mentor.</em>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
              {[
                { step: "01", text: "Create your scholar profile" },
                { step: "02", text: "Browse verified professors"  },
                { step: "03", text: "Open a mentorship thread"    },
              ].map(({ step, text }) => (
                <div key={step} style={{ display: "flex", alignItems: "center", gap: "1rem" }}>
                  <span className="font-display" style={{ fontSize: "0.9rem", fontWeight: 800, color: "rgba(250, 250, 249, 0.18)", letterSpacing: "-0.02em", minWidth: "2rem" }}>{step}</span>
                  <span style={{ fontSize: "0.82rem", color: "rgba(250, 250, 249, 0.5)", fontFamily: "var(--font-sans)", fontWeight: 400 }}>{text}</span>
                </div>
              ))}
            </div>

            <div style={{ width: "3rem", height: "1px", background: "rgba(250, 250, 249, 0.15)", marginBottom: "1.5rem" }} />
            <p style={{ fontSize: "0.55rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.2)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              Manually verified · Institutionally credentialed
            </p>
          </motion.div>
        </div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.18)", fontFamily: "var(--font-sans)" }}>
            © 2025 Schollective
          </span>
        </div>
      </motion.div>

      {/* ════════════════════════════════════════
          RIGHT — Form panel
      ════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem 5vw",
          overflowY: "auto",
          position: "relative",
        }}
      >
        {/* Subtle right-side glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 100% 50%, rgba(30,55,120,0.12) 0%, transparent 70%)" }} />

        {/* Top right nav */}
        <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
          <Link href="/login" className="no-underline" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-sans)" }}>
            Already a member? <span style={{ color: "rgba(250, 250, 249, 0.75)" }}>Log In →</span>
          </Link>
        </div>

        {/* Form container */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 1, maxWidth: 460, width: "100%", margin: "0 auto", paddingTop: "2rem", paddingBottom: "2rem" }}
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
            <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.2)", display: "block" }} />
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.32)", fontFamily: "var(--font-sans)" }}>
              Join the Collective
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: "2rem" }}>
            Create your<br />
            <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.4)" }}>account.</em>
          </motion.h1>

          {/* Role selector — pill tabs */}
          <motion.div variants={fadeUp} style={{ display: "flex", gap: "0.5rem", marginBottom: "2.5rem", padding: "0.3rem", background: "rgba(250, 250, 249, 0.04)", borderRadius: "100px", border: "1px solid rgba(250, 250, 249, 0.07)" }}>
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
                  background: role === r ? "#818cf8" : "transparent",
                  color: role === r ? "#09090b" : "rgba(168, 179, 207, 0.5)",
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
            <div style={{ display: "flex", flexDirection: "column", gap: "1.75rem" }}>

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
                      letterSpacing: "0.18em", textTransform: "uppercase",
                      color: emailVal?.state === "error" ? "rgba(255,100,100,0.8)"
                           : emailVal?.state === "warn"  ? "rgba(255,190,80,0.8)"
                           : emailVal?.state === "valid" ? "rgba(120,220,120,0.8)"
                           : "rgba(250, 250, 249, 0.3)",
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
                      : "rgba(129, 140, 248, 0.15)"
                      }`,
                      padding: "0.7rem 0", fontSize: "0.95rem", color: "#fafaf9",
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
                          letterSpacing: "0.18em",
                          textTransform: "uppercase",
                          color: "rgba(250, 250, 249, 0.3)",
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
                    width: "100%", padding: "1.1rem 2rem", background: "#818cf8", color: "#09090b",
                    border: "none", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.28em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1, transition: "opacity 0.2s", fontFamily: "var(--font-sans)",
                  }}
                >
                  {loading ? "Creating account…" : "Enter the Collective"}
                </motion.button>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(250, 250, 249, 0.1)" }} />
                  <span style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-sans)" }}>Or</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(250, 250, 249, 0.1)" }} />
                </div>

                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(250, 250, 249, 0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", padding: "1.1rem 2rem", background: "rgba(250, 250, 249, 0.04)",
                    color: "#fafaf9", border: "1px solid rgba(250, 250, 249, 0.12)", borderRadius: "100px",
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-sans)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fafaf9" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fafaf9" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fafaf9" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fafaf9" />
                  </svg>
                  Sign up with Google
                </motion.button>
              </motion.div>

              <motion.p variants={fadeUp} style={{ textAlign: "center", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.22)", fontFamily: "var(--font-sans)" }}>
                By joining, you agree to our{" "}
                <span style={{ color: "rgba(250, 250, 249, 0.5)" }}>Terms of Service</span>
              </motion.p>
            </div>
          </form>
        </motion.div>

        {/* Bottom spacer */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.14)", fontFamily: "var(--font-sans)" }}>
            Academic integrity · Verified credentials
          </span>
        </div>
      </div>
    </div>
  );
}
