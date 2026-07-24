import React from "react";
import { redirect } from "next/navigation";
import { createClient } from "@/utils/supabase/server";
import { LottieReview } from "./LottieReview";
import { PendingActions } from "./PendingActions";
import { ShieldCheck, Info } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function ProfessorPendingPage() {
  const supabase = await createClient();
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("status, role, preferred_name, first_name")
    .eq("id", session.user.id)
    .single();

  if (!profile || profile.role !== "professor") redirect("/dashboard");
  if (profile.status === "approved") redirect("/prof/dashboard");

  const displayName = profile.preferred_name || profile.first_name || "Professor";

  return (
    <div className="page-bg flex items-center justify-center p-8" style={{ minHeight: "100vh" }}>
      <main className="relative z-10 w-full max-w-[500px] text-center">
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          border: "1.5px solid rgba(161, 197, 209, 0.5)",
          borderRadius: "24px",
          padding: "3.5rem 3rem",
          backdropFilter: "blur(24px)",
          boxShadow: "0 20px 60px rgba(0,0,0,0.06)",
        }}>
          <LottieReview />

          <header style={{ marginBottom: "2.5rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.4rem 1rem", borderRadius: "100px",
              background: "#FFC20F",
              border: "1px solid rgba(255, 194, 15, 0.6)",
              fontSize: "0.6rem", fontWeight: 800, letterSpacing: "0.2em",
              textTransform: "uppercase" as const,
              color: "#141005",
              fontFamily: "var(--font-sans, monospace)",
              marginBottom: "1.5rem",
            }}>
              <ShieldCheck size={14} />
              Verification in Progress
            </div>
            <h1 className="font-display" style={{
              fontSize: "2.4rem", fontWeight: 900, color: "#141005",
              letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem",
            }}>
              Application Under{" "}
              <em style={{ fontStyle: "italic", color: "#008CBB", fontWeight: 300 }}>Review</em>
            </h1>
            <p style={{
              fontSize: "0.9rem", color: "#3b3527", opacity: 0.75,
              lineHeight: 1.7, fontFamily: "var(--font-sans)",
            }}>
              Welcome, Dr. {displayName}. Your academic profile has been submitted for manual verification.
            </p>
          </header>

          <div style={{
            background: "rgba(161, 197, 209, 0.15)",
            border: "1px solid rgba(161, 197, 209, 0.4)",
            borderRadius: "16px",
            padding: "1.5rem",
            textAlign: "left",
            marginBottom: "2.5rem",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
              <Info size={18} style={{ color: "#008CBB", marginTop: "0.1rem", flexShrink: 0 }} />
              <div>
                <h3 style={{
                  fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.2em",
                  textTransform: "uppercase" as const, color: "#008CBB",
                  fontFamily: "var(--font-sans, monospace)", marginBottom: "0.5rem",
                }}>
                  Our Verification Process
                </h3>
                <p style={{
                  fontSize: "0.82rem", color: "#3b3527", opacity: 0.8,
                  lineHeight: 1.7, fontFamily: "var(--font-sans)",
                }}>
                  Schollective manually verifies institutional credentials and expertise fields to ensure the highest standard of academic mentorship. This typically takes 24–48 business hours.
                </p>
              </div>
            </div>
          </div>

          <PendingActions />
        </div>
      </main>
    </div>
  );
}

