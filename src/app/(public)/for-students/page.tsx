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
      <span style={{ width: "1.5rem", height: "1px", background: "rgba(37, 99, 235, 0.4)", display: "block", flexShrink: 0 }} />
      <span style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.42em", textTransform: "uppercase", color: "rgba(37, 99, 235, 0.6)", fontFamily: "var(--font-sans)" }}>{children}</span>
    </div>
  );
}

const HOW_IT_WORKS = [
  { n: "01", title: "Create Your Profile", body: "Sign up in under two minutes. Tell us your grade level, school, and what areas of research excite you. No essays, no applications." },
  { n: "02", title: "Browse Verified Professors", body: "Search our database of institutionally verified academics by field, research interest, or university. Every profile is real and reviewed." },
  { n: "03", title: "Send a Focused Request", body: "Use our structured request template to explain your question clearly. Professors get context upfront — which means faster, better responses." },
  { n: "04", title: "Grow Through Dialogue", body: "Continue the conversation in a dedicated thread. Build a relationship with your mentor over time, entirely within Schollective." },
];

const USE_CASES = [
  { icon: "📄", title: "Research Paper Guidance", body: "Get feedback on your thesis, methodology, or literature review from a professor in exactly that field." },
  { icon: "🎓", title: "Graduate School Planning", body: "Ask professors about their programs, what they look for in applicants, and how to strengthen your profile." },
  { icon: "🔬", title: "Science Fair & Research Projects", body: "High schoolers: get expert perspective on your project before competition season." },
  { icon: "📚", title: "Understanding Complex Topics", body: "Sometimes textbooks aren't enough. Get a nuanced explanation from someone who has spent a career studying it." },
  { icon: "🤝", title: "Finding Research Opportunities", body: "Learn about lab openings, summer programs, and internships directly from professors actively seeking students." },
  { icon: "✏️", title: "Academic Writing Improvement", body: "Get your writing reviewed by academics who publish regularly and know exactly what clarity looks like." },
];

export default function ForStudentsPage() {
  return (
    <div style={{ background: "var(--bg-base)", color: "var(--text-primary)", minHeight: "100vh" }}>
      <PublicNav />

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 55% at 10% 25%, rgba(99,102,241,0.08) 0%, transparent 65%), radial-gradient(ellipse 50% 45% at 90% 75%, rgba(37, 99, 235,0.04) 0%, transparent 60%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "920px", margin: "0 auto", padding: "12rem 2rem 8rem" }}>

        {/* ── HERO ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>For Students</Eyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(3rem, 7.5vw, 5.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "2.5rem", color: "var(--text-primary)" }}>
            Your questions<br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>deserve real answers.</em>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p style={{ fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)", color: "var(--text-secondary)", lineHeight: 1.85, maxWidth: "660px", marginBottom: "3rem" }}>
            Whether you're a high schooler working on a science fair project or an undergrad navigating grad school applications,
            Schollective connects you directly with verified professors who can actually help — for free, with no cold-email anxiety.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap", marginBottom: "7.5rem" }}>
            <Link href="/signup" className="group relative inline-flex items-center justify-center rounded-full" style={{ textDecoration: "none", padding: "1.1rem 2.5rem", background: "var(--accent)", color: "var(--bg-base)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", transition: "background 0.3s" }}>
              Join Free →
            </Link>
            <Link href="/about" className="group relative inline-flex items-center justify-center rounded-full" style={{ textDecoration: "none", padding: "1.1rem 2.5rem", border: "1px solid var(--border)", color: "var(--text-secondary)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", transition: "border-color 0.3s, color 0.3s" }}>
              Learn More
            </Link>
          </div>
        </FadeIn>

        {/* ── STATS ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "3rem", padding: "3.5rem 0", borderTop: "1px solid var(--border)", borderBottom: "1px solid var(--border)", marginBottom: "7.5rem" }}>
            {[
              { n: "100%", l: "Free for students" },
              { n: "48h",  l: "Avg. response time" },
              { n: "500+", l: "Verified professors" },
              { n: "0",    l: "Cold emails needed" },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3.2rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--accent)", opacity: 0.75, marginTop: "0.75rem", fontFamily: "var(--font-sans)" }}>{l}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <FadeIn>
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "4rem", color: "var(--text-primary)" }}>
            From sign-up to<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>insight, in four steps.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7.5rem" }}>
          {HOW_IT_WORKS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.06}>
              <div style={{ display: "grid", gridTemplateColumns: "3.5rem 1fr", gap: "2.5rem", padding: "3rem 0", borderTop: "1px solid var(--border)", alignItems: "start" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.18em", color: "var(--text-tertiary)", paddingTop: "0.35rem" }}>{s.n}</span>
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.85rem" }}>{s.title}</h3>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{s.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid var(--border)" }} />
        </div>

        {/* ── USE CASES ─────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>What You Can Ask</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "4rem", color: "var(--text-primary)" }}>
            Every serious question<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>has a home here.</em>
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(280px, 1fr))", gap: "2rem", marginBottom: "7.5rem" }}>
          {USE_CASES.map((uc, i) => (
            <FadeIn key={uc.title} delay={i * 0.05}>
              <div style={{ padding: "2.25rem", border: "1px solid var(--border)", borderRadius: "16px", background: "var(--bg-surface-1)", height: "100%", transition: "all 0.3s" }}>
                <div style={{ fontSize: "1.8rem", marginBottom: "1.25rem" }}>{uc.icon}</div>
                <h3 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>{uc.title}</h3>
                <p style={{ fontSize: "0.9rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{uc.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── QUOTE ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4rem 0 4rem 3rem", borderLeft: "3px solid var(--accent)", marginBottom: "7.5rem" }}>
            <p className="font-display" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "2rem" }}>
              &ldquo;I sent 40 cold emails and heard back from two. On Schollective I had a real conversation with a Stanford professor within 24 hours.&rdquo;
            </p>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--accent)" }}>
              Student — Biology, University of Texas
            </div>
          </div>
        </FadeIn>

        {/* ── CTA ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4.5rem 3rem", border: "1px solid var(--border)", borderRadius: "20px", background: "rgba(99, 102, 241, 0.04)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "3rem" }}>
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "var(--text-primary)", marginBottom: "1rem" }}>
                Start for free, today.
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "420px", lineHeight: 1.8 }}>
                No credit card. No waitlist. Just create an account and start connecting with the academics who can change your trajectory.
              </p>
            </div>
            <Link href="/signup" className="group relative inline-flex items-center justify-center rounded-full" style={{ textDecoration: "none", padding: "1.1rem 2.5rem", background: "var(--accent)", color: "var(--bg-base)", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", transition: "background 0.3s", flexShrink: 0 }}>
              Create Student Account →
            </Link>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
