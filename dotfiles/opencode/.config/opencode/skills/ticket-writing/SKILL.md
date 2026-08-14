---
name: ticket-writing
description: Format each Jira ticket for copy-paste into Jira, using the correct per-type structure (Spike, Story, Task) with a clear summary, structured description, and testable acceptance criteria. Use to produce the final ticket text once the breakdown is agreed.
license: MIT
compatibility: opencode
metadata:
  stage: "3-writing"
---

# Skill: ticket-writing

## What I do

Write the final, copy-paste-ready text for each ticket from the agreed breakdown. There is
no Jira connection, so each block must stand on its own and paste cleanly into a Jira issue.

## When to use me

After `ticket-breakdown` has produced an agreed ticket list.

## House style

- **No em dashes.** Never use "—"; use a comma, colon, parentheses, or "-".
- **No hard-wrapping.** When writing to a `.md` file, never insert a newline just to keep a
  line under some column limit. Only break a line where there is a real, intended line break
  (a new paragraph, list item, or heading). Let prose run as one long line and rely on the
  editor to soft-wrap it. If there is no actual new line, do not add one.
- **No Timebox and no Out of scope sections.** Never add a timebox to any ticket (including
  Spikes). Do not add an Out of scope section; keep scope implicit in the description.
- **Links inline.** Put every link (source spike, files, endpoints) inline in the prose on
  the words that name it. Never collect links into a separate References section. Never wrap
  link text in backticks (`[for_adamm](url)`, not backticked), as Jira will not linkify code
  on paste.
- **Summary**: imperative, specific, and short (aim for under ~10 words). It reads as an
  action: "Add kibble-only toggle to the Machines tab".
- **Acceptance criteria**: testable and unambiguous. Anyone should be able to tell when each
  is met. Use a checklist by default, or Given/When/Then if the user prefers.
- **Self-contained**: do not require the spike to be open, but link/reference it inline in
  the description for provenance.
- Keep prose tight and technical; name real services, files, and endpoints where relevant,
  linking each inline where you name it.

## Format

Read `template.md` in this skill's folder for the exact per-type structure. Present each
ticket in its own fenced block so it can be selected and pasted in one go. Lead each block
with the fields Jira needs (Issue Type, Summary), then the Description body.

Default to clean Markdown, which Jira Cloud accepts on paste. If the user's instance needs
Jira wiki markup instead, switch: headings become `h2.`, bold is `*text*`, bullets are `*`,
and checklists become `(/)`/`(x)` or a simple list. Ask once if unsure which the instance
uses.

## Per-type essentials

- **Spike**: state the questions to answer and a definition of done (what artifact
  or decision ends it). Do not add a timebox. Acceptance = questions answered and the
  artifact produced.
- **Story**: give context/value, then acceptance criteria describing the observable
  behaviour, plus dependencies. Keep scope implicit in the description, do not add an Out of
  scope section. Confirm it fits two weeks; if it grew, hand it back to `ticket-breakdown`
  to split. Only add sub-tasks when the work splits into genuinely concurrent lanes (see
  `ticket-breakdown`); a linear Story has no sub-tasks and its steps live as acceptance
  criteria.
- **Task**: give the concrete change and its definition of done, plus dependencies. Keep it
  isolated; if it starts implying user-facing behaviour, it may really be a Story.

## Finishing

- Include dependency/order notes (blocked by / depends on) so the set is workable in sequence.
- After presenting the tickets, give a one-line index (title + type) and flag any assumptions
  made or questions still open.
- Offer to save the set under `tickets/` if the user wants a file as well as the paste blocks.

## Quality bar before calling it done

- Is every ticket the right type, and does every Story credibly fit in two weeks?
- Is each summary imperative and specific, and is each acceptance criterion testable?
- Are dependencies explicit, and are any unresolved decisions flagged rather than assumed?
- Em-dash check: search for "—" and remove any that survived.
- Wrapping check: when the output is written to a `.md` file, confirm no line was broken
  purely to satisfy a column limit; only real line breaks remain.
- Structure check: no Timebox section, no Out of scope section, and no separate References
  section anywhere. Every link sits inline in the prose, with no backticks around link text.
