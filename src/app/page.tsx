"use client";

import React, { useRef, useLayoutEffect, useState, useEffect } from "react";
import Link from "next/link";
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

/* ── Unseen Studio Loader — dark overlay, letters cycling, fades out ──── */
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
          {/* 3D rotating cube — Unseen loader__box spec */}
          <div style={{
            width: "5rem", height: "5rem",
            perspective: "20rem",
            position: "relative",
          }}>
            <motion.div
              animate={{ rotateY: [0, 90, 90, 180, 180, 270, 270, 360], rotateX: [0, 0, 0, 0, -90, -90, 0, 0] }}
              transition={{ duration: 2.4, ease: "easeInOut", repeat: Infinity, repeatDelay: 0 }}
              style={{
                width: "100%", height: "100%",
                position: "relative", transformStyle: "preserve-3d",
              }}
            >
              {LETTERS.map((ch, i) => {
                const faces = [
                  { rotateY: 0,   translateZ: "2.5rem" },
                  { rotateY: -90, translateZ: "2.5rem" },
                  { rotateX: -90, translateZ: "2.5rem" },
                  { rotateX: 180, translateZ: "2.5rem" },
                  { rotateX: 90,  translateZ: "2.5rem" },
                  { rotateY: 90,  translateZ: "2.5rem" },
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
            <p style={{
              fontFamily: "monospace",
              fontSize: "0.7rem",
              letterSpacing: "0.35em",
              textTransform: "uppercase",
              color: "rgba(129,140,248,0.5)",
              margin: 0,
            }}>Schollective</p>
            <p style={{
              fontFamily: "monospace",
              fontSize: "0.55rem",
              letterSpacing: "0.2em",
              color: "rgba(82,82,91,0.4)",
              margin: "0.3rem 0 0",
            }}>Academic Mentorship Platform</p>
          </div>

          {/* Progress bar */}
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

/* ── Unseen Studio easing — cubic-bezier(0.19, 1, 0.22, 1) ─────────
   Exponential out curve: snappy start, silky landing. Used on ALL
   text reveals, scroll triggers, and hover transitions.
────────────────────────────────────────────────────────────────────── */
const EASE: [number, number, number, number] = [0.19, 1, 0.22, 1];
const EASE_OUT: [number, number, number, number] = [0.22, 1, 0.36, 1];


/* ── Line-by-line text reveal — Unseen Studio spec ─────────────────
   Each LINE is wrapped in overflow:hidden, text starts at translateY(105%)
   and lands at 0 with cubic-bezier(0.19,1,0.22,1) over 0.8s.
   Lines stagger by 0.05s. Words within a line stagger by 0.04s.
────────────────────────────────────────────────────────────────────── */
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

/* ── Scroll-triggered fade up — Unseen Studio spec ─────────────────
   opacity: 0→1, y: 40px→0, easing cubic-bezier(0.19,1,0.22,1), 0.7s
────────────────────────────────────────────────────────────────────── */
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
  {
    num: "05",
    title: "Collaborate & Publish",
    body: "Build your academic portfolio, co-author research, and present at top-tier conferences.",
  },
];

/* ── ProcessCard — horizontal rail card ────────────────────────────────
   Animates from x:60px (slides in from right as rail scrolls into view).
   Fixed width so cards form a horizontal sequence.
   Hover: CSS-only narrow transitions, no transition-all.
──────────────────────────────────────────────────────────────────────── */
function ProcessCard({
  step,
  index,
  railInView,
}: {
  step: (typeof STEPS)[number];
  index: number;
  railInView: boolean;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, x: 60 }}
      animate={railInView ? { opacity: 1, x: 0 } : {}}
      transition={{
        duration: 0.7,
        ease: EASE,
        delay: 0.15 + index * 0.12,
      }}
      className="group relative flex flex-col justify-between flex-shrink-0 cursor-default overflow-hidden"
      style={{
        /* snap target */
        scrollSnapAlign: "start",
        background: "var(--bg-base)",
        /* card sizing: ~38vw on desktop, full width on mobile */
        width: "clamp(280px, 38vw, 520px)",
        minHeight: "26rem",
        padding: "2.5rem",
        borderRight: "1px solid rgba(129,140,248,0.08)",
        willChange: "transform, opacity",
      }}
    >
      {/* Ghost number — top-right watermark */}
      <div
        aria-hidden
        className="absolute top-4 right-5 select-none pointer-events-none font-mono font-black"
        style={{
          fontSize: "clamp(6rem, 12vw, 10rem)",
          lineHeight: 1,
          color: "rgba(129,140,248,0.045)",
          letterSpacing: "-0.05em",
          transition: "color 0.5s cubic-bezier(0.19,1,0.22,1)",
        }}
      >
        {step.num}
      </div>

      {/* Step label — top */}
      <span
        className="font-mono relative z-10"
        style={{
          fontSize: "0.48rem",
          letterSpacing: "0.42em",
          color: "rgba(129,140,248,0.35)",
          textTransform: "uppercase",
          transition: "color 0.4s cubic-bezier(0.19,1,0.22,1)",
        }}
      >
        {step.num}
      </span>

      {/* Content — bottom */}
      <div className="relative z-10 mt-auto">
        <h3
          className="font-display font-bold tracking-tighter text-[#fafaf9] mb-3"
          style={{
            fontSize: "clamp(1.6rem, 3vw, 2.6rem)",
            lineHeight: 1.0,
            transition: "transform 0.4s cubic-bezier(0.19,1,0.22,1)",
          }}
        >
          {step.title}
        </h3>
        <p
          className="font-light leading-relaxed"
          style={{ fontSize: "0.88rem", color: "rgba(168,179,207,0.5)" }}
        >
          {step.body}
        </p>

        {/* Arrow */}
        <span
          style={{
            display: "inline-block",
            marginTop: "1.25rem",
            fontSize: "1rem",
            color: "#818cf8",
            opacity: 0,
            transform: "translateX(0px)",
            transition: "opacity 0.35s cubic-bezier(0.19,1,0.22,1), transform 0.35s cubic-bezier(0.19,1,0.22,1)",
          }}
          className="group-hover:[opacity:0.65] group-hover:[transform:translateX(7px)]"
        >
          →
        </span>
      </div>

      {/* Hairline bottom scaleX fill */}
      <span
        aria-hidden
        style={{
          position: "absolute",
          bottom: 0, left: 0, right: 0,
          height: "1px",
          background: "#818cf8",
          opacity: 0.3,
          transform: "scaleX(0)",
          transformOrigin: "left center",
          transition: "transform 0.6s cubic-bezier(0.19,1,0.22,1)",
        }}
        className="group-hover:[transform:scaleX(1)]"
      />

      {/* Hover tint */}
      <span
        aria-hidden
        style={{
          position: "absolute", inset: 0,
          background: "rgba(129,140,248,0.02)",
          opacity: 0,
          transition: "opacity 0.45s cubic-bezier(0.19,1,0.22,1)",
          pointerEvents: "none",
        }}
        className="group-hover:[opacity:1]"
      />
    </motion.div>
  );
}

/* ── HorizontalProcessRail — drag-scrollable snap container ───────────── */
function HorizontalProcessRail() {
  const railRef = useRef<HTMLDivElement>(null);
  const sectionRef = useRef<HTMLDivElement>(null);
  const spacerRef = useRef<HTMLDivElement>(null);
  const cardWidthRef = useRef(0);
  const isInView = useInView(sectionRef, { once: true, margin: "-10%" });
  const [activeIdx, setActiveIdx] = useState(0);

  /* Size the trailing spacer = railWidth - cardWidth.
     This lets every card snap to the left edge (without it,
     cards 3 & 4 are physically unreachable by the scroll engine). */
  useEffect(() => {
    const rail = railRef.current;
    const spacer = spacerRef.current;
    if (!rail || !spacer) return;
    const measure = () => {
      const firstCard = rail.children[0] as HTMLElement | undefined;
      if (!firstCard) return;
      const cw = firstCard.getBoundingClientRect().width;
      cardWidthRef.current = cw;
      spacer.style.width = Math.max(0, rail.clientWidth - cw) + "px";
    };
    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(rail);
    return () => ro.disconnect();
  }, []); 

  /* Drag-to-scroll (desktop) */
  const dragState = useRef({ dragging: false, startX: 0, scrollLeft: 0 });

  const onPointerDown = (e: React.PointerEvent) => {
    const el = railRef.current;
    if (!el) return;
    dragState.current = { dragging: true, startX: e.clientX, scrollLeft: el.scrollLeft };
    el.setPointerCapture(e.pointerId);
    el.style.cursor = "grabbing";
    el.style.userSelect = "none";
  };

  const onPointerMove = (e: React.PointerEvent) => {
    if (!dragState.current.dragging || !railRef.current) return;
    const dx = e.clientX - dragState.current.startX;
    railRef.current.scrollLeft = dragState.current.scrollLeft - dx;
  };

  const onPointerUp = (e: React.PointerEvent) => {
    dragState.current.dragging = false;
    if (!railRef.current) return;
    railRef.current.releasePointerCapture(e.pointerId);
    railRef.current.style.cursor = "grab";
    railRef.current.style.userSelect = "";
  };

  /* Track active dot: scrollLeft / cardWidth — accurate once spacer exists */
  useEffect(() => {
    const el = railRef.current;
    if (!el) return;
    const onScroll = () => {
      const cw = cardWidthRef.current;
      if (cw > 0) setActiveIdx(Math.min(STEPS.length - 1, Math.round(el.scrollLeft / cw)));
    };
    el.addEventListener("scroll", onScroll, { passive: true });
    return () => el.removeEventListener("scroll", onScroll);
  }, []);

  /* Dot click: jump to i * cardWidth */
  const scrollTo = (i: number) => {
    const el = railRef.current;
    if (!el || cardWidthRef.current === 0) return;
    el.scrollTo({ left: i * cardWidthRef.current, behavior: "smooth" });
  };

  return (
    <div ref={sectionRef}>
      {/* Rail */}
      <div
        ref={railRef}
        onPointerDown={onPointerDown}
        onPointerMove={onPointerMove}
        onPointerUp={onPointerUp}
        onPointerLeave={onPointerUp}
        style={{
          display: "flex",
          overflowX: "auto",
          overflowY: "hidden",
          scrollSnapType: "x mandatory",
          WebkitOverflowScrolling: "touch",
          cursor: "grab",
          /* hide scrollbar */
          scrollbarWidth: "none",
          msOverflowStyle: "none",
          /* left border cap */
          borderTop: "1px solid rgba(129,140,248,0.08)",
          borderBottom: "1px solid rgba(129,140,248,0.08)",
        }}
        className="[&::-webkit-scrollbar]:hidden"
      >
        {STEPS.map((step, i) => (
          <ProcessCard
            key={step.num}
            step={step}
            index={i}
            railInView={isInView}
          />
        ))}
        {/* Trailing spacer — makes last card's snap point reachable */}
        <div ref={spacerRef} style={{ flexShrink: 0, minWidth: 0 }} aria-hidden />
      </div>

      {/* Dot nav + scroll hint */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: "1.5rem",
          marginTop: "2rem",
          paddingLeft: "0.25rem",
        }}
      >
        {/* Dots */}
        <div style={{ display: "flex", gap: "0.5rem", alignItems: "center" }}>
          {STEPS.map((_, i) => (
            <button
              key={i}
              onClick={() => scrollTo(i)}
              aria-label={`Go to step ${i + 1}`}
              style={{
                width: i === activeIdx ? "1.8rem" : "0.4rem",
                height: "0.4rem",
                borderRadius: "100px",
                background: i === activeIdx ? "#818cf8" : "rgba(129,140,248,0.25)",
                border: "none",
                cursor: "pointer",
                padding: 0,
                transition: "width 0.45s cubic-bezier(0.19,1,0.22,1), background 0.3s ease",
              }}
            />
          ))}
        </div>

        {/* Hint text */}
        <span
          className="font-mono"
          style={{
            fontSize: "0.48rem",
            letterSpacing: "0.32em",
            textTransform: "uppercase",
            color: "rgba(129,140,248,0.3)",
          }}
        >
          Drag or scroll →
        </span>
      </div>
    </div>
  );
}

/* ══════════════════════════════════════════════════════════════════
    MAIN PAGE
══════════════════════════════════════════════════════════════════ */
export default function LandingPage() {
  const pageRef = useRef<HTMLDivElement>(null);
  const [loaderDone, setLoaderDone] = useState(false);

  useEffect(() => {
    /* Unseen pattern: body[unresolved] opacity:0 → 1 after load */
    const t = setTimeout(() => setLoaderDone(true), 1400);
    return () => clearTimeout(t);
  }, []);

  useLayoutEffect(() => {
    const timer = setTimeout(() => {
      const ctx = gsap.context(() => {
        /* ── Section fade-ups: y:40→0, opacity, power3.out (≈ cubic-bezier(0.19,1,0.22,1)) ── */
        gsap.utils.toArray<HTMLElement>(".js-fade").forEach((el) => {
          gsap.fromTo(
            el,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              scrollTrigger: {
                trigger: el,
                start: "top 90%",
                toggleActions: "play none none none",
              },
            }
          );
        });

        /* ── Card grid stagger: 0.1s between each card, same easing ── */
        gsap.utils.toArray<HTMLElement>(".js-stagger-grid").forEach((grid) => {
          const cards = grid.querySelectorAll<HTMLElement>(".js-card");
          gsap.fromTo(
            cards,
            { opacity: 0, y: 40 },
            {
              opacity: 1,
              y: 0,
              duration: 0.9,
              ease: "power3.out",
              stagger: 0.1,
              scrollTrigger: {
                trigger: grid,
                start: "top 85%",
                toggleActions: "play none none none",
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
    <>
      <PageLoader done={loaderDone} />
    <div ref={pageRef} className="relative text-[#fafaf9] font-sans overflow-x-hidden" style={{ background: "var(--bg-base)", opacity: loaderDone ? 1 : 0, transition: "opacity 0.5s ease" }}>

      {/* ══ DYNAMIC ISLAND NAV ══════════════════════════════════════════ */}
      <PublicNav />


      {/* ══ HERO — Full viewport, peripheral layout (igloo + buttermax) ════ */}
      <section className="relative h-screen overflow-hidden" style={{ background: "var(--bg-base)" }}>

        {/* Three.js canvas — fills the stage */}
        <div className="absolute inset-0 z-0">
          <ThreeBackground />
          {/* Vignette: edges darken, centre opens up for 3D */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse 100% 75% at 50% 40%, transparent 0%, rgba(9,9,11,0.7) 70%, rgba(9,9,11,0.97) 100%)",
            }}
          />
          {/* Grain texture overlay — unseen.co style warmth */}
          <div
            className="absolute inset-0 pointer-events-none"
            style={{
              backgroundImage:
                "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
              backgroundSize: "200px 200px",
              opacity: 0.6,
              mixBlendMode: "overlay",
            }}
          />
        </div>

        {/* ── STATUS BADGE — top-right, below nav, igloo data aesthetic ── */}
        <motion.div
          className="absolute z-10"
          style={{ top: "5.5rem", right: "2.5rem" }}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 1.2, ease: EASE, delay: 1.0 }}
        >
          <div className="flex items-center gap-2">
            {/* Live pulse dot */}
            <span className="relative flex h-[6px] w-[6px]">
              <span
                className="absolute inline-flex h-full w-full rounded-full bg-[#818cf8] opacity-75"
                style={{ animation: "ping 1.8s cubic-bezier(0,0,0.2,1) infinite" }}
              />
              <span className="relative inline-flex rounded-full h-[6px] w-[6px] bg-[#818cf8]" />
            </span>
            <span
              className="font-mono uppercase"
              style={{ fontSize: "0.46rem", letterSpacing: "0.42em", color: "rgba(129,140,248,0.5)" }}
            >
              Platform Active
            </span>
          </div>
        </motion.div>

        {/* ── EYEBROW — top-left, below nav ───────────────────────────── */}
        <motion.div
          className="absolute left-0 z-10"
          style={{ top: "5.5rem", paddingLeft: "2.5rem" }}
          initial={{ opacity: 0, x: -12 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 1.3, ease: EASE, delay: 0.8 }}
        >
          <div className="flex items-center gap-3">
            <span className="block w-5 h-px" style={{ background: "rgba(129,140,248,0.35)" }} />
            <span
              className="font-mono uppercase"
              style={{ fontSize: "0.44rem", letterSpacing: "0.52em", color: "rgba(129,140,248,0.45)" }}
            >
              Direct Academic Mentorship
            </span>
          </div>
        </motion.div>

        {/* ── HEADLINE — bottom-left, both lines sit together in lower hero ── */}
        <div className="absolute left-0 z-10" style={{ bottom: "7rem", paddingLeft: "2.5rem", paddingRight: "2.5rem" }}>
          <h1
            className="font-display font-black"
            style={{ fontSize: "clamp(3rem, 9vw, 11rem)", color: "#fafaf9", letterSpacing: "-0.03em", lineHeight: 0.9 }}
          >
            <span className="block overflow-hidden">
              <motion.span
                className="block"
                initial={{ y: "110%" }}
                animate={loaderDone ? { y: 0 } : {}}
                transition={{ duration: 1.1, ease: EASE, delay: 0.1 }}
              >
                Scholar
              </motion.span>
            </span>
            <span className="block overflow-hidden">
              <motion.span
                className="block italic"
                style={{ color: "rgba(168,179,207,0.6)" }}
                initial={{ y: "110%" }}
                animate={loaderDone ? { y: 0 } : {}}
                transition={{ duration: 1.1, ease: EASE, delay: 0.22 }}
              >
                Collective.
              </motion.span>
            </span>
          </h1>
        </div>

        {/* ── BOTTOM BAR — anchored to viewport bottom ─────────────────── */}
        <div
          className="absolute left-0 right-0 z-10 flex items-end justify-between"
          style={{ bottom: "2rem", paddingLeft: "2.5rem", paddingRight: "2.5rem" }}
        >
          {/* Scroll indicator — left */}
          <motion.div
            className="flex items-end gap-2"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 2.2, duration: 0.9 }}
          >
            <div className="flex flex-col items-center gap-[3px]">
              {[16, 10, 6, 3].map((h, i) => (
                <div
                  key={i}
                  className="w-px rounded-full"
                  style={{
                    height: h,
                    background: "#818cf8",
                    opacity: 0.22 - i * 0.04,
                  }}
                />
              ))}
            </div>
            <span
              style={{
                writingMode: "vertical-rl",
                transform: "rotate(180deg)",
                fontSize: "0.36rem",
                letterSpacing: "0.3em",
                textTransform: "uppercase",
                color: "rgba(129,140,248,0.28)",
                fontFamily: "monospace",
              }}
            >
              Scroll
            </span>
          </motion.div>

          {/* Sub-copy + CTA — right */}
          <div className="flex flex-col items-end gap-4 text-right" style={{ maxWidth: "20rem" }}>
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ duration: 1.2, ease: EASE, delay: 1.5 }}
              className="font-light leading-relaxed"
              style={{ fontSize: "0.82rem", color: "rgba(168,179,207,0.5)" }}
            >
              Connecting ambitious students with verified professors for structured academic guidance.
            </motion.p>
            <motion.div
              initial={{ opacity: 0 }}
              animate={loaderDone ? { opacity: 1 } : {}}
              transition={{ duration: 0.9, ease: EASE, delay: 0.5 }}
            >
              {/* Unseen btn -- dual-layer content wipe */}
              <Link
                href="/signup"
                className="group relative inline-flex overflow-hidden pointer-events-auto z-50"
                style={{
                  padding: "0.55rem 1.4rem",
                  borderRadius: "100px",
                  border: "1px solid rgba(129,140,248,0.45)",
                  fontSize: "0.58rem",
                  fontWeight: 700,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "#818cf8",
                  flexDirection: "column",
                  lineHeight: 1,
                  background: "transparent",
                }}
              >
                {/* btn__content layer 1 — slides UP on hover */}
                <span
                  className="flex items-center gap-2 group-hover:-translate-y-[105%]"
                  style={{ transition: "transform 0.45s cubic-bezier(0.19,1,0.22,1)" }}
                >
                  Begin Journey <span>→</span>
                </span>
                {/* btn__content layer 2 — clone, starts below, slides in */}
                <span
                  aria-hidden
                  className="absolute inset-0 flex items-center justify-center gap-2 bg-[#818cf8] text-[#09090b] group-hover:translate-y-0"
                  style={{
                    transform: "translateY(102%)",
                    transition: "transform 0.45s cubic-bezier(0.19,1,0.22,1)",
                    borderRadius: "inherit",
                  }}
                >
                  Begin Journey <span>→</span>
                </span>
              </Link>
            </motion.div>
          </div>
        </div>

      </section>


      {/* ══ ABOUT / WHAT WE DO ════════════════════════════════════════════
          Mirrors Unseen's tight two-col layout: left = giant number/label,
          right = description text. Hairline top border, generous padding.
      ══════════════════════════════════════════════════════════════════ */}
      <section
        className="js-fade"
        style={{
          borderTop: "1px solid rgba(129,140,248,0.08)",
          padding: "5rem 2.5rem",
          display: "grid",
          gridTemplateColumns: "1fr 1fr",
          gap: "4rem",
          alignItems: "start",
        }}
      >
        {/* Left col */}
        <div>
          <FadeIn>
            <Label>What We Do</Label>
          </FadeIn>
          <SplitReveal
            as="h2"
            delay={0.08}
            className="font-display font-black tracking-tighter text-[#fafaf9]"
            style={{ fontSize: "clamp(2.5rem, 6vw, 7rem)", lineHeight: 0.88 }}
          >
            Academic mentorship, reimagined.
          </SplitReveal>
        </div>

        {/* Right col */}
        <div style={{ paddingTop: "4rem" }}>
          <FadeIn delay={0.15}>
            <p
              className="font-light leading-relaxed mb-8"
              style={{ fontSize: "1.05rem", color: "rgba(168,179,207,0.65)", maxWidth: "32rem" }}
            >
              Schollective bridges the gap between students seeking guidance and
              professors willing to share expertise. Every connection is verified,
              structured, and free from the noise of cold outreach.
            </p>
          </FadeIn>
          <FadeIn delay={0.25}>
            <p
              className="font-light leading-relaxed"
              style={{ fontSize: "0.9rem", color: "rgba(129,140,248,0.55)", borderLeft: "2px solid rgba(129,140,248,0.2)", paddingLeft: "1rem" }}
            >
              Students apply. Professors respond. Knowledge flows freely — across
              every discipline, every institution, every timezone.
            </p>
          </FadeIn>

          <FadeIn delay={0.35}>
            <div style={{ marginTop: "2.5rem" }}>
              <Link
                href="/about"
                className="group relative inline-flex overflow-hidden"
                style={{
                  fontSize: "0.6rem",
                  fontWeight: 600,
                  letterSpacing: "0.18em",
                  textTransform: "uppercase",
                  color: "rgba(168,179,207,0.6)",
                  textDecoration: "none",
                  paddingBottom: "2px",
                  borderBottom: "1px solid rgba(129,140,248,0.25)",
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "0.5rem",
                  transition: "color 0.3s ease, border-color 0.3s ease",
                }}
              >
                <span style={{ transition: "transform 0.45s cubic-bezier(0.19,1,0.22,1)" }}
                  className="group-hover:[transform:translateX(4px)]"
                >Learn more about us</span>
                <span className="group-hover:[transform:translateX(6px)]" style={{ transition: "transform 0.45s cubic-bezier(0.19,1,0.22,1)" }}>→</span>
              </Link>
            </div>
          </FadeIn>
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

      {/* ══ MARQUEE TICKER — igloo data-strip style ══════════════════════ */}
      <div
        className="relative overflow-hidden select-none"
        style={{
          borderTop: "1px solid rgba(129, 140, 248, 0.07)",
          borderBottom: "1px solid rgba(129, 140, 248, 0.07)",
          padding: "0.75rem 0",
        }}
      >
        <div
          className="flex whitespace-nowrap"
          style={{ animation: "marquee 40s linear infinite" }}
        >
          {Array.from({ length: 10 }).map((_, i) => (
            <span
              key={i}
              className="flex-shrink-0 font-mono uppercase px-12"
              style={{ fontSize: "0.42rem", letterSpacing: "0.52em", color: "rgba(129, 140, 248, 0.3)" }}
            >
              Mentorship_Network_v1 &nbsp;/&nbsp; No_Cold_Emails &nbsp;/&nbsp; Role_Verified &nbsp;/&nbsp; Structured_Growth &nbsp;/&nbsp; Free_Always &nbsp;/&nbsp;
            </span>
          ))}
        </div>
      </div>

      {/* ══ THE PROCESS — horizontal scroll rail ═════════════════════════ */}
      <section className="relative" style={{ padding: "7rem 0" }}>
        {/* Header — stays above the rail, normal padding */}
        <div style={{ paddingLeft: "2.5rem", paddingRight: "2.5rem", marginBottom: "3.5rem" }}>
          <FadeIn>
            <Label>The Process</Label>
          </FadeIn>

          <div style={{ display: "flex", alignItems: "flex-end", justifyContent: "space-between", gap: "2rem", flexWrap: "wrap" }}>
            <SplitReveal
              as="h2"
              className="font-display font-black tracking-tighter text-[#fafaf9]"
              style={{ fontSize: "clamp(3rem, 8vw, 9rem)", lineHeight: 0.85 }}
            >
              How it works.
            </SplitReveal>

            {/* Step count — right-aligned, Unseen data-label aesthetic */}
            <FadeIn delay={0.2}>
              <span
                className="font-mono"
                style={{
                  fontSize: "0.5rem",
                  letterSpacing: "0.35em",
                  textTransform: "uppercase",
                  color: "rgba(129,140,248,0.3)",
                  paddingBottom: "0.5rem",
                }}
              >
                {STEPS.length} steps
              </span>
            </FadeIn>
          </div>
        </div>

        {/* Horizontal rail — edge-to-edge, no padding so cards bleed */}
        <div style={{ paddingLeft: "2.5rem" }}>
          <HorizontalProcessRail />
        </div>
      </section>

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
              <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                <SchollectiveLogo size={44} />
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
    </>
  );
}
