import Link from "next/link";

// Styled for the light theme. This page was left over from the old dark design:
// a near-black background with near-black text, so every 404 rendered blank.
export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "60vw", maxWidth: 600, maxHeight: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(79, 70, 229, 0.08) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.02em" }}>Schollective</span>
        </Link>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(79, 70, 229, 0.35)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "var(--accent)", fontFamily: "var(--font-sans)" }}>404 · Not Found</span>
        </div>

        {/* Number */}
        <div aria-hidden="true" className="font-display" style={{ fontSize: "clamp(6rem, 18vw, 12rem)", fontWeight: 900, color: "rgba(79, 70, 229, 0.08)", letterSpacing: "-0.06em", lineHeight: 1, userSelect: "none" }}>
          404
        </div>

        <div style={{ marginTop: "-3rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: "1rem" }}>
            Page not<br />
            <em style={{ fontStyle: "italic", color: "var(--accent)", fontWeight: 300 }}>found.</em>
          </h1>
          <p style={{ fontSize: "0.88rem", color: "var(--text-secondary)", opacity: 0.8, lineHeight: 1.8, fontFamily: "var(--font-sans)", maxWidth: 400 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.2)" }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.85rem 2rem", background: "var(--accent)", color: "#ffffff", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer", boxShadow: "0 4px 14px rgba(79, 70, 229, 0.2)" }}>
              Go Home
            </div>
          </Link>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.85rem 2rem", background: "rgba(79, 70, 229, 0.06)", color: "var(--accent)", border: "1px solid rgba(79, 70, 229, 0.3)", borderRadius: "100px", fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Sign In
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
