"use client";

/**
 * The entrance the auth screens share.
 *
 * It moves, and it does not fade. That is the whole point of the module:
 * Framer Motion resolves its `initial` state during server rendering, so a
 * variant starting at `opacity: 0` ships a blank page. The element only becomes
 * visible once the bundle has loaded, hydrated, and run the animation — and on
 * the login and signup screens, whose only job is to be filled in, a blank
 * first paint reads as "the site is broken", which is exactly how it was
 * reported. A slide has no such failure mode: if it runs late, or never runs,
 * the form is still legible, just a few pixels low.
 *
 * These pages used to carry five byte-identical copies of this pair, which is
 * how they would have drifted apart. They import it instead.
 */

export const EASE_SOFT: [number, number, number, number] = [0.22, 1, 0.36, 1];

/** One block of a form: rises into place, always visible. */
export const riseIn = {
  hidden: { y: 20 },
  show: { y: 0, transition: { duration: 0.7, ease: EASE_SOFT } },
};

/** The container that sequences its `riseIn` children. */
export const staggerChildren = {
  hidden: {},
  show: { transition: { staggerChildren: 0.08, delayChildren: 0.04 } },
};
