"use client";

import React, { useState } from "react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
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

/* ────────────────────────────────────────────
   Focused input — animated underline on focus
──────────────────────────────────────────── */
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
          color: focused ? "rgba(255,255,255,0.7)" : "rgba(255,255,255,0.3)",
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
            borderBottom: `1px solid ${focused ? "rgba(255,255,255,0.55)" : "rgba(255,255,255,0.12)"}`,
            padding: "0.75rem 0",
            fontSize: "1rem",
            color: "#fff",
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
      {/* Animated underline glow */}
      <motion.div
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          height: "1px",
          background: "linear-gradient(90deg, transparent, rgba(255,255,255,0.8), transparent)",
          transformOrigin: "center",
        }}
      />
    </div>
  );
}

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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
        provider: 'google',
        options: {
          redirectTo: `${window.location.origin}/auth/callback`,
        },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in with Google.");
    }
  };

  return (
    <div className="auth-two-col" style={{ background: "#080c14" }}>
      {/* ════════════════════════════════════════
          LEFT — Form panel
      ════════════════════════════════════════ */}
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "2.5rem 5vw",
          borderRight: "1px solid rgba(255,255,255,0.06)",
          position: "relative",
          overflow: "hidden",
        }}
      >
        {/* Subtle left-edge blue glow */}
        <div style={{
          position: "absolute", inset: 0, pointerEvents: "none",
          background: "radial-gradient(ellipse 80% 60% at 0% 50%, rgba(30,55,120,0.18) 0%, transparent 70%)",
        }} />

        {/* Wordmark */}
        <Link href="/" className="no-underline" style={{ position: "relative", zIndex: 1 }}>
          <span
            className="font-display"
            style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}
          >
            Schollective
          </span>
        </Link>

        {/* Form */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 1, maxWidth: 420, width: "100%", margin: "0 auto", paddingTop: "4rem", paddingBottom: "4rem" }}
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.25)", display: "block" }} />
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.38)", fontFamily: "var(--font-sans)" }}>
              Scholar Portal
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display"
            style={{ fontSize: "clamp(2.8rem, 5vw, 4rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: "3.5rem" }}
          >
            Welcome<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.45)" }}>back.</em>
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
                    <Link href="/reset-password" className="no-underline" style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)" }}>
                      Forgot?
                    </Link>
                  }
                />
              </motion.div>

              {error && (
                <motion.p
                  initial={{ opacity: 0, y: -4 }}
                  animate={{ opacity: 1, y: 0 }}
                  style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}
                >
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
                    width: "100%", padding: "1.1rem 2rem", background: "#fff", color: "#080c14",
                    border: "none", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.28em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1, transition: "opacity 0.2s", fontFamily: "var(--font-sans)",
                  }}
                >
                  {loading ? "Authenticating…" : "Enter the Collective"}
                </motion.button>

                <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.5rem 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                  <span style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.3)", fontFamily: "var(--font-sans)" }}>Or</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(255,255,255,0.1)" }} />
                </div>

                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  whileHover={{ scale: 1.01, backgroundColor: "rgba(255,255,255,0.08)" }}
                  whileTap={{ scale: 0.98 }}
                  style={{
                    width: "100%", padding: "1.1rem 2rem", background: "rgba(255,255,255,0.04)",
                    color: "#fff", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px",
                    fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s", fontFamily: "var(--font-sans)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#fff" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#fff" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#fff" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#fff" />
                  </svg>
                  Sign in with Google
                </motion.button>
              </motion.div>
            </div>
          </form>

          {/* Footer link */}
          <motion.p
            variants={fadeUp}
            style={{ textAlign: "center", marginTop: "2.5rem", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(255,255,255,0.25)", fontFamily: "var(--font-sans)" }}
          >
            New here?{" "}
            <Link href="/signup" className="no-underline" style={{ color: "rgba(255,255,255,0.7)" }}>
              Create Account
            </Link>
          </motion.p>
        </motion.div>

        {/* Bottom nav footer */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", position: "relative", zIndex: 1 }}>
          <span style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-sans)" }}>
            © 2025 Schollective
          </span>
          <Link href="/features" className="no-underline" style={{ fontSize: "0.52rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.18)", fontFamily: "var(--font-sans)" }}>
            Platform Features
          </Link>
        </div>
      </div>

      {/* ════════════════════════════════════════
          RIGHT — Brand panel
      ════════════════════════════════════════ */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ duration: 1.6, ease: EASE }}
        style={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "flex-end",
          padding: "4rem 5vw",
          position: "relative",
          overflow: "hidden",
          background: "linear-gradient(135deg, #0a0f1e 0%, #060810 100%)",
        }}
      >
        {/* Atmospheric glow orbs */}
        <div style={{
          position: "absolute", top: "15%", right: "10%",
          width: "55vw", height: "55vw", maxWidth: 520, maxHeight: 520,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(40,80,200,0.14) 0%, transparent 70%)",
          filter: "blur(40px)",
          pointerEvents: "none",
        }} />
        <div style={{
          position: "absolute", bottom: "5%", left: "-10%",
          width: "40vw", height: "40vw", maxWidth: 380, maxHeight: 380,
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(20,50,140,0.1) 0%, transparent 70%)",
          filter: "blur(60px)",
          pointerEvents: "none",
        }} />

        {/* Abstract node-connection visual */}
        <svg
          viewBox="0 0 400 400"
          style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%, -50%) rotate(-10deg)", width: "min(55vw, 500px)", opacity: 0.08, pointerEvents: "none" }}
        >
          <circle cx="200" cy="200" r="3" fill="white" />
          <circle cx="120" cy="130" r="2" fill="white" />
          <circle cx="280" cy="120" r="2" fill="white" />
          <circle cx="100" cy="270" r="2" fill="white" />
          <circle cx="310" cy="280" r="2" fill="white" />
          <circle cx="200" cy="80"  r="1.5" fill="white" />
          <circle cx="60"  cy="200" r="1.5" fill="white" />
          <circle cx="340" cy="200" r="1.5" fill="white" />
          <circle cx="200" cy="330" r="1.5" fill="white" />
          <line x1="200" y1="200" x2="120" y2="130" stroke="white" strokeWidth="0.8" />
          <line x1="200" y1="200" x2="280" y2="120" stroke="white" strokeWidth="0.8" />
          <line x1="200" y1="200" x2="100" y2="270" stroke="white" strokeWidth="0.8" />
          <line x1="200" y1="200" x2="310" y2="280" stroke="white" strokeWidth="0.8" />
          <line x1="120" y1="130" x2="200" y2="80"  stroke="white" strokeWidth="0.5" />
          <line x1="280" y1="120" x2="200" y2="80"  stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="270" x2="60"  y2="200" stroke="white" strokeWidth="0.5" />
          <line x1="310" y1="280" x2="340" y2="200" stroke="white" strokeWidth="0.5" />
          <line x1="100" y1="270" x2="200" y2="330" stroke="white" strokeWidth="0.5" />
          <line x1="310" y1="280" x2="200" y2="330" stroke="white" strokeWidth="0.5" />
          {[
            [160,170],[240,170],[180,240],[220,240],[200,150],
          ].map(([cx,cy], i) => (
            <circle key={i} cx={cx} cy={cy} r="1" fill="white" opacity="0.6" />
          ))}
        </svg>

        {/* Content — pinned to bottom */}
        <div style={{ position: "relative", zIndex: 1 }}>
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 1.4, ease: EASE }}
          >
            {/* Pull quote */}
            <p
              className="font-display"
              style={{
                fontSize: "clamp(1.6rem, 3.2vw, 2.6rem)",
                fontWeight: 700,
                lineHeight: 1.2,
                color: "rgba(255,255,255,0.85)",
                letterSpacing: "-0.02em",
                marginBottom: "2rem",
                maxWidth: 440,
              }}
            >
              &ldquo;The academy's best
              minds, finally{" "}
              <em style={{ color: "rgba(255,255,255,0.35)", fontStyle: "italic" }}>within reach.</em>&rdquo;
            </p>

            {/* Stat row */}
            <div style={{ display: "flex", gap: "3rem", marginBottom: "2.5rem" }}>
              {[
                { n: "500+", l: "Verified Professors" },
                { n: "12K+", l: "Active Students"     },
                { n: "98%",  l: "Response Rate"        },
              ].map(({ n, l }) => (
                <div key={l}>
                  <div
                    className="font-display"
                    style={{ fontSize: "1.6rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.03em", lineHeight: 1 }}
                  >
                    {n}
                  </div>
                  <div style={{ fontSize: "0.55rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(255,255,255,0.28)", marginTop: "0.4rem", fontFamily: "var(--font-sans)" }}>
                    {l}
                  </div>
                </div>
              ))}
            </div>

            {/* Hairline */}
            <div style={{ width: "3rem", height: "1px", background: "rgba(255,255,255,0.15)", marginBottom: "1.5rem" }} />

            <p style={{ fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(255,255,255,0.22)", fontFamily: "var(--font-sans)", fontWeight: 600 }}>
              Academic Mentorship, Democratized
            </p>
          </motion.div>
        </div>
      </motion.div>
    </div>
  );
}
