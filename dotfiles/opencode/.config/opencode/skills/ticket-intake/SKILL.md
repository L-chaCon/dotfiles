---
name: ticket-intake
description: Read a spike document or brief and extract the work to be ticketed, then identify and ask about anything missing before writing Jira tickets - scope, sizing basis, ownership, priority, dependencies, and unresolved product decisions. Use at the start of any ticket-creation task, before breaking work down.
license: MIT
compatibility: opencode
metadata:
  stage: "1-intake"
---

# Skill: ticket-intake

## What I do

Read the source of intent fully, pull out the concrete work it implies, and surface the
gaps that must be closed before good tickets can be written. Most bad ticket sets come from
writing tickets before understanding the source or before asking the one question that
changes the whole breakdown.

## When to use me

At the start of any ticket-creation task, before `ticket-breakdown`.

## Read the source properly

If the source is a spike document, read the whole thing, not just the decision. Extract:

- **The decision / recommendation**: usually the backbone of the ticket set.
- **Handoffs / next steps**: often map one-to-one to tickets.
- **Acceptance criteria already stated** (spikes often reference the originating ticket's
  tasks): reuse them, do not reinvent.
- **Open questions and risks**: these frequently become their own Spikes, or become explicit
  acceptance criteria / caveats on Stories.
- **Effort estimate and affected systems**: an early signal of how many tickets and of what
  size, and where dependencies lie.

If the source is a looser brief, extract the same shapes: goal, deliverables, constraints,
unknowns.

## What to confirm before writing

Ask about anything below that the source does not answer and that would change the tickets.
Ask targeted questions, batched so the user answers once. Do not block on things that do not
affect the output.

- **Unresolved product/technical decisions.** If the source leaves a decision open (e.g. a
  choice between two designs), that changes what gets built. Confirm the decision, or agree
  to raise it as a Spike / decision ticket and write the downstream tickets as conditional.
- **Sizing basis.** The two-week Story rule depends on the team. If team size/velocity or
  what fits a sprint is unclear and the work is chunky, ask, or state the assumption you are
  sizing against.
- **Granularity preference.** Fewer larger tickets or more smaller ones? Whether they want an
  Epic/parent to group them.
- **Metadata the instance expects.** Priority, components/labels, target sprint/release,
  assignee or team, and whether acceptance criteria should be checklist or Given/When/Then.
- **Output format.** Markdown (default) vs Jira wiki markup; save to a file or chat only.

## Output of this step

A short intake summary: the extracted work items (raw, not yet typed or sized), the answers
gathered, and any assumptions you are proceeding on. This feeds `ticket-breakdown`.
