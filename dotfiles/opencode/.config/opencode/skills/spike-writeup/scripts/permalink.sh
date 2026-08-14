#!/usr/bin/env bash
#
# permalink.sh - build a pinned web permalink for a file (and optional line range)
# in a git repo, so code references in a spike point at the exact commit the line
# numbers belong to.
#
# Usage:
#   permalink.sh <file> [start_line] [end_line]
#
# Examples:
#   permalink.sh warehouse/repos/shipment_package.py 352 478
#   permalink.sh service/models/machine.py 14
#   permalink.sh api/models/machine.py
#
# Output (stdout): the permalink URL.
# Diagnostics (stderr): a warning if the file has uncommitted changes vs HEAD,
# because then the local line numbers may not match the pinned commit's blob.
#
# Notes:
# - Uses the current HEAD commit SHA (pinned), not a branch name, so the link is stable.
# - Handles GitHub/GitLab style "/blob/<sha>/" URLs from ssh or https remotes.
#   Bitbucket uses "/src/"; adjust BLOB_SEG below if needed.

set -euo pipefail

BLOB_SEG="blob"   # github/gitlab. bitbucket cloud uses "src".

file="${1:?usage: permalink.sh <file> [start_line] [end_line]}"
start="${2:-}"
end="${3:-}"

# Resolve the directory to run git from (works whether file is abs or relative).
dir="$(cd "$(dirname "$file")" && pwd)"
base="$(basename "$file")"

repo_root="$(git -C "$dir" rev-parse --show-toplevel)"
sha="$(git -C "$dir" rev-parse HEAD)"
remote="$(git -C "$dir" remote get-url origin)"

# Path relative to the repo root.
abs="$dir/$base"
relpath="${abs#"$repo_root"/}"

# Normalise the remote to an https web base, stripping any trailing ".git".
web="$remote"
web="${web%.git}"
case "$web" in
  git@*:*)            # git@github.com:org/repo
    host="${web#git@}"; host="${host%%:*}"
    path="${web#*:}"
    web="https://${host}/${path}"
    ;;
  ssh://*)            # ssh://git@github.com/org/repo
    rest="${web#ssh://}"; rest="${rest#*@}"
    host="${rest%%/*}"; path="${rest#*/}"
    web="https://${host}/${path}"
    ;;
  https://*|http://*) # already web form
    ;;
esac

# Build the line fragment.
frag=""
if [ -n "$start" ]; then
  frag="#L${start}"
  if [ -n "$end" ] && [ "$end" != "$start" ]; then
    frag="${frag}-L${end}"
  fi
fi

# Warn if the file differs from HEAD (line numbers may be off vs the pinned blob).
if ! git -C "$dir" diff --quiet HEAD -- "$relpath" 2>/dev/null; then
  echo "warning: $relpath has uncommitted changes vs HEAD; line numbers in the permalink may not match the pinned commit." >&2
fi

echo "${web}/${BLOB_SEG}/${sha}/${relpath}${frag}"
