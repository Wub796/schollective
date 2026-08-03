"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { RefreshCw, LogOut } from "lucide-react";

export function PendingActions() {
  const router = useRouter();
  const supabase = createClient();
  const [refreshing, setRefreshing] = useState(false);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Next.js router.refresh() will re-run the server component logic
    router.refresh();
    // Artificial delay for feedback
    setTimeout(() => setRefreshing(false), 800);
  };

  const handleSignOut = async () => {
    await supabase.auth.signOut();
    router.push("/login");
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "1.25rem", width: "100%" }}>
      <button
        onClick={handleRefresh}
        disabled={refreshing}
        type="button"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.6rem",
          padding: "1.1rem 1.75rem",
          borderRadius: "100px",
          background: "#4f46e5",
          border: "2px solid #4f46e5",
          color: "#ffffff",
          fontSize: "0.95rem",
          fontWeight: 700,
          cursor: refreshing ? "not-allowed" : "pointer",
          opacity: refreshing ? 0.7 : 1,
          boxShadow: "0 4px 14px rgba(79, 70, 229, 0.25)",
          fontFamily: "var(--font-sans)",
        }}
      >
        <RefreshCw size={18} className={refreshing ? "animate-spin" : ""} />
        <span>{refreshing ? "Checking status..." : "Refresh Application Status"}</span>
      </button>
      
      <button
        onClick={handleSignOut}
        type="button"
        style={{
          width: "100%",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: "0.5rem",
          padding: "1rem 1.75rem",
          borderRadius: "100px",
          background: "transparent",
          border: "2px solid #0f172a",
          color: "#0f172a",
          fontSize: "0.9rem",
          fontWeight: 700,
          cursor: "pointer",
          fontFamily: "var(--font-sans)",
        }}
      >
        <LogOut size={16} />
        <span>Sign Out &amp; Return Home</span>
      </button>
    </div>
  );
}
