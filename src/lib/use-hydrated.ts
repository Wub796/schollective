"use client";

import { useEffect, useState } from "react";

/**
 * False during server render and the first client paint, true once React has
 * hydrated.
 *
 * Forms in this app submit through an onSubmit handler that calls
 * preventDefault(). Before hydration that handler does not exist yet, so a
 * submit falls through to the browser's native behaviour — a GET that puts
 * every field in the query string. On the sign-in form that means a password
 * in the URL, browser history and server logs. Gating the submit button on
 * this keeps that window closed.
 */
export function useHydrated(): boolean {
  const [hydrated, setHydrated] = useState(false);
  useEffect(() => setHydrated(true), []);
  return hydrated;
}
