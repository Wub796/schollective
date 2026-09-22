"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

/**
 * PublicTemplate — a short cross-fade between public pages.
 *
 * This used to also animate `filter: blur(8px)`, scale the whole page down to
 * 0.97 and paint a full-screen `#fdfdfd` overlay that flashed to 85% opacity on
 * every navigation. Animating a filter over a full page forces a repaint of
 * everything beneath it, and the flash read as a glitch rather than a
 * transition — a page change needs to signal "new content", not call attention
 * to itself. What remains is a plain fade and a small lift.
 */
export default function PublicTemplate({
  children,
}: {
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const reduceMotion = useReducedMotion();

  if (reduceMotion) {
    return <div key={pathname}>{children}</div>;
  }

  return (
    <AnimatePresence mode="wait" initial={false}>
      <motion.div
        key={pathname}
        initial={{ opacity: 0, y: 12 }}
        animate={{ opacity: 1, y: 0, transition: { duration: 0.35, ease: EASE } }}
        exit={{ opacity: 0, transition: { duration: 0.18, ease: "easeIn" } }}
      >
        {children}
      </motion.div>
    </AnimatePresence>
  );
}
