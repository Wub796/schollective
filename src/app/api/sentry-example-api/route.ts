import { NextResponse } from "next/server";

export async function GET() {
  throw new Error("Sentry example API error");
}

export function OPTIONS() {
  return NextResponse.json({ ok: true });
}
