"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  AnimatePresence,
} from "framer-motion";

/* ─── Cursor context types ─────────────────────────────────────────────── */
type CursorMode = "default" | "hover-link" | "hover-button" | "hover-canvas" | "text";

function getMode(target: HTMLElement): CursorMode {
  if (target.tagName === "CANVAS") return "hover-canvas";
  if (target.tagName === "A" || target.closest("a") || target.classList.contains("cursor-pointer"))
    return "hover-link";
  if (target.tagName === "BUTTON" || target.closest("button")) return "hover-button";
  if (["P", "SPAN", "H1", "H2", "H3", "H4"].includes(target.tagName)) return "text";
  return "default";
}

/* ─── Buttermax-style spotlight blob — large, heavy spring lag ─────────── */
function SpotlightBlob({
  sourceX,
  sourceY,
  mode,
}: {
  sourceX: import("framer-motion").MotionValue<number>;
  sourceY: import("framer-motion").MotionValue<number>;
  mode: CursorMode;
}) {
  // Very heavy spring — lags far behind cursor like buttermax
  const x = useSpring(sourceX, { stiffness: 38, damping: 22, mass: 1.4 });
  const y = useSpring(sourceY, { stiffness: 38, damping: 22, mass: 1.4 });

  const isActive = mode === "hover-link" || mode === "hover-button";
  const size = isActive ? 700 : 520;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        width: size,
        height: size,
        borderRadius: "50%",
        background:
          "radial-gradient(circle, rgba(255,255,255,0.045) 0%, rgba(255,255,255,0.018) 35%, transparent 70%)",
        filter: "blur(32px)",
        willChange: "transform",
      }}
      animate={{ width: size, height: size }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    />
  );
}

/* ─── Precision dot at exact cursor position ───────────────────────────── */
function PrecisionDot({
  sourceX,
  sourceY,
  mode,
}: {
  sourceX: import("framer-motion").MotionValue<number>;
  sourceY: import("framer-motion").MotionValue<number>;
  mode: CursorMode;
}) {
  const isText = mode === "text";
  const isActive = mode === "hover-link" || mode === "hover-button";

  return (
    <motion.div
      className="absolute bg-white pointer-events-none"
      style={{
        x: sourceX,
        y: sourceY,
        translateX: "-50%",
        translateY: "-50%",
        mixBlendMode: "difference",
        zIndex: 2,
      }}
      animate={{
        width: isText ? 2 : isActive ? 8 : 5,
        height: isText ? 20 : isActive ? 8 : 5,
        borderRadius: isText ? 1 : 9999,
        opacity: 1,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    />
  );
}

/* ─── Medium-lag ring — sits between blob and dot ──────────────────────── */
function CursorRing({
  sourceX,
  sourceY,
  mode,
}: {
  sourceX: import("framer-motion").MotionValue<number>;
  sourceY: import("framer-motion").MotionValue<number>;
  mode: CursorMode;
}) {
  const x = useSpring(sourceX, { stiffness: 160, damping: 22 });
  const y = useSpring(sourceY, { stiffness: 160, damping: 22 });

  const isText   = mode === "text";
  const isActive = mode === "hover-link" || mode === "hover-button";
  const isCanvas = mode === "hover-canvas";

  const size    = isText ? 3 : isActive ? 56 : isCanvas ? 48 : 24;
  const filled  = isActive;

  return (
    <>
      <motion.div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          border: filled ? "none" : `1px solid rgba(255,255,255,${isCanvas ? 0.4 : 0.5})`,
          mixBlendMode: "difference",
          zIndex: 1,
        }}
        animate={{
          width: size,
          height: isText ? 22 : size,
          borderRadius: isText ? 2 : size / 2,
          backgroundColor: filled ? "rgba(255,255,255,1)" : "transparent",
          opacity: isText ? 0.7 : 1,
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Ripple on interactive elements */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="ripple"
            className="absolute rounded-full pointer-events-none"
            style={{
              x,
              y,
              translateX: "-50%",
              translateY: "-50%",
              border: "1px solid rgba(255,255,255,0.2)",
              zIndex: 1,
            }}
            initial={{ width: size, height: size, opacity: 0.6 }}
            animate={{ width: size * 2.4, height: size * 2.4, opacity: 0 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 1.2, ease: "easeOut", repeat: Infinity, repeatDelay: 0.1 }}
          />
        )}
      </AnimatePresence>
    </>
  );
}

/* ═══════════════════════════════════════════════════════════════════════
   MAIN EXPORT
═══════════════════════════════════════════════════════════════════════ */
export function CustomCursor() {
  const [mounted, setMounted]  = useState(false);
  const [isTouch, setIsTouch]  = useState(false);
  const [reducedMotion, setRm] = useState(false);
  const [mode, setMode]        = useState<CursorMode>("default");

  const rawX = useMotionValue<number>(-1000);
  const rawY = useMotionValue<number>(-1000);

  useEffect(() => {
    const touchCheck =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsTouch(touchCheck);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setRm(mq.matches);
    const mqH = (e: MediaQueryListEvent) => setRm(e.matches);
    mq.addEventListener("change", mqH);

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    const onOver = (e: MouseEvent) => setMode(getMode(e.target as HTMLElement));

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    setMounted(true);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      mq.removeEventListener("change", mqH);
    };
  }, [rawX, rawY]);

  if (!mounted || reducedMotion || isTouch) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block overflow-hidden">
      {/* Layer 1: Large spotlight blob (buttermax effect) */}
      <SpotlightBlob sourceX={rawX} sourceY={rawY} mode={mode} />

      {/* Layer 2: Medium-lag ring */}
      <CursorRing sourceX={rawX} sourceY={rawY} mode={mode} />

      {/* Layer 3: Sharp precision dot at exact position */}
      <PrecisionDot sourceX={rawX} sourceY={rawY} mode={mode} />
    </div>
  );
}
