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
    <div className="page-bg flex items-center justify-center p-6" style={{ minHeight: "100vh" }}>
      <main className="relative z-10 w-full max-w-[500px] text-center">
        <div style={{
          background: "rgba(17, 17, 22, 0.7)",
          border: "1px solid rgba(129, 140, 248, 0.1)",
          borderRadius: "20px",
          padding: "3rem 2.5rem",
          backdropFilter: "blur(24px)",
          boxShadow: "0 40px 80px rgba(0,0,0,0.5)",
        }}>
          <LottieReview />

          <header style={{ marginBottom: "2rem" }}>
            <div style={{
              display: "inline-flex", alignItems: "center", gap: "0.5rem",
              padding: "0.3rem 0.85rem", borderRadius: "100px",
              background: "rgba(129, 140, 248, 0.06)",
              border: "1px solid rgba(129, 140, 248, 0.15)",
              fontSize: "0.52rem", fontWeight: 700, letterSpacing: "0.22em",
              textTransform: "uppercase" as const,
              color: "rgba(129, 140, 248, 0.7)",
              fontFamily: "var(--font-mono, monospace)",
              marginBottom: "1.5rem",
            }}>
              <ShieldCheck size={11} />
              Verification in Progress
            </div>
            <h1 className="font-display" style={{
              fontSize: "2rem", fontWeight: 900, color: "rgba(250, 250, 249, 0.9)",
              letterSpacing: "-0.03em", lineHeight: 1.1, marginBottom: "1rem",
            }}>
              Application Under{" "}
              <em style={{ fontStyle: "italic", color: "rgba(250, 250, 249, 0.3)" }}>Review</em>
            </h1>
            <p style={{
              fontSize: "0.82rem", color: "rgba(168, 179, 207, 0.5)",
              lineHeight: 1.7, fontFamily: "var(--font-sans)",
            }}>
              Welcome, Dr. {displayName}. Your academic profile has been submitted for manual verification.
            </p>
          </header>

          <div style={{
            background: "rgba(129, 140, 248, 0.04)",
            border: "1px solid rgba(129, 140, 248, 0.1)",
            borderRadius: "14px",
            padding: "1.25rem",
            textAlign: "left",
            marginBottom: "2rem",
          }}>
            <div style={{ display: "flex", alignItems: "flex-start", gap: "0.875rem" }}>
              <Info size={15} style={{ color: "rgba(129, 140, 248, 0.4)", marginTop: "0.1rem", flexShrink: 0 }} />
              <div>
                <h3 style={{
                  fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em",
                  textTransform: "uppercase" as const, color: "rgba(129, 140, 248, 0.5)",
                  fontFamily: "var(--font-mono, monospace)", marginBottom: "0.5rem",
                }}>
                  Our Verification Process
                </h3>
                <p style={{
                  fontSize: "0.78rem", color: "rgba(168, 179, 207, 0.45)",
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

