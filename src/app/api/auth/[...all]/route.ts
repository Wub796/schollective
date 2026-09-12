import { auth, authErrorStore } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

/**
 * Better Auth answers expected failures (bad password, duplicate email) with a
 * JSON body the client can show. Anything else — an unreachable database, a
 * missing table, a bad connection string — is logged internally and answered
 * with a bodyless HTTP 500, which the auth client surfaces with no message at
 * all ("Failed to sign in."). Fill that empty response in so the browser and the
 * logs agree about something having gone wrong.
 *
 * The DETAIL is development-only. These messages are genuinely useful when
 * debugging a deployment, but this endpoint is unauthenticated and the underlying
 * errors are descriptive to a fault — `describeMissingDbUrl()` reports which of
 * the expected environment variables the running Worker can see, which is
 * reconnaissance handed to anyone who can reach /api/auth. In production the
 * client gets a generic sentence plus a stable code; the full message is logged,
 * where Sentry picks it up.
 */
const EXPOSE_ERROR_DETAIL = process.env.NODE_ENV !== "production";
const GENERIC_AUTH_ERROR = "Authentication is temporarily unavailable. Please try again.";

/** The message to send the client, given the real one. */
function clientMessage(detail: string | undefined): string {
  return EXPOSE_ERROR_DETAIL && detail ? detail : GENERIC_AUTH_ERROR;
}
function withErrorBody(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const slot: { error?: unknown } = {};
    let response: Response;

    try {
      response = await authErrorStore.run(slot, () => handler(request));
    } catch (error: any) {
      const detail = error?.message as string | undefined;
      console.error("[auth] Unhandled error on", new URL(request.url).pathname, "-", detail ?? error);
      return Response.json(
        { message: clientMessage(detail), code: error?.code ?? "AUTH_REQUEST_FAILED" },
        { status: 500 },
      );
    }

    if (response.status < 500) return response;

    // Never clobber a response that already carries a body of its own.
    const body = await response.clone().text().catch(() => "x");
    if (body.trim()) return response;

    const error = slot.error as { message?: string; code?: string } | undefined;
    console.error("[auth] Empty error response on", new URL(request.url).pathname, "-", error?.message ?? error);

    return Response.json(
      { message: clientMessage(error?.message), code: error?.code ?? "AUTH_REQUEST_FAILED" },
      { status: response.status, headers: response.headers },
    );
  };
}

export const GET = withErrorBody(handlers.GET);
export const POST = withErrorBody(handlers.POST);
