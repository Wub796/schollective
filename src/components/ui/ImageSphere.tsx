"use client";

import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import Image from "next/image";
import { createPortal } from "react-dom";
import { X } from "lucide-react";
import { useReducedMotion } from "framer-motion";

/**
 * A draggable sphere of faces: images placed on the surface by Fibonacci
 * distribution, sized by how far they are from the middle and how deep they are,
 * and faded out as they rotate behind the silhouette.
 *
 * Adapted from the SphereImageGrid component supplied by the site owner. The
 * distribution, the projection and the collision pass are theirs and are
 * unchanged; what changed is everything around them, because the supplied
 * version was written as a demo:
 *
 * · The animation loop only runs when it has something to do. The original
 *   started a `requestAnimationFrame` on mount that never stopped, and each
 *   frame called `setVelocity` AND `setRotation`, so the component re-rendered
 *   twice per frame, sixty times a second, whether or not anything was moving
 *   and whether or not it was on screen. Here one frame writes one state value,
 *   the loop stops itself the moment the momentum is spent, and it does not
 *   start at all until the sphere has scrolled into view.
 * · Pointer Events instead of two listeners. The original registered `mousemove`
 *   / `mouseup` / `touchmove` / `touchend` on `document` — eight handlers, four
 *   global, one pair duplicating the other. A single captured pointer does the
 *   same job, stays inside the element, and cleans itself up.
 * · Drag now follows the pointer. The original applied each pointer delta to
 *   the rotation AND then added that same delta again every frame as velocity,
 *   capped at the maximum rotation speed, so a slow drag turned into a fast
 *   spin. The delta moves the sphere; the velocity is kept for the throw.
 * · `touch-action: pan-y`, so a vertical swipe over the sphere scrolls the page
 *   instead of being swallowed.
 * · Reduced motion turns the auto-rotation off entirely (the rest of the site
 *   does the same), and hovering pauses it so a face can be read.
 * · Site tokens, `next/image`, and a dialog styled like the rest of the public
 *   pages, replacing `border-white/20`, `bg-white` and raw `<img>`.
 * · The team is also real text. The sphere is `aria-hidden` — five photos
 *   orbiting are decoration, and nothing in them is reachable by keyboard — so
 *   the names and roles are rendered as a visually hidden list instead, which is
 *   what actually puts the team in the page for a screen reader or a crawler.
 */

export interface SphereImage {
  id: string;
  src: string;
  alt: string;
  /** The person's name. Shown in the caption and the dialog. */
  title: string;
  /** Their line of work. */
  description?: string;
}

interface SphericalPosition {
  theta: number;
  phi: number;
}

const toRad = (degrees: number) => degrees * (Math.PI / 180);

/** 360 / φ². The azimuth step that fills a disc instead of spiralling through it. */
const GOLDEN_ANGLE = 137.50776405003785;

/** Up to this many faces, spread them by hand rather than by Fibonacci. */
const SMALL_SET = 8;

const normalizeAngle = (angle: number) => {
  let next = angle;
  while (next > 180) next -= 360;
  while (next < -180) next += 360;
  return next;
};

export function ImageSphere({
  images,
  size = 320,
  autoRotate = true,
  autoRotateSpeed = 0.2,
  dragSensitivity = 0.8,
  momentumDecay = 0.94,
  maxRotationSpeed = 4,
  baseImageScale = 0.32,
  hoverScale = 1.18,
  className = "",
}: {
  images: SphereImage[];
  /** Diameter in px. Narrower parents shrink it rather than letting it overflow. */
  size?: number;
  autoRotate?: boolean;
  /** Degrees per frame. */
  autoRotateSpeed?: number;
  /** Degrees of rotation per pixel dragged. */
  dragSensitivity?: number;
  /** How quickly a throw decays. */
  momentumDecay?: number;
  /** The most a single frame may add, which is what keeps a throw sane. */
  maxRotationSpeed?: number;
  /**
   * Face diameter as a share of the sphere's. Five faces is not sixty: at the
   * share the supplied sixty-image demo used, the team scattered into dots with
   * a sphere-sized hole between them, so they are near twice that here and the
   * ball is mostly faces.
   */
  baseImageScale?: number;
  hoverScale?: number;
  className?: string;
}) {
  // Reduced motion stops the auto-rotation rather than slowing it: a sphere
  // that turns forever is exactly the thing the preference is about.
  const reduceMotion = useReducedMotion();
  const rotating = autoRotate && !reduceMotion;

  const holderRef = useRef<HTMLDivElement>(null);
  const closeRef = useRef<HTMLButtonElement>(null);

  const [box, setBox] = useState(size);
  const [view, setView] = useState({ x: 15, y: 15 });
  const [hovered, setHovered] = useState<number | null>(null);
  const [open, setOpen] = useState<number | null>(null);
  const [paused, setPaused] = useState(false);
  const [inView, setInView] = useState(false);
  /** A pointer is holding the sphere, or a throw is still coasting. */
  const [spinning, setSpinning] = useState(false);

  const rotation = useRef({ x: 15, y: 15 });
  const velocity = useRef({ x: 0, y: 0 });
  const dragging = useRef(false);
  const lastPointer = useRef({ x: 0, y: 0 });
  const travelled = useRef(0);

  const clamp = useCallback(
    (speed: number) => Math.max(-maxRotationSpeed, Math.min(maxRotationSpeed, speed)),
    [maxRotationSpeed]
  );

  // ── Fit the parent ────────────────────────────────────────────────────────
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    const sync = () => setBox(Math.min(size, holder.clientWidth || size));
    sync();

    const observer = new ResizeObserver(sync);
    observer.observe(holder);
    return () => observer.disconnect();
  }, [size]);

  // ── Only spin while the sphere is on screen ──────────────────────────────
  useEffect(() => {
    const holder = holderRef.current;
    if (!holder) return;

    const observer = new IntersectionObserver(([entry]) => setInView(entry.isIntersecting), {
      rootMargin: "150px",
    });
    observer.observe(holder);
    return () => observer.disconnect();
  }, []);

  const radius = box * 0.28;
  const baseSize = box * baseImageScale;

  // ── Where the faces sit on the sphere ────────────────────────────────────
  // Deterministic on purpose: the supplied version nudged each angle with
  // Math.random, which cannot be server-rendered and cannot be reproduced, so
  // the sphere could only appear after the bundle arrived.
  const positions = useMemo(() => {
    const count = images.length;
    if (!count) return [];

    // Below about a dozen faces, a Fibonacci sphere is the wrong tool. Five
    // points spread evenly over a whole sphere are about 63° apart, so the
    // projection always has one half empty, whichever way the thing is turned —
    // which is exactly what it looked like: a scatter of dots with a hole in
    // it. Small sets get a lopsided ladder instead. The polar angle walks down
    // from above the equator to below it and the azimuth jumps by the golden
    // angle, which fills the disc rather than drawing a helix through it: what
    // lands on screen is one face near the middle with the rest around it.
    // Rotating about Y then keeps that ladder (the polar angle is the height)
    // while the faces sweep across, so the ball reads as full at every angle
    // instead of only at some.
    if (count <= SMALL_SET) {
      return Array.from({ length: count }, (_, index) => ({
        phi: count === 1 ? 90 : 45 + (90 * index) / (count - 1),
        theta: (((GOLDEN_ANGLE * index) % 360) + 360) % 360,
      }));
    }

    const increment = (2 * Math.PI) / ((1 + Math.sqrt(5)) / 2);

    return Array.from({ length: count }, (_, index) => {
      const inclination = Math.acos(1 - (2 * index) / count);
      let phi = (inclination * 180) / Math.PI;
      const theta = (((increment * index * 180) / Math.PI) % 360 + 360) % 360;

      // Bias a little further toward the poles so the top and bottom of the
      // sphere carry a face too, then hold everything inside 15–165°: past that
      // the projection flattens to a point and faces land on each other.
      const poleBonus = Math.pow(Math.abs(phi - 90) / 90, 0.6) * 35;
      phi = phi < 90 ? Math.max(5, phi - poleBonus) : Math.min(175, phi + poleBonus);
      phi = 15 + (phi / 180) * 150;

      return { theta, phi };
    });
  }, [images.length]);

  // ── Project them, then shrink whichever ones overlap ─────────────────────
  const faces = useMemo(() => {
    const rotX = toRad(view.x);
    const rotY = toRad(view.y);

    const placed = positions.map((position) => {
      const theta = toRad(position.theta);
      const phi = toRad(position.phi);

      let x = radius * Math.sin(phi) * Math.cos(theta);
      let y = radius * Math.cos(phi);
      let z = radius * Math.sin(phi) * Math.sin(theta);

      // Horizontal drag turns the sphere about its Y axis, vertical about X.
      const turnedX = x * Math.cos(rotY) + z * Math.sin(rotY);
      z = -x * Math.sin(rotY) + z * Math.cos(rotY);
      x = turnedX;

      const turnedY = y * Math.cos(rotX) - z * Math.sin(rotX);
      z = y * Math.sin(rotX) + z * Math.cos(rotX);
      y = turnedY;

      // Depth as a tint, not a disappearance. The supplied version faded a face
      // to nothing as it went behind — which is right for sixty of them and
      // wrong for five: the face that was meant to sit in the middle of the
      // ball was the one rotating to the back, so half the composition kept
      // blinking out and leaving a hole. Faces stay in the ball now and let the
      // faces in front of them do the hiding.
      const fadeOpacity = 0.42 + 0.58 * ((z + radius) / (2 * radius));

      // Nearer the rim is smaller. Faces that came from the poles get a lighter
      // penalty, because the projection is harshest on them.
      //
      // The floor and the slope are deliberately shallow. With five faces, the
      // supplied 0.3 floor turned three of the five into 24px dots at the rim
      // and left a hole in the middle of the ball — the depth cue is worth
      // having, but not three quarters of the sphere.
      const isPole = position.phi < 30 || position.phi > 150;
      const distance = Math.min(Math.sqrt(x * x + y * y) / radius, 1);
      const centerScale = Math.max(0.68, 1 - distance * (isPole ? 0.22 : 0.34));
      const depthScale = Math.max(0.8, 0.9 + ((z + radius) / (2 * radius)) * 0.2);

      return {
        x,
        y,
        z,
        scale: centerScale * depthScale,
        zIndex: Math.round(1000 + z),
        fadeOpacity,
      };
    });

    return placed.map((face, index) => {
      let scale = face.scale;
      for (let other = 0; other < placed.length; other++) {
        if (other === index) continue;

        const otherScale = placed[other].scale;
        // Only enough clearance to keep two faces from sitting on top of each
        // other. Overlapping is what gives the ball its depth — the front face
        // is simply drawn over the one behind and the pair reads as a sphere
        // rather than as a smear, which is why the supplied version's 25px of
        // padding is down to 6px here.
        const minDistance = (baseSize * scale + baseSize * otherScale) / 2 + 4;
        const dx = face.x - placed[other].x;
        const dy = face.y - placed[other].y;
        const apart = Math.sqrt(dx * dx + dy * dy);

        if (apart > 0 && apart < minDistance) {
          scale = Math.min(scale, scale * Math.max(0.7, 1 - ((minDistance - apart) / minDistance) * 0.3));
        }
      }

      return { ...face, scale: Math.max(0.25, scale) };
    });
  }, [positions, view, radius, baseSize]);

  // ── One frame of physics ─────────────────────────────────────────────────
  const update = useCallback(() => {
    const speed = velocity.current;

    // While a pointer is down the pointer owns the rotation; the velocity it
    // leaves behind is only spent after the release.
    if (dragging.current) return true;

    speed.x *= momentumDecay;
    speed.y *= momentumDecay;
    if (Math.abs(speed.x) < 0.02) speed.x = 0;
    if (Math.abs(speed.y) < 0.02) speed.y = 0;

    const coasting = speed.x !== 0 || speed.y !== 0;
    const turning = rotating && !paused;
    if (!coasting && !turning) return false;

    const current = rotation.current;
    rotation.current = {
      x: normalizeAngle(current.x + (coasting ? clamp(speed.x) : 0)),
      y: normalizeAngle(current.y + (coasting ? clamp(speed.y) : 0) + (turning ? autoRotateSpeed : 0)),
    };
    setView(rotation.current);
    return true;
  }, [rotating, paused, autoRotateSpeed, momentumDecay, clamp]);

  const active = inView && (spinning || (rotating && !paused));

  useEffect(() => {
    if (!active) return;

    let frame = requestAnimationFrame(function step() {
      if (update()) frame = requestAnimationFrame(step);
      // Spent: stop the loop. Restarting is the pointer's job, or the effect's
      // when the sphere comes back into view.
      else setSpinning(false);
    });

    return () => cancelAnimationFrame(frame);
  }, [active, update]);

  // ── Dialog plumbing ──────────────────────────────────────────────────────
  useEffect(() => {
    if (open === null) return;

    closeRef.current?.focus();
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") setOpen(null);
    };
    document.addEventListener("keydown", onKeyDown);
    return () => document.removeEventListener("keydown", onKeyDown);
  }, [open]);

  const release = (event: React.PointerEvent) => {
    if (!dragging.current) return;
    dragging.current = false;
    try {
      event.currentTarget.releasePointerCapture(event.pointerId);
    } catch {
      /* never captured */
    }
  };

  const caption = hovered !== null ? images[hovered] : null;
  const opened = open !== null ? images[open] : null;

  return (
    <div ref={holderRef} className={`flex w-full flex-col items-center ${className}`}>
      <div
        aria-hidden="true"
        className="relative cursor-grab select-none active:cursor-grabbing"
        style={{ width: box, height: box, touchAction: "pan-y" }}
        onPointerEnter={() => setPaused(true)}
        onPointerLeave={() => setPaused(false)}
        onPointerDown={(event) => {
          event.preventDefault();
          // A tap can end before this handler runs, and capturing a pointer that
          // is already gone throws. The rotation does not depend on the capture;
          // it only keeps a drag alive when the pointer leaves the box.
          try {
            event.currentTarget.setPointerCapture(event.pointerId);
          } catch {
            /* pointer already released */
          }
          dragging.current = true;
          travelled.current = 0;
          velocity.current = { x: 0, y: 0 };
          lastPointer.current = { x: event.clientX, y: event.clientY };
          setSpinning(true);
        }}
        onPointerMove={(event) => {
          if (!dragging.current) return;

          const dx = event.clientX - lastPointer.current.x;
          const dy = event.clientY - lastPointer.current.y;
          lastPointer.current = { x: event.clientX, y: event.clientY };
          travelled.current += Math.abs(dx) + Math.abs(dy);

          const stepX = clamp(-dy * dragSensitivity);
          const stepY = clamp(dx * dragSensitivity);
          velocity.current = { x: stepX, y: stepY };

          rotation.current = {
            x: normalizeAngle(rotation.current.x + stepX),
            y: normalizeAngle(rotation.current.y + stepY),
          };
          setView(rotation.current);
        }}
        onPointerUp={release}
        onPointerCancel={release}
      >
        {images.map((image, index) => {
          const face = faces[index];
          if (!face) return null;

          const diameter = baseSize * face.scale;
          const isHovered = hovered === index;

          return (
            <div
              key={image.id}
              className="absolute"
              style={{
                width: diameter,
                height: diameter,
                left: box / 2 + face.x,
                top: box / 2 + face.y,
                opacity: face.fadeOpacity,
                zIndex: face.zIndex,
                transform: `translate(-50%, -50%) scale(${isHovered ? hoverScale : 1})`,
                transition: "transform 180ms cubic-bezier(0.22, 1, 0.36, 1)",
              }}
              onPointerEnter={() => setHovered(index)}
              onPointerLeave={() => setHovered((current) => (current === index ? null : current))}
              // A throw that ends on top of a face should not also open it.
              onClick={() => {
                if (travelled.current < 6) setOpen(index);
              }}
            >
              <div
                className={`relative h-full w-full overflow-hidden rounded-full border bg-surface transition-colors duration-200 ${
                  isHovered ? "border-accent-alt" : "border-line"
                }`}
                style={{
                  boxShadow:
                    "0 1px 2px color-mix(in srgb, var(--color-ink) 10%, transparent), 0 10px 24px -12px color-mix(in srgb, var(--color-ink) 32%, transparent)",
                }}
              >
                <Image
                  src={image.src}
                  alt=""
                  fill
                  sizes="120px"
                  draggable={false}
                  className="object-cover"
                />
              </div>
            </div>
          );
        })}
      </div>

      {/* The caption is the sphere's own readout, so it follows the hover. */}
      <p
        aria-hidden="true"
        className="mt-5 min-h-[3.1rem] max-w-[22rem] text-center text-[0.85rem] leading-relaxed text-ink-soft text-pretty"
      >
        {caption ? (
          <>
            <span className="font-display font-semibold text-ink">{caption.title}</span>
            {caption.description ? <span className="mt-0.5 block text-[0.8rem]">{caption.description}</span> : null}
          </>
        ) : (
          "Drag to spin, or click a face."
        )}
      </p>

      {/* What a screen reader gets, and what the page is actually about. */}
      <ul className="sr-only">
        {images.map((image) => (
          <li key={image.id}>
            {image.title}
            {image.description ? ` — ${image.description}` : ""}
          </li>
        ))}
      </ul>

      {opened && typeof document !== "undefined"
        ? createPortal(
            <div
              role="dialog"
              aria-modal="true"
              aria-labelledby="sphere-dialog-title"
              className="fixed inset-0 z-[60] flex items-center justify-center bg-ink/45 p-6 backdrop-blur-sm"
              onClick={() => setOpen(null)}
            >
              <div
                className="w-full max-w-sm overflow-hidden rounded-[var(--radius-surface)] border border-line bg-surface shadow-[0_24px_60px_-24px_color-mix(in_srgb,var(--color-ink)_45%,transparent)]"
                onClick={(event) => event.stopPropagation()}
              >
                <div className="relative aspect-square bg-paper">
                  <Image
                    src={opened.src}
                    alt={opened.alt}
                    fill
                    sizes="(min-width: 640px) 24rem, 100vw"
                    className="object-cover"
                  />
                  <button
                    ref={closeRef}
                    type="button"
                    onClick={() => setOpen(null)}
                    aria-label="Close"
                    className="absolute right-3 top-3 flex h-9 w-9 items-center justify-center rounded-full border border-line bg-surface/90 text-ink-mute transition-colors hover:border-line-strong hover:text-ink"
                  >
                    <X size={16} strokeWidth={2} />
                  </button>
                </div>
                <div className="p-6">
                  <h3
                    id="sphere-dialog-title"
                    className="font-display text-[1.15rem] font-semibold tracking-[-0.01em] text-ink"
                  >
                    {opened.title}
                  </h3>
                  {opened.description ? (
                    <p className="mt-2 text-[0.9rem] leading-relaxed text-ink-soft text-pretty">
                      {opened.description}
                    </p>
                  ) : null}
                </div>
              </div>
            </div>,
            document.body
          )
        : null}
    </div>
  );
}
