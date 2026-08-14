---
name: spike-fix
description: Resume and revise an already-drafted spike document in response to feedback, review comments, new information, or unresolved/incorrect findings - without redoing the whole investigation from scratch. Use whenever a spike document already exists and needs correction or extension rather than a fresh spike.
license: MIT
compatibility: opencode
metadata:
  stage: "4-fix"
---

## What I do

Handle the very common real-world case: a spike doc already exists (draft, reviewed, or
even "final") and now needs to change — because a reviewer pushed back, new information
came in, an earlier finding turns out to be wrong, or a question was left unanswered.

## When to use me

- The user points you at an existing spike doc and says something like "this is wrong
  about X", "can you also check Y", "reviewer asked about Z", "this got stale, can you
  update it".
- You (the agent) discover a spike doc already exists for this ticket during intake.

Do not use `spike-scoping` to restart from zero in this case — that throws away good
work and re-litigates things nobody's questioning.

## How to use me

1. **Read the existing doc fully first.** Understand what was already answered, at what
   confidence level, and what was already flagged as an open question/risk. Don't
   re-investigate things that are already solid — that wastes the point of fixing
   instead of redoing.

2. **Isolate exactly what changed.** Get specific about the trigger:
   - Reviewer/PM feedback → find the specific comments or questions. If the user
     summarized feedback loosely, ask them to paste the actual comments if there's any
     ambiguity about what's being asked.
   - New information (a library shipped a fix, a benchmark was run elsewhere, a
     constraint changed) → note exactly what's new and which existing finding it
     affects.
   - A finding turns out to be wrong → figure out *why* it was wrong (bad assumption,
     stale info, investigation was too shallow) before just swapping in a new answer —
     that context is worth a line in the doc.
   - An open question needs closing → this is a normal `spike-investigation`-style task
     scoped to just that one question.

3. **Re-investigate only the affected questions**, using the same approach as
   `spike-investigation` (read, check history, prototype, research — cheapest technique
   that produces real evidence). Leave verified findings that aren't in question alone.

4. **Update the doc surgically, not wholesale:**
   - Update the specific option(s) or question(s) affected, along with the evidence and
     confidence level behind them.
   - Update **Decision** if the changed findings affect it — and say plainly if the
     decision flipped and why.
   - Add a short "Revision notes" line just under the title stating what changed and
     why (e.g. "Revised 2026-08-04: re-checked Q2 after reviewer flagged stale
     benchmark; Redis p99 latency updated from 8ms to 14ms under current load, see
     evidence below — decision unchanged.").
   - Update **Consequences** in the Abstract if the revision changes what work is now
     needed outside the team.
   - Do not silently rewrite sections that weren't questioned — reviewers lose trust in
     a doc that changes underneath them without explanation.

5. **Confirm scope before diving in if the ask is ambiguous.** "Can you fix the spike"
   with no specifics is worth one clarifying question about what's wrong or what
   changed, rather than guessing and re-investigating everything.

## Output of this step

The same spike doc, edited in place, with a clear record of what changed and why. Report
back in chat: what was revised, whether the recommendation changed, and what's still
open.
