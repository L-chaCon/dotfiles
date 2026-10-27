---
title: <Human-readable title>
project: <project-slug>
topic: <topic-slug, same as the entry directory>
type: <design | plan | spec | investigation | decision | runbook | retro | other>
status: <proposed | active | implemented | superseded | abandoned>
tags: [<lowercase>, <hyphenated>, <tech-and-domain-terms>]
created: <YYYY-MM-DD>
updated: <YYYY-MM-DD>
summary: <One sentence: what was decided or produced, and why it matters.>
source:
  repo: <git remote or (none)>
  branch: <branch at archive time>
  commit: <short sha at archive time>
  paths:
    - <path of each original doc, relative to the source repo root>
related:
  - <other-project-slug/topic-slug, if any>
---

# <Title>

## Context
<!-- The problem, the trigger, who/what it affects, and the state of things before. 3–8 sentences. -->

## Decisions
<!-- One block per decision. Never delete a decision on update: mark it superseded and add the new one. -->

### D1: <Decision in one line>
- **Choice:** <what was chosen>
- **Why:** <the reasoning, constraints, and evidence that drove it>
- **Alternatives rejected:** <option — why not>; <option — why not>
- **Consequences:** <trade-offs accepted, follow-up work it implies>
- **Status:** active
<!-- When superseded: **Status:** superseded on YYYY-MM-DD by D<n> — <reason> -->

## Constraints and assumptions
<!-- Hard limits (deadlines, budgets, compliance, legacy systems) and assumptions that, if false, would change the decisions. -->

## Implementation notes
<!-- Key components, files, interfaces, data shapes, commands. Only what a future reimplementation needs. Omit the section if not applicable. -->

## Open questions
<!-- Unresolved items and follow-ups at the time of the last update. -->

## Sources
<!-- One line per file in sources/: what it is and when to read it instead of this summary. -->
- `sources/<file>` — <description>

## Changelog
- <YYYY-MM-DD>: Created from <paths> at <commit>.
