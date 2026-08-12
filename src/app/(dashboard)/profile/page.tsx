"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/utils/supabase/client";
import { ProfProfileForm } from "@/app/(dashboard)/prof/profile/ProfProfileForm";
import { StudentProfileForm } from "@/app/(dashboard)/profile/StudentProfileForm";

export default function ProfilePage() {
  const router   = useRouter();
  const supabase = createClient();
  const [profile, setProfile]   = React.useState<any>(null);
  const [fetching, setFetching] = React.useState(true);

  React.useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { router.push("/login"); return; }
      const { data } = await supabase.from("profiles").select("*").eq("id", user.id).single();
      setProfile(data);
      setFetching(false);
    })();
  }, [router, supabase]);

  if (fetching) {
    return (
      <div style={{ padding: "3rem 0", display: "flex", alignItems: "center", gap: "0.75rem" }}>
        <div style={{ width: "1.5rem", height: "2px", background: "#6366f1" }} />
        <span style={{ fontSize: "0.7rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
          Loading Profile…
        </span>
      </div>
    );
  }

  if (profile?.role === "professor") {
    return (
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "900px", paddingBottom: "6rem" }}>
        <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
            <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
              Faculty Portal
            </span>
          </div>
          <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
            Faculty Profile <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Manager</em>
          </h1>
          <p style={{ fontSize: "0.9rem", color: "#475569", margin: 0, opacity: 0.85 }}>
            Manage your account, personal details, research focus, office hours, mentee preferences, and publications.
          </p>
        </header>

        <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

        <ProfProfileForm profile={profile} />
      </div>
    );
  }

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "2rem", maxWidth: "900px", paddingBottom: "6rem" }}>
      <header style={{ display: "flex", flexDirection: "column", gap: "0.75rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "2px", background: "#6366f1", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.22em", textTransform: "uppercase", color: "#4f46e5", fontFamily: "var(--font-sans, monospace)" }}>
            Student Portal
          </span>
        </div>
        <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4.5vw, 3.6rem)", fontWeight: 900, color: "#0f172a", letterSpacing: "-0.035em", lineHeight: 1.1 }}>
          Student Profile <em style={{ fontStyle: "italic", color: "#4f46e5", fontWeight: 300 }}>Manager</em>
        </h1>
        <p style={{ fontSize: "0.9rem", color: "#475569", margin: 0, opacity: 0.85 }}>
          Manage your research profile, academic standing, project accomplishments, coursework, skills, and portfolio link.
        </p>
      </header>

      <div style={{ height: "1px", background: "rgba(99, 102, 241, 0.15)" }} />

      <StudentProfileForm profile={profile} />
    </div>
  );
}
