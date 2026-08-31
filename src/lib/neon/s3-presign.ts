/**
 * SigV4 query-string presigning, built on Web Crypto.
 *
 * The AWS SDK cannot be used here: `@smithy/core` reads the shared config file
 * through `fs.readFile` while resolving client config — even when region and
 * credentials are passed explicitly — and a Cloudflare Worker answers that with
 * "[unenv] fs.readFile is not implemented yet!". Presigning is a self-contained
 * signature calculation, so we do it directly against the Web Crypto API that
 * Workers provide natively. This also keeps the AWS SDK out of the bundle.
 *
 * Reference: AWS Signature Version 4, query parameter authentication.
 */

const encoder = new TextEncoder();

function toHex(bytes: Uint8Array): string {
  let out = "";
  for (const byte of bytes) out += byte.toString(16).padStart(2, "0");
  return out;
}

async function sha256Hex(value: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", encoder.encode(value));
  return toHex(new Uint8Array(digest));
}

async function hmac(key: Uint8Array, value: string): Promise<Uint8Array> {
  const cryptoKey = await crypto.subtle.importKey(
    "raw",
    key as unknown as ArrayBuffer,
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signature = await crypto.subtle.sign("HMAC", cryptoKey, encoder.encode(value));
  return new Uint8Array(signature);
}

/**
 * RFC 3986 encoding. `encodeURIComponent` leaves !'()* alone, but SigV4
 * requires them percent-encoded or the signature will not match.
 */
function encodeRfc3986(value: string): string {
  return encodeURIComponent(value).replace(
    /[!'()*]/g,
    (c) => `%${c.charCodeAt(0).toString(16).toUpperCase()}`,
  );
}

/** Each path segment is encoded; the separators are not. */
function encodePath(path: string): string {
  return path.split("/").map(encodeRfc3986).join("/");
}

export interface PresignInput {
  method: "GET" | "PUT" | "DELETE";
  /** Base endpoint, e.g. https://xyz.storage.example.com */
  endpoint: string;
  bucket: string;
  key: string;
  region: string;
  accessKeyId: string;
  secretAccessKey: string;
  expiresInSeconds: number;
  /**
   * Headers to fold into the signature. The client must send these exact
   * values, which is what stops a browser holding an upload URL from sending a
   * different content type or a larger body than was approved.
   */
  signedHeaders?: Record<string, string>;
  /** Overrides the clock. Tests only. */
  signingDate?: Date;
}

export async function presignS3Url({
  method,
  endpoint,
  bucket,
  key,
  region,
  accessKeyId,
  secretAccessKey,
  expiresInSeconds,
  signedHeaders = {},
  signingDate = new Date(),
}: PresignInput): Promise<string> {
  const base = new URL(endpoint);
  const basePath = base.pathname.replace(/\/$/, "");
  const canonicalUri = encodePath(`${basePath}/${bucket}/${key}`);

  const amzDate = signingDate.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const dateStamp = amzDate.slice(0, 8);
  const scope = `${dateStamp}/${region}/s3/aws4_request`;

  // `host` is always signed; anything else the caller asked to pin joins it.
  const headers: Record<string, string> = { host: base.host };
  for (const [name, value] of Object.entries(signedHeaders)) {
    headers[name.toLowerCase()] = String(value).trim();
  }
  const headerNames = Object.keys(headers).sort();
  const canonicalHeaders = headerNames.map((name) => `${name}:${headers[name]}\n`).join("");
  const signedHeaderList = headerNames.join(";");

  const query: Record<string, string> = {
    "X-Amz-Algorithm": "AWS4-HMAC-SHA256",
    // Present in the query, so it forms part of the canonical request. The AWS
    // SDK emits it too; keeping it identical means these URLs are byte-for-byte
    // what the SDK would have produced.
    "X-Amz-Content-Sha256": "UNSIGNED-PAYLOAD",
    "X-Amz-Credential": `${accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresInSeconds),
    "X-Amz-SignedHeaders": signedHeaderList,
  };
  const canonicalQuery = Object.keys(query)
    .sort()
    .map((name) => `${encodeRfc3986(name)}=${encodeRfc3986(query[name])}`)
    .join("&");

  const canonicalRequest = [
    method,
    canonicalUri,
    canonicalQuery,
    canonicalHeaders,
    signedHeaderList,
    "UNSIGNED-PAYLOAD",
  ].join("\n");

  const stringToSign = [
    "AWS4-HMAC-SHA256",
    amzDate,
    scope,
    await sha256Hex(canonicalRequest),
  ].join("\n");

  let signingKey = await hmac(encoder.encode(`AWS4${secretAccessKey}`), dateStamp);
  signingKey = await hmac(signingKey, region);
  signingKey = await hmac(signingKey, "s3");
  signingKey = await hmac(signingKey, "aws4_request");
  const signature = toHex(await hmac(signingKey, stringToSign));

  return `${base.origin}${canonicalUri}?${canonicalQuery}&X-Amz-Signature=${signature}`;
}
