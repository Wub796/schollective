import { auth, authErrorStore } from "@/lib/auth";
import { toNextJsHandler } from "better-auth/next-js";

export const dynamic = "force-dynamic";

const handlers = toNextJsHandler(auth);

/**
 * Better Auth answers expected failures (bad password, duplicate email) with a
 * JSON body the client can show. Anything else — an unreachable database, a
 * missing table, a bad connection string — is logged internally and answered
 * with a bodyless HTTP 500, which the auth client surfaces with no message at
 * all ("Failed to sign in."). Fill that empty response in with the real cause,
 * captured through `authErrorStore`, so the browser and the logs agree.
 */
function withErrorBody(handler: (request: Request) => Promise<Response>) {
  return async (request: Request): Promise<Response> => {
    const slot: { error?: unknown } = {};
    let response: Response;

    try {
      response = await authErrorStore.run(slot, () => handler(request));
    } catch (error: any) {
      const message = error?.message || "Authentication is temporarily unavailable.";
      console.error("[auth] Unhandled error on", new URL(request.url).pathname, "-", message);
      return Response.json({ message, code: error?.code ?? "AUTH_REQUEST_FAILED" }, { status: 500 });
    }

    if (response.status < 500) return response;

    // Never clobber a response that already carries a body of its own.
    const body = await response.clone().text().catch(() => "x");
    if (body.trim()) return response;

    const error = slot.error as { message?: string; code?: string } | undefined;
    const message = error?.message || "Authentication is temporarily unavailable.";
    console.error("[auth] Empty error response on", new URL(request.url).pathname, "-", message);

    return Response.json(
      { message, code: error?.code ?? "AUTH_REQUEST_FAILED" },
      { status: response.status, headers: response.headers },
    );
  };
}

export const GET = withErrorBody(handlers.GET);
export const POST = withErrorBody(handlers.POST);
