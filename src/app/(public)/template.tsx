"use client";

import { usePathname } from "next/navigation";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";

const EASE: [number, number, number, number] = [0.25, 1, 0.5, 1];

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
        initial={{
          opacity: 0,
          y: 40,
          scale: 0.97,
          filter: "blur(8px)",
        }}
        animate={{
          opacity: 1,
          y: 0,
          scale: 1,
          filter: "blur(0px)",
          transition: {
            duration: 0.6,
            ease: EASE,
            filter: { duration: 0.5, ease: "easeOut" },
          },
        }}
        exit={{
          opacity: 0,
          y: -20,
          scale: 0.98,
          transition: {
            duration: 0.25,
            ease: [0.55, 0, 1, 0.45],
          },
        }}
      >
        {/* Full-screen flash overlay nested inside the page key so it doesn't
            create a second animating child in AnimatePresence */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: [0, 0.85, 0] }}
          transition={{ duration: 0.7, ease: "easeInOut", times: [0, 0.3, 1] }}
          className="fixed inset-0 z-[9998] pointer-events-none"
          style={{ background: "#fdfdfd" }}
        />
        {children}
      </motion.div>
    </AnimatePresence>
  );
}