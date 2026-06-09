"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SECTION_STYLE = { paddingTop: "8rem", paddingBottom: "8rem" };
const HERO_STYLE   = { paddingTop: "9rem", paddingBottom: "8rem" };

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
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className="w-6 h-[1px] bg-indigo-600/40 block flex-shrink-0" />
      <span className="text-[0.52rem] font-bold tracking-[0.2em] uppercase text-[var(--accent)] font-sans">{children}</span>
      <span className="w-6 h-[1px] bg-indigo-600/40 block flex-shrink-0" />
    </div>
  );
}

const BENEFITS = [
  { n: "01", title: "Students Come Prepared",       body: "Every request on Schollective is structured — students provide clear context, specific questions, and their academic background before you ever read a word. No more vague 'can I pick your brain?' emails." },
  { n: "02", title: "Total Control Over Your Time", body: "You choose which requests to accept, at what pace, and when. There are no obligations, no minimums, and no institutional pressure. Your expertise, your schedule." },
  { n: "03", title: "Focused, One-on-One Threads",  body: "Every mentorship happens in a dedicated thread tied to a specific topic. No inbox clutter, no chain replies — just clean, purposeful academic dialogue." },
  { n: "04", title: "Verified Identity for Both Sides", body: "Students know they're talking to a real professor. You know students are serious learners, not spam accounts. Every profile is reviewed." },
  { n: "05", title: "Pay Expertise Forward",         body: "Many of the students reaching out to you today are exactly where you were before your mentor changed your trajectory. Schollective makes that moment replicable at scale." },
];

const FIELDS = [
  "Biology & Life Sciences", "Computer Science & AI", "Mathematics", "Physics & Astrophysics",
  "Psychology & Cognitive Science", "Economics & Finance", "History & Humanities", "Environmental Science",
  "Engineering", "Political Science", "Chemistry", "Sociology & Anthropology",
];

const FAQ = [
  { q: "How long does verification take?",   a: "Typically 24–72 hours after you submit your institutional email and professional profile. Our team manually reviews every professor application." },
  { q: "How much time does this require?",   a: "As much or as little as you want. Some professors respond to one or two requests a month. Others are more active. There is no minimum commitment." },
  { q: "Are there any fees?",                a: "Schollective is completely free for professors. We are funded to keep academic mentorship accessible, not monetized." },
  { q: "Can I end a mentorship thread?",     a: "Yes — you can close any thread at any time. Students can also close threads once their question has been answered." },
  { q: "What if a student is inappropriate?", a: "We have a strict conduct policy. Any thread can be reported and reviewed. Accounts that violate our academic integrity standards are permanently removed." },
];

export default function ForProfessorsPage() {
  return (
    <div className="bg-transparent text-[var(--text-primary)] min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8" style={HERO_STYLE}>
        <div className="w-full max-w-[760px] mx-auto">
          <FadeIn>
            <Eyebrow>For Professors</Eyebrow>
            <h1 className="font-display text-[clamp(3rem,7.5vw,5.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-8 text-[var(--text-primary)]">
              Your expertise.<br />
              <em className="italic text-[var(--accent)]">Their breakthrough.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-[var(--text-secondary)] leading-[1.85] max-w-[620px] mx-auto mb-10">
              Schollective gives professors a structured, low-friction way to mentor motivated students from anywhere
              in the world — without the noise of unsolicited cold emails, on a schedule that respects your time.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex justify-center gap-4 flex-wrap">
              <Button href="/signup" variant="primary" size="lg">
                Apply to Join
              </Button>
              <Button href="/about" variant="ghost" size="lg">
                Learn About Us
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── WHY SCHOLLECTIVE ─────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[var(--border)]" style={SECTION_STYLE}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-14 text-[var(--text-primary)]">
              Mentorship on<br /><em className="italic text-[var(--accent)]">your terms.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {BENEFITS.map((b, i) => (
              <FadeIn key={b.n} delay={i * 0.06}>
                <div className="grid grid-cols-[3.5rem_1fr] gap-10 py-12 border-t border-[var(--border)] text-left items-start">
                  <span className="font-mono text-[0.55rem] tracking-[0.18em] text-[var(--text-tertiary)] pt-1.5">{b.n}</span>
                  <div>
                    <h3 className="font-display text-[1.45rem] font-bold text-[var(--text-primary)] tracking-[-0.02em] mb-3">{b.title}</h3>
                    <p className="text-[1rem] text-[var(--text-secondary)] leading-[1.8]">{b.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
            <div className="border-t border-[var(--border)]" />
          </div>
        </div>
      </section>

      {/* ── FIELDS ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[var(--border)]" style={SECTION_STYLE}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3vw,3.2rem)] font-black tracking-[-0.04em] leading-[0.95] mb-12 text-[var(--text-primary)]">
              Students seeking guidance across<br /><em className="italic text-[var(--accent)]">every discipline.</em>
            </h2>
            <div className="flex flex-wrap gap-3 justify-center">
              {FIELDS.map((f) => (
                <span key={f} className="px-5 py-2.5 border border-[var(--border)] rounded-full text-[0.85rem] text-[var(--text-secondary)] bg-[var(--bg-surface-1)] font-sans">
                  {f}
                </span>
              ))}
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── VERIFICATION ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[var(--border)]" style={SECTION_STYLE}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 md:p-16 border border-[var(--border)] rounded-3xl bg-[var(--bg-surface-1)] w-full">
              <h2 className="font-display font-black text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] text-[var(--text-primary)] mb-6">
                Rigorous by design.
              </h2>
              <p className="text-[1rem] text-[var(--text-secondary)] leading-[1.85] max-w-[560px] mb-12 mx-auto">
                To protect students and maintain the integrity of the platform, every professor application is manually
                reviewed. We cross-reference university directories, faculty pages, and institutional email addresses
                before approving any account.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-left">
                {[
                  { step: "1", label: "Submit Application", desc: "Complete your professor profile with your institutional email and faculty page URL." },
                  { step: "2", label: "Manual Review",      desc: "Our team verifies your identity against university records. Takes 24–72 hours." },
                  { step: "3", label: "Approval & Access",  desc: "Once approved, you can browse incoming requests and start accepting mentorships." },
                ].map(({ step, label, desc }) => (
                  <div key={step} className="p-6 bg-[var(--bg-base)] rounded-xl border border-[var(--border)]">
                    <div className="text-[0.55rem] font-bold tracking-[0.3em] uppercase text-[var(--accent)] mb-3">Step {step}</div>
                    <div className="font-display font-bold text-[1.05rem] text-[var(--text-primary)] mb-2">{label}</div>
                    <p className="text-[0.9rem] text-[var(--text-secondary)] leading-[1.75]">{desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── FAQ ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[var(--border)]" style={SECTION_STYLE}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3rem)] font-black tracking-[-0.04em] leading-[0.95] mb-14 text-[var(--text-primary)]">
              Everything you need<br /><em className="italic text-[var(--accent)]">to know.</em>
            </h2>
          </FadeIn>
          <div className="w-full text-left">
            {FAQ.map((item, i) => (
              <FadeIn key={i} delay={i * 0.05}>
                <div className="py-10 border-t border-[var(--border)]">
                  <h3 className="font-display text-[1.2rem] font-bold text-[var(--text-primary)] tracking-[-0.02em] mb-4">{item.q}</h3>
                  <p className="text-[1rem] text-[var(--text-secondary)] leading-[1.8] max-w-[680px]">{item.a}</p>
                </div>
              </FadeIn>
            ))}
            <div className="border-t border-[var(--border)]" />
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[var(--border)]" style={SECTION_STYLE}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 md:p-16 border border-[var(--border)] rounded-3xl bg-indigo-600/[0.03] flex flex-col items-center gap-10 text-center w-full">
              <div>
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-[var(--text-primary)] mb-5 leading-tight">
                  Ready to make an impact?
                </h2>
                <p className="text-[1rem] text-[var(--text-secondary)] leading-[1.8] max-w-[480px] mx-auto">
                  Apply today. Manual verification means the students you meet have already been filtered for seriousness of purpose.
                </p>
              </div>
              <Button href="/signup" variant="primary" size="lg">
                Apply as Professor
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
