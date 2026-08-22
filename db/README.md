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

## Row-Level Security

All tables carry row-level security, enforced through two migrations:

- `db/migrations/0003_rls_policies.sql` enabled RLS on every table while the
  app still connected as `neondb_owner` (whose BYPASSRLS attribute makes
  policies inert) — pure staging, zero behavior change.
- `db/migrations/0004_rls_activate.sql` activates enforcement: every table is
  owned by the least-privilege `schollective_app` role (no BYPASSRLS), the app
  tables are `FORCE`d so their owner is subject to policy, and the policies
  mirror the app's authorization model, keyed on the `app.user_id` setting the
  sql wrapper (`src/lib/neon/db.ts`) attaches per query via
  `src/lib/neon/user-context.ts`.

Notes for future changes:

- Better Auth tables are deliberately NOT `FORCE`d — their owner (the app
  role) must read and write sessions across users for the library to work.
- `notifications` inserts are allowed for any authenticated user because the
  app writes them on behalf of other users (a professor accepting a request
  notifies the student); `INSERT .. RETURNING` on that table would apply the
  SELECT policy to the returned row and must be avoided there.
- Admin powers at the database layer come from the caller's `role = 'admin'`
  in the `user` table, re-checked inside `app_is_admin()`.
- The role's password lives only in `.env.local` and the Worker secrets —
  never in git. Rollback is a connection-string change back to `neondb_owner`.

To manage the schema by hand instead, set `AUTH_SCHEMA_AUTO_MIGRATE=false` and
apply the files yourself. Every statement is idempotent:

```bash
psql "$DATABASE_URL" -f db/migrations/0001_better_auth.sql
psql "$DATABASE_URL" -f db/migrations/0002_ai_profile_review_jobs.sql
psql "$DATABASE_URL" -f db/migrations/0003_rls_policies.sql
psql "$DATABASE_URL" -f db/migrations/0004_rls_activate.sql   # requires the schollective_app role to exist
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
