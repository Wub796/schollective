"use client";

import { useEffect } from "react";
import Lenis from "lenis";

/**
 * SmoothScroll — Lenis, mounted only on the marketing pages.
 *
 * Why not the root layout: the signed-in shell owns its own scrollers
 * (`AdminShell` measures `main.scrollTop`) and two components drive their own
 * eased jumps — `ProfileSectionNav` and the onboarding tour both call
 * `scrollIntoView({ behavior: "smooth" })`. Leaving those alone means they keep
 * their native behaviour and do not each pay for an animation loop that only
 * matters on a page whose whole job is to be read top to bottom. So the two
 * mount sites are the landing page and the `(public)` layout, and nothing else.
 *
 * Why the config is this small — the defaults do more than they look like they
 * do, and each omission here is deliberate:
 *
 * - `autoRaf` is `false` by default in Lenis 1.3, so without it nothing moves.
 * - `respectReducedMotion` is already `true` by default and is read live off
 *   the media query rather than only at construction, so a visitor who turns
 *   the setting on mid-session stops being smoothed without a reload. Setting
 *   it again here would only be noise.
 * - `anchors` is left off. Its click handler does not call `preventDefault`,
 *   so the browser's own jump still runs and wins; switching it on would buy
 *   nothing and would additionally smooth-scroll the `#main-content` skip link,
 *   which should stay an instant jump for someone navigating by keyboard.
 * - No `scroll-behavior` override is needed either, which is worth stating
 *   because older Lenis releases shipped one in `lenis.css` and 1.3 does not.
 *   Lenis performs its own writes as `scrollTo({ behavior: "instant" })`,
 *   which outranks the `scroll-behavior: smooth` this project sets on `html`.
 *
 * Renders nothing. A wrapper element would land inside the pages' own layout
 * boxes and change their grid, and a wrapping client component would move the
 * server-rendered page content behind a client boundary for no reason.
 */
export function SmoothScroll() {
  useEffect(() => {
    // Resets the instance when the route changes, so the next page does not
    // start life mid-glide from wherever the last one was scrolled to.
    const lenis = new Lenis({ autoRaf: true, stopInertiaOnNavigate: true });
    return () => lenis.destroy();
  }, []);

  return null;
}
