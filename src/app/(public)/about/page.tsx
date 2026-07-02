"use client";

import React, { useRef } from "react";
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
    <div className="flex items-center justify-center gap-3 mb-6">
      <span className="w-6 h-[1px] bg-indigo-600/40 block flex-shrink-0" />
      <span className="text-[0.52rem] font-bold tracking-[0.2em] uppercase text-[var(--accent)] font-sans">{children}</span>
      <span className="w-6 h-[1px] bg-indigo-600/40 block flex-shrink-0" />
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
    <div className="bg-transparent text-[var(--text-primary)] min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center pt-48 pb-40 px-8">
        <div className="w-full max-w-[800px] mx-auto">
          <FadeIn>
            <Eyebrow>Our Story</Eyebrow>
            <h1 className="font-display text-[clamp(3rem,7.5vw,5.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-10 text-[var(--text-primary)]">
              Democratizing<br />
              <em className="italic text-[var(--accent)]">academic mentorship.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-[var(--text-secondary)] leading-[1.85] max-w-[680px] mx-auto">
              Schollective was built on a simple belief: students should be able to reach the academics
              who can change their trajectory — without needing to know the right people, attend the right school,
              or send hundreds of cold emails into the void.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-32 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-16 text-left">
              <div>
                <h2 className="font-display font-bold text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] leading-[0.95] text-[var(--text-primary)] mb-6">
                  Mentorship is gated by proximity.
                </h2>
                <p className="text-[0.95rem] text-[var(--text-secondary)] leading-[1.85]">
                  Students at underfunded schools or outside major research hubs rarely connect with the professors whose work matches their interests. Geography, institutional prestige, and sheer luck create invisible walls that have nothing to do with talent.
                </p>
              </div>
              <div>
                <h2 className="font-display font-bold text-[clamp(1.8rem,2.8vw,2.4rem)] tracking-[-0.03em] leading-[0.95] text-[var(--text-primary)] mb-6">
                  Cold emails don't scale.
                </h2>
                <p className="text-[0.95rem] text-[var(--text-secondary)] leading-[1.85]">
                  Professors receive hundreds of unfocused requests. Students spend days crafting emails that go unread. Both sides lose. Schollective replaces that broken system with structured, purposeful academic dialogue.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-32 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <Eyebrow>What We Stand For</Eyebrow>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-20 text-[var(--text-primary)]">
              Four principles.<br /><em className="italic text-[var(--accent)]">One direction.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {VALUES.map((v, i) => (
              <FadeIn key={v.n} delay={i * 0.07}>
                <div className="grid grid-cols-[3.5rem_1fr] gap-10 py-12 border-t border-[var(--border)] text-left items-start">
                  <span className="font-mono text-[0.55rem] tracking-[0.18em] text-[var(--text-tertiary)] pt-1.5">{v.n}</span>
                  <div>
                    <h3 className="font-display text-[1.45rem] font-bold text-[var(--text-primary)] tracking-[-0.02em] mb-3">{v.title}</h3>
                    <p className="text-[0.95rem] text-[var(--text-secondary)] leading-[1.8]">{v.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
            <div className="border-t border-[var(--border)]" />
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-32 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3rem)] font-black tracking-[-0.04em] leading-[0.95] mb-20 text-[var(--text-primary)]">
              Built by someone who<br /><em className="italic text-[var(--accent)]">lived the problem.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 w-full">
            {TEAM.map((m, i) => (
              <FadeIn key={m.name} delay={i * 0.07}>
                <div className="p-9 border border-[var(--border)] rounded-2xl bg-[var(--bg-surface-1)] h-full flex flex-col text-left transition-all duration-300 hover:shadow-md hover:border-[var(--border-hover)]">
                  <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-[var(--accent-blue)] to-[var(--accent)] flex items-center justify-center mb-6">
                    <span className="font-display font-black text-lg text-white">{m.initials}</span>
                  </div>
                  <div className="font-display font-bold text-[1.15rem] text-[var(--text-primary)] tracking-[-0.02em] mb-1.5">{m.name}</div>
                  <div className="text-[0.55rem] font-bold tracking-[0.22em] uppercase text-[var(--accent)] mb-5">{m.role}</div>
                  <p className="text-[0.9rem] text-[var(--text-secondary)] leading-[1.8]">{m.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-32 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 border border-[var(--border)] rounded-3xl bg-indigo-600/[0.03] flex flex-wrap justify-between items-center gap-12 text-center lg:text-left w-full">
              <div className="flex-[1_1_350px] max-w-md">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.6rem)] tracking-[-0.04em] text-[var(--text-primary)] mb-6 leading-tight">
                  Ready to connect?
                </h2>
                <p className="text-[0.95rem] text-[var(--text-secondary)] leading-[1.8] text-center lg:text-left">
                  Join the platform where serious students meet verified professors.
                </p>
              </div>
              <div className="flex gap-6 flex-wrap flex-shrink-0 mx-auto lg:mx-0">
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
      </section>

    </div>
  );
}
