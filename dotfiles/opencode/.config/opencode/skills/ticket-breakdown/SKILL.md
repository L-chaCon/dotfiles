---
name: ticket-breakdown
description: Decompose extracted work into a set of Jira tickets of the correct type (Spike, Story, Task) and correct size, enforcing the two-week Story rule, and order them by dependency. Use after intake, before writing the ticket text.
license: MIT
compatibility: opencode
metadata:
  stage: "2-breakdown"
---

# Skill: ticket-breakdown

## What I do

Turn the raw work from `ticket-intake` into a clean set of tickets: each one the right type,
the right size, and placed correctly in the dependency order. This is where most of the
value is; a well-broken-down set is easy to write and easy to work.

## When to use me

After `ticket-intake`, before `ticket-writing`.

## Choosing the type

Decide per work item:

- **Spike** if the item is to *learn or decide*, not to build. Signals: the source lists it
  as an open question, an unresolved decision, a risk to quantify ("run the mirror query"),
  or "investigate whether...". A Spike's output is knowledge, not shipped behaviour.
- **Story** if it delivers observable value or a coherent slice of behaviour and fits in two
  weeks. Signals: a user/operator can see or use the result; it has natural acceptance
  criteria in terms of behaviour.
- **Task** if it is an isolated, self-contained piece of work that does not by itself form a
  user-facing slice. Signals: a config change, a migration, an enabling refactor, a
  follow-up chore from a Spike.

When Story vs Task is genuinely ambiguous, prefer Story if it carries user-visible value and
ask if still unsure (see `ticket-intake`).

## Right-sizing (the two-week rule)

A Story must be completable within one sprint (two weeks or less). If it is not:

- **Split by vertical slice** where possible: each resulting Story still delivers a usable
  increment (e.g. "toggle for a single machine" then "multi-machine and mutual-exclusion"),
  rather than horizontal layers that deliver nothing alone.
- If a slice needs enabling groundwork that has no standalone value, pull that out as a
  **Task** the Story depends on, rather than bloating the Story.
- Keep Stories focused on one outcome. A Story that reads as "and also" is usually two.

Do not pad the other way: trivially small, tightly-coupled steps can live as acceptance
criteria within one ticket rather than as separate tickets.

## Sub-tasks: split for concurrency, not for size

Sub-tasks under a Story exist to expose **work that can be done concurrently**, not to slice
one linear job into numbered steps. The two-week rule is a ceiling on Story size, not the
reason to create sub-tasks.

Decision rule: only break a Story into sub-tasks when the pieces are genuinely parallel, that
is either

- neither piece has to wait for the other to start, or
- they meet at a **pre-agreed interface** (e.g. an API contract or data shape) so each side
  can be built against a stub at the same time.

If the work is an ordered chain (do A, then B, then C), mostly one person on one component,
it is **one ticket with no sub-tasks**. Those steps become acceptance criteria, not
sub-tasks. Tests are part of the same work, never a standalone sub-task.

A quick tell: if the sub-tasks read as "1st, 2nd, 3rd", they are sequential and should
collapse into a single ticket. If they read as independent lanes different people could pick
up at once, they are real sub-tasks.

Concurrency lives mostly across the ticket set (independent tickets on different services),
not inside a single Story. Prefer surfacing that in the dependency map (below) over
manufacturing sub-tasks.

## Ordering and dependencies

- Sequence tickets so each can start when its dependencies are done. Make blockers explicit
  ("blocked by <ticket>", "depends on the Q4 decision").
- Put decision Spikes that gate other work first, and mark the dependent tickets as
  conditional on the outcome.
- If the source implies an incremental delivery strategy, preserve that order.
- Call out the parallel lanes: which tickets can be started at the same time. A short
  dependency map / index makes the concurrency visible to the team.

## Output of this step

A proposed ticket list, each entry with: working title, type, one-line intent, rough size
(and a split note if it was too big), and its dependencies. Present this list for a quick
confirmation before writing full tickets, then hand off to `ticket-writing`.
