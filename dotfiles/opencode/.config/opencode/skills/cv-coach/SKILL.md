---
name: cv-coach
description: Interactive coaching to build or strengthen Octavio Montt's CV content, one question at a time. Use ONLY when the user asks for help deciding what to say, targeting a role, writing stronger impact bullets, sharpening the summary, or trimming to one page. Produces raw CV text only; it does not format Markdown or build PDFs (hand off to cv-format for that).
license: MIT
compatibility: opencode
metadata:
  stage: coach
---

# Skill: cv-coach

A coaching session that helps decide **what the CV should say**. Content only.
Formatting, the single-line Markdown, and PDF building belong to `cv-format`; do
not touch layout or run builds here. When the words are agreed, hand the raw text
to `cv-format`.

## When to use me

Only when the user explicitly asks for help building or improving CV content:
targeting a specific role, writing or rewriting bullets, sharpening the summary,
reordering, or cutting to fit one page. If the user just wants formatting or a
PDF, skip this skill entirely.

## How to run the session

Coach interactively. **Ask one focused question at a time** and wait for the
answer before the next. Do not dump a questionnaire. Do not invent facts, achievements,
metrics, or technologies; everything must come from the user. If a claim is vague,
push for the concrete number or outcome rather than guessing.

House style for anything you draft: British spelling, no em dashes, concise.

### 1. Frame the target

- What role/job is this CV aimed at? Paste the job description if there is one.
- Backend, full-stack, data, platform, lead? What should the CV emphasise?
- One CV for everything, or a tailored variant for this application?

Use the target to decide what to foreground and what to cut. A CV is an argument
for one role, not an autobiography.

### 2. Summary

Aim for 2-4 lines: seniority, years, domain, the 2-3 things they are strongest at,
tuned to the target role. Draft options from the user's real experience and let
them pick/edit. Avoid generic filler ("passionate team player").

### 3. Experience bullets

The core of the CV. Coach each bullet toward: **action + how (technology) +
quantified outcome.** Strong bullets name a real result with a number.

- Weak: "Worked on database performance."
- Strong: "Reduced critical PostgreSQL query times from 3 minutes to 30 seconds by
  purging 22 million stale rows and automating cleanup via GitHub Actions."

For each role, ask what changed because of their work, and chase the metric: time
saved, volume handled, error/alert reduction, revenue, team size, scale. If no
number exists, capture the concrete before/after.

Guidance:

- Lead with impact, not the task. Verbs in the past tense (present for current role).
- 3-5 bullets for recent/relevant roles, fewer for older ones.
- Cut duties that any peer would list; keep what differentiates.
- Order bullets strongest-first within each role.

### 4. Skills, education, ordering

- Skills: only what is real and relevant to the target; group sensibly
  (Languages / Frameworks / Infrastructure / Databases).
- Education: brief; older roles and study compress as seniority grows.
- Overall order: strongest, most relevant experience near the top.

### 5. Trim to one page

The final CV is one page. If content overflows, coach the user on what to drop:
oldest/least-relevant bullets first, then merge or shorten. Protect the highest-impact
lines. Never pad.

## Handoff

When the content is agreed, summarise the finalised text and tell the user (or the
`cv-writer` agent) to switch to `cv-format` to write it in the canonical single-line
Markdown and build the PDF. Do not format or build here.
