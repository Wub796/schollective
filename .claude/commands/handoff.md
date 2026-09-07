---
description: Generate a self-contained handoff prompt for continuing this conversation in a fresh context
argument-hint: "[topic or scope; defaults to the relevant conversation as a whole]"
---

Create a comprehensive but context-efficient HANDOFF PROMPT that I can copy
verbatim into a brand-new Claude/LLM chat so it can continue the relevant work
with minimal loss of quality.

SCOPE:
$ARGUMENTS

If SCOPE is empty, interpret it as:
"the relevant conversation/current work as a whole."

If SCOPE is non-empty, focus specifically on that topic, while retaining any
other context that is materially necessary to continue it correctly.

The goal is NOT to summarize the conversation for a human reader.
The goal is to reconstruct the minimum sufficient working context for a fresh,
capable model that has never seen this conversation.

Produce a self-contained prompt that:

1. States the objective / what we are trying to accomplish.
2. Includes all materially relevant facts, requirements, constraints, preferences,
   definitions, environment details, and assumptions established so far.
3. Captures important decisions already made, including WHY when the rationale
   matters for future choices.
4. Captures approaches already attempted and their results, especially failures
   or dead ends that should not be repeated.
5. Preserves important nuances, caveats, exceptions, terminology, and distinctions
   that could otherwise be lost in summarization.
6. Describes the current state of the work precisely:
   - what is complete
   - what is partially complete
   - what remains unresolved
   - what the immediate next steps are
7. Includes relevant artifacts such as filenames, commands, APIs, schemas,
   architecture, code conventions, examples, or snippets when necessary for
   continuation.
8. Separates confirmed facts from hypotheses, tentative ideas, and unresolved
   questions.
9. Removes conversational noise, repetition, obsolete branches, pleasantries,
   and details that no longer affect future work.
10. Does NOT assume access to this chat, hidden context, previous messages,
    or unstated knowledge.
11. Does NOT tell the next model to "refer to the previous conversation."
    Everything needed must be present in the handoff itself.
12. Preserves user intent and preferences that affect how the work should be done,
    not merely what the work is about.
13. Avoids excessive compression. Prefer losing some brevity over losing a detail
    that could cause the fresh model to make a wrong assumption or redo work.
14. At the same time, aggressively omit information that has no expected effect
    on future reasoning or execution.

Use this structure where applicable:

# Continuation Brief

## Role / Operating Context
[Only if relevant.]

## Objective
[What the user ultimately wants.]

## Current State
[Where things stand right now.]

## Relevant Context
[Dense but complete factual/contextual information.]

## Requirements & Constraints
[Hard requirements, preferences, boundaries, environment constraints.]

## Decisions Already Made
[Decision + rationale where useful.]

## Work Already Done
[Important implementation/research/work completed.]

## Attempts That Failed or Were Rejected
[What not to repeat and why.]

## Open Questions / Uncertainties
[Clearly distinguish unresolved items from settled facts.]

## Next Steps
[Concrete continuation point, ordered if useful.]

## Important Reference Material
[Code, paths, commands, schemas, examples, exact wording, etc., only when needed.]

## Instructions to the New Chat
Continue from the state above rather than restarting the analysis.
Do not re-ask questions already answered in this brief.
Do not redo completed work unless there is a specific reason to revisit it.
Treat explicit requirements and settled decisions above as authoritative.
When information is marked uncertain, verify or reason about it rather than
silently treating it as fact.

FINAL OUTPUT RULES:

- Output ONLY the finished handoff prompt.
- Do not preface it with commentary about what you summarized.
- Do not include meta-commentary about token limits or this command.
- It must be directly copy/pasteable as the first message of a fresh chat.
- Optimize for continuation quality per token, not raw brevity.
