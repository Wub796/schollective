"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";

export function MobileStickyBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      // Reveal after user scrolls past the top hero section (approx 380px)
      setVisible(window.scrollY > 380);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          key="mobile-sticky-bar"
          initial={{ y: "100%", opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: "100%", opacity: 0 }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
          className="fixed bottom-0 left-0 right-0 z-[890] lg:hidden p-3 px-4 pb-[max(0.85rem,env(safe-area-inset-bottom))]"
          style={{
            background: "rgba(255, 255, 255, 0.92)",
            backdropFilter: "blur(20px)",
            WebkitBackdropFilter: "blur(20px)",
            borderTop: "1px solid rgba(15, 23, 42, 0.08)",
            boxShadow: "0 -10px 30px rgba(15, 23, 42, 0.08)",
          }}
        >
          <div className="flex items-center justify-between gap-3 max-w-lg mx-auto">
            <div className="flex flex-col min-w-0">
              <span className="font-display font-bold text-xs text-slate-900 tracking-tight truncate">
                Schollective
              </span>
              <span className="font-sans text-[0.66rem] text-slate-500 font-medium truncate">
                Academic Mentorship
              </span>
            </div>

            <div className="flex items-center gap-2 shrink-0">
              <Link
                href="/login"
                className="px-3.5 py-2 rounded-full border border-slate-200/80 text-[0.7rem] font-bold text-slate-700 bg-white/70 hover:bg-white transition-all select-none"
              >
                Log In
              </Link>
              <Link
                href="/signup"
                className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-700 text-white text-[0.7rem] font-bold uppercase tracking-wider shadow-[0_4px_14px_rgba(79,70,229,0.32)] active:scale-95 transition-all select-none"
              >
                Get Started →
              </Link>
            </div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
