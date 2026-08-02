import { NextResponse } from "next/server";
import { getCurrentUserAndProfile } from "@/lib/neon/profiles";
import { getUploadUrl } from "@/lib/neon/storage";

export async function POST(req: Request) {
  const { session, user } = await getCurrentUserAndProfile();
  if (!session || !user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { filename, contentType } = await req.json();
    if (!filename || !contentType) {
      return NextResponse.json({ error: "Missing filename or contentType" }, { status: 400 });
    }

    const fileExt = filename.split('.').pop() || 'png';
    const key = `avatars/${user.id}/${Date.now()}.${fileExt}`;

    const uploadUrl = await getUploadUrl(key, contentType);
    const publicUrl = `${process.env.AWS_ENDPOINT_URL_S3}/uploads/${key}`;

    return NextResponse.json({ uploadUrl, publicUrl, key });
  } catch (error: any) {
    console.error("Storage presign error:", error);
    return NextResponse.json({ error: error.message || "Failed to create upload URL" }, { status: 500 });
  }
}
