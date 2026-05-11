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
    <div style={{ background: "var(--bg-base)", color: "#fafaf9", minHeight: "100vh" }}>
      <PublicNav />

      {/* Ambient glow */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 70% 55% at 10% 25%, rgba(99,102,241,0.14) 0%, transparent 65%), radial-gradient(ellipse 50% 45% at 90% 75%, rgba(129,140,248,0.07) 0%, transparent 60%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1000px", margin: "0 auto", padding: "10rem 2.5rem 6rem" }}>

        {/* ── HERO ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>For Students</Eyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 0.93, marginBottom: "2rem", color: "#fafaf9" }}>
            Your questions<br />
            <em style={{ fontStyle: "italic", color: "rgba(129, 140, 248, 0.55)" }}>deserve real answers.</em>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p style={{ fontSize: "clamp(1rem, 1.4vw, 1.15rem)", color: "rgba(168, 179, 207, 0.65)", lineHeight: 1.85, maxWidth: "580px", marginBottom: "2.5rem" }}>
            Whether you're a high schooler working on a science fair project or an undergrad navigating grad school applications,
            Schollective connects you directly with verified professors who can actually help — for free, with no cold-email anxiety.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "7rem" }}>
            <Link href="/signup" style={{ textDecoration: "none", padding: "1rem 2.25rem", background: "#818cf8", color: "#09090b", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Join Free →
            </Link>
            <Link href="/about" style={{ textDecoration: "none", padding: "1rem 2.25rem", border: "1px solid rgba(129, 140, 248, 0.3)", color: "rgba(168, 179, 207, 0.7)", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Learn More
            </Link>
          </div>
        </FadeIn>

        {/* ── STATS ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(150px, 1fr))", gap: "2rem", padding: "2.5rem 0", borderTop: "1px solid rgba(129, 140, 248, 0.1)", borderBottom: "1px solid rgba(129, 140, 248, 0.1)", marginBottom: "7rem" }}>
            {[
              { n: "100%", l: "Free for students" },
              { n: "48h",  l: "Avg. response time" },
              { n: "500+", l: "Verified professors" },
              { n: "0",    l: "Cold emails needed" },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display" style={{ fontSize: "clamp(2rem, 3.5vw, 2.8rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)", marginTop: "0.55rem", fontFamily: "var(--font-sans)" }}>{l}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ── HOW IT WORKS ─────────────────────────────── */}
        <FadeIn>
          <Eyebrow>How It Works</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "3.5rem", color: "#fafaf9" }}>
            From sign-up to<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.35)" }}>insight, in four steps.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7rem" }}>
          {HOW_IT_WORKS.map((s, i) => (
            <FadeIn key={s.n} delay={i * 0.06}>
              <div style={{ display: "grid", gridTemplateColumns: "3.5rem 1fr", gap: "2rem", padding: "2.5rem 0", borderTop: "1px solid rgba(129, 140, 248, 0.08)", alignItems: "start" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.52rem", letterSpacing: "0.18em", color: "rgba(82, 82, 91, 0.5)", paddingTop: "0.35rem" }}>{s.n}</span>
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>{s.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.55)", lineHeight: 1.8 }}>{s.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid rgba(129, 140, 248, 0.06)" }} />
        </div>

        {/* ── USE CASES ─────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>What You Can Ask</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.0, marginBottom: "3rem", color: "#fafaf9" }}>
            Every serious question<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.35)" }}>has a home here.</em>
          </h2>
        </FadeIn>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(270px, 1fr))", gap: "1.25rem", marginBottom: "7rem" }}>
          {USE_CASES.map((uc, i) => (
            <FadeIn key={uc.title} delay={i * 0.05}>
              <div style={{ padding: "1.75rem", border: "1px solid rgba(129, 140, 248, 0.1)", borderRadius: "16px", background: "rgba(17, 17, 19, 0.7)", height: "100%", transition: "border-color 0.2s" }}>
                <div style={{ fontSize: "1.6rem", marginBottom: "1rem" }}>{uc.icon}</div>
                <h3 className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em", marginBottom: "0.6rem" }}>{uc.title}</h3>
                <p style={{ fontSize: "0.83rem", color: "rgba(168, 179, 207, 0.5)", lineHeight: 1.75 }}>{uc.body}</p>
              </div>
            </FadeIn>
          ))}
        </div>

        {/* ── QUOTE ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4rem", borderLeft: "3px solid rgba(129, 140, 248, 0.3)", marginBottom: "7rem" }}>
            <p className="font-display" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 700, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "1.5rem" }}>
              &ldquo;I sent 40 cold emails and heard back from two. On Schollective I had a real conversation with a Stanford professor within 24 hours.&rdquo;
            </p>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)" }}>
              Student — Biology, University of Texas
            </div>
          </div>
        </FadeIn>

        {/* ── CTA ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "3.5rem", border: "1px solid rgba(129, 140, 248, 0.14)", borderRadius: "20px", background: "rgba(99, 102, 241, 0.06)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2rem" }}>
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fafaf9", marginBottom: "0.75rem" }}>
                Start for free, today.
              </h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.5)", maxWidth: "360px" }}>
                No credit card. No waitlist. Just create an account and start connecting with the academics who can change your trajectory.
              </p>
            </div>
            <Link href="/signup" style={{ textDecoration: "none", padding: "1rem 2.5rem", background: "#818cf8", color: "#09090b", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", flexShrink: 0 }}>
              Create Student Account →
            </Link>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
