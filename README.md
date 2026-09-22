# Schollective

A mentorship marketplace connecting students with verified university faculty.
Students build an academic profile, browse approved professors, and send a
mentorship request; faculty review requests and continue in a private thread.
Students can add classmates as friends and bring them onto a request as
collaborators, so a group works with a professor in one shared thread.
An admin surface verifies faculty credentials and moderates activity.

## Stack

| Concern | Choice |
| --- | --- |
| Framework | Next.js 15 (App Router), React 19 |
| Hosting | Cloudflare Workers, via OpenNext (`@opennextjs/cloudflare`) |
| Database | Neon Postgres, through the stateless HTTP driver |
| Auth | Better Auth (email/password + Google), Kysely over the Neon HTTP driver |
| Authorization | App-level checks in `src/lib/authz.ts`, backed by Postgres RLS |
| AI | Google Gemini (`@google/genai`) — profile review, résumé parsing, recommendations, moderation |
| Storage | S3-compatible bucket, presigned with Web Crypto (`src/lib/neon/s3-presign.ts`) |
| Styling | Tailwind v4 with CSS custom properties in `src/app/globals.css` |
| Type | Mulish (body) + Arima (display), loaded with `next/font` |
| Observability | Sentry, PostHog, Amplitude |

## Getting started

```bash
npm ci
```

Copy `.env.example` to `.env.local` and fill it in. At minimum the app needs
`DATABASE_URL`, `BETTER_AUTH_SECRET` and `BETTER_AUTH_URL`; Google sign-in, AI
features, uploads and analytics each degrade gracefully when their variables are
absent.

```bash
npm run dev
```

The app serves on http://localhost:3000. Editing starts at
[`src/app/page.tsx`](src/app/page.tsx).

## Checks

These are the same three steps CI runs, and they gate every push. The production
build deliberately ignores type and lint errors (`next.config.ts`) so the
Cloudflare build does not re-run them, which means **this is the only gate** —
keep it green.

```bash
npm test                        # node:test, imports real source modules
./node_modules/.bin/tsc --noEmit
./node_modules/.bin/eslint .
```

Invoke the binaries directly rather than through `npx`. With typescript absent,
`npx tsc` silently downloads an unrelated 2016 package named `tsc`, prints a
banner and exits 0 — a typecheck that passes without typechecking.

## Database

Migrations live in [`db/migrations`](db/migrations) and are applied in order:

```bash
psql "$DATABASE_URL" -f db/migrations/0006_rls_scope_profiles_and_grants.sql
```

Apply them as a role that owns the tables (`neondb_owner`), not as the role the
app connects with. `0008` (friends and group threads), `0009` (live schema
drift), `0010` (self-service account deletion) and `0013` (beta feedback) must
be applied **before** deploying the code that depends on them — see
[`db/README.md`](db/README.md). The runtime bootstrap can create `0013`'s table,
but not the policies that keep one person's report private to them, so a
database that skips it stores feedback every caller can read.
Deleting a disabled account past its grace window is a maintenance script rather
than anything scheduled, because the Worker declares no cron triggers.

Row-level security is **enforcing**: `0004` transfers table ownership to the
non-`BYPASSRLS` role `schollective_app` and expresses the app's authorization
model as policies. Two consequences worth knowing before writing a query:

- **Every user-scoped query must run inside `runAs(userId, …)`.** The `sql`
  wrapper (`src/lib/neon/db.ts`) attaches `app.user_id` per query, and the
  policies read it. A query that skips `runAs` is not an error — it returns
  *fewer rows*, usually none, which looks like missing data rather than a bug.
- **A new table needs no new GRANT.** `0006` sets `ALTER DEFAULT PRIVILEGES`.
  Before it, `0005` added a table after `0004` had already granted on "all
  tables", so the app had no privileges on it and the durable rate limiter failed
  open silently for every request.

There is one source of truth for schema: `db/migrations`. (A parallel
`supabase/` directory existed from an earlier stack and has been removed — the
app has no Supabase dependency.)

## Deploying

```bash
npm run deploy        # opennextjs-cloudflare build && deploy
npm run preview       # build and serve the Worker locally
```

Runtime configuration must be set as Worker **secrets**, not build-time
variables:

```bash
wrangler secret put DATABASE_URL
```

A plain-text dashboard variable does not survive as a runtime binding while
`wrangler.jsonc` declares no `vars`. `describeMissingDbUrl()` in
`src/lib/neon/db.ts` reports which variables a running Worker can actually see,
which is the fastest way to tell "this one variable did not apply" from "no
bindings are reaching this Worker".

## Layout

```
src/app/            routes — (auth), (public), (dashboard), admin, api
src/components/     ui/ primitives, features/, profile/, layout/
src/lib/            authz, status, security, validators, neon/, ai/
db/migrations/      ordered SQL, the schema source of truth
tests/              node:test; helpers/ registers TS + @/ alias resolution
```

Three modules are worth reading before changing behaviour:

- [`src/lib/status.ts`](src/lib/status.ts) — the request/profile status
  vocabulary and the visibility sets derived from it. Add a status here first.
- [`src/lib/authz.ts`](src/lib/authz.ts) — `requireUser` / `requireRole` /
  `requireParticipant`. A server action is a public HTTP endpoint whose id sits
  in a static JS chunk, so a page-level `redirect()` guard protects the page and
  nothing else. Every action starts with one of these calls.
- [`src/lib/route-access.ts`](src/lib/route-access.ts) — which paths the
  middleware gates, checked against the real route tree by
  `tests/middleware-routes.test.mjs`.
- [`src/lib/collaboration.ts`](src/lib/collaboration.ts) — who may invite,
  remove, leave and close on a group thread. The database enforces the same
  membership transitions; read this before changing either side.
- [`src/lib/account-deletion.ts`](src/lib/account-deletion.ts) — the grace
  window, the confirmation phrases and the status a restore returns to. The
  email, the restore page and `db/maintenance/002` all quote these constants, so
  change them here and nothing has to be found by grepping.

## Design system

Three contracts in `src/app/globals.css` are worth knowing before you style
anything, because each one exists to stop a specific drift that already happened
once:

- **Colour.** The palette literals live in the `--color-*` block and nowhere
  else; every other colour token is an alias onto one of them. Because they use
  the `--color-` prefix, Tailwind turns them into utilities, so templates write
  `bg-paper`, `text-ink-soft`, `border-line` instead of a hex or an off-token
  Tailwind colour. Adding a hue means adding it to that block first.
- **Type.** `--font-sans` and `--font-display` resolve through `var(--font-mulish)`
  and `var(--font-arima)`, which `layout.tsx` assigns via `next/font`. They must
  stay `var()` references: a literal family name in that block wins the cascade
  over the value `next/font` puts on `<html>`, and the declared typeface quietly
  stops being the rendered one. The block previously named Berthold and Recoleta
  — fonts that were never loaded.
- **Radius.** `--radius-control` (buttons, inputs, pills), `--radius-surface`
  (cards, panels, mockup windows) and `--radius-inset` (nested inside a
  surface). Pick by the element's role; do not introduce a new number.

## Known gaps

- `script-src` still carries `'unsafe-inline'` (`next.config.ts`). Removing it
  requires per-request nonces threaded through the document, which in turn
  requires every page to render dynamically.
- `ProfileRecord` is hand-maintained against the DDL in `src/lib/neon/schema.ts`.
  `tests/schema-drift.test.mjs` compares the two and fails on divergence;
  generating the types is the real fix.
- Styling is mid-migration. The public surface (`src/app/page.tsx`, the
  `(public)` routes and the components they share) resolves through the tokens
  above. The dashboard, admin and profile surfaces still carry inline `style`
  objects with literal values, including hover effects implemented by rewriting
  `element.style` from `onMouseEnter`.
- `three` and `@types/three` are in `package.json` but nothing imports them any
  more; dropping them is a lockfile change, so it is not done here.
- The icon set is one image wearing four hats. `favicon.ico`, `favicon.png`,
  `apple-touch-icon.png` and `logo.png` are byte-identical 400x400 PNGs, so no
  per-size variant exists for the browser to choose, and `favicon.ico` is a PNG
  with a PNG body under an `.ico` name. The metadata in `layout.tsx` now states
  the real 400x400 dimensions instead of the 48/192/512/180 it used to claim;
  generating real 32/180/192/512 variants from the source art is the fix.
- `public/hero-glass.png`, `public/dark-fluid.png` and the Next.js starter SVGs
  beside them are listed in `.gitignore` and nothing references them — leftovers
  from the removed glass/dark treatment and the original scaffold. They are
  local-only, so they cost the repository nothing; delete them at will.
