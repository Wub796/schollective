import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Neon Object Storage (S3-compatible).
 *
 * The bucket is private, so nothing here hands out a bare object URL: uploads
 * go through a presigned PUT and reads come back through a presigned GET.
 */

export const UPLOADS_BUCKET = "uploads";

/** Largest avatar we will presign for, in bytes. */
export const MAX_AVATAR_BYTES = 5 * 1024 * 1024;

const REQUIRED_STORAGE_KEYS = [
  "AWS_ENDPOINT_URL_S3",
  "AWS_ACCESS_KEY_ID",
  "AWS_SECRET_ACCESS_KEY",
] as const;

export function missingStorageKeys(): string[] {
  return REQUIRED_STORAGE_KEYS.filter((key) => !process.env[key]);
}

export function isStorageConfigured(): boolean {
  return missingStorageKeys().length === 0;
}

/**
 * Throws with the names of whatever is absent.
 *
 * Signing succeeds against blank credentials and an undefined endpoint, which
 * previously produced an upload URL pointing at real AWS and an avatar recorded
 * as the literal string "undefined/uploads/…". Failing here keeps that
 * unusable state out of the database.
 */
export function assertStorageConfigured(): void {
  const missing = missingStorageKeys();
  if (missing.length) {
    throw new Error(
      `Object storage is not configured — missing ${missing.join(", ")}. ` +
        "Copy these from the Neon console (Object Storage) and set them on the Worker.",
    );
  }
}

/**
 * Built per call rather than at module load: on Cloudflare, process.env is
 * populated from the Worker bindings when the first request arrives, so a
 * client constructed at import time would capture empty credentials.
 */
function client(): S3Client {
  assertStorageConfigured();
  return new S3Client({
    region: process.env.AWS_REGION || "us-east-2",
    endpoint: process.env.AWS_ENDPOINT_URL_S3,
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    },
    forcePathStyle: true,
  });
}

/**
 * Presigned PUT for a direct browser upload.
 *
 * `ContentType` and `ContentLength` are part of the signature, so the browser
 * cannot substitute a different type or a larger file than we approved.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600,
  contentLength?: number,
) {
  const command = new PutObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: key,
    ContentType: contentType,
    ...(contentLength ? { ContentLength: contentLength } : {}),
  });
  return getSignedUrl(client(), command, { expiresIn: expiresInSeconds });
}

/** Presigned GET, the only way to read from this private bucket. */
export async function getDownloadUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({ Bucket: UPLOADS_BUCKET, Key: key });
  return getSignedUrl(client(), command, { expiresIn: expiresInSeconds });
}

export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({ Bucket: UPLOADS_BUCKET, Key: key });
  return client().send(command);
}
