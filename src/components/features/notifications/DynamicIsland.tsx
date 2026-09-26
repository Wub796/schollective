"use client";

/**
 * The Dynamic Island: a permanent chip in the top bar that is the whole
 * notification surface.
 *
 * A port of `DynamicNotifications` from expo-dynamic-notifications, adapted to
 * the one place a website is not a phone. On a phone the island is hardware: a
 * black capsule that is always there, and notifications grow out of it. Here it
 * is a chip of the site's own ink sitting in the middle of the top bar, and it
 * has three states rather than two:
 *
 *   idle         the reader's face, and either "All caught up" or however many
 *                notifications are waiting. Always on screen, because it is now
 *                the only door to the inbox — the bell this replaced was a
 *                second, smaller door on the same wall.
 *   announcing   a notification arrives and a card drops below the chip, with
 *                the goo droplet stretching between them: two rounded bodies
 *                merged by an SVG filter whose colour matrix mirrors the
 *                library's own `gain`/`threshold` pair (`alpha' = gain·alpha −
 *                gain·threshold`). The filter works on the alpha channel, which
 *                is what lets it sit over the site's gradient backdrops — a
 *                `blur()`/`contrast()` trick would have to paint an opaque
 *                background to do the same thing.
 *   open         the chip is the inbox: the same body, holding the list. Nothing
 *                else in the app opens it, and opening it means the reader has
 *                seen what was waiting.
 *
 * Three things worth knowing before editing:
 *
 *   - Timing is one clock. A notification's lifetime is a CSS animation on its
 *     progress line, and the END of that animation is what retires it. There is
 *     no second timer to drift against it, and hovering pauses the one clock
 *     (`animation-play-state`), which is why a held-open card resumes exactly
 *     where it stopped.
 *   - The chip sits in the top bar without living in it: the bar has
 *     `backdrop-filter`, and a blurred surface is a backdrop root, so a card
 *     nested inside it would blur the bar's own background instead of the page.
 *     The layer is a sibling of the bar, aligned to it, and the pill is centred
 *     in the bar's own height. See `.island-layer` and `.island-slot`.
 *   - The beta ticker scrolls behind the chip, and the room it leaves around it
 *     is sized from here: the chip's measured width, and whether it is on screen
 *     at all, are published to the document root, because the ticker is a
 *     sibling of this layer rather than a descendant of it. See `.beta-ticker`
 *     in globals.css for the lane those two facts draw.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "framer-motion";
import { ArrowRight, X } from "lucide-react";
import {
  ANONYMOUS_VIEWER,
  notificationStyle,
  personaliseNotification,
  safeIslandHref,
  type IslandContent,
  type IslandViewer,
  type NotificationGlyph,
} from "@/lib/notification-style";
import { EASE_SOFT } from "@/components/ui/entrance";
import { useNotificationFeed } from "./NotificationCenter";
import { IslandInbox } from "./IslandInbox";
import { NotificationGlyphMark } from "./glyphs";

/** How many notifications wait behind the one on screen. The inbox keeps the rest. */
const MAX_QUEUE = 3;

/** The SVG filter's id, shared between its definition and the layer that uses it. */
const GOO_FILTER_ID = "schollective-island-goo";

/** Space between the chip and the body below it, published to CSS as a custom property. */
const PILL_GAP = 10;

/**
 * The spring under every shape the island's transition moves.
 *
 * The droplet stretching out of the chip, the body arriving from it and the card
 * drawing back into it are one gesture, so they share their physics: a mismatch
 * shows up as the goo poking out from behind the card it is meant to be merging
 * with, and the chip's own length rides the same spring in its `layout`
 * animation for the same reason. Stiffness 340 over mass 0.85 settles in a little
 * under half a second with one shallow overshoot — about 3px on the longest
 * stretch, which is the droplet landing rather than a bounce.
 */
const SHAPE_SPRING = { type: "spring", stiffness: 340, damping: 28, mass: 0.85 } as const;

/**
 * Where a body starts, a little above where it settles.
 *
 * `boolean | null` because that is what `useReducedMotion` hands back — null
 * until the media query has been read, which reads as "no preference". The
 * fades here ride `EASE_SOFT`, the curve the rest of the site's entrances use;
 * only the shapes get physics.
 */
function bodyEntry(reduceMotion: boolean | null) {
  // No scale: the droplet underneath is the thing that grows, and a card scaling
  // up inside it would show its own edges drifting apart from the blob's.
  return { opacity: 0, y: reduceMotion ? 0 : -10 };
}

/**
 * Where it goes when it leaves — carrying its own transition.
 *
 * The shared one springs, and an exit that waits for a spring to settle holds
 * the berth the next notification is already queued for: `mode="wait"` cannot
 * start the next body until this one is done. Leaving is a quick fade; arriving
 * is the part that gets to bounce.
 */
function bodyExit(reduceMotion: boolean | null) {
  return {
    opacity: 0,
    y: reduceMotion ? 0 : -8,
    transition: { duration: reduceMotion ? 0.1 : 0.16, ease: EASE_SOFT } as const,
  };
}

function bodyTransition(reduceMotion: boolean | null) {
  if (reduceMotion) return { duration: 0.12, ease: EASE_SOFT } as const;
  return {
    // The shape carries the weight; opacity is a plain tween, because a spring
    // under a fade reads as a flicker rather than as a thing with mass.
    y: SHAPE_SPRING,
    opacity: { duration: 0.22, ease: EASE_SOFT } as const,
  };
}

/** The panel's id, so the chip can point `aria-controls` at it. */
const INBOX_ID = "island-inbox";

const GLYPH_WHEN_IDLE: NotificationGlyph = "check";

/** A notification the island is asked to show. Everything but `title` is optional. */
export interface IslandNotificationInput {
  id?: string;
  /** A stored `NotificationType`, which supplies the eyebrow, glyph, accent and lifetime. */
  type?: string;
  title: string;
  message?: string | null;
  eyebrow?: string;
  accent?: string;
  ink?: string;
  glyph?: NotificationGlyph;
  cta?: string;
  /** Where tapping goes. Only a site-relative path is honoured. */
  href?: string | null;
  /** Milliseconds on screen, or null to wait until it is dismissed. Defaults to the type's own. */
  duration?: number | null;
  /** Runs on tap, before the island retires it — the native library's `onPress`. */
  onPress?: () => void;
  /** Replaces the default body, as the native library's `render` does. */
  render?: (notification: IslandContent) => React.ReactNode;
}

/** What the island holds: the styled content plus the two things a caller attaches to it. */
export interface IslandNotification extends IslandContent {
  onPress?: () => void;
  render?: (notification: IslandContent) => React.ReactNode;
}

interface IslandValue {
  /** Shows a notification, queueing it behind whatever is on screen. */
  trigger: (notification: IslandNotificationInput) => void;
  /** Closes the current notification and everything queued behind it. */
  dismiss: () => void;
  /**
   * Closes the current notification and lets the next in line take its place.
   *
   * Separate from `dismiss` on purpose: a card that has said its piece — its
   * clock ran out, or it was tapped and read — is finished, but a burst of three
   * notifications is still waiting behind it. `dismiss` is the reader saying
   * "not now", which clears the queue with it.
   */
  retire: () => void;
  isVisible: boolean;
  notification: IslandNotification | null;
  /** How many are waiting. */
  queued: number;
  /** Called when the exit animation ends, so the next one enters cleanly. */
  advance: () => void;
  /** Whether the list is open. */
  isOpen: boolean;
  toggleInbox: () => void;
  closeInbox: () => void;
  /** How many have arrived while the list was open, for the chip's pulse. */
  fresh: number;
  /** Read when the list was opened, for its header. */
  unreadAtOpen: number;
  /** True while a product tour is running; the island stands down for it. */
  tourActive: boolean;
}

const IslandContext = createContext<IslandValue | null>(null);

interface GooConfig {
  /** 0–1, mapped onto the filter's blur radius. Higher is soupier. */
  strength: number;
  gain: number;
  threshold: number;
}

/** The library's `strength` is a feel, not a number: this is the curve onto stdDeviation. */
function blurFromStrength(strength: number): number {
  const clamped = Math.min(Math.max(strength, 0), 1);
  return 3 + clamped * 11;
}

export interface DynamicNotificationsProps {
  children?: React.ReactNode;
  /** Auto-dismiss delay for every notification, in ms. `null` disables it. */
  duration?: number | null;
  /** Goo strength from 0 to 1. */
  strength?: number;
  /** Explicit goo blur radius, overriding `strength`. */
  blur?: number;
  /** Alpha gain of the goo colour matrix. */
  gain?: number;
  /** Alpha cutoff of the goo colour matrix. */
  threshold?: number;
  /** The default tint for notifications that do not carry one. */
  accent?: string;
  /** The reader, for notifications triggered without one of their own. */
  viewer?: IslandViewer;
  /**
   * True while something is covering the top bar — the mobile navigation drawer.
   *
   * The island's layer sits above the drawer (it has to sit above the bar), so
   * without this the chip would float over a panel it is not part of. Standing
   * down uses the same path as a product tour: the chip goes, and anything it was
   * holding goes with it.
   */
  suspended?: boolean;
}

export function DynamicNotifications({
  children,
  duration,
  strength = 0.62,
  blur,
  gain = 22,
  threshold = 0.43,
  accent,
  viewer,
  suspended = false,
}: DynamicNotificationsProps) {
  const [pipeline, setPipeline] = useState<{
    current: IslandNotification | null;
    queue: IslandNotification[];
  }>({ current: null, queue: [] });
  const [isOpen, setIsOpen] = useState(false);
  const [unreadAtOpen, setUnreadAtOpen] = useState(0);
  const [fresh, setFresh] = useState(0);
  const [tourActive, setTourActive] = useState(false);

  // The reader comes from the feed unless the caller supplies one, so a
  // notification triggered from anywhere in the tree still dresses itself for
  // the right person. Assigned on every render rather than in an effect: a
  // trigger can arrive from a timer or an event listener between renders, and it
  // has to read the reader of the moment.
  const feed = useNotificationFeed();
  const feedRef = useRef(feed);
  feedRef.current = feed;
  const feedViewer = feed?.viewer ?? null;
  const viewerRef = useRef<IslandViewer>(viewer ?? feedViewer ?? ANONYMOUS_VIEWER);
  viewerRef.current = viewer ?? feedViewer ?? viewerRef.current;
  const accentRef = useRef(accent);
  accentRef.current = accent;
  const openRef = useRef(isOpen);
  openRef.current = isOpen;

  const trigger = useCallback((input: IslandNotificationInput) => {
    // While the list is open the arrival is already in it — the list is the live
    // feed. Interrupting the reader with a card over the row they are reading is
    // the one thing an always-on surface must not do, so the chip pulses instead.
    if (openRef.current) {
      setFresh((count) => count + 1);
      return;
    }

    // A stored row only needs its type and title: the style table supplies the
    // rest. An explicit field always wins, so a caller can dress one by hand.
    const styled = personaliseNotification(
      { id: input.id, type: input.type, title: input.title, body: input.message, link: input.href },
      viewerRef.current,
    );

    const next: IslandNotification = {
      ...styled,
      eyebrow: input.eyebrow ?? styled.eyebrow,
      accent: input.accent ?? accentRef.current ?? styled.accent,
      ink: input.ink ?? styled.ink,
      glyph: input.glyph ?? styled.glyph,
      cta: input.cta ?? styled.cta,
      href: input.href ? safeIslandHref(input.href, styled.href) : styled.href,
      // `undefined` means "the type decides", which is how the table's sticky
      // types (a request to answer, a moderation notice) stay on screen.
      durationMs:
        input.duration === undefined
          ? styled.durationMs
          : input.duration === null
            ? null
            : Math.max(600, input.duration),
      onPress: input.onPress,
      render: input.render,
    };

    setPipeline((prev) =>
      prev.current
        ? // Newest wins when a burst overflows the queue: what is dropped is the
          // oldest line, and the inbox holds every row regardless.
          { current: prev.current, queue: [...prev.queue, next].slice(-MAX_QUEUE) }
        : { current: next, queue: prev.queue },
    );
  }, []);

  const dismiss = useCallback(() => {
    setPipeline((prev) => ({ current: null, queue: [] }));
  }, []);

  const retire = useCallback(() => {
    setPipeline((prev) => ({ current: null, queue: prev.queue }));
  }, []);

  const advance = useCallback(() => {
    setPipeline((prev) => {
      if (prev.current || prev.queue.length === 0) return prev;
      const [next, ...rest] = prev.queue;
      return { current: next, queue: rest };
    });
  }, []);

  const closeInbox = useCallback(() => setIsOpen(false), []);

  // Written as statements rather than a `setIsOpen(open => …)`: this opens AND
  // marks the list read, and a state updater has to stay free of side effects —
  // React is entitled to run it twice. The open state is mirrored in a ref for
  // the same reason: the read happens on the click, not on the next render.
  const toggleInbox = useCallback(() => {
    if (openRef.current) {
      setIsOpen(false);
      return;
    }
    // Opening the list is what marks it read: the chip's count clears on the
    // click, and what arrived while it was open never interrupts.
    const currentFeed = feedRef.current;
    setUnreadAtOpen(currentFeed?.unreadCount ?? 0);
    setFresh(0);
    currentFeed?.markAllRead();
    // A card that was mid-sentence when the reader reached for the list: the
    // list is the fuller answer to the same question.
    setPipeline((prev) => ({ current: null, queue: prev.queue }));
    setIsOpen(true);
  }, []);

  useEffect(() => {
    const onTourStatus = (event: Event) => {
      const active = Boolean((event as CustomEvent<{ active?: boolean }>).detail?.active);
      setTourActive(active);
      if (active) {
        // The tour raises the bar above the island's own layer, and a tour is a
        // guided walk through the product: the island stands down completely for
        // it and comes back when it ends. Nothing is lost — the rows are in the
        // feed and the inbox will show them.
        setIsOpen(false);
        setPipeline({ current: null, queue: [] });
      }
    };
    window.addEventListener("schollective:tour-status", onTourStatus);
    return () => window.removeEventListener("schollective:tour-status", onTourStatus);
  }, []);

  const value = useMemo<IslandValue>(
    () => ({
      trigger,
      dismiss,
      retire,
      isVisible: pipeline.current !== null,
      notification: pipeline.current,
      queued: pipeline.queue.length,
      advance,
      isOpen,
      toggleInbox,
      closeInbox,
      fresh,
      unreadAtOpen,
      tourActive,
    }),
    [trigger, dismiss, retire, pipeline, advance, isOpen, toggleInbox, closeInbox, fresh, unreadAtOpen, tourActive],
  );

  return (
    <IslandContext.Provider value={value}>
      {children}
      <Island goo={{ strength, gain, threshold }} blur={blur} duration={duration} suspended={suspended} />
      <FeedBridge suspended={suspended} />
    </IslandContext.Provider>
  );
}

/** The island, for anything that wants to raise a notification itself. */
export function useDynamicNotifications(): IslandValue {
  const value = useContext(IslandContext);
  if (!value) {
    throw new Error("useDynamicNotifications must be used inside <DynamicNotifications> (rendered by AppShell).");
  }
  return value;
}

/**
 * Turns the notification feed into arrivals.
 *
 * The first payload is the backlog, not news: seeding the seen set with it is
 * what keeps a page load from firing a week of unread notifications at someone.
 * The backlog is not lost — it is counted on the chip and listed in the inbox,
 * which is where it belongs.
 */
function FeedBridge({ suspended }: { suspended: boolean }) {
  const feed = useNotificationFeed();
  const { trigger, tourActive } = useDynamicNotifications();
  const seen = useRef<Set<string> | null>(null);

  useEffect(() => {
    if (!feed) return;
    // While the island is stood down its arrivals are still marked seen — the
    // chip is not on screen to announce them, and the list will hold them.
    if (suspended) {
      seen.current = new Set(feed.notifications.map((row) => row.id));
      return;
    }
    const rows = feed.notifications;
    const ids = new Set(rows.map((row) => row.id));

    const unseen = seen.current;
    seen.current = ids;
    if (unseen === null) return;

    // Oldest first, so a burst reads in the order it happened.
    const arrivals = rows.filter((row) => !unseen.has(row.id) && !row.is_read).reverse();
    for (const row of arrivals) {
      if (tourActive || suspended) break;
      trigger({
        id: row.id,
        type: row.type,
        title: row.title,
        message: row.body,
        href: row.link,
      });
    }
  }, [feed, trigger, tourActive, suspended]);

  return null;
}

interface Box {
  width: number;
  height: number;
  /** Distance from the top of the island's stack, which is what the goo droplet needs. */
  top: number;
}

/**
 * An element's box, for a surface that has to be drawn *behind* it at the same
 * size and place.
 *
 * The node is held in state rather than in a ref because the body is replaced —
 * one notification's card gives way to the inbox, or to the next notification —
 * and a ref object would keep observing the element that was replaced. The
 * element that IS here is measured, and re-measured on resize; `offsetTop` is
 * read relative to the stack, which is positioned exactly so that this is the
 * origin the droplet measures from.
 *
 * The last box is KEPT when the element goes away rather than cleared: the goo
 * reads it to draw the droplet back into the chip as the card leaves, which is
 * the only moment the two are apart from each other.
 */
function useBox<T extends HTMLElement>() {
  const [node, setNode] = useState<T | null>(null);
  const [box, setBox] = useState<Box | null>(null);
  const setNodeRef = useCallback((next: T | null) => setNode(next), []);

  useLayoutEffect(() => {
    if (!node) return;
    const measure = () =>
      setBox((prev) => {
        const next = { width: node.offsetWidth, height: node.offsetHeight, top: node.offsetTop };
        return prev && prev.width === next.width && prev.height === next.height && prev.top === next.top
          ? prev
          : next;
      });
    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(node);
    return () => observer.disconnect();
  }, [node]);

  return [setNodeRef, box] as const;
}

interface IslandProps {
  goo: GooConfig;
  blur?: number;
  duration?: number | null;
  suspended: boolean;
}

function Island({ goo, blur, duration, suspended }: IslandProps) {
  const {
    notification,
    queued,
    dismiss,
    retire,
    advance,
    isOpen,
    toggleInbox,
    closeInbox,
    fresh,
    unreadAtOpen,
    tourActive,
  } = useDynamicNotifications();
  const feed = useNotificationFeed();
  const reduceMotion = useReducedMotion();
  const pathname = usePathname();

  const [paused, setPaused] = useState(false);
  const [pulse, setPulse] = useState(false);
  const pillRef = useRef<HTMLButtonElement | null>(null);
  const stackRef = useRef<HTMLDivElement | null>(null);
  /** When the last drag ended, so a swipe cannot leave its click behind. */
  const draggedAt = useRef(0);

  const [setPillNode, pillBox] = useBox<HTMLButtonElement>();
  const [setBodyNode, bodyBox] = useBox<HTMLDivElement>();

  /*
   * Two facts about the chip that only this component can know, published to the
   * document root because the thing that needs them is not in this tree.
   *
   * The beta ticker runs behind the chip and gives the statement a lane around
   * it (see `.beta-ticker` in globals.css): the sentence is faded out before it
   * reaches the ink and back in as it leaves. How wide that lane has to be is
   * the chip's own width, and the chip is a capsule whose length follows its
   * label — an eyebrow is longer than "All caught up" — so it cannot be a
   * constant.
   *
   * Presence is the other half of it. A product tour stands the island down, and
   * so does the mobile drawer on a window wide enough to show the ticker; a lane
   * left open for a chip that is not there is a hole in the middle of a
   * sentence. That is the only thing written here as an attribute, and it is
   * written as `off`: the lane is the default, because the chip ships in the
   * server HTML and a lane that waited for this effect would leave a hard edge
   * at the capsule until hydration caught up.
   *
   * The root is used rather than a wrapper element because the ticker is a
   * SIBLING of this layer, not a descendant of it: `<html>` is the one node the
   * two subtrees share. Nothing is cleaned up on unmount — both values are
   * idempotent, and there is nothing left to read them once this surface is
   * gone.
   */
  useLayoutEffect(() => {
    const root = document.documentElement;
    if (pillBox) root.style.setProperty("--island-pill-width", `${pillBox.width}px`);
    if (tourActive || suspended) root.dataset.islandLane = "off";
    else root.removeAttribute("data-island-lane");
  }, [pillBox, tourActive, suspended]);

  const unread = feed?.unreadCount ?? 0;
  const ready = feed?.ready ?? false;
  const latest = feed?.notifications?.[0] ?? null;
  const latestStyle = latest ? notificationStyle(latest.type, feed?.viewer.role) : null;

  /**
   * The chip's three states, resolved into one line and one mark.
   *
   * `!isOpen` because a card can be queued behind the open list — one that was
   * promoted while the reader was reading it — and the chip belongs to whatever
   * is actually on screen.
   */
  const showingCard = notification !== null && !isOpen;
  const label = showingCard
    ? notification.eyebrow
    : unread > 0
      ? `${unread} new`
      : ready
        ? "All caught up"
        : "Notifications";
  const glyph: NotificationGlyph = showingCard
    ? notification.glyph
    : unread > 0 && latestStyle
      ? latestStyle.glyph
      : GLYPH_WHEN_IDLE;

  const accent = notification?.accent ?? latestStyle?.accent ?? "var(--color-accent)";
  const ink = notification?.ink ?? latestStyle?.ink ?? "var(--color-accent)";

  const body = isOpen ? "inbox" : (notification?.id ?? null);

  useEffect(() => {
    if (!fresh) return;
    setPulse(true);
  }, [fresh]);

  // A panel anchored to a bar that stays put has to close when the page under it
  // changes, or it comes back over content it was never opened against.
  useEffect(() => {
    closeInbox();
  }, [pathname, closeInbox]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      if (isOpen) {
        closeInbox();
        // Back to the control that opened it, so the keyboard is not left
        // somewhere the reader cannot see.
        pillRef.current?.focus();
      } else if (notification) {
        dismiss();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [isOpen, notification, closeInbox, dismiss]);

  // A click anywhere else closes the list, the way the bell's did.
  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: MouseEvent) => {
      if (!stackRef.current?.contains(event.target as Node)) closeInbox();
    };
    document.addEventListener("mousedown", onPointerDown);
    return () => document.removeEventListener("mousedown", onPointerDown);
  }, [isOpen, closeInbox]);

  // A new notification starts on its own clock, not the previous one's.
  useEffect(() => setPaused(false), [notification?.id]);

  // Standing down is letting go of what was on screen, not parking it to
  // reappear when the drawer closes: a card that comes back minutes later has
  // outlived its moment, and the list still holds the row.
  useEffect(() => {
    if (!suspended) return;
    closeInbox();
    dismiss();
  }, [suspended, closeInbox, dismiss]);

  const hold = notification
    ? duration === undefined
      ? notification.durationMs
      : duration === null
        ? null
        : Math.max(600, duration)
    : null;

  /*
   * A notification's lifetime is the CSS animation on its progress line, and the
   * END of that animation is what retires it — except for anyone who has asked
   * their system to reduce motion. The blanket rule in `globals.css` flattens
   * every CSS animation to 0.01ms for them, so `animationend` would fire on the
   * first frame and each card would flash past unread. Reduced motion therefore
   * gets a timeout and no progress line, which also means the two clocks can
   * never both be running. A hover restarts it (see `paused`), so a reader who is
   * reading gets the whole lifetime again.
   */
  useEffect(() => {
    if (!reduceMotion || hold === null || !notification || paused) return;
    const timer = setTimeout(retire, hold);
    return () => clearTimeout(timer);
  }, [reduceMotion, hold, notification, paused, retire]);

  if (tourActive || suspended) return null;

  const gooBlur = blur ?? blurFromStrength(goo.strength);
  const ariaLabel = `${showingCard ? `${notification.eyebrow}. ` : ""}${
    unread > 0 ? `Notifications, ${unread} unread` : "Notifications, none unread"
  }`;

  return (
    <>
      {/* One filter definition, at the root: the goo layer and any later layer
          share it, and an SVG filter is the only shape-merge that keeps the
          background visible through the gaps. */}
      {!reduceMotion && (
        <svg className="island-defs" width="0" height="0" aria-hidden="true" focusable="false">
          <defs>
            <filter id={GOO_FILTER_ID} colorInterpolationFilters="sRGB">
              <feGaussianBlur in="SourceGraphic" stdDeviation={gooBlur} result="blur" />
              <feColorMatrix
                in="blur"
                type="matrix"
                values={`1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 ${goo.gain} ${-(goo.gain * goo.threshold)}`}
              />
            </filter>
          </defs>
        </svg>
      )}

      <div className="island-layer">
        {/* Announced once, in words, rather than leaving assistive tech to read
            a card that is still mid-morph. */}
        <span className="sr-only" role="status" aria-live="polite">
          {notification
            ? `${notification.eyebrow}: ${notification.title}${notification.message ? `. ${notification.message}` : ""}`
            : ""}
        </span>

        <div
          ref={stackRef}
          className="island-stack"
          data-paused={paused ? "true" : "false"}
          data-open={isOpen ? "true" : "false"}
          style={
            {
              "--island-accent": accent,
              "--island-ink": ink,
              "--island-hold": hold === null ? "0ms" : `${hold}ms`,
              "--island-gap": `${PILL_GAP}px`,
            } as React.CSSProperties
          }
        >
          {/* The defocus the sentence passes through on its way under the chip
              (see `.island-lens`). Present in every state — the ticker runs
              behind the chip whether or not a card is showing — and first in
              the stack so it sits under the goo and under the ink. */}
          <div className="island-lens" aria-hidden="true" />

          {!reduceMotion && pillBox && (
            // Mounted for the island's whole life and faded rather than
            // unmounted: a card leaves while it is still on screen, and a bridge
            // that vanishes out from under it is the one seam a reader can see.
            // At rest the layer is transparent and draws nothing.
            <motion.div
              className="island-goo"
              aria-hidden="true"
              style={{ filter: `url(#${GOO_FILTER_ID})` }}
              initial={false}
              animate={{ opacity: body ? 1 : 0 }}
              transition={{ duration: 0.24, ease: EASE_SOFT }}
            >
              {/* The chip and the body as two rounded forms of one substance: ink
                  while it is the chip, the card's surface once it is the body.

                  Both are springs, and the springs ARE the effect. Sizing these
                  from state — which is what this did — moved them the instant the
                  element they copy was measured, so the droplet teleported into
                  place while the card faded in somewhere else, and the two never
                  read as one body. Springing them means the droplet stretches out
                  of the chip, follows the body when one card gives way to the
                  next, and draws back into the chip when the card retires — the
                  three moves the native library is built around. */}
              <motion.span
                className="island-goo-blob island-goo-pill"
                initial={false}
                animate={{ width: pillBox.width, height: pillBox.height, top: pillBox.top }}
                transition={SHAPE_SPRING}
              />
              {bodyBox && (
                <motion.span
                  className="island-goo-blob island-goo-card"
                  // Starting at the chip, because this is the box a droplet grows
                  // out of: framer reads `initial` when the blob mounts, and the
                  // blob mounts only when a body does.
                  initial={{ width: pillBox.width, height: pillBox.height, top: pillBox.top }}
                  animate={
                    body
                      ? { width: bodyBox.width, height: bodyBox.height, top: bodyBox.top }
                      : // Nothing is showing, so the two blobs merge back into the
                        // one capsule they came from.
                        { width: pillBox.width, height: pillBox.height, top: pillBox.top }
                  }
                  transition={SHAPE_SPRING}
                />
              )}
            </motion.div>
          )}

          {/* The chip's band is the top bar's own height, so it sits centred in
              the bar it belongs to without being inside it. */}
          <div className="island-slot">
            <motion.button
              ref={(node) => {
                setPillNode(node);
                pillRef.current = node;
              }}
              type="button"
              className="island-pill"
              data-pulse={pulse ? "true" : "false"}
              onClick={toggleInbox}
              aria-expanded={isOpen}
              aria-controls={INBOX_ID}
              aria-label={ariaLabel}
              title="Notifications"
              onAnimationEnd={() => setPulse(false)}
              // The chip's length changes with its label — a card's eyebrow is
              // longer than "All caught up" — and the layout animation glides
              // that change instead of snapping the capsule under the text. It
              // rides the droplet's spring so the chip and the goo below it
              // resize as one thing.
              layout={!reduceMotion}
              // Transform only, never a fade. This is the rule
              // src/components/ui/entrance.ts was written for, and it holds here
              // for the same reason: framer resolves `initial` during server
              // rendering, so a chip that starts at `opacity: 0` ships an island
              // nobody can see, waiting for a bundle to arrive — on the one
              // control that is supposed to always be there.
              // 0.9 rather than a pop: the chip is a fixture of the bar, so it
              // arrives as if it had been there all along rather than springing
              // in through the page — and the spring it settles on is a touch
              // softer than the droplet's for the same reason.
              initial={{ scale: reduceMotion ? 1 : 0.9 }}
              animate={{ scale: 1 }}
              // The press, from the same gesture vocabulary the rest of the app
              // borrows: small, and back to the resting scale on release rather
              // than to a value of its own.
              whileTap={reduceMotion ? undefined : { scale: 0.97 }}
              transition={{
                layout: SHAPE_SPRING,
                scale: { type: "spring", stiffness: 360, damping: 32, mass: 0.9 },
              }}
            >
              <ReaderMark initials={feed?.viewer.initials ?? "?"} avatarUrl={feed?.viewer.avatarUrl ?? null} size={20} />
              <span className="island-pill-label">{label}</span>
              <NotificationGlyphMark glyph={glyph} size={12} />
              {unread > 0 && !isOpen && <span className="island-pill-dot" aria-hidden="true" />}
            </motion.button>
          </div>

          {/*
            `mode="wait"` is load-bearing: the outgoing body finishes before the
            incoming one mounts, so the queue's next card enters into an empty
            berth rather than over the top of the last one — and only one body is
            ever mounted, which is what lets a single measured box describe it.
            Its own exit is a quick tween for the same reason: a spring there would
            hold the berth for as long as it took to settle.

            Only transform and opacity move here, and that is the whole motion
            budget. Each body carries a `backdrop-filter`, so animating `filter` on
            the same element — which this used to do, blurring a card in from 10px
            — makes the browser re-rasterize the page behind it on every frame.
            The goo layer is what blurs; the card only arrives.
          */}
          <AnimatePresence mode="wait" onExitComplete={advance}>
            {isOpen ? (
              <motion.div
                key="inbox"
                ref={setBodyNode}
                className="island-card island-card-panel"
                initial={bodyEntry(reduceMotion)}
                animate={{ opacity: 1, y: 0 }}
                exit={bodyExit(reduceMotion)}
                transition={bodyTransition(reduceMotion)}
              >
                <IslandInbox
                  id={INBOX_ID}
                  notifications={feed?.notifications ?? []}
                  viewer={feed?.viewer ?? ANONYMOUS_VIEWER}
                  unreadAtOpen={unreadAtOpen}
                  onNavigate={closeInbox}
                />
              </motion.div>
            ) : notification ? (
              <motion.div
                key={notification.id}
                ref={setBodyNode}
                className="island-card"
                onMouseEnter={() => setPaused(true)}
                onMouseLeave={() => setPaused(false)}
                onFocusCapture={() => setPaused(true)}
                onBlurCapture={() => setPaused(false)}
                drag={reduceMotion ? false : "y"}
                dragConstraints={{ top: -96, bottom: 16 }}
                dragElastic={0.18}
                dragMomentum={false}
                onDragStart={() => setPaused(true)}
                onDragEnd={(_event, info) => {
                  draggedAt.current = Date.now();
                  // Up and away, the way it came in. A long upward flick counts
                  // even when the finger did not travel far.
                  if (info.offset.y < -36 || info.velocity.y < -450) dismiss();
                  else setPaused(false);
                }}
                initial={bodyEntry(reduceMotion)}
                animate={{ opacity: 1, y: 0 }}
                exit={bodyExit(reduceMotion)}
                transition={bodyTransition(reduceMotion)}
              >
                <CardBody
                  notification={notification}
                  queued={queued}
                  onDismiss={dismiss}
                  onOpen={(event) => {
                    // framer-motion can leave a click behind a drag, and the one
                    // mis-tap that costs something is a swipe away from the card
                    // that navigates instead.
                    if (Date.now() - draggedAt.current < 220) {
                      event.preventDefault();
                      return;
                    }
                    notification.onPress?.();
                    retire();
                  }}
                />

                {hold !== null && !reduceMotion && (
                  // The progress line and the dismissal are the same clock: this
                  // animation's end is what retires the card, and the next one in
                  // line takes its place. Pausing is one CSS property, so the
                  // line freezes exactly where the clock does.
                  <span className="island-progress" onAnimationEnd={retire} aria-hidden="true" />
                )}
              </motion.div>
            ) : null}
          </AnimatePresence>
        </div>
      </div>
    </>
  );
}

function CardBody({
  notification,
  queued,
  onDismiss,
  onOpen,
}: {
  notification: IslandNotification;
  queued: number;
  onDismiss: () => void;
  onOpen: (event: React.MouseEvent) => void;
}) {
  if (notification.render) {
    return <div className="island-render">{notification.render(notification)}</div>;
  }

  const inner = (
    <>
      <div className="island-body">
        <span className="island-glyph">
          <NotificationGlyphMark glyph={notification.glyph} size={15} />
        </span>
        <div className="island-copy">
          <span className="island-eyebrow">{notification.eyebrow}</span>
          <p className="island-title">{notification.title}</p>
          {notification.message && <p className="island-message">{notification.message}</p>}
        </div>
      </div>

      <div className="island-foot">
        <span className="island-cta">
          {notification.cta}
          <ArrowRight size={12} aria-hidden="true" />
        </span>
        {queued > 0 && <span className="island-more">+{queued} more</span>}
      </div>
    </>
  );

  return (
    <>
      {notification.href ? (
        <Link href={notification.href} className="island-card-link" onClick={onOpen}>
          {inner}
        </Link>
      ) : notification.onPress ? (
        <button type="button" className="island-card-link" onClick={onOpen}>
          {inner}
        </button>
      ) : (
        <div className="island-card-link">{inner}</div>
      )}

      {/* Outside the link, not inside it: a button nested in an anchor is
          invalid, and the click target that closes a card is the one control
          that must not also navigate. */}
      <button
        type="button"
        className="island-dismiss"
        onClick={onDismiss}
        aria-label="Dismiss notification"
        title="Dismiss"
      >
        <X size={13} aria-hidden="true" />
      </button>
    </>
  );
}

/** The reader's own face — or their initials — on the tinted disc the app uses. */
function ReaderMark({
  initials,
  avatarUrl,
  size,
}: {
  initials: string;
  avatarUrl: string | null;
  size: number;
}) {
  return (
    <span className="island-mark" style={{ width: size, height: size }} aria-hidden="true">
      {avatarUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={avatarUrl} alt="" />
      ) : (
        <span className="island-mark-initials" style={{ fontSize: Math.max(9, size * 0.36) }}>
          {initials}
        </span>
      )}
    </span>
  );
}
