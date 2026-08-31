import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { assertStorageConfigured, getUploadUrl, MAX_AVATAR_BYTES } from "@/lib/neon/storage";
import { isSuspended } from "@/lib/authz";
import { checkRateLimit } from "@/lib/security";

export const dynamic = "force-dynamic";

/**
 * Only these may be presigned. The uploads bucket is served publicly, so an
 * attacker-chosen type like text/html would be a stored-XSS vector on our own
 * origin — the extension is derived here rather than taken from the filename.
 */
const ALLOWED_IMAGE_TYPES: Record<string, string> = {
  "image/jpeg": "jpg",
  "image/png": "png",
  "image/webp": "webp",
  "image/gif": "gif",
};

export async function POST(req: Request) {
  const { session, user, profile } = await getCurrentUserAndProfile(req.headers);
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  if (isSuspended(profile)) {
    return NextResponse.json({ error: "Your account is suspended." }, { status: 403 });
  }

  const rate = checkRateLimit(`upload:${user.id}`, 20, 60 * 60 * 1000);
  if (!rate.allowed) {
    return NextResponse.json(
      { error: "Too many uploads. Please try again later." },
      { status: 429, headers: { "Retry-After": String(rate.retryAfterSeconds) } },
    );
  }

  try {
    // Fail before minting anything: signing works fine against blank
    // credentials, and the resulting URL would be useless.
    assertStorageConfigured();

    const { contentType, contentLength } = await req.json();

    const extension = typeof contentType === "string" ? ALLOWED_IMAGE_TYPES[contentType] : undefined;
    if (!extension) {
      return NextResponse.json(
        { error: "Only JPEG, PNG, WebP and GIF images can be uploaded." },
        { status: 400 },
      );
    }

    const size = Number(contentLength);
    if (!Number.isFinite(size) || size <= 0 || size > MAX_AVATAR_BYTES) {
      return NextResponse.json(
        { error: `Images must be under ${MAX_AVATAR_BYTES / (1024 * 1024)}MB.` },
        { status: 400 },
      );
    }

    // The key is built entirely from trusted values — no user-supplied path.
    const key = `avatars/${user.id}/${Date.now()}.${extension}`;
    const uploadUrl = await getUploadUrl(key, contentType, 3600, size);

    // The bucket is private, so the stored avatar points at our own route,
    // which signs a read on demand. A bare bucket URL would 403 for viewers.
    const publicUrl = `/api/storage/avatar/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (error: any) {
    console.error("[storage] Presign error:", error?.message ?? error);
    return NextResponse.json(
      { error: error?.message || "Failed to create upload URL." },
      { status: 500 },
    );
  }
}
