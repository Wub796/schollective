"use client";

/**
 * Whether the app can reach its server right now.
 *
 * The notification feed, the sidebar badges and the chat poll all make the same
 * request every few seconds, and any of them can be the first to discover that
 * the backend — or the database behind it — is down. This module is the one
 * place that answer is kept, so the island can say "Offline" instead of
 * "All caught up" (which, when nothing is arriving, is a lie) and the chat
 * composer can explain a failed send.
 *
 * A module store rather than context: the island and the feed provider are
 * siblings deep in the tree, and the chat thread is a different subtree again.
 * `useSyncExternalStore` reads it without threading a provider through all of
 * them.
 *
 * State survives tab switches and client navigation because it lives at module
 * scope in the browser, and it is deliberately never persisted: a reload while
 * offline is the server's failure to render the page, which this cannot fix.
 */

import { useSyncExternalStore } from "react";

export type ConnectionState = "online" | "offline";

const listeners = new Set<() => void>();
let state: ConnectionState = "online";

function setState(next: ConnectionState): void {
  if (state === next) return;
  state = next;
  for (const listener of listeners) listener();
}

export function reportOnline(): void {
  setState("online");
}

export function reportOffline(): void {
  setState("offline");
}

/**
 * A response means the server answered. A 5xx is the server (or its database)
 * failing, which for the reader is the same as being offline; an error status
 * it chose deliberately — 401, 404, 429 — still means it is there and reachable.
 */
export function reportResponse(response: Response): void {
  setState(response.status >= 500 ? "offline" : "online");
}

/** A thrown request is the network, not a status the server chose. */
export function reportRequestFailure(): void {
  setState("offline");
}

/** The current answer, for tests and non-hook callers. */
export function currentConnection(): ConnectionState {
  return state;
}

function subscribe(listener: () => void): () => void {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function useConnection(): ConnectionState {
  // The server has no opinion; assume online so the first render matches the
  // markup, and let the first fetch correct it.
  return useSyncExternalStore(subscribe, currentConnection, () => "online" as const);
}

/**
 * Listens to the browser's own online/offline events for the lifetime of the
 * mount. The notification provider calls this once, but it is safe to call from
 * several components: every subscription is independent.
 */
export function watchBrowserConnectivity(): () => void {
  if (typeof window === "undefined") return () => {};

  const onOnline = () => reportOnline();
  const onOffline = () => reportOffline();

  window.addEventListener("online", onOnline);
  window.addEventListener("offline", onOffline);
  if (!navigator.onLine) reportOffline();

  return () => {
    window.removeEventListener("online", onOnline);
    window.removeEventListener("offline", onOffline);
  };
}
