---
name: doc-investigation
description: Core workflow for gathering ground truth from a codebase or system before writing technical documentation - finding entry points, tracing data and control flow, mapping components and services, external dependencies, data models, configuration, and failure modes, with evidence for every claim. Use after scoping, before writing the document.
license: MIT
compatibility: opencode
metadata:
  stage: "2-investigation"
---

# Skill: doc-investigation

## What I do

Extract how the system **actually** works from the code and its runtime, and collect the
evidence that will back every statement in the document. Documentation is only as good as
the investigation behind it; this step is where accuracy is won or lost.

## When to use me

After `doc-scoping`, before writing prose. Also whenever a claim in a draft needs to be
confirmed against the real code rather than assumed.

## Evidence discipline (non-negotiable)

- Every fact you intend to document must trace to something concrete: a file you read, a
  command you ran, output you saw. Record the `path:line` as you go.
- Tag each finding **verified** (read/ran it), **inferred** (reasoned from evidence), or
  **unknown**. Carry these tags through to the write-up.
- Do not document from a single grep hit. Confirm by reading the surrounding code and, if
  cheap, by running it.
- When behaviour cannot be confirmed in reasonable time, record it as an open question,
  not a guess.

## What to gather

Adapt to the document type from `doc-scoping`, but for a system/service/process aim to
answer:

1. **Boundaries and entry points.** What are the ways in? HTTP routes, CLI commands, event
   consumers, scheduled/cron jobs, message handlers. Where does execution start?
2. **Components and responsibilities.** The real modules/services and what each owns. Name
   them; avoid generic boxes.
3. **Control and data flow.** Trace a representative path end to end: request in, what
   calls what, what transforms the data, what comes out. Note synchronous vs asynchronous
   hops and where state is written.
4. **Interfaces and contracts.** Request/response shapes, event schemas, function
   signatures at the seams, error/failure responses. What callers can rely on.
5. **Data model and persistence.** Tables/collections, key fields, important relationships
   and states, where the source of truth lives.
6. **External dependencies.** Other services, third parties, queues, caches, and how they
   are reached (base URLs, clients, config keys).
7. **Configuration and deployment.** Env vars, feature flags, config files, how the thing
   runs and where.
8. **Failure modes and edge cases.** Timeouts, retries, race conditions, void/rollback
   paths, degraded/fallback behaviour. The parts that bite in production.

## How to work efficiently

- Use the `explore` subagent (and parallel tool calls) to map large or multi-repo
  codebases fast, then read the specific files yourself to confirm the details you will
  document.
- Follow the code, not the naming: verify that a thing named `is_kibble_only` actually does
  what it says by reading it.
- Keep running notes structured by the sections the document will need (see `doc-writeup`),
  so the write-up is assembly rather than re-discovery.

## Output of this step

Structured investigation notes: per-area findings, each with its `path:line` evidence and a
verified/inferred/unknown tag, plus a running list of open questions. These feed directly
into `doc-writeup`.
