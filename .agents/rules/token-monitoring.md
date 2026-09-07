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
