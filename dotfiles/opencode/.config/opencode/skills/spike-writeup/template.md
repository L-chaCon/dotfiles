# Spike: <short title>

## Abstract

### Context
1 sentence: why this spike exists and what triggered it. Assume the reader hasn't
seen the ticket.

### Outcome
1 sentence: the result of this spike — what was learned or decided.

### Consequences
1 sentence: any extra work this creates outside the team (e.g. another team needs to
change something, a dependency needs upgrading, ops needs to provision something).
If none, say "None."

## Current state
A detailed description of how the system works today, focused on the parts relevant
to the questions below. Assume the reader knows the codebase in general but not this
specific area — name the relevant files, services, or components explicitly. Reference
code as permalinks whose link text is the function/class name (e.g.
`[for_adamm](https://github.com/<org>/<repo>/blob/<sha>/<path>#L352-L478)`), built with
this skill's `scripts/permalink.sh` and pinned to a commit SHA.

## Questions
1-3 sentences briefly explaining what's being asked and the context needed to
understand the questions below.

1. ...
2. ...

1-3 sentences on why answering these questions matters — what decision depends on
the answer, and what happens if they're left unanswered.

## Possible solutions

Write this section impersonally — it answers the questions above on the evidence, not the
person who raised them.

### Options considered

If the spike compared approaches, give each one a short prose write-up covering: how it
actually works (naming real files/services), why it's on the table (which question it
addresses), and why it does or doesn't hold up (trade-offs, second-order effects, failure
modes found during investigation). A table can summarise at a glance, but it does not
replace the reasoning — and state explicitly how the options relate (mutually exclusive,
additive, or a fallback chain) so the Decision follows from the analysis.

#### Option A — <name>
How it works, why it's considered, trade-offs found, confidence (**verified** /
**inferred** / **unknown**) + evidence.

#### Option B — <name>
...

Summary (optional, as an aid — not a substitute for the prose above):

| Option | How it works | Pros | Cons | Rough effort |
| --- | --- | --- | --- | --- |
| ... | ... | ... | ... | ... |

## Decision
The single clearest next step. If the honest answer is "we need another spike on X"
or "we need a decision from someone else first," say that plainly instead of
forcing a recommendation.

### Risks & open questions
Anything unresolved, anything that could invalidate these findings later (e.g.
"checked against v2.3, may change in v3"), and anything that needs follow-up.

### Effort estimate (if in scope)
A rough order-of-magnitude estimate for the recommended path, clearly labeled as
spike-level (not a committed estimate): S / M / L or engineer-days, with the
biggest sources of uncertainty called out.

## References
Links to external documentation, RFCs, prior spikes, or discussions referenced
above. For code, use permalinks whose text is the file or symbol name (not bare paths).
