"use client";

import React, { useRef, useLayoutEffect } from "react";
import Link from "next/link";
import { motion, useInView } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import dynamic from "next/dynamic";
import { PublicNav } from "@/components/ui/PublicNav";


const ThreeBackground = dynamic(
  () => import("@/components/ui/ThreeBackground").then(m => m.ThreeBackground),
  { ssr: false }
);
const FloatingOrb = dynamic(
  () => import("@/components/ui/FloatingOrb").then(m => m.FloatingOrb),
  { ssr: false }
);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

/* ── Word-by-word cinematic reveal ──────────────────────────────── */
function SplitReveal({
  children,
  className = "",
  delay = 0,
  as: Tag = "h2",
  style,
}: {
  children: string;
  className?: string;
  delay?: number;
  as?: "h1" | "h2" | "h3" | "p";
  style?: React.CSSProperties;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-8%" });
  const words = children.split(" ");

  return (
    <Tag ref={ref as any} className={className} style={style}>
      {words
        .map((word, i) => (
          <span key={i} className="inline-block overflow-hidden">
            <motion.span
              className="inline-block"
              initial={{ y: "110%", opacity: 0 }}
              animate={isInView ? { y: 0, opacity: 1 } : {}}
              transition={{ duration: 1.1, ease: EASE, delay: delay + i * 0.07 }}
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
    </Tag>
  );
}

/* ── Scroll-triggered fade up ───────────────────────────────────── */
function FadeIn({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once: true, margin: "-5%" });
  return (
    <motion.div
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={isInView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.9, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/* ── Igloo-style hairline label ─────────────────────────────────── */
function Label({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3 mb-14">
      <span className="block w-5 h-px flex-shrink-0" style={{ background: "rgba(250, 250, 249, 0.3)" }} />
      <span
        className="font-mono uppercase"
        style={{ fontSize: "0.52rem", letterSpacing: "0.48em", color: "rgba(250, 250, 249, 0.5)" }}
      >
        {children}
      </span>
    </div>
  );
}

/* ── Step data ───────────────────────────────────────────────────── */
const STEPS = [
  {
    num: "01",
    title: "Create Profile",
    body: "Join as a student instantly. Professors undergo rigorous manual institutional verification.",
  },
  {
    num: "02",
    title: "Find Mentor",
    body: "Search our vetted database by academic field, research interest, and real‑time availability.",
  },
  {
    num: "03",
    title: "Submit Request",
    body: "Craft a focused mentorship request using our structured academic templates.",
  },
  {
    num: "04",
    title: "Guided Dialogue",
    body: "Communicate securely through organized, one-on-one threads — no personal email required.",
  },
];

/* ══════════════════════════════════════════════════════════════════
    MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const stepsPinRef = useRef<HTMLDivElement>(null);
  const stepsTrackRef = useRef<HTMLDivElement>(null);

  useLayoutEffect(() => {
    if (!stepsPinRef.current || !stepsTrackRef.current) return;

    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        const track = stepsTrackRef.current!;
        const totalScroll = track.scrollWidth - window.innerWidth;
        if (totalScroll <= 0) return;

        gsap.to(track, {
          x: -totalScroll,
          ease: "none",
          scrollTrigger: {
            trigger: stepsPinRef.current,
            start: "top top",
            end: () => `+=${totalScroll + window.innerWidth}`,
            scrub: 1,
            pin: true,
            pinSpacing: true,
            anticipatePin: 1,
          },
        });

        gsap.utils.toArray<HTMLElement>(".js-fade").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 48 },
            {
              opacity: 1,
              y: 0,
              duration: 1,
              ease: "power2.out",
              scrollTrigger: {
                trigger: el,
                start: "top 88%",
                toggleActions: "play none none reverse",
              },
            }
          );
        });
      }, pageRef);

      return () => ctx.revert();
    }, 120);

    return () => clearTimeout(timer);
  }, []);

  return (
    <div ref={pageRef} className="relative text-[#fafaf9] font-sans overflow-x-hidden" style={{ background: "var(--bg-base)" }}>

      {/* ══ DYNAMIC ISLAND NAV ══════════════════════════════════════════ */}
      <PublicNav />


      {/* ══ HERO — Full viewport, text bottom-left, CTA bottom-right ═════ */}
      <section className="relative h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

        {/* Three.js + radial vignette */}
        <div className="absolute inset-0 z-0">
          <ThreeBackground />
          <div
            className="absolute inset-0 pointer-events-none"
            style={{ background: "radial-gradient(ellipse 110% 80% at 50% 45%, transparent 5%, rgba(9, 9, 11, 0.82) 75%)" }}
          />
        </div>

        {/* Eyebrow — top left, below nav */}
        <div className="absolute left-10 md:left-16 z-10" style={{ top: "6.5rem" }}>
          <motion.div
            initial={{ opacity: 0, x: -12 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 1.3, ease: EASE, delay: 0.5 }}
            className="flex items-center gap-3"
          >
            <span className="block w-4 h-px" style={{ background: "rgba(129, 140, 248, 0.4)" }} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: "0.48rem", letterSpacing: "0.48em", color: "rgba(129, 140, 248, 0.55)" }}
            >
              Direct Academic Mentorship
            </span>
          </motion.div>
        </div>

        {/* Massive headline — bottom-left anchored */}
        <div className="absolute left-0 z-10 px-10 md:px-16" style={{ bottom: "3.5rem" }}>
          <h1
            className="font-display font-black tracking-tighter leading-[0.86] text-[#fafaf9]"
            style={{ fontSize: "clamp(3.5rem, 12.5vw, 14rem)" }}
          >
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.5, ease: EASE, delay: 0.6 }}
              >
                Scholar
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block italic"
                style={{ color: "rgba(168, 179, 207, 0.75)" }}
                initial={{ y: "110%" }}
                animate={{ y: 0 }}
                transition={{ duration: 1.5, ease: EASE, delay: 0.75 }}
              >
                Collective.
              </motion.span>
            </span>
          </h1>
        </div>


        {/* Bottom bar — flex row anchored to bottom of hero */}
        <div
          className="absolute left-0 right-0 z-10 flex items-end justify-between"
          style={{ bottom: "2.5rem", paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
        >
          {/* Scroll hint — left */}
          <div className="flex items-end gap-2">
            <div className="flex flex-col items-center gap-[3px]">
              {[18, 11, 6, 3].map((h, i) => (
                <motion.div
                  key={i}
                  className="w-px rounded-full bg-[#818cf8]"
                  initial={{ scaleY: 0, opacity: 0 }}
                  animate={{ scaleY: 1, opacity: 0.25 - i * 0.04 }}
                  transition={{ delay: 2.0 + i * 0.08, duration: 0.4 }}
                  style={{ height: h, originY: 0 }}
                />
              ))}
            </div>
            <motion.span
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 2.4, duration: 0.9 }}
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "0.38rem",
                letterSpacing: "0.28em",
                textTransform: "uppercase",
                color: "rgba(129, 140, 248, 0.3)",
                fontFamily: "monospace",
              }}
            >
              Scroll
            </motion.span>
          </div>

          {/* Sub-copy + CTA — right */}
          <div className="flex flex-col items-end gap-4 text-right" style={{ maxWidth: "18rem" }}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 1.4 }}
              className="font-light leading-relaxed"
              style={{ fontSize: "0.85rem", color: "rgba(168, 179, 207, 0.6)" }}
            >
              Connecting ambitious students with verified professors for structured academic guidance.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.0, ease: EASE, delay: 1.7 }}
            >
              <Link
                href="/signup"
                className="group relative px-6 py-2.5 rounded-full font-bold uppercase overflow-hidden transition-colors duration-700 inline-flex items-center gap-2"
                style={{ background: "#818cf8", color: "#09090b", border: "1px solid #818cf8", fontSize: "0.6rem", letterSpacing: "0.2em" }}
              >
                <span className="absolute inset-0 bg-[#111113] translate-x-[-102%] group-hover:translate-x-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
                <span className="relative">Begin Journey</span>
                <span className="relative transition-transform duration-500 group-hover:translate-x-1">→</span>
              </Link>
            </motion.div>
          </div>
        </div>

      </section>


      {/* ══ PHILOSOPHY ══════════════════════════════════════════════════ */}
      <section
        className="js-fade relative min-h-screen flex items-center overflow-hidden"
        style={{ padding: "8rem 5rem 7rem 5rem" }}
      >
        {/* Ghost watermark — far right, clamped so it never bleeds into text */}
        <div
          className="absolute pointer-events-none select-none"
          aria-hidden
          style={{
            right: "-2vw",
            top: "50%",
            transform: "translateY(-50%)",
            fontSize: "clamp(12rem, 28vw, 36rem)",
            lineHeight: 0.85,
            color: "rgba(129, 140, 248, 0.03)",
            letterSpacing: "-0.06em",
            fontFamily: "var(--font-display)",
            fontWeight: 900,
          }}
        >
          S
        </div>

        <div className="relative z-10 max-w-3xl">
          <FadeIn delay={0}>
            <Label>Our Philosophy</Label>
          </FadeIn>

          <SplitReveal
            as="h2"
            delay={0.1}
            className="font-display font-bold tracking-tighter text-[#fafaf9] mb-10"
            style={{ fontSize: "clamp(2rem, 4.5vw, 5rem)", lineHeight: 0.94 }}
          >
            Academic research shouldn't be locked behind opaque institutional barriers.
          </SplitReveal>

          <FadeIn delay={0.3}>
            <p
              className="font-light leading-relaxed mb-20"
              style={{
                fontSize: "clamp(1rem, 1.4vw, 1.2rem)",
                color: "rgba(129, 140, 248, 0.7)",
                borderLeft: "2px solid rgba(129, 140, 248, 0.3)",
                paddingLeft: "1.5rem",
                maxWidth: "36rem",
              }}
            >
              Schollective replaces cold&#8209;emailing anxiety with a transparent,
              role&#8209;verified platform. Students and professors connect over shared
              academic interests — no spam, no guesswork, just structured intellectual growth.
            </p>
          </FadeIn>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-10" style={{ maxWidth: "32rem" }}>
            {[
              { num: "100%", label: "Free for students" },
              { num: "48h", label: "Avg. response time" },
              { num: "0", label: "Cold emails sent" },
            ].map((s, i) => (
              <FadeIn key={i} delay={0.5 + i * 0.1}>
                <div className="flex flex-col gap-3">
                  <span
                    className="font-display font-black text-[#fafaf9] tracking-tighter"
                    style={{ fontSize: "clamp(2rem, 4vw, 3.5rem)", lineHeight: 1 }}
                  >
                    {s.num}
                  </span>
                  <span
                    className="font-mono uppercase"
                    style={{ fontSize: "0.52rem", letterSpacing: "0.38em", color: "rgba(129, 140, 248, 0.4)" }}
                  >
                    {s.label}
                  </span>
                </div>
              </FadeIn>
            ))}
          </div>
        </div>
      </section>

      {/* ══ MARQUEE TICKER ══════════════════════════════════════════════ */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          borderTop: "1px solid rgba(129, 140, 248, 0.08)",
          borderBottom: "1px solid rgba(129, 140, 248, 0.08)",
          padding: "0.9rem 0",
        }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "marquee 32s linear infinite" }}
        >
          {Array.from({ length: 8 }).map((_, i) => (
            <span
              key={i}
              className="flex-shrink-0 font-mono uppercase px-14"
              style={{ fontSize: "0.46rem", letterSpacing: "0.48em", color: "rgba(129, 140, 248, 0.4)" }}
            >
              Academic Mentorship &nbsp;—&nbsp; No Cold Emails &nbsp;—&nbsp; Structured Growth &nbsp;—&nbsp; Verified Professors &nbsp;—&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ THE PROCESS — GSAP HORIZONTAL PIN ══════════════════════════ */}
      <div ref={stepsPinRef}>
        <div className="relative h-screen flex items-stretch">

          {/* "THE PROCESS" — vertical left edge */}
          <div className="absolute left-6 inset-y-0 flex items-center z-20 pointer-events-none">
            <span
              className="font-mono uppercase"
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "0.42rem",
                letterSpacing: "0.44em",
                color: "rgba(129, 140, 248, 0.35)",
              }}
            >
              The Process
            </span>
          </div>

          {/* "01 — 04" indicator — bottom center, below the nav z-index */}
          <div
            className="absolute left-1/2 z-10 flex items-center gap-3"
            style={{ bottom: "2rem", transform: "translateX(-50%)" }}
          >
            <span className="block w-3 h-px" style={{ background: "rgba(129, 140, 248, 0.25)" }} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: "0.38rem", letterSpacing: "0.45em", color: "rgba(129, 140, 248, 0.35)" }}
            >
              01 — 04
            </span>
          </div>

          {/* Scrolling track */}
          <div
            ref={stepsTrackRef}
            className="flex items-center will-change-transform"
            style={{ width: `${STEPS.length * 100}vw`, paddingLeft: "8vw", paddingRight: "6vw" }}
          >
            {STEPS.map((step, i) => (
              <div
                key={step.num}
                className="flex-shrink-0 w-screen h-screen flex items-center"
                style={{ paddingLeft: "8vw", paddingRight: "8vw" }}
              >
                <div className="grid md:grid-cols-2 gap-16 items-center max-w-6xl w-full">

                  {/* Text col */}
                  <div className="flex flex-col">
                    {/* Ghost number behind title */}
                    <div
                      className="font-mono font-bold leading-none select-none"
                      style={{
                        fontSize: "clamp(5rem, 12vw, 13rem)",
                        color: "rgba(129, 140, 248, 0.06)",
                        letterSpacing: "-0.04em",
                        marginBottom: "-0.35em",
                        pointerEvents: "none",
                      }}
                    >
                      {step.num}
                    </div>
                    <h3
                      className="font-display font-bold tracking-tighter text-[#fafaf9] leading-none mb-5"
                      style={{ fontSize: "clamp(2.5rem, 5.5vw, 5.5rem)" }}
                    >
                      {step.title}
                    </h3>
                    <span className="block w-7 h-px mb-7" style={{ background: "rgba(129, 140, 248, 0.25)" }} />
                    <p
                      className="font-light leading-relaxed"
                      style={{
                        fontSize: "clamp(0.95rem, 1.2vw, 1.1rem)",
                        color: "rgba(168, 179, 207, 0.65)",
                        maxWidth: "28rem",
                      }}
                    >
                      {step.body}
                    </p>
                  </div>

                  {/* Orb col */}
                  <div className="relative w-full aspect-square max-w-xs mx-auto">
                    <FloatingOrb index={i} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ══ INFRASTRUCTURE ══════════════════════════════════════════════ */}
      <section
        className="js-fade relative overflow-hidden"
        style={{ padding: "7rem 5rem" }}
      >
        <FadeIn>
          <Label>Infrastructure</Label>
        </FadeIn>

        <SplitReveal
          as="h2"
          className="font-display font-black tracking-tighter text-[#fafaf9] mb-20"
          style={{ fontSize: "clamp(3rem, 8.5vw, 10rem)", lineHeight: 0.82 }}
        >
          Total Control.
        </SplitReveal>

        <div style={{ maxWidth: "56rem" }}>
          {[
            {
              num: "01",
              title: "Role‑Locked Security",
              body: "Roles are permanently assigned. Professors undergo manual administrative review to guarantee authenticity.",
            },
            {
              num: "02",
              title: "Structured Threads",
              body: "Every conversation is tied to a specific mentorship request, keeping discussions focused and actionable.",
            },
            {
              num: "03",
              title: "Institutional Verification",
              body: "We cross‑reference global university databases to ensure the authenticity of our academic network.",
            },
            {
              num: "04",
              title: "Unified Dashboard",
              body: "Track open requests, manage threads, and review approvals from a single, beautiful interface.",
            },
          ].map((item, i) => (
            <FadeIn key={i} delay={i * 0.08}>
              <div
                className="group grid items-start py-9 transition-all duration-500 hover:pl-2 cursor-default"
                style={{
                  borderTop: "1px solid rgba(129, 140, 248, 0.1)",
                  gridTemplateColumns: "3rem 1fr auto",
                  gap: "2rem",
                }}
              >
                <span
                  className="font-mono pt-1 transition-colors duration-500 group-hover:text-[#818cf8]"
                  style={{ fontSize: "0.52rem", letterSpacing: "0.18em", color: "rgba(82, 82, 91, 0.55)" }}
                >
                  {item.num}
                </span>
                <div className="flex flex-col gap-3">
                  <h3
                    className="font-display font-bold tracking-tight text-[#fafaf9] transition-transform duration-500 group-hover:translate-x-1"
                    style={{ fontSize: "clamp(1.4rem, 2.5vw, 2.2rem)", lineHeight: 1.05 }}
                  >
                    {item.title}
                  </h3>
                  <p
                    className="font-light leading-relaxed"
                    style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.6)", maxWidth: "36rem" }}
                  >
                    {item.body}
                  </p>
                </div>
                <span
                  className="text-sm pt-1 transition-all duration-500 translate-x-2 opacity-0 group-hover:translate-x-0 group-hover:opacity-60"
                  style={{ color: "rgba(129, 140, 248, 0.8)" }}
                >
                  →
                </span>
              </div>
            </FadeIn>
          ))}
          <div style={{ borderTop: "1px solid rgba(129, 140, 248, 0.07)" }} />
        </div>
      </section>

      {/* ══ FINAL CTA ═══════════════════════════════════════════════════
          Layout: fixed-height section. No mix-blend on copyright to avoid
          collision with the nav buttons.
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="js-fade relative overflow-hidden"
        style={{ minHeight: "100vh", padding: "5rem 5rem 4rem 5rem", display: "flex", flexDirection: "column" }}
      >
        {/* Top row: label left, copyright right — copyright uses regular z, NOT mix-blend */}
        <div className="flex items-start justify-between mb-auto">
          <FadeIn>
            <Label>Ready?</Label>
          </FadeIn>
          <FadeIn delay={0.1}>
            <span
              className="font-mono uppercase"
              style={{ fontSize: "0.48rem", letterSpacing: "0.38em", color: "rgba(82, 82, 91, 0.45)", marginTop: "0.1rem" }}
            >
              Schollective, Inc. © 2026
            </span>
          </FadeIn>
        </div>

        {/* Giant headline — expands to fill remaining vertical space */}
        <div className="flex-1 flex items-center py-8">
          <SplitReveal
            as="h2"
            className="font-display font-black tracking-tighter text-[#fafaf9]"
            style={{ fontSize: "clamp(5rem, 17vw, 20rem)", lineHeight: 0.82 }}
          >
            Start Here.
          </SplitReveal>
        </div>

        {/* Bottom row: sub-copy left, CTA button right */}
        <div className="flex items-end justify-between pt-8" style={{ borderTop: "1px solid rgba(129, 140, 248, 0.1)" }}>
          <FadeIn delay={0.3}>
            <p
              className="font-light leading-relaxed"
              style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.6)", maxWidth: "24rem" }}
            >
              Join thousands of students already connecting with verified academic mentors — at no cost.
            </p>
          </FadeIn>
          <FadeIn delay={0.5}>
            <Link
              href="/signup"
              className="group relative rounded-full border font-bold uppercase overflow-hidden transition-colors duration-700 inline-flex items-center gap-3"
              style={{
                padding: "1rem 2.5rem",
                fontSize: "0.6rem",
                letterSpacing: "0.15em",
                borderColor: "rgba(129, 140, 248, 0.5)",
                color: "#818cf8",
              }}
            >
              <span className="absolute inset-0 bg-[#818cf8] translate-y-[102%] group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)]" />
              <span className="relative group-hover:text-[#09090b] transition-colors duration-700">Create Account</span>
              <span className="relative transition-transform duration-500 group-hover:translate-x-1 group-hover:text-[#09090b]">→</span>
            </Link>
          </FadeIn>
        </div>
      </section>


      {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
      <footer
        style={{
          background: "var(--bg-surface-1)",
          borderTop: "1px solid rgba(129, 140, 248, 0.1)",
        }}
      >
        {/* Main footer grid */}
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "4.5rem 2.5rem 3rem",
            display: "grid",
            gridTemplateColumns: "2fr 1fr 1.5fr",
            gap: "3rem",
          }}
          className="footer-grid"
        >
          {/* ── Col 1: Brand ──────────────────────────────────────────── */}
          <FadeIn delay={0}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
              {/* Logo mark + wordmark */}
              <div style={{ display: "flex", alignItems: "center", gap: "0.85rem" }}>
                <div
                  style={{
                    width: "40px",
                    height: "40px",
                    borderRadius: "10px",
                    background: "linear-gradient(135deg, #6366f1 0%, #818cf8 100%)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                    boxShadow: "0 4px 16px rgba(99, 102, 241, 0.35)",
                  }}
                >
                  {/* Stylised "S" lettermark */}
                  <svg width="22" height="22" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                    <path
                      d="M17 8C17 5.79 14.76 4 12 4C9.24 4 7 5.79 7 8C7 10.21 9.24 12 12 12C14.76 12 17 13.79 17 16C17 18.21 14.76 20 12 20C9.24 20 7 18.21 7 16"
                      stroke="#fafaf9"
                      strokeWidth="2"
                      strokeLinecap="round"
                    />
                  </svg>
                </div>
                <span
                  className="font-display font-bold"
                  style={{ fontSize: "1.15rem", letterSpacing: "-0.02em", color: "#fafaf9" }}
                >
                  Schollective
                </span>
              </div>

              {/* Tagline */}
              <p
                className="font-light leading-relaxed"
                style={{ fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.65)", maxWidth: "22rem" }}
              >
                Connecting ambitious students with verified professors for structured, transparent academic mentorship.
                Every question deserves a real answer.
              </p>
            </div>
          </FadeIn>

          {/* ── Col 2: Quick Links ────────────────────────────────────── */}
          <FadeIn delay={0.1}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <span
                className="font-mono uppercase"
                style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(129, 140, 248, 0.6)" }}
              >
                Quick Links
              </span>
              <nav style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                {[
                  { label: "Home",           href: "/" },
                  { label: "About",          href: "/about" },
                  { label: "For Students",   href: "/for-students" },
                  { label: "For Professors", href: "/for-professors" },
                  { label: "Sign Up",        href: "/signup" },
                  { label: "Log In",         href: "/login" },
                ].map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className="link-underline"
                    style={{
                      fontSize: "0.88rem",
                      color: "rgba(168, 179, 207, 0.7)",
                      transition: "color 0.2s ease",
                      display: "inline-block",
                    }}
                    onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#818cf8")}
                    onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(168, 179, 207, 0.7)")}
                  >
                    {link.label}
                  </Link>
                ))}
              </nav>
            </div>
          </FadeIn>

          {/* ── Col 3: Contact ────────────────────────────────────────── */}
          <FadeIn delay={0.2}>
            <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
              <span
                className="font-mono uppercase"
                style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(129, 140, 248, 0.6)" }}
              >
                Contact Us
              </span>
              <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                {/* Email */}
                <a
                  href="mailto:schollective.corp@gmail.com"
                  style={{ display: "flex", alignItems: "center", gap: "0.75rem", textDecoration: "none" }}
                >
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(129, 140, 248, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="22,6 12,13 2,6"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.83rem", color: "rgba(168, 179, 207, 0.7)" }}>
                    schollective.corp@gmail.com
                  </span>
                </a>

                {/* Institution */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(129, 140, 248, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <path
                        d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                      <polyline
                        points="9,22 9,12 15,12 15,22"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.83rem", color: "rgba(168, 179, 207, 0.7)" }}>
                    Serving schools worldwide
                  </span>
                </div>

                {/* Availability */}
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <div
                    style={{
                      width: "32px",
                      height: "32px",
                      borderRadius: "8px",
                      background: "rgba(99, 102, 241, 0.12)",
                      border: "1px solid rgba(129, 140, 248, 0.15)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                      <circle cx="12" cy="12" r="10" stroke="#818cf8" strokeWidth="1.5" />
                      <polyline
                        points="12,6 12,12 16,14"
                        stroke="#818cf8"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </svg>
                  </div>
                  <span style={{ fontSize: "0.83rem", color: "rgba(168, 179, 207, 0.7)" }}>
                    Free to use — always
                  </span>
                </div>
              </div>
            </div>
          </FadeIn>
        </div>

        {/* Hairline divider */}
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            height: "1px",
            background: "rgba(129, 140, 248, 0.09)",
            marginLeft: "2.5rem",
            marginRight: "2.5rem",
          }}
        />

        {/* Bottom bar */}
        <div
          style={{
            maxWidth: "80rem",
            margin: "0 auto",
            padding: "1.5rem 2.5rem",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "0.75rem",
          }}
        >
          <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
            <span
              className="font-mono"
              style={{ fontSize: "0.72rem", color: "rgba(82, 82, 91, 0.7)", letterSpacing: "0.02em" }}
            >
              © 2026 Schollective, Inc. All rights reserved.
            </span>
            <span
              className="font-mono"
              style={{ fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.5)", letterSpacing: "0.02em" }}
            >
              Not a substitute for official academic advising.
            </span>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
            <span
              className="font-mono"
              style={{ fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.55)", letterSpacing: "0.04em" }}
            >
              Built with
            </span>
            <svg
              width="12"
              height="12"
              viewBox="0 0 24 24"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              style={{ opacity: 0.55 }}
            >
              <path
                d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z"
                stroke="rgba(129, 140, 248, 0.7)"
                strokeWidth="1.5"
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            <span
              className="font-mono"
              style={{ fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.55)", letterSpacing: "0.04em" }}
            >
              for students seeking knowledge
            </span>
          </div>
        </div>
      </footer>

    </div>
  );
}
