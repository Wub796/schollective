"use client";

/**
 * The list of notifications, shown in the same body the island's card uses.
 *
 * This is what the bell used to open, so it is judged against that: the same
 * rows, the same links, the same "opening it means you have read them". Three
 * things it does differently, all of them consequences of living in the island:
 *
 *   - Each row carries the mark of its type, in that type's tint, so the list
 *     reads with the same vocabulary as the card that announced it.
 *   - The header keeps the count of what was new *when the list was opened*. The
 *     bell cleared the badge on open and then had nothing left to tell the reader
 *     how much had been waiting.
 *   - Nothing here polls. The rows are the island's feed, so a notification that
 *     arrives while this is open appears in it, already counted.
 */

import Link from "next/link";
import {
  notificationHref,
  notificationLines,
  notificationStyle,
  timeAgo,
  type IslandViewer,
} from "@/lib/notification-style";
import type { FeedNotification } from "./NotificationCenter";
import { NotificationGlyphMark } from "./glyphs";

interface IslandInboxProps {
  id: string;
  notifications: readonly FeedNotification[];
  viewer: IslandViewer;
  /** What was unread when this was opened; the rows themselves may already be read. */
  unreadAtOpen: number;
  /** Navigating away closes the panel — it is anchored to a bar that stays put. */
  onNavigate: () => void;
}

export function IslandInbox({ id, notifications, viewer, unreadAtOpen, onNavigate }: IslandInboxProps) {
  return (
    // `data-no-morph` is the site cursor's opt-out (see CustomCursor): a cursor
    // ring snapping to the bounds of a scrollable list, across whatever row the
    // pointer is on, is a ring that jumps on every wheel notch.
    <div className="island-inbox" id={id} role="dialog" aria-label="Notifications list" data-no-morph>
      <div className="island-inbox-head">
        <div className="island-inbox-head-title-wrap">
          <NotificationGlyphMark glyph="inbox" size={13} />
          <span className="island-inbox-title">Notifications</span>
        </div>
        {unreadAtOpen > 0 ? (
          <span className="island-inbox-new">{unreadAtOpen} new</span>
        ) : (
          <span className="island-inbox-caught-up">All caught up</span>
        )}
      </div>

      <div className="island-inbox-list hide-scrollbar">
        {notifications.length === 0 ? (
          <div className="island-inbox-empty">
            <span className="island-inbox-empty-icon" aria-hidden="true">
              <NotificationGlyphMark glyph="inbox" size={20} />
            </span>
            <p className="island-inbox-empty-title">Nothing here yet</p>
            <p className="island-inbox-empty-body">
              Activity on your requests, threads and friends lands here.
            </p>
          </div>
        ) : (
          notifications.map((row) => {
            const style = notificationStyle(row.type, viewer.role);
            const { title, message } = notificationLines(row);

            return (
              <Link
                key={row.id}
                href={notificationHref(row, viewer.role)}
                onClick={onNavigate}
                className="island-inbox-row"
                data-read={row.is_read ? "true" : "false"}
              >
                <span className="island-inbox-mark" style={{ color: style.ink }} aria-hidden="true">
                  <NotificationGlyphMark glyph={style.glyph} size={14} />
                </span>
                <span className="island-inbox-copy">
                  <span className="island-inbox-row-top">
                    <span className="island-inbox-row-title">{title}</span>
                    <span className="island-inbox-row-meta">
                      <span className="island-inbox-row-time">{timeAgo(row.created_at)}</span>
                      {!row.is_read && <span className="island-inbox-dot" aria-hidden="true" />}
                    </span>
                  </span>
                  {message && <span className="island-inbox-row-body">{message}</span>}
                </span>
              </Link>
            );
          })
        )}
      </div>
    </div>
  );
}
