"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Shared building blocks for the public marketing pages.
 *
 * `Reveal` and `Eyebrow` used to be copy-pasted into about, features,
 * for-students and for-professors — four byte-identical copies of the same
 * scroll-reveal, which is how the pages drifted apart in the first place. They
 * live here instead, so a change to the reveal or the eyebrow treatment lands
 * everywhere at once.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6%" });
  const reduceMotion = useReducedMotion();

  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { opacity: 1 } : { opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : undefined}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Small uppercase label above a heading. Plain text on a rule, not a pill. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-mute">
      {children}
    </p>
  );
}
