"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { markAllNotificationsRead } from "@/app/(dashboard)/prof/dashboard/actions";
import { Bell } from "lucide-react";
import Link from "next/link";
import { usePathname } from "next/navigation";

interface Notification {
  id: string;
  type: string;
  title: string;
  body: string | null;
  is_read: boolean;
  created_at: string;
  request_id: string | null;
}

const FONT = "var(--font-sans)";

// Style objects hoisted to module scope: recreated inline on every render, they
// defeat React's referential-equality bailout and add avoidable GC churn to
// every navigation on every page that renders the bell.
const STYLES = {
  wrapper: { position: "relative" } as React.CSSProperties,
  bellButton: (open: boolean): React.CSSProperties => ({
    position: "relative",
    width: "2.2rem",
    height: "2.2rem",
    borderRadius: "50%",
    border: open
      ? "1px solid rgba(99, 102, 241, 0.4)"
      : "1px solid rgba(15, 23, 42, 0.12)",
    background: open ? "rgba(99, 102, 241, 0.08)" : "transparent",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    cursor: "pointer",
    transition: "all 0.2s cubic-bezier(0.22, 1, 0.36, 1)",
  }),
  badge: {
    position: "absolute",
    top: "-2px",
    right: "-2px",
    minWidth: "16px",
    height: "16px",
    padding: "0 3px",
    borderRadius: "100px",
    background: "#f97316",
    border: "2px solid #ffffff",
    fontSize: "0.5rem",
    fontWeight: 800,
    color: "#ffffff",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    fontFamily: FONT,
    boxShadow: "0 2px 6px rgba(249, 115, 22, 0.4)",
  } as React.CSSProperties,
  dropdown: {
    position: "fixed",
    top: "calc(var(--nav-height, 56px) + 8px)",
    right: "max(1rem, env(safe-area-inset-right, 16px))",
    width: "min(360px, calc(100vw - 2rem))",
    maxWidth: "calc(100vw - 2rem)",
    background: "rgba(255, 255, 255, 0.98)",
    backdropFilter: "blur(20px) saturate(190%)",
    WebkitBackdropFilter: "blur(20px) saturate(190%)",
    border: "1px solid rgba(99, 102, 241, 0.18)",
    borderRadius: "16px",
    overflow: "hidden",
    boxShadow: "0 20px 48px -10px rgba(15, 23, 42, 0.16), 0 8px 24px -4px rgba(79, 70, 229, 0.08)",
    zIndex: 100,
  } as React.CSSProperties,
  header: {
    padding: "0.85rem 1.15rem",
    background: "rgba(248, 250, 252, 0.85)",
    borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
  } as React.CSSProperties,
  headerTitle: {
    fontSize: "0.68rem",
    fontWeight: 800,
    letterSpacing: "0.08em",
    textTransform: "uppercase",
    color: "#0f172a",
    fontFamily: FONT,
  } as React.CSSProperties,
  newBadge: {
    fontSize: "0.62rem",
    fontWeight: 700,
    padding: "0.15rem 0.55rem",
    borderRadius: "100px",
    background: "rgba(249, 115, 22, 0.12)",
    color: "#ea580c",
    fontFamily: FONT,
  } as React.CSSProperties,
  caughtUp: {
    fontSize: "0.62rem",
    color: "#94a3b8",
    fontFamily: FONT,
  } as React.CSSProperties,
  list: { maxHeight: "360px", overflowY: "auto" } as React.CSSProperties,
  emptyState: { padding: "2.5rem 1.25rem", textAlign: "center" } as React.CSSProperties,
  emptyText: {
    fontSize: "0.78rem",
    color: "#64748b",
    margin: 0,
    fontFamily: FONT,
    fontWeight: 500,
  } as React.CSSProperties,
  item: (isRead: boolean, isLast: boolean): React.CSSProperties => ({
    textDecoration: "none",
    padding: "0.9rem 1.15rem",
    borderBottom: isLast ? "none" : "1px solid rgba(15, 23, 42, 0.05)",
    background: isRead ? "transparent" : "rgba(99, 102, 241, 0.04)",
    display: "flex",
    flexDirection: "column",
    gap: "0.25rem",
    transition: "background 0.18s",
  }),
  itemTopRow: {
    display: "flex",
    alignItems: "flex-start",
    justifyContent: "space-between",
    gap: "0.75rem",
  } as React.CSSProperties,
  itemTitle: (isRead: boolean): React.CSSProperties => ({
    fontSize: "0.82rem",
    fontWeight: isRead ? 600 : 700,
    color: "#0f172a",
    fontFamily: FONT,
    lineHeight: 1.4,
  }),
  unreadDot: {
    width: "6px",
    height: "6px",
    borderRadius: "50%",
    background: "#ea580c",
    flexShrink: 0,
    marginTop: "6px",
  } as React.CSSProperties,
  itemBody: {
    fontSize: "0.72rem",
    color: "#475569",
    fontFamily: FONT,
    lineHeight: 1.5,
  } as React.CSSProperties,
  itemTime: {
    fontSize: "0.62rem",
    fontWeight: 600,
    color: "#94a3b8",
    fontFamily: FONT,
    marginTop: "0.15rem",
  } as React.CSSProperties,
};

const UNREAD_BG = "rgba(99, 102, 241, 0.04)";
const UNREAD_HOVER_BG = "rgba(99, 102, 241, 0.08)";

/** Notification bell that shows unread count and a dropdown list */
export function NotificationBell() {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [open, setOpen] = useState(false);
  const [, startTransition] = useTransition();
  const dropdownRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const unreadCount = notifications.filter((n) => !n.is_read).length;

  const getHref = () => {
    // Determine the base route from pathname
    if (pathname.startsWith("/prof")) {
      return "/prof/dashboard";
    }
    if (pathname.startsWith("/admin")) {
      return "/admin/dashboard";
    }
    return "/threads";
  };

  // A notification tied to a thread deep-links straight to the conversation;
  // everything else falls back to the route where the user's threads live.
  // new_request notifications point professors at their request queue instead,
  // where accept/decline actions live.
  const getNotificationHref = (n: Notification) =>
    n.request_id && n.type !== "new_request" ? `/messages/${n.request_id}` : getHref();

  useEffect(() => {
    let mounted = true;

    const fetchNotifications = async () => {
      try {
        const res = await fetch("/api/notifications");
        if (!res.ok) return;
        const data = await res.json();
        if (data.notifications && mounted) {
          setNotifications(data.notifications);
        }
      } catch (err) {
        console.error("Failed to fetch notifications:", err);
      }
    };

    fetchNotifications();
    const interval = setInterval(fetchNotifications, 15000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  // Close on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // Close on Escape key
  useEffect(() => {
    if (!open) return;
    const handleKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", handleKey);
    return () => window.removeEventListener("keydown", handleKey);
  }, [open]);

  const handleOpen = () => {
    setOpen((o) => !o);
    if (!open && unreadCount > 0) {
      // Mark all read when opening
      startTransition(async () => {
        await markAllNotificationsRead();
        setNotifications((prev) => prev.map((n) => ({ ...n, is_read: true })));
      });
    }
  };

  const formatTime = (iso: string) => {
    const d = new Date(iso);
    const now = Date.now();
    const diff = (now - d.getTime()) / 1000;
    if (diff < 60)   return "just now";
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return d.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  return (
    <div ref={dropdownRef} style={STYLES.wrapper}>
      <button
        id="notification-bell"
        type="button"
        onClick={handleOpen}
        title="Notifications"
        aria-label="View notifications"
        aria-expanded={open}
        style={STYLES.bellButton(open)}
        onMouseEnter={(e) => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = "rgba(15, 23, 42, 0.05)";
          }
        }}
        onMouseLeave={(e) => {
          if (!open) {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }
        }}
      >
        <Bell size={15} color={open ? "#4f46e5" : "#475569"} />
        {unreadCount > 0 && (
          <span style={STYLES.badge}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — anchored to the right side of the screen so it never gets cropped out of frame */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications list"
          style={STYLES.dropdown}
        >
          {/* Header */}
          <div style={STYLES.header}>
            <span style={STYLES.headerTitle}>
              Notifications
            </span>
            {unreadCount > 0 ? (
              <span style={STYLES.newBadge}>
                {unreadCount} new
              </span>
            ) : (
              <span style={STYLES.caughtUp}>
                All caught up
              </span>
            )}
          </div>

          {/* List */}
          <div style={STYLES.list} className="hide-scrollbar">
            {notifications.length === 0 ? (
              <div style={STYLES.emptyState}>
                <Bell size={22} color="rgba(99, 102, 241, 0.3)" style={{ margin: "0 auto 0.75rem" }} />
                <p style={STYLES.emptyText}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <Link
                  key={n.id}
                  href={getNotificationHref(n)}
                  onClick={() => setOpen(false)}
                  style={STYLES.item(n.is_read, i === notifications.length - 1)}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = UNREAD_HOVER_BG;
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = n.is_read ? "transparent" : UNREAD_BG;
                  }}
                >
                  <div style={STYLES.itemTopRow}>
                    <span style={STYLES.itemTitle(n.is_read)}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span style={STYLES.unreadDot} />
                    )}
                  </div>
                  {n.body && (
                    <span style={STYLES.itemBody}>
                      {n.body}
                    </span>
                  )}
                  <span style={STYLES.itemTime}>
                    {formatTime(n.created_at)}
                  </span>
                </Link>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  );
}
