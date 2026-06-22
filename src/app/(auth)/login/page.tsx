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
  hidden: { opacity: 0, y: 24 },
  show:   { opacity: 1, y: 0,  transition: { duration: 0.9, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

function Field({
  id, name, type = "text", label, placeholder, required = false, suffix
}: {
  id: string; name: string; type?: string; label: string;
  placeholder: string; required?: boolean; suffix?: React.ReactNode;
}) {
  const [focused, setFocused] = useState(false);

  return (
    <div style={{ position: "relative" }}>
      <label
        htmlFor={id}
        style={{
          display: "block",
          fontSize: "0.6rem",
          fontWeight: 700,
          letterSpacing: "0.22em",
          textTransform: "uppercase",
          color: focused ? "rgba(15, 23, 42, 0.65)" : "rgba(15, 23, 42, 0.3)",
          marginBottom: "0.6rem",
          transition: "color 0.25s",
          fontFamily: "var(--font-sans)",
        }}
      >
        {label}
      </label>
      <div style={{ position: "relative", display: "flex", alignItems: "center" }}>
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
            borderBottom: `1px solid ${focused ? "rgba(37, 99, 235, 0.6)" : "rgba(37, 99, 235, 0.18)"}`,
            padding: "0.85rem 0",
            fontSize: "1rem",
            color: "var(--text-primary)",
            outline: "none",
            transition: "border-color 0.3s",
            fontFamily: "var(--font-sans)",
            letterSpacing: "0.01em",
          }}
        />
        {suffix && (
          <span style={{ position: "absolute", right: 0, bottom: "0.85rem" }}>
            {suffix}
          </span>
        )}
      </div>
    </div>
  );
}

function LoginContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();
  const [loading, setLoading] = useState(false);
  const [error,   setError]   = useState<string | null>(null);

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
        options: { redirectTo: `${window.location.origin}/auth/callback` },
      });
      if (error) throw error;
    } catch (err: any) {
      toast.error(err.message || "Failed to sign in with Google.");
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
          <Link href="/signup" style={{ textDecoration: "none" }}>
            <span style={{
              fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(15, 23, 42, 0.45)",
              fontFamily: "var(--font-sans)",
            }}>
              Create Account →
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
              Scholar Portal
            </span>
          </motion.div>

          {/* Headline */}
          <motion.h1 variants={fadeUp} className="font-display" style={{
            fontSize: "clamp(2.6rem, 6vw, 3.8rem)", fontWeight: 900,
            color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05,
            marginBottom: "2.75rem",
          }}>
            Welcome<br />
            <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.38)" }}>back.</em>
          </motion.h1>

          <form onSubmit={handleSubmit}>
            <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
              <motion.div variants={fadeUp}>
                <Field id="email" name="email" type="email" label="Institutional Email" placeholder="name@university.edu" required />
              </motion.div>

              <motion.div variants={fadeUp}>
                <Field
                  id="password" name="password" type="password"
                  label="Password" placeholder="••••••••" required
                  suffix={
                    <Link href="/reset-password" style={{ textDecoration: "none" }}>
                      <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.28)" }}>
                        Forgot?
                      </span>
                    </Link>
                  }
                />
              </motion.div>

              {error && (
                <motion.p initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>
                  {error}
                </motion.p>
              )}

              <motion.div variants={fadeUp} style={{ display: "flex", flexDirection: "column", gap: "0.75rem", paddingTop: "0.25rem" }}>
                {/* Primary button */}
                <motion.button
                  type="submit"
                  disabled={loading}
                  whileHover={{ scale: 1.015 }}
                  whileTap={{ scale: 0.985 }}
                  style={{
                    width: "100%", padding: "1.15rem 2.5rem",
                    background: "var(--accent)", color: "var(--bg-base)",
                    border: "none", borderRadius: "100px",
                    fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.28em", textTransform: "uppercase",
                    cursor: loading ? "not-allowed" : "pointer",
                    opacity: loading ? 0.6 : 1,
                    transition: "opacity 0.2s",
                    fontFamily: "var(--font-sans)",
                  }}
                >
                  {loading ? "Authenticating…" : "Sign In"}
                </motion.button>

                {/* Divider */}
                <div style={{ display: "flex", alignItems: "center", gap: "1rem", margin: "0.25rem 0" }}>
                  <div style={{ flex: 1, height: "1px", background: "rgba(15, 23, 42, 0.08)" }} />
                  <span style={{ fontSize: "0.52rem", fontWeight: 600, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.25)", fontFamily: "var(--font-sans)" }}>or</span>
                  <div style={{ flex: 1, height: "1px", background: "rgba(15, 23, 42, 0.08)" }} />
                </div>

                {/* Google button */}
                <motion.button
                  type="button"
                  onClick={handleGoogleSignIn}
                  whileHover={{ scale: 1.015, backgroundColor: "rgba(15, 23, 42, 0.07)" }}
                  whileTap={{ scale: 0.985 }}
                  style={{
                    width: "100%", padding: "1.15rem 2.5rem",
                    background: "rgba(15, 23, 42, 0.04)",
                    color: "var(--text-primary)",
                    border: "1px solid rgba(15, 23, 42, 0.1)",
                    borderRadius: "100px",
                    fontSize: "0.6rem", fontWeight: 700,
                    letterSpacing: "0.28em", textTransform: "uppercase",
                    cursor: "pointer", transition: "all 0.2s",
                    fontFamily: "var(--font-sans)",
                    display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem",
                  }}
                >
                  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="var(--text-primary)" />
                    <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="var(--text-primary)" />
                    <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="var(--text-primary)" />
                    <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="var(--text-primary)" />
                  </svg>
                  Continue with Google
                </motion.button>
              </motion.div>

              {/* Footer link */}
              <motion.p variants={fadeUp} style={{
                textAlign: "center", fontSize: "0.58rem", fontWeight: 600,
                letterSpacing: "0.1em", color: "rgba(15, 23, 42, 0.22)",
                fontFamily: "var(--font-sans)",
              }}>
                New to Schollective?{" "}
                <Link href="/signup" style={{ color: "rgba(15, 23, 42, 0.55)", textDecoration: "none" }}>
                  Create an account →
                </Link>
              </motion.p>
            </div>
          </form>
        </motion.div>
      </div>

      {/* Footer note */}
      <div style={{
        position: "relative", zIndex: 1,
        textAlign: "center", padding: "1.5rem",
      }}>
        <span style={{ fontSize: "0.5rem", letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.14)", fontFamily: "var(--font-sans)" }}>
          Manually verified · Institutionally credentialed · © 2025 Schollective
        </span>
      </div>
    </div>
  );
}

export default function LoginPage() {
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
      <LoginContent />
    </Suspense>
  );
}
