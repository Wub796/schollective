import { NextResponse } from "next/server";
import { getDownloadUrl } from "@/lib/neon/storage";

export const dynamic = "force-dynamic";

/**
 * Serves an avatar out of the private uploads bucket.
 *
 * Avatars appear on public professor pages, so this route is unauthenticated —
 * but it must not become a way to read the rest of the bucket. The key is
 * matched against the exact shape the upload route mints and nothing else, so
 * no other object is reachable through it and no path traversal is possible.
 */
const AVATAR_KEY = /^avatars\/[A-Za-z0-9_-]{1,64}\/\d{10,20}\.(jpg|png|webp|gif)$/;

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ key: string[] }> },
) {
  const { key: segments } = await params;
  const key = (segments ?? []).join("/");

  if (!AVATAR_KEY.test(key)) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  try {
    const signedUrl = await getDownloadUrl(key, 3600);
    return NextResponse.redirect(signedUrl, {
      status: 307,
      // Well inside the signature's lifetime, so a cached redirect never
      // outlives the URL it points at.
      headers: { "Cache-Control": "private, max-age=600" },
    });
  } catch (error: any) {
    console.error("[storage] Could not sign avatar read:", error?.message ?? error);
    return NextResponse.json({ error: "Avatar unavailable." }, { status: 502 });
  }
}
