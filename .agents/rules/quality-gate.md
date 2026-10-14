# MANDATORY QUALITY GATE

Three packs are installed in this repo. They are not optional advice: apply them
on **every code change**, and re-run the push gate **before every push to `main`**.

| Pack | Entry point | What it is for |
|---|---|---|
| Ponytail | `.agents/rules/ponytail.md`, `.agents/skills/ponytail/SKILL.md` | Lazy-senior-dev mode: the smallest complete change, no speculative code |
| pstack | `.agents/skills/poteto-mode/SKILL.md` | Rigorous, verifiable agent workflow (playbooks + principles + review) |
| Thermo-nuclear review | `.agents/skills/thermo-nuclear-code-quality-review/SKILL.md` | Unusually strict maintainability review of the diff |

Read the relevant `SKILL.md` before using a skill. The trees were installed with
the `skills` CLI and are recorded in `skills-lock.json`
(`npx skills experimental_install` restores them; `npx skills update` bumps them).

## A. Before you edit — every change

1. **Ponytail is always on.** Follow `.agents/rules/ponytail.md` for the whole
   session: take the first option that fully works, use what the codebase already
   has, never add a dependency for a few lines, delete instead of adding, and
   leave one small test behind for any new non-trivial logic. End the reply with
   the one-or-two lines ponytail asks for: what you skipped and any risk.
2. **Pick the pstack playbook for anything non-trivial.** Read
   `.agents/skills/poteto-mode/SKILL.md`, match the task to a playbook in
   `.agents/skills/poteto-mode/playbooks/` (`bug-fix`, `feature`, `refactoring`,
   `perf-issue`, `investigation`, `shipping`, ...), and open a todo list whose
   first items are that playbook's steps, copied verbatim.
3. **Consult a pstack principle when the design is unclear.**
   `.agents/skills/principle-*/SKILL.md` — in particular
   `principle-subtract-before-you-add`, `principle-fix-root-causes`,
   `principle-prove-it-works`, `principle-test-behavior-not-implementation`,
   `principle-type-system-discipline`.
4. **Write the test the change needs.** Use `.agents/skills/tdd/SKILL.md` when a
   cheap local test target exists; the repo suite is `npm test`
   (`tests/*.test.mjs`).

## B. Before you push to `main` — the gate

Run all four, in order, and fix what they find. Do not report a check as passing
unless you ran it and saw it pass.

1. **Thermo-nuclear code quality review.** Load
   `.agents/skills/thermo-nuclear-code-quality-review/SKILL.md` and review the
   diff (`git diff main...HEAD`) against its rubric. Its presumptive blockers are
   blockers here too — a file pushed past 1000 lines, ad-hoc branching bolted
   onto unrelated flows, thin wrappers, `any`/cast-heavy boundaries, logic in the
   wrong layer. Look for the code-judo move before accepting the diff.
2. **pstack `/interrogate`** — `.agents/skills/interrogate/SKILL.md`.
   Adversarial, multi-angle review of the same diff. Clear every finding or
   record why it is waived.
3. **pstack `/unslop`** — `.agents/skills/unslop/SKILL.md` — on the PR body,
   commit messages and any prose you wrote.
4. **The repo's own gates, with real exit status** — the four CI runs, invoked
   through the binaries directly, never through `npx`:
   `npm test`, `./node_modules/.bin/tsc --noEmit`,
   `./node_modules/.bin/eslint .`, `./node_modules/.bin/next build`.
   `npx tsc` is not an equivalent check: when typescript is absent, npx
   downloads the unrelated 2016 package named `tsc`, prints a banner and exits
   0, so the step passes without typechecking. The production build ignores type
   and lint errors (`next.config.ts`), which makes this the only gate, and
   `next build` is the only place a build-only failure is caught. Preserve the
   exit status (do not pipe through `tail`/`head` without `set -o pipefail`).

If a step is genuinely impossible in the environment (missing credentials, no
network), say so explicitly and name what was not verified — never silently skip
it and call the gate green.
