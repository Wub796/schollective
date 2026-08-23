"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 120,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2.5px] pointer-events-none origin-left"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #4338ca 0%, #6366f1 50%, #818cf8 100%)",
        boxShadow: "0 0 8px rgba(99, 102, 241, 0.5)",
        zIndex: 99999,
      }}
      aria-hidden="true"
    />
  );
}
