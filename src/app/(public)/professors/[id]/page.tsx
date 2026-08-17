import React from "react";
import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { sql } from "@/lib/neon/db";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { ArrowLeft, GraduationCap, Building2, BookOpen, Mail, ShieldCheck } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { AppShell } from "@/components/layout/AppShell";

export const revalidate = 300;
export const dynamicParams = true;

interface PageProps {
  params: Promise<{ id: string }>;
}

function parseArray(val: any): string[] {
  if (Array.isArray(val)) return val;
  if (typeof val === "string") {
    try {
      const parsed = JSON.parse(val);
      if (Array.isArray(parsed)) return parsed;
    } catch {
      return val ? [val] : [];
    }
  }
  return [];
}

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { id } = await params;

  const professors = await sql`
    SELECT first_name, last_name, preferred_name, institution, expertise_fields, avatar_url
    FROM profiles
    WHERE id = ${id} AND role = 'professor' AND status = 'approved'
    LIMIT 1;
  `;
  const professor = professors[0];

  if (!professor) return { title: "Professor Profile | Schollective" };

  const displayName = professor.preferred_name || professor.first_name;
  const expertiseList = parseArray(professor.expertise_fields);
  const title = `Dr. ${displayName} ${professor.last_name} — ${professor.institution} | Schollective`;
  const description = `Connect with Dr. ${displayName} ${professor.last_name}, expert in ${expertiseList.length > 0 ? expertiseList.join(", ") : "academic research"}. Apply for structured mentorship on Schollective.`;

  return {
    title,
    description,
    alternates: {
      canonical: `/professors/${id}`,
    },
    openGraph: {
      title,
      description,
      type: "profile",
      url: `/professors/${id}`,
      images: [
        {
          url: professor.avatar_url?.split("?")[0] || "/og-image.png",
          alt: `Dr. ${displayName} ${professor.last_name}`,
        },
      ],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [professor.avatar_url?.split("?")[0] || "/og-image.png"],
    },
  };
}

function ProfessorDetail({
  professor,
  similarProfessors,
  hasActiveRequest,
  existingRequestStatus,
  existingRequestId,
  user
}: {
  professor: any;
  similarProfessors: any[];
  hasActiveRequest: boolean;
  existingRequestStatus?: string;
  existingRequestId?: string;
  user: any;
}) {
  const displayName = professor.preferred_name || professor.first_name;
  const initials    = `${professor.first_name?.[0] ?? ""}${professor.last_name?.[0] ?? ""}`.toUpperCase();
  const isAccepting = professor.is_accepting_requests !== false;

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "4rem", paddingBottom: "6rem" }}>
      {/* Header */}
      <header style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
          <span style={{ width: "1.5rem", height: "1px", background: "rgba(15, 23, 42, 0.2)", display: "block" }} />
          <span style={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.3)", fontFamily: "var(--font-sans, monospace)" }}>
            Faculty Profile
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "1.75rem", flexWrap: "wrap" }}>
          {/* Avatar */}
          <div style={{ width: "5rem", height: "5rem", borderRadius: "50%", border: "1px solid rgba(15, 23, 42, 0.12)", background: "rgba(15, 23, 42, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
            {professor.avatar_url ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={professor.avatar_url} alt={displayName} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
            ) : (
              <span className="font-display" style={{ fontSize: "1.4rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.6)", letterSpacing: "-0.02em" }}>{initials}</span>
            )}
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "0.6rem" }}>
            <h1 className="font-display" style={{ fontSize: "clamp(2.4rem, 4vw, 3.2rem)", fontWeight: 900, color: "var(--text-primary)", letterSpacing: "-0.035em", lineHeight: 1.05 }}>
              Dr. {displayName} <em style={{ fontStyle: "italic", color: "rgba(15, 23, 42, 0.35)" }}>{professor.last_name}</em>
            </h1>
            <div style={{ display: "flex", alignItems: "center", gap: "0.75rem", flexWrap: "wrap" }}>
              {/* Verified badge */}
              <span style={{ display: "flex", alignItems: "center", gap: "0.35rem", padding: "0.3rem 0.8rem", border: "1px solid rgba(120,220,120,0.25)", borderRadius: "100px", background: "rgba(120,220,120,0.04)" }}>
                <span style={{ width: "5px", height: "5px", borderRadius: "50%", background: "rgba(120,220,120,0.8)" }} />
                <span style={{ fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(120,220,120,0.8)", fontFamily: "var(--font-sans, monospace)" }}>Verified Faculty</span>
              </span>
              {/* Availability */}
              <span style={{ padding: "0.3rem 0.8rem", border: `1px solid ${isAccepting ? "rgba(15, 23, 42, 0.1)" : "rgba(15, 23, 42, 0.06)"}`, borderRadius: "100px", fontSize: "0.48rem", fontWeight: 700, letterSpacing: "0.22em", textTransform: "uppercase", color: isAccepting ? "rgba(15, 23, 42, 0.4)" : "rgba(15, 23, 42, 0.2)", fontFamily: "var(--font-sans, monospace)" }}>
                {isAccepting ? "Accepting Requests" : "Not Accepting"}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.06)" }} />

      {/* Details grid */}
      <div style={{ display: "flex", flexDirection: "column", gap: "2rem" }}>
        {/* Academic Title & Department & Institution */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(220px, 1fr))", gap: "1.25rem" }}>
          {professor.academic_title && (
            <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4f46e5", marginBottom: "0.35rem" }}>Position</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{professor.academic_title}</div>
            </div>
          )}
          {professor.department && (
            <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4f46e5", marginBottom: "0.35rem" }}>Department</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{professor.department}</div>
            </div>
          )}
          {professor.institution && (
            <div style={{ background: "#ffffff", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#4f46e5", marginBottom: "0.35rem" }}>Institution</div>
              <div style={{ fontSize: "0.9rem", fontWeight: 700, color: "#0f172a" }}>{professor.institution}</div>
            </div>
          )}
        </div>

        {/* Research Overview & Bio */}
        {professor.bio && (
          <div style={{ background: "#ffffff", padding: "1.5rem", borderRadius: "14px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4f46e5", marginBottom: "0.65rem" }}>Research Overview & Lab Philosophy</div>
            <p style={{ fontSize: "0.9rem", color: "#334155", lineHeight: 1.65, margin: 0 }}>{professor.bio}</p>
          </div>
        )}

        {/* Research Focus Areas */}
        {parseArray(professor.expertise_fields).length > 0 && (
          <div style={{ display: "flex", flexDirection: "column", gap: "0.65rem" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4f46e5" }}>Research Focus Areas</div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem" }}>
              {parseArray(professor.expertise_fields).map((field: string) => (
                <span key={field} style={{ padding: "0.4rem 0.9rem", border: "1px solid rgba(99, 102, 241, 0.25)", borderRadius: "100px", background: "rgba(99, 102, 241, 0.08)", fontSize: "0.78rem", fontWeight: 700, color: "#4f46e5" }}>
                  {field}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Mentee Levels & Office Hours */}
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(240px, 1fr))", gap: "1.25rem" }}>
          {parseArray(professor.accepting_student_types).length > 0 && (
            <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.45rem" }}>Accepted Mentee Levels</div>
              <div style={{ display: "flex", flexWrap: "wrap", gap: "0.4rem" }}>
                {parseArray(professor.accepting_student_types).map((st: string, idx: number) => (
                  <span key={idx} style={{ background: "#ffffff", border: "1px solid #cbd5e1", color: "#334155", padding: "0.2rem 0.6rem", borderRadius: "6px", fontSize: "0.75rem", fontWeight: 600 }}>
                    {st}
                  </span>
                ))}
              </div>
            </div>
          )}
          {professor.office_hours && (
            <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.45rem" }}>Office Hours & Availability</div>
              <div style={{ fontSize: "0.85rem", fontWeight: 700, color: "#0f172a" }}>{professor.office_hours}</div>
            </div>
          )}
          {professor.lab_website && (
            <div style={{ background: "#f8fafc", padding: "1rem 1.25rem", borderRadius: "12px", border: "1px solid #e2e8f0" }}>
              <div style={{ fontSize: "0.62rem", fontWeight: 800, letterSpacing: "0.15em", textTransform: "uppercase", color: "#64748b", marginBottom: "0.45rem" }}>Lab / Faculty Website</div>
              <a href={professor.lab_website.startsWith("http") ? professor.lab_website : `https://${professor.lab_website}`} target="_blank" rel="noopener noreferrer" style={{ fontSize: "0.85rem", fontWeight: 700, color: "#4f46e5" }}>
                {professor.lab_website}
              </a>
            </div>
          )}
        </div>

        {/* Featured Publications */}
        {parseArray(professor.publications).length > 0 && (
          <div style={{ background: "#ffffff", padding: "1.25rem 1.5rem", borderRadius: "14px", border: "1px solid rgba(99, 102, 241, 0.15)" }}>
            <div style={{ fontSize: "0.68rem", fontWeight: 800, letterSpacing: "0.18em", textTransform: "uppercase", color: "#4f46e5", marginBottom: "0.65rem" }}>Featured Publications</div>
            <ul style={{ margin: 0, paddingLeft: "1.25rem", fontSize: "0.85rem", color: "#334155", lineHeight: 1.6 }}>
              {parseArray(professor.publications).map((pub: string, idx: number) => (
                <li key={idx} style={{ marginBottom: "0.35rem" }}>{pub}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* Hairline */}
      <div style={{ height: "1px", background: "rgba(15, 23, 42, 0.06)" }} />

      {/* CTA */}
      <div style={{ display: "flex", flexDirection: "column", gap: "1rem" }}>
        {!user ? (
          /* Logged out: Sign up CTA */
          <div style={{
            padding: "2.5rem 2rem",
            border: "1px solid rgba(79, 70, 229, 0.15)",
            borderRadius: "16px",
            background: "rgba(79, 70, 229, 0.02)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            textAlign: "center",
            gap: "1.25rem"
          }}>
            <h3 className="font-display" style={{ fontSize: "1.25rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.85)", margin: 0 }}>
              Request Mentorship with Dr. {displayName}
            </h3>
            <p style={{ fontSize: "0.85rem", color: "rgba(15, 23, 42, 0.5)", lineHeight: 1.65, maxWidth: "28rem", margin: 0, fontFamily: "var(--font-sans)" }}>
              Schollective connects motivated scholars with verified professors through structured, high-context mentorship requests. Create a free account to send outreach today.
            </p>
            <Button href="/signup" size="lg" className="px-10" style={{ width: "100%", maxWidth: "320px" }}>
              Get Started for Free
            </Button>
          </div>
        ) : hasActiveRequest ? (
          /* Active request exists */
          <div style={{ padding: "1rem 1.5rem", border: "1px solid rgba(15, 23, 42, 0.08)", borderRadius: "12px", background: "rgba(15, 23, 42, 0.02)", display: "flex", alignItems: "center", gap: "0.75rem" }}>
            <span style={{ width: "6px", height: "6px", borderRadius: "50%", background: "rgba(255,200,80,0.8)", flexShrink: 0 }} />
            <span style={{ fontSize: "0.78rem", color: "rgba(15, 23, 42, 0.5)", fontFamily: "var(--font-sans)" }}>
              You already have a {existingRequestStatus} request with this professor.{" "}
              <Link href={`/messages/${existingRequestId}`} style={{ color: "rgba(15, 23, 42, 0.75)", textDecoration: "none" }}>
                View thread →
              </Link>
            </span>
          </div>
        ) : isAccepting ? (
          /* Available: Send request */
          <Button
            href={`/request/new?prof_id=${professor.id}`}
            size="lg"
            className="w-full"
            icon={<Mail size={13} />}
          >
            Request Mentorship
          </Button>
        ) : (
          /* Not accepting: Similar recommendations */
          <div style={{ display: "flex", flexDirection: "column", gap: "2.5rem" }}>
            <div style={{
              padding: "1.75rem 2rem",
              border: "1px solid rgba(15, 23, 42, 0.08)",
              borderRadius: "16px",
              background: "rgba(15, 23, 42, 0.015)",
              display: "flex",
              flexDirection: "column",
              gap: "0.5rem",
              textAlign: "center"
            }}>
              <h3 className="font-display" style={{ fontSize: "1.15rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.8)", margin: 0 }}>
                Dr. {displayName} is not accepting new requests right now
              </h3>
              <p style={{ fontSize: "0.82rem", color: "rgba(15, 23, 42, 0.45)", lineHeight: 1.6, fontFamily: "var(--font-sans)", margin: 0 }}>
                This professor has temporarily paused new mentorship outreach requests. You can browse similar professors below.
              </p>
            </div>

            {similarProfessors.length > 0 && (
              <div style={{ display: "flex", flexDirection: "column", gap: "1.5rem" }}>
                <div style={{ display: "flex", alignItems: "center", gap: "0.75rem" }}>
                  <span style={{ width: "1rem", height: "1px", background: "rgba(15, 23, 42, 0.15)", display: "block" }} />
                  <span style={{ fontSize: "0.58rem", fontWeight: 700, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans, monospace)" }}>
                    Similar Available Mentors
                  </span>
                </div>
                <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(200px, 1fr))", gap: "1.5rem" }}>
                  {similarProfessors.map((p) => {
                    const name = p.preferred_name || p.first_name;
                    const initials = `${p.first_name?.[0] ?? ""}${p.last_name?.[0] ?? ""}`.toUpperCase();
                    return (
                      <Link href={`/professors/${p.id}`} key={p.id} style={{ textDecoration: "none" }}>
                        <div style={{
                          padding: "1.25rem",
                          borderRadius: "12px",
                          border: "1px solid rgba(79, 70, 229, 0.08)",
                          background: "rgba(255, 255, 255, 0.65)",
                          backdropFilter: "blur(12px)",
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          textAlign: "center",
                          gap: "0.75rem",
                          boxShadow: "0 4px 12px rgba(0, 0, 0, 0.02)",
                          transition: "all 0.3s cubic-bezier(0.22, 1, 0.36, 1)"
                        }}
                        onMouseEnter={(e) => {
                          e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.22)";
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.85)";
                          e.currentTarget.style.boxShadow = "0 8px 24px rgba(79, 70, 229, 0.06)";
                          e.currentTarget.style.transform = "translateY(-2px)";
                        }}
                        onMouseLeave={(e) => {
                          e.currentTarget.style.borderColor = "rgba(79, 70, 229, 0.08)";
                          e.currentTarget.style.background = "rgba(255, 255, 255, 0.65)";
                          e.currentTarget.style.boxShadow = "0 4px 12px rgba(0, 0, 0, 0.02)";
                          e.currentTarget.style.transform = "none";
                        }}>
                          <div style={{ width: "3.5rem", height: "3.5rem", borderRadius: "50%", border: "1px solid rgba(15, 23, 42, 0.1)", background: "rgba(15, 23, 42, 0.04)", display: "flex", alignItems: "center", justifyContent: "center", overflow: "hidden", flexShrink: 0 }}>
                            {p.avatar_url ? (
                              // eslint-disable-next-line @next/next/no-img-element
                              <img src={p.avatar_url} alt={name} style={{ width: "100%", height: "100%", objectFit: "cover" }} />
                            ) : (
                              <span className="font-display" style={{ fontSize: "0.95rem", fontWeight: 700, color: "rgba(15, 23, 42, 0.6)" }}>{initials}</span>
                            )}
                          </div>
                          <div>
                            <div style={{ fontSize: "0.8rem", fontWeight: 600, color: "rgba(15, 23, 42, 0.8)", fontFamily: "var(--font-sans)" }}>Dr. {name} {p.last_name}</div>
                            <div style={{ fontSize: "0.58rem", color: "rgba(15, 23, 42, 0.4)", fontFamily: "var(--font-sans)", marginTop: "0.15rem", textOverflow: "ellipsis", overflow: "hidden", whiteSpace: "nowrap", maxWidth: "160px" }}>{p.institution}</div>
                          </div>
                        </div>
                      </Link>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

export default async function PublicProfessorProfilePage({ params }: PageProps) {
  const { id } = await params;
  const { user, profile } = await getCurrentUserAndProfile();

  // Public professor data is revalidated periodically; private request state
  // remains request-scoped and is never included in a public cache response.
  // Fetch professor
  const professors = await sql`
    SELECT id, first_name, last_name, preferred_name, institution, academic_title, department, bio, lab_website, office_hours, accepting_student_types, publications, expertise_fields, avatar_url, is_accepting_requests
    FROM profiles
    WHERE id = ${id} AND role = 'professor' AND status = 'approved'
    LIMIT 1;
  `;
  const professor = professors[0];

  if (!professor) notFound();

  const userRole = profile?.role || "student";

  // Check if student already has active/pending requests
  let hasActiveRequest = false;
  let existingRequestStatus: string | undefined;
  let existingRequestId: string | undefined;

  if (user) {
    const existingRequests = await sql`
      SELECT id, status
      FROM requests
      WHERE student_id = ${user.id} AND professor_id = ${id} AND status IN ('pending', 'active')
      LIMIT 1;
    `;
    const existingRequest = existingRequests[0];

    if (existingRequest) {
      hasActiveRequest = true;
      existingRequestStatus = existingRequest.status;
      existingRequestId = existingRequest.id;
    }
  }

  // Similar completed, approved, available professors
  let similarProfessors: any[] = [];
  const isAccepting = professor.is_accepting_requests !== false;
  if (!isAccepting && professor.expertise_fields && professor.expertise_fields.length > 0) {
    const similar = await sql`
      SELECT id, first_name, last_name, preferred_name, institution, expertise_fields, avatar_url
      FROM profiles
      WHERE role = 'professor'
        AND status = 'approved'
        AND is_accepting_requests = true
        AND id != ${id}
      LIMIT 3;
    `;

    similarProfessors = (similar || []) as any[];
  }

  if (user) {
    // Authenticated user: wrap in standard Dashboard AppShell
    return (
      <AppShell role={userRole}>
        <div style={{ maxWidth: "680px" }}>
          {/* Back button */}
          <Link href="/professors" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content", marginBottom: "3rem" }}>
            <ArrowLeft size={12} color="rgba(15, 23, 42, 0.35)" />
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)" }}>
              Back to Directory
            </span>
          </Link>
          <ProfessorDetail
            professor={professor}
            similarProfessors={similarProfessors}
            hasActiveRequest={hasActiveRequest}
            existingRequestStatus={existingRequestStatus}
            existingRequestId={existingRequestId}
            user={user}
          />
        </div>
      </AppShell>
    );
  }

  // Unauthenticated user: render beautiful public landing style page
  return (
    <div style={{ minHeight: "100vh", background: "var(--bg-base)", display: "flex", flexDirection: "column" }}>
      {/* Public Header */}
      <header style={{
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "1.25rem 2rem",
        borderBottom: "1px solid rgba(15, 23, 42, 0.06)",
        background: "rgba(255, 255, 255, 0.8)",
        backdropFilter: "blur(12px)",
        position: "sticky",
        top: 0,
        zIndex: 100
      }}>
        <Link href="/" style={{ textDecoration: "none" }}>
          <span className="font-display" style={{ fontSize: "1.15rem", fontWeight: 800, color: "var(--text-primary)", letterSpacing: "-0.025em" }}>
            Schollective
          </span>
        </Link>
        <div style={{ display: "flex", gap: "0.75rem" }}>
          <Button href="/login" variant="ghost" size="sm">Log In</Button>
          <Button href="/signup" variant="primary" size="sm">Get Started</Button>
        </div>
      </header>

      {/* Main Container */}
      <main style={{ flex: 1, padding: "4rem 1.5rem", display: "flex", justifyContent: "center" }}>
        <div style={{ width: "100%", maxWidth: "680px" }}>
          {/* Back button */}
          <Link href="/" style={{ display: "inline-flex", alignItems: "center", gap: "0.5rem", textDecoration: "none", width: "fit-content", marginBottom: "3rem" }}>
            <ArrowLeft size={12} color="rgba(15, 23, 42, 0.35)" />
            <span style={{ fontSize: "0.55rem", fontWeight: 700, letterSpacing: "0.25em", textTransform: "uppercase", color: "rgba(15, 23, 42, 0.35)", fontFamily: "var(--font-sans)" }}>
              Back to Home
            </span>
          </Link>
          <ProfessorDetail
            professor={professor}
            similarProfessors={similarProfessors}
            hasActiveRequest={false}
            user={null}
          />
        </div>
      </main>
    </div>
  );
}
