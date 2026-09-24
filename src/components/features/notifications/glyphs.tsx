"use client";

/**
 * The one place a notification glyph is turned into an icon.
 *
 * Shared by the island's card and the inbox list, which draw the same eight or
 * so marks at different sizes. It is a module of its own rather than a helper in
 * either of them because they both render it — importing it from one into the
 * other would be a cycle.
 */

import {
  Check,
  Inbox,
  MessageSquare,
  ShieldAlert,
  UserCheck,
  UserMinus,
  UserPlus,
  Users,
  UserX,
  X,
  type LucideIcon,
} from "lucide-react";
import type { NotificationGlyph } from "@/lib/notification-style";

const GLYPHS: Record<NotificationGlyph, LucideIcon> = {
  check: Check,
  cross: X,
  inbox: Inbox,
  chat: MessageSquare,
  shield: ShieldAlert,
  "user-plus": UserPlus,
  "user-check": UserCheck,
  users: Users,
  "user-minus": UserMinus,
  "user-x": UserX,
};

export function NotificationGlyphMark({ glyph, size }: { glyph: NotificationGlyph; size: number }) {
  // `inbox` for anything unrecognised: an unknown glyph should still draw a
  // neutral mark rather than an empty box.
  const Icon = GLYPHS[glyph] ?? Inbox;
  return <Icon size={size} strokeWidth={2.2} aria-hidden="true" />;
}
