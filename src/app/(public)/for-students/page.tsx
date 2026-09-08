"use client";

import React, { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { FileText, Microscope, BookOpen, Users } from "lucide-react";

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

const HOW_IT_WORKS = [
  { n: "01", title: "Build your academic snapshot", body: "Add your coursework, technical skills, and current projects so faculty can see your background in 15 seconds." },
  { n: "02", title: "Search by publication topic", body: "Find faculty actively publishing in specific subfields rather than digging through outdated department directories." },
  { n: "03", title: "Read plain-English paper breakdowns", body: "Review summaries of recent lab findings so you can speak directly to what the researcher actually investigates." },
  { n: "04", title: "Draft a structured email", body: "Use an editor designed around faculty expectations to ask specific technical questions or inquire about mentorship." },
];

const USE_CASES = [
  { icon: <Microscope className="w-6 h-6 text-indigo-600" />, title: "Independent and competition projects", body: "Ask authors targeted questions about datasets, experimental protocols, or limitations mentioned in their papers." },
  { icon: <Users className="w-6 h-6 text-indigo-600" />, title: "Summer research and shadowing", body: "Inquire whether a professor accepts high school or early undergraduate volunteers for remote computational work or lab shadowing." },
  { icon: <FileText className="w-6 h-6 text-indigo-600" />, title: "Methodology feedback", body: "Get input on whether your proposed science fair or independent study approach is sound before spending months running trials." },
  { icon: <BookOpen className="w-6 h-6 text-indigo-600" />, title: "Narrowing academic interests", body: "Discover niche subfields within broad majors to decide what to study in college." },
];

export default function ForStudentsPage() {
  return (
    <div className="bg-transparent text-slate-900 min-h-screen">
      <ScrollProgress />
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center pt-36 md:pt-44 pb-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <FadeIn className="w-full flex flex-col items-center">
            <h1 className="font-display text-[clamp(2.8rem,6.5vw,5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-8 text-slate-900 text-center">
              Reach out to the people<br />
              <em className="italic font-light text-indigo-600">behind the research you read.</em>
            </h1>
          </FadeIn>
          <FadeIn delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-slate-600 leading-relaxed max-w-[620px] mb-10">
              Schollective helps students find active university researchers, understand their recent publications, and send concise, professional inquiries that respect faculty time.
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
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              How it works,<br /><em className="italic font-light text-indigo-600">in four steps.</em>
            </h2>
          </FadeIn>
          <div className="w-full">
            {HOW_IT_WORKS.map((s, i) => (
              <FadeIn key={s.n} delay={i * 0.06}>
                <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr] gap-6 md:gap-8 p-8 md:p-10 mb-6 border border-indigo-300/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 font-sans font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-slate-900 tracking-[-0.02em] mb-2">{s.title}</h3>
                    <p className="text-[0.95rem] text-slate-600/80 leading-relaxed font-sans">{s.body}</p>
                  </div>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <FadeIn>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-slate-900">
              What students use<br /><em className="italic font-light text-indigo-600">Schollective for.</em>
            </h2>
          </FadeIn>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[840px] mx-auto">
            {USE_CASES.map((uc, i) => (
              <FadeIn key={uc.title} delay={i * 0.05}>
                <div className="p-8 border border-indigo-300/40 rounded-2xl bg-white h-full transition-all duration-300 hover:shadow-md hover:border-indigo-600 text-left flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/25 flex items-center justify-center mb-6">{uc.icon}</div>
                  <h3 className="font-display text-[1.15rem] font-bold text-slate-900 tracking-[-0.02em] mb-2">{uc.title}</h3>
                  <p className="text-[0.88rem] text-slate-600/80 leading-relaxed font-sans mt-auto">{uc.body}</p>
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
            <div className="border border-indigo-300/50 rounded-3xl bg-indigo-300/10 flex flex-col items-center gap-10 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-slate-900 leading-tight">
                  Start reaching out to researchers in your field.
                </h2>
              </div>
              <div className="flex justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Create Account →
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
