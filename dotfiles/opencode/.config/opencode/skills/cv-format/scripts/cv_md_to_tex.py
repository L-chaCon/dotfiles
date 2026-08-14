#!/usr/bin/env python3
"""Convert a canonical single-line CV Markdown file into LaTeX (and optionally a PDF).

The Markdown schema is documented in ../SKILL.md. In short:

    # Full Name
    email
    phone
    [Label](url)
    Location

    ---

    ## Summary
    <one single line>

    ---

    ## Work Experience
    **Role, Company**
    Start - End
    > one-line description
      - bullet on a single line
      - another bullet

    ---

    ## Skills & Others
    **Languages:** Python, SQL
    ...

    ---

    ## Education
    Title, Institution (Start - End)

Each bullet and paragraph MUST live on a single physical line. Bullets may start
with "-", "*" or the "\u2022" character, optionally indented.

Usage:
    cv_md_to_tex.py INPUT.md [-o OUTPUT.tex] [--template TEMPLATE.tex]

Output defaults to INPUT with a .tex extension, written next to the source.
"""

import argparse
import os
import re
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
DEFAULT_TEMPLATE = os.path.normpath(os.path.join(HERE, "..", "template.tex"))

# --------------------------------------------------------------------------- #
# Escaping helpers
# --------------------------------------------------------------------------- #

_LATEX_SPECIALS = {
    "\\": r"\textbackslash{}",
    "&": r"\&",
    "%": r"\%",
    "$": r"\$",
    "#": r"\#",
    "_": r"\_",
    "{": r"\{",
    "}": r"\}",
    "~": r"\textasciitilde{}",
    "^": r"\textasciicircum{}",
}

LINK_RE = re.compile(r"\[([^\]]+)\]\(([^)]+)\)")
BOLD_RE = re.compile(r"\*\*(.+?)\*\*")


def esc(text: str) -> str:
    """Escape LaTeX specials and normalise dashes. Not for text with markup."""
    text = text.replace("\u2013", "--").replace("\u2014", "--")
    out = []
    for ch in text:
        out.append(_LATEX_SPECIALS.get(ch, ch))
    return "".join(out)


def render_inline(text: str) -> str:
    """Render inline Markdown (bold, links) to LaTeX, escaping the rest."""
    # Protect links first by splitting on them.
    pieces = []
    last = 0
    for m in LINK_RE.finditer(text):
        pieces.append(("text", text[last:m.start()]))
        pieces.append(("link", (m.group(1), m.group(2))))
        last = m.end()
    pieces.append(("text", text[last:]))

    def render_text_segment(seg: str) -> str:
        # Handle bold within a plain text segment.
        out = []
        last_i = 0
        for bm in BOLD_RE.finditer(seg):
            out.append(esc(seg[last_i:bm.start()]))
            out.append(r"\textbf{" + esc(bm.group(1)) + "}")
            last_i = bm.end()
        out.append(esc(seg[last_i:]))
        return "".join(out)

    result = []
    for kind, val in pieces:
        if kind == "text":
            result.append(render_text_segment(val))
        else:
            label, url = val
            result.append(r"\href{" + url.strip() + "}{" + esc(label) + "}")
    return "".join(result)


def link_display(url: str) -> str:
    """Turn a URL into a compact display string, e.g. linkedin.com/in/x."""
    disp = re.sub(r"^https?://", "", url.strip())
    disp = re.sub(r"^www\.", "", disp)
    disp = disp.rstrip("/")
    return disp


# --------------------------------------------------------------------------- #
# Parsing
# --------------------------------------------------------------------------- #

BULLET_RE = re.compile(r"^\s*(?:[-*\u2022])\s+(.*)$")


def split_sections(lines):
    """Return (name, header_lines, {section_title: [lines]}) preserving order."""
    name = None
    header = []
    sections = {}
    order = []
    current = None
    for raw in lines:
        line = raw.rstrip("\n")
        stripped = line.strip()
        if current is None and stripped.startswith("# ") and name is None:
            name = stripped[2:].strip()
            continue
        if stripped.startswith("## "):
            current = stripped[3:].strip()
            sections[current] = []
            order.append(current)
            continue
        if stripped == "---":
            continue
        if current is None:
            if stripped:
                header.append(stripped)
        else:
            sections[current].append(line)
    return name, header, sections, order


def find_section(sections, order, *names):
    lowered = {k.lower(): k for k in order}
    for n in names:
        if n.lower() in lowered:
            return sections[lowered[n.lower()]]
    return None


# --------------------------------------------------------------------------- #
# Rendering each block to LaTeX
# --------------------------------------------------------------------------- #

def render_header(name, header):
    out = [r"{\LARGE\bfseries " + esc(name) + r"}\\[3pt]"]
    parts = []
    for item in header:
        m = LINK_RE.fullmatch(item.strip())
        if m:
            label, url = m.group(1), m.group(2)
            parts.append(r"\href{" + url.strip() + "}{" + esc(link_display(url)) + "}")
        else:
            parts.append(render_inline(item))
    sep = "\n  \\enspace\\textbar\\enspace\n  "
    out.append(r"{\sml\color{mutedcolor}" + "\n  " + sep.join(parts) + "\n}")
    out.append("")
    out.append(r"\vspace{4pt}")
    out.append(r"{\color{rulecolor}\rule{\linewidth}{0.4pt}}")
    out.append(r"\vspace{2pt}")
    return "\n".join(out)


def render_summary(lines):
    text = " ".join(l.strip() for l in lines if l.strip())
    if not text:
        return ""
    return "{\\sml\n" + render_inline(text) + "\n}"


def parse_experience(lines):
    """Yield dicts: {title, dates, desc, bullets[]}."""
    entries = []
    cur = None
    for raw in lines:
        stripped = raw.strip()
        if not stripped:
            continue
        bm = BULLET_RE.match(raw)
        if bm:
            if cur is not None:
                cur["bullets"].append(bm.group(1).strip())
            continue
        if stripped.startswith(">"):
            if cur is not None:
                cur["desc"] = stripped.lstrip(">").strip()
            continue
        if stripped.startswith("**") and stripped.endswith("**"):
            cur = {"title": stripped.strip("*").strip(), "dates": "", "desc": "", "bullets": []}
            entries.append(cur)
            continue
        # Otherwise: a date line following a title with empty dates.
        if cur is not None and not cur["dates"] and not cur["bullets"]:
            cur["dates"] = stripped
    return entries


def render_experience(lines):
    entries = parse_experience(lines)
    blocks = [r"\section{Work Experience}", ""]
    for i, e in enumerate(entries):
        title = e["title"]
        if "," in title:
            role, company = title.rsplit(",", 1)
            role, company = role.strip(), company.strip()
            head = (r"\textbf{\sml " + esc(role) + r"}\ \textbar\ \textbf{\sml "
                    + esc(company) + "}")
        else:
            head = r"\textbf{\sml " + esc(title) + "}"
        head += (r"\hfill{\sml\color{mutedcolor} " + esc(e["dates"]) + r"}\\")
        blocks.append(head)
        if e["desc"]:
            blocks.append(r"{\sml\color{mutedcolor}\textit{" + esc(e["desc"]) + "}}")
        if e["bullets"]:
            blocks.append(r"\begin{itemize}")
            blocks.append(r"  \sml")
            for b in e["bullets"]:
                blocks.append(r"  \item " + render_inline(b))
            blocks.append(r"\end{itemize}")
        if i != len(entries) - 1:
            blocks.append("")
            blocks.append(r"\vspace{2pt}")
            blocks.append("")
    return "\n".join(blocks)


def render_skills(lines, heading):
    rows = []
    for raw in lines:
        stripped = raw.strip()
        if not stripped:
            continue
        m = re.match(r"^\*\*(.+?):\*\*\s*(.*)$", stripped)
        if m:
            key, val = m.group(1).strip(), m.group(2).strip()
        else:
            m2 = re.match(r"^\*\*(.+?)\*\*\s*[:]?\s*(.*)$", stripped)
            if not m2:
                continue
            key, val = m2.group(1).strip().rstrip(":"), m2.group(2).strip()
        rows.append((key, val))
    if not rows:
        return ""
    out = [r"\section{" + esc(heading) + "}", "", r"{\sml", r"\begin{tabular}{@{}>{\bfseries}p{3.4cm} p{\dimexpr\linewidth-3.4cm-4\tabcolsep\relax}}"]
    for i, (key, val) in enumerate(rows):
        tail = r" \\[1pt]" if i != len(rows) - 1 else r" \\"
        out.append(r"  \textbf{" + esc(key) + "} & " + render_inline(val) + tail)
    out.append(r"\end{tabular}")
    out.append("}")
    return "\n".join(out)


EDU_RE = re.compile(r"^(.*?),\s*(.*?)\s*\((.*?)\)\s*$")


def render_education(lines):
    items = [l.strip() for l in lines if l.strip()]
    if not items:
        return ""
    out = [r"\section{Education}", "", r"{\sml"]
    rendered = []
    for item in items:
        m = EDU_RE.match(item)
        if m:
            title, inst, dates = m.group(1).strip(), m.group(2).strip(), m.group(3).strip()
            rendered.append(
                r"\textbf{" + esc(title) + r"}\ \textbar\ " + esc(inst)
                + r"\hfill{\color{mutedcolor} " + esc(dates) + "}"
            )
        else:
            rendered.append(render_inline(item))
    out.append(("\\\\[1pt]\n").join(rendered))
    out.append("}")
    return "\n".join(out)


# --------------------------------------------------------------------------- #
# Main
# --------------------------------------------------------------------------- #

def build_content(md_text):
    lines = md_text.splitlines()
    name, header, sections, order = split_sections(lines)
    if not name:
        raise SystemExit("error: no '# Name' heading found at top of the Markdown")

    blocks = [render_header(name, header)]

    summary = find_section(sections, order, "Summary")
    if summary is not None:
        s = render_summary(summary)
        if s:
            blocks.append(s)

    exp = find_section(sections, order, "Work Experience", "Experience")
    if exp is not None:
        blocks.append(render_experience(exp))

    skills_key = None
    for k in order:
        if k.lower().startswith("skills"):
            skills_key = k
            break
    if skills_key:
        blocks.append(render_skills(sections[skills_key], skills_key))

    edu = find_section(sections, order, "Education")
    if edu is not None:
        blocks.append(render_education(edu))

    return "\n\n".join(b for b in blocks if b.strip())


def main(argv=None):
    ap = argparse.ArgumentParser(description="Convert canonical CV Markdown to LaTeX.")
    ap.add_argument("input", help="Path to the canonical CV Markdown file")
    ap.add_argument("-o", "--output", help="Output .tex path (default: input with .tex)")
    ap.add_argument("--template", default=DEFAULT_TEMPLATE, help="LaTeX template with %%CONTENT%% marker")
    args = ap.parse_args(argv)

    with open(args.input, encoding="utf-8") as f:
        md_text = f.read()
    with open(args.template, encoding="utf-8") as f:
        template = f.read()

    content = build_content(md_text)
    if "%%CONTENT%%" not in template:
        raise SystemExit("error: template is missing the %%CONTENT%% marker")
    tex = template.replace("%%CONTENT%%", content)

    out_path = args.output or os.path.splitext(args.input)[0] + ".tex"
    with open(out_path, "w", encoding="utf-8") as f:
        f.write(tex)
    print(out_path)
    return 0


if __name__ == "__main__":
    sys.exit(main())
