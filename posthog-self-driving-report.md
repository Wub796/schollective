# PostHog Self-driving setup report

## Summary

PostHog Self-driving was configured for this web application: GitHub access was connected; Session Replay, Error Tracking, and Support were enabled; and the native inbox signal sources were armed. A focused scout troop and two Replay Vision monitors were also configured. Findings should begin appearing in the [Self-driving inbox](https://us.posthog.com/project/587829/inbox) within about 30 minutes.

## AI data processing

Approved by the wizard's organization-level gate before this setup began.

## GitHub

| Status | Detail |
|---|---|
| Connected during this run | The PostHog GitHub App integration is connected and can be used by Self-driving to investigate findings and prepare fixes. |

## Products enabled

| Product | Status | Notes |
|---|---|---|
| Session Replay | Already enabled | The Next.js `posthog.init` configuration does not disable session recording. No recordings were observed yet. |
| Error Tracking | Enabled | The Next.js client initialization already has exception capture enabled; no conflicting override was found. |
| Support (Conversations) | Enabled | The responder is armed, but tickets require an inbound email, inbox, or Slack channel before any arrive. |

## Signal sources

| Signal source | Action |
|---|---|
| `signals_scout` / `cross_source_issue` | Enabled |
| `health_checks` / `health_issue` | Enabled |
| `error_tracking` / `issue_created` | Enabled |
| `error_tracking` / `issue_reopened` | Enabled |
| `error_tracking` / `issue_spiking` | Enabled |
| `session_replay` / `session_analysis_cluster` | Enabled at the server-provided 10% sample rate |
| `conversations` / `ticket` | Enabled; remains idle until an inbound Support channel is connected |
| `llm_analytics`, logs, Replay Vision source rows, evaluations, and alert-state changes | Deliberately skipped; they are not applicable native responders for this setup. Replay Vision uses scanner-level `emits_signals` instead. |

## Connected tools

No optional external tools were selected. No external data warehouse source or connected-tool responder was added.

## Scout troop

**Run budget:** 100 runs per day; 0 used today; 100 remaining. The project is enrolled in early access. Announcement: “Scouts are in early access. Each project gets up to 100 scout runs a day. Contact team-self-driving@posthog.com if you need more.”

### Enabled (4)

| Scout | Why it is enabled |
|---|---|
| `signals-scout-general` | Checks cross-product correlations and surfaces without a dedicated specialist. |
| `signals-scout-product-analytics` | The repository instruments signup, login, onboarding, mentorship-request, and professor outcome events. |
| `signals-scout-web-analytics` | This is a Next.js web application with public discovery, authentication, onboarding, and dashboard routes. |
| `signals-scout-health-checks` | Detects actionable PostHog instrumentation and configuration health issues. |

### Disabled (23)

| Scout or group | Reason |
|---|---|
| `signals-scout-error-tracking` | Covered by the enabled native Error Tracking sources. |
| `signals-scout-session-replay` | Covered by the enabled native Session Replay source. |
| `signals-scout-ai-observability` | The application uses an external AI telemetry package, but no PostHog LLM telemetry was confirmed. |
| `signals-scout-anomaly-detection` | No established dashboard or insight portfolio was found to monitor. |
| `signals-scout-apm` | No PostHog distributed tracing usage was found. |
| `signals-scout-conversations` | Support was just enabled and no inbound channel is connected yet. |
| `signals-scout-csp-violations` | No CSP reporting stream was found. |
| `signals-scout-customer-analytics` | No account/group analytics surface was found. |
| `signals-scout-data-pipelines` | No CDP, batch-export, or Hog-flow surface was found. |
| `signals-scout-data-warehouse` | No warehouse sources are connected. |
| `signals-scout-experiments` | No active experiment surface was found. |
| `signals-scout-feature-flags` | No active feature-flag usage was found. |
| `signals-scout-inbox-validation` | Fresh Self-driving setup has no shipped fixes to validate yet. |
| `signals-scout-insight-alerts` | No insight-alert portfolio was found. |
| `signals-scout-logs` | The PostHog logs product was not confirmed in use. |
| `signals-scout-mcp-tool-calls` | No project MCP telemetry surface was confirmed. |
| `signals-scout-observability-gaps` | The focused health-check scout is the tighter first-pass coverage for this new setup. |
| `signals-scout-replay-vision` | No scanner history existed before this run; the scanner analyst layer can be enabled after observations accumulate. |
| `signals-scout-revenue-analytics` | No payment SDK or revenue data source was found. |
| `signals-scout-skills-store` | No team skills-store management surface was identified. |
| `signals-scout-surveys` | No surveys exist currently. |
| `signals-scout-tasks` | No PostHog Tasks usage was identified. |
| `signals-scout-web-vitals` | Core Web Vitals capture was not confirmed. |

Any of these can be enabled later from the Self-driving inbox if the associated surface becomes active.

## Custom scouts

No custom scout was created. Two candidates were proposed—role-specific onboarding completion and mentorship-request outcome monitoring—but the explicit “None — keep the built-in troop” selection took precedence.

Surfaces ruled out during gap analysis: error and replay monitoring are covered by native sources; payment, PostHog LLM telemetry, surveys, warehouse sources, feature flags, experiments, CSP reporting, and active Support channels were not confirmed. If a future custom scout becomes noisy, set `emit: false` on its configuration in PostHog to change it to dry-run mode.

## Replay Vision scanners

A scanner is an LLM that watches individual session recordings on a schedule and pushes visible defects to the Self-driving inbox. These are the only components in this setup that spend Replay Vision quota. Findings have half weight and require independent corroboration before promotion to a report.

The organization has 2,500 Replay Vision credits remaining for the current period. Both estimates were 0 observations and 0 monthly credits because no matching recordings were present, so no quota confirmation was required.

| Brief | Scanner | Status | Scope | Sampling | Estimate |
|---|---|---|---|---:|---:|
| Breakage monitor | Mentorship request breakage | Created | Recordings on `/request/new`, the core request-submission completion flow | 50% | 0 observations/month; 0 credits/month |
| Frustration monitor | Mentorship request frustration | Created | Recordings with `$rageclick` only; no URL scope was added | 100% | 0 observations/month; 0 credits/month |

No recordings were observed during setup. Both scanners are armed and will begin scanning once recordings arrive.

## Follow-ups

- [ ] Connect an inbound Support channel (email, inbox, or Slack) in PostHog so the enabled Support ticket responder can receive conversations.
- [ ] Reauthorize the PostHog MCP connection with `property_definition:read` if schema-level event discovery is needed for future custom scout design.
- [ ] Consider enabling the Replay Vision analyst scout after scanner observations accumulate.

## Files created or modified

| Path | Change |
|---|---|
| `posthog-self-driving-report.md` | Created this setup report. |
| `.claude/skills/replay-vision-scanners-core/SKILL.md` | Installed shared scanner workflow. |
| `.claude/skills/replay-vision-scanner-broken-experiences/SKILL.md` | Installed breakage-monitor brief. |
| `.claude/skills/replay-vision-scanner-user-frustration/SKILL.md` | Installed frustration-monitor brief. |

No application source files or environment files were changed.

## What happens next

Fresh scout configurations are picked up by the coordinator within about 30 minutes and use the project’s daily run budget. Findings are clustered into reports in the Self-driving inbox; immediately actionable reports can begin coding tasks.
