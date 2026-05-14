"use client";

import React, { useState, useEffect, Suspense } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  show:   { opacity: 1, y: 0,  transition: { duration: 1.1, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.12, delayChildren: 0.15 } },
};

function Field({
  id, name, type = "text", label, placeholder, required = false, suffix
}: {
  id: string; name: string; type?: string; label: string;
  placeholder: string; required?: boolean; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div className="relative">
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "0.62rem",
          fontWeight: 600,
          letterSpacing: "0.18em",
          textTransform: "uppercase",
          color: focused ? "rgba(250, 250, 249, 0.7)" : "rgba(250, 250, 249, 0.3)",
          marginBottom: "0.6rem",
          transition: "color 0.25s",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </label>
      <div className="relative flex items-center">
        <input
          id={id}
          name={name}
          type={type}
          placeholder={placeholder}
          required={required}
          onFocus={() => setFocused(true)}
          onBlur={() => setFocused(false)}
          style={{
            width: "100%",
            background: "transparent",
            border: "none",
            borderBottom: `1px solid ${focused ? "rgba(129, 140, 248, 0.7)" : "rgba(129, 140, 248, 0.18)"}`,
            padding: "0.75rem 0",
            fontSize: "1rem",
            color: "#fafaf9",
            outline: "none",
            transition: "border-color 0.3s",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.01em",
          }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 0, bottom: "0.75rem" }}>
            {suffix}
          </span>
        )}
      </div>
      <motion.div
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.7), transparent)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}

/* ── Inner component that uses useSearchParams (must be inside Suspense) ── */
function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

  // Show descriptive error messages from OAuth callback redirects
  useEffect(() => {
    const errorParam = searchParams.get("error");
    if (errorParam) {
      if (errorParam === "oauth_exchange_failed") {
        setError("Failed to sign in with Google. Please try again.");
      } else if (errorParam === "oauth_missing_code") {
        setError("Authentication code missing. Please try again.");
      } else {
        setError("An error occurred during sign in.");
      }
    }
  }, [searchParams]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd       = new FormData(e.currentTarget);
    const email    = fd.get("email")    as string;
    const password = fd.get("password") as string;

    try {
      const { data, error: signInError } = await supabase.auth.signInWithPassword({ email, password });
      if (signInError) throw signInError;
      toast.success("Welcome back.");

      const { data: profile } = await supabase
        .from("profiles")
        .select("role, status")
        .eq("id", data.user.id)
        .single();

      if (!profile) throw new Error("Profile not found.");

      // Support ?next= redirect (e.g. from middleware)
      const next = searchParams.get("next");
      if (next) {
        router.refresh();
        router.push(next);
        return;
      }

      if (profile.role === "professor") {
        router.refresh();
        router.push(profile.status === "approved" ? "/prof/dashboard" : "/prof/pending");
      } else if (profile.role === "admin") {
        router.refresh();
        router.push("/admin/dashboard");
      } else {
        router.refresh();
        router.push("/dashboard");
      }
    } catch (err: any) {
      const msg = err instanceof Error ? err.message : "An error occurred during sign in.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: "google",
        // Keep the redirect URL clean — no query params — so it passes
        // Supabase's redirect URL allowlist validation.
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in with Google.");
    }
  };

  return (
    <div className="auth-two-col signup-layout" style={{ background: "var(--bg-base)" }}>

      {/* ══ LEFT — Brand panel ══════════════════════════════════════════ */}
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
              Your scholars are{" "}
              <em style={{ color: "rgba(250, 250, 249, 0.35)", fontStyle: "italic" }}>waiting.</em>
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", marginBottom: "2.5rem" }}>
              {[
                { step: "01", text: "Sign in to your verified account" },
                { step: "02", text: "Review your mentorship threads"   },
                { step: "03", text: "Continue the dialogue"            },
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

      {/* ══ RIGHT — Form panel ══════════════════════════════════════════ */}
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
        {/* Subtle glow */}
        <div style={{ position: "absolute", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 100% 50%, rgba(30,55,120,0.12) 0%, transparent 70%)" }} />

        {/* Top nav */}
        <div style={{ display: "flex", justifyContent: "flex-end", position: "relative", zIndex: 1 }}>
          <Link href="/signup" className="no-underline" style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.35)", fontFamily: "var(--font-sans)" }}>
            New here? <span style={{ color: "rgba(250, 250, 249, 0.75)" }}>Create Account →</span>
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
              Scholar Portal
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3.2rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: "2.5rem" }}>
            Welcome<br />
            <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.4)" }}>back.</em>
          </motion.h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.25rem" }}>
              <motion.div variants={fadeUp}>
                <Field id="email" name="email" type="email" label="Institutional Email" placeholder="name@university.edu" required />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Field
                  id="password" name="password" type="password"
                  label="Password" placeholder="••••••••" required
                  suffix={
                    <Link href="/reset-password" className="no-underline" style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.28)" }}>
                      Forgot?
                    </Link>
                  }
                />
              </motion.div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>
                  {error}
                </motion.p>
              )}

              <motion.div variants={fadeUp} style={{ paddingTop: "0.5rem", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
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
                  {loading ? "Authenticating…" : "Enter the Collective"}
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
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fafaf9" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fafaf9" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fafaf9" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fafaf9" />
                  </svg>
                  Sign in with Google
                </motion.button>
              </motion.div>

              <motion.p variants={fadeUp} style={{ textAlign: "center", fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.22)", fontFamily: "var(--font-sans)" }}>
                New here?{" "}
                <Link href="/signup" className="no-underline" style={{ color: "rgba(250, 250, 249, 0.6)" }}>
                  Create Account →
                </Link>
              </motion.p>
            </div>
          </form>
        </motion.div>

        <div style={{ position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.14)", fontFamily: "var(--font-sans)" }}>
            Academic integrity · Verified credentials
          </span>
        </div>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
