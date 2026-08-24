"use client";

import { useEffect } from "react";

export function ScrollProgress() {
  useEffect(() => {
    let prev = -1;

    const tick = () => {
      const y = window.scrollY || document.documentElement.scrollTop || document.body.scrollTop || 0;
      const max = document.documentElement.scrollHeight - window.innerHeight || 1;
      const p = Math.max(0, Math.min(100, (y / max) * 100));

      if (p !== prev) {
        prev = p;
        const bar = document.getElementById("scroll-progress-bar");
        if (bar) bar.style.width = p + "%";
      }
    };

    window.addEventListener("scroll", tick, { passive: true });
    document.addEventListener("scroll", tick, { passive: true });
    const id = setInterval(tick, 60);
    tick();

    return () => {
      window.removeEventListener("scroll", tick);
      document.removeEventListener("scroll", tick);
      clearInterval(id);
    };
  }, []);

  return (
    <div
      id="scroll-progress-bar"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        height: "3px",
        width: "0%",
        background: "linear-gradient(90deg, #4f46e5 0%, #818cf8 50%, #a5b4fc 100%)",
        boxShadow: "0 0 12px rgba(79, 70, 229, 0.8), 0 0 24px rgba(99, 102, 241, 0.4)",
        zIndex: 999999,
        pointerEvents: "none",
        borderRadius: "0 2px 0 0",
      }}
      aria-hidden="true"
    />
  );
}