import {
  S3Client,
  PutObjectCommand,
  GetObjectCommand,
  DeleteObjectCommand,
} from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

/**
 * Neon Object Storage S3 Client
 * Configured with branch-aware credentials and custom endpoint.
 */
export const s3 = new S3Client({
  region: process.env.AWS_REGION || "us-east-2",
  endpoint: process.env.AWS_ENDPOINT_URL_S3,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  forcePathStyle: true,
});

export const UPLOADS_BUCKET = "uploads";

/**
 * Generates a presigned PUT URL for direct client-to-storage uploads.
 */
export async function getUploadUrl(key: string, contentType: string, expiresInSeconds = 3600) {
  const command = new PutObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: key,
    ContentType: contentType,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Generates a presigned GET URL for private object retrieval.
 */
export async function getDownloadUrl(key: string, expiresInSeconds = 3600) {
  const command = new GetObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: key,
  });
  return getSignedUrl(s3, command, { expiresIn: expiresInSeconds });
}

/**
 * Deletes an object from the uploads bucket.
 */
export async function deleteObject(key: string) {
  const command = new DeleteObjectCommand({
    Bucket: UPLOADS_BUCKET,
    Key: key,
  });
  return s3.send(command);
}
