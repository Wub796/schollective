/**
 * Where profile pictures live, and the only kind of uploaded-avatar link a
 * profile may store.
 *
 * The uploads bucket is private, so a stored avatar is never a bucket URL: it is
 * a path to our own route, which signs a short-lived read and redirects to it.
 * Client-safe, so the upload route, the serving route and the profile sanitiser
 * all check against the same pattern.
 */

export const AVATAR_ROUTE = "/api/storage/avatar/";

/** The object keys the upload route mints: `avatars/<user id>/<timestamp>.<ext>`. */
export const AVATAR_KEY = /^avatars\/([A-Za-z0-9_-]{1,64})\/\d{10,20}\.(?:jpg|png|webp|gif)$/;

/** The link stored on a profile for an uploaded object. */
export function avatarRouteFor(key: string): string {
  return `${AVATAR_ROUTE}${key}`;
}

/**
 * The object key an avatar link points at, or null when the link is not one of
 * ours. The `?t=` cache-buster the profile forms append after an upload is the
 * only query allowed.
 */
export function avatarKeyFromRoute(value: string): string | null {
  if (!value.startsWith(AVATAR_ROUTE)) return null;
  const [key, query, ...rest] = value.slice(AVATAR_ROUTE.length).split("?");
  if (rest.length > 0 || (query !== undefined && !/^t=\d{1,20}$/.test(query))) return null;
  return AVATAR_KEY.test(key) ? key : null;
}

/** The user an uploaded avatar belongs to, read from its key. */
export function avatarOwner(key: string): string | null {
  return AVATAR_KEY.exec(key)?.[1] ?? null;
}
