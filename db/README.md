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
| `request_members`, `thread_reads` | The app | Co-students on a group thread; each participant's read position |
| `friendships`, `user_blocks` | The app | Student friend requests and friends; one-directional blocks |
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

### Applying migrations: encoding

Apply migrations with a UTF-8 client (`PGCLIENTENCODING=UTF8 psql ...`, or the
Neon SQL editor). `0007` was applied through a client that was not, and an em
dash in one of its messages is stored in production as mis-encoded characters.
Migrations from `0008` on are kept ASCII-only so this cannot recur;
`tests/social-schema.test.mjs` enforces it.

### 0009 — live schema drift

Apply after `0008`. It closes three differences between the repository and
production: the maintenance backup table `profiles_orphan_backup` was fully
readable by the app role (via `0006`'s default privileges) with no RLS;
`profiles.ai_score` was `numeric`, which the driver returns as a string; and the
mis-encoded guard message above. Any backup table created by hand as the owner
needs the same `REVOKE ALL ... FROM schollective_app`, because default privileges
grant the app role access to every table the owner creates.

### 0010 — self-service account deletion

Apply `0010_self_service_account_deletion.sql` before deploying the code that
uses it, as `neondb_owner`. Two of its four parts are not expressible as a
schema-bootstrap patch:

- `profiles.deactivated_at` and `profiles.status_before_deactivation` record a
grace window. The runtime bootstrap adds the columns (`APP_REQUIRED_COLUMNS`),
but not the policy or trigger below — so a database without this migration can
record a disable and cannot honour it.
- `profiles_delete` changes from admin-only to `id = app_user_id() OR
app_is_admin()`. Without it the "delete my account" endpoint answers success and
deletes nothing, because `profiles` carries `FORCE ROW LEVEL SECURITY` and the
owner is subject to its policies like anyone else.
- `guard_profile_role_change` learns the disable/restore pair: it still refuses
self-approval, except where the row records that `approved` is what the account
held when it disabled itself. The column it reads can only be written in the
statement that disables the account, and only as the status being left behind,
so it cannot be used to claim a status the account never had. The trigger now
fires on that column as well, or the claim could be made on its own.

Deleting an account is irreversible by design and keeps no backup: the
confirmation promises the data is gone. See `002` below for the other half —
removing accounts that were disabled and never restored.

### 0011 — professor display title

`0011_profile_honorific.sql` adds `profiles.honorific`: the form of address an
account chose (`Dr.`, `Prof.`, `Mr.`, `Ms.`, `Mx.`, `Mrs.`, a short title of its
own, or the literal `'none'` for no title at all). A `NULL` means "never
chosen", which the naming helpers in `src/lib/people.ts` read as `Dr.` — so an
account that predates the column keeps exactly the title it always showed, and
nothing is backfilled. There is no CHECK constraint and no index: the list of
titles people legitimately use is longer than one we would write, and nothing
filters or orders on the column. The runtime bootstrap adds the column through
`APP_REQUIRED_COLUMNS`, so this migration is only needed by a database whose
owner is not applying the app's own bootstrap.

### 0012 — profile gender

`0012_profile_gender.sql` adds `profiles.gender`. It is optional and nullable,
and it has two ways of showing nothing: `NULL` means nobody answered, and the
stored sentinel `'prefer-not-to-say'` means the account answered that it wants
this kept off their profile. The vocabulary lives in `GENDER_CHOICES`
(`src/lib/people.ts`) and the write path refuses anything else, which is why
there is no CHECK constraint and no migration to run when the list grows. It
renders on the public faculty profile and on a student's profile page to viewers
who may see that profile; it is deliberately not part of `app_student_cards`, so
it is not shown to students who are not connected to its owner. The runtime
bootstrap adds the column through `APP_REQUIRED_COLUMNS` as well.

### 002 — purging disabled accounts (maintenance)

`db/maintenance/002_purge_deactivated_accounts.sql` deletes accounts that are
still `deactivated` past the 30-day grace window: their sessions, their AI
review jobs (keyed by user id, with no foreign key, so nothing else removes
them), their profile row — which cascades threads, messages, notifications,
friendships, blocks, memberships and read positions — and finally the auth row.

Nothing runs it automatically: `wrangler.jsonc` declares no cron triggers, so a
scheduled deletion is not something this deployment can promise. Run it monthly
as `neondb_owner`, after reading the address list it prints in step 1:

```bash
psql "$DATABASE_URL" -f db/maintenance/002_purge_deactivated_accounts.sql
```

The 30 days in that file and `DEACTIVATION_GRACE_DAYS` in
`src/lib/account-deletion.ts` are the same promise in two places; change them
together.

### 0008 — friends and group threads

`0008_friends_and_group_mentorship.sql` must be applied, as `neondb_owner`,
**before** the application code that uses it is deployed: the thread list,
unread badges and friends page all read its tables. It refuses to run as a role
subject to RLS.

- A request's `student_id` is the thread's **lead**. Other students are rows in
  `request_members` (`invited` → `joined` → `left`/`removed`, or `declined`); only
  accepted friends can be invited, and only into an open request.
- Unread state is per user in `thread_reads`. `messages.read_at` could only mean
  "the other party read this", which breaks with three participants; existing
  read state is backfilled from it and the column is no longer written.
- Membership lookups inside policies go through `SECURITY DEFINER` helpers
  (`app_is_thread_participant`, `app_can_view_request`, `app_is_connected_to`) to
  avoid policy recursion. Each answers only about the calling user.
- Student discovery is `app_search_students`, and names for students the caller
  is not connected to come from `app_student_cards`. Both return a fixed set of
  safe columns, so `profiles_select` never has to expose grades or scores to
  make search work. A pending friend request reveals the requester's profile to
  the addressee, never the reverse.
- Legal membership and friendship transitions are enforced by triggers, mirrored
  in `src/lib/collaboration.ts` (and tested in `tests/collaboration.test.mjs`).

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
