"use client";

import React, { useEffect, useState, useRef } from "react";
import {
  motion,
  useSpring,
  useMotionValue,
  AnimatePresence,
  useMotionValueEvent,
} from "framer-motion";

/* ─── Cursor context types ─────────────────────────────────────────────── */
type CursorMode = "default" | "hover-link" | "hover-button" | "hover-canvas" | "text" | "hide";

type TargetRect = {
  x: number;
  y: number;
  width: number;
  height: number;
  radius: number;
  isNav?: boolean;
};

function getMode(target: HTMLElement): CursorMode {
  if (target.closest("[data-cursor-hide]")) return "hide";
  if (target.tagName === "CANVAS") return "hover-canvas";
  if (target.tagName === "BUTTON" || target.closest("button")) return "hover-button";
  if (
    target.tagName === "A" ||
    target.closest("a") ||
    target.classList.contains("cursor-pointer")
  )
    return "hover-link";
  if (["P", "SPAN", "H1", "H2", "H3", "H4"].includes(target.tagName)) return "text";
  return "default";
}

function getTargetRect(el: Element): TargetRect {
  const navItem = el.closest("[data-nav-item]");
  if (navItem) {
    const menuBar = navItem.closest("[data-menu-bar]");
    if (menuBar) {
      const itemRect = navItem.getBoundingClientRect();
      const menuRect = menuBar.getBoundingClientRect();
      const height = menuRect.height;
      const radius = height / 2;
      return {
        x: itemRect.left + itemRect.width / 2,
        y: menuRect.top + menuRect.height / 2,
        width: itemRect.width + 12,
        height: height,
        radius,
        isNav: true,
      };
    }
  }

  const rect = el.getBoundingClientRect();
  const computedStyle = window.getComputedStyle(el);
  const radiusStr = computedStyle.borderRadius;
  let radius = 8;
  if (radiusStr && radiusStr.includes("px")) {
    radius = parseFloat(radiusStr);
  } else if (radiusStr === "50%") {
    radius = Math.min(rect.width, rect.height) / 2;
  }
  return {
    x: rect.left + rect.width / 2,
    y: rect.top + rect.height / 2,
    width: rect.width,
    height: rect.height,
    radius,
  };
}

/* ─── Spotlight blob ────────────────────────────────────────────────────── */
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
      className="absolute pointer-events-none rounded-full blur-[80px]"
      style={{
        background: "var(--accent-glow)",
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

/* ─── Precision dot ─────────────────────────────────────────────────────── */
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
  const isButton = mode === "hover-button";

  if (mode === "hide" || isButton) return null;

  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{
        background: "var(--accent)",
        x: sourceX,
        y: sourceY,
        translateX: "-50%",
        translateY: "-50%",
        zIndex: 2,
      }}
      animate={{
        width: isText ? 2 : 5,
        height: isText ? 20 : 5,
        borderRadius: isText ? 1 : 9999,
        opacity: 1,
      }}
      transition={{ duration: 0.18, ease: "easeOut" }}
    />
  );
}

/* ─── Morphing cursor ring ──────────────────────────────────────────────── */
function CursorRing({
  sourceX,
  sourceY,
  mode,
  targetRect,
}: {
  sourceX: import("framer-motion").MotionValue<number>;
  sourceY: import("framer-motion").MotionValue<number>;
  mode: CursorMode;
  targetRect: TargetRect | null;
}) {
  // We track two separate positions: free-floating (follows mouse with spring)
  // and locked-to-button (snaps to button center).
  const hoverX = useMotionValue(0);
  const hoverY = useMotionValue(0);

  // Update position based on whether we're locked to a target or following cursor
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

  // When morphing to button: use stiff spring (snap fast). When free: use looser spring.
  const stiffness = targetRect ? 280 : 160;
  const damping = targetRect ? 30 : 22;

  const x = useSpring(hoverX, { stiffness, damping });
  const y = useSpring(hoverY, { stiffness, damping });

  const isText   = mode === "text";
  const isButton = mode === "hover-button";
  const isLink   = mode === "hover-link";
  const isCanvas = mode === "hover-canvas";

  if (mode === "hide") return null;

  // --- Geometry ---
  // Button: match the element's exact dimensions (zero padding so it sits on border)
  // Others: standard sizes
  let sizeX: number, sizeY: number, borderRadius: number;

  if (isButton && targetRect) {
    // Ring merges with button border — exact match, no extra padding
    sizeX = targetRect.width;
    sizeY = targetRect.height;
    borderRadius = targetRect.radius;
  } else if (targetRect) {
    // Link with engulf rect
    sizeX = targetRect.width + 16;
    sizeY = targetRect.height + 16;
    borderRadius = Math.min(sizeX, sizeY) / 2;
  } else {
    sizeX = isText ? 3 : isLink ? 56 : isCanvas ? 48 : 24;
    sizeY = isText ? 22 : sizeX;
    borderRadius = isText ? 2 : sizeX / 2;
  }

  const isNav = targetRect?.isNav || false;

  // --- Colors ---
  // Purple for button hover, neutral for everything else
  const borderColor = isButton
    ? "rgba(79, 70, 229, 0.9)"   // indigo-600
    : isCanvas
    ? "rgba(15, 23, 42, 0.4)"
    : "rgba(15, 23, 42, 0.5)";

  const boxShadow = isButton && isNav
    ? `0 0 0 1.5px rgba(79, 70, 229, 0.9), 0 0 18px rgba(79, 70, 229, 0.35), inset 0 0 12px rgba(79, 70, 229, 0.08)`
    : "none";

  const borderWidth = isButton ? "1.5px" : "1px";
  const border = isText || (isButton && !isNav) ? "none" : `${borderWidth} solid ${borderColor}`;

  return (
    <>
      <motion.div
        className="absolute pointer-events-none"
        style={{
          x,
          y,
          translateX: "-50%",
          translateY: "-50%",
          zIndex: 1,
        }}
        animate={{
          width: sizeX,
          height: sizeY,
          borderRadius,
          backgroundColor: "transparent",
          border,
          boxShadow,
          opacity: isText ? 0.7 : 1,
        }}
        transition={{
          // Geometry transitions: fast snap when morphing to button
          width:        { duration: isButton ? 0.22 : 0.28, ease: [0.22, 1, 0.36, 1] },
          height:       { duration: isButton ? 0.22 : 0.28, ease: [0.22, 1, 0.36, 1] },
          borderRadius: { duration: isButton ? 0.22 : 0.28, ease: [0.22, 1, 0.36, 1] },
          border:       { duration: isButton ? 0.18 : 0.28, ease: "easeOut" },
          boxShadow:    { duration: 0.3, ease: "easeOut" },
          opacity:      { duration: 0.2 },
        }}
      />

      {/* Ripple pulse on links */}
      <AnimatePresence>
        {isLink && !targetRect && (
          <motion.div
            key="ripple"
            className="absolute pointer-events-none"
            style={{
              x,
              y,
              translateX: "-50%",
              translateY: "-50%",
              border: "1px solid rgba(15, 23, 42, 0.3)",
              borderRadius: sizeX / 2,
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
  const [targetRect, setTargetRect] = useState<TargetRect | null>(null);
  const [isEnabled, setIsEnabled] = useState(true);

  const rawX = useMotionValue<number>(-1000);
  const rawY = useMotionValue<number>(-1000);

  // Track currently hovered button for live rect updates on scroll/resize
  const hoveredEl = useRef<Element | null>(null);

  // Sync isEnabled with localStorage and watch for live updates
  useEffect(() => {
    const checkPreference = () => {
      const pref = localStorage.getItem("schollective-custom-cursor");
      setIsEnabled(pref !== "false");
    };
    checkPreference();
    window.addEventListener("storage", checkPreference);
    return () => window.removeEventListener("storage", checkPreference);
  }, []);

  // Dynamically add custom-cursor-active class to HTML document to hide native cursor
  useEffect(() => {
    const shouldHide = mounted && !reducedMotion && !isTouch && isEnabled;
    if (shouldHide) {
      document.documentElement.classList.add("custom-cursor-active");
    } else {
      document.documentElement.classList.remove("custom-cursor-active");
    }
    return () => {
      document.documentElement.classList.remove("custom-cursor-active");
    };
  }, [mounted, reducedMotion, isTouch, isEnabled]);

  useEffect(() => {
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

      // Live-update rect position on mouse move (handles scroll drift)
      if (hoveredEl.current) {
        const rect = getTargetRect(hoveredEl.current);
        setTargetRect(rect);
      }
    };

    const onOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;

      const navEl = target.closest("[data-nav-item]");
      if (navEl) {
        setMode("hover-button");
        hoveredEl.current = navEl;
        setTargetRect(getTargetRect(navEl));
        return;
      }

      const newMode = getMode(target);
      setMode(newMode);

      if (newMode === "hover-button") {
        const el = target.closest("button, [role='button']");
        if (el) {
          hoveredEl.current = el;
          setTargetRect(getTargetRect(el));
          return;
        }
      } else if (newMode === "hover-link") {
        const el = target.closest("a, .cursor-pointer");
        if (el && el.closest("[data-cursor-engulf]")) {
          hoveredEl.current = el;
          setTargetRect(getTargetRect(el));
          return;
        }
      }

      hoveredEl.current = null;
      setTargetRect(null);
    };

    const onOut = (e: MouseEvent) => {
      const related = e.relatedTarget as HTMLElement | null;
      if (!related || !hoveredEl.current?.contains(related)) {
        hoveredEl.current = null;
        setTargetRect(null);
      }
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    window.addEventListener("mouseover", onOver, { passive: true });
    window.addEventListener("mouseout", onOut, { passive: true });
    setMounted(true);

    return () => {
      window.removeEventListener("mousemove", onMove);
      window.removeEventListener("mouseover", onOver);
      window.removeEventListener("mouseout", onOut);
      mq.removeEventListener("change", mqH);
    };
  }, [rawX, rawY]);

  if (!mounted || reducedMotion || isTouch || !isEnabled) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] overflow-hidden">
      <SpotlightBlob sourceX={rawX} sourceY={rawY} mode={mode} />
      <CursorRing sourceX={rawX} sourceY={rawY} mode={mode} targetRect={targetRect} />
      <PrecisionDot sourceX={rawX} sourceY={rawY} mode={mode} />
    </div>
  );
}
