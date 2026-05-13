"use client";

import React, { useEffect, useState } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  useTransform,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";

/* ─── Cursor context types ─────────────────────────────────────────────── */
type CursorMode = "default" | "hover-link" | "hover-button" | "hover-canvas" | "text" | "hide";

function getMode(target: HTMLElement): CursorMode {
  if (target.closest("[data-cursor-hide]")) return "hide";
  if (target.tagName === "CANVAS") return "hover-canvas";
  // Check for button first (more specific)
  if (target.tagName === "BUTTON" || target.closest("button")) return "hover-button";
  if (target.tagName === "A" || target.closest("a") || target.classList.contains("cursor-pointer"))
    return "hover-link";
  if (["P", "SPAN", "H1", "H2", "H3", "H4"].includes(target.tagName)) return "text";
  return "default";
}

/* ─── Spotlight blob (the buttermax background glow) ───────────────────── */
function SpotlightBlob({
  sourceX,
  sourceY,
  mode,
}: {
  sourceX: import("framer-motion").MotionValue<number>;
  sourceY: import("framer-motion").MotionValue<number>;
  mode: CursorMode;
}) {
  const x = useSpring(sourceX, { stiffness: 50, damping: 15 });
  const y = useSpring(sourceY, { stiffness: 50, damping: 15 });

  const isActive = mode === "hover-link";
  const size = isActive ? 700 : 520;

  if (mode === "hide") return null;

  return (
    <motion.div
      className="absolute bg-indigo-500/10 pointer-events-none rounded-full blur-[80px]"
      style={{
        x,
        y,
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 0,
      }}
      animate={{ width: size, height: size }}
      transition={{ duration: 0.8, ease: "easeOut" }}
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
  const isActive = mode === "hover-link";

  // Hide dot completely on elements that handle their own cursor
  if (mode === "hide") return null;

  return (
    <motion.div
      className="absolute bg-[#fafaf9] pointer-events-none"
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
  targetRect,
}: {
  sourceX: import("framer-motion").MotionValue<number>;
  sourceY: import("framer-motion").MotionValue<number>;
  mode: CursorMode;
  targetRect: { x: number; y: number; width: number; height: number; radius: number } | null;
}) {
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);

  useEffect(() => {
    if (targetRect) {
      hoverX.set(targetRect.x);
      hoverY.set(targetRect.y);
    }
  }, [targetRect, hoverX, hoverY]);

  useMotionValueEvent(sourceX, "change", (latest: number) => {
    if (!targetRect) hoverX.set(latest);
  });

  useMotionValueEvent(sourceY, "change", (latest: number) => {
    if (!targetRect) hoverY.set(latest);
  });

  const x = useSpring(hoverX, { stiffness: 160, damping: 22 });
  const y = useSpring(hoverY, { stiffness: 160, damping: 22 });

  const isText   = mode === "text";
  const isLink   = mode === "hover-link";
  const isButton = mode === "hover-button";
  const isCanvas = mode === "hover-canvas";
  const isActive = isLink;

  // Hide ring on elements that handle their own cursor
  if (mode === "hide") return null;

  // Size logic: if targetRect, match its size + padding. Otherwise fallback.
  const sizeX = targetRect ? targetRect.width + 16 : isText ? 3 : isLink ? 56 : isCanvas ? 48 : 24;
  const sizeY = targetRect ? targetRect.height + 16 : isText ? 22 : sizeX;
  const borderRadius = targetRect ? Math.min(targetRect.width + 16, targetRect.height + 16) / 2 : isText ? 2 : sizeX / 2;

  // Border colour:
  const borderColor = isButton
    ? "rgba(129, 140, 248, 0.85)"
    : isCanvas
    ? "rgba(250, 250, 249, 0.4)"
    : "rgba(250, 250, 249, 0.5)";

  return (
    <>
      <motion.div
        className="absolute pointer-events-none flex items-center justify-center"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          // Link uses difference blend; button uses normal so accent colour shows
          mixBlendMode: isButton ? "normal" : "difference",
          zIndex: 1,
        }}
        animate={{
          width: sizeX,
          height: sizeY,
          borderRadius: borderRadius,
          // Always keep background transparent — never fill
          backgroundColor: "transparent",
          // Border: thicker + dashed style for button to make it distinctive
          border: isButton
            ? `1.5px solid ${borderColor}`
            : isText
            ? "none"
            : `1px solid ${borderColor}`,
          opacity: isText ? 0.7 : 1,
          // Inner dot / cross for button mode
          boxShadow: isButton
            ? `0 0 12px rgba(129, 140, 248, 0.35), inset 0 0 8px rgba(129, 140, 248, 0.08)`
            : "none",
        }}
        transition={{ duration: 0.28, ease: [0.22, 1, 0.36, 1] }}
      />

      {/* Ripple on interactive elements */}
      <AnimatePresence>
        {isActive && (
          <motion.div
            key="ripple"
            className="absolute pointer-events-none"
            style={{
              x,
              y,
              translateX: "-50%",
              translateY: "-50%",
              border: isButton
                ? "1px solid rgba(129, 140, 248, 0.25)"
                : "1px solid rgba(250, 250, 249, 0.2)",
              borderRadius: borderRadius,
              zIndex: 1,
            }}
            initial={{ width: sizeX, height: sizeY, opacity: 0.6 }}
            animate={{ width: sizeX * 1.5, height: sizeY * 1.5, opacity: 0 }}
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
  const [targetRect, setTargetRect] = useState<{ x: number; y: number; width: number; height: number; radius: number } | null>(null);

  const rawX = useMotionValue<number>(-1000);
  const rawY = useMotionValue<number>(-1000);

  useEffect(() => {
    // A Chromebook has a touchscreen (maxTouchPoints > 0) AND a trackpad
    // (pointer: fine). We only want to suppress the custom cursor on
    // touch-*only* devices (phones/tablets with no fine pointer).
    const hasFinePointer =
      typeof window !== "undefined" &&
      window.matchMedia("(pointer: fine)").matches;
    const touchOnly =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0) &&
      !hasFinePointer;
    setIsTouch(touchOnly);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setRm(mq.matches);
    const mqH = (e: MediaQueryListEvent) => setRm(e.matches);
    mq.addEventListener("change", mqH);

    const onMove = (e: MouseEvent) => {
      rawX.set(e.clientX);
      rawY.set(e.clientY);
    };
    
    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const newMode = getMode(target);
      setMode(newMode);
      
      if (newMode === "hover-link" || newMode === "hover-button") {
        const el = target.closest("button, a, .cursor-pointer");
        if (el && el.closest("[data-cursor-engulf]")) {
          const rect = el.getBoundingClientRect();
          const computedStyle = window.getComputedStyle(el);
          const radiusStr = computedStyle.borderRadius;
          let radius = 8; // fallback
          if (radiusStr && radiusStr.includes("px")) {
             radius = parseFloat(radiusStr);
          } else if (radiusStr === "50%") {
             radius = Math.max(rect.width, rect.height);
          }
          setTargetRect({
            x: rect.left + rect.width / 2,
            y: rect.top + rect.height / 2,
            width: rect.width,
            height: rect.height,
            radius
          });
          return;
        }
      }
      setTargetRect(null);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    setMounted(true);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      mq.removeEventListener("change", mqH);
    };
  }, [rawX, rawY]);

  // Don't render on touch devices or when reduced motion is preferred
  // Note: we do NOT gate on screen width — a laptop with a small window still
  // has a fine pointer and should see the cursor. The CSS rule
  // `@media (pointer: fine) { * { cursor: none } }` handles hiding the
  // native cursor on any device that has a mouse/trackpad.
  if (!mounted || reducedMotion || isTouch) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      {/* Layer 1: Large spotlight blob (buttermax effect) */}
      <SpotlightBlob sourceX={rawX} sourceY={rawY} mode={mode} />

      {/* Layer 2: Medium-lag ring */}
      <CursorRing sourceX={rawX} sourceY={rawY} mode={mode} targetRect={targetRect} />

      {/* Layer 3: Sharp precision dot at exact position */}
      <PrecisionDot sourceX={rawX} sourceY={rawY} mode={mode} />
    </div>
  );
}
