"use client";

import React from "react";
import Link from "next/link";
import { motion } from "framer-motion";

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

export default function VerifyEmailPage() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {/* Glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "60vw", maxWidth: 600, maxHeight: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(35,70,180,0.1) 0%, transparent 70%)", filter: "blur(60px)", pointerEvents: "none" }} />

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
        <motion.h1 variants={fadeUp} className="font-display" style={{ fontSize: "clamp(2.4rem, 5vw, 3.5rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Check your<br />
          <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>inbox.</em>
        </motion.h1>

        {/* Body */}
        <motion.p variants={fadeUp} style={{ fontSize: "0.9rem", color: "rgba(15, 23, 42, 0.42)", lineHeight: 1.8, fontFamily: "var(--font-sans)", maxWidth: 380 }}>
          We sent a confirmation link to your email address. Click it to activate your account and access the Collective.
        </motion.p>

        {/* Steps */}
        <motion.div variants={fadeUp} style={{ width: "100%", display: "flex", flexDirection: "column", gap: "0.85rem", textAlign: "left" }}>
          {[
            ["01", "Open the email from Schollective"],
            ["02", "Click the confirmation link"],
            ["03", "Return here to sign in"],
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
          with the correct email.
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
