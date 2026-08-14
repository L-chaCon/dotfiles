---
name: doc-writeup
description: Structure investigation findings into the final technical document - overview, architecture, components, data and control flow, interfaces, data model, configuration, operational concerns, edge cases, and references, with diagrams and file citations. Use to produce or update a technical document once the investigation is done.
license: MIT
compatibility: opencode
metadata:
  stage: "3-writeup"
---

# Skill: doc-writeup

## What I do

Turn investigation notes into the actual technical document: the reference an engineer
reads to understand the system without re-deriving it from the code.

## When to use me

After `doc-investigation` has produced findings, or when an existing document needs
restructuring or extending.

## House style (read first)

- **No em dashes.** Never use the "—" character, in the document or in any chat summary.
  Use a comma, colon, parentheses, or a plain hyphen "-" instead.
- **Impersonal, third person.** The document is a standalone reference, not a reply. No
  "you", "your", "the requester".
- **Cite everything.** Non-trivial claims carry a `path:line` reference. A reader should be
  able to jump from any section straight to the code.
- **Confidence is explicit.** Where a statement is inferred rather than verified, or
  unknown, say so. Do not smooth over gaps.
- **Depth over breadth of adjectives.** Explain mechanisms and the *why*; cover contracts,
  data model, failure modes and edge cases, not only the happy path.

## How to use me

1. Read `template.md` in this skill's folder; it is the structure to follow. Include the
   sections that fit the document type from `doc-scoping` and drop the ones that do not,
   but do not invent a different skeleton.
2. Fill it from the investigation notes:
   - **Overview** states in a few lines what the system/process is, what it is for, and its
     place in the wider platform. No filler.
   - **Architecture** names the real components and how they connect, with a diagram
     (`doc-diagrams`) when it is faster than prose.
   - **Components**, **Data and control flow**, **Interfaces / contracts**, **Data model**,
     **Configuration and deployment**, **Operational concerns and failure modes** each stay
     concrete and cited. Trace at least one representative end-to-end path in the flow
     section.
   - **Edge cases and open questions** captures what is unresolved or deliberately excluded.
     Never present inferred behaviour as certain.
3. Keep diagrams accurate: every node and labelled edge must match real behaviour found in
   the investigation.
4. Fill **References** with the real files, services, endpoints, docs, and PRs consulted,
   not a generic reading list.
5. Save the file. Default location: `docs/<slug>.md` or the project's existing docs
   convention (check for `docs/` or `documentation/` first). Ask only if neither exists and
   the layout gives no hint.
6. After saving, give a short chat summary: what the document covers, where it lives, and
   any notable open questions. Do not paste the whole document into chat.

## Quality bar before calling it done

- Could an engineer who was not in this conversation understand the system and act on the
  document without pinging you?
- Is it impersonal and em-dash-free? Search for "—", "you", "your", "requester"; rewrite
  any that survived.
- Is every "verified" claim actually backed by something read or run, with a citation?
- Are contracts, data model, failure modes, and at least one end-to-end flow covered, not
  just a feature list?
- Is the scope honest: does it state what it covers and what it does not?
