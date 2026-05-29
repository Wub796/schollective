import Link from "next/link";

export default function NotFound() {
  return (
    <div style={{ minHeight: "100vh", background: "#080c14", display: "flex", alignItems: "center", justifyContent: "center", padding: "2rem" }}>
      {/* Ambient glow */}
      <div style={{ position: "fixed", top: "30%", left: "50%", transform: "translateX(-50%)", width: "60vw", height: "60vw", maxWidth: 600, maxHeight: 600, borderRadius: "50%", background: "radial-gradient(circle, rgba(35,70,180,0.08) 0%, transparent 70%)", filter: "blur(80px)", pointerEvents: "none" }} />

      <div style={{ position: "relative", zIndex: 1, maxWidth: 520, width: "100%", display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Wordmark */}
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-display" style={{ fontSize: "1.05rem", fontWeight: 800, color: "#fff", letterSpacing: "-0.02em" }}>Schollective</span>
        </Link>

        {/* Eyebrow */}
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(255,255,255,0.2)", display: "block" }} />
          <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.38em", textTransform: "uppercase", color: "rgba(255,255,255,0.32)", fontFamily: "var(--font-sans)" }}>404 — Not Found</span>
        </div>

        {/* Number */}
        <div className="font-display" style={{ fontSize: "clamp(6rem, 18vw, 12rem)", fontWeight: 900, color: "rgba(255,255,255,0.06)", letterSpacing: "-0.06em", lineHeight: 1, userSelect: "none" }}>
          404
        </div>

        <div style={{ marginTop: "-3rem" }}>
          <h1 className="font-display" style={{ fontSize: "clamp(1.8rem, 4vw, 2.8rem)", fontWeight: 900, color: "#fff", letterSpacing: "-0.035em", lineHeight: 1.1, marginBottom: "1rem" }}>
            Page not<br />
            <em style={{ fontStyle: "italic", color: "rgba(255,255,255,0.35)" }}>found.</em>
          </h1>
          <p style={{ fontSize: "0.88rem", color: "rgba(255,255,255,0.38)", lineHeight: 1.8, fontFamily: "var(--font-sans)", maxWidth: 400 }}>
            The page you&apos;re looking for doesn&apos;t exist or has been moved.
          </p>
        </div>

        {/* Divider */}
        <div style={{ height: "1px", background: "rgba(255,255,255,0.06)" }} />

        {/* Actions */}
        <div style={{ display: "flex", gap: "1rem", flexWrap: "wrap" }}>
          <Link href="/" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.85rem 2rem", background: "#fff", color: "#080c14", borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Go Home
            </div>
          </Link>
          <Link href="/login" style={{ textDecoration: "none" }}>
            <div style={{ padding: "0.85rem 2rem", background: "transparent", color: "rgba(255,255,255,0.5)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "100px", fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", fontFamily: "var(--font-sans)", cursor: "pointer" }}>
              Sign In
            </div>
          </Link>
        </div>
      </div>
    </div>
  );
}
