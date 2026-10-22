import { timingSafeEqual } from "node:crypto";
import { NextResponse } from "next/server";
import { purgeExpiredDeactivatedAccounts, type PurgeRun } from "@/lib/account-purge";

export const dynamic = "force-dynamic";

function isAuthorizedCronRequest(request: Request, secret = process.env.CRON_SECRET): boolean {
  if (!secret) return false;
  const header = request.headers.get("authorization");
  if (!header) return false;

  const expected = Buffer.from(`Bearer ${secret}`, "utf8");
  const actual = Buffer.from(header, "utf8");
  if (expected.byteLength !== actual.byteLength) return false;
  return timingSafeEqual(expected, actual);
}

export async function handlePurgeCron(
  request: Request,
  runSweep: () => Promise<PurgeRun> = purgeExpiredDeactivatedAccounts,
  secret = process.env.CRON_SECRET,
): Promise<NextResponse> {
  if (!isAuthorizedCronRequest(request, secret)) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const run = await runSweep();

    console.log(
      `[purge] examined ${run.examined}, removed ${run.removed}, refused ${run.refused.length}`,
    );

    if (run.refused.length > 0) {
      console.error(
        "[purge] the database refused to remove accounts whose window had closed:",
        JSON.stringify(run.refused),
      );
    }

    return NextResponse.json(run);
  } catch (err) {
    console.error("[purge] sweep failed:", err instanceof Error ? err.message : err);
    return NextResponse.json({ error: "Purge sweep failed" }, { status: 500 });
  }
}

export async function GET(request: Request): Promise<NextResponse> {
  return handlePurgeCron(request);
}
