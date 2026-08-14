---
name: doc-scoping
description: Turn a vague documentation request ("document X", "write up how Y works", "we need docs for Z") into a bounded documentation task with a clear subject, audience, depth, format, location, and out-of-scope list. Use at the very start of a new documentation job, before exploring code or writing anything.
license: MIT
compatibility: opencode
metadata:
  stage: "1-scoping"
---

# Skill: doc-scoping

## What I do

Turn a loose "document this" request into a documentation task that can actually be
executed and finished. Most weak documentation fails because nobody decided what it was
for, who it was for, or where it stopped.

## When to use me

At the very start of a **new** documentation task, before touching code. Skip me if the
subject, audience, and depth are already pinned down, or if this is a revision of an
existing document (go straight to `doc-investigation` / `doc-writeup`).

## What I need from the conversation

Pull these out of the request plus any context. If something critical is missing, ask
**one** targeted question rather than guessing; do not block on nice-to-haves.

- **Subject and boundaries**: what exactly is being documented? One service, a cross-
  service workflow, a subsystem, a process, an API? Name the repos/paths in scope.
- **Audience and assumed knowledge**: who reads this? A new joiner, an on-call engineer,
  another team integrating with it, a mixed technical/product audience? What can they be
  assumed to already know? This sets vocabulary and depth.
- **Purpose / document type**: what will the reader *do* with it? Common shapes:
  - Architecture reference (how it fits together, why).
  - How-it-works / mechanism deep-dive (data and control flow).
  - Onboarding guide (get productive fast).
  - Runbook / operational guide (diagnose and act).
  - Integration / API reference (contracts, request/response, errors).
  - Process documentation (an end-to-end business/technical flow across systems).
- **Depth**: overview vs. exhaustive. Be explicit, this is the main scope lever.
- **Format and location**: single markdown file, a set of files, a diagram-heavy doc?
  Where does it live (check for an existing `docs/` or `documentation/` convention)?
- **Out of scope**: what looks related but is not part of this document. This is what
  keeps a doc from turning into "document the entire platform".

## Output of this step

A short scope block (this becomes the top of the doc, or its planning note):

```
## Documentation scope: <subject>

**Type**: <architecture reference | how-it-works | onboarding | runbook | API | process>
**Audience**: <who, and what they already know>
**Depth**: <overview | detailed | exhaustive>
**Location/format**: <path(s), single vs multi-file>

### In scope
- ...

### Out of scope
- ...

### Sources to investigate
- <repos, services, paths, systems to explore in doc-investigation>
```

Confirm this scope in one short message if the request was ambiguous or you had to make
judgment calls. For a well-specified request, just proceed to `doc-investigation`.
