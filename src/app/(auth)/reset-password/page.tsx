"use client";

import React, { useState, Suspense } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show:   { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};
const stagger = {
  hidden: {},
  show:   { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

function Field({ id, name, type = "text", label, placeholder, required = false }: {
  id: string; name: string; type?: string; label: string; placeholder: string; required?: boolean;
}) {
  const [focused, setFocused] = useState(false);
  return (
    <div style={{ position: "relative" }}>
      <label htmlFor={id} style={{ display: "block", fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.22em", textTransform: "uppercase", color: focused ? "rgba(15, 23, 42, 0.7)" : "rgba(15, 23, 42, 0.3)", marginBottom: "0.6rem", transition: "color 0.25s", fontFamily: "var(--font-sans)" }}>
        {label}
      </label>
      <input id={id} name={name} type={type} placeholder={placeholder} required={required}
        onFocus={() => setFocused(true)}
        onBlur={() => setFocused(false)}
        style={{ width: "100%", background: "transparent", border: "none", borderBottom: `1px solid ${focused ? "rgba(15, 23, 42, 0.55)" : "rgba(15, 23, 42, 0.12)"}`, padding: "0.85rem 0", fontSize: "1rem", color: "var(--text-primary)", outline: "none", transition: "border-color 0.3s", fontFamily: "var(--font-sans)" }}
      />
      <motion.div
        animate={{ scaleX: focused ? 1 : 0, opacity: focused ? 1 : 0 }}
        transition={{ duration: 0.35, ease: EASE }}
        style={{ position: "absolute", bottom: 0, left: 0, right: 0, height: "1px", background: "linear-gradient(90deg, transparent, rgba(15, 23, 42, 0.8), transparent)", transformOrigin: "center" }}
      />
    </div>
  );
}

/** Step 1: request reset link  |  Step 2: set new password */
type Step = "request" | "update";

function ResetPasswordContent() {
  const router       = useRouter();
  const searchParams = useSearchParams();
  const supabase     = createClient();

  // Supabase sends ?code= on the magic-link redirect
  const hasCode = Boolean(searchParams.get("code"));
  const [step, setStep]     = useState<Step>(hasCode ? "update" : "request");
  const [loading, setLoading] = useState(false);
  const [sent, setSent]     = useState(false);
  const [error, setError]   = useState<string | null>(null);

  // ── Step 1: Send reset email ───────────────────────────────────
  const handleRequest = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd    = new FormData(e.currentTarget);
    const email = fd.get("email") as string;
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email, {
        redirectTo: `${window.location.origin}/reset-password`,
      });
      if (error) throw error;
      setSent(true);
      toast.success("Reset link sent — check your inbox.");
    } catch (err: any) {
      const msg = err.message || "Failed to send reset link.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  // ── Step 2: Set new password ───────────────────────────────────
  const handleUpdate = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    const fd  = new FormData(e.currentTarget);
    const pw  = fd.get("password")  as string;
    const pw2 = fd.get("password2") as string;
    if (pw !== pw2) {
      setError("Passwords do not match.");
      setLoading(false);
      return;
    }
    try {
      const { error } = await supabase.auth.updateUser({ password: pw });
      if (error) throw error;
      toast.success("Password updated. Signing you in…");
      router.push("/dashboard");
    } catch (err: any) {
      const msg = err.message || "Failed to update password.";
      setError(msg);
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {/* Removed local glow */}

      <motion.div variants={stagger} initial="hidden" animate="show"
        style={{ position: "relative", zIndex: 1, maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", gap: "2.5rem" }}
      >
        {/* Wordmark */}
        <motion.div variants={fadeUp}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Schollective</span>
          </Link>
        </motion.div>

        {/* Eyebrow */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.32)", fontFamily: "var(--font-sans)" }}>
            Password Reset
          </span>
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
          {step === "request" ? <>Recover your<br /><em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>access.</em></> : <>Set a new<br /><em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>password.</em></>}
        </motion.h1>

        <AnimatePresence mode="wait">
          {/* ── Step 1: Email request ── */}
          {step === "request" && !sent && (
            <motion.form key="request" onSubmit={handleRequest}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
            >
              <p style={{ fontSize: "0.85rem", color: "rgba(15, 23, 42, 0.4)", lineHeight: 1.8, fontFamily: "var(--font-sans)" }}>
                Enter the email address on your account and we&apos;ll send a reset link.
              </p>
              <Field id="email" name="email" type="email" label="Institutional Email" placeholder="name@university.edu" required />
              {error && <p style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>{error}</p>}
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "1.15rem 2.5rem", background: "var(--text-primary)", color: "#080c14", border: "none", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}
              >
                {loading ? "Sending…" : "Send Reset Link"}
              </motion.button>
            </motion.form>
          )}

          {/* ── Step 1 sent confirmation ── */}
          {step === "request" && sent && (
            <motion.div key="sent" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
              style={{ display: "flex", flexDirection: "column", gap: "1.5rem", padding: "2rem", border: "1px solid rgba(15, 23, 42, 0.08)", borderRadius: "16px", background: "rgba(15, 23, 42, 0.02)" }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(120,220,120,0.8)", flexShrink: 0 }} />
                <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.4)", fontFamily: "var(--font-sans)" }}>Link Sent</span>
              </div>
              <p style={{ fontSize: "0.85rem", color: "rgba(15, 23, 42, 0.45)", lineHeight: 1.8, fontFamily: "var(--font-sans)" }}>
                Check your inbox. Click the link in the email to set a new password. The link expires in 1 hour.
              </p>
            </motion.div>
          )}

          {/* ── Step 2: Set new password ── */}
          {step === "update" && (
            <motion.form key="update" onSubmit={handleUpdate}
              initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }}
              style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}
            >
              <p style={{ fontSize: "0.85rem", color: "rgba(15, 23, 42, 0.4)", lineHeight: 1.8, fontFamily: "var(--font-sans)" }}>
                Choose a new password. Minimum 8 characters.
              </p>
              <Field id="password"  name="password"  type="password" label="New Password"     placeholder="Min. 8 characters" required />
              <Field id="password2" name="password2" type="password" label="Confirm Password"  placeholder="Repeat password"   required />
              {error && <p style={{ fontSize: "0.78rem", color: "#ff7070", fontFamily: "var(--font-sans)" }}>{error}</p>}
              <motion.button type="submit" disabled={loading} whileHover={{ scale: 1.01 }} whileTap={{ scale: 0.98 }}
                style={{ width: "100%", padding: "1.15rem 2.5rem", background: "var(--text-primary)", color: "#080c14", border: "none", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", cursor: loading ? "not-allowed" : "pointer", opacity: loading ? 0.6 : 1, fontFamily: "var(--font-sans)" }}
              >
                {loading ? "Updating…" : "Set New Password"}
              </motion.button>
            </motion.form>
          )}
        </AnimatePresence>

        {/* Back link */}
        <motion.div variants={fadeUp}>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans)" }}>
              ← Back to Login
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}

export default function ResetPasswordPage() {
  return (
    <Suspense fallback={<div style={{ minHeight: "100vh", background: "#080c14" }} />}>
      <ResetPasswordContent />
    </Suspense>
  );
}
