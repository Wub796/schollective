"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { FileText, GraduationCap, Microscope, BookOpen, Users, PenTool } from "lucide-react";

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

const HOW_IT_WORKS = [
  { n: "01", title: "Create Your Profile", body: "Sign up in under two minutes. Tell us your grade level, school, and what areas of research excite you. No essays, no applications." },
  { n: "02", title: "Browse Verified Professors", body: "Search our database of institutionally verified academics by field, research interest, or university. Every profile is real and reviewed." },
  { n: "03", title: "Send a Focused Request", body: "Use our structured request template to explain your question clearly. Professors get context upfront — which means faster, better responses." },
  { n: "04", title: "Grow Through Dialogue", body: "Continue the conversation in a dedicated thread. Build a relationship with your mentor over time, entirely within Schollective." },
];

const USE_CASES = [
  { icon: <FileText className="w-6 h-6 text-[#008CBB]" />, title: "Research Paper Guidance", body: "Get feedback on your thesis, methodology, or literature review from a professor in exactly that field." },
  { icon: <GraduationCap className="w-6 h-6 text-[#008CBB]" />, title: "Graduate School Planning", body: "Ask professors about their programs, what they look for in applicants, and how to strengthen your profile." },
  { icon: <Microscope className="w-6 h-6 text-[#008CBB]" />, title: "Science Fair & Research Projects", body: "High schoolers: get expert perspective on your project before competition season." },
  { icon: <BookOpen className="w-6 h-6 text-[#008CBB]" />, title: "Understanding Complex Topics", body: "Sometimes textbooks aren't enough. Get a nuanced explanation from someone who has spent a career studying it." },
  { icon: <Users className="w-6 h-6 text-[#008CBB]" />, title: "Finding Research Opportunities", body: "Learn about lab openings, summer programs, and internships directly from professors actively seeking students." },
  { icon: <PenTool className="w-6 h-6 text-[#008CBB]" />, title: "Academic Writing Improvement", body: "Get your writing reviewed by academics who publish regularly and know exactly what clarity looks like." },
];

export default function ForStudentsPage() {
  return (
    <div className="bg-transparent text-[#141005] min-h-screen">
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center py-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <Eyebrow>For Students</Eyebrow>
            <h1 className="font-display text-[clamp(2.8rem,6.5vw,5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-8 text-[#141005] text-center">
              Your questions<br />
              <em className="italic font-light text-[#008CBB]">deserve real answers.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-[#3b3527] leading-relaxed max-w-[620px] mb-10">
              Whether you&apos;re a high schooler working on a science fair project or an undergrad navigating grad school
              applications, Schollective connects you directly with verified professors who can actually help —
              for free, with no cold-email anxiety.
            </p>
          </FadeIn>
          <FadeIn delay={0.2} className="w-full flex justify-center">
            <div className="flex justify-center gap-4 flex-wrap">
              <Button href="/signup" variant="primary" size="lg">
                Join Free →
              </Button>
              <Button href="/about" variant="ghost" size="lg">
                Learn More
              </Button>
            </div>
          </FadeIn>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40 py-28 md:py-40">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-[#141005]">
              From sign-up to<br /><em className="italic font-light text-[#008CBB]">insight, in four steps.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {HOW_IT_WORKS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.06}>
                <div className="grid grid-cols-[3.5rem_1fr] gap-8 p-8 md:p-10 mb-6 border border-[#A1C5D1]/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="font-mono text-[0.68rem] font-bold tracking-[0.2em] text-[#141005] bg-[#FFC20F] px-2.5 py-1 rounded-full text-center mt-1">{s.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-[#141005] tracking-[-0.02em] mb-2">{s.title}</h3>
                    <p className="text-[0.95rem] text-[#3b3527]/80 leading-relaxed font-sans">{s.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40 py-28 md:py-40">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-[#141005]">
              Every serious question<br /><em className="italic font-light text-[#008CBB]">has a home here.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 w-full">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={uc.title} delay={i * 0.05}>
                <div className="p-8 border border-[#A1C5D1]/40 rounded-2xl bg-white h-full transition-all duration-300 hover:shadow-md hover:border-[#008CBB] text-left flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-[#008CBB]/10 border border-[#008CBB]/25 flex items-center justify-center mb-6">{uc.icon}</div>
                  <h3 className="font-display text-[1.15rem] font-bold text-[#141005] tracking-[-0.02em] mb-2">{uc.title}</h3>
                  <p className="text-[0.88rem] text-[#3b3527]/80 leading-relaxed font-sans mt-auto">{uc.body}</p>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-[#A1C5D1]/40 py-28 md:py-40">
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <div className="p-12 md:p-16 border border-[#A1C5D1]/50 rounded-3xl bg-[#A1C5D1]/10 flex flex-col items-center gap-10 text-center w-full">
              <div className="flex flex-col gap-3">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-[#141005] leading-tight">
                  Start for free, today.
                </h2>
                <p className="text-[1rem] text-[#3b3527]/80 leading-relaxed max-w-[480px] mx-auto font-sans">
                  Join thousands of students getting real guidance from verified professors.
                </p>
              </div>
              <div className="flex gap-4 flex-wrap justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Create Account →
                </Button>
                <Button href="/professors" variant="ghost" size="lg">
                  Browse Mentors
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
