"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";
import { TestimonialsSection } from "@/components/features/TestimonialsSection";

/* ── Page Loader ───────────────────────────────────────────────────────── */
function PageLoader({ done }: { done: boolean }) {
  const letters = "SCHOLLECTIVE".split("");
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.65, ease: [0.16, 1, 0.3, 1], delay: 0.15 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center select-none"
          style={{ background: "radial-gradient(circle at center, rgba(79, 70, 229, 0.04) 0%, #fcfbfa 60%, #faf9f7 100%)" }}
        >
          <div className="relative w-48 h-48 flex items-center justify-center mb-8">
            <motion.svg animate={{ rotate: 360 }} transition={{ duration: 6, ease: "linear", repeat: Infinity }} className="absolute w-48 h-48 pointer-events-none" viewBox="0 0 200 200">
              <circle cx="100" cy="100" r="96" stroke="rgba(79, 70, 229, 0.1)" strokeWidth="1" fill="none" strokeDasharray="4 4" />
              <circle cx="100" cy="4" r="3.5" fill="#4f46e5" />
            </motion.svg>
            <motion.svg animate={{ rotate: -360 }} transition={{ duration: 4.5, ease: "linear", repeat: Infinity }} className="absolute w-36 h-36 pointer-events-none" viewBox="0 0 160 160">
              <circle cx="80" cy="80" r="76" stroke="rgba(79, 70, 229, 0.15)" strokeWidth="1.2" fill="none" strokeDasharray="4 12" />
              <circle cx="80" cy="4" r="4.5" fill="#4338ca" />
            </motion.svg>
            <motion.svg animate={{ rotate: 360 }} transition={{ duration: 3, ease: "linear", repeat: Infinity }} className="absolute w-24 h-24 pointer-events-none" viewBox="0 0 100 100">
              <circle cx="50" cy="50" r="46" stroke="rgba(79, 70, 229, 0.2)" strokeWidth="1.5" fill="none" strokeDasharray="15 8" />
              <circle cx="82.5" cy="17.5" r="2.5" fill="#818cf8" />
            </motion.svg>
            <motion.div
              animate={{ scale: [0.96, 1.04, 0.96], boxShadow: ["0 0 12px rgba(79,70,229,0.05)", "0 0 28px rgba(79,70,229,0.15)", "0 0 12px rgba(79,70,229,0.05)"] }}
              transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }}
              className="absolute w-14 h-14 rounded-2xl bg-white border border-indigo-600/15 flex items-center justify-center"
            >
              <motion.svg animate={{ y: [-2, 2, -2] }} transition={{ duration: 2, ease: "easeInOut", repeat: Infinity }} width="24" height="24" viewBox="0 0 24 24" fill="none">
                <path d="M22 10v6M2 10l10-5 10 5-10 5z" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M6 12v5c0 2 2 3 6 3s6-1 6-3v-5" stroke="#4f46e5" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </motion.svg>
            </motion.div>
          </div>
          <div className="text-center">
            <div className="flex justify-center gap-0.5 overflow-hidden py-1 mb-1">
              {letters.map((char, i) => (
                <motion.span key={i} initial={{ y: "100%", opacity: 0 }} animate={{ y: 0, opacity: 1 }} transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1], delay: 0.1 + i * 0.04 }} className="font-mono text-xs font-bold uppercase tracking-[0.25em] text-indigo-600">
                  {char}
                </motion.span>
              ))}
            </div>
            <motion.p initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8, ease: "easeOut", delay: 0.6 }} className="font-mono text-[0.52rem] uppercase tracking-[0.25em] text-slate-400/80 m-0 mt-2">
              Academic Mentorship Platform
            </motion.p>
          </div>
          <div className="w-32 h-[1px] bg-slate-200/60 relative overflow-hidden mt-6 rounded-full">
            <motion.div initial={{ scaleX: 0, originX: 0 }} animate={{ scaleX: 1 }} transition={{ duration: 1.5, ease: [0.16, 1, 0.3, 1] }} className="absolute inset-0 bg-indigo-600" />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

function FadeIn({ children, delay = 0, className = "" }: { children: React.ReactNode; delay?: number; className?: string }) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-4%" });
  return (
    <motion.div ref={ref} initial={{ opacity: 0, y: 40 }} animate={isInView ? { opacity: 1, y: 0 } : {}} transition={{ duration: 0.7, ease: EASE, delay }} className={className}>
      {children}
    </motion.div>
  );
}

function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex items-center justify-center rounded-full bg-indigo-600/5 border border-indigo-600/10 py-1.5 px-4 mb-10 select-none mx-auto">
      <span className="font-sans uppercase text-indigo-600 tracking-[0.2em] font-bold text-center" style={{ fontSize: "0.62rem" }}>
        {children}
      </span>
    </div>
  );
}

function MockupChrome({ url, children }: { url: string; children: React.ReactNode }) {
  return (
    <div className="relative p-6 md:p-8 rounded-3xl border border-slate-200/80 bg-white flex flex-col gap-6 w-full text-left max-w-lg mx-auto">
      <div className="flex items-center justify-between border-b border-slate-100 pb-3 w-full">
        <div className="flex items-center gap-1.5">
          <div className="w-2.5 h-2.5 rounded-full bg-red-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-yellow-400/50" />
          <div className="w-2.5 h-2.5 rounded-full bg-green-400/50" />
        </div>
        <span className="font-mono text-[0.55rem] text-slate-300 text-center mx-auto flex-1">{url}</span>
      </div>
      {children}
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════════════
   LANDING PAGE
══════════════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const router = useRouter();
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaderDone(true), 1800);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <PageLoader done={loaderDone} />

      <div
        className="relative text-slate-900 font-sans overflow-x-hidden"
        style={{ background: "#fdfdfd", opacity: loaderDone ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <PublicNav />

        {/* ══ HERO ══════════════════════════════════════════════════════ */}
        <section className="relative min-h-screen flex flex-col items-center justify-center text-center py-24 px-6" style={{ background: "#fdfdfd" }}>
          <AnimatedBackground />
          <div className="relative z-10 w-full max-w-3xl mx-auto flex flex-col items-center text-center">
            <h1
              className="font-display font-bold text-slate-900 tracking-tighter leading-[1.08] text-center w-full mx-auto"
              style={{ fontSize: "clamp(3rem, 6.5vw, 5.2rem)" }}
            >
              Find the mentor<br />
              <span className="italic font-light text-indigo-600">who changes your life.</span>
            </h1>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.9 }}
              className="font-sans text-slate-500 text-lg leading-relaxed mt-8 mb-12 max-w-md mx-auto text-center"
            >
              Cold emails to professors go unanswered. Send structured requests that get read.
            </motion.p>
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}
              className="flex justify-center w-full mx-auto"
            >
              <Button href="/signup" variant="primary" size="lg">Get Started →</Button>
            </motion.div>
          </div>
        </section>

        {/* ══ PROBLEM STATEMENT ════════════════════════════════════════ */}
        <section className="js-fade relative border-t border-slate-100 min-h-screen flex flex-col items-center justify-center py-24 px-6" style={{ background: "#fdfdfd" }}>
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
            <Label>The truth about academic cold-outreach</Label>
            <h2
              className="font-display font-bold text-slate-900 tracking-normal leading-[1.4] text-center w-full mx-auto mb-10"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
            >
              Professors delete most student outreach emails<br />
              <span className="italic font-light text-slate-400">before finishing the first line.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-5 w-full mt-8 mb-16 mx-auto">
              {[
                "Professors can spot AI-written emails instantly.",
                "Generic requests that could go to anyone get ignored.",
                "Citing papers without understanding them backfires.",
              ].map((reason, i) => (
                <div key={i} className="flex flex-col items-center justify-center text-center p-12 rounded-2xl border border-slate-200/50 bg-[#fdfdfd] mx-auto w-full">
                  <span className="w-8 h-8 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold font-sans mb-6 select-none mx-auto">✕</span>
                  <p className="text-slate-600 text-sm leading-loose tracking-wide text-center mx-auto">{reason}</p>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="group inline-flex items-center justify-center gap-1.5 font-sans text-xs uppercase tracking-[0.22em] text-indigo-600 border-b border-indigo-600/20 pb-2 hover:border-indigo-600 transition-colors font-bold mx-auto text-center mt-6"
              style={{ textDecoration: "none" }}
            >
              Send one that gets read <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        {/* ══ COMPARISON TABLE ═════════════════════════════════════════ */}
        <section className="js-fade relative border-t border-slate-100 min-h-screen flex flex-col items-center justify-center py-24 px-6" style={{ background: "#fdfdfd" }}>
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center">
            <Label>Comparing Outreach</Label>
            <h2
              className="font-display font-bold text-slate-900 tracking-tighter leading-[1.1] text-center w-full mb-16 mx-auto"
              style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
            >
              Why not just use ChatGPT?
            </h2>

            <div className="border border-slate-200/70 rounded-3xl p-8 md:p-12 bg-[#fdfdfd] w-full mx-auto">
              {/* Desktop header */}
              <div className="hidden md:grid grid-cols-2 border-b border-slate-200 pb-6 mb-8 w-full mx-auto">
                <div className="text-center mx-auto w-full flex justify-center">
                  <span className="font-sans text-[0.68rem] font-bold tracking-widest text-slate-400 uppercase text-center mx-auto">ChatGPT</span>
                </div>
                <div className="text-center border-l border-slate-200 mx-auto w-full flex justify-center">
                  <span className="font-sans text-[0.68rem] font-bold tracking-widest text-indigo-600 uppercase text-center mx-auto">Schollective</span>
                </div>
              </div>

              <div className="flex flex-col gap-8 md:gap-0 w-full mx-auto">
                {[
                  { bad: "Hallucinates professors and fake papers.", good: "Every profile is manually verified and active." },
                  { bad: "Writes your message for you — professors delete those instantly.", good: "Guides you to craft a structured, contextual request in your own voice." },
                  { bad: "Requires 20 back-and-forth prompts to find and understand professors.", good: "One search surfaces professors, research summaries, and a request builder together." },
                ].map((row, i) => (
                  <div key={i} className="grid grid-cols-1 md:grid-cols-2 md:py-8 md:border-b md:border-slate-100 md:last:border-none md:last:pb-0 w-full mx-auto">
                    <div className="flex flex-col items-center justify-center text-center pb-8 md:pb-0 border-b border-slate-100 md:border-none gap-4 pr-0 md:pr-10 w-full mx-auto">
                      <span className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold select-none mx-auto">✕</span>
                      <p className="text-slate-500 text-sm leading-relaxed max-w-xs mx-auto text-center">{row.bad}</p>
                    </div>
                    <div className="flex flex-col items-center justify-center text-center pt-8 md:pt-0 md:border-l md:border-slate-200 gap-4 pl-0 md:pl-10 w-full mx-auto">
                      <span className="w-7 h-7 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center text-indigo-600 text-xs font-bold select-none mx-auto">✓</span>
                      <p className="text-slate-900 text-sm leading-relaxed font-medium max-w-xs mx-auto text-center">{row.good}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ 3-STEP WALKTHROUGH ══════════════════════════════════════ */}
        <section className="js-fade relative border-t border-slate-100 min-h-screen flex flex-col items-center justify-center py-24 px-6" style={{ background: "#fdfdfd" }}>
          <div className="w-full max-w-4xl mx-auto flex flex-col items-center text-center mb-16 md:mb-24">
            <Label>How it works</Label>
          </div>

          {/* Step 01 */}
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 md:mb-24">
            {/* The fix: Center text column always, stagger comes from grid order */}
            <div className="flex flex-col items-center justify-center text-center w-full mx-auto">
              <span className="font-mono text-4xl font-light text-indigo-600/25 mb-8 select-none block w-full text-center">01</span>
              <h3 className="font-display font-bold text-slate-900 tracking-tighter leading-[1.1] text-center w-full" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
                Search any research interest.
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm mt-6 mb-10 max-w-sm mx-auto text-center">
                Type what you care about: quantum computing, cognitive neuroscience, or climate policy. We surface top professors publishing in that exact space, ranked by impact.
              </p>
              <Link href="/signup" className="group inline-flex items-center justify-center gap-1.5 font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 font-bold transition-colors mx-auto text-center" style={{ textDecoration: "none" }}>
                Try a search <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            {/* Right mockup */}
            <div className="w-full mx-auto flex justify-center">
              <MockupChrome url="schollective.org/app">
                <div className="flex items-center justify-center gap-2 p-2.5 rounded-xl bg-slate-50/60 border border-slate-100 select-none">
                  <span className="px-4 py-2 rounded-lg bg-indigo-600/10 border border-indigo-600/20 text-xs text-indigo-600 font-semibold">neuroscience</span>
                  <span className="px-4 py-2 rounded-lg text-xs text-slate-400">Harvard</span>
                </div>
                <div className="flex flex-col gap-3">
                  {[
                    { name: "Dr. Emily Nakamura", uni: "Harvard Medical School", tag1: "Memory", tag2: "fMRI" },
                    { name: "Prof. James Miller", uni: "MIT Brain & Cognitive", tag1: "Neural Circuits", tag2: "AI" },
                    { name: "Dr. Aisha Patel", uni: "Stanford Neuroscience", tag1: "BCI", tag2: "Computation" },
                  ].map((prof, i) => (
                    <div key={i} className="flex flex-col items-center p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                      <div className="flex items-center justify-between w-full mb-2">
                        <span className="font-display font-bold text-xs text-slate-800">{prof.name}</span>
                        <span className="font-sans text-[0.6rem] text-slate-400">{prof.uni}</span>
                      </div>
                      <div className="flex gap-1.5">
                        <span className="px-2 py-0.5 rounded bg-slate-100 text-[0.55rem] text-slate-500 font-medium">{prof.tag1}</span>
                        <span className="px-2 py-0.5 rounded bg-indigo-600/5 text-[0.55rem] text-indigo-600 border border-indigo-600/10 font-semibold">{prof.tag2}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </MockupChrome>
            </div>
          </div>

          {/* Step 02 */}
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center mb-16 md:mb-24">
            {/* The fix: Center text column always, forced to the right via grid order */}
            <div className="flex flex-col items-center justify-center text-center w-full mx-auto order-1 lg:order-2">
              <span className="font-mono text-4xl font-light text-indigo-600/25 mb-8 select-none block w-full text-center">02</span>
              <h3 className="font-display font-bold text-slate-900 tracking-tighter leading-[1.1] text-center w-full" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
                Understand their research.
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm mt-6 mb-10 max-w-sm mx-auto text-center">
                Every professor profile has an AI-synthesized summary of their key findings, written so a high schooler or undergrad can understand it and reference it with precision. No more pretending to read 40-page papers.
              </p>
              <Link href="/signup" className="group inline-flex items-center justify-center gap-1.5 font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 font-bold transition-colors mx-auto text-center" style={{ textDecoration: "none" }}>
                See an example <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            {/* Left mockup */}
            <div className="w-full mx-auto flex justify-center order-2 lg:order-1">
              <MockupChrome url="schollective.org/app">
                <div className="p-5 rounded-2xl border border-indigo-600/10 bg-[#fdfdfd] flex flex-col items-center text-center">
                  <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-3 w-full">
                    <span className="font-display font-bold text-xs text-slate-900">Dr. Emily Nakamura</span>
                    <span className="px-2 py-0.5 rounded bg-indigo-600/10 text-[0.55rem] text-indigo-600 font-bold">2024 PAPER</span>
                  </div>
                  <p className="text-slate-500 text-xs leading-[1.7] mb-4 text-center mx-auto">
                    Studies how memories form and consolidate during sleep using fMRI. Recent work shows neural oscillation patterns predict next-day recall accuracy in elderly patients with early cognitive decline.
                  </p>
                  <div className="p-4 rounded-xl bg-indigo-600/[0.03] border border-indigo-600/10 flex flex-col items-center text-center w-full">
                    <span className="font-sans text-[0.52rem] uppercase text-indigo-600 tracking-widest font-bold block mb-1.5">Key Finding</span>
                    <p className="text-slate-900 text-xs leading-[1.6] font-medium text-center mx-auto">
                      Theta oscillations during REM sleep increased memory consolidation by 34%. Published 2024, first-author.
                    </p>
                  </div>
                </div>
              </MockupChrome>
            </div>
          </div>

          {/* Step 03 */}
          <div className="w-full max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-center">
            {/* The fix: Center text column always */}
            <div className="flex flex-col items-center justify-center text-center w-full mx-auto">
              <span className="font-mono text-4xl font-light text-indigo-600/25 mb-8 select-none block w-full text-center">03</span>
              <h3 className="font-display font-bold text-slate-900 tracking-tighter leading-[1.1] text-center w-full" style={{ fontSize: "clamp(1.8rem, 3vw, 2.6rem)" }}>
                Draft structured requests.
              </h3>
              <p className="text-slate-500 leading-relaxed text-sm mt-6 mb-10 max-w-sm mx-auto text-center">
                Our structured request model, co-designed with research faculty, guides you through describing your understanding, interests, and availability. No more guessing what professors want to hear.
              </p>
              <Link href="/signup" className="group inline-flex items-center justify-center gap-1.5 font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 font-bold transition-colors mx-auto text-center" style={{ textDecoration: "none" }}>
                Try request flow <span className="transition-transform group-hover:translate-x-1">→</span>
              </Link>
            </div>
            {/* Right mockup */}
            <div className="w-full mx-auto flex justify-center">
              <MockupChrome url="schollective.org/editor">
                <div className="flex flex-col gap-5 w-full">
                  <div className="flex-1 p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col items-center gap-3 text-center">
                    <span className="font-sans text-[0.52rem] text-slate-400 uppercase tracking-wider font-semibold">Structured Request Flow</span>
                    <div className="text-xs leading-[1.7] text-slate-500 flex flex-col items-center">
                      <p className="mb-2.5 line-through text-red-400/80 decoration-[#ea580c] decoration-1">I would love to join your lab next semester.</p>
                      <p className="text-slate-800 border-l-2 border-indigo-600 bg-indigo-600/[0.02] py-2 px-4 font-medium rounded-sm text-center">
                        I have been analyzing memory consolidation in sleep. Your 2024 theta oscillation findings motivated my question...
                      </p>
                    </div>
                  </div>
                  <div className="flex flex-row justify-center gap-2 flex-wrap">
                    <div className="p-2.5 rounded-lg border border-red-500/10 bg-red-500/[0.02] flex items-center justify-center gap-2">
                      <span className="text-red-500 text-xs font-bold select-none">✕</span>
                      <span className="font-sans text-[0.58rem] text-red-500 tracking-wider font-bold">Generic</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex items-center justify-center gap-2">
                      <span className="text-green-500 text-xs font-bold select-none">✓</span>
                      <span className="font-sans text-[0.58rem] text-green-600 tracking-wider font-bold">Cites Work</span>
                    </div>
                    <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex items-center justify-center gap-2">
                      <span className="text-green-500 text-xs font-bold select-none">✓</span>
                      <span className="font-sans text-[0.58rem] text-green-600 tracking-wider font-bold">Structured</span>
                    </div>
                  </div>
                </div>
              </MockupChrome>
            </div>
          </div>
        </section>

        {/* ══ TESTIMONIALS ══════════════════════════════════════════════ */}
        <TestimonialsSection />

        {/* ══ FINAL CTA ════════════════════════════════════════════════ */}
        <section className="js-fade relative border-t border-slate-100 min-h-screen flex flex-col items-center justify-center py-24 px-6" style={{ background: "#fdfdfd" }}>
          <div className="w-full max-w-2xl mx-auto flex flex-col items-center text-center">
            <h2
              className="font-display font-bold text-slate-900 tracking-tighter leading-[1.1] text-center w-full mx-auto"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              Your research mentor is<br />
              <span className="italic font-light text-indigo-600">one structured request away.</span>
            </h2>
            <p className="font-sans text-slate-400 mt-8 mb-12 text-sm text-center mx-auto w-full">Free to use. No credit card required.</p>
            <div className="flex items-center justify-center w-full mx-auto">
              <Button href="/signup" variant="primary" size="lg">Create Account →</Button>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ══════════════════════════════════════════════════ */}
        <footer style={{ background: "#faf9f7", borderTop: "1px solid rgba(79, 70, 229, 0.15)" }}>
          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-24 md:py-32 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 text-left">
            <FadeIn delay={0} className="md:col-span-2 flex flex-col items-start gap-4">
              <Link href="/" className="group select-none flex items-center gap-3" style={{ textDecoration: "none" }}>
                <div className="transition-transform duration-300 group-hover:scale-105">
                  <SchollectiveLogo size={44} />
                </div>
                <span className="font-display font-bold text-xl text-slate-900 tracking-tight transition-colors duration-300 group-hover:text-indigo-600">Schollective</span>
              </Link>
              <p className="font-light leading-relaxed font-sans text-sm text-slate-600 max-w-sm opacity-90">
                Connecting ambitious students with verified professors for structured, transparent academic mentorship. Every question deserves a real answer.
              </p>
            </FadeIn>

            <FadeIn delay={0.1} className="col-span-1 flex flex-col items-start gap-4">
              <span className="font-sans uppercase text-[0.62rem] tracking-widest text-indigo-600 font-bold">Quick Links</span>
              <nav className="flex flex-col gap-3 items-start">
                {[
                  { label: "Home", href: "/" },
                  { label: "About", href: "/about" },
                  { label: "For Students", href: "/for-students" },
                  { label: "For Professors", href: "/for-professors" },
                  { label: "Sign Up", href: "/signup" },
                  { label: "Log In", href: "/login" },
                ].map((link) => (
                  <Link key={link.label} href={link.href} className="font-sans text-sm text-slate-600 hover:text-indigo-600 transition-all duration-200 hover:translate-x-1 inline-block">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </FadeIn>

            <FadeIn delay={0.2} className="md:col-span-2 lg:col-span-2 flex flex-col items-start gap-4">
              <span className="font-sans uppercase text-[0.62rem] tracking-widest text-indigo-600 font-bold">Contact Us</span>
              <div className="flex flex-col gap-4 items-start w-full">
                {[
                  {
                    icon: <><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="22,6 12,13 2,6" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
                    text: "schollective.corp@gmail.com", href: "mailto:schollective.corp@gmail.com"
                  },
                  {
                    icon: <><path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /><polyline points="9,22 9,12 15,12 15,22" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
                    text: "Serving schools worldwide"
                  },
                  {
                    icon: <><circle cx="12" cy="12" r="10" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" /><polyline points="12,6 12,12 16,14" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /></>,
                    text: "Free to use — always"
                  },
                ].map((item, i) => {
                  const inner = (
                    <div className="flex items-center gap-3 text-left group">
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(79,70,229,0.06)", border: "1px solid rgba(79,70,229,0.12)", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }} className="transition-all duration-200 group-hover:border-indigo-600/30 group-hover:bg-indigo-600/10 group-hover:scale-105">
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none">{item.icon}</svg>
                      </div>
                      <span className="font-sans text-sm text-slate-600 transition-colors duration-200 group-hover:text-indigo-600">{item.text}</span>
                    </div>
                  );
                  return item.href
                    ? <a key={i} href={item.href} style={{ textDecoration: "none" }} className="hover:no-underline">{inner}</a>
                    : <div key={i}>{inner}</div>;
                })}
              </div>
            </FadeIn>
          </div>

          <div style={{ maxWidth: "80rem", margin: "0 auto", height: "1px", background: "rgba(79,70,229,0.14)", marginLeft: "2.5rem", marginRight: "2.5rem" }} />

          <div className="max-w-7xl mx-auto px-4 md:px-8 lg:px-12 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <span className="font-sans text-xs text-slate-500">© 2026 Schollective, Inc. All rights reserved.</span>
              <span className="font-sans text-[0.68rem] text-slate-500">Not a substitute for official academic advising.</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[0.68rem] text-slate-500">Built with</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" style={{ opacity: 0.55 }}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="rgba(79,70,229,0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-sans text-[0.68rem] text-slate-500">for students seeking knowledge</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}