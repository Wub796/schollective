"use client";

import React, { useEffect, useState } from "react";
import { motion, useSpring, useMotionValue } from "framer-motion";

export function CustomCursor() {
  const [mounted, setMounted] = useState(false);
  const [isHovering, setIsHovering] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const [isTouch, setIsTouch] = useState(false);

  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);

  // Tight spring for dot, loose spring for ring
  const ringX = useSpring(mouseX, { stiffness: 120, damping: 18 });
  const ringY = useSpring(mouseY, { stiffness: 120, damping: 18 });

  useEffect(() => {
    const touchCheck =
      typeof window !== "undefined" &&
      ("ontouchstart" in window || navigator.maxTouchPoints > 0);
    setIsTouch(touchCheck);

    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReducedMotion(mq.matches);
    const handler = (e: MediaQueryListEvent) => setReducedMotion(e.matches);
    mq.addEventListener("change", handler);

    const handleMouseMove = (e: MouseEvent) => {
      mouseX.set(e.clientX);
      mouseY.set(e.clientY);
    };

    const handleMouseOver = (e: MouseEvent) => {
      const target = e.target as HTMLElement;
      const clickable =
        target.tagName === "A" ||
        target.tagName === "BUTTON" ||
        target.closest("a") ||
        target.closest("button") ||
        target.classList.contains("cursor-pointer");
      setIsHovering(!!clickable);
    };

    window.addEventListener("mousemove", handleMouseMove);
    window.addEventListener("mouseover", handleMouseOver);
    setMounted(true);

    return () => {
      window.removeEventListener("mousemove", handleMouseMove);
      window.removeEventListener("mouseover", handleMouseOver);
      mq.removeEventListener("change", handler);
    };
  }, [mouseX, mouseY]);

  if (!mounted || reducedMotion || isTouch) return null;

  return (
    <div className="fixed inset-0 pointer-events-none z-[9999] hidden md:block">
      {/* Dot — off-white, mix-blend-mode for maximum visibility */}
      <motion.div
        className="absolute w-[5px] h-[5px] rounded-full"
        style={{
          x: mouseX,
          y: mouseY,
          translateX: "-50%",
          translateY: "-50%",
          backgroundColor: "#e8e8e6",
          mixBlendMode: "difference",
        }}
      />
      {/* Ring — trails with spring physics */}
      <motion.div
        className="absolute rounded-full"
        animate={{
          width: isHovering ? 44 : 28,
          height: isHovering ? 44 : 28,
          borderColor: isHovering
            ? "rgba(232,232,230,0.9)"
            : "rgba(232,232,230,0.35)",
          backgroundColor: isHovering
            ? "rgba(232,232,230,0.04)"
            : "rgba(232,232,230,0)",
        }}
        style={{
          x: ringX,
          y: ringY,
          translateX: "-50%",
          translateY: "-50%",
          border: "1px solid",
          mixBlendMode: "difference",
        }}
        transition={{ duration: 0.18, ease: "easeOut" }}
      />
    </div>
  );
}
