"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
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


const VALUES = [
  { n: "01", title: "Free for students", body: "No subscriptions, paywalls, or paid tiers." },
  { n: "02", title: "Verified faculty", body: "Every profile is matched against current university faculty rosters and recent lab publications." },
  { n: "03", title: "Specific pitches only", body: "We replace blind outreach with structured messages that highlight your actual coursework, technical skills, and familiarity with the lab's papers." },
];

const TEAM = [
  { initials: "AR", name: "Aiden Raj", role: "Co-Founder", desc: "Leads product development and faculty outreach across regional universities." },
  { initials: "AS", name: "Ayaan Siddiqui", role: "Co-Founder", desc: "Manages student community growth and school partnership onboarding." },
  { initials: "BW", name: "Benjamin Wu", role: "Core Developer", desc: "Builds frontend interfaces and student onboarding flows." },
  { initials: "JH", name: "Joseph Hu", role: "Core Developer", desc: "Builds full-stack application architecture, AI review services, and data integrations." },
];

export default function AboutPage() {
  return (
    <div className="bg-transparent text-slate-900 min-h-screen">
      <ScrollProgress />
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center pt-36 md:pt-44 pb-20">
        <div className="w-full max-w-[820px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <h1 className="font-display text-[clamp(2.4rem,5.5vw,4.5rem)] font-black tracking-[-0.04em] leading-[1.1] mb-8 text-slate-900 text-center">
              High school research should not<br />
              <em className="italic font-light text-indigo-600">depend on who your parents know.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.35vw,1.2rem)] text-slate-600 leading-relaxed max-w-[680px]">
              Most students do not have family ties to university labs or attend schools with dedicated research pipelines. Schollective gives anyone with genuine curiosity a direct way to find active professors, understand their publications, and send professional inquiries.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2rem,3.5vw,2.8rem)] font-black tracking-[-0.03em] text-slate-900 mb-12 text-center">
              Why cold emailing is broken <em className="italic font-light text-indigo-600">for both sides:</em>
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
              <div className="p-8 md:p-10 border border-indigo-300/40 rounded-2xl bg-white/80 shadow-xs flex flex-col gap-4">
                <h3 className="font-display font-bold text-[clamp(1.4rem,2vw,1.8rem)] tracking-[-0.02em] leading-snug text-slate-900">
                  For students
                </h3>
                <p className="text-[0.95rem] text-slate-600/80 leading-relaxed font-sans">
                  Finding professors who actually take high schoolers takes weeks of digging through outdated faculty directories. Most emails go unanswered because students do not know how to pitch their background.
                </p>
              </div>
              <div className="p-8 md:p-10 border border-indigo-300/40 rounded-2xl bg-white/80 shadow-xs flex flex-col gap-4">
                <h3 className="font-display font-bold text-[clamp(1.4rem,2vw,1.8rem)] tracking-[-0.02em] leading-snug text-slate-900">
                  For professors
                </h3>
                <p className="text-[0.95rem] text-slate-600/80 leading-relaxed font-sans">
                  Labs receive dozens of generic, copy-pasted templates every week. Faculty do not have time to read through vague pitches to figure out if a student has relevant skills.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              How we run <em className="italic font-light text-indigo-600">Schollective.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {VALUES.map((v, i) => (
              <FadeIn key={v.n} delay={i * 0.07}>
                <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr] gap-6 md:gap-8 p-8 md:p-10 mb-6 border border-indigo-300/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 font-sans font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{v.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-slate-900 tracking-[-0.02em] mb-2">{v.title}</h3>
                    <p className="text-[0.95rem] text-slate-600/80 leading-relaxed font-sans">{v.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              Built by students who<br /><em className="italic font-light text-indigo-600">lived the problem.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {TEAM.map((m, i) => (
              <FadeIn key={m.name} delay={i * 0.07}>
                <div className="p-8 border border-indigo-300/40 rounded-2xl bg-white h-full flex flex-col text-left transition-all duration-300 hover:shadow-md hover:border-indigo-600">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600 flex items-center justify-center mb-6 shadow-sm">
                    <span className="font-display font-black text-lg text-white">{m.initials}</span>
                  </div>
                  <div className="font-display font-bold text-[1.15rem] text-slate-900 tracking-[-0.02em] mb-1">{m.name}</div>
                  <div className="inline-block text-[0.55rem] font-bold tracking-[0.22em] uppercase text-slate-900 bg-indigo-500 px-2 py-0.5 rounded-full w-fit mb-4">{m.role}</div>
                  <p className="text-[0.88rem] text-slate-600/80 leading-relaxed font-sans mt-auto">{m.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="border border-indigo-300/50 rounded-3xl bg-indigo-300/10 flex flex-col items-center gap-8 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <h2 className="font-display font-black text-[clamp(2rem,3.5vw,3rem)] tracking-[-0.04em] text-slate-900 leading-tight max-w-[640px] mx-auto">
                Start reaching out to labs doing work you care about.
              </h2>
              <div className="flex gap-4 flex-wrap justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Create an Account →
                </Button>
                <Button href="/" variant="ghost" size="lg">
                  Back to Home
                </Button>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
