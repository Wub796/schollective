export default function LoadingDashboard() {
  return (
    <div style={{ padding: "3rem 0", display: "flex", flexDirection: "column", gap: "3rem" }}>
      {/* Header skeleton */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        <div style={{ width: "80px", height: "8px", borderRadius: "4px", background: "rgba(255,255,255,0.06)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "320px", maxWidth: "80%", height: "44px", borderRadius: "8px", background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite" }} />
        <div style={{ width: "240px", maxWidth: "60%", height: "16px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
      </div>
      {/* Stat cards skeleton */}
      <div style={{ display: "grid", gridTemplateColumns: "repeat(3, 1fr)", gap: "1rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ padding: "1.5rem", border: "1px solid rgba(255,255,255,0.05)", borderRadius: "14px", background: "rgba(255,255,255,0.02)", display: "flex", flexDirection: "column", gap: "0.75rem" }}>
            <div style={{ width: "60px", height: "36px", borderRadius: "6px", background: "rgba(255,255,255,0.05)", animation: "pulse 1.5s ease-in-out infinite" }} />
            <div style={{ width: "80px", height: "10px", borderRadius: "4px", background: "rgba(255,255,255,0.04)", animation: "pulse 1.5s ease-in-out infinite" }} />
          </div>
        ))}
      </div>
      {/* Content skeleton */}
      <div style={{ height: "1px", background: "rgba(255,255,255,0.04)" }} />
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {[1, 2, 3].map((i) => (
          <div key={i} style={{ height: "96px", borderRadius: "14px", border: "1px solid rgba(255,255,255,0.05)", background: "rgba(255,255,255,0.02)", animation: "pulse 1.5s ease-in-out infinite" }} />
        ))}
      </div>
    </div>
  );
}
