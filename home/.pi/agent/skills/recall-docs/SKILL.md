---
name: recall-docs
description: Search the user's personal ai_docs library of past project decisions, designs, plans, and learning notes. Use when starting or planning work that may resemble a past project, when asked why something was built a certain way, when the user asks to find prior work, earlier decisions, or similar projects, or when the user wants to recap or review something they studied or learned before.
---

# recall-docs

Search the ai_docs library for past work related to the current task and explain what was decided and why, or, for learning notes, recap what the user learned. The library root is `~/.ai_docs` (or `$AI_DOCS_DIR` if set).

First decide which mode the request is:

- **Decisions mode:** the user is building or planning something, or asks why something was done. Answer as described in "Answer".
- **Recap mode:** the user wants to review, recap, or refresh something they learned or studied (e.g. "I was learning about trees, recap this"). Answer as described in "Recap".

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
4. In recap mode, prefer learning material: entries with `type: learning`, or tags such as `learning`, `learning-guide`, `study-notes`, `notes`. Learning content can also sit inside project entries (e.g. a study guide in a runbook), so don't skip non-learning entries that match the topic. Expand search terms with the topic's vocabulary (e.g. trees: `tree`, `binary-tree`, `bst`, `traversal`, `dfs`, `bfs`, `heap`, `trie`, `avl`, `red-black`) and watch for false hits from other meanings (e.g. `treesitter`, file tree, git tree). Study notes are often long, so read `sources/` when ENTRY.md only summarizes them.

## Answer

- Cite every claim with its path, e.g. `projects/foo/entries/bar/ENTRY.md` D2.
- Report each relevant decision with its reasoning and rejected alternatives. Point out when a decision is superseded, or when the entry is `abandoned`/`superseded`, so old choices aren't presented as current.
- Say how the past situation differs from the current task (stack, constraints, scale) before recommending you reuse a decision.
- Report "(inferred)" markers and open questions as uncertainty. Don't present them as fact.
- If nothing relevant is found, say so in one line and list the terms you searched for.

## Recap

Use this instead of "Answer" in recap mode. The goal is to help the user remember and understand, not to report decisions.

- Start with a short summary of what the user covered on the topic, and when (`created`/`updated`).
- Then the key concepts, in the order they build on each other, each explained in a few plain sentences, with the examples, code, or commands from the notes.
- Point out what the notes marked as confusing, mistakes the user made, and open questions or "next steps" they left, so they know where they stopped.
- Cite the source path for each part, e.g. `projects/foo/entries/bar/ENTRY.md` or `.../sources/notes.md`.
- Keep what the notes say apart from your own additions. If you fill a gap or fix an error in the notes, label it "(not in notes)" or "(correction)".
- End by offering 3–5 quick self-check questions on the material. Don't give the answers unless asked.
- If no notes on the topic are found, say so in one line, list the terms searched, and offer a general recap clearly labeled as not coming from the user's notes.
