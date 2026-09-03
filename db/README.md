# Database

Schollective stores everything in Neon Postgres and reaches it over the Neon
stateless HTTP driver, which is what makes it work inside a Cloudflare Worker.

## Tables

| Table | Owner | Purpose |
| --- | --- | --- |
| `user`, `session`, `account`, `verification` | Better Auth | Credentials, sessions, OAuth links, one-time tokens |
| `rateLimit` | Better Auth | Shared counters for the auth rate limiter |
| `profiles` | The app | Role, institution, onboarding answers |
| `requests`, `messages`, `notifications` | The app | Mentorship requests and threads |
| `ai_profile_review_jobs` | The app | Durable AI profile-review requests and results |

The bootstrap also creates the indexes these tables are queried by. The rate
limiter is deliberately database-backed: an in-memory counter is per Worker
isolate, which on Cloudflare is close to no limit at all.

## Migrations

`db/migrations/0001_better_auth.sql` holds the Better Auth schema for
better-auth 1.7. The deploy pipeline (`opennextjs-cloudflare build && wrangler
deploy`) has no migration step, so the app applies it itself: the first
authenticated request an isolate serves runs the check in
`src/lib/neon/schema.ts`, which creates anything missing and adds columns a
database migrated against an older Better Auth release does not have yet. The
check costs one query once the schema is current.

The durable AI profile-review table and its recovery indexes are defined in
`db/migrations/0002_ai_profile_review_jobs.sql`. The same runtime bootstrap
creates them automatically when `AUTH_SCHEMA_AUTO_MIGRATE` is enabled.

To manage the schema by hand instead, set `AUTH_SCHEMA_AUTO_MIGRATE=false` and
apply the file yourself. Every statement is idempotent:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_better_auth.sql
psql "$DATABASE_URL" -f db/migrations/0002_ai_profile_review_jobs.sql
```

## Environment

Authentication needs these set on the Worker (`wrangler secret put <NAME>`):

| Variable | Required | Notes |
| --- | --- | --- |
| `DATABASE_URL` | yes | Neon connection string. `DATABASE_URL_UNPOOLED` is preferred when set — the HTTP `/sql` endpoint lives on the compute host, not the `-pooler` host. |
| `BETTER_AUTH_SECRET` | yes | Session signing key. Changing it signs everyone out. |
| `BETTER_AUTH_URL` | yes | The origin the app is served from. Google's redirect URI is derived from it, so it must match the URI registered in the Google console (`<BETTER_AUTH_URL>/api/auth/callback/google`). |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | for Google sign-in | From the Google Cloud console OAuth client. Google sign-in is offered only when both are set; without them the button reports itself as unconfigured rather than failing mid-handshake. |
| `RESEND_API_KEY` / `EMAIL_FROM` | for password reset | Without them, reset and verification emails are logged instead of delivered — so nobody can recover an account. `EMAIL_FROM` must use a domain verified in Resend. |
| `AUTH_SCHEMA_AUTO_MIGRATE` | no | Set to `false` to manage the schema by hand. |

None of these have in-code fallbacks: a secret committed to the repository is a
secret everyone has. When `DATABASE_URL` is missing, `/api/auth/*` answers with a
JSON body naming the problem — and listing which variables the deployment can
actually see — instead of an empty HTTP 500.
