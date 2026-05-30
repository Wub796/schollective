"use client";

import React from "react";
import dynamic from "next/dynamic";

const ThreeBackground = dynamic(
  () => import("@/components/ui/ThreeBackground").then(m => m.ThreeBackground),
  { ssr: false }
);

export function AnimatedBackground() {
  return (
    <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
      <ThreeBackground />

      {/* Animated Orb Background */}
      <div className="absolute inset-0 pointer-events-none">
        <div className="absolute -top-[20%] -left-[10%] w-[50%] h-[50%] rounded-full bg-purple-500/20 blur-[120px] animate-pulse" />
        <div className="absolute top-[30%] -right-[10%] w-[40%] h-[60%] rounded-full bg-purple-400/20 blur-[120px] animate-pulse" style={{ animationDelay: "2s" }} />
        <div className="absolute -bottom-[20%] left-[20%] w-[60%] h-[50%] rounded-full bg-fuchsia-500/15 blur-[120px] animate-pulse" style={{ animationDelay: "4s" }} />
      </div>

      {/* Soft gradient overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{ background: "radial-gradient(ellipse 100% 75% at 50% 40%, transparent 0%, rgba(253, 253, 253, 0.7) 70%, var(--bg-base) 100%)" }} />

      {/* Noise texture overlay */}
      <div className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: "url(\"data:image/svg+xml,%3Csvg viewBox='0 0 200 200' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)' opacity='0.04'/%3E%3C/svg%3E\")",
          backgroundSize: "200px 200px", opacity: 0.6, mixBlendMode: "overlay",
        }} />
    </div>
  );
}
