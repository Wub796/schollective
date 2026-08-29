import { auth } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";
import { NextRequest, NextResponse } from "next/server";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

export async function GET(request: NextRequest) {
  try {
    const res = await handlers.GET(request);
    return res;
  } catch (err: any) {
    console.error("[AUTH_GET_ERROR]", err);
    return NextResponse.json(
      {
        error: "AUTH_GET_ERROR",
        message: err?.message || String(err),
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const res = await handlers.POST(request);
    return res;
  } catch (err: any) {
    console.error("[AUTH_POST_ERROR]", err);
    return NextResponse.json(
      {
        error: "AUTH_POST_ERROR",
        message: err?.message || String(err),
        stack: err?.stack,
      },
      { status: 500 }
    );
  }
}
