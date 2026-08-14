# Ticket templates (copy-paste into Jira)

Each ticket is presented in its own fenced block. Lead with the fields Jira needs, then the
description body. Default is Markdown (Jira Cloud accepts it on paste); switch to Jira wiki
markup on request. No em dashes anywhere.

Three standing rules for every ticket:

- **No Timebox section.** Never add a timebox to any ticket, including Spikes.
- **No Out of scope section.** Keep scope implicit in the description; describe what the
  ticket does, not lists of what it does not.
- **Links live inline in the prose.** When you mention a file, endpoint, or the source
  spike, put the link right there on the words that name it. Do not collect links into a
  separate References section.
- **Never wrap link text in backticks.** Write `[for_adamm](url)`, not
  `` [`for_adamm`](url) ``. Backticked link text renders as code and Jira will not linkify
  it on paste. Inline code is fine for non-linked field names in the prose.

---

## Spike template

```
Issue Type: Spike
Summary: Investigate <the question, briefly>

## Context
Why this investigation is needed and what triggered it, linking the source
[spike/brief](url) inline where you name it.

## Questions to answer
- ...
- ...

## Definition of done
- The questions above are answered with evidence.
- <artifact produced, e.g. a written recommendation / updated spike doc / query result>.

## Dependencies
Blocked by / depends on: <none | ticket or decision>
```

---

## Story template

```
Issue Type: Story
Summary: <Imperative, specific outcome>

## Context / value
What this delivers and why it matters (the observable value). Link the source
[spike/brief](url) and any files/endpoints inline where you name them.

## Scope
The coherent slice of behaviour this Story delivers. Name the [systems/files](url) it
touches, linking each inline.

## Acceptance criteria
- [ ] <testable behaviour 1>
- [ ] <testable behaviour 2>
- [ ] <testable behaviour 3>

## Dependencies
Blocked by / depends on: <none | ticket(s) | decision>

## Notes
Sizing: confirmed to fit within one sprint (two weeks or less). Any assumptions, risks,
or links to related tickets.
```

---

## Task template

```
Issue Type: Task
Summary: <Imperative, specific action>

## Description
The concrete, self-contained change to make and any relevant detail (files, config, data),
linking each [file/endpoint](url) and the source [spike/brief](url) inline where named.

## Definition of done
- [ ] <what "done" looks like, testable>

## Dependencies
Blocked by / depends on: <none | ticket(s)>
```

---

## Jira wiki markup variant (if the instance needs it)

If the user's Jira does not accept pasted Markdown, use wiki markup instead:

- Headings: `h2. Context`
- Bold: `*text*`
- Bullets: `* item`
- Checklist: a simple list, or `(/)` done / `(x)` not done
- No code fences around the ticket body when pasting into the description field
