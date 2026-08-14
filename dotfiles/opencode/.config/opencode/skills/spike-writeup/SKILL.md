---
name: spike-writeup
description: Format and structure spike findings into a written report - context, questions, findings with confidence levels, options considered, a clear recommendation, risks, and effort estimate. Use to produce or update the final spike document once investigation is done.
license: MIT
compatibility: opencode
metadata:
  stage: "3-writeup"
---

## What I do

Turn investigation notes into the actual spike document — the thing a teammate reads to
make a decision without redoing your work.

## When to use me

After `spike-investigation` has produced findings, or when the user just wants an
existing pile of notes turned into a proper spike doc.

## Voice and audience (read first)

A spike is a standalone investigation record for whoever picks up the work later, not a
reply to the person who requested it. Write it that way:

- **No em dashes.** Never use the "—" character. Use a comma, colon, parentheses, or a
  plain hyphen "-" instead. This applies to the document and any chat summary.
- **Third person, impersonal.** No "you", no "the requester", no "as you suspected", no
  "validate X's instinct/thoughts". The reader may be someone who has never spoken to the
  requester and doesn't care whose hunch it was.
- **Answer the source documents, not the person.** The questions come from the ticket and
  the business/requirements docs. Frame findings as answering *those* questions on their
  own evidence (data, code, experiments). If a finding happens to confirm or contradict a
  hunch someone had, that is irrelevant to the write-up — state what the evidence shows and
  why, and drop the attribution.
- **Neutral, evidence-led tone.** "The data shows X" / "The code enforces Y", not "your
  concern is correct". Recommendations are justified by the investigation, not by whose
  idea they were.
- If a specific person genuinely must make a call (e.g. a product decision), name the
  *role/decision* ("product needs to confirm whether…"), not "you need to decide".

## Code references as permalinks (read first)

When the code you cite lives in a git checkout, reference it as a **permalink whose link
text is the function or class name**, not as a raw `path:line`. This lets a reader click
straight to the exact code at the exact commit.

- **Link text = the enclosing function or class name.** For example
  `[for_adamm](<url>)`, `[BuildQueue.for_all_machines](<url>)`,
  `[MachineModel](<url>)`. If the reference is not inside a function/class (a module-level
  constant, a config key, a migration file), use the symbol or file name as the text
  (e.g. `[MAX_STOPPAGE_IN_MINUTES](<url>)`, `[constants.py](<url>)`).
- **Never put backticks (code formatting) inside the link text.** Write `[for_adamm](<url>)`,
  not `` [`for_adamm`](<url>) ``. Confluence does not accept a code-formatted link label, so
  a backticked link text renders broken there. Keep the label plain text; use code
  formatting only for identifiers that are not links.
- **Build the URL with the helper**, so it is pinned to the commit the line numbers belong
  to and the remote is normalised correctly:

  ```
  scripts/permalink.sh <file> [start_line] [end_line]
  ```

  (relative to this skill's base directory). It prints a permalink like
  `https://github.com/<org>/<repo>/blob/<sha>/<path>#L<start>-L<end>`. Run it per reference,
  or reuse the printed SHA for many references in the same repo. If it warns that the file
  has uncommitted changes, the line numbers may not match the pinned blob, so re-check.
- **Pin to the commit SHA, never a branch.** The script uses `HEAD`'s SHA on purpose; line
  numbers only stay correct against a fixed commit.
- Prefer a **line range** for a whole function/class (`#L352-L478`), a single line for a
  specific spot.
- The **References** section uses the same style: link the file or symbol name, do not list
  bare paths.
- If a repo has no usable git remote, fall back to a plain `path:line` and say so; do not
  fabricate a URL.

## How to use me

1. Read `template.md` in this skill's folder — it's the exact structure to follow. Don't
   invent a different structure.
2. Fill it in from the investigation notes. Keep it tight:
   - **Abstract** (Context / Outcome / Consequences) is one short line each (2-3 at the
     very most). If a sub-section can't be said that briefly, the spike is probably still
     unresolved or too broad, or the detail belongs in a later section, not the abstract.
   - **Current state** should name real files, services, and components, not describe
     the system in the abstract. A reader should be able to go straight to the code,
     via permalinks whose text is the function/class name (see "Code references as
     permalinks" above). Keep
     it scoped to the parts the questions actually touch: don't document adjacent
     internals (query mechanics, package/status models, and the like) that aren't a
     concern of this work.
   - **Questions**: state each question precisely, then explain in a sentence or two why
     the answer matters — what decision depends on it.
   - **Possible solutions / Options considered**: this is the heart of the spike — treat
     it as reasoning made visible, not a scorecard. A summary table is fine as an
     at-a-glance aid, but it must be backed by prose that walks the reader through the
     thinking for each option:
       - **How it actually works** — the concrete mechanism/change, naming the real
         files/services/components it touches.
       - **Why it's on the table** — what problem or question it addresses, and what led
         you to consider it.
       - **Why it does or doesn't hold up** — the trade-offs, second-order effects, and
         failure modes you found while investigating; where it helps and where it breaks.
       - **How the options relate** — are they mutually exclusive, additive, or a
         fallback chain? Make the reasoning that connects them explicit so the Decision
         reads as a conclusion, not an assertion.
     Every option you list should have been genuinely investigated (see
     `spike-investigation`) — don't list an option you didn't check just to look thorough.
     For each option, note your confidence in the evaluation (**verified** / **inferred** /
     **unknown**) and the evidence behind it (file paths, commands run, benchmark numbers,
     links).
   - Keep quoted external material minimal and paraphrased; link to sources instead of
     reproducing large chunks of docs or articles.
3. Always fill in **Decision**. A spike without a decision isn't done. If the honest
   answer is "we need another spike" or "someone else needs to decide," say that
   plainly rather than forcing a recommendation.
4. Always fill in **Risks & open questions**, even if it's short — an empty section
   here usually means unverified findings are being presented as certain.
5. Fill in **References** with anything you actually consulted (docs, RFCs, prior
   spikes, PRs) — not a generic reading list.
6. Save the file. Default location: `spikes/<short-slug>.md` or `docs/spikes/<short-
   slug>.md`, matching whatever convention already exists in the repo (check for an
   existing `spikes/` or `docs/spikes/` directory first). Ask only if neither exists and
   the project layout gives no hint.
7. After saving, give the user a short chat summary: the decision in one or two
   sentences, and a pointer to the file. Don't paste the whole doc into chat as well.

## Quality bar before calling it done

- Would someone who wasn't in this conversation understand the recommendation and why,
  without pinging you?
- Is it written impersonally, with no em dashes? Search for "—", "you", "your",
  "requester", "instinct", "hunch", "as suspected" — if any survived, rewrite them out.
  The doc should read like a decision record, not a reply.
- Do the findings answer the questions from the ticket/business doc on their own evidence,
  with no dependence on who raised them?
- Does each option in Possible solutions explain the *why* and the trade-offs in prose —
  not just sit in a table? A reader should follow the reasoning from options to Decision.
- Is every "verified" claim actually backed by something you did (ran, read, tested) —
  not something you assumed?
- Are code references permalinks with the function/class name as link text (built with
  `scripts/permalink.sh`, pinned to a commit SHA), not bare `path:line`, wherever a git
  remote exists? And is the link text plain (no backticks), so it renders in Confluence?
- Did you resist the urge to pad it? Spikes are read under time pressure; shorter and
  precise beats long and thorough-sounding.
