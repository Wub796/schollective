"use client";

import React, { useState, useEffect, useTransition, useRef } from "react";
import { createClient } from "@/utils/supabase/client";
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
  const supabase = createClient();
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
      const { data: { user } } = await supabase.auth.getUser();
      if (!user || !mounted) return;

      const { data } = await supabase
        .from("notifications")
        .select("*")
        .eq("user_id", user.id)
        .order("created_at", { ascending: false })
        .limit(20);

      if (data && mounted) setNotifications(data);
    };

    fetchNotifications();

    // Real-time subscription for new notifications
    const channel = supabase
      .channel("notifications")
      .on("postgres_changes", { event: "INSERT", schema: "public", table: "notifications" }, () => {
        fetchNotifications();
      })
      .subscribe();

    return () => {
      mounted = false;
      supabase.removeChannel(channel);
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
        className="btn-icon"
        style={{
          position: "relative",
          width: "2.2rem",
          height: "2.2rem",
          borderRadius: "50%",
          border: "1px solid rgba(250, 250, 249, 0.1)",
          background: open ? "rgba(250, 250, 249, 0.06)" : "transparent",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          cursor: "pointer",
        }}
      >
        <Bell size={14} color="rgba(250, 250, 249, 0.45)" />
        {unreadCount > 0 && (
          <span style={{
            position: "absolute",
            top: "-2px",
            right: "-2px",
            width: "14px",
            height: "14px",
            borderRadius: "50%",
            background: "rgba(255,120,80,0.9)",
            border: "2px solid #080c14",
            fontSize: "0.45rem",
            fontWeight: 700,
            color: "#fafaf9",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            fontFamily: "var(--font-sans)",
          }}>
            {unreadCount > 9 ? "9+" : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown */}
      {open && (
        <div style={{
          position: "absolute",
          top: "calc(100% + 8px)",
          right: 0,
          width: "320px",
          background: "#0d1221",
          border: "1px solid rgba(250, 250, 249, 0.08)",
          borderRadius: "14px",
          overflow: "hidden",
          boxShadow: "0 16px 48px rgba(0,0,0,0.6)",
          zIndex: 100,
        }}>
          {/* Header */}
          <div style={{ padding: "1rem 1.25rem", borderBottom: "1px solid rgba(250, 250, 249, 0.06)", display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.4)", fontFamily: "var(--font-sans)" }}>
              Notifications
            </span>
            {unreadCount > 0 && (
              <span style={{ fontSize: "0.5rem", fontWeight: 700, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(255,120,80,0.8)", fontFamily: "var(--font-sans)" }}>
                {unreadCount} new
              </span>
            )}
          </div>

          {/* List */}
          <div style={{ maxHeight: "360px", overflowY: "auto" }}>
            {notifications.length === 0 ? (
              <div style={{ padding: "2.5rem 1.25rem", textAlign: "center" }}>
                <Bell size={20} color="rgba(250, 250, 249, 0.1)" style={{ margin: "0 auto 0.75rem" }} />
                <p style={{ fontSize: "0.72rem", color: "rgba(250, 250, 249, 0.25)", fontFamily: "var(--font-sans)" }}>No notifications yet</p>
              </div>
            ) : (
              notifications.map((n, i) => (
                <Link key={n.id} href={getHref()} onClick={() => setOpen(false)} style={{
                  textDecoration: "none",
                  padding: "0.9rem 1.25rem",
                  borderBottom: i < notifications.length - 1 ? "1px solid rgba(250, 250, 249, 0.04)" : "none",
                  background: n.is_read ? "transparent" : "rgba(250, 250, 249, 0.02)",
                  display: "flex",
                  flexDirection: "column",
                  gap: "0.3rem",
                  transition: "background 0.2s"
                }}>
                  <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "0.75rem" }}>
                    <span style={{ fontSize: "0.78rem", fontWeight: 600, color: n.is_read ? "rgba(250, 250, 249, 0.5)" : "rgba(250, 250, 249, 0.85)", fontFamily: "var(--font-sans)", lineHeight: 1.4 }}>
                      {n.title}
                    </span>
                    {!n.is_read && (
                      <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(255,120,80,0.8)", flexShrink: 0, marginTop: "4px" }} />
                    )}
                  </div>
                  {n.body && (
                    <span style={{ fontSize: "0.68rem", color: "rgba(250, 250, 249, 0.3)", fontFamily: "var(--font-sans)", lineHeight: 1.5 }}>
                      {n.body}
                    </span>
                  )}
                  <span style={{ fontSize: "0.5rem", fontWeight: 600, letterSpacing: "0.15em", textTransform: "uppercase", color: "rgba(250, 250, 249, 0.18)", fontFamily: "var(--font-mono, monospace)", marginTop: "0.1rem" }}>
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
