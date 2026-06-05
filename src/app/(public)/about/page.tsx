"use client";

import React, { useRef } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";

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
    <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", marginBottom: "1.5rem" }}>
      <span style={{ width: "1.5rem", height: "1px", background: "rgba(129, 140, 248, 0.4)", display: "block", flexShrink: 0 }} />
      <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.6)", fontFamily: "var(--font-sans)" }}>{children}</span>
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
  { initials: "BJ", name: "Benjamin", role: "Builder", desc: "Built Schollective to democratize the academic connections that shaped his own path." },
  { initials: "JH", name: "Joseph Hu", role: "Builder", desc: "Dedicated to engineering systems that connect students with the guidance they need to grow academically and professionally." },
];

export default function AboutPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "#fafaf9", minHeight: "100vh" }}>
      <PublicNav />

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 80% 60% at 20% 30%, rgba(99,102,241,0.12) 0%, transparent 60%), radial-gradient(ellipse 60% 50% at 80% 70%, rgba(129,140,248,0.08) 0%, transparent 60%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1000px", margin: "0 auto", padding: "10rem 2.5rem 6rem" }}>

        {/* ── HERO ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>Our Story</Eyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(3.2rem, 8vw, 6.5rem)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 0.93, marginBottom: "2.5rem", color: "#fafaf9" }}>
            Democratizing<br />
            <em style={{ fontStyle: "italic", color: "rgba(129, 140, 248, 0.6)" }}>academic mentorship.</em>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p style={{ fontSize: "clamp(1rem, 1.4vw, 1.2rem)", color: "rgba(168, 179, 207, 0.7)", lineHeight: 1.8, maxWidth: "600px", marginBottom: "6rem" }}>
            Schollective was built on a simple belief: students should be able to reach the academics
            who can change their trajectory — without needing to know the right people, attend the right school,
            or send hundreds of cold emails into the void.
          </p>
        </FadeIn>

        {/* ── STATS ─────────────────────────────────────── */}
        <FadeIn delay={0.1}>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "2.5rem", padding: "3rem 0", borderTop: "1px solid rgba(129, 140, 248, 0.1)", borderBottom: "1px solid rgba(129, 140, 248, 0.1)", marginBottom: "6rem" }}>
            {[
              { n: "2,300+", l: "US Universities Indexed" },
              { n: "Free",   l: "Always, for students" },
              { n: "100%",   l: "Verified Professors" },
              { n: "0",      l: "Cold emails required" },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)", marginTop: "0.6rem", fontFamily: "var(--font-sans)" }}>{l}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ── THE PROBLEM ─────────────────────────────── */}
        <FadeIn>
          <Eyebrow>The Problem</Eyebrow>
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "4rem", marginBottom: "6rem" }} className="prose-two-col">
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fafaf9", marginBottom: "1.25rem" }}>
                Mentorship is gated by proximity.
              </h2>
              <p style={{ fontSize: "0.92rem", color: "rgba(168, 179, 207, 0.6)", lineHeight: 1.85 }}>
                Students at underfunded schools or outside major research hubs rarely connect with the professors whose work matches their interests. Geography, institutional prestige, and sheer luck create invisible walls that have nothing to do with talent.
              </p>
            </div>
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.4rem)", fontWeight: 800, letterSpacing: "-0.03em", lineHeight: 1.15, color: "#fafaf9", marginBottom: "1.25rem" }}>
                Cold emails don't scale.
              </h2>
              <p style={{ fontSize: "0.92rem", color: "rgba(168, 179, 207, 0.6)", lineHeight: 1.85 }}>
                Professors receive hundreds of unfocused requests. Students spend days crafting emails that go unread. Both sides lose. Schollective replaces that broken system with structured, purposeful academic dialogue.
              </p>
            </div>
          </div>
        </FadeIn>

        {/* ── VALUES ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>What We Stand For</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "3.5rem", color: "#fafaf9" }}>
            Four principles.<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.4)" }}>One direction.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "6rem" }}>
          {VALUES.map((v, i) => (
            <FadeIn key={v.n} delay={i * 0.07}>
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "3.5rem 1fr",
                  gap: "2rem",
                  padding: "2.5rem 0",
                  borderTop: "1px solid rgba(129, 140, 248, 0.08)",
                  alignItems: "start",
                }}
              >
                <span style={{ fontFamily: "monospace", fontSize: "0.52rem", letterSpacing: "0.18em", color: "rgba(82, 82, 91, 0.5)", paddingTop: "0.35rem" }}>{v.n}</span>
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>{v.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.55)", lineHeight: 1.8 }}>{v.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid rgba(129, 140, 248, 0.06)" }} />
        </div>

        {/* ── TEAM ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>The Builders</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "3rem", color: "#fafaf9" }}>
            Built by someone who<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.35)" }}>lived the problem.</em>
          </h2>
        </FadeIn>

        <div style={{ display: "flex", flexWrap: "wrap", gap: "1.5rem", marginBottom: "6rem" }}>
          {TEAM.map((m) => (
            <FadeIn key={m.name}>
              <div style={{ padding: "2rem", border: "1px solid rgba(129, 140, 248, 0.12)", borderRadius: "16px", background: "rgba(17, 17, 19, 0.7)", maxWidth: "320px" }}>
                <div style={{ width: "48px", height: "48px", borderRadius: "12px", background: "linear-gradient(135deg, #6366f1, #818cf8)", display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "1.25rem" }}>
                  <span className="font-display" style={{ fontWeight: 900, fontSize: "1rem", color: "#fafaf9" }}>{m.initials}</span>
                </div>
                <div className="font-display" style={{ fontWeight: 800, fontSize: "1.1rem", color: "#fafaf9", letterSpacing: "-0.02em", marginBottom: "0.25rem" }}>{m.name}</div>
                <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.5)", marginBottom: "1rem" }}>{m.role}</div>
                <p style={{ fontSize: "0.85rem", color: "rgba(168, 179, 207, 0.55)", lineHeight: 1.75 }}>{m.desc}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── CTA ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "3.5rem", border: "1px solid rgba(129, 140, 248, 0.14)", borderRadius: "20px", background: "rgba(99, 102, 241, 0.06)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2rem" }}>
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fafaf9", marginBottom: "0.75rem" }}>
                Ready to connect?
              </h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.55)", maxWidth: "360px" }}>
                Join the platform where serious students meet verified professors.
              </p>
            </div>
            <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
              <Link href="/signup" style={{ textDecoration: "none", padding: "0.9rem 2rem", background: "#818cf8", color: "#09090b", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Create Account
              </Link>
              <Link href="/" style={{ textDecoration: "none", padding: "0.9rem 2rem", border: "1px solid rgba(129, 140, 248, 0.3)", color: "rgba(168, 179, 207, 0.7)", borderRadius: "100px", fontSize: "0.6rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
                Back to Home
              </Link>
            </div>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
