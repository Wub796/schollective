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
            background: "#09090b",
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
                    background: i % 2 === 0 ? "#818cf8" : "rgba(129,140,248,0.15)",
                    border: "1px solid rgba(129,140,248,0.3)",
                    fontSize: "1.8rem", fontWeight: 900, color: "#fafaf9",
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
            <p style={{ fontFamily: "monospace", fontSize: "0.7rem", letterSpacing: "0.35em", textTransform: "uppercase", color: "rgba(129,140,248,0.5)", margin: 0 }}>
              Schollective
            </p>
            <p style={{ fontFamily: "monospace", fontSize: "0.55rem", letterSpacing: "0.2em", color: "rgba(82,82,91,0.4)", margin: "0.3rem 0 0" }}>
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
      dot.style.borderColor = isIndigo ? "rgba(129,140,248,0.85)" : "rgba(255,255,255,0.85)";
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
          ? "1px solid rgba(129,140,248,0.5)"
          : "1px solid rgba(250,250,249,0.3)",
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
                color: isIndigo ? "#09090b" : "#fafaf9",
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
      <span className="block w-5 h-px flex-shrink-0" style={{ background: "rgba(129, 140, 248, 0.35)" }} />
      <span className="font-mono uppercase text-[#818cf8]" style={{ fontSize: "0.55rem", letterSpacing: "0.48em" }}>
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
        color: "#fafaf9",
        border: "1px solid rgba(255,255,255,0.12)",
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
                color: "#fafaf9",
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

  // Pricing State
  const [pricingIndex, setPricingIndex] = useState(0);

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
        /* ── Local style overrides to support the premium responsive sliding ── */
        .lp-pricing-slider-viewport {
          width: 100% !important;
          position: relative !important;
        }
        .lp-pricing-slider-track {
          display: flex !important;
          flex-direction: row !important;
          flex-wrap: nowrap !important;
          width: 100% !important;
          transition: transform 0.55s cubic-bezier(0.19, 1, 0.22, 1) !important;
          will-change: transform !important;
          align-items: stretch !important;
        }
        .lp-pricing-slider-slide {
          flex: 0 0 100% !important;
          width: 100% !important;
          padding: 0 24px !important;
          box-sizing: border-box !important;
        }
        .lp-price-card {
          width: 100% !important;
          box-sizing: border-box !important;
        }
        
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

        /* ── Mobile Layout (<= 900px) ── */
        @media (max-width: 900px) {
          .lp-pricing-slider-viewport {
            max-width: 500px !important;
            margin: 0 auto !important;
            overflow: hidden !important;
            padding-top: 12px !important;
            padding-bottom: 20px !important;
          }
          .lp-desktop-grid {
            display: none !important;
          }
        }

        /* ── Desktop Layout (> 900px) ── */
        @media (min-width: 901px) {
          .lp-pricing-slider-viewport {
            max-width: none !important;
            overflow: visible !important;
          }
          .lp-pricing-slider-track {
            display: grid !important;
            grid-template-columns: repeat(4, 1fr) !important;
            gap: 20px !important;
            transform: none !important;
            width: auto !important;
          }
          .lp-pricing-slider-slide {
            flex: none !important;
            width: auto !important;
            padding: 0 !important;
          }
          .lp-mobile-pricing-tabs {
            display: none !important;
          }
          .lp-mobile-pricing-dots {
            display: none !important;
          }
        }
      `}} />

      <div
        ref={pageRef}
        className="relative text-[#fafaf9] font-sans overflow-x-hidden"
        style={{ background: "var(--bg-base)", opacity: loaderDone ? 1 : 0, transition: "opacity 0.5s ease" }}
      >
        <PublicNav />

        {/* ══ HERO SECTION ═══════════════════════════════════════════════ */}
        <section className="relative min-h-screen overflow-hidden flex flex-col justify-center" style={{ background: "var(--bg-base)" }}>
          <div className="absolute inset-0 z-0">
            <ThreeBackground />
            <div className="absolute inset-0 pointer-events-none"
              style={{ background: "radial-gradient(ellipse 100% 75% at 50% 40%, transparent 0%, rgba(9,9,11,0.6) 70%, rgba(9,9,11,0.98) 100%)" }} />
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
                <span className="absolute inline-flex h-full w-full rounded-full bg-[#818cf8] opacity-75"
                  style={{ animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }} />
                <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#818cf8]" />
              </span>
              <span className="font-mono uppercase" style={{ fontSize: "0.46rem", letterSpacing: "0.42em", color: "rgba(129,140,248,0.5)" }}>
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
              <span className="w-1.5 h-1.5 rounded-full bg-[#818cf8]" />
              <span className="font-mono uppercase tracking-widest text-xs text-[#fafaf9]/60">
                Used by 1,000+ students at Stanford, MIT, and beyond.
              </span>
            </motion.div>

            {/* Headline */}
            <h1 className="font-display font-black text-[#fafaf9] mb-6 select-none"
              style={{ fontSize: "clamp(2.5rem, 6.5vw, 6.2rem)", letterSpacing: "-0.03em", lineHeight: 1.05 }}>
              Find the mentor<br />
              <span className="italic font-light text-[#fafaf9]/40">who changes your </span>
              <em className="italic font-normal text-[#818cf8]">life.</em>
            </h1>

            {/* Subtext */}
            <motion.p
              initial={{ opacity: 0 }} animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 1.1 }}
              className="font-light leading-relaxed text-[#a8b3cf] mb-12 text-lg max-w-xl"
            >
              Cold emails to professors get ignored. Yours won't. Connect with verified academic advisors for structured research mentorship.
            </motion.p>

            {/* Search Bar Block */}
            <motion.form
              onSubmit={handleSearch}
              initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.9, ease: EASE, delay: 1.3 }}
              className="w-full max-w-3xl flex flex-col md:flex-row items-stretch p-2.5 rounded-[24px] border border-white/10 gap-2 md:gap-0"
              style={{
                background: "rgba(17, 17, 19, 0.55)",
                backdropFilter: "blur(24px)",
                boxShadow: "0 24px 60px rgba(0, 0, 0, 0.4), inset 0 1px 0 rgba(255, 255, 255, 0.05)",
              }}
            >
              <div className="flex-1 flex flex-col justify-center px-4 py-2 text-left">
                <label className="font-mono uppercase text-[0.52rem] tracking-wider text-[#a8b3cf]/60 mb-1">
                  Research Interest
                </label>
                <input
                  type="text"
                  placeholder="e.g. machine learning"
                  value={interest}
                  onChange={(e) => setInterest(e.target.value)}
                  className="bg-transparent border-none outline-none font-sans text-sm text-[#fafaf9] placeholder-[#fafaf9]/25 w-full"
                />
              </div>

              <div className="hidden md:block w-px bg-white/10 my-3" />

              <div className="flex-1 flex flex-col justify-center px-4 py-2 text-left">
                <label className="font-mono uppercase text-[0.52rem] tracking-wider text-[#a8b3cf]/60 mb-1">
                  University
                </label>
                <input
                  type="text"
                  placeholder="e.g. MIT, Stanford..."
                  value={university}
                  onChange={(e) => setUniversity(e.target.value)}
                  className="bg-transparent border-none outline-none font-sans text-sm text-[#fafaf9] placeholder-[#fafaf9]/25 w-full"
                />
              </div>

              <button
                type="submit"
                className="group relative flex items-center justify-center rounded-full bg-[#818cf8] text-[#09090b] font-bold text-xs uppercase tracking-widest px-8 py-4 transition-transform duration-300 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
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
        <section className="js-fade relative py-28 border-t border-white/5" style={{ background: "rgba(17, 17, 19, 0.4)" }}>
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
            <Label>The truth about cold emails</Label>
            
            <h2 className="font-display font-bold text-[#fafaf9] mt-6 mb-12 select-none tracking-tight leading-[1.12]"
              style={{ fontSize: "clamp(2rem, 4.5vw, 3.6rem)" }}>
              Professors delete 90% of student emails<br />
              <span className="italic font-light text-[#fafaf9]/35">before finishing the first line.</span>
            </h2>

            <div className="flex flex-col gap-5 text-left max-w-xl w-full mb-12">
              {[
                "Professors can spot AI-written emails instantly.",
                "Generic emails that could be sent to anyone get ignored.",
                "Name-dropping papers without understanding them backfires."
              ].map((reason, i) => (
                <div key={i} className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                  <span className="flex-shrink-0 w-6 h-6 rounded-full bg-red-500/10 border border-red-500/20 flex items-center justify-center text-red-400 text-xs font-bold font-mono">
                    ✕
                  </span>
                  <span className="text-[#a8b3cf] text-sm leading-relaxed">{reason}</span>
                </div>
              ))}
            </div>

            <CTAButton href="/signup" label="Write one that gets read" variant="indigo" />
          </div>
        </section>

        {/* ══ PROOF STRIP ════════════════════════════════════════════════ */}
        <div className="js-fade border-y border-white/5 py-12 bg-black/40">
          <div className="max-w-[80rem] mx-auto px-6 grid grid-cols-2 md:grid-cols-4 gap-8 md:gap-4 text-center">
            {[
              { num: "250M+", label: "papers indexed" },
              { num: "1,000+", label: "universities" },
              { num: "10,000+", label: "students served" },
              { num: "< 24h", label: "first response" }
            ].map((stat, i) => (
              <div key={i} className="flex flex-col items-center">
                <span className="font-display font-black text-3xl md:text-5xl text-[#fafaf9] tracking-tight mb-2">
                  {stat.num}
                </span>
                <span className="font-mono text-[0.55rem] tracking-widest uppercase text-[#818cf8]/70">
                  {stat.label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ══ VS TABLE SECTION (ChatGPT vs Schollective) ══════════════════ */}
        <section className="js-fade py-28 relative">
          <div className="max-w-[64rem] mx-auto px-6">
            <div className="text-center mb-16">
              <Label>Comparing Outreach</Label>
              <h2 className="font-display font-bold text-3xl md:text-5xl text-[#fafaf9] mt-4 tracking-tight">
                Why not just use ChatGPT?
              </h2>
            </div>

            <div className="glass-refraction" style={{ padding: "40px" }}>
              <div className="grid grid-cols-2 border-b border-white/10 pb-6 mb-6">
                <div className="pr-6">
                  <span className="font-mono text-[0.68rem] font-bold tracking-widest text-[#fafaf9]/30 uppercase">
                    ChatGPT / LLMs
                  </span>
                </div>
                <div className="pl-6 border-l border-white/10">
                  <span className="font-mono text-[0.68rem] font-bold tracking-widest text-[#818cf8] uppercase">
                    Schollective
                  </span>
                </div>
              </div>

              {[
                {
                  bad: "Hallucinates professors, fake papers, and wrong citation counts.",
                  good: "Every professor and paper is pulled from 250M+ verified academic records. 100% real."
                },
                {
                  bad: "Writes generic AI-sounding emails that get immediately deleted.",
                  good: "Surfaces findings and summaries so you write an authentic, high-reply email yourself."
                },
                {
                  bad: "Requires 20 back-and-forth prompts to analyze a professor's lab.",
                  good: "One single search. Vetted matches, paper insights, and email validation all in one view."
                }
              ].map((row, i) => (
                <div key={i} className="grid grid-cols-2 py-6 border-b border-white/5 last:border-none">
                  <div className="pr-6 flex gap-4 items-start">
                    <span className="text-red-500 font-bold font-mono text-xs pt-1 select-none">✕</span>
                    <p className="text-[#a8b3cf] text-sm leading-relaxed">{row.bad}</p>
                  </div>
                  <div className="pl-6 border-l border-white/5 flex gap-4 items-start">
                    <span className="text-[#818cf8] font-bold font-mono text-xs pt-1 select-none">✓</span>
                    <p className="text-[#fafaf9] text-sm leading-relaxed font-medium">{row.good}</p>
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
              <span className="font-mono text-2xl text-[#818cf8]/45 mb-4">01</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-[#fafaf9] tracking-tight mb-6">
                Search any research interest.
              </h3>
              <p className="text-[#a8b3cf] leading-relaxed text-base mb-8 max-w-md">
                Type what you care about: quantum computing, cognitive neuroscience, or climate policy. We surface top professors publishing in that exact space, ranked by impact.
              </p>
              <Link href="/signup" className="font-mono text-xs uppercase tracking-widest text-[#818cf8] border-b border-[#818cf8]/20 pb-1 hover:border-[#818cf8]/80 transition-colors">
                Try a search →
              </Link>
            </div>

            {/* Visual Mockup 01 */}
            <div className="relative p-6 rounded-3xl border border-white/10 bg-black/40 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="font-mono text-[0.55rem] text-[#fafaf9]/20">schollective.org/app</span>
              </div>

              {/* Mock Input */}
              <div className="flex gap-2 p-2 rounded-xl bg-white/[0.03] border border-white/5 items-center">
                <span className="px-3 py-1.5 rounded-lg bg-[#818cf8]/15 border border-[#818cf8]/25 text-xs text-[#818cf8] font-medium">
                  neuroscience
                </span>
                <span className="px-3 py-1.5 rounded-lg bg-white/[0.04] text-xs text-[#a8b3cf]/60">
                  Harvard
                </span>
              </div>

              {/* Mock Professor Cards */}
              {[
                { name: "Dr. Emily Nakamura", uni: "Harvard Medical School", tag1: "Memory", tag2: "fMRI" },
                { name: "Prof. James Miller", uni: "MIT Brain & Cognitive", tag1: "Neural Circuits", tag2: "AI" },
                { name: "Dr. Aisha Patel", uni: "Stanford Neuroscience", tag1: "BCI", tag2: "Computation" }
              ].map((prof, i) => (
                <div key={i} className="flex flex-col items-start p-4 rounded-xl border border-white/5 bg-white/[0.01] hover:bg-white/[0.03] transition-colors">
                  <div className="flex items-center justify-between w-full mb-1">
                    <span className="font-display font-medium text-sm text-[#fafaf9]">{prof.name}</span>
                    <span className="font-mono text-[0.62rem] text-[#a8b3cf]/45">{prof.uni}</span>
                  </div>
                  <div className="flex gap-1.5">
                    <span className="px-2 py-0.5 rounded-md bg-white/[0.04] text-[0.6rem] text-[#a8b3cf]/60">{prof.tag1}</span>
                    <span className="px-2 py-0.5 rounded-md bg-[#818cf8]/5 text-[0.6rem] text-[#818cf8]/60 border border-[#818cf8]/10">{prof.tag2}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Feature 02 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            {/* Visual Mockup 02 (Left side for desktop layout) */}
            <div className="order-2 lg:order-1 relative p-6 rounded-3xl border border-white/10 bg-black/40 shadow-2xl flex flex-col gap-4">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="font-mono text-[0.55rem] text-[#fafaf9]/20">schollective.org/app</span>
              </div>

              {/* Research summary UI */}
              <div className="p-5 rounded-2xl border border-[#818cf8]/15 bg-[#818cf8]/[0.01]">
                <div className="flex items-center justify-between mb-3 border-b border-white/5 pb-2">
                  <span className="font-display font-bold text-base text-[#fafaf9]">Dr. Emily Nakamura</span>
                  <span className="px-2 py-0.5 rounded bg-[#818cf8]/10 text-[0.58rem] text-[#818cf8] font-mono">2024 PAPER</span>
                </div>
                <p className="text-[#a8b3cf] text-xs leading-relaxed mb-4">
                  Studies how memories form and consolidate during sleep using fMRI. Recent work shows neural oscillation patterns predict next-day recall accuracy in elderly patients with early cognitive decline.
                </p>
                <div className="p-3 rounded-lg bg-[#818cf8]/5 border border-[#818cf8]/10">
                  <span className="font-mono text-[0.52rem] uppercase text-[#818cf8] tracking-widest font-bold block mb-1">Key Finding</span>
                  <p className="text-white text-xs leading-relaxed">
                    Theta oscillations during REM sleep increased memory consolidation by 34%. Published 2024, first-author.
                  </p>
                </div>
              </div>
            </div>

            <div className="order-1 lg:order-2 flex flex-col items-start">
              <span className="font-mono text-2xl text-[#818cf8]/45 mb-4">02</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-[#fafaf9] tracking-tight mb-6">
                Understand their research in plain English.
              </h3>
              <p className="text-[#a8b3cf] leading-relaxed text-base mb-8 max-w-md">
                Every professor gets an AI summary of their key findings, written so a high schooler or undergrad can understand it and use it in their email outreach. No more pretending to read 40-page papers.
              </p>
              <Link href="/signup" className="font-mono text-xs uppercase tracking-widest text-[#818cf8] border-b border-[#818cf8]/20 pb-1 hover:border-[#818cf8]/80 transition-colors">
                See an example →
              </Link>
            </div>
          </div>

          {/* Feature 03 */}
          <div className="js-fade max-w-[80rem] mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
            <div className="flex flex-col items-start">
              <span className="font-mono text-2xl text-[#818cf8]/45 mb-4">03</span>
              <h3 className="font-display font-bold text-3xl md:text-4xl text-[#fafaf9] tracking-tight mb-6">
                Write emails that get read.
              </h3>
              <p className="text-[#a8b3cf] leading-relaxed text-base mb-8 max-w-md">
                Our email checker, built on feedback from actual research professors, catches common outreach mistakes before you hit send. We identify generic tone, AI phrases, and weak ask blocks.
              </p>
              <Link href="/signup" className="font-mono text-xs uppercase tracking-widest text-[#818cf8] border-b border-[#818cf8]/20 pb-1 hover:border-[#818cf8]/80 transition-colors">
                Check your email →
              </Link>
            </div>

            {/* Visual Mockup 03 */}
            <div className="relative p-6 rounded-3xl border border-white/10 bg-black/40 shadow-2xl flex flex-col gap-5">
              <div className="flex items-center justify-between border-b border-white/5 pb-4">
                <div className="flex items-center gap-1.5">
                  <div className="w-2.5 h-2.5 rounded-full bg-red-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/40" />
                  <div className="w-2.5 h-2.5 rounded-full bg-green-500/40" />
                </div>
                <span className="font-mono text-[0.55rem] text-[#fafaf9]/20">schollective.org/editor</span>
              </div>

              <div className="flex flex-col md:flex-row gap-6">
                {/* Mock email draft */}
                <div className="flex-1 p-4 rounded-xl border border-white/5 bg-white/[0.01] flex flex-col gap-3">
                  <span className="font-mono text-[0.5rem] text-[#a8b3cf]/30 uppercase tracking-widest">DRAFT OUTREACH</span>
                  <div className="text-xs leading-relaxed text-[#a8b3cf]/60">
                    <p className="mb-2 line-through text-red-400/80 decoration-[#ea580c] decoration-2">
                      I found your work fascinating and extremely groundbreaking.
                    </p>
                    <p className="text-white border-l-2 border-[#818cf8] pl-2 bg-[#818cf8]/5 py-1">
                      I read your 2024 paper on sleep theta oscillations. The 34% memory improvement in memory consolidation surprised me...
                    </p>
                  </div>
                </div>

                {/* Validation list */}
                <div className="w-full md:w-56 flex flex-col gap-2">
                  <div className="p-2.5 rounded-lg border border-red-500/10 bg-red-500/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-red-400 text-xs">✕</span>
                      <span className="font-mono text-[0.62rem] text-red-400 tracking-wider">SYCOPHANTIC TONE</span>
                    </div>
                    <span className="text-[0.55rem] text-red-400/70">Remove</span>
                  </div>

                  <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="font-mono text-[0.62rem] text-green-400 tracking-wider">REAL CITATION</span>
                    </div>
                  </div>

                  <div className="p-2.5 rounded-lg border border-green-500/10 bg-green-500/[0.02] flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="text-green-400 text-xs">✓</span>
                      <span className="font-mono text-[0.62rem] text-green-400 tracking-wider">HUMAN WRITTEN</span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ FOUNDER QUOTE SECTION ══════════════════════════════════════ */}
        <section className="js-fade py-24 relative border-t border-white/5 bg-white/[0.01]">
          <div className="max-w-4xl mx-auto px-6 text-center flex flex-col items-center">
            <span className="font-display text-7xl text-[#818cf8]/20 select-none leading-none -mb-6">“</span>
            <blockquote className="font-display text-xl md:text-3xl font-light text-[#fafaf9]/90 leading-relaxed mb-8 max-w-2xl italic select-none">
              When I was a high school freshman, I used this approach to cold email 5 professors. A Princeton astrophysics professor responded within 24 hours and said I was 'way ahead of the curve.' That's why I built Schollective.
            </blockquote>
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-[#818cf8]/15 border border-[#818cf8]/30 flex items-center justify-center font-display font-bold text-[#818cf8]">
                J
              </div>
              <div className="text-left">
                <div className="text-sm font-bold text-[#fafaf9]">Jace</div>
                <div className="text-xs text-[#a8b3cf]/60">Founder, Schollective</div>
              </div>
            </div>
          </div>
        </section>

        {/* ══ SOCIAL TESTIMONIALS SECTION ════════════════════════════════ */}
        <section className="js-fade py-28 border-t border-white/5 relative overflow-hidden">
          <div className="max-w-[80rem] mx-auto px-6 mb-16 text-center">
            <Label>Student Success</Label>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-[#fafaf9] mt-4 tracking-tight">
              What users say
            </h2>
          </div>

          <div className="relative w-full overflow-hidden py-4 select-none">
            <div className="lp-quotes-track">
              <div className="lp-quotes-group">
                {[
                  { initial: "JN", text: "Just wanted to say thanks, like no joke. I got like 6 research internship opportunities now for this summer😭 (IU, Purdue, UIUC, UChicago).", author: "Jedrek N., College Student" },
                  { initial: "US", text: "I got a reply in 3 days. Never happened before with cold email databases.", author: "Undergraduate student" },
                  { initial: "CR", text: "I was skeptical at first, but after signing up, I was really impressed with what Schollective has to offer. Genuinely helpful as a high schooler.", author: "Chetana R., High School Student" },
                  { initial: "RP", text: "Endorse this advice 💯. If an email smells of generic template AI I will not answer it.", author: "Research Professor" },
                  { initial: "SU", text: "First time I've gotten actual structured feedback on my academic outreach.", author: "Student user" }
                ].map((item, i) => (
                  <article key={i} className="flex-shrink-0 w-[360px] p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center font-mono text-xs text-[#a8b3cf]">
                        {item.initial}
                      </div>
                      <span className="font-display text-2xl text-[#818cf8]/20">“</span>
                    </div>
                    <p className="text-sm text-[#a8b3cf] leading-relaxed mb-6 font-light">{item.text}</p>
                    <span className="font-mono text-[0.62rem] text-[#fafaf9]/50 uppercase tracking-wider">{item.author}</span>
                  </article>
                ))}
              </div>

              {/* Loop group for seamless scrolling */}
              <div className="lp-quotes-group" aria-hidden="true">
                {[
                  { initial: "JN", text: "Just wanted to say thanks, like no joke. I got like 6 research internship opportunities now for this summer😭 (IU, Purdue, UIUC, UChicago).", author: "Jedrek N., College Student" },
                  { initial: "US", text: "I got a reply in 3 days. Never happened before with cold email databases.", author: "Undergraduate student" },
                  { initial: "CR", text: "I was skeptical at first, but after signing up, I was really impressed with what Schollective has to offer. Genuinely helpful as a high schooler.", author: "Chetana R., High School Student" },
                  { initial: "RP", text: "Endorse this advice 💯. If an email smells of generic template AI I will not answer it.", author: "Research Professor" },
                  { initial: "SU", text: "First time I've gotten actual structured feedback on my academic outreach.", author: "Student user" }
                ].map((item, i) => (
                  <article key={`dup-${i}`} className="flex-shrink-0 w-[360px] p-6 rounded-2xl border border-white/5 bg-white/[0.02] flex flex-col justify-between">
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-8 h-8 rounded-full bg-white/[0.04] flex items-center justify-center font-mono text-xs text-[#a8b3cf]">
                        {item.initial}
                      </div>
                      <span className="font-display text-2xl text-[#818cf8]/20">“</span>
                    </div>
                    <p className="text-sm text-[#a8b3cf] leading-relaxed mb-6 font-light">{item.text}</p>
                    <span className="font-mono text-[0.62rem] text-[#fafaf9]/50 uppercase tracking-wider">{item.author}</span>
                  </article>
                ))}
              </div>
            </div>
          </div>
        </section>

        {/* ══ SIMPLE HONEST PRICING (Sleek dark tabs & slider) ══════════════ */}
        <section id="pricing" className="js-fade py-28 border-t border-white/5 relative">
          <div className="max-w-[80rem] mx-auto px-6 mb-16 text-center">
            <p className="font-mono text-[0.62rem] tracking-widest text-[#818cf8] uppercase mb-4">
              Try it risk-free. 100% money back guarantee.
            </p>
            <h2 className="font-display font-bold text-3xl md:text-5xl text-[#fafaf9] tracking-tight mb-4">
              Simple, honest pricing.
            </h2>
            <p className="text-[#a8b3cf]/60 text-sm max-w-md mx-auto leading-relaxed">
              One research position can change your entire academic career. One semester is all it takes.
            </p>
          </div>

          {/* Pricing Tabs for Mobile Slider */}
          <div className="lp-mobile-pricing-tabs flex relative justify-center items-center bg-white/[0.03] border border-white/5 rounded-full p-1.5 mb-8 mx-auto max-w-[380px] w-[calc(100%-32px)] overflow-hidden h-12">
            {["Free", "Weekly", "Semester", "Lifetime"].map((tab, i) => (
              <button
                key={tab}
                onClick={() => setPricingIndex(i)}
                className={`flex-1 relative z-10 h-full flex items-center justify-center border-none text-xs font-bold uppercase tracking-wider transition-all duration-300 ${
                  pricingIndex === i ? "text-[#09090b] bg-[#fafaf9] rounded-full shadow-md" : "text-[#a8b3cf]/50 bg-transparent"
                }`}
                style={{ cursor: "pointer", fontFamily: "var(--font-sans)" }}
              >
                {tab}
              </button>
            ))}
          </div>

          {/* Slider track / Desktop Columns container */}
          <div className="lp-pricing-slider-viewport max-w-[80rem] mx-auto">
            <div
              className="lp-pricing-slider-track"
              style={{ transform: `translateX(-${pricingIndex * 100}%)` }}
            >
              {/* Card 1: Free */}
              <div className="lp-pricing-slider-slide">
                <div className="lp-price-card rounded-2xl border border-white/5 bg-white/[0.01] p-8 flex flex-col justify-between min-h-[460px]">
                  <div>
                    <span className="font-mono text-[0.6rem] tracking-wider text-[#a8b3cf]/50 uppercase block mb-2">Free Scholar</span>
                    <span className="font-display font-black text-4xl text-white block mb-1">$0</span>
                    <span className="font-mono text-[0.55rem] text-[#a8b3cf]/40 uppercase block mb-6">Forever free</span>
                    <ul className="flex flex-col gap-3.5 text-xs text-[#a8b3cf]/70">
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Unlimited professor searches</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>1 full paper summary after signup</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Save professors & papers</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Basic structural templates</li>
                    </ul>
                  </div>
                  <Link href="/signup" className="w-full text-center py-3.5 rounded-full border border-white/10 hover:bg-white/[0.03] text-xs font-bold uppercase tracking-widest text-white transition-all mt-8 select-none" style={{ fontFamily: "var(--font-sans)" }}>
                    Start free
                  </Link>
                </div>
              </div>

              {/* Card 2: Weekly Sprint */}
              <div className="lp-pricing-slider-slide">
                <div className="lp-price-card rounded-2xl border border-[#818cf8]/20 bg-[#818cf8]/[0.01] p-8 flex flex-col justify-between min-h-[460px]">
                  <div>
                    <span className="font-mono text-[0.6rem] tracking-wider text-[#818cf8] uppercase block mb-2">Weekly Sprint</span>
                    <span className="font-display font-black text-4xl text-[#818cf8] block mb-1">$7</span>
                    <span className="font-mono text-[0.55rem] text-[#a8b3cf]/40 uppercase block mb-6">1 week access</span>
                    <ul className="flex flex-col gap-3.5 text-xs text-[#a8b3cf]">
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Unlimited research summaries</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Outreach email checker</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Professor contact details finder</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Outreach responsiveness indicator</li>
                    </ul>
                  </div>
                  <Link href="/signup" className="w-full text-center py-3.5 rounded-full bg-[#818cf8]/10 hover:bg-[#818cf8]/20 border border-[#818cf8]/35 text-xs font-bold uppercase tracking-widest text-[#818cf8] transition-all mt-8 select-none" style={{ fontFamily: "var(--font-sans)" }}>
                    Get 1-Week Sprint — $7
                  </Link>
                </div>
              </div>

              {/* Card 3: Semester */}
              <div className="lp-pricing-slider-slide">
                <div className="lp-price-card rounded-2xl border border-white/5 bg-white/[0.01] p-8 flex flex-col justify-between min-h-[460px]">
                  <div>
                    <span className="font-mono text-[0.6rem] tracking-wider text-[#a8b3cf]/50 uppercase block mb-2">Semester Pass</span>
                    <span className="font-display font-black text-4xl text-white block mb-1">$29</span>
                    <span className="font-mono text-[0.55rem] text-[#a8b3cf]/40 uppercase block mb-6">4 months access</span>
                    <ul className="flex flex-col gap-3.5 text-xs text-[#a8b3cf]/70">
                      <li className="font-bold text-white"><span className="text-[#818cf8] mr-2">✓</span>Everything in Free, plus:</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Unlimited research summaries</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Outreach email checker</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Professor contact details finder</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Cold Email Playbook included</li>
                    </ul>
                  </div>
                  <Link href="/signup" className="w-full text-center py-3.5 rounded-full border border-white/10 hover:bg-white/[0.03] text-xs font-bold uppercase tracking-widest text-white transition-all mt-8 select-none" style={{ fontFamily: "var(--font-sans)" }}>
                    Get Semester Access — $29
                  </Link>
                </div>
              </div>

              {/* Card 4: Lifetime */}
              <div className="lp-pricing-slider-slide">
                <div className="lp-price-card rounded-2xl border border-[#818cf8]/50 bg-[#818cf8]/5 p-8 flex flex-col justify-between min-h-[460px] relative overflow-hidden">
                  <div className="absolute top-3 right-3 bg-[#818cf8] text-[#09090b] font-mono text-[0.5rem] font-bold uppercase px-2.5 py-1 rounded-full select-none">
                    BEST VALUE
                  </div>
                  <div>
                    <span className="font-mono text-[0.6rem] tracking-wider text-[#818cf8] uppercase block mb-2">Lifetime Access</span>
                    <span className="font-display font-black text-4xl text-[#818cf8] block mb-1">$59</span>
                    <span className="font-mono text-[0.55rem] text-[#a8b3cf]/40 uppercase block mb-6">Yours forever</span>
                    <ul className="flex flex-col gap-3.5 text-xs text-[#a8b3cf]">
                      <li className="font-bold text-white"><span className="text-[#818cf8] mr-2">✓</span>Everything in Semester, plus:</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Never pay another subscription</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Priority AI summary credits</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>Map-based nearby professor search</li>
                      <li><span className="text-[#818cf8] font-bold mr-2">✓</span>All future feature releases free</li>
                    </ul>
                  </div>
                  <Link href="/signup" className="w-full text-center py-3.5 rounded-full bg-[#818cf8] text-[#09090b] hover:opacity-90 text-xs font-bold uppercase tracking-widest transition-all mt-8 select-none" style={{ fontFamily: "var(--font-sans)" }}>
                    Claim Lifetime — $59
                  </Link>
                </div>
              </div>
            </div>
          </div>

          {/* Dots Indicator for Mobile */}
          <div className="lp-mobile-pricing-dots flex justify-center items-center gap-3 mt-8">
            {[0, 1, 2, 3].map((i) => (
              <button
                key={i}
                onClick={() => setPricingIndex(i)}
                className={`w-2.5 h-2.5 rounded-full border-none transition-all duration-300 ${
                  pricingIndex === i ? "bg-[#818cf8] scale-[1.3]" : "bg-white/10"
                }`}
                style={{ cursor: "pointer", padding: 0 }}
              />
            ))}
          </div>

          {/* Cold Email Playbook banner */}
          <div className="max-w-[42rem] mx-auto mt-16 px-6 py-5 rounded-2xl border border-white/5 bg-white/[0.01] text-center">
            <span className="font-mono text-[0.68rem] tracking-wider text-[#818cf8] uppercase block mb-1">🎁 Included with Paid Plans</span>
            <p className="text-white text-sm font-medium leading-relaxed">
              The <strong>Cold Email Playbook</strong>: 12 annotated winning emails, a proven paragraph template, and the perfect follow-up schedule.
            </p>
          </div>
        </section>

        {/* ══ FINAL CALL TO ACTION ═══════════════════════════════════════ */}
        <section className="js-fade relative overflow-hidden"
          style={{ minHeight: "100vh", padding: "5rem 5rem 4rem 5rem", display: "flex", flexDirection: "column" }}>
          <div className="flex items-start justify-between mb-auto">
            <FadeIn><Label>Ready?</Label></FadeIn>
            <FadeIn delay={0.1}>
              <span className="font-mono uppercase"
                style={{ fontSize: "0.48rem", letterSpacing: "0.38em", color: "rgba(82, 82, 91, 0.45)", marginTop: "0.1rem" }}>
                Schollective, Inc. © 2026
              </span>
            </FadeIn>
          </div>
          <div className="flex-1 flex items-center py-8">
            <SplitReveal as="h2" className="font-display font-black tracking-tighter text-[#fafaf9]"
              style={{ fontSize: "clamp(3.2rem, 14vw, 15rem)", lineHeight: 0.82 }}>
              Start Outreach.
            </SplitReveal>
          </div>
          <div className="flex items-end justify-between pt-8" style={{ borderTop: "1px solid rgba(129, 140, 248, 0.1)" }}>
            <FadeIn delay={0.3}>
              <p className="font-light leading-relaxed" style={{ fontSize: "0.9rem", color: "rgba(168, 179, 207, 0.6)", maxWidth: "24rem" }}>
                Join thousands of students already connecting with verified academic mentors — at no cost.
              </p>
            </FadeIn>
            <FadeIn delay={0.5}>
              <CreateAccountButton />
            </FadeIn>
          </div>
        </section>

        {/* ══ FOOTER ═══════════════════════════════════════════════════════ */}
        <footer style={{ background: "var(--bg-surface-1)", borderTop: "1px solid rgba(129, 140, 248, 0.1)" }}>
          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "4.5rem 2.5rem 3rem", display: "grid", gridTemplateColumns: "2fr 1fr 1.5fr", gap: "3rem" }} className="footer-grid">
            <FadeIn delay={0}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <SchollectiveLogo size={44} />
                  <span className="font-display font-bold" style={{ fontSize: "1.15rem", letterSpacing: "-0.02em", color: "#fafaf9" }}>
                    Schollective
                  </span>
                </div>
                <p className="font-light leading-relaxed" style={{ fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.65)", maxWidth: "22rem" }}>
                  Connecting ambitious students with verified professors for structured, transparent academic mentorship. Every question deserves a real answer.
                </p>
              </div>
            </FadeIn>

            <FadeIn delay={0.1}>
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <span className="font-mono uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(129, 140, 248, 0.6)" }}>
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
                      style={{ fontSize: "0.88rem", color: "rgba(168, 179, 207, 0.7)", transition: "color 0.2s ease", display: "inline-block" }}
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
                <span className="font-mono uppercase" style={{ fontSize: "0.55rem", letterSpacing: "0.35em", color: "rgba(129, 140, 248, 0.6)" }}>
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
                        <div style={{ width: "32px", height: "32px", borderRadius: "8px", background: "rgba(99, 102, 241, 0.12)", border: "1px solid rgba(129, 140, 248, 0.15)", display: "flex", alignItems: "center", justifyItems: "center", flexShrink: 0, justifyContent: "center" }}>
                          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
                            {item.icon}{item.extra}
                          </svg>
                        </div>
                        <span style={{ fontSize: "0.83rem", color: "rgba(168, 179, 207, 0.7)" }}>{item.text}</span>
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

          <div style={{ maxWidth: "80rem", margin: "0 auto", height: "1px", background: "rgba(129, 140, 248, 0.09)", marginLeft: "2.5rem", marginRight: "2.5rem" }} />

          <div style={{ maxWidth: "80rem", margin: "0 auto", padding: "1.5rem 2.5rem", display: "flex", alignItems: "center", justifyItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "0.75rem" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: "0.25rem" }}>
              <span className="font-mono" style={{ fontSize: "0.72rem", color: "rgba(82, 82, 91, 0.7)", letterSpacing: "0.02em" }}>
                © 2026 Schollective, Inc. All rights reserved.
              </span>
              <span className="font-mono" style={{ fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.5)", letterSpacing: "0.02em" }}>
                Not a substitute for official academic advising.
              </span>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem" }}>
              <span className="font-mono" style={{ fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.55)", letterSpacing: "0.04em" }}>Built with</span>
              <svg width="12" height="12" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ opacity: 0.55 }}>
                <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" stroke="rgba(129, 140, 248, 0.7)" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              <span className="font-mono" style={{ fontSize: "0.68rem", color: "rgba(82, 82, 91, 0.55)", letterSpacing: "0.04em" }}>for students seeking knowledge</span>
            </div>
          </div>
        </footer>
      </div>
    </>
  );
}