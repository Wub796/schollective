import { NextRequest, NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { checkUserAiRateLimit } from "@/lib/ai/guardrails";
import { parseResumePdf } from "@/lib/ai/resume-parser";
import { isGeminiTransientError } from "@/lib/ai/client";

export const dynamic = "force-dynamic";
export const maxDuration = 30;

const MAX_FILE_SIZE = 4 * 1024 * 1024; // 4 MB

export async function POST(req: NextRequest) {
  try {
    // 1. Session Authentication
    const { user } = await getCurrentUserAndProfile();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Sliding Window Rate-Limiting per User ID (5 uploads per 10 minutes)
    const rateLimit = checkUserAiRateLimit(user.id, 5, 10 * 60 * 1000);
    if (!rateLimit.allowed) {
      return NextResponse.json(
        {
          error: `Upload rate limit reached. Please wait ${rateLimit.retryAfterSeconds} seconds before uploading another resume.`,
          retryAfterSeconds: rateLimit.retryAfterSeconds,
        },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

    // 3. Extract Multipart Form Data (a non-multipart body is a client error,
    //    not a server fault)
    let formData: FormData;
    try {
      formData = await req.formData();
    } catch {
      return NextResponse.json(
        { error: 'Expected multipart/form-data with a "file" field.' },
        { status: 400 }
      );
    }
    const file = formData.get("file");

    if (!file || !(file instanceof Blob)) {
      return NextResponse.json(
        { error: "No PDF file provided. Please attach a resume PDF." },
        { status: 400 }
      );
    }

    // 4. File Type & Size Validation
    if (file.type && file.type !== "application/pdf" && file.type !== "application/x-pdf") {
      return NextResponse.json(
        { error: "Invalid file type. Only PDF documents are supported." },
        { status: 400 }
      );
    }

    if (file.size > MAX_FILE_SIZE) {
      return NextResponse.json(
        { error: "File size exceeds the 4 MB limit. Please upload a smaller PDF." },
        { status: 400 }
      );
    }

    const arrayBuffer = await file.arrayBuffer();
    const buffer = Buffer.from(arrayBuffer);

    // Verify PDF header magic bytes (%PDF-)
    if (buffer.length < 5 || buffer.toString("utf8", 0, 5) !== "%PDF-") {
      return NextResponse.json(
        { error: "The uploaded file does not appear to be a valid PDF document." },
        { status: 400 }
      );
    }

    // 5. Ingest via Gemini 3.6 Flash
    const parsedData = await parseResumePdf(buffer);

    return NextResponse.json({
      success: true,
      data: parsedData,
    });
  } catch (error: any) {
    console.error("[parse-resume] Error processing resume PDF:", error);
    let message = "Failed to parse resume PDF. Please try again.";
    if (
      isGeminiTransientError(error) ||
      error?.message?.includes("503") ||
      error?.message?.includes("high demand") ||
      error?.message?.includes("UNAVAILABLE")
    ) {
      message = "The AI service is currently experiencing temporary high demand. Please try again in a few moments.";
    } else if (typeof error?.message === "string" && !error.message.startsWith("{")) {
      message = error.message;
    }
    return NextResponse.json(
      { error: message },
      { status: 500 }
    );
  }
}
