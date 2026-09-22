"use client";

import React from "react";
import { Reveal } from "@/components/ui/PublicPage";
import { ScrollProgress } from "@/components/ui/ScrollProgress";
import { PublicNav } from "@/components/ui/PublicNav";
import { PublicFooter } from "@/components/ui/PublicFooter";
import { Button } from "@/components/ui/Button";
import { FileText, Microscope, BookOpen, Users } from "lucide-react";

const HOW_IT_WORKS = [
  { n: "01", title: "Build your academic snapshot", body: "Add your coursework, technical skills, and current projects so faculty can see your background in 15 seconds." },
  { n: "02", title: "Search by research focus", body: "Find faculty by the subfields they actually publish in — with AI-matched recommendations based on your interests — instead of digging through outdated department directories." },
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
    <div className="bg-transparent text-ink min-h-screen">
      <ScrollProgress />
      <PublicNav />

      {/* ── HERO ──────────────────────────────────────────── */}
      <section className="relative z-10 px-8 min-h-[75vh] flex flex-col items-center justify-center pt-36 md:pt-44 pb-20">
        <div className="w-full max-w-[760px] mx-auto flex flex-col items-center text-center">
          <Reveal className="w-full flex flex-col items-center">
            <h1 className="font-display text-[clamp(2.65rem,5.7vw,4.65rem)] font-black tracking-[-0.04em] leading-[1.08] mb-8 text-ink text-center">
              Reach out to the people behind the research you read
            </h1>
          </Reveal>
          <Reveal delay={0.15} className="w-full flex flex-col items-center">
            <p style={{ textAlign: "center" }} className="text-[clamp(1.05rem,1.4vw,1.25rem)] text-ink-soft leading-relaxed max-w-[620px] mb-10">
              Schollective helps students find active university researchers, understand their recent publications, and send concise, professional inquiries that respect faculty time.
            </p>
          </Reveal>
          <Reveal delay={0.2} className="w-full flex justify-center">
            <div className="flex justify-center gap-4 flex-wrap">
              <Button href="/signup" variant="primary" size="lg">
                Get Started
              </Button>
              <Button href="/about" variant="ghost" size="lg">
                Learn More
              </Button>
            </div>
          </Reveal>
        </div>
      </section>

      {/* ── HOW IT WORKS ─────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-ink">
              How it works, in four steps
            </h2>
          </Reveal>
          <div className="w-full">
            {HOW_IT_WORKS.map((s, i) => (
              <Reveal key={s.n} delay={i * 0.06}>
                <div className="grid grid-cols-[2.5rem_1fr] md:grid-cols-[3rem_1fr] gap-6 md:gap-8 p-8 md:p-10 mb-6 border border-indigo-300/40 rounded-2xl bg-white/90 text-left items-start shadow-xs">
                  <span className="w-9 h-9 rounded-full bg-indigo-50 border border-indigo-200/80 text-indigo-600 font-sans font-bold text-xs flex items-center justify-center flex-shrink-0 mt-0.5">{s.n}</span>
                  <div>
                    <h3 className="font-display text-[1.35rem] font-bold text-ink tracking-[-0.02em] mb-2">{s.title}</h3>
                    <p className="text-[0.95rem] text-ink-soft/80 leading-relaxed font-sans">{s.body}</p>
                  </div>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── USE CASES ────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <Reveal>
            <h2 className="font-display text-[clamp(2.2rem,4vw,3.5rem)] font-black tracking-[-0.04em] leading-[1.05] mb-14 text-ink">
              What students use Schollective for
            </h2>
          </Reveal>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 w-full max-w-[840px] mx-auto">
            {USE_CASES.map((uc, i) => (
              <Reveal key={uc.title} delay={i * 0.05}>
                <div className="p-8 border border-indigo-300/40 rounded-2xl bg-white h-full transition-all duration-300 hover:shadow-md hover:border-indigo-600 text-left flex flex-col">
                  <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-600/25 flex items-center justify-center mb-6">{uc.icon}</div>
                  <h3 className="font-display text-[1.15rem] font-bold text-ink tracking-[-0.02em] mb-2">{uc.title}</h3>
                  <p className="text-[0.88rem] text-ink-soft/80 leading-relaxed font-sans mt-auto">{uc.body}</p>
                </div>
              </Reveal>
            ))}
          </div>
        </div>
      </section>

      {/* ── CTA ──────────────────────────────────────────── */}
      <section className="relative z-10 flex flex-col items-center text-center px-8 border-t border-indigo-300/40" style={{ paddingTop: "9rem", paddingBottom: "9rem" }}>
        <div className="w-full max-w-[920px] mx-auto">
          <Reveal>
            <div className="border border-indigo-300/50 rounded-3xl bg-indigo-300/10 flex flex-col items-center gap-10 text-center w-full px-8 md:px-16" style={{ paddingTop: "6.5rem", paddingBottom: "6.5rem" }}>
              <div className="flex flex-col gap-4">
                <h2 className="font-display font-black text-[clamp(2rem,3vw,2.8rem)] tracking-[-0.04em] text-ink leading-tight">
                  Start reaching out to researchers in your field.
                </h2>
              </div>
              <div className="flex justify-center">
                <Button href="/signup" variant="primary" size="lg">
                  Get Started
                </Button>
              </div>
            </div>
          </Reveal>
        </div>
      </section>

      <PublicFooter />
    </div>
  );
}
