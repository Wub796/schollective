"use client";

import React from "react";
import { motion, useScroll, useSpring } from "framer-motion";

export function ScrollProgress() {
  const { scrollYProgress } = useScroll();
  const scaleX = useSpring(scrollYProgress, {
    stiffness: 100,
    damping: 30,
    restDelta: 0.001,
  });

  return (
    <motion.div
      className="fixed top-0 left-0 right-0 h-[2.5px] z-[9999] origin-left pointer-events-none"
      style={{
        scaleX,
        background: "linear-gradient(90deg, #4f46e5 0%, #818cf8 50%, #06b6d4 100%)",
        boxShadow: "0 0 10px rgba(99, 102, 241, 0.6)",
      }}
    />
  );
}
