import React from "react";
import { Loader2 } from "lucide-react";

type Tone = "primary" | "outline" | "quiet" | "danger";

interface ActionPillProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  tone?: Tone;
  icon?: React.ReactNode;
  /** Swaps the icon for a spinner and disables the pill. */
  loading?: boolean;
}

const TONES: Record<Tone, React.CSSProperties> = {
  primary: {
    background: "var(--accent)",
    border: "1px solid var(--accent)",
    color: "#ffffff",
    boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)",
  },
  outline: {
    background: "rgba(79, 70, 229, 0.06)",
    border: "1px solid rgba(79, 70, 229, 0.35)",
    color: "var(--accent)",
  },
  quiet: {
    background: "transparent",
    border: "1px solid rgba(15, 23, 42, 0.12)",
    color: "var(--text-secondary)",
  },
  danger: {
    background: "rgba(220, 38, 38, 0.05)",
    border: "1px solid rgba(220, 38, 38, 0.2)",
    color: "#dc2626",
  },
};

/**
 * The compact uppercase pill for row-level actions — accept, add, remove.
 * Hover and press timing come from the shared `.btn-action` rule in globals.css.
 */
export function ActionPill({
  tone = "outline",
  icon,
  loading = false,
  disabled,
  children,
  className,
  style,
  ...props
}: ActionPillProps) {
  const inactive = disabled || loading;
  return (
    <button
      type="button"
      disabled={inactive}
      aria-busy={loading || undefined}
      className={["btn-action", className].filter(Boolean).join(" ")}
      style={{
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "0.4rem",
        padding: "0.5rem 1rem",
        borderRadius: "100px",
        fontSize: "0.6rem",
        fontWeight: 800,
        letterSpacing: "0.14em",
        textTransform: "uppercase",
        fontFamily: "var(--font-sans)",
        whiteSpace: "nowrap",
        cursor: inactive ? "not-allowed" : "pointer",
        opacity: disabled && !loading ? 0.5 : 1,
        ...TONES[tone],
        ...style,
      }}
      {...props}
    >
      {loading ? <Loader2 size={12} className="animate-spin" aria-hidden="true" /> : icon}
      {children}
    </button>
  );
}
