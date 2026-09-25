"use client";

/**
 * One feed of notifications for the whole signed-in surface.
 *
 * The bell used to poll this endpoint for itself. The island reads the same
 * rows, and two polls of the same endpoint is two authenticated 20-row queries
 * every fifteen seconds per open tab — for a surface whose job is to sit in a
 * corner and be ready. So the poll lives here, once, and everything that wants
 * notifications reads from it: the chip's count, the card that announces an
 * arrival, and the list they open into.
 *
 * The provider also carries the *viewer*, which `/api/notifications` returns
 * alongside the rows: the island wears the reader's own face and words its cards
 * for their role, and the route already had the profile in hand to answer that.
 */

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  useTransition,
} from "react";
import { markAllNotificationsRead } from "@/app/(dashboard)/prof/dashboard/actions";
import {
  ANONYMOUS_VIEWER,
  notificationRole,
  type IslandViewer,
  type NotificationLike,
} from "@/lib/notification-style";

/** How often the feed refreshes while the tab is in front of someone. */
const POLL_MS = 15000;

/** A row as the API returns it, ready to hand to `notificationStyle`. */
export interface FeedNotification extends NotificationLike {
  id: string;
  type: string;
  title: string;
  body: string | null;
  link: string | null;
  is_read: boolean;
  created_at: string;
}

interface NotificationCenterValue {
  notifications: FeedNotification[];
  viewer: IslandViewer;
  unreadCount: number;
  /**
   * Whether the feed has answered once. The chip reads it to tell "nothing is
   * waiting" apart from "nobody has looked yet" — claiming "All caught up"
   * before the first payload is a small lie the surface does not have to tell.
   */
  ready: boolean;
  /** Marks every row read, locally at once and on the server behind it. */
  markAllRead: () => void;
  refresh: () => void;
}

const NotificationCenterContext = createContext<NotificationCenterValue | null>(null);

/**
 * A cheap identity for a feed: the ids and read state, nothing else. Compared
 * before every setState so a poll that changed nothing leaves the array — and
 * therefore every effect watching it — exactly where it was.
 */
function signatureOf(rows: readonly NotificationLike[]): string {
  return rows.map((row) => `${row.id}:${row.is_read ? 1 : 0}`).join("|");
}

export function NotificationCenterProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<FeedNotification[]>([]);
  const [viewer, setViewer] = useState<IslandViewer>(ANONYMOUS_VIEWER);
  const [ready, setReady] = useState(false);
  const [, startTransition] = useTransition();

  /** The last feed we rendered, so an unchanged poll is not a new render. */
  const lastSignature = useRef<string | null>(null);
  /** The rows as of this render, for callbacks that must not close over them. */
  const rowsRef = useRef<FeedNotification[]>([]);
  rowsRef.current = notifications;
  /** Set when the session is gone, so polling stops instead of 401ing forever. */
  const signedOut = useRef(false);

  const adopt = useCallback((rows: FeedNotification[]) => {
    const signature = signatureOf(rows);
    if (signature === lastSignature.current) return;
    lastSignature.current = signature;
    setNotifications(rows);
  }, []);

  const fetchFeed = useCallback(async () => {
    // Don't poll a tab nobody is looking at. At 15s intervals this was a
    // request every 15 seconds per open tab, forever, each running an
    // authenticated 20-row query — for a background tab that is pure cost.
    if (document.hidden || signedOut.current) return;
    try {
      const res = await fetch("/api/notifications");
      if (res.status === 401) {
        signedOut.current = true;
        return;
      }
      if (!res.ok) return;
      const data = await res.json();

      if (data.viewer) {
        const next: IslandViewer = {
          name: data.viewer.name ?? null,
          initials: data.viewer.initials ?? null,
          avatarUrl: data.viewer.avatarUrl ?? null,
          role: notificationRole(data.viewer.role),
        };
        setViewer((prev) =>
          prev.name === next.name &&
          prev.initials === next.initials &&
          prev.avatarUrl === next.avatarUrl &&
          prev.role === next.role
            ? prev
            : next,
        );
      }

      if (Array.isArray(data.notifications)) adopt(data.notifications);
      setReady(true);
    } catch (err) {
      console.error("Failed to fetch notifications:", err);
    }
  }, [adopt]);

  useEffect(() => {
    void fetchFeed();
    const interval = setInterval(() => void fetchFeed(), POLL_MS);

    // Catch up as soon as the tab comes back, so skipping hidden polls never
    // leaves the chip — or the list behind it — stale once the user returns.
    const onVisibility = () => {
      if (!document.hidden && !signedOut.current) void fetchFeed();
    };
    document.addEventListener("visibilitychange", onVisibility);

    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", onVisibility);
    };
  }, [fetchFeed]);

  const markAllRead = useCallback(() => {
    // Optimistic: the chip's count and the rows' unread dots clear on the click,
    // not on the round trip. Computed out here rather than inside the updater,
    // which has to stay free of side effects — and the signature is updated with
    // it, so the next poll sees no change and re-renders nothing.
    const next = rowsRef.current.map((row) => (row.is_read ? row : { ...row, is_read: true }));
    lastSignature.current = signatureOf(next);
    setNotifications(next);
    startTransition(() => {
      void markAllNotificationsRead();
    });
  }, []);

  const value = useMemo<NotificationCenterValue>(
    () => ({
      notifications,
      viewer,
      unreadCount: notifications.filter((row) => !row.is_read).length,
      ready,
      markAllRead,
      refresh: () => void fetchFeed(),
    }),
    [notifications, viewer, ready, markAllRead, fetchFeed],
  );

  return (
    <NotificationCenterContext.Provider value={value}>{children}</NotificationCenterContext.Provider>
  );
}

/** The feed, or null outside a provider — for components that can work without one. */
export function useNotificationFeed(): NotificationCenterValue | null {
  return useContext(NotificationCenterContext);
}

/**
 * The feed, for components that need it.
 *
 * Throws rather than returning a stub: an island that silently shows nothing
 * because it was mounted outside the provider is a bug that looks like a quiet
 * account, and this is the only way it announces itself.
 */
export function useNotificationCenter(): NotificationCenterValue {
  const value = useContext(NotificationCenterContext);
  if (!value) {
    throw new Error(
      "useNotificationCenter must be used inside <NotificationCenterProvider> (rendered by AppShell).",
    );
  }
  return value;
}
