/**
 * Uploaded profile pictures: the link a profile stores, and the browser rules
 * that let it load. Pictures silently disappeared once the CSP's img-src was
 * narrowed without the storage host the avatar route redirects to.
 */

import test from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { AVATAR_KEY, avatarKeyFromRoute, avatarOwner, avatarRouteFor } from "../src/lib/avatar.ts";

test("an avatar key round-trips through the route that serves it", () => {
  const key = "avatars/user_1/1757937600000.png";
  assert.equal(avatarRouteFor(key), "/api/storage/avatar/avatars/user_1/1757937600000.png");
  assert.equal(avatarKeyFromRoute(avatarRouteFor(key)), key);
  assert.equal(avatarKeyFromRoute(`${avatarRouteFor(key)}?t=1757937600123`), key);
  assert.equal(avatarOwner(key), "user_1");
});

test("only the exact key shape the upload route mints is accepted", () => {
  for (const bad of [
    "/api/storage/avatar/avatars/user_1/1757937600000.svg",
    "/api/storage/avatar/avatars/user_1/../../secret.png",
    "/api/storage/avatar/uploads/user_1/1757937600000.png",
    "/api/storage/avatar/avatars/user_1/1757937600000.png?t=abc",
    "https://evil.example/api/storage/avatar/avatars/user_1/1757937600000.png",
  ]) {
    assert.equal(avatarKeyFromRoute(bad), null, bad);
  }
  assert.equal(AVATAR_KEY.test("avatars/user_1/1757937600000.webp"), true);
});

test("the upload and serving routes use the shared avatar key, not a copy", () => {
  const serve = readFileSync(new URL("../src/app/api/storage/avatar/[...key]/route.ts", import.meta.url), "utf8");
  const upload = readFileSync(new URL("../src/app/api/storage/upload/route.ts", import.meta.url), "utf8");
  assert.match(serve, /import \{ AVATAR_KEY \} from "@\/lib\/avatar"/);
  assert.doesNotMatch(serve, /const AVATAR_KEY/);
  assert.match(upload, /avatarRouteFor\(key\)/);
});

test("the CSP lets uploaded pictures load from Neon Object Storage", () => {
  const config = readFileSync(new URL("../next.config.ts", import.meta.url), "utf8");
  const imgSrc = config.match(/"img-src [^"]*"/)?.[0] ?? "";
  assert.match(imgSrc, /https:\/\/\*\.neon\.tech/, "the avatar route redirects to a presigned *.neon.tech URL");
  const connectSrc = config.match(/"connect-src [^"]*"/)?.[0] ?? "";
  assert.match(connectSrc, /https:\/\/\*\.neon\.tech/, "the browser uploads straight to the presigned URL");
});
