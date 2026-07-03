"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";
import { FileText, GraduationCap, Microscope, BookOpen, Users, PenTool } from "lucide-react";

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

const HOW_IT_WORKS = [
  { n: "01", title: "Create Your Profile", body: "Sign up in under two minutes. Tell us your grade level, school, and what areas of research excite you. No essays, no applications." },
  { n: "02", title: "Browse Verified Professors", body: "Search our database of institutionally verified academics by field, research interest, or university. Every profile is real and reviewed." },
  { n: "03", title: "Send a Focused Request", body: "Use our structured request template to explain your question clearly. Professors get context upfront — which means faster, better responses." },
  { n: "04", title: "Grow Through Dialogue", body: "Continue the conversation in a dedicated thread. Build a relationship with your mentor over time, entirely within Schollective." },
];

const USE_CASES = [
  { icon: <FileText className="w-6 h-6 text-indigo-600" />, title: "Research Paper Guidance", body: "Get feedback on your thesis, methodology, or literature review from a professor in exactly that field." },
  { icon: <GraduationCap className="w-6 h-6 text-indigo-600" />, title: "Graduate School Planning", body: "Ask professors about their programs, what they look for in applicants, and how to strengthen your profile." },
  { icon: <Microscope className="w-6 h-6 text-indigo-600" />, title: "Science Fair & Research Projects", body: "High schoolers: get expert perspective on your project before competition season." },
  { icon: <BookOpen className="w-6 h-6 text-indigo-600" />, title: "Understanding Complex Topics", body: "Sometimes textbooks aren't enough. Get a nuanced explanation from someone who has spent a career studying it." },
  { icon: <Users className="w-6 h-6 text-indigo-600" />, title: "Finding Research Opportunities", body: "Learn about lab openings, summer programs, and internships directly from professors actively seeking students." },
  { icon: <PenTool className="w-6 h-6 text-indigo-600" />, title: "Academic Writing Improvement", body: "Get your writing reviewed by academics who publish regularly and know exactly what clarity looks like." },
];

export default function ForStudentsPage() {
  return (
    <div className="bg-transparent text-[var(--text-primary)] min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8" style={{ paddingTop: "9rem", paddingBottom: "8rem" }}>
        <div className="w-full max-w-[800px] mx-auto">
          <FadeIn>
            <Eyebrow>For Students</Eyebrow>
            <h1 className="font-display text-[clamp(3rem,7.5vw,5.5rem)] font-black tracking-[-0.04em] leading-[0.95] mb-10 text-[var(--text-primary)]">
              Your questions<br />
              <em className="italic text-[var(--accent)]">deserve real answers.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15}>
            <p className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-[var(--text-secondary)] leading-[1.85] max-w-[660px] mx-auto mb-12">
              Whether you&apos;re a high schooler working on a science fair project or an undergrad navigating grad school applications,
              Schollective connects you directly with verified professors who can actually help — for free, with no cold-email anxiety.
            </p>
          </FadeIn>
          <FadeIn delay={0.2}>
            <div className="flex justify-center gap-6 flex-wrap">
              <Button href="/signup" variant="primary" size="lg" className="uppercase tracking-widest text-[0.6rem]">
                Join Free
              </Button>
              <Button href="/about" variant="ghost" size="lg" className="uppercase tracking-widest text-[0.6rem]">
                Learn More
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-40 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-none mb-14 text-[var(--text-primary)]">
              From sign-up to<br /><em className="italic text-[var(--accent)]">insight, in four steps.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {HOW_IT_WORKS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.06}>
                <div className="grid grid-cols-[3.5rem_1fr] gap-10 py-14 border-t border-[var(--border)] text-left items-start">
                  <span className="font-mono text-[0.55rem] tracking-[0.18em] text-[var(--text-tertiary)] pt-1.5">{s.n}</span>
                  <div>
                    <h3 className="font-display text-[1.45rem] font-bold text-[var(--text-primary)] tracking-[-0.02em] mb-3">{s.title}</h3>
                    <p className="text-[0.95rem] text-[var(--text-secondary)] leading-[1.8]">{s.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
            <div className="border-t border-[var(--border)]" />
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-40 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-none mb-14 text-[var(--text-primary)]">
              Every serious question<br /><em className="italic text-[var(--accent)]">has a home here.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 w-full">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={uc.title} delay={i * 0.05}>
                <div className="p-9 border border-[var(--border)] rounded-2xl bg-[var(--bg-surface-1)] h-full transition-all duration-300 hover:shadow-md hover:border-[var(--border-hover)] text-left flex flex-col">
                  <div className="mb-5 flex items-center justify-start text-[var(--accent)]">{uc.icon}</div>
                  <h3 className="font-display text-[1.15rem] font-bold text-[var(--text-primary)] tracking-[-0.02em] mb-3">{uc.title}</h3>
                  <p className="text-[0.9rem] text-[var(--text-secondary)] leading-[1.8]">{uc.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center py-40 px-8 border-t border-[var(--border)]">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 border border-[var(--border)] rounded-3xl bg-indigo-600/[0.03] flex flex-wrap justify-between items-center gap-12 text-center lg:text-left w-full">
              <div className="max-w-md">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.6rem)] tracking-[-0.04em] text-[var(--text-primary)] mb-4 leading-tight">
                  Start for free, today.
                </h2>
                <p className="text-[0.95rem] text-[var(--text-secondary)] leading-[1.8] text-center lg:text-left">
                  No credit card. No waitlist. Just create an account and start connecting with the academics who can change your trajectory.
                </p>
              </div>
              <Button href="/signup" variant="primary" size="lg" className="uppercase tracking-widest text-[0.6rem] flex-shrink-0 mx-auto lg:mx-0">
                Create Student Account
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

    </div>
  );
}
