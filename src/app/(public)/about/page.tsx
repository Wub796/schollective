"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];
const SECTION_STYLE = { paddingTop: "8rem", paddingBottom: "8rem" };
const HERO_STYLE = { paddingTop: "9rem", paddingBottom: "8rem" };

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
      <span className="w-6 h-[2px] bg-[#FFC20F] block flex-shrink-0" />
      <span className="text-[0.62rem] font-extrabold tracking-[0.22em] uppercase text-[#008CBB] font-sans">{children}</span>
      <span className="w-6 h-[2px] bg-[#FFC20F] block flex-shrink-0" />
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
    <div className="bg-transparent text-[#141005] min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center py-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <Eyebrow>Our Story</Eyebrow>
            <h1 className="font-display text-[clamp(2.8rem,6.5vw,5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-8 text-[#141005] text-center">
              Democratizing<br />
              <em className="italic font-light text-[#008CBB]">academic mentorship.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-[#3b3527] leading-relaxed max-w-[620px]">
              Schollective was built on a simple belief: students should be able to reach the academics
              who can change their trajectory — without needing to know the right people, attend the right school,
              or send hundreds of cold emails into the void.
            </p>
          </FadeIn>
        </div>
      </section>

      {/* ── THE PROBLEM ──────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-12 text-left">
              <div className="p-8 md:p-10 border border-[#A1C5D1]/40 rounded-2xl bg-white/80 shadow-xs flex flex-col gap-4">
                <h2 className="font-display font-bold text-[clamp(1.6rem,2.5vw,2.2rem)] tracking-[-0.03em] leading-snug text-[#141005]">
                  Mentorship is gated by proximity.
                </h2>
                <p className="text-[0.95rem] text-[#3b3527]/80 leading-relaxed font-sans">
                  Students at underfunded schools or outside major research hubs rarely connect with the professors whose work matches their interests. Geography, institutional prestige, and sheer luck create invisible walls that have nothing to do with talent.
                </p>
              </div>
              <div className="p-8 md:p-10 border border-[#A1C5D1]/40 rounded-2xl bg-white/80 shadow-xs flex flex-col gap-4">
                <h2 className="font-display font-bold text-[clamp(1.6rem,2.5vw,2.2rem)] tracking-[-0.03em] leading-snug text-[#141005]">
                  Cold emails don&apos;t scale.
                </h2>
                <p className="text-[0.95rem] text-[#3b3527]/80 leading-relaxed font-sans">
                  Professors receive hundreds of unfocused requests. Students spend days crafting emails that go unread. Both sides lose. Schollective replaces that broken system with structured, purposeful academic dialogue.
                </p>
              </div>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── VALUES ───────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <Eyebrow>What We Stand For</Eyebrow>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-[#141005]">
              Four principles.<br /><em className="italic font-light text-[#008CBB]">One direction.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {VALUES.map((v, i) => (
              <FadeIn key={v.n} delay={i * 0.07}>
                <div className="grid grid-cols-[3.5rem_1fr] gap-8 p-8 md:p-10 mb-6 border border-[#A1C5D1]/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="font-mono text-[0.68rem] font-bold tracking-[0.2em] text-[#141005] bg-[#FFC20F] px-2.5 py-1 rounded-full text-center mt-1">{v.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-[#141005] tracking-[-0.02em] mb-2">{v.title}</h3>
                    <p className="text-[0.95rem] text-[#3b3527]/80 leading-relaxed font-sans">{v.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── TEAM ─────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,3.5vw,3rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-[#141005]">
              Built by someone who<br /><em className="italic font-light text-[#008CBB]">lived the problem.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 w-full">
            {TEAM.map((m, i) => (
              <FadeIn key={m.name} delay={i * 0.07}>
                <div className="p-8 border border-[#A1C5D1]/40 rounded-2xl bg-white h-full flex flex-col text-left transition-all duration-300 hover:shadow-md hover:border-[#008CBB]">
                  <div className="w-12 h-12 rounded-xl bg-[#008CBB] flex items-center justify-center mb-6 shadow-sm">
                    <span className="font-display font-black text-lg text-white">{m.initials}</span>
                  </div>
                  <div className="font-display font-bold text-[1.15rem] text-[#141005] tracking-[-0.02em] mb-1">{m.name}</div>
                  <div className="inline-block text-[0.55rem] font-bold tracking-[0.22em] uppercase text-[#141005] bg-[#FFC20F] px-2 py-0.5 rounded-full w-fit mb-4">{m.role}</div>
                  <p className="text-[0.88rem] text-[#3b3527]/80 leading-relaxed font-sans mt-auto">{m.desc}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="border border-[#A1C5D1]/50 rounded-3xl bg-[#A1C5D1]/10 flex flex-col items-center gap-12 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <div className="flex flex-col gap-5">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-[#141005] leading-tight">
                  Ready to connect?
                </h2>
                <p className="text-[1rem] text-[#3b3527]/80 leading-relaxed max-w-[480px] mx-auto font-sans text-center">
                  Join the platform where serious students meet verified professors.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Create Account →
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
