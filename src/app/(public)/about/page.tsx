"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6%" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 28 }} animate={inView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.9, ease: EASE, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function Eyebrow({ children }: { children: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
      <span style={{ width: "1.5rem", height: "1px", background: "rgba(37, 99, 235, 0.4)", display: "block", flexShrink: 0 }} />
      <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans)" }}>{children}</span>
    </div>
  );
}

const VALUES = [
  { n: "01", title: "Open Access", body: "We believe great academic guidance shouldn't be locked behind zip codes, tuition fees, or alumni networks. Schollective is and will remain free for every student." },
  { n: "02", title: "Institutional Trust", body: "Every professor on our platform has been verified against real university records. No fake credentials, no impersonation — genuine academic expertise only." },
  { n: "03", title: "Focused Dialogue", body: "We replace cold-email anxiety with structured mentorship threads. Every conversation has context, purpose, and professional tone built in." },
  { n: "04", title: "Student Dignity", body: "Students shouldn't have to beg for help. Our platform gives every learner a professional, respected voice in front of the experts who can accelerate their journey." },
];

const TEAM = [
  { initials: "AR", name: "Aiden Raj", role: "Founder", desc: "Passionate about using technology to break barriers in education and expand access to meaningful mentorship." },
  { initials: "AS", name: "Ayaan Siddiqui", role: "Founder", desc: "Driven by the belief that every student deserves a mentor, regardless of background or institution." },
  { initials: "BW", name: "Benjamin Wu", role: "Builder", desc: "Built Schollective to democratize the academic connections that shaped his own path." },
  { initials: "JH", name: "Joseph Hu", role: "Builder", desc: "Dedicated to engineering systems that connect students with the guidance they need to grow academically and professionally." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "transparent", color: "var(--text-primary)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "920px", margin: "0 auto", padding: "12rem 2rem 8rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

        {/* ── HERO ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>Our Story</Eyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(3rem, 7.5vw, 5.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "3.5rem", color: "var(--text-primary)" }}>
            Democratizing<br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>academic mentorship.</em>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p style={{ fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)", color: "var(--text-secondary)", lineHeight: 1.85, maxWidth: "680px", marginBottom: "7rem" }}>
            Schollective was built on a simple belief: students should be able to reach the academics
            who can change their trajectory — without needing to know the right people, attend the right school,
            or send hundreds of cold emails into the void.
          </p>
        </FadeIn>

        {/* ── THE PROBLEM ─────────────────────────────── */}
        <FadeIn>
          <Eyebrow>The Problem</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(320px, 1fr))", gap: "5rem", marginBottom: "7rem" }} className="prose-two-col text-left">
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 2.8vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                Mentorship is gated by proximity.
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.85 }}>
                Students at underfunded schools or outside major research hubs rarely connect with the professors whose work matches their interests. Geography, institutional prestige, and sheer luck create invisible walls that have nothing to do with talent.
              </p>
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 2.8vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 0.95, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                Cold emails don't scale.
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.85 }}>
                Professors receive hundreds of unfocused requests. Students spend days crafting emails that go unread. Both sides lose. Schollective replaces that broken system with structured, purposeful academic dialogue.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── VALUES ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>What We Stand For</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "4.5rem", color: "var(--text-primary)" }}>
            Four principles.<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>One direction.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7rem" }}>
          {VALUES.map((v, i) => (
            <FadeIn key={v.n} delay={i * 0.07}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "3.5rem 1fr",
                  gap: "2.5rem",
                  padding: "3rem 0",
                  borderTop: "1px solid var(--border)",
                  alignItems: "start",
                  textAlign: "left"
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.18em", color: "var(--text-tertiary)", paddingTop: "0.35rem" }}>{v.n}</span>
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.85rem" }}>{v.title}</h3>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{v.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid var(--border)" }} />
        </div>

        {/* ── TEAM ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>The Builders</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "4.5rem", color: "var(--text-primary)" }}>
            Built by someone who<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>lived the problem.</em>
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "2rem", marginBottom: "7rem" }}>
          {TEAM.map((m) => (
            <FadeIn key={m.name}>
              <div style={{ padding: "2.25rem", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--bg-surface-1)", height: "100%", display: "flex", flexDirection: "column", textAlign: "left" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, var(--accent-blue), var(--accent))", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.5rem" }}>
                  <span className="font-display" style={{ fontWeight: 900, fontSize: "1.1rem", color: "var(--text-primary)" }}>{m.initials}</span>
                </div>
                <div className="font-display" style={{ fontWeight: 800, fontSize: "1.15rem", color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.35rem" }}>{m.name}</div>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "1.25rem" }}>{m.role}</div>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{m.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4.5rem 3rem", border: "1px solid var(--border)", borderRadius: "20px", background: "rgba(99, 102, 241, 0.04)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "3rem", textAlign: "left" }}>
            <div style={{ flex: "1 1 350px" }}>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                Ready to connect?
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "420px", lineHeight: 1.8 }}>
                Join the platform where serious students meet verified professors.
              </p>
            </div>
            <div style={{ display: "flex", gap: "1.5rem", flexWrap: "wrap", flexShrink: 0 }}>
              <Button href="/signup" size="lg">
                Create Account
              </Button>
              <Button href="/" variant="ghost" size="lg">
                Back to Home
              </Button>
            </div>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
