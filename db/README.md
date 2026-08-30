# Database

Schollective stores everything in Neon Postgres and reaches it over the Neon
stateless HTTP driver, which is what makes it work inside a Cloudflare Worker.

## Tables

| Table | Owner | Purpose |
| --- | --- | --- |
| `user`, `session`, `account`, `verification` | Better Auth | Credentials, sessions, OAuth links, one-time tokens |
| `profiles` | The app | Role, institution, onboarding answers |
| `requests`, `messages`, `notifications` | The app | Mentorship requests and threads |

## Migrations

`db/migrations/0001_better_auth.sql` holds the Better Auth schema for
better-auth 1.7. The deploy pipeline (`opennextjs-cloudflare build && wrangler
deploy`) has no migration step, so the app applies it itself: the first
authenticated request an isolate serves runs the check in
`src/lib/neon/schema.ts`, which creates anything missing and adds columns a
database migrated against an older Better Auth release does not have yet. The
check costs one query once the schema is current.

To manage the schema by hand instead, set `AUTH_SCHEMA_AUTO_MIGRATE=false` and
apply the file yourself. Every statement is idempotent:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_better_auth.sql
```

## Environment

Authentication needs these set on the Worker (`wrangler secret put <NAME>`):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string. `DATABASE_URL_UNPOOLED` is preferred when set — the HTTP `/sql` endpoint lives on the compute host, not the `-pooler` host. |
| `BETTER_AUTH_SECRET` | yes | Session signing key. Changing it signs everyone out. |
| `BETTER_AUTH_URL` | yes | The origin the app is served from. Google's redirect URI is derived from it, so it must match the URI registered in the Google console (`<BETTER_AUTH_URL>/api/auth/callback/google`). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google sign-in | From the Google Cloud console OAuth client. |

When any of these is missing, `/api/auth/*` now answers with a JSON body naming
the problem instead of an empty HTTP 500.
