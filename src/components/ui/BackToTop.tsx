"use client";

import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowUp } from "lucide-react";

export function BackToTop() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      setVisible(window.scrollY > 400);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const scrollToTop = () => {
    window.scrollTo({
      top: 0,
      behavior: "smooth",
    });
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.button
          key="back-to-top"
          initial={{ opacity: 0, scale: 0.8, y: 10 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.8, y: 10 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          onClick={scrollToTop}
          className="fixed bottom-[4.75rem] right-4 sm:bottom-8 sm:right-8 z-[900] group flex items-center justify-center w-11 h-11 rounded-full cursor-pointer transition-all duration-300 active:scale-95"
          style={{
            background: "rgba(255, 255, 255, 0.88)",
            backdropFilter: "blur(16px)",
            WebkitBackdropFilter: "blur(16px)",
            border: "1px solid rgba(79, 70, 229, 0.16)",
            boxShadow: "0 10px 25px -3px rgba(15, 23, 42, 0.08), 0 4px 6px -2px rgba(79, 70, 229, 0.05)",
          }}
          aria-label="Back to top"
          title="Back to top"
        >
          <ArrowUp
            size={18}
            className="text-indigo-600 transition-transform duration-300 group-hover:-translate-y-0.5"
            strokeWidth={2.2}
          />
        </motion.button>
      )}
    </AnimatePresence>
  );
}
