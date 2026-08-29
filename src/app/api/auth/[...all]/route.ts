import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";
export const runtime = "nodejs";

const handler = toNextJsHandler(auth);

export async function GET(req: NextRequest) {
  try {
    return await handler.GET(req);
  } catch (error: any) {
    console.error("[auth] GET error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal auth error", message: error?.message },
      { status: 500 }
    );
  }
}

export async function POST(req: NextRequest) {
  try {
    return await handler.POST(req);
  } catch (error: any) {
    console.error("[auth] POST error:", error?.message || error);
    return NextResponse.json(
      { error: "Internal auth error", message: error?.message },
      { status: 500 }
    );
  }
}
