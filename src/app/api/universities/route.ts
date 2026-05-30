import { NextRequest, NextResponse } from "next/server";
import { US_UNIVERSITY_NAMES } from "@/lib/us-universities";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const q = searchParams.get("q") || "";
  
  if (!q.trim()) {
    return NextResponse.json([]);
  }

  const words = q.toLowerCase().split(/\s+/).filter(Boolean);
  const results = US_UNIVERSITY_NAMES
    .filter((name) => {
      const lower = name.toLowerCase();
      return words.every((w) => lower.includes(w));
    })
    .slice(0, 8); // Max 8 suggestions

  return NextResponse.json(results);
}
