---
name: cv-format
description: Formats Octavio Montt's CV. Use when writing/normalising the CV Markdown into the canonical single-line (unwrapped, copy-paste-safe) format, or when converting a CV Markdown file into a polished one-page PDF via LaTeX. Handles layout and the md->tex->pdf build only, not content coaching. Trigger on requests like "format my CV", "build the CV PDF", "make the md copy-paste friendly", "md to pdf".
license: MIT
compatibility: opencode
metadata:
  stage: format
---

# Skill: cv-format

Layout and build tooling for Octavio Montt's CV. Two jobs, both mechanical:

1. Write/normalise the CV **Markdown** into the canonical single-line format.
2. Convert that Markdown into a one-page **PDF** using the bundled LaTeX template.

This skill does **not** write or judge CV content. If the user wants help deciding
what to say, load `cv-coach` instead and return here once the words exist.

## House rules

- British spelling (organise, prioritise, optimise), matching the existing CV.
- No em dashes ("—"). Use commas, colons, parentheses, or a plain hyphen.
- One page. If the PDF spills to a second page, tighten wording, do not shrink the
  template blindly.

## The canonical single-line Markdown format

The whole point: **every bullet and every paragraph sits on exactly one physical
line.** Editors soft-wrap it on screen, but the file itself has no mid-sentence
newlines, so copying a bullet pastes as one clean line with no stray breaks.

Do NOT hard-wrap prose across multiple lines the way the old `2024/` and early
`2026/cv_octavio.md` drafts did. Each bullet = one line, however long.

Structure (dividers are literal `---` lines):

```markdown
# Full Name
email@example.com
+44 7000000000
[LinkedIn](https://www.linkedin.com/in/handle/)
City, Country

---

## Summary
One single line describing the candidate. No line breaks inside it.

---

## Work Experience
**Role, Company**
Start – End
> One-line context about the company (optional)

  - Impact bullet on a single line: action, technology, quantified outcome.
  - Another single-line bullet.

**Next Role, Company**
Start – End
> Optional one-line context

  - Single-line bullet.

---

## Skills & Others
**Languages:** Python, SQL
**Frameworks:** FastAPI, Flask, Django REST Framework, Celery
**Infrastructure:** AWS, Kubernetes (Flux, Helm), Terraform, GitHub Actions, Docker
**Databases:** PostgreSQL, MySQL, MongoDB

---

## Education
Degree Title, Institution (Start – End)
Another Qualification, Institution (Start – End)
```

Format rules the converter relies on:

- **Name**: the single `# ` heading at the very top.
- **Contact block**: the non-empty lines between the name and the first `---` or
  `##`. One item per line. A bare `[Label](url)` line renders as a compact link
  (e.g. `linkedin.com/in/handle`); other lines print verbatim.
- **Section headings**: `## Summary`, `## Work Experience`, `## Skills & Others`
  (any heading starting "Skills" works), `## Education`. Order is preserved.
- **Job header**: `**Role, Company**` on its own line. The converter splits on the
  **last** comma, so "Data Migration Specialist / Software Engineer, ArtLogic"
  becomes role + company correctly.
- **Dates**: the plain line directly under the job header (e.g. `Feb 2025 – Present`).
- **Company context**: an optional `> ...` blockquote line under the dates.
- **Bullets**: lines starting with `-`, `*`, or `•` (indentation optional). Each is
  one line. Inline `**bold**` and `[text](url)` links are supported.
- **Skills rows**: `**Key:** value` per line.
- **Education rows**: `Title, Institution (Dates)` per line.

### Normalising an existing draft

When handed a wrapped or messy draft, rewrite it into the schema above:

- Join every hard-wrapped bullet/paragraph back into a single line (collapse the
  internal newlines into single spaces, squash double spaces).
- Convert `•`-prefixed or mixed bullets to `- `.
- Ensure `---` dividers sit between sections and blank lines separate jobs.
- Replace any em dashes; keep date ranges as `–` (en dash) or `-`, the converter
  normalises both to LaTeX `--`.

## Building the PDF (md -> tex -> pdf)

The bundled files:

- `scripts/cv_md_to_tex.py` - parses the canonical Markdown and emits LaTeX using
  the template. Deterministic; tuned to the schema above.
- `template.tex` - the LaTeX preamble (identical styling to `2026/cv_octavio.tex`)
  with a `CONTENT` marker where the generated body is injected.

Steps:

1. Ensure the Markdown is in canonical single-line format (normalise first if not).
2. Generate the LaTeX next to the source Markdown:

   ```bash
   python3 <skill>/scripts/cv_md_to_tex.py path/to/cv.md -o path/to/cv.tex
   ```

   With no `-o`, it writes `path/to/cv.tex` (same basename). It prints the output
   path. Override the template with `--template` if needed.

3. Compile to PDF with pdflatex (TinyTeX/BasicTeX). If the CV lives in `2026/`,
   reuse the existing `2026/build.sh`, which finds/installs pdflatex, installs the
   needed packages, runs two passes, checks the page count, and cleans aux files:

   ```bash
   bash /Users/octaviomontt/github.com/chaCon/CV/2026/build.sh
   ```

   Note: `build.sh` compiles `2026/cv_octavio.tex` specifically. If you generated a
   `.tex` elsewhere, either point pdflatex at it directly:

   ```bash
   pdflatex -interaction=nonstopmode -output-directory=<dir> <dir>/cv.tex
   pdflatex -interaction=nonstopmode -output-directory=<dir> <dir>/cv.tex   # 2nd pass for links
   rm -f <dir>/cv.aux <dir>/cv.log <dir>/cv.out
   ```

   or overwrite `2026/cv_octavio.tex` from the canonical md and run `build.sh`.

4. Confirm the log says "1 page". If it is 2 pages, report it and tighten content
   rather than silently shrinking margins/fonts.

## Verifying your output

- The `.md` has no mid-sentence newlines: every bullet and the summary are single
  lines. Spot-check by copying a bullet mentally, it should be one continuous line.
- The `.tex` compiles with exit 0 and the log reports a single page.
- Section order and content match the Markdown source.
