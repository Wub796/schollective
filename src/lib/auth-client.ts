import { createAuthClient } from "better-auth/react";
import { sentinelClient } from "@better-auth/infra/client";

export const authClient = createAuthClient({
  baseURL: typeof window !== "undefined"
    ? window.location.origin
    : (process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000").replace(/\/$/, ""),
  plugins: [sentinelClient()],
});

export const { signIn, signUp, signOut, useSession } = authClient;
