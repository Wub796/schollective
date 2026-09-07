import { sql } from "@/lib/neon/db";
import { runAs } from "@/lib/neon/user-context";
import { ensureAuthSchema } from "@/lib/neon/schema";
import { reviewStudentProfile, type StudentProfileData } from "./profile-reviewer";
import type { PillarScores, ProfileReviewOutput } from "./types";

export type ProfileReviewJobStatus = "pending" | "processing" | "completed" | "error";

export interface ProfileReviewJob {
  id: string;
  status: ProfileReviewJobStatus;
  result: ProfileReviewOutput | null;
  error: string | null;
  createdAt: string;
  startedAt: string | null;
  completedAt: string | null;
  updatedAt: string;
}

interface ProfileReviewJobRow {
  id: string;
  status: ProfileReviewJobStatus;
  result: ProfileReviewOutput | Record<string, unknown> | string | null;
  error: string | null;
  created_at: string;
  started_at: string | null;
  completed_at: string | null;
  updated_at: string;
}

const STALE_PROCESSING_MS = 5 * 60 * 1000;

export function adaptLegacyReviewResult(legacy: Record<string, unknown>): ProfileReviewOutput {
  const overall = Number(legacy.overallScore) || 60;
  const clarity = Number(legacy.clarityScore) || 60;
  const tone = Number(legacy.academicToneScore) || 60;
  const alignment = Number(legacy.alignmentScore) || 60;
  const completeness = Number(legacy.completenessScore) || 60;

  const pillarScores: PillarScores = {
    academic_rigor: Math.round((tone + overall) / 2),
    domain_alignment: alignment,
    leadership_initiative: Math.round((clarity + overall) / 2),
    completeness: completeness,
  };

  const avg =
    (pillarScores.academic_rigor +
      pillarScores.domain_alignment +
      pillarScores.leadership_initiative +
      pillarScores.completeness) /
    4;
  const isReady =
    legacy.outreachReadiness === "ready" ||
    (avg >= 80 &&
      pillarScores.academic_rigor >= 75 &&
      pillarScores.domain_alignment >= 75 &&
      pillarScores.leadership_initiative >= 75);

  const rawImprovements = Array.isArray(legacy.improvements) ? legacy.improvements : [];
  const flags = rawImprovements
    .flatMap((imp: unknown) => {
      if (!imp || typeof imp !== "object") return [];
      const item = imp as Record<string, unknown>;
      return [`${item.field ? `${item.field}: ` : ""}${item.issue || item.suggestion || ""}`];
    })
    .filter(Boolean)
    .slice(0, 3);

  const nextSteps = rawImprovements
    .flatMap((imp: unknown) => {
      if (!imp || typeof imp !== "object") return [];
      const item = imp as Record<string, unknown>;
      return typeof item.suggestion === "string" ? [item.suggestion] : [];
    })
    .filter(Boolean)
    .slice(0, 3);

  const rawStrengths = Array.isArray(legacy.strengths) ? legacy.strengths : [];
  const strengths = rawStrengths
    .filter((s): s is string => typeof s === "string")
    .slice(0, 3);

  const rawInterests = Array.isArray(legacy.suggestedInterests) ? legacy.suggestedInterests : [];
  const recommendedTopics = rawInterests
    .filter((s): s is string => typeof s === "string")
    .slice(0, 4);

  return {
    status: isReady ? "Ready for Outreach" : "Needs Edits",
    summary: typeof legacy.summary === "string" ? legacy.summary : "Profile review complete.",
    pillar_scores: pillarScores,
    strengths: strengths.length > 0 ? strengths : ["Registered academic standing."],
    flags: flags.length > 0 ? flags : ["Provide tangible metrics and specific tools for current projects."],
    next_steps: nextSteps.length > 0 ? nextSteps : ["Add relevant advanced coursework and software tools."],
    recommended_topics: recommendedTopics.length > 0 ? recommendedTopics : ["Computer Science", "Biology", "Mathematics", "Physics"],
  };
}

function parseResult(value: ProfileReviewJobRow["result"]): ProfileReviewOutput | null {
  if (!value) return null;
  let raw: Record<string, unknown> | null = null;
  if (typeof value === "string") {
    try {
      raw = JSON.parse(value) as Record<string, unknown>;
    } catch {
      return null;
    }
  } else if (typeof value === "object") {
    raw = value as Record<string, unknown>;
  }
  if (!raw) return null;

  if (raw.pillar_scores && typeof raw.pillar_scores === "object" && raw.status) {
    return raw as unknown as ProfileReviewOutput;
  }

  return adaptLegacyReviewResult(raw);
}

function toJob(row: ProfileReviewJobRow): ProfileReviewJob {
  return {
    id: row.id,
    status: row.status,
    result: parseResult(row.result),
    error: row.error,
    createdAt: row.created_at,
    startedAt: row.started_at,
    completedAt: row.completed_at,
    updatedAt: row.updated_at,
  };
}

async function ensureReviewJobTable(): Promise<void> {
  await ensureAuthSchema();
}

/** Returns the user's latest review, or the requested review owned by that user. */
export async function getProfileReviewJob(userId: string, jobId?: string): Promise<ProfileReviewJob | null> {
  return runAs(userId, async () => {
  await ensureReviewJobTable();

  const rows = jobId
    ? await sql`
        SELECT id, status, result, error, created_at, started_at, completed_at, updated_at
        FROM ai_profile_review_jobs
        WHERE id = ${jobId} AND user_id = ${userId}
        LIMIT 1;
      `
    : await sql`
        SELECT id, status, result, error, created_at, started_at, completed_at, updated_at
        FROM ai_profile_review_jobs
        WHERE user_id = ${userId}
        ORDER BY created_at DESC, id DESC
        LIMIT 1;
      `;

  const row = rows[0] as ProfileReviewJobRow | undefined;
  return row ? toJob(row) : null;
  });
}

async function insertProfileReviewJob(
  userId: string,
  jobId: string,
  profileData: StudentProfileData,
): Promise<ProfileReviewJob> {
  try {
    const rows = await sql`
      INSERT INTO ai_profile_review_jobs (id, user_id, status, profile_data, created_at, updated_at)
      VALUES (${jobId}, ${userId}, 'pending', ${JSON.stringify(profileData)}::jsonb, now(), now())
      RETURNING id, status, result, error, created_at, started_at, completed_at, updated_at;
    `;

    const row = rows[0] as ProfileReviewJobRow | undefined;
    if (!row) throw new Error("Unable to create profile review request");
    return toJob(row);
  } catch (error: any) {
    // Two tabs can pass the active-job read at the same time. The partial
    // unique index is the database-level arbiter; reuse the winner's job.
    if (error?.code !== "23505") throw error;

    const activeRows = await sql`
      SELECT id, status, result, error, created_at, started_at, completed_at, updated_at
      FROM ai_profile_review_jobs
      WHERE user_id = ${userId} AND status IN ('pending', 'processing')
      ORDER BY created_at DESC, id DESC
      LIMIT 1;
    `;
    const active = activeRows[0] as ProfileReviewJobRow | undefined;
    if (!active) throw error;
    return toJob(active);
  }
}

/**
 * Creates one durable review request. An in-flight request is reused so a
 * double-click or a second tab cannot start two reviews for the same user.
 */
export async function createProfileReviewJob(
  userId: string,
  profileData: StudentProfileData,
): Promise<ProfileReviewJob> {
  return runAs(userId, async () => {
  await ensureReviewJobTable();

  const activeRows = await sql`
    SELECT id, status, result, error, created_at, started_at, completed_at, updated_at
    FROM ai_profile_review_jobs
    WHERE user_id = ${userId} AND status IN ('pending', 'processing')
    ORDER BY created_at DESC, id DESC
    LIMIT 1;
  `;
  const active = activeRows[0] as ProfileReviewJobRow | undefined;
  if (active) return toJob(active);

  return insertProfileReviewJob(userId, crypto.randomUUID(), profileData);
  });
}

function isStaleProcessing(updatedAt: string): boolean {
  const timestamp = new Date(updatedAt).getTime();
  return !Number.isFinite(timestamp) || Date.now() - timestamp >= STALE_PROCESSING_MS;
}

/** True when a job should be started or recovered by a request. */
export function shouldStartProfileReviewJob(job: ProfileReviewJob): boolean {
  return job.status === "pending" || (job.status === "processing" && isStaleProcessing(job.updatedAt));
}

/**
 * Claims and processes a job. The token prevents an old invocation from
 * overwriting a newer retry if a Worker isolate is restarted mid-request.
 */
export async function processProfileReviewJob(jobId: string, userId: string): Promise<void> {
  return runAs(userId, async () => {
  await ensureReviewJobTable();

  const processingToken = crypto.randomUUID();
  const claimedRows = await sql`
    UPDATE ai_profile_review_jobs
    SET status = 'processing',
        processing_token = ${processingToken},
        started_at = now(),
        updated_at = now(),
        error = NULL
    WHERE id = ${jobId}
      AND user_id = ${userId}
      AND (
        status = 'pending'
        OR (status = 'processing' AND updated_at < now() - interval '5 minutes')
      )
    RETURNING id, profile_data;
  `;

  const claimed = claimedRows[0] as { id: string; profile_data: StudentProfileData | string } | undefined;
  if (!claimed) return;

  try {
    const profileData = typeof claimed.profile_data === "string"
      ? JSON.parse(claimed.profile_data) as StudentProfileData
      : claimed.profile_data;
    const result = await reviewStudentProfile(profileData);

    await sql`
      UPDATE ai_profile_review_jobs
      SET status = 'completed',
          result = ${JSON.stringify(result)}::jsonb,
          error = NULL,
          processing_token = NULL,
          completed_at = now(),
          updated_at = now()
      WHERE id = ${jobId}
        AND user_id = ${userId}
        AND status = 'processing'
        AND processing_token = ${processingToken};
    `;
  } catch (error) {
    console.error("[profile-review-job] Processing failed:", error);
    await sql`
      UPDATE ai_profile_review_jobs
      SET status = 'error',
          error = ${error instanceof Error ? error.message.slice(0, 500) : "Profile review failed"},
          processing_token = NULL,
          updated_at = now()
      WHERE id = ${jobId}
        AND user_id = ${userId}
        AND status = 'processing'
        AND processing_token = ${processingToken};
    `;
  }
  });
}
