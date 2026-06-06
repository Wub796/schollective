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
    <div style={{ background: "var(--bg-base)", color: "#fafaf9", minHeight: "100vh" }}>
      <PublicNav />

      {/* Ambient glow — warm indigo, slightly different from students page */}
      <div style={{ position: "fixed", inset: 0, pointerEvents: "none", background: "radial-gradient(ellipse 65% 50% at 85% 20%, rgba(99,102,241,0.13) 0%, transparent 60%), radial-gradient(ellipse 55% 45% at 5% 80%, rgba(129,140,248,0.07) 0%, transparent 55%)", zIndex: 0 }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: "1000px", margin: "0 auto", padding: "10rem 2.5rem 6rem" }}>

        {/* ── HERO ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>For Professors</Eyebrow>
          <h1 className="font-display" style={{ fontSize: "clamp(3rem, 8vw, 6.5rem)", fontWeight: 900, letterSpacing: "-0.045em", lineHeight: 0.93, marginBottom: "2rem", color: "#fafaf9" }}>
            Your expertise.<br />
            <em style={{ fontStyle: "italic", color: "rgba(129, 140, 248, 0.55)" }}>Their breakthrough.</em>
          </h1>
        </FadeIn>

        <FadeIn delay={0.15}>
          <p style={{ fontSize: "clamp(1rem, 1.4vw, 1.15rem)", color: "rgba(168, 179, 207, 0.65)", lineHeight: 1.85, maxWidth: "600px", marginBottom: "2.5rem" }}>
            Schollective gives professors a structured, low-friction way to mentor motivated students from anywhere in the world —
            without the noise of unsolicited cold emails, on a schedule that respects your time.
          </p>
        </FadeIn>

        <FadeIn delay={0.2}>
          <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap", marginBottom: "7rem" }}>
            <Link href="/signup" style={{ textDecoration: "none", padding: "1rem 2.25rem", background: "#818cf8", color: "#09090b", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Apply to Join →
            </Link>
            <Link href="/about" style={{ textDecoration: "none", padding: "1rem 2.25rem", border: "1px solid rgba(129, 140, 248, 0.3)", color: "rgba(168, 179, 207, 0.7)", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase" }}>
              Learn About Us
            </Link>
          </div>
        </FadeIn>

        {/* ── STATS ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: "2rem", padding: "2.5rem 0", borderTop: "1px solid rgba(129, 140, 248, 0.1)", borderBottom: "1px solid rgba(129, 140, 248, 0.1)", marginBottom: "7rem" }}>
            {[
              { n: "100%", l: "Free for professors" },
              { n: "Manual", l: "Verification process" },
              { n: "You", l: "Control every thread" },
              { n: "12K+", l: "Active students" },
            ].map(({ n, l }) => (
              <div key={l}>
                <div className="font-display" style={{ fontSize: "clamp(1.8rem, 3.2vw, 2.6rem)", fontWeight: 900, color: "#fafaf9", letterSpacing: "-0.04em", lineHeight: 1 }}>{n}</div>
                <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)", marginTop: "0.55rem", fontFamily: "var(--font-sans)" }}>{l}</div>
              </div>
            ))}
          </div>
        </FadeIn>

        {/* ── WHY SCHOLLECTIVE ─────────────────────────── */}
        <FadeIn>
          <Eyebrow>Why Professors Join</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 0.95, marginBottom: "3.5rem", color: "#fafaf9" }}>
            Mentorship on<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.35)" }}>your terms.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7rem" }}>
          {BENEFITS.map((b, i) => (
            <FadeIn key={b.n} delay={i * 0.06}>
              <div style={{ display: "grid", gridTemplateColumns: "3.5rem 1fr", gap: "2rem", padding: "2.5rem 0", borderTop: "1px solid rgba(129, 140, 248, 0.08)", alignItems: "start" }}>
                <span style={{ fontFamily: "monospace", fontSize: "0.52rem", letterSpacing: "0.18em", color: "rgba(82, 82, 91, 0.5)", paddingTop: "0.35rem" }}>{b.n}</span>
                <div>
                  <h3 className="font-display" style={{ fontSize: "1.35rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>{b.title}</h3>
                  <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.55)", lineHeight: 1.8 }}>{b.body}</p>
                </div>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid rgba(129, 140, 248, 0.06)" }} />
        </div>

        {/* ── FIELDS ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>Active Research Fields</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.8rem)", fontWeight: 900, letterSpacing: "-0.04em", lineHeight: 1.05, marginBottom: "2.5rem", color: "#fafaf9" }}>
            Students seeking guidance across<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.35)" }}>every discipline.</em>
          </h2>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "0.6rem", marginBottom: "7rem" }}>
            {FIELDS.map((f) => (
              <span key={f} style={{ padding: "0.5rem 1.1rem", border: "1px solid rgba(129, 140, 248, 0.18)", borderRadius: "100px", fontSize: "0.75rem", color: "rgba(168, 179, 207, 0.65)", fontFamily: "var(--font-sans)" }}>
                {f}
              </span>
            ))}
          </div>
        </FadeIn>

        {/* ── VERIFICATION ─────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "3rem", border: "1px solid rgba(129, 140, 248, 0.14)", borderRadius: "20px", background: "rgba(17, 17, 19, 0.8)", marginBottom: "7rem" }}>
            <Eyebrow>Verification Process</Eyebrow>
            <h2 className="font-display" style={{ fontSize: "clamp(1.6rem, 2.8vw, 2.2rem)", fontWeight: 900, letterSpacing: "-0.03em", color: "#fafaf9", marginBottom: "1.5rem" }}>
              Rigorous by design.
            </h2>
            <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.55)", lineHeight: 1.85, maxWidth: "520px", marginBottom: "2rem" }}>
              To protect students and maintain the integrity of the platform, every professor application is manually reviewed. We cross-reference university directories, faculty pages, and institutional email addresses before approving any account.
            </p>
            <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: "1.25rem" }}>
              {[
                { step: "1", label: "Submit Application", desc: "Complete your professor profile with your institutional email and faculty page URL." },
                { step: "2", label: "Manual Review", desc: "Our team verifies your identity against university records. Takes 24–72 hours." },
                { step: "3", label: "Approval & Access", desc: "Once approved, you can browse incoming requests and start accepting mentorships." },
              ].map(({ step, label, desc }) => (
                <div key={step} style={{ padding: "1.25rem", background: "rgba(99, 102, 241, 0.05)", borderRadius: "12px", border: "1px solid rgba(129, 140, 248, 0.1)" }}>
                  <div style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.3em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)", marginBottom: "0.5rem" }}>Step {step}</div>
                  <div className="font-display" style={{ fontWeight: 800, fontSize: "0.95rem", color: "#fafaf9", marginBottom: "0.5rem" }}>{label}</div>
                  <p style={{ fontSize: "0.8rem", color: "rgba(168, 179, 207, 0.45)", lineHeight: 1.7 }}>{desc}</p>
                </div>
              ))}
            </div>
          </div>
        </FadeIn>

        {/* ── FAQ ─────────────────────────────────────── */}
        <FadeIn>
          <Eyebrow>Common Questions</Eyebrow>
          <h2 className="font-display" style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)", fontWeight: 900, letterSpacing: "-0.04em", marginBottom: "3rem", color: "#fafaf9" }}>
            Everything you need<br /><em style={{ fontStyle: "italic", color: "rgba(168, 179, 207, 0.35)" }}>to know.</em>
          </h2>
        </FadeIn>

        <div style={{ marginBottom: "7rem" }}>
          {FAQ.map((item, i) => (
            <FadeIn key={i} delay={i * 0.05}>
              <div style={{ padding: "2rem 0", borderTop: "1px solid rgba(129, 140, 248, 0.08)" }}>
                <h3 className="font-display" style={{ fontSize: "1.1rem", fontWeight: 800, color: "#fafaf9", letterSpacing: "-0.02em", marginBottom: "0.75rem" }}>{item.q}</h3>
                <p style={{ fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.5)", lineHeight: 1.8, maxWidth: "600px" }}>{item.a}</p>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid rgba(129, 140, 248, 0.06)" }} />
        </div>

        {/* ── QUOTE ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "4rem", borderLeft: "3px solid rgba(129, 140, 248, 0.3)", marginBottom: "7rem" }}>
            <p className="font-display" style={{ fontSize: "clamp(1.4rem, 2.5vw, 2rem)", fontWeight: 700, color: "rgba(250, 250, 249, 0.85)", letterSpacing: "-0.02em", lineHeight: 1.4, marginBottom: "1.5rem" }}>
              &ldquo;The students who reach out through Schollective are genuinely curious and well-prepared. It's the kind of mentorship interaction I wish was available when I was an undergrad.&rdquo;
            </p>
            <div style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(129, 140, 248, 0.45)" }}>
              Associate Professor — Computer Science
            </div>
          </div>
        </FadeIn>

        {/* ── CTA ─────────────────────────────────────── */}
        <FadeIn>
          <div style={{ padding: "3.5rem", border: "1px solid rgba(129, 140, 248, 0.14)", borderRadius: "20px", background: "rgba(99, 102, 241, 0.06)", display: "flex", flexWrap: "wrap", justifyContent: "space-between", alignItems: "center", gap: "2rem" }}>
            <div>
              <h2 className="font-display" style={{ fontSize: "clamp(1.8rem, 3vw, 2.5rem)", fontWeight: 900, letterSpacing: "-0.04em", color: "#fafaf9", marginBottom: "0.75rem" }}>
                Ready to make an impact?
              </h2>
              <p style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.5)", maxWidth: "380px" }}>
                Apply today. Manual verification means the students you meet have already been filtered for seriousness of purpose.
              </p>
            </div>
            <Link href="/signup" style={{ textDecoration: "none", padding: "1rem 2.5rem", background: "#818cf8", color: "#09090b", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", flexShrink: 0 }}>
              Apply as Professor →
            </Link>
          </div>
        </FadeIn>

      </div>
    </div>
  );
}
