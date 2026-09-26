"use client";

import React, { useEffect, useState } from "react";
import { motion, useReducedMotion } from "framer-motion";

/**
 * A ribbon of interlocking word bands — the hero graphic for a page whose
 * headline is a claim the words underneath are the answer to.
 *
 * The geometry is the one supplied by the site owner, and it is the point of the
 * component: bands alternate between a 60° shear squashed 2:1 and a bare 30°
 * tilt, so each band's slanted edges cross its neighbours' and the words
 * interlock down the column. That -30° is a Y-shear, so every word rides a
 * diagonal and overlaps the row above it; at this size the ends of the long
 * words are cut by the band below. That is the look, not a defect.
 *
 * What changed is everything around the geometry:
 *
 * · Framer Motion instead of GSAP. GSAP is not a dependency of this project and
 *   Framer Motion already is (Reveal, the page transition, the notification
 *   island), so the same slide is written with the animation runtime that is
 *   already in the bundle rather than adding a second one for one graphic.
 * · Sizes are numbers in px and every other dimension is derived from them —
 *   the band, the staircase offset, the hover distance — so the ribbon can be
 *   scaled to whatever column it is dropped into while holding its pitch. The
 *   supplied version also wrote `--md-font-size` and `--md-height` custom
 *   properties, but shipped no media query that read them, so its narrow-screen
 *   numbers did nothing at all. The pair is real here.
 * · Site tokens and type instead of `text-black dark:text-white`: this site is
 *   light-only and `text-ink` is what the rest of it is set in.
 *
 * The move, for whoever tunes it next: a band is a fixed-height box with
 * `overflow-hidden` holding the word at rest and the word after it directly
 * underneath. Hovering moves BOTH paragraphs up by exactly one band height, so
 * every band is replaced by its neighbour at once, 80ms apart down the column —
 * which reads as the stack stepping up rather than words swapping in place. The
 * lines chain in order — a line's `bottom` is the next line's `top` — so the
 * ribbon is one list sliding a notch, and the first band's `top` and the last
 * band's `bottom` are blank so it can slide into and out of itself.
 *
 * Decorative by construction: hidden from assistive tech, not a control, and its
 * copy is a set of words rather than a sentence to be read.
 */

/** The two words a band holds: the one at rest, and the one hover reveals. */
export interface LayeredTextLine {
  top: string;
  bottom: string;
}

const EASE: [number, number, number, number] = [0.33, 1, 0.68, 1];

/**
 * Sizes, in px. The band is 0.87 of the type size, as in the supplied 60/72
 * pair: a word is drawn into a box a little shorter than itself so the shear
 * crops it rather than leaving air. Everything else follows from these two
 * numbers.
 *
 * These are deliberately past what the hero's right column can hold. The column
 * is 344px wide from 1072 up — the text column beside it is pinned at 640px and
 * the container is capped at 64rem — so a ribbon that fits inside it is a small
 * graphic next to a 61px headline. At 58px the ribbon is 532px across: it runs
 * well past the column into the page margin, over empty space, and the hero
 * clips it on the x axis if it reaches the window edge rather than letting it
 * add a scrollbar. That overlap is the intent, not an accident.
 *
 * The step down at 1280 exists because the margin does: below it the window's
 * edge is close enough that the tall side would be cut mid-glyph. Below 768 the
 * ribbon is 24px, sized for a single-column slot rather than this hero, since
 * the hero does not show it at all down there.
 */
const SIZES = {
  /** Below 768px. */
  md: { fontSize: 32, lineHeight: 28 },
  /** 768–1279px. */
  lg: { fontSize: 40, lineHeight: 35 },
  /** 1280px and up. */
  xl: { fontSize: 58, lineHeight: 51 },
};

type Tier = keyof typeof SIZES;

/**
 * Which set of numbers is in force, at 768px and 1280px — the supplied
 * component's two sizes plus the one this hero needs.
 *
 * Resolved in JS rather than with a media query because the hover distance and
 * the band height have to follow whichever set is in force, and a custom
 * property cannot reach a Framer Motion transition.
 *
 * `xl` on the first render, which is also what the server renders, so hydration
 * cannot mismatch; the effect corrects it before paint on a smaller window.
 */
function useTier(): Tier {
  const [tier, setTier] = useState<Tier>("xl");

  useEffect(() => {
    const narrow = window.matchMedia("(max-width: 767px)");
    const wide = window.matchMedia("(min-width: 1280px)");
    const sync = () => setTier(narrow.matches ? "md" : wide.matches ? "xl" : "lg");
    sync();
    narrow.addEventListener("change", sync);
    wide.addEventListener("change", sync);
    return () => {
      narrow.removeEventListener("change", sync);
      wide.removeEventListener("change", sync);
    };
  }, []);

  return tier;
}

export function LayeredText({
  lines,
  fontSize,
  lineHeight,
  className = "",
}: {
  /** The chain. Each line's `bottom` should be the next line's `top`. */
  lines: LayeredTextLine[];
  /**
   * Override the type size in px, and the band it is drawn into. Leave both
   * unset to use the responsive pair, which is what a column-width slot wants.
   */
  fontSize?: number;
  lineHeight?: number;
  /**
   * Layout only. Padding here is also the hover target: a sheared band paints
   * well outside its own box, so a container tight to the text would be
   * hoverable only in the middle of the ribbon.
   */
  className?: string;
}) {
  const tier = useTier();
  const size = fontSize ?? SIZES[tier].fontSize;
  const band = lineHeight ?? SIZES[tier].lineHeight;

  const reduceMotion = useReducedMotion();
  const [hovered, setHovered] = useState(false);

  // The hover move is one band exactly, which is what lands the incoming word
  // where the outgoing one sat. Reduced motion keeps the swap and drops the
  // travel, the way the rest of the site does it: the state change is the point,
  // the 0.8s of movement is the decoration.
  const shift = hovered ? -band : 0;
  // How far each band sits from the middle of the ribbon — the supplied 35px
  // against its 60px band, kept proportional so the staircase holds its pitch as
  // the ribbon is scaled.
  const step = Math.round(band * 0.583);
  // The line box is a little shorter than the band, as in the original (55 of
  // 60), so a band crops just inside the glyphs instead of leaving air.
  const lineBox = Math.round(band * 0.92);
  const center = Math.floor(lines.length / 2);

  return (
    <div
      aria-hidden="true"
      className={`select-none ${className}`}
      onPointerEnter={() => setHovered(true)}
      onPointerLeave={() => setHovered(false)}
      style={{ fontSize: `${size}px` }}
    >
      <ul className="m-0 flex list-none flex-col items-center p-0">
        {lines.map((line, index) => (
          <li
            key={index}
            className="relative overflow-hidden"
            style={{
              height: `${band}px`,
              // Even bands are sheared across and squashed 2:1, odd bands are
              // only tilted; the pair repeating down the column is the interlock.
              transform: `translateX(${(index - center) * step}px) skew(${
                index % 2 === 0 ? "60deg, -30deg" : "0deg, -30deg"
              }) scaleY(${index % 2 === 0 ? "0.66667" : "1.33333"})`,
            }}
          >
            {[line.top, line.bottom].map((word, order) => (
              <motion.p
                key={order}
                className="m-0 whitespace-nowrap px-[10px] font-black uppercase tracking-[-0.02em] text-ink"
                style={{ height: `${band}px`, lineHeight: `${lineBox}px` }}
                initial={false}
                animate={{ y: shift }}
                transition={
                  reduceMotion
                    ? { duration: 0 }
                    : {
                        duration: 0.8,
                        ease: EASE,
                        // Staggered across the whole ribbon, two paragraphs to a
                        // band, so the cascade runs top to bottom.
                        delay: (index * 2 + order) * 0.08,
                      }
                }
              >
                {word}
              </motion.p>
            ))}
          </li>
        ))}
      </ul>
    </div>
  );
}
