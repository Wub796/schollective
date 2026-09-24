/**
 * The notification style table and the island's personalisation rules.
 *
 * The rules asserted here are the ones a screen would otherwise have to
 * re-invent: which tint a type wears, how long it holds the screen, what it
 * says when the stored body only repeats the title, and where tapping it goes.
 * They hold whatever the island looks like next: its chip, its card and the list
 * behind it all read them from the same module.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import * as N from "../src/lib/notification-style.ts";

/** A notification row as the API returns it. */
const row = (over = {}) => ({
  id: "n1",
  type: "message",
  title: "New message from Ada",
  body: "Are you free to talk about the paper this week?",
  link: "/messages/r1",
  is_read: false,
  created_at: "2026-09-25T10:00:00.000Z",
  ...over,
});

const viewer = (over = {}) => ({
  name: "Ada",
  initials: "AL",
  avatarUrl: null,
  role: "student",
  ...over,
});

test("the style table covers exactly the vocabulary the write path inserts", () => {
  // The type of the table already enforces this at compile time; this asserts it
  // of the running module, and — unlike the compiler — it fails loudly if the
  // union is ever widened to `string`, which would make the table's key type
  // accept anything and let a new type ship with no face at all.
  const source = readFileSync(new URL("../src/lib/notifications.ts", import.meta.url), "utf8");
  const start = source.indexOf("export type NotificationType =");
  assert.ok(start > -1, "NotificationType is gone — the style table has nothing to agree with");

  const union = source.slice(start, source.indexOf(";", start));
  const declared = [...union.matchAll(/"([a-z_]+)"/g)].map((match) => match[1]);

  assert.ok(declared.length >= 8, `only found ${declared.length} types in the union`);
  assert.deepEqual(
    Object.keys(N.NOTIFICATION_STYLES).sort(),
    [...declared].sort(),
    "a type was added to or removed from the write path without a style here",
  );
});

test("every style is complete, and its colours are palette tokens", () => {
  for (const [type, style] of Object.entries(N.NOTIFICATION_STYLES)) {
    assert.ok(style.eyebrow.trim(), `${type} has no eyebrow`);
    assert.ok(style.cta.trim(), `${type} has no call to action`);
    // The island draws the glyph by looking it up in its own icon map; a name
    // that is not in there paints nothing at all.
    assert.ok(
      ["check", "cross", "inbox", "chat", "shield", "user-plus", "user-check", "users", "user-minus", "user-x"].includes(style.glyph),
      `${type} asks for a glyph the island cannot draw: ${style.glyph}`,
    );
    // The colour contract in globals.css: literals live in the palette block and
    // nowhere else. A hex here would be the first one to drift.
    for (const colour of [style.accent, style.ink]) {
      assert.match(colour, /^var\(--color-[a-z-]+\)$/, `${type} carries the literal colour ${colour}`);
    }
    // A sticky notification must not carry a lifetime, and vice versa: the
    // component takes `null` to mean "wait for the reader".
    assert.equal(style.sticky, style.holdMs === null, `${type} disagrees about how long it lives`);
    assert.ok(style.holdMs === null || style.holdMs >= 3000, `${type} would flash by in ${style.holdMs}ms`);
  }
});

/**
 * Every `var(--color-x)` a style names, resolved from the palette block in
 * globals.css — the file the colours are supposed to live in and nowhere else.
 * A token that is not in there is a style pointing at nothing.
 */
function palette() {
  const css = readFileSync(new URL("../src/app/globals.css", import.meta.url), "utf8");
  return new Map(
    [...css.matchAll(/--color-([a-z-]+):\s*(#[0-9a-f]{6})\s*;/gi)].map((match) => [match[1], match[2]]),
  );
}

const tokenName = (token) => token.match(/^var\(--color-([a-z-]+)\)$/)?.[1];

function luminance(hex) {
  const value = parseInt(hex.slice(1), 16);
  const [r, g, b] = [(value >> 16) & 255, (value >> 8) & 255, value & 255].map((channel) => {
    const c = channel / 255;
    return c <= 0.04045 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4);
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

function contrast(a, b) {
  const [light, dark] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (light + 0.05) / (dark + 0.05);
}

test("the words on a card can be read on it", () => {
  const colours = palette();
  assert.ok(colours.size >= 8, "the palette did not parse — every colour below is unverified");

  for (const [type, style] of Object.entries(N.NOTIFICATION_STYLES)) {
    for (const token of [style.accent, style.ink]) {
      const name = tokenName(token);
      assert.ok(name, `${type} carries something that is not a palette token: ${token}`);
      assert.ok(colours.has(name), `${type} points at --color-${name}, which globals.css does not define`);
    }

    // The card is the palette's surface white at 94% over a cream page, so white
    // is the honest reference: it is very slightly the harder of the two.
    // 4.5:1 is the floor for the eyebrow and the call to action, which are small
    // text by any measure — the eyebrow is 9px.
    const ratio = contrast(colours.get(tokenName(style.ink)), colours.get("surface"));
    assert.ok(ratio >= 4.5, `${type}'s text is ${ratio.toFixed(2)}:1 on the card, under the 4.5:1 floor`);
  }
});

test("a type nobody has heard of still gets a usable card", () => {
  // A row written by a newer deploy, or a value that arrived from somewhere it
  // should not have. It has to render: a notification nobody can see is worse
  // than a plain one.
  for (const junk of ["bookmark_saved", "", null, undefined, 42, "constructor", "toString", "__proto__"]) {
    const style = N.notificationStyle(junk, "student");
    assert.equal(style.eyebrow, "Notification", `junk type ${String(junk)} did not fall back`);
    assert.ok(style.cta);
    // Never Object.prototype's answer to "constructor".
    assert.equal(typeof style.cta, "string");
    assert.equal(typeof style.glyph, "string");
  }
});

test("a role is one of the three, and anything else reads as a student", () => {
  assert.equal(N.notificationRole("professor"), "professor");
  assert.equal(N.notificationRole("admin"), "admin");
  assert.equal(N.notificationRole("student"), "student");
  for (const junk of ["Professor", "", null, undefined, 7, "constructor"]) {
    assert.equal(N.notificationRole(junk), "student", `${String(junk)} should read as a student`);
  }
});

test("the same notification is written for the reader's role", () => {
  const request = row({ type: "new_request", title: "New mentorship request", body: "", link: "/messages/r9" });

  const professor = N.personaliseNotification(request, viewer({ role: "professor" }));
  assert.equal(professor.eyebrow, "Student request");
  assert.equal(professor.cta, "Review request");

  const admin = N.personaliseNotification(request, viewer({ role: "admin" }));
  assert.equal(admin.eyebrow, "Request filed");
  assert.equal(admin.cta, "View request");

  // A role with no override of its own keeps the type's own wording.
  const student = N.personaliseNotification(request, viewer({ role: "student" }));
  assert.equal(student.eyebrow, "New mentorship request");
});

test("a notification asks for an answer, or announces itself — never both", () => {
  for (const type of ["new_request", "admin_warning", "friend_request", "group_invite"]) {
    assert.equal(
      N.personaliseNotification(row({ type }), viewer()).durationMs,
      null,
      `${type} asks something of the reader, so it must wait for them`,
    );
  }
  for (const type of ["message", "request_accepted", "request_declined", "group_member_left"]) {
    assert.equal(
      typeof N.personaliseNotification(row({ type }), viewer()).durationMs,
      "number",
      `${type} is news, so it should leave on its own`,
    );
  }
});

test("a stored body that only repeats the title is not printed twice", () => {
  // `createNotification` writes `body || title` into the message column, so this
  // is what eight of the eleven types actually store.
  const lines = N.notificationLines({ title: "Your mentorship request was accepted!", body: "Your mentorship request was accepted!" });
  assert.equal(lines.title, "Your mentorship request was accepted!");
  assert.equal(lines.message, "");

  const withBody = N.notificationLines({ title: "New message from Ada", body: "  Shall we meet Thursday?  " });
  assert.equal(withBody.message, "Shall we meet Thursday?");

  const whitespace = N.notificationLines({ title: "  Spaced   out  ", body: "Spaced out" });
  assert.equal(whitespace.message, "", "the same sentence with different spacing is still the same sentence");

  assert.equal(N.notificationLines({}).title, "New notification", "a title is never empty");
  assert.equal(N.notificationLines({ title: null, body: "orphaned body" }).title, "New notification");
});

test("a long line is cut at a word, not through one", () => {
  const long = "word ".repeat(60).trim();
  const cut = N.oneLine(long, 90);
  assert.ok(cut.length <= 91, `cut to ${cut.length} characters`);
  assert.ok(cut.endsWith("…"));
  assert.ok(!cut.includes("  "), "whitespace is collapsed");
  assert.equal(N.oneLine("short", 90), "short", "a line that fits is left alone");
  assert.equal(N.oneLine("word ".repeat(60), 40).includes("wor…"), false, "never cut inside a word");
});

test("the island addresses the reader by name when it has one", () => {
  const accepted = N.personaliseNotification(row({ type: "request_accepted", body: "" }), viewer({ name: "Ada" }));
  assert.equal(accepted.title, "New message from Ada");
  assert.equal(accepted.message, "Ada, your thread is open — say hello.");

  // With no name on file the greeting goes with it, and the sentence still
  // starts as a sentence: not "Student, your thread…", never ", your thread…".
  const anonymous = N.personaliseNotification(row({ type: "request_accepted", body: "" }), N.ANONYMOUS_VIEWER);
  assert.equal(anonymous.message, "Your thread is open — say hello.");
});

test("the island wears the reader's own face, and a disc when there is none", () => {
  const withPhoto = N.personaliseNotification(row(), viewer({ avatarUrl: "/api/storage/avatar/avatars/u_1/1700000000.jpg", initials: "AL" }));
  assert.equal(withPhoto.avatarUrl, "/api/storage/avatar/avatars/u_1/1700000000.jpg");
  assert.equal(withPhoto.initials, "AL");

  const noProfile = N.personaliseNotification(row(), N.ANONYMOUS_VIEWER);
  assert.equal(noProfile.avatarUrl, null);
  assert.equal(noProfile.initials, "?", "an empty disc is not an initial");
});

test("a notification goes where the row says, unless the row's link is not ours", () => {
  assert.equal(N.notificationHref(row({ link: "/messages/r1" }), "student"), "/messages/r1");
  assert.equal(N.notificationHref(row({ link: "/students/u_2" }), "professor"), "/students/u_2");

  // Only a site-relative path, because the island navigates with it and a
  // notification can be raised from anywhere in the tree.
  for (const hostile of ["https://evil.example", "//evil.example", "/\\evil.example", "javascript:alert(1)", "  ", null, 42]) {
    assert.equal(
      N.notificationHref(row({ link: hostile }), "student"),
      "/dashboard",
      `${String(hostile)} should not be followed`,
    );
  }

  // An admin's home, not a thread: a warning is about the account.
  assert.equal(N.notificationHref(row({ type: "admin_warning", link: null }), "admin"), "/admin/dashboard");
  assert.equal(N.notificationHref(row({ type: "admin_warning", link: "/messages/r1" }), "professor"), "/prof/dashboard");
});

test("a professor is sent to the queue, not to a thread that does not exist yet", () => {
  // The stored link for a new request is the thread it would open *if* the
  // request were accepted — so it is the one row whose link has to be ignored.
  const request = row({ type: "new_request", link: "/messages/r9" });
  assert.equal(N.notificationHref(request, "professor"), "/prof/pending");

  // The exception belongs to the reader with a decision to make and to nobody
  // else: any other holder of the row goes where it points, or home if it points
  // nowhere. (A request is addressed to a professor, so the other two roles are
  // the shape a future reader would arrive in.)
  assert.equal(N.notificationHref(request, "admin"), "/messages/r9");
  assert.equal(N.notificationHref({ ...request, link: null }, "admin"), "/admin/dashboard");
  assert.equal(N.notificationHref({ ...request, link: null }, "student"), "/dashboard");
});

test("an age is read in the units a reader thinks in", () => {
  const at = Date.parse("2026-09-25T12:00:00.000Z");
  const ago = (ms) => N.timeAgo(new Date(at - ms).toISOString(), at);

  assert.equal(ago(0), "just now");
  assert.equal(ago(59_000), "just now");
  assert.equal(ago(60_000), "1m ago");
  assert.equal(ago(59 * 60_000), "59m ago");
  assert.equal(ago(60 * 60_000), "1h ago");
  assert.equal(ago(23 * 3_600_000), "23h ago");
  assert.equal(ago(24 * 3_600_000), "1d ago");
  assert.equal(ago(6 * 86_400_000), "6d ago");
  // Past a week a relative age stops being useful and the date takes over.
  assert.match(ago(9 * 86_400_000), /^[A-Z][a-z]{2} \d{1,2}$/);
  // A clock that ran backwards is not a negative age.
  assert.equal(N.timeAgo(new Date(at + 5_000).toISOString(), at), "just now");

  // Nothing to render is nothing, never "NaN ago" or a dash.
  for (const junk of [null, undefined, "", "not a date", 42, {}]) {
    assert.equal(N.timeAgo(junk, at), "", `${String(junk)} should read as empty`);
  }
});

test("the island and its inbox describe the same row the same way", () => {
  const stored = row({ type: "friend_request", title: "Ada Lovelace sent you a friend request", body: "Ada Lovelace sent you a friend request", link: "/friends" });
  const content = N.personaliseNotification(stored, viewer({ role: "student" }));
  const lines = N.notificationLines(stored);

  assert.equal(content.title, lines.title);
  assert.equal(content.eyebrow, N.NOTIFICATION_STYLES.friend_request.eyebrow);
  assert.equal(content.href, "/friends");
  assert.equal(content.durationMs, null, "an unanswered friend request stays put");
  assert.equal(content.message, "Ada, open Friends to accept or decline.", "the duplicate is replaced, not repeated");
});
