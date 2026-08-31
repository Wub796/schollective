import { presignS3Url } from "./s3-presign";

/**
 * Neon Object Storage (S3-compatible).
 *
 * The bucket is private, so nothing here hands out a bare object URL: uploads
 * go through a presigned PUT and reads through a presigned GET.
 *
 * Signing is done by `presignS3Url` on Web Crypto rather than the AWS SDK — the
 * SDK reads the shared config file through `fs.readFile` while resolving client
 * config, which a Cloudflare Worker cannot do.
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
 * Throws naming whatever is absent. Signing succeeds against blank credentials,
 * so without this an upload URL would be minted that no one can use — and the
 * avatar recorded against it would be permanently broken.
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

/** Read config at call time: Worker bindings are not in process.env at import. */
function config() {
  assertStorageConfigured();
  return {
    endpoint: process.env.AWS_ENDPOINT_URL_S3!,
    accessKeyId: process.env.AWS_ACCESS_KEY_ID!,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY!,
    region: process.env.AWS_REGION || "us-east-2",
    bucket: UPLOADS_BUCKET,
  };
}

/**
 * Presigned PUT for a direct browser upload.
 *
 * `content-length` is folded into the signature, so a client holding this URL
 * cannot upload a larger file than the size we approved.
 */
export async function getUploadUrl(
  key: string,
  contentType: string,
  expiresInSeconds = 3600,
  contentLength?: number,
) {
  return presignS3Url({
    method: "PUT",
    ...config(),
    key,
    expiresInSeconds,
    signedHeaders: contentLength ? { "content-length": String(contentLength) } : {},
  });
}

/** Presigned GET — the only way to read from this private bucket. */
export async function getDownloadUrl(key: string, expiresInSeconds = 3600) {
  return presignS3Url({ method: "GET", ...config(), key, expiresInSeconds });
}
