"use client";

import React, { useRef } from "react";
import { motion, useInView, useReducedMotion } from "framer-motion";

/**
 * Shared building blocks for the public pages.
 *
 * These used to be copy-pasted per page, and the pages drifted: by the time it
 * was noticeable, the landing page set its section headings at 1.7–2.3rem while
 * About, Features, For Students and For Faculty set theirs at up to 3.5rem
 * beside a 4.65rem h1 — a heading scale that read as a second title rather than
 * a step down. The sub-pages also wrapped every list item in its own rounded
 * card, and each section carried a hand-written `9rem` of vertical padding, so
 * the rhythm changed page to page while the landing page's did not.
 *
 * Everything structural now lives here: one section shell, one heading scale,
 * one hairline list, one accent band. A page composes them and adds copy.
 */

const EASE: [number, number, number, number] = [0.22, 1, 0.36, 1];

export function Reveal({
  children,
  delay = 0,
  className = "",
}: {
  children: React.ReactNode;
  delay?: number;
  className?: string;
}) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-6%" });
  const reduceMotion = useReducedMotion();

  // Position only, never opacity. Framer Motion resolves its `initial` state
  // during server rendering, so an `opacity: 0` start ships a page that is
  // blank until the bundle has loaded, hydrated and animated — and if any of
  // that is slow, every revealed block on the page is invisible at once. A rise
  // can be late without hiding anything.
  return (
    <motion.div
      ref={ref}
      initial={reduceMotion ? { y: 0 } : { y: 24 }}
      animate={inView ? { y: 0 } : undefined}
      transition={{ duration: 0.7, ease: EASE, delay }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

/** Small uppercase label above a heading. Plain text on a rule, not a pill. */
export function Eyebrow({ children }: { children: React.ReactNode }) {
  return (
    <p className="mb-5 font-sans text-[0.68rem] font-bold uppercase tracking-[0.18em] text-ink-mute">
      {children}
    </p>
  );
}

/**
 * The page hero: eyebrow, title, one paragraph, optional actions, optional
 * graphic in the space beside the title.
 *
 * Left-aligned on the same grid as the body, because a page whose hero is
 * centred and whose sections are centred has no alignment at all — every
 * element agrees with every other one, so nothing leads.
 *
 * `aside` is the second column, and it is deliberately not a free-form slot:
 * the text column is pinned at the title's own 40rem, so adding one moves the
 * title by nothing. It is placed at `lg`, where the 1024px container finally
 * has a column left over once the title has taken its 640px — below that there
 * is no empty space to put anything in, and the hero stays exactly what it was.
 */
export function PageHero({
  eyebrow,
  title,
  lede,
  children,
  aside,
}: {
  eyebrow?: React.ReactNode;
  title: React.ReactNode;
  lede?: React.ReactNode;
  children?: React.ReactNode;
  /** Sits right of the title at `lg` and up. Hidden below it. */
  aside?: React.ReactNode;
}) {
  return (
    // `overflow-x-clip` only when there is an `aside`: the graphic in that
    // column is allowed to be as wide as the space plus the gutter, and this
    // stops a wide one from giving the page a horizontal scrollbar. One axis
    // only, so nothing about the hero's height changes.
    <section
      className={`px-6 pt-36 pb-16 md:pt-44 md:pb-20${aside ? " overflow-x-clip" : ""}`}
    >
      <div
        className={`mx-auto w-full max-w-5xl${
          aside ? " lg:grid lg:grid-cols-[minmax(0,40rem)_minmax(0,1fr)] lg:items-center lg:gap-10" : ""
        }`}
      >
        <div>
          {eyebrow ? <Eyebrow>{eyebrow}</Eyebrow> : null}
          <Reveal>
            <h1 className="max-w-[40rem] font-display text-[clamp(2.4rem,5.2vw,3.8rem)] font-black leading-[1.06] tracking-[-0.035em] text-ink text-pretty">
              {title}
            </h1>
          </Reveal>
          {lede ? (
            <Reveal delay={0.1}>
              <p className="mt-6 max-w-xl text-[1.05rem] leading-relaxed text-ink-soft text-pretty">{lede}</p>
            </Reveal>
          ) : null}
          {children ? (
            <Reveal delay={0.15}>
              <div className="mt-9 flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div>
            </Reveal>
          ) : null}
        </div>
        {aside ? <div className="hidden lg:block">{aside}</div> : null}
      </div>
    </section>
  );
}

/** The standard section: one vertical rhythm and one container for every page. */
export function PageSection({
  children,
  id,
  rule = true,
  className = "",
}: {
  children: React.ReactNode;
  id?: string;
  rule?: boolean;
  className?: string;
}) {
  return (
    <section
      id={id}
      className={`relative px-6 py-20 md:py-28 ${rule ? "border-t border-line" : ""} ${className}`}
    >
      <div className="mx-auto w-full max-w-5xl">{children}</div>
    </section>
  );
}

/**
 * The section heading scale: 1.6–2.2rem, one step below the page title.
 *
 * `text-balance` rather than `text-pretty` because these are two to eight words
 * on one or two lines, and an unbalanced break there is very visible.
 */
export function SectionHeading({
  children,
  className = "",
}: {
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <h2
      className={`max-w-3xl font-display text-[clamp(1.6rem,2.9vw,2.2rem)] font-bold leading-[1.15] tracking-[-0.02em] text-ink text-balance ${className}`}
    >
      {children}
    </h2>
  );
}

export interface RowItem {
  /** Numbered marker, e.g. "01". Optional: not every list is a sequence. */
  n?: string;
  /** Small leading mark, usually a Lucide icon. */
  icon?: React.ReactNode;
  title: string;
  body: string;
}

/**
 * A list on hairlines.
 *
 * This replaces the card-per-item treatment: one bordered, shadowed, rounded
 * box holding a title and a sentence, repeated eight times down a page, reads as
 * a form rather than a page, and it hides the sequence that numbered items are
 * meant to show.
 */
export function RowList({
  items,
  columns = 2,
  accent = false,
  className = "",
}: {
  items: RowItem[];
  columns?: 1 | 2 | 3;
  /** Draw the rule above each item in the accent colour instead of the hairline. */
  accent?: boolean;
  /** Spacing is the caller's: `mt-10` under a heading, `mt-0` inside a grid column. */
  className?: string;
}) {
  const grid = columns === 1 ? "" : columns === 2 ? "md:grid-cols-2 md:gap-x-12" : "md:grid-cols-3 md:gap-x-10";
  const rule = accent ? "border-t-2 border-accent" : "border-t border-line";

  return (
    <ol className={`m-0 grid list-none gap-0 p-0 ${grid} ${className}`}>
      {items.map((item, index) => (
        <Reveal key={item.title} delay={Math.min(index * 0.04, 0.2)}>
          <li className={`h-full ${rule} py-6`}>
            {item.n ? (
              <span className="font-mono text-[0.7rem] font-semibold tracking-[0.14em] text-accent">{item.n}</span>
            ) : null}
            {item.icon ? <span className="block text-accent">{item.icon}</span> : null}
            <h3 className={`font-display text-[1.12rem] font-semibold leading-snug tracking-[-0.01em] text-ink ${item.n || item.icon ? "mt-2.5" : ""}`}>
              {item.title}
            </h3>
            <p className="mt-2 max-w-[34rem] text-[0.92rem] leading-relaxed text-ink-soft text-pretty">{item.body}</p>
          </li>
        </Reveal>
      ))}
    </ol>
  );
}

/**
 * The page's one full-bleed moment: the claim the page is actually making.
 *
 * Used at most once per page. The old pages closed with a tinted rounded card
 * instead, which is the same shape as everything else on the page, so the
 * closing argument looked like one more section.
 */
export function AccentBand({
  icon,
  title,
  body,
  children,
}: {
  icon?: React.ReactNode;
  title: React.ReactNode;
  body?: React.ReactNode;
  children?: React.ReactNode;
}) {
  return (
    <section className="bg-accent px-6 py-16 text-white md:py-20">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-6 md:flex-row md:items-start md:gap-12">
        {icon ? <span className="shrink-0 text-white/90">{icon}</span> : null}
        <div className="max-w-3xl">
          <h2 className="font-display text-[clamp(1.5rem,2.7vw,2rem)] font-bold leading-[1.2] tracking-[-0.02em] text-white text-balance">
            {title}
          </h2>
          {body ? (
            <p className="mt-4 text-[0.95rem] leading-relaxed text-white/85 text-pretty">{body}</p>
          ) : null}
          {children ? <div className="mt-8 flex flex-wrap items-center gap-x-6 gap-y-3">{children}</div> : null}
        </div>
      </div>
    </section>
  );
}
