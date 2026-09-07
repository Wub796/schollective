---
name: token-monitoring
description: >-
  Monitors token context load, estimates conversation turn weight against a 25k target, and audits context saturation. Use when evaluating prompt length, token burn against 5-hour limits, or appending run metrics.
---

# Token Monitoring & Audit Skill

This skill provides calibrated token tracking, context load auditing, and run metrics estimation for conversation turns in Antigravity.

## Token Estimation Standard
- **System & Tool Baseline**: Fixed ~8.5k tokens (Agent persona, tool schemas, system rules, and workspace metadata).
- **Conversational Text**: ~4.0 characters per token (prose English).
- **Code, Payloads & Logs**: ~3.2 characters per token (dense syntax, JSON, ASTs, indents, and tool outputs).
- **Session Target Ceiling**: 25,000 tokens. This represents the optimal threshold before re-reading past history on every message starts draining the 5-hour rolling limit excessively.

## Status Tiers
- **Safe (<60%, <15k tokens)**: Lean, fast response time, low quota burn per message.
- **Getting Full (60%–85%, 15k–21k tokens)**: Active multi-step working state.
- **Refresh Recommended (>85%, >21k tokens)**: Context window is getting congested; every new message burns significant 5-hour quota. Recommend starting a fresh chat.

## Run Metrics Footer Format

Append a non-intrusive footer formatted exactly as follows at the conclusion of every response:

```markdown
---
**Run Metrics (Estimated)**
* Current Chat Load: ~[X]k tokens ([P]% of 25k target)
* Turn Output: ~[Y] tokens
* Status: [Safe (<60%) | Getting Full (60-85%) | Refresh Recommended (>85%)]
* Context Alert: [If >85%: "⚠️ Chat is getting long. Recommend starting a fresh chat to save your 5-hour limit." Else: "None"]
---
```

## Step-by-Step Procedure
1. Baseline is fixed at ~8.5k tokens.
2. Sum characters of conversation turns and tool payloads, dividing by 3.2 for code/tools and 4.0 for text.
3. Calculate current load in thousands (e.g. `~15.2k`).
4. Compute percentage of the 25k target: `(Current / 25,000) * 100%`.
5. Measure the current response length divided by 3.5 to determine `Turn Output`.
6. Set Status based on percentage thresholds (`<60%`, `60-85%`, `>85%`).
7. If `>85%`, trigger the Context Alert advising a new chat session to preserve the 5-hour limit.
