#!/usr/bin/env python3
"""Print the facts archive-docs needs about a source project and this library.

Usage: project_info.py [PROJECT_DIR]   (defaults to the current directory)
"""

import os
import re
import subprocess
import sys
from pathlib import Path

LIBRARY = Path(os.environ.get("AI_DOCS_DIR", "~/.ai_docs")).expanduser()


def git(cwd: Path, *args: str) -> str:
    try:
        out = subprocess.run(["git", *args], cwd=cwd, capture_output=True, text=True, check=True)
        return out.stdout.strip()
    except (subprocess.CalledProcessError, FileNotFoundError):
        return ""


def slugify(value: str) -> str:
    return re.sub(r"[^a-z0-9]+", "-", value.lower()).strip("-")


def parse_remote(remote: str) -> tuple[str, str]:
    """Return (owner, repo) from an ssh/https git remote."""
    path = re.sub(r"\.git$", "", remote.rstrip("/"))
    parts = re.split(r"[/:]", path)
    repo = parts[-1] if parts else ""
    owner = parts[-2] if len(parts) > 1 else ""
    return owner, repo


def frontmatter_value(file: Path, key: str) -> str:
    if not file.is_file():
        return ""
    for line in file.read_text().splitlines()[1:]:
        if line.strip() == "---":
            break
        if line.startswith(f"{key}:"):
            return line.split(":", 1)[1].strip().strip("\"'")
    return ""


def main() -> None:
    cwd = Path(sys.argv[1] if len(sys.argv) > 1 else ".").resolve()
    repo_root = Path(git(cwd, "rev-parse", "--show-toplevel") or cwd)
    remote = git(repo_root, "remote", "get-url", "origin")

    if remote:
        owner, repo = parse_remote(remote)
        slug = slugify(repo)
        existing = LIBRARY / "projects" / slug / "PROJECT.md"
        existing_remote = frontmatter_value(existing, "remote")
        if existing_remote and existing_remote != remote:
            slug = slugify(f"{owner}-{repo}")
    else:
        slug = slugify(repo_root.name)

    project_dir = LIBRARY / "projects" / slug
    entries = sorted(p.name for p in (project_dir / "entries").glob("*/") if (p / "ENTRY.md").is_file())

    print(f"library: {LIBRARY}")
    print(f"project_slug: {slug}")
    print(f"project_dir: {project_dir} ({'exists' if project_dir.exists() else 'new'})")
    print(f"existing_entries: {', '.join(entries) or '(none)'}")
    print(f"repo_root: {repo_root}")
    print(f"remote: {remote or '(none)'}")
    print(f"branch: {git(repo_root, 'branch', '--show-current') or '(none)'}")
    print(f"commit: {git(repo_root, 'rev-parse', '--short', 'HEAD') or '(none)'}")
    print(f"dirty: {'yes' if git(repo_root, 'status', '--porcelain') else 'no'}")


if __name__ == "__main__":
    main()
