---
name: archive-docs
description: Archive AI-generated project docs (plans, designs, specs) into the personal ai_docs library as LLM-optimized entries with the originals preserved. Use only when the user explicitly runs /skill:archive-docs.
disable-model-invocation: true
---

# archive-docs

Store the documents the user just finished into the ai_docs library so a future LLM can explain *why* things were built the way they were. The library is the git repo at `~/.ai_docs` (override with `AI_DOCS_DIR`); `scripts/project_info.py` prints its absolute path as `library`. This skill lives outside the library, so write library files using that path.

Arguments after the command are the docs to archive: files, directories, or globs, relative to the current working directory. If none are given, use `docs/` in the current repo. Archive one project per run.

## Steps

1. **Collect facts.** Run `python3 scripts/project_info.py <source repo dir>`. It prints the library path, project slug, whether the project exists, its existing entries, and the source repo's remote, branch, commit, and dirty state.
2. **Read the sources.** Read every file being archived in full. If the set is empty or ambiguous, ask the user which files to use before writing anything.
3. **New entry or update?** Read the `ENTRY.md` of each existing entry in the project. If one covers the same topic (same subject, or `source.paths` overlapping the files being archived), **update it**. If more than one could match, or it's unclear, ask the user. Otherwise create a new entry with a short kebab-case topic slug (e.g. `auth-token-refresh`, not `docs` or `plan-v2`).
4. **Project file.** If `projects/<slug>/PROJECT.md` is missing, create it from `references/project-template.md`. Infer `context` (work/personal) from the remote owner and contents; ask if unsure. If it exists, update `status`, `stack`, and "Architecture at a glance" when the new docs change them.
5. **Copy originals.** Copy the source files into `projects/<slug>/entries/<topic>/sources/`, keeping their paths relative to the docs root (e.g. `docs/api/design.md` → `sources/api/design.md`). On update, overwrite changed files, add new ones, and delete files whose originals the user removed only if the user confirms. Copy images and diagrams too. Never edit the copies.
6. **Write ENTRY.md.** Follow `references/entry-template.md` exactly: same frontmatter keys and section order. On update, see "Updating" below.
7. **Sync the project's entry list.** Make sure the `## Entries` list in `PROJECT.md` has one line for this entry with its current type, status, and summary.
8. **Rebuild the index.** Run `python3 scripts/build_index.py`. Fix any reported errors and run it again until it's clean.
9. **Report.** List the files created or changed, say whether this was a new entry or an update (and what changed), and mention a dirty source repo if `dirty: yes` (the archived docs may not match the recorded commit). Do **not** `git add`, commit, or push; the user handles git.

## Writing ENTRY.md

The reader is an LLM that has never seen the project and needs to explain or reimplement the decisions. Optimize for that reader:

- **Distill, don't paraphrase.** Pull out decisions, reasons, rejected alternatives, constraints, and open questions. Leave out narrative, pleasantries, and anything the reader can get from `sources/`.
- **Each decision stands alone.** It names the thing it's about, so a grep hit on that block makes sense without the rest of the file.
- **Be concrete.** Use exact names of services, files, libraries, versions, numbers, and dates. Write "Postgres 16 via RDS", not "a relational database".
- **Separate fact from inference.** If the sources don't state a reason and you're inferring one, write "(inferred)".
- **Tags** are lowercase, hyphenated, and cover both tech (`postgres`, `react-query`) and domain (`billing`, `auth`), so similar work in other projects shows up in a search.
- **Write in English**, even if the sources are in another language, so searches across the library work consistently. Originals stay as they are.
- The whole file should usually fit in 150 lines. Longer content belongs in `sources/`.

## Updating an existing entry

- Set `updated` to today. Keep `created`. Refresh `source.commit`, `source.branch`, and `source.paths`.
- **Decisions are append-only.** If a decision changed, set the old one to `**Status:** superseded on <date> by D<n> — <reason>` and add the new decision with the next number. Edit a decision in place only to fix a factual error.
- Rewrite Context, Constraints, Implementation notes, and Open questions so they describe the current state. Remove open questions that are now resolved and record how they were resolved in the Changelog.
- Add a Changelog line: date, which sources changed, which decisions were added or superseded, and the new commit.
- Update `status` and `summary` if they no longer hold.
