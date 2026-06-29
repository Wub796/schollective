"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { createClient } from "@/utils/supabase/client";
import { Button } from "@/components/ui/Button";
import { toast } from "sonner";

export const dynamic = "force-dynamic";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const fadeUp = {
  hidden: { opacity: 0, y: 22 },
  show: { opacity: 1, y: 0, transition: { duration: 1.1, ease: EASE } },
};
const stagger = {
  hidden: {},
  show: { transition: { staggerChildren: 0.1, delayChildren: 0.1 } },
};

export default function VerifyEmailPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string>("");
  const [cooldown, setCooldown] = useState<number>(0);
  const [loading, setLoading] = useState<boolean>(false);

  // Cooldown effect
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setTimeout(() => setCooldown(cooldown - 1), 1000);
    return () => clearTimeout(timer);
  }, [cooldown]);

  // Load user email and handle initial check
  useEffect(() => {
    supabase.auth.getUser().then(({ data: { user } }) => {
      if (user?.email) {
        setEmail(user.email);
        if (user.email_confirmed_at) {
          // If already confirmed, auto-redirect immediately
          supabase
            .from("profiles")
            .select("role, status")
            .eq("id", user.id)
            .single()
            .then(({ data: profile }) => {
              if (!profile || !profile.role) {
                router.push("/onboarding");
              } else if (profile.role === "professor") {
                if (profile.status === "approved") {
                  router.push("/prof/dashboard");
                } else {
                  router.push("/prof/pending");
                }
              } else {
                router.push("/dashboard");
              }
            });
        }
      }
    });
  }, [router, supabase]);

  // Poll for email verification state
  useEffect(() => {
    let active = true;
    const interval = setInterval(async () => {
      if (!active) return;
      const { data: { user } } = await supabase.auth.getUser();
      if (user?.email_confirmed_at) {
        clearInterval(interval);
        toast.success("Email verified successfully! Welcome.");
        
        // Fetch profile
        const { data: profile } = await supabase
          .from("profiles")
          .select("role, status")
          .eq("id", user.id)
          .single();

        if (!profile || !profile.role) {
          router.push("/onboarding");
        } else if (profile.role === "professor") {
          if (profile.status === "approved") {
            router.push("/prof/dashboard");
          } else {
            router.push("/prof/pending");
          }
        } else {
          router.push("/dashboard");
        }
      }
    }, 4000);

    return () => {
      active = false;
      clearInterval(interval);
    };
  }, [router, supabase]);

  const handleResend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (cooldown > 0 || !email) return;

    setLoading(true);
    try {
      const { error } = await supabase.auth.resend({
        type: "signup",
        email: email,
        options: {
          emailRedirectTo: `${window.location.origin}/auth/callback`,
        },
      });

      if (error) throw error;

      toast.success("Verification email resent!");
      setCooldown(60);
    } catch (err: any) {
      toast.error(err.message || "Failed to resend verification email.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ minHeight: "100vh", background: "transparent", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      <motion.div
        variants={stagger}
        initial="hidden"
        animate="show"
        style={{ position: "relative", zIndex: 1, maxWidth: 480, width: "100%", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center", gap: "2.5rem" }}
      >
        {/* Wordmark */}
        <motion.div variants={fadeUp}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <span className="font-display" style={{ fontSize: "1.25rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>
              Schollective
            </span>
          </Link>
        </motion.div>

        {/* Icon */}
        <motion.div variants={fadeUp}>
          <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", border: "1px solid rgba(15, 23, 42, 0.1)", background: "rgba(15, 23, 42, 0.03)", display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto" }}>
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="rgba(15, 23, 42, 0.5)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <rect x="2" y="4" width="20" height="16" rx="2" />
              <path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7" />
            </svg>
          </div>
        </motion.div>

        {/* Eyebrow */}
        <motion.div variants={fadeUp} style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.32)", fontFamily: "var(--font-sans)" }}>
            Verify Your Email
          </span>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
        </motion.div>

        {/* Headline */}
        <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 0.95 }}>
          Check your<br />
          <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>inbox.</em>
        </motion.h1>

        {/* Body */}
        <motion.p variants={fadeUp} style={{ fontSize: "0.9rem", color: "rgba(15, 23, 42, 0.42)", lineHeight: 1.8, fontFamily: "var(--font-sans)", maxWidth: 380 }}>
          {email ? (
            <> We sent a confirmation link to <strong style={{ color: "var(--text-primary)" }}>{email}</strong>. Click it to activate your account and access Schollective. </>
          ) : (
            <> We sent a confirmation link to your email address. Click it to activate your account and access Schollective. </>
          )}
        </motion.p>

        {/* Cooldown Form */}
        <motion.div variants={fadeUp} style={{ width: "100%" }}>
          <form onSubmit={handleResend} style={{ display: "flex", flexDirection: "column", gap: "1rem", alignItems: "center" }}>
            {!email && (
              <input
                type="email"
                placeholder="Enter your email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                style={{
                  width: "100%",
                  background: "rgba(15, 23, 42, 0.02)",
                  border: "1px solid rgba(15, 23, 42, 0.08)",
                  borderRadius: "100px",
                  padding: "0.85rem 1.5rem",
                  fontSize: "0.9rem",
                  color: "var(--text-primary)",
                  outline: "none",
                  textAlign: "center",
                  maxWidth: "320px",
                }}
              />
            )}
            <Button
              type="submit"
              disabled={loading || cooldown > 0 || !email}
              variant="outline"
              size="md"
              style={{ maxWidth: "320px", width: "100%" }}
            >
              {cooldown > 0 ? `Resend in ${cooldown}s` : loading ? "Sending..." : "Resend Verification Email"}
            </Button>
          </form>
        </motion.div>

        {/* Steps */}
        <motion.div variants={fadeUp} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "1.25rem", textAlign: "left" }}>
          {[
            ["01", "Open the email from Schollective"],
            ["02", "Click the confirmation link"],
            ["03", "You'll be automatically redirected here"],
          ].map(([n, t]) => (
            <div key={n} style={{ display: "flex", alignItems: "center", gap: "1rem", padding: "0.85rem 1.25rem", border: "1px solid rgba(15, 23, 42, 0.06)", borderRadius: "12px", background: "rgba(15, 23, 42, 0.02)" }}>
              <span className="font-display" style={{ fontSize: "0.8rem", fontWeight: 800, color: "rgba(15, 23, 42, 0.18)", letterSpacing: "-0.02em", minWidth: "1.5rem" }}>{n}</span>
              <span style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.5)", fontFamily: "var(--font-sans)" }}>{t}</span>
            </div>
          ))}
        </motion.div>

        {/* Divider */}
        <motion.div variants={fadeUp} style={{ width: "100%", height: "1px", background: "rgba(15, 23, 42, 0.06)" }} />

        {/* Note about spam */}
        <motion.p variants={fadeUp} style={{ fontSize: "0.62rem", color: "rgba(15, 23, 42, 0.2)", fontFamily: "var(--font-sans)", lineHeight: 1.7 }}>
          Didn&apos;t receive it? Check your spam folder, or{" "}
          <Link href="/signup" style={{ color: "rgba(15, 23, 42, 0.5)", textDecoration: "none" }}>
            sign up again
          </Link>{" "}
          with a different email.
        </motion.p>

        {/* Back to login */}
        <motion.div variants={fadeUp}>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)" }}>
              ← Back to Login
            </span>
          </Link>
        </motion.div>
      </motion.div>
    </div>
  );
}
