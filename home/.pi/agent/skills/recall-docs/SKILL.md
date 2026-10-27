---
name: recall-docs
description: Search the user's personal ai_docs library of past project decisions, designs, and plans. Use when starting or planning work that may resemble a past project, when asked why something was built a certain way, or when the user asks to find prior work, earlier decisions, or similar projects.
---

# recall-docs

Search the ai_docs library for past work related to the current task and explain what was decided and why. The library root is `~/.ai_docs` (or `$AI_DOCS_DIR` if set).

The library is read-only from this skill. Never edit it; archiving is done by `archive-docs`.

## Layout

- `INDEX.md`: one row per project and per entry (updated, project, topic, type, status, tags, summary). Read this first.
- `projects/<project>/PROJECT.md`: what the project is, its stack, and the list of its entries.
- `projects/<project>/entries/<topic>/ENTRY.md`: distilled context, numbered decisions (choice, why, alternatives rejected), constraints, open questions, changelog.
- `projects/<project>/entries/<topic>/sources/`: the original documents. Open them only when ENTRY.md lacks the detail you need.

## Search

1. Read `INDEX.md` in full. It's built to be small enough for that.
2. Derive search terms from the task: tech names, domain words, synonyms (e.g. `auth`, `login`, `oauth`, `token`). Search the entries:
   ```bash
   rg -i -l -e 'term1' -e 'term2' <library>/projects --glob 'ENTRY.md'
   rg -i -n -C3 -e 'term1' <library>/projects --glob 'ENTRY.md'
   ```
   Search `sources/` only if the ENTRY.md files don't find anything or don't give enough detail.
3. Read the matching `ENTRY.md` files, plus `PROJECT.md` for context. Follow `related:` links when they're relevant.

## Answer

- Cite every claim with its path, e.g. `projects/foo/entries/bar/ENTRY.md` D2.
- Report each relevant decision with its reasoning and rejected alternatives. Point out when a decision is superseded, or when the entry is `abandoned`/`superseded`, so old choices aren't presented as current.
- Say how the past situation differs from the current task (stack, constraints, scale) before recommending you reuse a decision.
- Report "(inferred)" markers and open questions as uncertainty. Don't present them as fact.
- If nothing relevant is found, say so in one line and list the terms you searched for.
