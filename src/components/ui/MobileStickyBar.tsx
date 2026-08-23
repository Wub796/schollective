"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { SchollectiveLogo } from "@/components/ui/SchollectiveLogo";
import { motion, AnimatePresence } from "framer-motion";

export function MobileStickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Show when user scrolls past hero (e.g. > 350px)
      setVisible(window.scrollY > 350);
    };
    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 30 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="lg:hidden fixed bottom-4 left-4 right-4 z-40 p-2.5 px-4 rounded-2xl bg-white/90 dark:bg-slate-900/90 backdrop-blur-xl border border-slate-200/70 dark:border-slate-800 shadow-[0_12px_32px_rgba(15,23,42,0.12)] flex items-center justify-between gap-3"
        >
          <div className="flex items-center gap-2.5 min-w-0">
            <SchollectiveLogo size={22} />
            <div className="flex flex-col truncate">
              <span className="font-display font-bold text-xs text-slate-900 dark:text-slate-100 truncate">
                Schollective
              </span>
              <span className="text-[0.62rem] text-slate-500 dark:text-slate-400 truncate">
                Academic Mentorship
              </span>
            </div>
          </div>

          <Link
            href="/signup"
            className="shrink-0 inline-flex items-center justify-center rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[0.65rem] font-bold uppercase tracking-wider px-4 py-2 shadow-sm transition-transform active:scale-95 text-decoration-none"
          >
            Get Started →
          </Link>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
