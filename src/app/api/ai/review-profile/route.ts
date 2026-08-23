import { after, NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import {
  createProfileReviewJob,
  getProfileReviewJob,
  processProfileReviewJob,
  shouldStartProfileReviewJob,
  type ProfileReviewJob,
} from "@/lib/ai/profile-review-jobs";
import type { StudentProfileData } from "@/lib/ai/profile-reviewer";
import { checkUserAiRateLimit, sanitizeAiPromptInput } from "@/lib/ai/guardrails";
import { checkRateLimit, getClientIp } from "@/lib/security";
import { runAs } from "@/lib/neon/user-context";

export const dynamic = "force-dynamic";

const REVIEW_STATUS_POLL_LIMIT = 60;
const REVIEW_STATUS_POLL_WINDOW_MS = 60 * 1000;
const PRIVATE_JSON_HEADERS = { "Cache-Control": "private, no-store" };

async function runProfileReview(job: ProfileReviewJob, userId: string): Promise<void> {
  try {
    // `after` runs outside the request's async chain, so the database identity
    // the RLS policies read must be re-established explicitly. The worker only
    // ever touches this user's job rows, which is exactly what the job policies
    // then allow.
    await runAs(userId, () => processProfileReviewJob(job.id, userId));
  } catch (error) {
    console.error("[profile-review-job] Background execution failed:", error);
  }
}

async function scheduleProfileReview(job: ProfileReviewJob, userId: string): Promise<void> {
  if (!shouldStartProfileReviewJob(job)) return;

  // `after` is connected to the platform execution context by OpenNext. The
  // response can return the durable job ID before the model call completes.
  // If the isolate is interrupted, a later status request can recover a stale
  // processing job through the same compare-and-claim operation.
  try {
    after(() => runProfileReview(job, userId));
  } catch (error) {
    // Keep local Node development and any adapter without waitUntil usable.
    // The synchronous fallback is slower, but it cannot leave a pending job
    // stranded after its row has already been created.
    console.error("[profile-review-job] Background scheduling unavailable; processing inline:", error);
    await runProfileReview(job, userId);
  }
}

function parseBodyValue(
  body: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  key: string,
): unknown {
  if (Object.prototype.hasOwnProperty.call(body, key)) return body[key];
  return profile?.[key];
}

function sanitiseTextField(
  body: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  key: string,
  maxChars: number,
): string | null {
  const value = parseBodyValue(body, profile, key);
  return typeof value === "string" ? sanitizeAiPromptInput(value, maxChars) : null;
}

function sanitiseListField(
  body: Record<string, unknown>,
  profile: Record<string, unknown> | null,
  key: string,
  maxItemChars: number,
): string[] | string | null {
  const value = parseBodyValue(body, profile, key);

  if (Array.isArray(value)) {
    return value
      .slice(0, 50)
      .filter((item): item is string => typeof item === "string")
      .map((item) => sanitizeAiPromptInput(item, maxItemChars))
      .filter(Boolean);
  }

  if (typeof value === "string") {
    return sanitizeAiPromptInput(value, maxItemChars * 10);
  }

  return null;
}

function buildProfileToReview(
  user: { id: string; email?: string | null },
  profile: Record<string, unknown> | null,
  body: Record<string, unknown>,
): StudentProfileData {
  let extras = sanitiseListField(body, profile, "extracurriculars", 600);
  if (!extras || (Array.isArray(extras) && extras.length === 0)) {
    const activitiesRaw = parseBodyValue(body, profile, "activities");
    const honorsRaw = parseBodyValue(body, profile, "honors_awards");
    const combined: string[] = [];
    if (Array.isArray(activitiesRaw)) {
      for (const act of activitiesRaw) {
        if (act && typeof act === "object" && "title" in act) {
          const item = act as any;
          const desc = item.description ? `: ${item.description}` : "";
          const org = item.organization ? ` at ${item.organization}` : "";
          combined.push(`${item.title}${org}${desc}`);
        }
      }
    }
    if (Array.isArray(honorsRaw)) {
      for (const hon of honorsRaw) {
        if (hon && typeof hon === "object" && "title" in hon) {
          const item = hon as any;
          const issuer = item.issuer_or_level ? ` (${item.issuer_or_level})` : "";
          const yr = item.year ? ` - ${item.year}` : "";
          combined.push(`Award: ${item.title}${issuer}${yr}`);
        }
      }
    }
    if (combined.length > 0) {
      extras = combined;
    }
  }

  let coursework = sanitiseListField(body, profile, "coursework", 300);
  if (!coursework || (Array.isArray(coursework) && coursework.length === 0)) {
    const stats = parseBodyValue(body, profile, "academic_stats") as any;
    if (stats?.advanced_coursework && Array.isArray(stats.advanced_coursework)) {
      coursework = stats.advanced_coursework;
    }
  }

  return {
    // Identity must come from the authenticated session, never the request body.
    id: user.id,
    email: user.email || null,
    first_name: sanitiseTextField(body, profile, "first_name", 100),
    last_name: sanitiseTextField(body, profile, "last_name", 100),
    preferred_name: sanitiseTextField(body, profile, "preferred_name", 100),
    institution: sanitiseTextField(body, profile, "institution", 200),
    education_level: sanitiseTextField(body, profile, "education_level", 100),
    major: sanitiseTextField(body, profile, "major", 200),
    graduation_year: sanitiseTextField(body, profile, "graduation_year", 30),
    bio: sanitiseTextField(body, profile, "bio", 500),
    academic_interests: sanitiseListField(body, profile, "academic_interests", 300),
    extracurriculars: extras,
    coursework: coursework,
    skills_and_tools: sanitiseListField(body, profile, "skills_and_tools", 300),
    portfolio_url: sanitiseTextField(body, profile, "portfolio_url", 500),
    expertise_fields: sanitiseListField(body, profile, "expertise_fields", 300),
  };
}

function serialiseJob(job: ProfileReviewJob) {
  return {
    id: job.id,
    status: job.status,
    result: job.result,
    error: job.error,
    createdAt: job.createdAt,
    startedAt: job.startedAt,
    completedAt: job.completedAt,
    updatedAt: job.updatedAt,
  };
}

export async function POST(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipRate = checkRateLimit(`review:${ip}`, 5, 60 * 1000, true);
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: "Too many requests. Please wait before trying again." },
        {
          status: 429,
          headers: { ...PRIVATE_JSON_HEADERS, "Retry-After": String(ipRate.retryAfterSeconds) },
        },
      );
    }

    const { session, user, profile } = await getCurrentUserAndProfile(req.headers);
    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_JSON_HEADERS });
    }

    const rateCheck = checkUserAiRateLimit(user.id, 10, 10 * 60 * 1000);
    if (!rateCheck.allowed) {
      return NextResponse.json(
        { error: `AI request limit reached. Please wait ${rateCheck.retryAfterSeconds} seconds.` },
        {
          status: 429,
          headers: { ...PRIVATE_JSON_HEADERS, "Retry-After": String(rateCheck.retryAfterSeconds) },
        },
      );
    }

    let rawBody: unknown = {};
    try {
      rawBody = await req.json();
    } catch {
      // An empty body is valid; the current profile is used below.
    }
    const body = rawBody && typeof rawBody === "object" && !Array.isArray(rawBody)
      ? rawBody as Record<string, unknown>
      : {};

    const profileToReview = buildProfileToReview(
      { id: user.id, email: user.email },
      profile as Record<string, unknown> | null,
      body,
    );
    const job = await createProfileReviewJob(user.id, profileToReview);
    await scheduleProfileReview(job, user.id);

    return NextResponse.json(
      { success: true, job: serialiseJob(job) },
      { status: 202, headers: PRIVATE_JSON_HEADERS },
    );
  } catch (error: any) {
    console.error("[POST /api/ai/review-profile] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to start profile review" },
      { status: 500, headers: PRIVATE_JSON_HEADERS },
    );
  }
}

export async function GET(req: Request) {
  try {
    const ip = getClientIp(req);
    const ipRate = checkRateLimit(
      `review-status:${ip}`,
      REVIEW_STATUS_POLL_LIMIT,
      REVIEW_STATUS_POLL_WINDOW_MS,
      true,
    );
    if (!ipRate.allowed) {
      return NextResponse.json(
        { error: "Too many status requests. Please wait before trying again." },
        {
          status: 429,
          headers: { ...PRIVATE_JSON_HEADERS, "Retry-After": String(ipRate.retryAfterSeconds) },
        },
      );
    }

    const { session, user } = await getCurrentUserAndProfile(req.headers);
    if (!session || !user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401, headers: PRIVATE_JSON_HEADERS });
    }

    const jobId = new URL(req.url).searchParams.get("jobId") || undefined;
    const job = await getProfileReviewJob(user.id, jobId);
    if (jobId && !job) {
      return NextResponse.json(
        { error: "Review request not found" },
        { status: 404, headers: PRIVATE_JSON_HEADERS },
      );
    }

    if (job) await scheduleProfileReview(job, user.id);

    return NextResponse.json(
      { success: true, job: job ? serialiseJob(job) : null },
      { headers: PRIVATE_JSON_HEADERS },
    );
  } catch (error: any) {
    console.error("[GET /api/ai/review-profile] Error:", error);
    return NextResponse.json(
      { error: error?.message || "Failed to load profile review" },
      { status: 500, headers: PRIVATE_JSON_HEADERS },
    );
  }
}
