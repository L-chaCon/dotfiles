---
name: spike-investigation
description: Core workflow for investigating a scoped spike - exploring the codebase, prototyping options, running experiments, and gathering evidence to answer the spike's questions with real confidence rather than guesses. Use after scoping, before writing the report.
license: MIT
compatibility: opencode
metadata:
  stage: "2-investigate"
---

## What I do

Answer the scoped questions with evidence, using the lightest-weight investigation that
actually settles the question. This is the "do the work" step between scoping and
writing up.

## When to use me

After a spike is scoped (questions are known). Not for open-ended exploration with no
question attached — send that back to `spike-scoping` first.

## Method

Work question by question. For each question, pick the cheapest technique that produces
real evidence:

1. **Read first.** Search the codebase, read the relevant modules, check existing tests,
   check config/infra files, check docs and READMEs. A lot of spike questions are
   answerable this way alone. Cite specific files/functions/lines in your notes as you
   go — you'll need them for the write-up.
   - When a repo is a git checkout, capture what's needed to build a **permalink** later:
     the enclosing **function or class name** for the code you're citing, the file path,
     the line range, and the repo's pinned commit. Record the commit once per repo with
     `git -C <repo> rev-parse HEAD` (and the remote with `git -C <repo> remote get-url
     origin`). The write-up turns these into permalinks, so grabbing them now saves a
     second pass.

2. **Check history and prior art.** Look at git log/blame for related code, past PRs,
   past spike docs, ADRs, issue tracker discussion. Someone may have already answered
   this or tried and failed.

3. **Prototype small when reading isn't enough.** Write throwaway scripts, run things
   locally, hit a local/staging environment, run a benchmark, write a tiny
   proof-of-concept in a scratch file or branch. Keep it disposable and clearly labeled
   as a PoC. Don't build the real feature.

4. **Research externally when needed.** Use web search/fetch for library docs, known
   issues, benchmarks, vendor pricing, RFC/spec details. Prefer primary sources
   (official docs, changelogs, source code) over blog posts. Note version numbers —
   spike answers rot fast if you don't pin what you checked.

5. **Track evidence as you go**, not just conclusions. For every question keep a running
   note of:
   - What you did to investigate it
   - What you found (with file paths, commands run, benchmark numbers, links)
   - For code, the enclosing function/class name plus the repo's pinned commit SHA, so
     the write-up can render it as a permalink
   - Your confidence level: **verified** (you ran/read it directly), **inferred**
     (reasoned from adjacent evidence), or **unknown** (couldn't settle it in scope)

6. **Surface tradeoffs, not just one answer.** If there are multiple viable approaches,
   investigate enough of each to compare them fairly — don't just validate the first
   idea that came to mind and stop.

7. **Know when to stop.** Respect the timebox from scoping. If a question is still
   **unknown** when you hit the timebox, that's a valid spike outcome — write it up as
   an open question/risk rather than continuing to dig or guessing an answer.

## Guardrails

- Don't modify real application code beyond small, clearly-labeled PoC diffs needed to
  prove a point. The spike agent's permissions already restrict this — respect the
  spirit of it even where a specific edit would be technically allowed.
- Don't install new production dependencies to test something if there's a lighter way
  to check (read source, check docs, use a scratch project).
- If you find yourself building something that looks like the real implementation,
  stop — that's feature work, not a spike, and should be called out as such.

## Output of this step

A working notes doc (question → evidence → confidence level, per question) that feeds
directly into `spike-writeup`. You don't need to polish this — it's raw material.
