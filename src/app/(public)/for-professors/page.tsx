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

const BENEFITS = [
  { n: "01", title: "Students Come Prepared", body: "Every request on Schollective is structured — students provide clear context, specific questions, and their academic background before you ever read a word. No more vague 'can I pick your brain?' emails." },
  { n: "02", title: "Total Control Over Your Time", body: "You choose which requests to accept, at what pace, and when. There are no obligations, no minimums, and no institutional pressure. Your expertise, your schedule." },
  { n: "03", title: "Focused, One-on-One Threads", body: "Every mentorship happens in a dedicated thread tied to a specific topic. No inbox clutter, no chain replies — just clean, purposeful academic dialogue." },
  { n: "04", title: "Verified Identity for Both Sides", body: "Students know they're talking to a real professor. You know students are serious learners, not spam accounts. Every profile is reviewed." },
  { n: "05", title: "Pay Expertise Forward", body: "Many of the students reaching out to you today are exactly where you were before your mentor changed your trajectory. Schollective makes that moment replicable at scale." },
];

const FIELDS = [
  "Biology & Life Sciences", "Computer Science & AI", "Mathematics", "Physics & Astrophysics",
  "Psychology & Cognitive Science", "Economics & Finance", "History & Humanities", "Environmental Science",
  "Engineering", "Political Science", "Chemistry", "Sociology & Anthropology",
];

const FAQ = [
  { q: "How long does verification take?", a: "Typically 24–72 hours after you submit your institutional email and professional profile. Our team manually reviews every professor application." },
  { q: "How much time does this require?", a: "As much or as little as you want. Some professors respond to one or two requests a month. Others are more active. There is no minimum commitment." },
  { q: "Are there any fees?", a: "Schollective is completely free for professors. We are funded to keep academic mentorship accessible, not monetized." },
  { q: "Can I end a mentorship thread?", a: "Yes — you can close any thread at any time. Students can also close threads once their question has been answered." },
  { q: "What if a student is inappropriate?", a: "We have a strict conduct policy. Any thread can be reported and reviewed. Accounts that violate our academic integrity standards are permanently removed." },
];

export default function ForProfessorsPage() {
  return (
    <div style={{ background: "transparent", color: "var(--text-primary)", minHeight: "100vh" }}>
      <PublicNav />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "920px", margin: "0 auto", padding: "12rem 2rem 8rem", display: "flex", flexDirection: "column", alignItems: "center", textAlign: "center" }}>

        {/* ── HERO ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>For Professors</Eyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(3rem, 7.5vw, 5.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "3.5rem", color: "var(--text-primary)" }}>
            Your expertise.<br />
            <em style={{ fontStyle: "italic", color: "var(--accent)" }}>Their breakthrough.</em>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p style={{ fontSize: "clamp(1.05rem, 1.4vw, 1.25rem)", color: "var(--text-secondary)", lineHeight: 1.85, maxWidth: "660px", marginBottom: "3.5rem" }}>
            Schollective gives professors a structured, low-friction way to mentor motivated students from anywhere in the world —
            without the noise of unsolicited cold emails, on a schedule that respects your time.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ display: "flex", justifyContent: "center", gap: "1.5rem", flexWrap: "wrap", marginBottom: "7.5rem" }}>
            <Button href="/signup" size="lg">
              Apply to Join
            </Button>
            <Button href="/about" variant="ghost" size="lg">
              Learn About Us
            </Button>
          </div>
        </FadeIn>

        {/* ── WHY SCHOLLECTIVE ─────────────────────────── */}
        <FadeIn>
          <Eyebrow>Why Professors Join</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "4.5rem", color: "var(--text-primary)" }}>
            Mentorship on<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>your terms.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7.5rem" }}>
          {BENEFITS.map((b, i) => (
            <FadeIn key={b.n} delay={i * 0.06}>
              <div style={{ display: "grid", gridTemplateColumns: "3.5rem 1fr", gap: "2.5rem", padding: "3rem 0", borderTop: "1px solid var(--border)", alignItems: "start" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.18em", color: "var(--text-tertiary)", paddingTop: "0.35rem" }}>{b.n}</span>
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.45rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "0.85rem" }}>{b.title}</h3>
                  <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.8 }}>{b.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid var(--border)" }} />
        </div>

        {/* ── FIELDS ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>Active Research Fields</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 3vw, 3.2rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "4rem", color: "var(--text-primary)" }}>
            Students seeking guidance across<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>every discipline.</em>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.75rem", marginBottom: "7.5rem", justifyContent: "center" }}>
            {FIELDS.map((f) => (
              <span key={f} style={{ padding: "0.6rem 1.25rem", border: "1px solid var(--border)", borderRadius: "100px", fontSize: "0.8rem", color: "var(--text-secondary)", background: "var(--bg-surface-1)", fontFamily: "var(--font-sans)" }}>
                {f}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* ── VERIFICATION ─────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "3.5rem 3rem", border: "1px solid var(--border)", borderRadius: "20px", background: "var(--bg-surface-1)", marginBottom: "7.5rem" }}>
            <Eyebrow>Verification Process</Eyebrow>
            <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 2.8vw, 2.4rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "var(--text-primary)", marginBottom: "1.5rem" }}>
              Rigorous by design.
            </h2>
            <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", lineHeight: 1.85, maxWidth: "560px", marginBottom: "2.5rem", marginLeft: "auto", marginRight: "auto" }}>
              To protect students and maintain the integrity of the platform, every professor application is manually reviewed. We cross-reference university directories, faculty pages, and institutional email addresses before approving any account.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: "1.5rem" }}>
              {[
                { step: "1", label: "Submit Application", desc: "Complete your professor profile with your institutional email and faculty page URL." },
                { step: "2", label: "Manual Review", desc: "Our team verifies your identity against university records. Takes 24–72 hours." },
                { step: "3", label: "Approval & Access", desc: "Once approved, you can browse incoming requests and start accepting mentorships." },
              ].map(({ step, label, desc }) => (
                <div key={step} style={{ padding: "1.5rem", background: "var(--bg-base)", borderRadius: "12px", border: "1px solid var(--border)" }}>
                  <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "var(--accent)", marginBottom: "0.75rem" }}>Step {step}</div>
                  <div className="font-display" style={{ fontWeight: 800, fontSize: "1.05rem", color: "var(--text-primary)", marginBottom: "0.5rem" }}>{label}</div>
                  <p style={{ fontSize: "0.85rem", color: "var(--text-secondary)", lineHeight: 1.75 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── FAQ ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>Common Questions</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2.2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "4.5rem", color: "var(--text-primary)" }}>
            Everything you need<br /><em style={{ fontStyle: "italic", color: "var(--accent)" }}>to know.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7.5rem" }}>
          {FAQ.map((item, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div style={{ padding: "2.5rem 0", borderTop: "1px solid var(--border)" }}>
                <h3 className="font-display" style={{ fontSize: "1.2rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em", marginBottom: "1rem" }}>{item.q}</h3>
                <p style={{ fontSize: "0.92rem", color: "var(--text-secondary)", lineHeight: 1.8, maxWidth: "680px", marginLeft: "auto", marginRight: "auto" }}>{item.a}</p>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid var(--border)" }} />
        </div>

        {/* ── QUOTE ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4rem 0 4rem 3rem", borderLeft: "3px solid var(--accent)", marginBottom: "7.5rem", textAlign: "left" }}>
            <p className="font-display" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)", fontWeight: 700, color: "var(--text-primary)", letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "2rem" }}>
              &ldquo;The students who reach out through Schollective are genuinely curious and well-prepared. It's the kind of mentorship interaction I wish was available when I was an undergrad.&rdquo;
            </p>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "var(--accent)" }}>
              Associate Professor — Computer Science
            </div>
          </div>
        </FadeIn>

        {/* ── CTA ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4.5rem 3rem", border: "1px solid var(--border)", borderRadius: "20px", background: "rgba(99, 102, 241, 0.04)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "3rem", textAlign: "left" }}>
            <div style={{ flex: "1 1 350px" }}>
              <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3vw, 2.6rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, color: "var(--text-primary)", marginBottom: "1.5rem" }}>
                Ready to make an impact?
              </h2>
              <p style={{ fontSize: "0.95rem", color: "var(--text-secondary)", maxWidth: "420px", lineHeight: 1.8 }}>
                Apply today. Manual verification means the students you meet have already been filtered for seriousness of purpose.
              </p>
            </div>
            <div style={{ flexShrink: 0 }}>
              <Button href="/signup" size="lg">
                Apply as Professor
              </Button>
            </div>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
