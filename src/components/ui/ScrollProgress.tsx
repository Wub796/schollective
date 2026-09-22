"use client";

import { useEffect, useRef } from "react";

/**
 * ScrollProgress — a hairline reading indicator pinned to the top of the page.
 *
 * Previously this subscribed to `scroll` on both `window` and `document` *and*
 * ran a 60ms `setInterval`, so it recomputed position ~17 times a second even
 * when nothing had scrolled, then wrote `style.width` (a layout-triggering
 * property) on a 3px bar with a two-layer glow. One listener and a transform
 * gets the same result without the layout work or the polling.
 */
export function ScrollProgress() {
  const barRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    let frame = 0;

    const update = () => {
      frame = 0;
      const doc = document.documentElement;
      const max = doc.scrollHeight - window.innerHeight;
      const progress = max > 0 ? Math.min(1, Math.max(0, window.scrollY / max)) : 0;
      if (barRef.current) {
        barRef.current.style.transform = `scaleX(${progress})`;
      }
    };

    const onScroll = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(update);
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll, { passive: true });
    update();

    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
      if (frame) window.cancelAnimationFrame(frame);
    };
  }, []);

  return (
    <div
      ref={barRef}
      aria-hidden="true"
      className="fixed inset-x-0 top-0 h-0.5 origin-left bg-accent"
      style={{ transform: "scaleX(0)", zIndex: "var(--z-toast)" } as React.CSSProperties}
    />
  );
}
