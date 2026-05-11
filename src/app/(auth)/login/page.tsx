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
          background: "linear-gradient(90deg, transparent, rgba(129, 140, 248, 0.7), transparent)",
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
    <div style={{ background: "var(--bg-base)", minHeight: "100vh", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {/* Single centred card */}
      <div
        style={{
          width: "100%",
          maxWidth: "460px",
          position: "relative",
        }}
      >
        {/* Wordmark */}
        <Link href="/" className="no-underline" style={{ display: "block", marginBottom: "2.5rem" }}>
          <span
            className="font-display"
            style={{ fontSize: "1.25rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em" }}
          >
            Schollective
          </span>
        </Link>

        {/* Form */}
        <motion.div
          variants={stagger}
          initial="hidden"
          animate="show"
          style={{ position: "relative", zIndex: 1, width: "100%" }}
        >
          {/* Eyebrow */}
          <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "2rem" }}>
            <span style={{ width: "1.5rem", height: "1px", background: "rgba(250, 250, 249, 0.25)", display: "block" }} />
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.38)", fontFamily: "var(--font-sans)" }}>
              Scholar Portal
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1
            variants={fadeUp}
            className="font-display"
            style={{ fontSize: "clamp(2.8rem, 5vw, 4rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.035em", lineHeight: 1.05, marginBottom: "3.5rem" }}
          >
            Welcome<br />
            <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.45)" }}>back.</em>
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
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem"
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
            </div>
          </form>

          {/* Footer link */}
          <motion.p
            variants={fadeUp}
            style={{ textAlign: "center", marginTop: "2.5rem", fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.16em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-sans)" }}
          >
            New here?{" "}
            <Link href="/signup" className="no-underline" style={{ color: "rgba(250, 250, 249, 0.7)" }}>
              Create Account
            </Link>
          </motion.p>

          {/* Bottom stats — inline below the form */}
          <motion.div
            variants={fadeUp}
            style={{
              marginTop: "2.5rem",
              paddingTop: "2rem",
              borderTop: "1px solid rgba(129, 140, 248, 0.1)",
              display: "flex",
              gap: "2rem",
              flexWrap: "wrap",
            }}
          >
            {[
              { n: "500+", l: "Verified Professors" },
              { n: "12K+", l: "Active Students" },
              { n: "98%",  l: "Response Rate" },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display" style={{ fontSize: "1.4rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.03em", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)", marginTop: "0.3rem", fontFamily: "var(--font-sans)" }}>{l}</div>
              </div>
            ))}
          </motion.div>

          <div style={{ marginTop: "2rem", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.15)", fontFamily: "var(--font-sans)" }}>
              © 2026 Schollective
            </span>
            <Link href="/" className="no-underline" style={{ fontSize: "0.5rem", letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.15)", fontFamily: "var(--font-sans)" }}>
              Back to home
            </Link>
          </div>
        </motion.div>
      </div>
    </div>
  );
}
