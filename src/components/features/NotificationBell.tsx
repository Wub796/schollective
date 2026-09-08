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
    <div ref={dropdownRef} style={{ position: "relative" }}>
      <button
        id="notification-bell"
        type="button"
        onClick={handleOpen}
        title="Notifications"
        aria-label="View notifications"
        aria-expanded={open}
        style={{
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
        }}
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
          <span style={{
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
            fontFamily: "var(--font-sans)",
            boxShadow: "0 2px 6px rgba(249, 115, 22, 0.4)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown — anchored to the right side of the screen so it never gets cropped out of frame */}
      {open && (
        <div
          role="dialog"
          aria-label="Notifications list"
          style={{
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
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: "0.85rem 1.15rem",
              background: "rgba(248, 250, 252, 0.85)",
              borderBottom: "1px solid rgba(99, 102, 241, 0.1)",
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
            }}
          >
            <span
              style={{
                fontSize: "0.68rem",
                fontWeight: 800,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: "#0f172a",
                fontFamily: "var(--font-sans)",
              }}
            >
              Notifications
            </span>
            {unreadCount > 0 ? (
              <span
                style={{
                  fontSize: "0.62rem",
                  fontWeight: 700,
                  padding: "0.15rem 0.55rem",
                  borderRadius: "100px",
                  background: "rgba(249, 115, 22, 0.12)",
                  color: "#ea580c",
                  fontFamily: "var(--font-sans)",
                }}
              >
                {unreadCount} new
              </span>
            ) : (
              <span
                style={{
                  fontSize: "0.62rem",
                  color: "#94a3b8",
                  fontFamily: "var(--font-sans)",
                }}
              >
                All caught up
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }} className="hide-scrollbar">
            {notifications.length === 0 ? (
              <div style={{ padding: "2.5rem 1.25rem", textAlign: "center" }}>
                <Bell size={22} color="rgba(99, 102, 241, 0.3)" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.78rem", color: "#64748b", margin: 0, fontFamily: "var(--font-sans)", fontWeight: 500 }}>
                  No notifications yet
                </p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <Link
                  key={n.id}
                  href={getHref()}
                  onClick={() => setOpen(false)}
                  style={{
                    textDecoration: "none",
                    padding: "0.9rem 1.15rem",
                    borderBottom: i < notifications.length - 1 ? "1px solid rgba(15, 23, 42, 0.05)" : "none",
                    background: n.is_read ? "transparent" : "rgba(99, 102, 241, 0.04)",
                    display: "flex",
                    flexDirection: "column",
                    gap: "0.25rem",
                    transition: "background 0.18s",
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLElement).style.background = "rgba(99, 102, 241, 0.08)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLElement).style.background = n.is_read ? "transparent" : "rgba(99, 102, 241, 0.04)";
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.82rem", fontWeight: n.is_read ? 600 : 700, color: "#0f172a", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "#ea580c", flexShrink: 0, marginTop: "6px" }} />
                    )}
                  </div>
                  {n.body && (
                    <span style={{ fontSize: "0.72rem", color: "#475569", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                      {n.body}
                    </span>
                  )}
                  <span style={{ fontSize: "0.62rem", fontWeight: 600, color: "#94a3b8", fontFamily: "var(--font-sans)", marginTop: "0.15rem" }}>
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
