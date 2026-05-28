"use client";

import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { motion, useInView, AnimatePresence } from "framer-motion";
import gsap from "gsap";
import ScrollTrigger from "gsap/dist/ScrollTrigger";
import dynamic from "next/dynamic";
import { PublicNav } from "@/components/ui/PublicNav";

const ThreeBackground = dynamic(
  () => import("@/components/ui/ThreeBackground").then(m => m.ThreeBackground),
  { ssr: false }
);

if (typeof window !== "undefined") {
  gsap.registerPlugin(ScrollTrigger);
}

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
          style={{
            position: "fixed", inset: 0, zIndex: 99999,
            background: "var(--bg-base)",
            display: "flex", flexDirection: "column",
            alignItems: "center", justifyContent: "center",
            gap: "1.5rem",
          }}
        >
          <div style={{ width: "5rem", height: "5rem", perspective: "20rem", position: "relative" }}>
            <motion.div
              animate={{ rotateY: [0, 90, 90, 180, 180, 270, 270, 360], rotateX: [0, 0, 0, 0, -90, -90, 0, 0] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 0 }}
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
                  <div key={i} style={{
                    position: "absolute", width: "100%", height: "100%",
                    display: "flex", alignItems: "center", justifyContent: "center",
                    background: i % 2 === 0 ? "#818cf8" : "rgba(37, 99, 235,0.15)",
                    border: "1px solid rgba(37, 99, 235,0.3)",
                    fontSize: "1.8rem", fontWeight: 900, color: "var(--text-primary)",
                    transform: `rotate${Object.keys(faces)[0].replace("rotate", "") as string}(${Object.values(faces)[0]}) translateZ(${Object.values(faces)[1]})`,
                    backfaceVisibility: "hidden",
                  }}>
                    {ch}
                  </div>
                );
              })}
            </motion.div>
          </div>

          <div style={{ textAlign: "center" }}>
            <p style={{ fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(37, 99, 235,0.5)", margin: 0 }}>
              Schollective
            </p>
            <p style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(15, 23, 42,0.4)", margin: "0.3rem 0 0" }}>
              Academic Mentorship Platform
            </p>
          </div>

          <motion.div style={{ width: "8rem", height: "1px", background: "rgba(82,82,91,0.2)", position: "relative", overflow: "hidden" }}>
            <motion.div
              initial={{ scaleX: 0, originX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 1.1, ease: [0.19, 1, 0.22, 1] }}
              style={{ position: "absolute", inset: 0, background: "#818cf8" }}
            />
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];

/* ── CTAButton ─────────────────────────────────────────────────────────── */
interface CTAButtonProps {
  href: string;
  label: string;
  variant?: "default" | "indigo";
  className?: string;
  onClick?: () => void;
}

function CTAButton({ href, label, variant = "default", className = "", onClick }: CTAButtonProps) {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const borderRef = useRef<HTMLSpanElement>(null);
  const chars = label.split("");
  const isIndigo = variant === "indigo";

  useEffect(() => {
    const el = wrapRef.current;
    const dot = borderRef.current;
    if (!el || !dot) return;

    const enter = () => {
      const { width, height } = el.getBoundingClientRect();
      dot.style.width = `${width + 2}px`;
      dot.style.height = `${height + 2}px`;
      dot.style.borderRadius = "100px";
      dot.style.borderColor = isIndigo ? "rgba(37, 99, 235,0.85)" : "rgba(255,255,255,0.85)";
    };
    const leave = () => {
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.borderColor = "rgba(255,255,255,0)";
    };

    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, [isIndigo]);

  return (
    <Link
      ref={wrapRef}
      href={href}
      onClick={onClick}
      data-cursor-hide="true"
      className={`group relative inline-flex items-center justify-center rounded-full ${className}`}
      style={{
        textDecoration: "none",
        padding: isIndigo ? "1.1rem 2.5rem" : "0.8rem 2rem",
        color: isIndigo ? "#818cf8" : "#fafaf9",
        border: isIndigo
          ? "1px solid rgba(37, 99, 235,0.5)"
          : "1px solid rgba(15, 23, 42,0.3)",
        overflow: "visible",
        position: "relative",
        lineHeight: 1,
        background: "transparent",
      }}
    >
      <span
        ref={borderRef}
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0)",
          transition:
            "width 520ms cubic-bezier(0.19,1,0.22,1), " +
            "height 520ms cubic-bezier(0.19,1,0.22,1), " +
            "border-radius 520ms cubic-bezier(0.19,1,0.22,1), " +
            "border-color 200ms ease",
          zIndex: 2,
        }}
      />

      {isIndigo && (
        <span
          className="absolute inset-0 rounded-full translate-y-[102%] group-hover:translate-y-0 transition-transform duration-700 ease-[cubic-bezier(0.22,1,0.36,1)] pointer-events-none"
          style={{ background: "#818cf8", zIndex: 0 }}
        />
      )}

      <span
        style={{
          position: "relative",
          display: "flex",
          clipPath: "inset(0 -0.15em 0 0)",
          height: "1em",
          alignItems: "center",
          zIndex: 3,
        }}
      >
        <span
          className="flex transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full"
          style={{ position: "absolute", inset: 0, alignItems: "center", display: "flex" }}
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              style={{
                fontSize: isIndigo ? "0.6rem" : "0.65rem",
                fontWeight: 600,
                letterSpacing: isIndigo ? "0.15em" : "0.05em",
                textTransform: "uppercase",
                color: isIndigo ? "#818cf8" : "#fafaf9",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>

        <span
          className="flex translate-y-full group-hover:translate-y-0 transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
          style={{ position: "absolute", inset: 0, alignItems: "center", display: "flex" }}
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: isIndigo ? "0.72rem" : "0.8rem",
                letterSpacing: isIndigo ? "0.12em" : "0.01em",
                color: isIndigo ? "var(--bg-base)" : "#fafaf9",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>

        <span
          aria-hidden
          style={{
            visibility: "hidden",
            fontSize: isIndigo ? "0.6rem" : "0.65rem",
            fontWeight: 600,
            letterSpacing: isIndigo ? "0.15em" : "0.05em",
            textTransform: "uppercase",
          }}
        >
          {label}
        </span>
      </span>

      <span
        className="ml-2 transition-transform duration-500 group-hover:translate-x-1"
        style={{
          position: "relative",
          zIndex: 3,
          fontSize: "0.75rem",
          color: isIndigo ? "#818cf8" : "#fafaf9",
        }}
      >
        →
      </span>
    </Link>
  );
}

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
    <div className="flex items-center gap-3 mb-6">
      <span className="block w-5 h-px flex-shrink-0" style={{ background: "rgba(37, 99, 235, 0.35)" }} />
      <span className="font-sans uppercase text-blue-600" style={{ fontSize: "0.55rem", letterSpacing: "0.2em" }}>
        {children}
      </span>
    </div>
  );
}

/* ── CreateAccountButton ────────────────────────────────────────────────── */
function CreateAccountButton() {
  const wrapRef = useRef<HTMLAnchorElement>(null);
  const borderRef = useRef<HTMLSpanElement>(null);

  useEffect(() => {
    const el = wrapRef.current;
    const dot = borderRef.current;
    if (!el || !dot) return;

    const enter = () => {
      const { width, height } = el.getBoundingClientRect();
      dot.style.width = `${width + 2}px`;
      dot.style.height = `${height + 2}px`;
      dot.style.borderRadius = "100px";
      dot.style.borderColor = "rgba(255,255,255,0.85)";
    };
    const leave = () => {
      dot.style.width = "10px";
      dot.style.height = "10px";
      dot.style.borderRadius = "50%";
      dot.style.borderColor = "rgba(255,255,255,0)";
    };

    el.addEventListener("mouseenter", enter);
    el.addEventListener("mouseleave", leave);
    return () => {
      el.removeEventListener("mouseenter", enter);
      el.removeEventListener("mouseleave", leave);
    };
  }, []);

  const label = "Create Account";
  const chars = label.split("");

  return (
    <Link
      ref={wrapRef}
      href="/signup"
      data-cursor-hide="true"
      className="group relative inline-flex items-center justify-center rounded-full"
      style={{
        textDecoration: "none",
        padding: "1.1rem 2.5rem",
        color: "var(--text-primary)",
        border: "1px solid rgba(15, 23, 42, 0.12)",
        overflow: "visible",
        position: "relative",
      }}
    >
      <span
        ref={borderRef}
        aria-hidden
        style={{
          pointerEvents: "none",
          position: "absolute",
          top: "50%",
          left: "50%",
          transform: "translate(-50%, -50%)",
          width: "10px",
          height: "10px",
          borderRadius: "50%",
          border: "1.5px solid rgba(255,255,255,0)",
          transition:
            "width 520ms cubic-bezier(0.19,1,0.22,1), " +
            "height 520ms cubic-bezier(0.19,1,0.22,1), " +
            "border-radius 520ms cubic-bezier(0.19,1,0.22,1), " +
            "border-color 200ms ease",
          zIndex: 2,
        }}
      />

      <span
        style={{
          position: "relative",
          display: "flex",
          clipPath: "inset(0 -0.15em 0 0)",
          height: "1em",
          alignItems: "center",
          zIndex: 3,
        }}
      >
        <span
          className="flex transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)] group-hover:-translate-y-full"
          style={{ position: "absolute", inset: 0, alignItems: "center", display: "flex" }}
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              style={{
                fontSize: "0.65rem",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase" as const,
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>

        <span
          className="flex translate-y-full group-hover:translate-y-0 transition-transform duration-[430ms] ease-[cubic-bezier(0.19,1,0.22,1)]"
          style={{ position: "absolute", inset: 0, alignItems: "center", display: "flex" }}
        >
          {chars.map((ch, i) => (
            <span
              key={i}
              style={{
                fontFamily: "var(--font-display)",
                fontStyle: "italic",
                fontWeight: 400,
                fontSize: "0.8rem",
                letterSpacing: "0.01em",
                color: "var(--text-primary)",
              }}
            >
              {ch === " " ? "\u00A0" : ch}
            </span>
          ))}
        </span>

        <span aria-hidden style={{ visibility: "hidden", fontSize: "0.65rem", fontWeight: 600, letterSpacing: "0.05em", textTransform: "uppercase" as const }}>
          {label}
        </span>
      </span>

      <span
        className="ml-2 transition-transform duration-500 group-hover:translate-x-1"
        style={{ position: "relative", zIndex: 3, fontSize: "0.75rem" }}
      >
        →
      </span>
    </Link>
  );
}

/* ── LandingPage ────────────────────────────────────────────────────────── */
export default function LandingPage() {
  const router = useRouter();
  const pageRef = useRef<HTMLDivElement>(null);
  const [loaderDone, setLoaderDone] = useState(false);

  // Search state
  const [interest, setInterest] = useState("");
  const [university, setUniversity] = useState("");

  useEffect(() => {
    const t = setTimeout(() => setLoaderDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        gsap.utils.toArray<HTMLElement>(".js-fade").forEach((el) => {
          gsap.fromTo(el, { opacity: 0, y: 40 }, {
            opacity: 1, y: 0, duration: 0.9, ease: "power3.out",
            scrollTrigger: { trigger: el, start: "top 90%", toggleActions: "play none none none" },
          });
        });
      }, pageRef);
      return () => ctx.revert();
    }, 120);
    return () => clearTimeout(timer);
  }, []);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (!interest && !university) return;
    router.push(`/signup?interest=${encodeURIComponent(interest)}&university=${encodeURIComponent(university)}`);
  };

  return (
    <>
      <PageLoader done={loaderDone} />

      <style dangerouslySetInnerHTML={{ __html: `
        .lp-quotes-track {
          display: flex;
          width: max-content;
          animation: marquee 35s linear infinite;
        }
        .lp-quotes-group {
          display: flex;
          gap: 1.5rem;
          padding-right: 1.5rem;
        }
      `}} />

      <div
        ref={pageRef}
        className="relative text-slate-900 font-sans overflow-x-hidden"
        style={{ background: "var(--bg-base)", opacity: loaderDone ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <PublicNav />

        {/* ══ HERO SECTION ═══════════════════════════════════════════════ */}
        <section className="relative min-h-screen overflow-hidden flex flex-col justify-center" style={{ background: "var(--bg-base)" }}>
          <div className="absolute inset-0 z-0">
            <ThreeBackground />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 100% 75% at 50% 40%, transparent 0%, rgba(255, 255, 255,0.6) 70%, rgba(255, 255, 255,0.98) 100%)" }} />
            <div className="absolute inset-0 pointer-events-none"
              style={{
                backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
                backgroundSize: "200px 200px", opacity: 0.6, mixBlendMode: "overlay",
              }} />
          </div>

          {/* Active status indicator */}
          <motion.div className="absolute z-10" style={{ top: "6.5rem", right: "2.5rem" }}
            initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 1.2, ease: EASE, delay: 1.0 }}>
            <div className="flex items-center gap-2">
              <span className="relative flex h-[6px] w-[6px]">
                <span className="absolute inline-flex h-full w-full rounded-full bg-blue-600 opacity-75"
                  style={{ animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-blue-600" />
              </span>
              <span className="font-sans uppercase" style={{ fontSize: "0.46rem", letterSpacing: "0.2em", color: "rgba(37, 99, 235,0.5)" }}>
                Platform Active
              </span>
            </div>
          </motion.div>

          <div className="relative z-10 w-full max-w-[80rem] mx-auto px-6 md:px-12 lg:px-16 pt-24 pb-16 flex flex-col items-start">
            {/* Eyebrow */}
            <motion.div
              initial={{ opacity: 0, x: -12 }} animate={{ opacity: 1, x: 0 }}
              transition={{ duration: 1.3, ease: EASE, delay: 0.8 }}
              className="flex items-center gap-2 mb-8"
            >
              <span className="w-1.5 h-1.5 rounded-full bg-blue-600" />
              <span className="font-sans uppercase tracking-wider text-xs text-slate-900/60">
                Used by 1,000+ students at Stanford, MIT, and beyond.
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display font-black text-slate-900 mb-6 select-none"
              style={{ fontSize: "clamp(2.5rem, 6.5vw, 6.2rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Find the mentor<br />
              <span className="italic font-light text-slate-900/40">who changes your </span>
              <em className="italic font-normal text-blue-600">life.</em>
            </h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 1.1 }}
              className="font-light leading-relaxed text-slate-600 mb-12 text-lg max-w-xl"
            >
              Cold emails to professors go unanswered. Connect through verified, in-platform academic request threads for structured research mentorship.
            </motion.p>

            {/* Search Bar Block */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1.3 }}
              className="w-full max-w-3xl flex flex-col md:flex-row items-stretch p-2.5 rounded-[24px] border border-slate-200 gap-2 md:gap-0"
              style={{
                background: "rgba(255, 255, 255, 0.55)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(15, 23, 42, 0.05)",
              }}
            >
              <div className="flex-1 flex flex-col justify-center px-6 py-3 text-left">
                <label className="font-sans uppercase text-[0.52rem] tracking-wider text-slate-600/60 mb-1">
                  Research Interest
                </label>
                <input
                  type="text"
                  placeholder="e.g. machine learning"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="bg-transparent border-none outline-none font-sans text-sm text-slate-900 placeholder-[#fafaf9]/25 w-full"
                />
              </div>

              <div className="hidden md:block w-px bg-slate-100 my-3" />

              <div className="flex-1 flex flex-col justify-center px-6 py-3 text-left">
                <label className="font-sans uppercase text-[0.52rem] tracking-wider text-slate-600/60 mb-1">
                  University
                </label>
                <input
                  type="text"
                  placeholder="e.g. MIT, Stanford..."
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="bg-transparent border-none outline-none font-sans text-sm text-slate-900 placeholder-[#fafaf9]/25 w-full"
                />
              </div>

              <button
                type="submit"
                className="group relative flex items-center justify-center rounded-full bg-blue-600 text-[var(--bg-base)] font-bold text-xs uppercase tracking-wider px-8 py-4 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                style={{ fontFamily: "var(--font-sans)", border: "none" }}
              >
                <span>Search collective</span>
              </button>
            </motion.form>
          </div>

          {/* Scroll cue */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 flex flex-col items-center gap-1.5 opacity-40 animate-pulse">
            <svg width="24" height="24" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M6 9l6 6 6-6" stroke="#818cf8" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
          </div>
        </section>

        {/* ══ THE TRUTH ABOUT COLD EMAILS (DARK CALLOUT) ══════════════════ */}
        <section className="js-fade relative py-28 border-t border-slate-200" style={{ background: "var(--bg-surface-2)" }}>
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
            <Label>The truth about academic cold-outreach</Label>
            
            <h2 className="font-display font-bold text-slate-900 mt-6 mb-12 select-none tracking-tight leading-[1.12]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)" }}>
              Professors delete 90% of student outreach emails<br />
              <span className="italic font-light text-slate-900/35">before finishing the first line.</span>
            </h2>

            <div className="flex flex-col gap-7 text-left max-w-xl w-full mb-12">
              {[
                "Professors ignore generic, template-driven outreach.",
                "Traditional cold emails lack structured academic context.",
                "Unverified databases lead to wrong contacts and lost time."
              ].map((reason, i) => (
                <div key={i} className="flex items-start gap-8 p-8 rounded-xl border border-slate-200 bg-slate-50">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold font-sans">
                    ✕
                  </span>
                  <span className="text-slate-600 text-sm leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>

            <CTAButton href="/signup" label="Send requests that get answered" variant="indigo" />
          </div>
        </section>

        {/* ══ PROOF STRIP ════════════════════════════════════════════════ */}
        <div className="js-fade border-y border-slate-200 py-12 bg-white shadow-xl">
          <div className="max-w-[80rem] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-8 text-center">
            {[
              { num: "250M+", label: "papers indexed" },
              { num: "1,000+", label: "universities" },
              { num: "10,000+", label: "students served" },
              { num: "< 24h", label: "first response" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-display font-black text-3xl md:text-5xl text-slate-900 tracking-tight mb-2">
                  {stat.num}
                </span>
                <span className="font-sans text-[0.55rem] tracking-wider uppercase text-blue-600/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ VS TABLE SECTION (Traditional Databases vs Schollective) ══════════════════ */}
        <section className="js-fade py-28 relative">
          <div className="max-w-[64rem] mx-auto px-6">
            <div className="text-center mb-16">
              <Label>Comparing Platforms</Label>
              <h2 className="font-display font-bold text-3xl md:text-5xl text-slate-900 mt-4 tracking-tight">
                Why not just use traditional databases?
              </h2>
            </div>

            <div className="glass-refraction" style={{ padding: "40px" }}>
              <div className="grid grid-cols-2 border-b border-slate-200 pb-6 mb-6">
                <div className="pr-6">
                  <span className="font-sans text-[0.68rem] font-bold tracking-wider text-slate-900/30 uppercase">
                    Traditional Cold Databases
                  </span>
                </div>
                <div className="pl-6 border-l border-slate-200">
                  <span className="font-sans text-[0.68rem] font-bold tracking-wider text-blue-600 uppercase">
                    Schollective
                  </span>
                </div>
              </div>

              {[
                {
                  bad: "Scrape lists that contain outdated emails and dead research links.",
                  good: "Every professor profile and institution is manually verified and active. 100% real."
                },
                {
                  bad: "Encourages spamming generic email templates that professors immediately ignore.",
                  good: "Requires structured in-platform request forms so you only send focused, high-context queries."
                },
                {
                  bad: "Lacks a secure, central system to manage threads and follow-ups.",
                  good: "Provides a unified, real-time messaging hub to track requests, acceptances, and discussions."
                }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2 py-6 border-b border-slate-200 last:border-none">
                  <div className="pr-6 flex gap-8 items-start">
                    <span className="text-red-500 font-bold font-sans text-xs pt-1 select-none">✕</span>
                    <p className="text-slate-600 text-sm leading-relaxed">{row.bad}</p>
                  </div>
                  <div className="pl-6 border-l border-slate-200 flex gap-8 items-start">
                    <span className="text-blue-600 font-bold font-sans text-xs pt-1 select-none">✓</span>
                    <p className="text-slate-900 text-sm leading-relaxed font-medium">{row.good}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* ══ FEATURES BLOCK (With Custom High-Fidelity UI Mockups) ═══════ */}
        <section className="py-28 flex flex-col gap-32">
          <div className="max-w-[80rem] mx-auto px-6 w-full">
            <Label>The Platform</Label>
          </div>

          {/* Feature 01 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-start">
              <span className="font-sans text-2xl text-blue-600/45 mb-4">01</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mb-6">
                Search any research interest.
              </h3>
              <p className="text-slate-600 leading-relaxed text-base mb-8 max-w-md">
                Type what you care about: quantum computing, cognitive neuroscience, or climate policy. We surface top professors publishing in that exact space, ranked by impact.
              </p>
              <Link href="/signup" className="font-sans text-xs uppercase tracking-wider text-blue-600 border-b border-blue-600/20 pb-1 hover:border-blue-600/80 transition-colors">
                Try a search →
              </Link>
            </div>

            {/* Visual Mockup 01 */}
            <div className="relative p-8 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-2xl flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="font-sans text-[0.55rem] text-slate-900/20">schollective.org/app</span>
              </div>

              {/* Mock Input */}
              <div className="flex gap-2 p-2 rounded-xl bg-slate-50 border border-slate-200 items-center">
                <span className="px-5 py-2.5 rounded-lg bg-blue-600/15 border border-blue-600/25 text-xs text-blue-600 font-medium">
                  neuroscience
                </span>
                <span className="px-5 py-2.5 rounded-lg bg-slate-50 text-xs text-slate-600/60">
                  Harvard
                </span>
              </div>

              {/* Mock Professor Cards */}
              {[
                { name: "Dr. Emily Nakamura", uni: "Harvard Medical School", tag1: "Memory", tag2: "fMRI" },
                { name: "Prof. James Miller", uni: "MIT Brain & Cognitive", tag1: "Neural Circuits", tag2: "AI" },
                { name: "Dr. Aisha Patel", uni: "Stanford Neuroscience", tag1: "BCI", tag2: "Computation" }
              ].map((prof, i) => (
                <div key={i} className="flex flex-col items-start p-8 rounded-xl border border-slate-200 bg-slate-50 hover:bg-slate-50 transition-colors">
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-display font-medium text-sm text-slate-900">{prof.name}</span>
                    <span className="font-sans text-[0.62rem] text-slate-600/45">{prof.uni}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-slate-50 text-[0.6rem] text-slate-600/60">{prof.tag1}</span>
                    <span className="px-2 py-0.5 rounded-md bg-blue-600/5 text-[0.6rem] text-blue-600/60 border border-blue-600/10">{prof.tag2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 02 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Visual Mockup 02 (Left side for desktop layout) */}
            <div className="order-2 lg:order-1 relative p-8 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-2xl flex flex-col gap-8">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="font-sans text-[0.55rem] text-slate-900/20">schollective.org/app</span>
              </div>

              {/* Research summary UI */}
              <div className="p-7 rounded-2xl border border-blue-600/15 bg-blue-600/[0.01]">
                <div className="flex items-center justify-between mb-3 border-b border-slate-200 pb-2">
                  <span className="font-display font-bold text-base text-slate-900">Dr. Emily Nakamura</span>
                  <span className="px-2 py-0.5 rounded bg-blue-600/10 text-[0.58rem] text-blue-600 font-sans">2024 PAPER</span>
                </div>
                <p className="text-slate-600 text-xs leading-relaxed mb-4">
                  Studies how memories form and consolidate during sleep using fMRI. Recent work shows neural oscillation patterns predict next-day recall accuracy in elderly patients with early cognitive decline.
                </p>
                <div className="p-3 rounded-lg bg-blue-600/5 border border-blue-600/10">
                  <span className="font-sans text-[0.52rem] uppercase text-blue-600 tracking-wider font-bold block mb-1">Key Finding</span>
                  <p className="text-slate-900 text-xs leading-relaxed">
                    Theta oscillations during REM sleep increased memory consolidation by 34%. Published 2024, first-author.
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex flex-col items-start">
              <span className="font-sans text-2xl text-blue-600/45 mb-4">02</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mb-6">
                Understand their research in plain English.
              </h3>
              <p className="text-slate-600 leading-relaxed text-base mb-8 max-w-md">
                Every professor profile has an AI-synthesized summary of their key findings, written so a high schooler or undergrad can understand it and reference it with precision. No more pretending to read 40-page papers.
              </p>
              <Link href="/signup" className="font-sans text-xs uppercase tracking-wider text-blue-600 border-b border-blue-600/20 pb-1 hover:border-blue-600/80 transition-colors">
                See an example →
              </Link>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-start">
              <span className="font-sans text-2xl text-blue-600/45 mb-4">03</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-slate-900 tracking-tight mb-6">
                Draft structured requests that get answered.
              </h3>
              <p className="text-slate-600 leading-relaxed text-base mb-8 max-w-md">
                Our structured request model, co-designed with research faculty, guides you through describing your understanding, interests, and availability. No more guessing what professors want to hear.
              </p>
              <Link href="/signup" className="font-sans text-xs uppercase tracking-wider text-blue-600 border-b border-blue-600/20 pb-1 hover:border-blue-600/80 transition-colors">
                Try request flow →
              </Link>
            </div>

            {/* Visual Mockup 03 */}
            <div className="relative p-8 rounded-3xl border border-slate-200 bg-white shadow-xl shadow-2xl flex flex-col gap-7">
              <div className="flex items-center justify-between border-b border-slate-200 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="font-sans text-[0.55rem] text-slate-900/20">schollective.org/editor</span>
              </div>

              <div className="flex flex-col md:flex-row gap-8">
                {/* Mock email draft */}
                <div className="flex-1 p-8 rounded-xl border border-slate-200 bg-slate-50 flex flex-col gap-3">
                  <span className="font-sans text-[0.5rem] text-slate-600/30 uppercase tracking-wider">STRUCTURED REQUEST FLOW</span>
                  <div className="text-xs leading-relaxed text-slate-600/60">
                    <p className="mb-2 line-through text-red-400/80 decoration-[#ea580c] decoration-2">
                      I would love to join your lab next semester.
                    </p>
                    <p className="text-slate-900 border-l-2 border-blue-600 pl-2 bg-blue-600/5 py-1">
                      I have been analyzing memory consolidation in sleep. Your 2024 theta oscillation findings motivated my question...
                    </p>
                  </div>
                </div>

                {/* Validation list */}
                <div className="w-full md:w-56 flex flex-col gap-2">
                  <div className="p-2.5 rounded-lg border border-red-500/10 bg-red-500/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-xs">✕</span>
                      <span className="font-sans text-[0.62rem] text-red-400 tracking-wider">GENERIC REQUEST</span>
                    </div>
                    <span className="text-[0.55rem] text-red-400/70">Refine</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="font-sans text-[0.62rem] text-green-400 tracking-wider">CITES WORK DIRECTLY</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="font-sans text-[0.62rem] text-green-400 tracking-wider">STRUCTURED CONTEXT</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOUNDER QUOTE SECTION ══════════════════════════════════════ */}
        <section className="js-fade py-24 relative border-t border-slate-200 bg-slate-50">
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
            <span className="font-display text-7xl text-blue-600/20 select-none leading-none -mb-6">“</span>
            <blockquote className="font-display text-xl md:text-3xl font-light text-slate-900/90 leading-relaxed mb-8 max-w-2xl italic select-none">
              When we were students, we realized how difficult it was to reach out to the right professors. Cold emails went unanswered, and credentials were hard to verify. We built Schollective to establish genuine, verified mentorship.
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-blue-600/15 border border-blue-600/30 flex items-center justify-center font-display font-bold text-blue-600">
                A
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-slate-900">Aiden & Ayaan</div>
                <div className="text-xs text-slate-600/60">Founders, Schollective</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SOCIAL TESTIMONIALS SECTION ════════════════════════════════ */}
        <section className="js-fade py-28 border-t border-slate-200 relative overflow-hidden">
          <div className="max-w-[80rem] mx-auto px-6 mb-16 text-center">
            <Label>Student Success</Label>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-slate-900 mt-4 tracking-tight">
              What users say
            </h2>
          </div>

          <div className="relative w-full overflow-hidden py-4 select-none">
            <div className="lp-quotes-track">
              <div className="lp-quotes-group">
                {[
                  { initial: "JN", text: "Just wanted to say thanks, like no joke. I got like 6 research internship opportunities now for this summer😭 (IU, Purdue, UIUC, UChicago).", author: "Jedrek N., College Student" },
                  { initial: "US", text: "I got a reply in 3 days. The structured request flow actually helped me get straight to the point.", author: "Undergraduate student" },
                  { initial: "CR", text: "I was skeptical at first, but after signing up, I was really impressed with what Schollective has to offer. Genuinely helpful as a high schooler.", author: "Chetana R., High School Student" },
                  { initial: "RP", text: "Endorse this format 💯. If a student request has real context and specific questions, I always answer it.", author: "Research Professor" },
                  { initial: "SU", text: "First time I've gotten actual structured feedback on my academic outreach.", author: "Student user" }
                ].map((item, i) => (
                  <article key={i} className="flex-shrink-0 w-[360px] p-8 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-sans text-xs text-slate-600">
                        {item.initial}
                      </div>
                      <span className="font-display text-2xl text-blue-600/20">“</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 font-light">{item.text}</p>
                    <span className="font-sans text-[0.62rem] text-slate-900/50 uppercase tracking-wider">{item.author}</span>
                  </article>
                ))}
              </div>

              {/* Loop group for seamless scrolling */}
              <div className="lp-quotes-group" aria-hidden="true">
                {[
                  { initial: "JN", text: "Just wanted to say thanks, like no joke. I got like 6 research internship opportunities now for this summer😭 (IU, Purdue, UIUC, UChicago).", author: "Jedrek N., College Student" },
                  { initial: "US", text: "I got a reply in 3 days. The structured request flow actually helped me get straight to the point.", author: "Undergraduate student" },
                  { initial: "CR", text: "I was skeptical at first, but after signing up, I was really impressed with what Schollective has to offer. Genuinely helpful as a high schooler.", author: "Chetana R., High School Student" },
                  { initial: "RP", text: "Endorse this format 💯. If a student request has real context and specific questions, I always answer it.", author: "Research Professor" },
                  { initial: "SU", text: "First time I've gotten actual structured feedback on my academic outreach.", author: "Student user" }
                ].map((item, i) => (
                  <article key={`dup-${i}`} className="flex-shrink-0 w-[360px] p-8 rounded-2xl border border-slate-200 bg-slate-50 flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-full bg-slate-50 flex items-center justify-center font-sans text-xs text-slate-600">
                        {item.initial}
                      </div>
                      <span className="font-display text-2xl text-blue-600/20">“</span>
                    </div>
                    <p className="text-sm text-slate-600 leading-relaxed mb-6 font-light">{item.text}</p>
                    <span className="font-sans text-[0.62rem] text-slate-900/50 uppercase tracking-wider">{item.author}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ FINAL CALL TO ACTION ═══════════════════════════════════════ */}
        <section className="js-fade relative overflow-hidden"
          style={{ minHeight: "100vh", padding: "5rem 5rem 4rem 5rem", display: "flex", flexDirection: "column" }}>
          <div className="flex items-start justify-between mb-auto">
            <FadeIn><Label>Ready?</Label></FadeIn>
            <FadeIn delay={0.1}>
              <span className="font-sans uppercase"
                style={{ fontSize: "0.48rem", letterSpacing: "0.38em", color: "rgba(15, 23, 42, 0.45)", marginTop: "0.1rem" }}>
                Schollective, Inc. © 2026
              </span>
            </FadeIn>
          </div>
          <div className="flex-1 flex items-center py-8">
            <SplitReveal as="h2" className="font-display font-black tracking-tighter text-slate-900"
              style={{ fontSize: "clamp(3.2rem, 14vw, 15rem)", lineHeight: 0.82 }}>
              Begin Mentorship.
            </SplitReveal>
          </div>
          <div className="flex items-end justify-between pt-8" style={{ borderTop: "1px solid rgba(37, 99, 235, 0.1)" }}>
            <FadeIn delay={0.3}>
              <p className="font-light leading-relaxed" style={{ fontSize: "0.9rem", color: "rgba(15, 23, 42, 0.6)", maxWidth: "24rem" }}>
                Join thousands of students already connecting with verified academic mentors — at no cost.
              </p>
            </FadeIn>
            <FadeIn delay={0.5}>
              <CreateAccountButton />
            </FadeIn>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer style={{ background: "var(--bg-surface-1)", borderTop: "1px solid rgba(37, 99, 235, 0.1)" }}>
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "4.5rem 2.5rem 3rem", display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr", gap: "3rem" }} className="footer-grid">
            <FadeIn delay={0}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <SchollectiveLogo size={44} />
                  <span className="font-display font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em", color: "var(--text-primary)" }}>
                    Schollective
                  </span>
                </div>
                <p className="font-light leading-relaxed" style={{ fontSize: "0.88rem", color: "rgba(15, 23, 42, 0.65)", maxWidth: "22rem" }}>
                  Connecting ambitious students with verified professors for structured, transparent academic mentorship. Every question deserves a real answer.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <span className="font-sans uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(37, 99, 235, 0.6)" }}>
                  Quick Links
                </span>
                <nav style={{ display: "flex", flexDirection: "column", gap: "0.85rem" }}>
                  {[
                    { label: "Home", href: "/" },
                    { label: "About", href: "/about" },
                    { label: "For Students", href: "/for-students" },
                    { label: "For Professors", href: "/for-professors" },
                    { label: "Sign Up", href: "/signup" },
                    { label: "Log In", href: "/login" },
                  ].map((link) => (
                    <Link key={link.label} href={link.href}
                      style={{ fontSize: "0.88rem", color: "rgba(15, 23, 42, 0.7)", transition: "color 0.2s ease", display: "inline-block" }}
                      onMouseEnter={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "#818cf8")}
                      onMouseLeave={(e) => ((e.currentTarget as HTMLAnchorElement).style.color = "rgba(168, 179, 207, 0.7)")}>
                      {link.label}
                    </Link>
                  ))}
                </nav>
              </div>
            </FadeIn>

            <FadeIn delay={0.2}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <span className="font-sans uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(37, 99, 235, 0.6)" }}>
                  Contact Us
                </span>
                <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
                  {[
                    { icon: <path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, extra: <polyline points="22,6 12,13 2,6" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, text: "schollective.corp@gmail.com", href: "mailto:schollective.corp@gmail.com" },
                    { icon: <path d="M3 9l9-7 9 7v11a2 2 0 01-2 2H5a2 2 0 01-2-2z" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, extra: <polyline points="9,22 9,12 15,12 15,22" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, text: "Serving schools worldwide" },
                    { icon: <circle cx="12" cy="12" r="10" stroke="#818cf8" strokeWidth="1.5" />, extra: <polyline points="12,6 12,12 16,14" stroke="#818cf8" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />, text: "Free to use — always" },
                  ].map((item, i) => {
                    const inner = (
                      <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(37, 99, 235, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0, justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {item.icon}{item.extra}
                          </svg>
                        </div>
                        <span style={{ fontSize: "0.83rem", color: "rgba(15, 23, 42, 0.7)" }}>{item.text}</span>
                      </div>
                    );
                    return item.href
                      ? <a key={i} href={item.href} style={{ textDecoration: "none" }}>{inner}</a>
                      : <div key={i}>{inner}</div>;
                  })}
                </div>
              </div>
            </FadeIn>
          </div>

          <div style={{ maxWidth: "80rem", margin: "0 auto", height: "1px", background: "rgba(37, 99, 235, 0.09)", marginLeft: "2.5rem", marginRight: "2.5rem" }} />

          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 2.5rem", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span className="font-sans" style={{ fontSize: "0.72rem", color: "rgba(15, 23, 42, 0.7)", letterSpacing: "0.02em" }}>
                © 2026 Schollective, Inc. All rights reserved.
              </span>
              <span className="font-sans" style={{ fontSize: "0.68rem", color: "rgba(15, 23, 42, 0.5)", letterSpacing: "0.02em" }}>
                Not a substitute for official academic advising.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="font-sans" style={{ fontSize: "0.68rem", color: "rgba(15, 23, 42, 0.55)", letterSpacing: "0.04em" }}>Built with</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.55 }}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="rgba(37, 99, 235, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-sans" style={{ fontSize: "0.68rem", color: "rgba(15, 23, 42, 0.55)", letterSpacing: "0.04em" }}>for students seeking knowledge</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}