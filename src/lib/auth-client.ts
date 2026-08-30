import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
});

export const { signIn, signUp, signOut, useSession } = authClient;

/**
 * Turns a Better Auth client error into something worth showing a user.
 *
 * A request that fails before Better Auth can answer (server crash, gateway
 * error, offline) comes back with an error object that has no `message`, so a
 * plain `error.message || fallback` hides the status code that would explain
 * what went wrong.
 */
export function authErrorMessage(error: unknown, fallback: string): string {
  if (!error) return fallback;

  const err = error as { message?: unknown; statusText?: unknown; status?: unknown };
  const message = typeof err.message === "string" ? err.message.trim() : "";
  if (message) return message;

  const statusText = typeof err.statusText === "string" ? err.statusText.trim() : "";
  if (statusText) return `${fallback} (${statusText})`;

  if (typeof err.status === "number") return `${fallback} (HTTP ${err.status})`;

  return fallback;
}
