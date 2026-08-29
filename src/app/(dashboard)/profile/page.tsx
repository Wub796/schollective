"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { AccountSecuritySettings } from "@/components/features/AccountSecuritySettings";

export default function ProfilePage() {
  const router = useRouter();
  const [profile, setProfile] = React.useState<any>(null);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      try {
        const res = await fetch("/api/auth/profile");
        if (!res.ok) {
          router.push("/login");
          return;
        }
        const data = await res.json();
        setProfile(data.profile);
      } catch (err) {
        console.error("Failed to load profile:", err);
      } finally {
        setFetching(false);
      }
    })();
  }, [router]);

  if (fetching) {
    return (
      <div style={{ padding: "3rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "1.5rem", height: "2px", background: "#6366f1" }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
          Loading Settings…
        </span>
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "800px", paddingBottom: "6rem" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
            Account Center
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Security & <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Preferences</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#475569", margin: 0, opacity: 0.85 }}>
          Manage your password, account verification details, security settings, and UI preferences.
        </p>
      </header>

      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

      <AccountSecuritySettings profile={profile} />
    </div>
  );
}
