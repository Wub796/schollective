/**
 * PageBackground — the site's ambient backdrop.
 *
 * This used to be `AnimatedBackground`: a dynamically imported Three.js particle
 * field, three `animate-pulse` blur orbs and an SVG fractal-noise overlay, all
 * layered under a wash that faded most of them back out. Four ambient loops for
 * one flat cream page — they competed with each other, cost a WebGL context and
 * a ~150kB library on every public and auth route, and none of them carried any
 * information. What is left is the one thing that was doing work: a quiet wash
 * that lifts the top of the viewport off the page ground.
 *
 * Static by construction, so there is no reduced-motion path to forget.
 */
export function PageBackground() {
  return <div className="page-wash" aria-hidden="true" />;
}
