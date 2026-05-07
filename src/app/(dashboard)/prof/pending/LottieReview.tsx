"use client";

import React, { useEffect, useRef } from "react";

export function LottieReview() {
  const containerRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let lottieInstance: any;
    
    const initLottie = async () => {
      const lottie = (await import("lottie-web")).default;
      if (containerRef.current) {
        lottieInstance = lottie.loadAnimation({
          container: containerRef.current,
          renderer: "svg",
          loop: true,
          autoplay: true,
          animationData: {
            v: '5.9.0', fr: 60, ip: 0, op: 240, w: 200, h: 200, nm: 'review-orbit', ddd: 0, assets: [],
            layers: [
              // Subtle outer ring (Sage)
              { ddd: 0, ind: 1, ty: 4, nm: 'ring-1', sr: 1, bm: 0, ks: { o: { a: 0, k: 15 }, r: { a: 1, k: [{ t: 0, s: [0], e: [360] }, { t: 240, s: [360] }] }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 0, k: [100, 100, 100] } }, shapes: [{ ty: 'el', s: { a: 0, k: [160, 160] }, p: { a: 0, k: [0, 0] } }, { ty: 'st', c: { a: 0, k: [0.239, 0.478, 0.416, 1] }, o: { a: 0, k: 100 }, w: { a: 0, k: 1 }, lc: 2, lj: 2, d: [{ n: 'd', v: { a: 0, k: 8 } }, { n: 'g', v: { a: 0, k: 20 } }] }], ip: 0, op: 240, st: 0 },
              // Pulsing center dot (Amber)
              { ddd: 0, ind: 2, ty: 4, nm: 'dot', sr: 1, bm: 0, ks: { o: { a: 0, k: 100 }, r: { a: 0, k: 0 }, p: { a: 0, k: [100, 100, 0] }, a: { a: 0, k: [0, 0, 0] }, s: { a: 1, k: [{ t: 0, s: [100, 100], e: [130, 130] }, { t: 120, s: [130, 130], e: [100, 100] }, { t: 240, s: [100, 100] }] } }, shapes: [{ ty: 'el', s: { a: 0, k: [32, 32] }, p: { a: 0, k: [0, 0] } }, { ty: 'fl', c: { a: 0, k: [0.831, 0.573, 0.165, 1] }, o: { a: 0, k: 100 }, r: 1 }], ip: 0, op: 240, st: 0 }
            ]
          }
        });
        lottieInstance.setSpeed(0.5);
      }
    };

    initLottie();

    return () => {
      if (lottieInstance) lottieInstance.destroy();
    };
  }, []);

  return <div ref={containerRef} className="w-48 h-48 mx-auto filter drop-shadow-[0_0_15px_rgba(212,146,42,0.15)]" />;
}
