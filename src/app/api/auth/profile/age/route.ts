import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { runAs } from "@/lib/neon/user-context";
import { checkRateLimit } from "@/lib/security";
import { isSuspended } from "@/lib/authz";
import { readOwnYouthProtection, saveAgeAndConsent } from "@/lib/neon/youth-protection";
import {
  ADULT_AGE,
  GUARDIAN_CONSENT_STATEMENT,
  MINIMUM_AGE,
  ageBandFor,
  needsAgeStatement,
  parseDateOfBirth,
  validateGuardianConsent,
} from "@/lib/youth-protection";
import { internalError } from "@/lib/utils";

export const dynamic = "force-dynamic";

const PRIVATE_HEADERS = { "Cache-Control": "private, no-store" };

/**
 * The caller's own age record, for the settings form that corrects it.
 *
 * Deliberately their own only: this is the one endpoint that returns a stored
 * date of birth, and it can only ever return the one belonging to the session
 * asking. An admin's view of the same information is `profiles.is_minor`, which
 * is what the safety queue shows.
 *
 * `needsStatement` is the interesting field for the client: true means a student
 * whose account predates this flow and who has still never been asked.
 */
export async function GET(req: Request) {
  const { session, user, profile } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers: PRIVATE_HEADERS });
  }

  try {
    const record = await runAs(user.id, async () => readOwnYouthProtection(user.id));

    return NextResponse.json(
      {
        dateOfBirth: record?.date_of_birth ?? null,
        guardianName: record?.guardian_name ?? null,
        guardianEmail: record?.guardian_email ?? null,
        consentAt: record?.guardian_consent_at ?? null,
        consentVersion: record?.consent_version ?? null,
        isMinor: profile?.is_minor === true,
        needsStatement: needsAgeStatement({ role: profile?.role, dateOfBirth: record?.date_of_birth }),
        consentStatement: GUARDIAN_CONSENT_STATEMENT,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch (err: unknown) {
    // A missing table (0014 not applied) lands here. This is a settings card: it
    // reports that it could not load rather than failing the page around it.
    console.error("[profile/age] Could not read the record:", err);
    return NextResponse.json(
      { error: "We could not load your date of birth." },
      { status: 503, headers: PRIVATE_HEADERS },
    );
  }
}

/**
 * Records an account's date of birth, and a parent or guardian's consent when
 * one is due.
 *
 * The one place the date of birth enters the system. It is validated here, on
 * the server, and never taken from the client's own idea of how old the account
 * is: the onboarding form computes the same answer to decide whether to show the
 * consent block, and a client that skipped that step would otherwise store a
 * minor with no consent at all.
 *
 * Three outcomes, and they are deliberately not the same status code:
 *
 *   under 13      403, nothing stored. The Terms say the platform is not for
 *                 them, and storing a birth date for a child who may not use the
 *                 service would be collecting the one thing the refusal exists
 *                 to avoid.
 *   13 to 17      400 unless a guardian is named and has agreed. The statement
 *                 they agree to is quoted back in the error so the form can show
 *                 it rather than paraphrase it.
 *   18 and over    200, stored, and any previous guardian consent is left where
 *                 it is: an adult correcting a date of birth should not silently
 *                 erase the record of who consented when they were a minor.
 *
 * A professor is asked for nothing. The professorship is already gated on an
 * institution-verified address reviewed by an admin, so an adult is who is being
 * created; asking faculty for a birth date would collect personal data to answer
 * a question already answered. The endpoint still accepts one if it arrives,
 * because the alternative is a professor who cannot correct a wrong value.
 */
export async function POST(req: Request) {
  const { session, user, profile } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Please sign in again." }, { status: 401, headers: PRIVATE_HEADERS });
  }
  if (isSuspended(profile)) {
    return NextResponse.json(
      { error: "Your account is suspended." },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  // In-memory and per-isolate, which is enough here: this is a form someone
  // fills in once, not an endpoint worth a Postgres round trip on every keystroke.
  const rate = checkRateLimit(`age:${user.id}`, 10, 5 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many attempts. Please wait a moment and try again." },
      { status: 429, headers: { ...PRIVATE_HEADERS, "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body." }, { status: 400, headers: PRIVATE_HEADERS });
  }

  const raw = (body && typeof body === "object" ? body : {}) as Record<string, unknown>;
  const dateOfBirth = parseDateOfBirth(raw.dateOfBirth);

  if (!dateOfBirth) {
    return NextResponse.json(
      {
        error: "Enter your date of birth as YYYY-MM-DD.",
        field: "date_of_birth",
      },
      { status: 400, headers: PRIVATE_HEADERS },
    );
  }

  const band = ageBandFor(dateOfBirth);

  if (band === "under-minimum") {
    return NextResponse.json(
      {
        error:
          `Schollective is for students aged ${MINIMUM_AGE} and over. ` +
          `If you think this is wrong, contact us and we will fix it.`,
        band,
      },
      { status: 403, headers: PRIVATE_HEADERS },
    );
  }

  let guardian: { guardianName: string; guardianEmail: string; version: string } | null = null;

  if (band === "minor") {
    const consent = validateGuardianConsent({
      guardianName: raw.guardianName,
      guardianEmail: raw.guardianEmail,
      attested: raw.guardianAttested === true || raw.attested === true,
    });

    if (!consent.ok) {
      return NextResponse.json(
        { error: consent.error, band, statement: GUARDIAN_CONSENT_STATEMENT, field: "guardian" },
        { status: 400, headers: PRIVATE_HEADERS },
      );
    }

    guardian = consent.value;
  }

  try {
    const stored = await runAs(user.id, async () =>
      saveAgeAndConsent({ profileId: user.id, dateOfBirth, guardian }),
    );

    return NextResponse.json(
      {
        ok: true,
        // What the client should believe, straight from the stored record rather
        // than from the input: refreshMinorFlag re-read the row to decide it.
        band,
        guardianRecorded: Boolean(stored?.guardian_consent_at),
        isMinor: band !== "adult",
        adultAge: ADULT_AGE,
      },
      { status: 200, headers: PRIVATE_HEADERS },
    );
  } catch (err: unknown) {
    return NextResponse.json(
      { error: internalError("profile/age", err, "We could not save your date of birth.") },
      { status: 500, headers: PRIVATE_HEADERS },
    );
  }
}
