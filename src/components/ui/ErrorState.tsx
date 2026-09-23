"use client";

import * as Sentry from "@sentry/nextjs";
import Link from "next/link";
import { useEffect } from "react";

/**
 * The one thing a user sees when something breaks, so it is designed rather
 * than a stack of default sans-serif.
 *
 * Two details are deliberate:
 *
 *  - Every colour goes through a CSS variable *with a literal fallback*. The
 *    root error boundary renders in place of the root layout when the layout
 *    itself fails, so `globals.css` may never have loaded; without the
 *    fallbacks those tokens resolve to nothing and the text renders in the
 *    browser's default black-on-white instead of the app's ink-on-paper.
 *  - The digest is shown. It is the only value that lets a report be matched
 *    to a server log, and it is otherwise invisible to the person reporting.
 *  - "Go home" points at `/home`, not at `/`. This is a client component and
 *    cannot know whether the person reading it is signed in, so it hands the
 *    question to a route that can: `/` for a stranger, the dashboard for
 *    someone with a session. A signed-in user sent to the marketing page is
 *    stranded rather than helped, which is the opposite of the point.
 */
export function ErrorState({
  error,
  reset,
  scope,
}: {
  error: Error & { digest?: string };
  reset: () => void;
  /** Tags the Sentry event so the failing surface is identifiable. */
  scope: string;
}) {
  useEffect(() => {
    Sentry.captureException(error, { tags: { scope } });
  }, [error, scope]);

  return (
    <div
      style={{
        minHeight: "70vh",
        background: "var(--bg-base, #faf9f7)",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: "3rem 2rem",
      }}
    >
      <div
        style={{
          maxWidth: 520,
          width: "100%",
          display: "flex",
          flexDirection: "column",
          gap: "1.75rem",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span
            aria-hidden="true"
            style={{
              width: "1.5rem",
              height: "1px",
              background: "rgba(79, 70, 229, 0.35)",
              display: "block",
              flex: "0 0 auto",
            }}
          />
          <span
            style={{
              fontSize: "0.55rem",
              fontWeight: 700,
              letterSpacing: "0.38em",
              textTransform: "uppercase",
              color: "var(--accent, #4f46e5)",
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
            }}
          >
            Something went wrong
          </span>
        </div>

        <h1
          style={{
            fontFamily: "var(--font-display, Georgia, serif)",
            fontSize: "clamp(1.7rem, 3.6vw, 2.5rem)",
            fontWeight: 800,
            color: "var(--text-primary, #0f172a)",
            letterSpacing: "-0.035em",
            lineHeight: 1.15,
            margin: 0,
          }}
        >
          {/* The space before the break matters: without it the rendered lines
              are still "We couldn't load" / "this page.", but the accessible
              name concatenates to "We couldn't loadthis page." */}
          We couldn&apos;t load{" "}
          <br />
          <em style={{ color: "var(--accent, #4f46e5)" }}>this page.</em>
        </h1>

        <p
          style={{
            fontSize: "0.88rem",
            color: "var(--text-secondary, #475569)",
            lineHeight: 1.8,
            fontFamily: "var(--font-sans, system-ui, sans-serif)",
            margin: 0,
          }}
        >
          The problem is on our side, not yours. Trying again often works — nothing you
          entered has been lost.
        </p>

        {error.digest ? (
          <p
            style={{
              fontSize: "0.7rem",
              color: "var(--text-tertiary, #64748b)",
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              margin: 0,
            }}
          >
            Reference{" "}
            <code
              style={{
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                fontSize: "0.7rem",
                color: "var(--text-secondary, #475569)",
              }}
            >
              {error.digest}
            </code>
            {/* Quote the string so the space before the break survives: without
                it the accessible name reads "referenceABC123". */}
            {" "}— quote this if you contact us.
          </p>
        ) : null}

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.2)" }} />

        <div style={{ display: "flex", gap: "0.75rem", flexWrap: "wrap" }}>
          <button
            type="button"
            onClick={() => reset()}
            style={{
              padding: "0.8rem 1.9rem",
              background: "var(--accent, #4f46e5)",
              color: "#ffffff",
              border: "none",
              borderRadius: "100px",
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              cursor: "pointer",
              boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)",
            }}
          >
            Try again
          </button>

          <Link
            href="/home"
            style={{
              padding: "0.8rem 1.9rem",
              background: "rgba(79, 70, 229, 0.06)",
              color: "var(--accent, #4f46e5)",
              border: "1px solid rgba(79, 70, 229, 0.3)",
              borderRadius: "100px",
              fontSize: "0.62rem",
              fontWeight: 800,
              letterSpacing: "0.2em",
              textTransform: "uppercase",
              fontFamily: "var(--font-sans, system-ui, sans-serif)",
              textDecoration: "none",
            }}
          >
            Go home
          </Link>
        </div>
      </div>
    </div>
  );
}
