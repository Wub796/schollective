import { NextRequest, NextResponse } from "next/server";
import { US_UNIVERSITY_NAMES } from "@/lib/us-universities";
import { checkRateLimit, getClientIp, sanitiseText, LIMITS } from "@/lib/security";

export async function GET(request: NextRequest) {
  // ── Rate limit: 30 requests per minute per IP ──────────────────
  const ip = getClientIp(request);
  const rate = checkRateLimit(`uni:${ip}`, 30, 60 * 1000, true);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please wait before trying again." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } }
    );
  }

  const { searchParams } = new URL(request.url);
  const q = sanitiseText(searchParams.get("q") ?? "", LIMITS.searchQuery);

  if (!q) {
    return NextResponse.json([]);
  }

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);

  // Block extremely short single-character queries
  if (words.length === 1 && words[0].length < 2) {
    return NextResponse.json([]);
  }

  const results = US_UNIVERSITY_NAMES
    .filter((name) => {
      const lower = name.toLowerCase();
      return words.every((w) => lower.includes(w));
    })
    .slice(0, 8);

  return NextResponse.json(results);
}