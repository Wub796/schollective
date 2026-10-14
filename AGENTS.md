<!-- BEGIN:nextjs-agent-rules -->
# This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all
differ from your training data. Heed deprecation notices.

Check the installed version before relying on remembered API shapes:

```bash
node -p "require('next/package.json').version"
```

Things this version does differently, which bite most often:

- `params` and `searchParams` in pages, layouts and route handlers are
  **Promises** and must be awaited.
- `cookies()` and `headers()` are **async**.
- `fetch` is no longer cached by default; opt in explicitly.

(An earlier version of this file pointed at `node_modules/next/dist/docs/` for
the authoritative guides. That directory is not published in the installed
package — it does not exist — so the instruction sent every reader to a dead
path. Use the version check above and https://nextjs.org/docs for the matching
release.)
<!-- END:nextjs-agent-rules -->

# TOKEN MONITORING & AUDIT RULE

At the very end of every generation, include a lightweight, non-intrusive Token Estimate footer formatted exactly as follows:

---
**Run Metrics (Estimated)**
* Current Chat Load: ~[X]k tokens ([P]% of 25k target)
* Turn Output: ~[Y] tokens
* Status: [Safe (<60%) | Getting Full (60-85%) | Refresh Recommended (>85%)]
* Context Alert: [If >85%: "⚠️ Chat is getting long. Recommend starting a fresh chat to save your 5-hour limit." Else: "None"]
---

Estimation Standard:
- System & Tool Baseline: ~8.5k tokens (Agent persona, tool schemas, and environment metadata).
- Conversational text: ~4.0 characters per token.
- Code snippets, file payloads, and tool outputs: ~3.2 characters per token.
- Session Target Ceiling: 25,000 tokens (practical threshold before per-turn 5-hour limit burn increases substantially).
- Account for all attached file contents, tool outputs, and turn history in the active conversation when estimating Current Chat Load.

# MANDATORY QUALITY GATE

Three packs are installed in this repo. They are not optional advice: apply them
on **every code change** and re-run the push gate **before every push to `main`**.
(Canonical copy: [`.agents/rules/quality-gate.md`](.agents/rules/quality-gate.md).)

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

