---
name: spike-scoping
description: Turn a raw ticket and context into a bounded spike investigation - specific questions to answer, a definition of done, a rough timebox, and what's explicitly out of scope. Use at the start of any new spike, before doing any investigation.
license: MIT
compatibility: opencode
metadata:
  stage: "1-scope"
---

## What I do

Turn a vague-ish ticket ("investigate X", "figure out why Y", "evaluate options for Z")
into a spike that can actually be executed and closed out. Most bad spikes fail because
nobody wrote down what question they were answering.

## When to use me

At the very start of a **new** spike, before touching code. Skip me if the user already
handed you a scoped set of questions, or if this is a revision of an existing spike doc
(use `spike-fix` instead).

## What I need from the conversation

Pull these out of the ticket + any context the user gave you. If something critical is
missing, ask **one** targeted question rather than guessing — but don't block on
nice-to-haves.

- **Trigger**: what prompted this spike? (bug, proposed feature, tech debt, incident
  follow-up, "we're not sure X is possible")
- **The actual question(s)**: rewrite the ticket as 2-5 concrete, answerable questions.
  "Investigate caching options" is not a question. "Can Redis handle our current write
  volume with <10ms p99 latency, and what would migration cost in engineer-days?" is.
- **Decision this unblocks**: what will someone do differently depending on the answer?
  If you can't name a decision, push back gently — it might not need a spike.
- **Constraints already known**: deadlines, budget, tech stack limits, things that are
  already decided and not up for debate.
- **Out of scope**: what looks related but isn't part of this spike. Be explicit — this
  is what keeps spikes from ballooning into redesigns.
- **Timebox**: if not given, propose one based on the size of the questions (a spike
  that can't be scoped to something like 0.5-3 days of investigation is probably two
  spikes).

## Output of this step

A short scope block (this becomes the top of the spike doc in `spike-writeup`):

```
## Spike: <short title>

**Ticket**: <link/id if given>
**Timebox**: <e.g. 2 days>

### Questions to answer
1. ...
2. ...

### Decision this unblocks
...

### Out of scope
- ...
```

Confirm this scope with the user in one short message before moving into
`spike-investigation` if the ticket was ambiguous or you had to make judgment calls.
Don't ask for confirmation on straightforward, well-specified tickets — just proceed.
