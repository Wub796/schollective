"use client";

import React, { useRef, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { motion, useInView, AnimatePresence } from "framer-motion";
import { PublicNav } from "@/components/ui/PublicNav";
import { Button } from "@/components/ui/Button";
import { AnimatedBackground } from "@/components/ui/AnimatedBackground";

/* ── Page Loader (rotating cube loader) ────────────────────────────────── */
function PageLoader({ done }: { done: boolean }) {
  const LETTERS = ["S", "C", "H", "O", "L", "L"];
  return (
    <AnimatePresence>
      {!done && (
        <motion.div
          key="loader"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.55, ease: [0.19, 1, 0.22, 1], delay: 0.1 }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center gap-6"
          style={{ background: "#fdfdfd" }}
        >
          <div style={{ width: "5rem", height: "5rem", perspective: "20rem", position: "relative" }}>
            <motion.div
              animate={{ rotateY: [0, 90, 90, 180, 180, 270, 270, 360], rotateX: [0, 0, 0, 0, -90, -90, 0, 0] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity }}
              style={{ width: "100%", height: "100%", position: "relative", transformStyle: "preserve-3d" }}
            >
              {LETTERS.map((ch, i) => {
                const faces = [
                  { rotateY: 0, translateZ: "2.5rem" },
                  { rotateY: -90, translateZ: "2.5rem" },
                  { rotateX: -90, translateZ: "2.5rem" },
                  { rotateX: 180, translateZ: "2.5rem" },
                  { rotateX: 90, translateZ: "2.5rem" },
                  { rotateY: 90, translateZ: "2.5rem" },
                ][i];
                return (
                  <div
                    key={i}
                    className="absolute w-full h-full flex items-center justify-center border text-lg font-black"
                    style={{
                      background: i % 2 === 0 ? "rgba(79, 70, 229, 0.05)" : "rgba(79, 70, 229, 0.15)",
                      borderColor: "rgba(79, 70, 229, 0.25)",
                      color: "#4f46e5",
                      transform: `rotate${Object.keys(faces)[0].replace("rotate", "") as string}(${Object.values(faces)[0]}) translateZ(${Object.values(faces)[1]})`,
                      backfaceVisibility: "hidden",
                    }}
                  >
                    {ch}
                  </div>
                );
              })}
            </motion.div>
          </div>

          <div className="text-center select-none">
            <p className="font-mono text-[0.7rem] uppercase tracking-[0.35em] text-indigo-600/60 font-semibold m-0">
              Schollective
            </p>
            <p className="font-mono text-[0.55rem] tracking-[0.2em] text-slate-400 m-0 mt-1">
              Academic Mentorship Platform
            </p>
          </div>

          <div className="w-32 h-[1px] bg-slate-200 relative overflow-hidden">
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
              className="absolute inset-0 bg-indigo-600"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

/* ── SplitReveal ────────────────────────────────────────────────────────── */
function SplitReveal({
  children, className = "", delay = 0, as: Tag = "h2", style,
}: {
  children: string; className?: string; delay?: number;
  as?: "h1" | "h2" | "h3" | "p"; style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-6%" });
  const words = children.split(" ");

  return (
    <Tag ref={ref as any} className={className} style={style}>
      {words
        .map((word, i) => (
          <span key={i} className="inline-block overflow-hidden" style={{ verticalAlign: "bottom" }}>
            <motion.span
              className="inline-block"
              initial={{ y: "105%" }}
              animate={isInView ? { y: 0 } : {}}
              transition={{ duration: 0.8, ease: EASE, delay: delay + i * 0.05 }}
            >
              {word}
            </motion.span>
          </span>
        ))
        .reduce<React.ReactNode[]>((acc, el, i) => {
          if (i > 0) acc.push(" ");
          acc.push(el);
          return acc;
        }, [])}
      {Tag === "h1" && <span className="text-indigo-600">.</span>}
    </Tag>
  );
}

/* ── FadeIn ─────────────────────────────────────────────────────────────── */
function FadeIn({ children, delay = 0, className = "" }: {
  children: React.ReactNode; delay?: number; className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-4%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 40 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Label ──────────────────────────────────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-center gap-3 mb-6 w-full select-none">
      <span className="block w-5 h-px bg-indigo-600/30 flex-shrink-0" />
      <span className="font-sans uppercase text-indigo-600 tracking-[0.2em] font-semibold" style={{ fontSize: "0.55rem" }}>
        {children}
      </span>
      <span className="block w-5 h-px bg-indigo-600/30 flex-shrink-0" />
    </div>
  );
}

/* ── LandingPage ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => setLoaderDone(true), 1300);
    return () => clearTimeout(t);
  }, []);

  return (
    <>
      <PageLoader done={loaderDone} />

      <div
        className="relative text-slate-900 font-sans overflow-x-hidden"
        style={{
          background: "#fdfdfd",
          opacity: loaderDone ? 1 : 0,
          transition: "opacity 0.5s ease"
        }}
      >
        <PublicNav />

        {/* ══ HERO SECTION ═══════════════════════════════════════════════ */}
        <section className="relative min-h-[92vh] flex flex-col justify-center py-20" style={{ background: "#fdfdfd" }}>
          <AnimatedBackground />

          <div className="relative z-10 w-full max-w-[80rem] mx-auto px-6 md:px-12 lg:px-16 flex flex-col items-center text-center">
            {/* Headline */}
            <h1
              className="font-display font-bold text-slate-900 mb-8 select-none tracking-tight leading-[1.1]"
              style={{ fontSize: "clamp(3rem, 6.5vw, 5.2rem)" }}
            >
              Find the mentor<br />
              <span className="italic font-light text-indigo-600">who changes your life.</span>
            </h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 0.9 }}
              className="font-sans leading-[1.7] text-slate-600/80 mb-10 text-lg max-w-xl mx-auto"
            >
              Cold emails to professors go unanswered. Send structured requests that get read.
            </motion.p>

            {/* CTA */}
            <motion.div
              initial={{ opacity: 0, y: 15 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1.1 }}
              className="flex items-center justify-center"
            >
              <Button href="/signup" variant="primary" size="lg">
                Get Started →
              </Button>
            </motion.div>
          </div>
        </section>

        {/* ══ PROBLEM STATEMENT ══════════════════════════════════════════ */}
        <section className="js-fade relative py-28 border-t border-slate-100" style={{ background: "#fdfdfd" }}>
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">
            <Label>The truth about academic cold-outreach</Label>

            <h2
              className="font-display font-bold text-slate-900 mt-8 mb-14 tracking-tight leading-[1.15]"
              style={{ fontSize: "clamp(2rem, 4vw, 3.2rem)" }}
            >
              Professors delete 90% of student outreach emails<br />
              <span className="italic font-light text-slate-600/40">before finishing the first line.</span>
            </h2>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 w-full mb-14 text-center">
              {[
                "Professors can spot AI-written emails instantly.",
                "Generic requests that could go to anyone get ignored.",
                "Citing papers without understanding them backfires."
              ].map((reason, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center justify-center p-6 rounded-2xl border border-slate-200/50 bg-[#fdfdfd] w-full text-center"
                >
                  <span className="w-7 h-7 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-500 text-xs font-bold font-sans mb-4 mx-auto select-none">
                    ✕
                  </span>
                  <span className="text-slate-600 text-sm leading-[1.7] max-w-xs">{reason}</span>
                </div>
              ))}
            </div>

            <Link
              href="/signup"
              className="group inline-flex items-center gap-1 font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 transition-colors font-bold"
              style={{ textDecoration: "none" }}
            >
              Send one that gets read <span className="transition-transform group-hover:translate-x-1">→</span>
            </Link>
          </div>
        </section>

        {/* ══ COMPARISON TABLE ══════════════════════════════════════════ */}
        <section className="js-fade py-28 relative border-t border-slate-100" style={{ background: "#fdfdfd" }}>
          <div className="max-w-[64rem] mx-auto px-6 md:px-12">
            <div className="text-center mb-16">
              <Label>Comparing Outreach</Label>
              <h2
                className="font-display font-bold text-slate-900 mt-6 tracking-tight leading-[1.2]"
                style={{ fontSize: "clamp(2rem, 3.5vw, 3rem)" }}
              >
                Why not just use ChatGPT?
              </h2>
            </div>

            <div className="border border-slate-200/70 rounded-3xl p-6 md:p-10 bg-[#fdfdfd]">
              {/* Desktop view header */}
              <div className="hidden md:grid grid-cols-2 border-b border-slate-200 pb-6 mb-6">
                <div className="pr-8">
                  <span className="font-sans text-[0.68rem] font-bold tracking-widest text-slate-400 uppercase">
                    ChatGPT
                  </span>
                </div>
                <div className="pl-8 border-l border-slate-200">
                  <span className="font-sans text-[0.68rem] font-bold tracking-widest text-indigo-600 uppercase">
                    Schollective
                  </span>
                </div>
              </div>

              {/* Rows */}
              <div className="flex flex-col gap-6 md:gap-0">
                {[
                  {
                    bad: "Hallucinates professors and fake papers.",
                    good: "Every profile is manually verified and active."
                  },
                  {
                    bad: "Writes your message for you — professors delete those instantly.",
                    good: "Guides you to craft a structured, contextual request in your own voice."
                  },
                  {
                    bad: "Requires 20 back-and-forth prompts to find and understand professors.",
                    good: "One search surfaces professors, research summaries, and a request builder together."
                  }
                ].map((row, i) => (
                  <div
                    key={i}
                    className="grid grid-cols-1 md:grid-cols-2 md:py-6 md:border-b md:border-slate-200 md:last:border-none md:last:pb-0"
                  >
                    {/* Left Column (ChatGPT) */}
                    <div className="pr-0 md:pr-8 flex gap-4 items-start pb-4 md:pb-0 border-b border-slate-100 md:border-none">
                      <span className="text-red-500 font-bold font-sans text-sm select-none flex-shrink-0 pt-0.5">✕</span>
                      <p className="text-slate-600 text-sm leading-[1.7] font-sans">{row.bad}</p>
                    </div>
                    {/* Right Column (Schollective) */}
                    <div className="pl-0 md:pl-8 mt-4 md:mt-0 md:border-l md:border-slate-200 flex gap-4 items-start">
                      <span className="text-indigo-600 font-bold font-sans text-sm select-none flex-shrink-0 pt-0.5">✓</span>
                      <p className="text-slate-900 text-sm leading-[1.7] font-sans font-medium">{row.good}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ 3-STEP WALKTHROUGH ═══════════════════════════════════════ */}
        <section className="py-28 flex flex-col gap-28 border-t border-slate-100" style={{ background: "#fdfdfd" }}>
          <div className="max-w-[80rem] mx-auto px-6 w-full flex flex-col items-center">
            <Label>How it works</Label>
          </div>

          {/* Step 01 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="flex flex-col items-center text-center">
              <span className="font-sans text-3xl font-light text-indigo-600/40 mb-6 font-mono select-none">01</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mb-6 leading-[1.2]">
                Search any research interest.
              </h3>
              <p className="text-slate-600 leading-[1.7] text-sm mb-8 font-sans max-w-md mx-auto">
                Type what you care about: quantum computing, cognitive neuroscience, or climate policy. We surface top professors publishing in that exact space, ranked by impact.
              </p>
              <Link
                href="/signup"
                className="font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 font-bold transition-colors"
                style={{ textDecoration: "none" }}
              >
                Try a search →
              </Link>
            </div>

            {/* Visual Mockup 01 */}
            <div className="relative p-6 md:p-8 rounded-3xl border border-slate-200/80 bg-white flex flex-col gap-6 w-full text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/40" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
                  <div className="w-2 h-2 rounded-full bg-green-400/40" />
                </div>
                <span className="font-sans text-[0.55rem] text-slate-300 font-mono">schollective.org/app</span>
              </div>

              {/* Mock Input */}
              <div className="flex gap-2 p-2 rounded-xl bg-slate-50/60 border border-slate-100 items-center select-none">
                <span className="px-4 py-2 rounded-lg bg-indigo-600/10 border border-indigo-600/20 text-xs text-indigo-600 font-semibold font-sans">
                  neuroscience
                </span>
                <span className="px-4 py-2 rounded-lg text-xs text-slate-400 font-sans">
                  Harvard
                </span>
              </div>

              {/* Mock Professor Cards */}
              <div className="flex flex-col gap-3">
                {[
                  { name: "Dr. Emily Nakamura", uni: "Harvard Medical School", tag1: "Memory", tag2: "fMRI" },
                  { name: "Prof. James Miller", uni: "MIT Brain & Cognitive", tag1: "Neural Circuits", tag2: "AI" },
                  { name: "Dr. Aisha Patel", uni: "Stanford Neuroscience", tag1: "BCI", tag2: "Computation" }
                ].map((prof, i) => (
                  <div key={i} className="flex flex-col items-start p-4 rounded-xl border border-slate-100 bg-slate-50/30">
                    <div className="flex items-center justify-between w-full mb-1">
                      <span className="font-display font-bold text-xs text-slate-800">{prof.name}</span>
                      <span className="font-sans text-[0.6rem] text-slate-400 font-medium">{prof.uni}</span>
                    </div>
                    <div className="flex gap-1.5">
                      <span className="px-2 py-0.5 rounded bg-slate-100 text-[0.55rem] text-slate-500 font-sans font-medium">{prof.tag1}</span>
                      <span className="px-2 py-0.5 rounded bg-indigo-600/5 text-[0.55rem] text-indigo-600 border border-indigo-600/10 font-sans font-semibold">{prof.tag2}</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Step 02 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            {/* Visual Mockup 02 (Left side for desktop layout) */}
            <div className="order-2 lg:order-1 relative p-6 md:p-8 rounded-3xl border border-slate-200/80 bg-white flex flex-col gap-6 w-full text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/40" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
                  <div className="w-2 h-2 rounded-full bg-green-400/40" />
                </div>
                <span className="font-sans text-[0.55rem] text-slate-300 font-mono">schollective.org/app</span>
              </div>

              {/* Research summary UI */}
              <div className="p-5 rounded-2xl border border-indigo-600/10 bg-[#fdfdfd]">
                <div className="flex items-center justify-between mb-4 border-b border-slate-100 pb-2.5">
                  <span className="font-display font-bold text-xs text-slate-900">Dr. Emily Nakamura</span>
                  <span className="px-2 py-0.5 rounded bg-indigo-600/10 text-[0.55rem] text-indigo-600 font-bold font-sans">2024 PAPER</span>
                </div>
                <p className="text-slate-600 text-xs leading-[1.6] mb-4 font-sans">
                  Studies how memories form and consolidate during sleep using fMRI. Recent work shows neural oscillation patterns predict next-day recall accuracy in elderly patients with early cognitive decline.
                </p>
                <div className="p-3.5 rounded-xl bg-indigo-600/[0.03] border border-indigo-600/10">
                  <span className="font-sans text-[0.52rem] uppercase text-indigo-600 tracking-widest font-bold block mb-1">Key Finding</span>
                  <p className="text-slate-900 text-xs leading-[1.5] font-sans font-medium">
                    Theta oscillations during REM sleep increased memory consolidation by 34%. Published 2024, first-author.
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex flex-col items-center text-center">
              <span className="font-sans text-3xl font-light text-indigo-600/40 mb-6 font-mono select-none">02</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mb-6 leading-[1.2]">
                Understand their research in plain English.
              </h3>
              <p className="text-slate-600 leading-[1.7] text-sm mb-8 font-sans max-w-md mx-auto">
                Every professor profile has an AI-synthesized summary of their key findings, written so a high schooler or undergrad can understand it and reference it with precision. No more pretending to read 40-page papers.
              </p>
              <Link
                href="/signup"
                className="font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 font-bold transition-colors"
                style={{ textDecoration: "none" }}
              >
                See an example →
              </Link>
            </div>
          </div>

          {/* Step 03 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 md:px-12 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 lg:gap-24 items-center">
            <div className="flex flex-col items-center text-center">
              <span className="font-sans text-3xl font-light text-indigo-600/40 mb-6 font-mono select-none">03</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mb-6 leading-[1.2]">
                Draft structured requests that get answered.
              </h3>
              <p className="text-slate-600 leading-[1.7] text-sm mb-8 font-sans max-w-md mx-auto">
                Our structured request model, co-designed with research faculty, guides you through describing your understanding, interests, and availability. No more guessing what professors want to hear.
              </p>
              <Link
                href="/signup"
                className="font-sans text-xs uppercase tracking-widest text-indigo-600 border-b border-indigo-600/20 pb-1.5 hover:border-indigo-600 font-bold transition-colors"
                style={{ textDecoration: "none" }}
              >
                Try request flow →
              </Link>
            </div>

            {/* Visual Mockup 03 */}
            <div className="relative p-6 md:p-8 rounded-3xl border border-slate-200/80 bg-white flex flex-col gap-6 w-full text-left">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3">
                <div className="flex items-center gap-1.5">
                  <div className="w-2 h-2 rounded-full bg-red-400/40" />
                  <div className="w-2 h-2 rounded-full bg-yellow-400/40" />
                  <div className="w-2 h-2 rounded-full bg-green-400/40" />
                </div>
                <span className="font-sans text-[0.55rem] text-slate-300 font-mono">schollective.org/editor</span>
              </div>

              <div className="flex flex-col sm:flex-row gap-6">
                {/* Mock email draft */}
                <div className="flex-1 p-5 rounded-xl border border-slate-100 bg-slate-50/50 flex flex-col gap-2.5">
                  <span className="font-sans text-[0.52rem] text-slate-400 uppercase tracking-wider font-semibold">STRUCTURED REQUEST FLOW</span>
                  <div className="text-xs leading-[1.6] text-slate-500 font-sans">
                    <p className="mb-2 line-through text-red-400/80 decoration-[#ea580c] decoration-1">
                      I would love to join your lab next semester.
                    </p>
                    <p className="text-slate-800 border-l-2 border-indigo-600 pl-2 bg-indigo-600/[0.02] py-1 font-medium">
                      I have been analyzing memory consolidation in sleep. Your 2024 theta oscillation findings motivated my question...
                    </p>
                  </div>
                </div>

                {/* Validation list */}
                <div className="w-full sm:w-48 flex flex-col gap-2 flex-shrink-0">
                  <div className="p-2.5 rounded-lg border border-red-500/10 bg-red-500/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-red-500 text-xs font-bold">✕</span>
                      <span className="font-sans text-[0.6rem] text-red-500 tracking-wider font-bold">GENERIC REQUEST</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-green-500 text-xs font-bold">✓</span>
                      <span className="font-sans text-[0.6rem] text-green-600 tracking-wider font-bold">CITES WORK DIRECTLY</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.01] flex items-center justify-between">
                    <div className="flex items-center gap-2 select-none">
                      <span className="text-green-500 text-xs font-bold">✓</span>
                      <span className="font-sans text-[0.6rem] text-green-600 tracking-wider font-bold">STRUCTURED CONTEXT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOUNDER QUOTE ═══════════════════════════════════════════════ */}
        <section className="py-28 relative border-t border-slate-100" style={{ background: "#fdfdfd" }}>
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center flex flex-col items-center py-6">
            <span className="text-6xl md:text-7xl font-display font-light text-indigo-600 select-none leading-none mb-4">
              “
            </span>
            <blockquote className="font-display text-xl md:text-2xl font-light text-slate-800 leading-relaxed max-w-2xl italic select-none mb-8">
              When we were students, we realized how difficult it was to reach out to the right professors. Cold emails went unanswered, and credentials were hard to verify. We built Schollective to establish genuine, verified mentorship.
            </blockquote>
            <div className="flex flex-col items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-indigo-600/10 border border-indigo-600/20 flex items-center justify-center font-display font-bold text-indigo-600 text-sm select-none">
                A
              </div>
              <div className="text-center font-sans">
                <div className="text-xs font-bold text-slate-900 uppercase tracking-widest">Aiden & Ayaan</div>
                <div className="text-[0.65rem] text-slate-400 font-semibold tracking-wider uppercase mt-0.5">Founders, Schollective</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FINAL CTA ═══════════════════════════════════════════════════ */}
        <section className="js-fade relative py-28 border-t border-slate-100" style={{ background: "#fdfdfd" }}>
          <div className="max-w-4xl mx-auto px-6 md:px-12 text-center flex flex-col items-center">
            <Label>Get started</Label>

            <h2
              className="font-display font-bold text-slate-900 mt-6 mb-4 tracking-tight leading-[1.15]"
              style={{ fontSize: "clamp(2.5rem, 5vw, 4rem)" }}
            >
              Your research mentor is<br />
              <span className="italic font-light text-indigo-600">one structured request away.</span>
            </h2>

            <p className="font-sans leading-[1.7] text-slate-500 mb-10 text-sm tracking-wide">
              Free to use. No credit card required.
            </p>

            <div className="flex items-center justify-center">
              <Button href="/signup" variant="primary" size="lg">
                Create Account →
              </Button>
            </div>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer style={{ background: "#fdfdfd", borderTop: "1px solid rgba(79, 70, 229, 0.08)" }}>
          <div className="max-w-[80rem] mx-auto px-6 md:px-12 lg:px-16 py-16 grid grid-cols-1 md:grid-cols-4 lg:grid-cols-5 gap-12 text-left">
            <FadeIn delay={0} className="md:col-span-2 flex flex-col items-start gap-4">
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <SchollectiveLogo size={44} />
                <span className="font-display font-bold text-xl text-slate-900 tracking-tight">
                  Schollective
                </span>
              </div>
              <p className="font-light leading-relaxed font-sans text-sm text-slate-500 max-w-sm">
                Connecting ambitious students with verified professors for structured, transparent academic mentorship. Every question deserves a real answer.
              </p>
            </FadeIn>

            <FadeIn delay={0.1} className="col-span-1 flex flex-col items-start gap-4">
              <span className="font-sans uppercase text-[0.62rem] tracking-widest text-indigo-600/70 font-bold">
                Quick Links
              </span>
              <nav className="flex flex-col gap-3 items-start">
                {[
                  { label: "Home", href: "/" },
                  { label: "About", href: "/about" },
                  { label: "For Students", href: "/for-students" },
                  { label: "For Professors", href: "/for-professors" },
                  { label: "Sign Up", href: "/signup" },
                  { label: "Log In", href: "/login" },
                ].map((link) => (
                  <Link key={link.label} href={link.href}
                    className="font-sans text-sm text-slate-500 hover:text-indigo-600 transition-colors">
                    {link.label}
                  </Link>
                ))}
              </nav>
            </FadeIn>

            <FadeIn delay={0.2} className="md:col-span-2 lg:col-span-2 flex flex-col items-start gap-4">
              <span className="font-sans uppercase text-[0.62rem] tracking-widest text-indigo-600/70 font-bold">
                Contact Us
              </span>
              <div className="flex flex-col gap-4 items-start w-full">
                {[
                  { icon: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, extra: <polyline points="22,6 12,13 2,6" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, text: "schollective.corp@gmail.com", href: "mailto:schollective.corp@gmail.com" },
                  { icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, extra: <polyline points="9,22 9,12 15,12 15,22" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, text: "Serving schools worldwide" },
                  { icon: <circle cx="12" cy="12" r="10" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" />, extra: <polyline points="12,6 12,12 16,14" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, text: "Free to use — always" },
                ].map((item, i) => {
                  const inner = (
                    <div className="flex items-center gap-3 text-left">
                      <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(79, 70, 229, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0, justifyContent: "center" }}>
                        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                          {item.icon}{item.extra}
                        </svg>
                      </div>
                      <span className="font-sans text-sm text-slate-500">{item.text}</span>
                    </div>
                  );
                  return item.href
                    ? <a key={i} href={item.href} style={{ textDecoration: "none" }}>{inner}</a>
                    : <div key={i}>{inner}</div>;
                })}
              </div>
            </FadeIn>
          </div>

          <div style={{ maxWidth: "80rem", margin: "0 auto", height: "1px", background: "rgba(79, 70, 229, 0.09)", marginLeft: "2.5rem", marginRight: "2.5rem" }} />

          <div className="max-w-[80rem] mx-auto px-6 md:px-12 lg:px-16 py-8 flex flex-col md:flex-row justify-between items-center gap-6">
            <div className="flex flex-col gap-1 items-center md:items-start text-center md:text-left">
              <span className="font-sans text-xs text-slate-500">
                © 2026 Schollective, Inc. All rights reserved.
              </span>
              <span className="font-sans text-[0.68rem] text-slate-400">
                Not a substitute for official academic advising.
              </span>
            </div>
            <div className="flex items-center gap-2">
              <span className="font-sans text-[0.68rem] text-slate-400">Built with</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.55 }}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="rgba(79, 70, 229, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-sans text-[0.68rem] text-slate-400">for students seeking knowledge</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}