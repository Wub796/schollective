---
name: handoff
description: Generate a self-contained handoff prompt (Continuation Brief) for continuing this conversation in a fresh context with zero loss of quality.
---

# Handoff Skill

Use this skill whenever generating a Continuation Brief or handoff prompt for a fresh LLM context (e.g., when the token monitoring audit reaches `>85%`, upon completing major milestones, or when the user invokes `/handoff` or asks to hand off the session).

## Objectives & Principles
Create a comprehensive but context-efficient HANDOFF PROMPT that can be copied verbatim into a brand-new Claude/LLM chat so it can continue the relevant work with minimal loss of quality.

The goal is **NOT** to summarize the conversation for a human reader.
The goal is to reconstruct the minimum sufficient working context for a fresh, capable model that has never seen this conversation.

Produce a self-contained prompt that:
1. States the objective / what we are trying to accomplish.
2. Includes all materially relevant facts, requirements, constraints, preferences, definitions, environment details, and assumptions established so far.
3. Captures important decisions already made, including WHY when the rationale matters for future choices.
4. Captures approaches already attempted and their results, especially failures or dead ends that should not be repeated.
5. Preserves important nuances, caveats, exceptions, terminology, and distinctions that could otherwise be lost in summarization.
6. Describes the current state of the work precisely:
   - What is complete
   - What is partially complete
   - What remains unresolved
   - What the immediate next steps are
7. Includes relevant artifacts such as filenames, commands, APIs, schemas, architecture, code conventions, examples, or snippets when necessary for continuation.
8. Separates confirmed facts from hypotheses, tentative ideas, and unresolved questions.
9. Removes conversational noise, repetition, obsolete branches, pleasantries, and details that no longer affect future work.
10. Does NOT assume access to this chat, hidden context, previous messages, or unstated knowledge.
11. Does NOT tell the next model to "refer to the previous conversation." Everything needed must be present in the handoff itself.
12. Preserves user intent and preferences that affect how the work should be done, not merely what the work is about.
13. Avoids excessive compression. Prefer losing some brevity over losing a detail that could cause the fresh model to make a wrong assumption or redo work.
14. At the same time, aggressively omit information that has no expected effect on future reasoning or execution.

## Canonical Output Structure

```markdown
# Continuation Brief

## Role / Operating Context
[Only if relevant.]

## Objective
[What the user ultimately wants.]

## Current State
[Where things stand right now.]

## Relevant Context & Architecture
[Dense but complete factual/contextual information.]

## Requirements & Environment Constraints
[Hard requirements, preferences, boundaries, environment constraints.]

## Decisions Already Made & Failed Attempts (Do Not Repeat)
[Decision + rationale where useful, plus dead ends.]

## Key Files & Paths
[Code, paths, commands, schemas, examples, exact wording, etc., only when needed.]

## Next Steps
[Concrete continuation point, ordered if useful.]

## Instructions to the New Chat
Continue from the state above rather than restarting the analysis.
Do not re-ask questions already answered in this brief.
Do not redo completed work unless there is a specific reason to revisit it.
Treat explicit requirements and settled decisions above as authoritative.
When information is marked uncertain, verify or reason about it rather than silently treating it as fact.
```

## Final Output Rules
- Output ONLY the finished handoff prompt.
- Do not preface it with commentary about what was summarized.
- Do not include meta-commentary about token limits or this command.
- It must be directly copy/pasteable as the first message of a fresh chat.
- Optimize for continuation quality per token, not raw brevity.
