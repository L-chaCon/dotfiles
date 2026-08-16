# vim: ft=zsh
# fzf-git.zsh — self-contained, zsh-only Ctrl-G <key> git pickers.
#
# Derived from fzf-git.sh by Junegunn Choi (MIT License). Heavily trimmed and
# rewritten for this dotfiles repo:
#   - zsh only (no bash branch)
#   - no browser-open (Ctrl-O) and no editor binds (Alt-E)
#   - git list commands inlined (no `--list` self-invocation)
#   - a minimal `--run` dispatcher is kept solely for the Alt-H
#     branch -> hashes hop (fzf `become` spawns a fresh shell).

# --- small helpers ----------------------------------------------------------
__fzf_git_color() {
  if [[ -n $NO_COLOR ]]; then
    echo never
  elif [[ $# -gt 0 ]] && [[ -n $FZF_GIT_PREVIEW_COLOR ]]; then
    echo "$FZF_GIT_PREVIEW_COLOR"
  else
    echo "${FZF_GIT_COLOR:-always}"
  fi
}

__fzf_git_cat() {
  if [[ -n $FZF_GIT_CAT ]]; then
    echo "$FZF_GIT_CAT"
    return
  fi
  # Sometimes bat is installed as batcat
  local opts="--style='${BAT_STYLE:-full}' --color=$(__fzf_git_color .) --pager=never"
  if command -v batcat > /dev/null; then
    echo "batcat $opts"
  elif command -v bat > /dev/null; then
    echo "bat $opts"
  else
    echo cat
  fi
}

__fzf_git_pager() {
  local pager
  pager="${FZF_GIT_PAGER:-${GIT_PAGER:-$(git config --get core.pager 2>/dev/null)}}"
  echo "${pager:-cat}"
}

# --- fzf wrapper (single source of truth; moved here from the zshrc) --------
# Redefine this function to change the options.
_fzf_git_fzf() {
  fzf --height=50% \
    --layout=reverse --multi --min-height=20 --border \
    --border-label-pos=2 \
    --color='bg:black,bg+:black,fg:white,header:cyan:italic:underline,info:green,query:white' \
    --preview-window='right,50%,border-left' \
    --bind='ctrl-/:change-preview-window(down,50%,border-top|hidden|)' "$@"
}

_fzf_git_check() {
  git rev-parse HEAD > /dev/null 2>&1 && return
  echo "Not in a git repository" >&2
  return 1
}

# Self-locate (zsh only, no readlink/ruby) — used only by the Alt-H `become`
# hop, which needs to re-enter a picker in a fresh shell.
__fzf_git=${(%):-%x}

# --- pickers ----------------------------------------------------------------

_fzf_git_files() {
  _fzf_git_check || return
  local root query list_cmd
  root=$(git rev-parse --show-toplevel)
  [[ $root != "$PWD" ]] && query='!../ '

  # Shared listing command, reused for the initial input and for `reload`
  # after CTRL-P stages some hunks (so the status refreshes in place).
  list_cmd="{ git -c color.status=$(__fzf_git_color) status --short --no-branch;"
  list_cmd+=" git ls-files \"$root\" | grep -vxFf <(git status -s | grep '^[^?]' | cut -c4-; echo :) | sed 's/^/   /'; }"

  eval "$list_cmd" |
  _fzf_git_fzf -m --ansi --nth 2..,.. \
    --border-label 'Files ' \
    --header 'CTRL-P (fzf hunk picker) ╱ ALT-P (git add -p)' \
    --bind "ctrl-p:execute(zsh \"$__fzf_git\" --run hunks {-1} > /dev/tty)+reload($list_cmd)" \
    --bind "alt-p:execute:git add -p {-1} > /dev/tty" \
    --query "$query" \
    --preview "git diff --no-ext-diff --color=$(__fzf_git_color .) -- {-1} | $(__fzf_git_pager); $(__fzf_git_cat) {-1}" "$@" |
  cut -c4- | sed 's/.* -> //'
}

# Hunk picker: split the unstaged diff into individual hunks, pick with Tab,
# and stage the selection via `git apply --cached`. An fzf-driven alternative
# to `git add -p`. Optional path args scope it to specific files.
_fzf_git_hunks() {
  _fzf_git_check || return

  local tmp
  tmp=$(mktemp -d "${TMPDIR:-/tmp}/fzf-git-hunks.XXXXXX") || return

  # Split the plain (uncolored — must stay applyable) diff into:
  #   $tmp/f<N>.hdr   per-file patch header (diff --git .. +++)
  #   $tmp/h<N>.body  a single @@ hunk body
  #   $tmp/list       one row per hunk: "hunkId<TAB>fileId<TAB>path<TAB>@@ ..."
  git diff --no-ext-diff -- "$@" | awk -v dir="$tmp" '
    /^diff --git/ {
      fc++
      hdr = dir "/f" fc ".hdr"
      printf "" > hdr
      print $0 >> hdr
      curfile = $0
      sub(/^diff --git a\//, "", curfile)
      sub(/ b\/.*/, "", curfile)
      in_hunk = 0
      next
    }
    /^@@/ {
      hc++
      body = dir "/h" hc ".body"
      printf "" > body
      print $0 >> body
      print hc "\t" fc "\t" curfile "\t" $0 >> (dir "/list")
      in_hunk = 1
      next
    }
    { if (in_hunk) print $0 >> body; else print $0 >> hdr }
  '

  if [[ ! -s $tmp/list ]]; then
    echo "No unstaged hunks" >&2
    rm -rf "$tmp"
    return
  fi

  # Colorizer for the preview (delta > bat > cat). The patch files stay plain.
  local hpager
  if command -v delta > /dev/null; then
    hpager='delta'
  elif command -v bat > /dev/null; then
    hpager='bat --color=always --style=plain --language=diff'
  elif command -v batcat > /dev/null; then
    hpager='batcat --color=always --style=plain --language=diff'
  else
    hpager='cat'
  fi

  local selected
  selected=$(
    _fzf_git_fzf -m \
      --border-label 'Hunks ' \
      --header 'TAB (mark) ╱ ENTER (stage marked) ╱ path shown left, @@ range right' \
      --delimiter '\t' --with-nth 3,4 \
      --preview "cat $tmp/f{2}.hdr $tmp/h{1}.body | $hpager" \
      --preview-window 'right,60%,border-left' < "$tmp/list" | cut -f1
  )

  if [[ -z $selected ]]; then
    rm -rf "$tmp"
    return
  fi

  # Group the chosen hunks by file, then apply each file's hunks (in order)
  # as one patch so line offsets stay consistent.
  typeset -A byfile
  local id fid
  for id in ${(f)selected}; do
    fid=$(awk -F'\t' -v n="$id" '$1==n{print $2; exit}' "$tmp/list")
    byfile[$fid]+="$id "
  done

  local patch=$tmp/apply.patch staged=0
  for fid in ${(k)byfile}; do
    cat "$tmp/f$fid.hdr" > "$patch"
    for id in ${(onz)byfile[$fid]}; do
      cat "$tmp/h$id.body" >> "$patch"
    done
    if git apply --cached --recount "$patch"; then
      staged=$(( staged + ${(w)#byfile[$fid]} ))
    else
      echo "Failed to stage some hunks in file id $fid" >&2
    fi
  done
  [[ $staged -gt 0 ]] && echo "Staged $staged hunk(s)" >&2

  rm -rf "$tmp"
}

_fzf_git_branches() {
  _fzf_git_check || return
  git branch --sort=-committerdate --sort=-HEAD \
    --format=$'%(HEAD) %(color:yellow)%(refname:short) %(color:green)(%(committerdate:relative))\t%(color:blue)%(subject)%(color:reset)' \
    --color=$(__fzf_git_color) | column -ts$'\t' |
  _fzf_git_fzf --ansi \
    --border-label 'Branches ' \
    --header 'ALT-A (all branches) ╱ ALT-H (commit hashes) ╱ ALT-ENTER (name without remote)' \
    --tiebreak begin \
    --color hl:underline,hl+:underline \
    --no-hscroll \
    --preview-window down,border-top,40% \
    --bind 'ctrl-/:change-preview-window(down,70%|hidden|)' \
    --bind $'alt-a:change-border-label(All branches)+reload:git branch -a --sort=-committerdate --sort=-HEAD --format=\'%(HEAD) %(color:yellow)%(refname:short) %(color:green)(%(committerdate:relative))\t%(color:blue)%(subject)%(color:reset)\' --color=always | column -ts\'\t\'' \
    --bind "alt-h:become:LIST_OPTS=\$(cut -c3- <<< {} | cut -d' ' -f1) zsh \"$__fzf_git\" --run hashes" \
    --bind "alt-enter:become:printf '%s\n' {+} | cut -c3- | sed 's@[^/]*/@@'" \
    --preview "git log --oneline --graph --date=short --color=$(__fzf_git_color .) --pretty='format:%C(auto)%cd %h%d %s' \$(cut -c3- <<< {} | cut -d' ' -f1) --" "$@" |
  sed 's/^\* //' | awk '{print $1}'
}

_fzf_git_tags() {
  _fzf_git_check || return
  git tag --sort -version:refname |
  _fzf_git_fzf --preview-window right,70% \
    --border-label 'Tags ' \
    --preview "git show --color=$(__fzf_git_color .) {} | $(__fzf_git_pager)" "$@"
}

_fzf_git_hashes() {
  _fzf_git_check || return
  git log --date=short --format="%C(green)%C(bold)%cd %C(auto)%h%d %s (%an)" --graph --color=$(__fzf_git_color) $LIST_OPTS |
  _fzf_git_fzf --ansi --no-sort --bind 'ctrl-s:toggle-sort' \
    --border-label 'Hashes ' \
    --header 'CTRL-D (diff) ╱ CTRL-S (toggle sort) ╱ ALT-A (all hashes)' \
    --color hl:underline,hl+:underline \
    --bind "ctrl-d:execute:grep -o '[a-f0-9]\{7,\}' <<< {} | head -n 1 | xargs git diff --color=$(__fzf_git_color) > /dev/tty" \
    --bind "alt-a:change-border-label(All hashes)+reload:git log --date=short --format='%C(green)%C(bold)%cd %C(auto)%h%d %s (%an)' --graph --color=always --all" \
    --preview "grep -o '[a-f0-9]\{7,\}' <<< {} | head -n 1 | xargs git show --color=$(__fzf_git_color .) | $(__fzf_git_pager)" "$@" |
  awk 'match($0, /[a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9][a-f0-9]*/) { print substr($0, RSTART, RLENGTH) }'
}

_fzf_git_remotes() {
  _fzf_git_check || return
  git remote -v | awk '{print $1 "\t" $2}' | uniq |
  _fzf_git_fzf --tac \
    --border-label 'Remotes ' \
    --preview-window right,70% \
    --preview "git log --oneline --graph --date=short --color=$(__fzf_git_color .) --pretty='format:%C(auto)%cd %h%d %s' '{1}/$(git rev-parse --abbrev-ref HEAD)' --" "$@" |
  cut -d$'\t' -f1
}

_fzf_git_stashes() {
  _fzf_git_check || return
  git stash list | _fzf_git_fzf \
    --border-label 'Stashes ' \
    --header 'CTRL-X (drop stash)' \
    --bind 'ctrl-x:reload(git stash drop -q {1}; git stash list)' \
    -d: --preview "git show --color=$(__fzf_git_color .) {1} | $(__fzf_git_pager)" "$@" |
  cut -d: -f1
}

_fzf_git_lreflogs() {
  _fzf_git_check || return
  git reflog --color=$(__fzf_git_color) --format="%C(blue)%gD %C(yellow)%h%C(auto)%d %gs" |
  _fzf_git_fzf --ansi \
    --border-label 'Reflogs ' \
    --preview "git show --color=$(__fzf_git_color .) {1} | $(__fzf_git_pager)" "$@" |
  awk '{print $1}'
}

_fzf_git_each_ref() {
  _fzf_git_check || return
  git for-each-ref --sort=-creatordate --sort=-HEAD --color=$(__fzf_git_color) --exclude='refs/remotes' \
    --format=$'%(if:equals=refs/remotes)%(refname:rstrip=-2)%(then)%(color:magenta)remote-branch%(else)%(if:equals=refs/heads)%(refname:rstrip=-2)%(then)%(color:brightgreen)branch%(else)%(if:equals=refs/tags)%(refname:rstrip=-2)%(then)%(color:brightcyan)tag%(else)%(if:equals=refs/stash)%(refname:rstrip=-2)%(then)%(color:brightred)stash%(else)%(color:white)%(refname:rstrip=-2)%(end)%(end)%(end)%(end)\t%(color:yellow)%(refname:short) %(color:green)(%(creatordate:relative))\t%(color:blue)%(subject)%(color:reset)' |
  column -ts$'\t' |
  _fzf_git_fzf --ansi \
    --nth 2,2.. \
    --tiebreak begin \
    --border-label 'Each ref ' \
    --header 'ALT-A (all refs, incl. remotes)' \
    --preview-window down,border-top,40% \
    --color hl:underline,hl+:underline \
    --no-hscroll \
    --bind 'ctrl-/:change-preview-window(down,70%|hidden|)' \
    --bind $'alt-a:change-border-label(Every ref)+reload:git for-each-ref --sort=-creatordate --sort=-HEAD --color=always --format=\'%(if:equals=refs/remotes)%(refname:rstrip=-2)%(then)%(color:magenta)remote-branch%(else)%(if:equals=refs/heads)%(refname:rstrip=-2)%(then)%(color:brightgreen)branch%(else)%(if:equals=refs/tags)%(refname:rstrip=-2)%(then)%(color:brightcyan)tag%(else)%(if:equals=refs/stash)%(refname:rstrip=-2)%(then)%(color:brightred)stash%(else)%(color:white)%(refname:rstrip=-2)%(end)%(end)%(end)%(end)\t%(color:yellow)%(refname:short) %(color:green)(%(creatordate:relative))\t%(color:blue)%(subject)%(color:reset)\' | column -ts\'\t\'' \
    --preview "git log --oneline --graph --date=short --color=$(__fzf_git_color .) --pretty='format:%C(auto)%cd %h%d %s' {2} --" "$@" |
  awk '{print $2}'
}

_fzf_git_worktrees() {
  _fzf_git_check || return
  git worktree list | _fzf_git_fzf \
    --border-label 'Worktrees ' \
    --header 'CTRL-X (remove worktree)' \
    --bind 'ctrl-x:reload(git worktree remove {1} > /dev/null; git worktree list)' \
    --preview "
      git -c color.status=$(__fzf_git_color .) -C {1} status --short --branch
      echo
      git log --oneline --graph --date=short --color=$(__fzf_git_color .) --pretty='format:%C(auto)%cd %h%d %s' {2} --
    " "$@" |
  awk '{print $1}'
}

# --- minimal --run dispatcher (only for the Alt-H become hop) ---------------
if [[ $1 == --run ]]; then
  shift
  type=$1
  shift
  _fzf_git_"$type" "$@"
  return 0 2>/dev/null || exit 0
fi

# --- interactive layer: zsh ZLE widgets + bindkey ---------------------------
__fzf_git_join() {
  local item
  while read item; do
    echo -n "${(q)item} "
  done
}

__fzf_git_init() {
  local m o
  for o in "$@"; do
    eval "fzf-git-$o-widget() { local result=\$(_fzf_git_$o | __fzf_git_join); zle reset-prompt; LBUFFER+=\$result }"
    eval "zle -N fzf-git-$o-widget"
    for m in emacs vicmd viins; do
      eval "bindkey -M $m '^g^${o[1]}' fzf-git-$o-widget"
      eval "bindkey -M $m '^g${o[1]}'  fzf-git-$o-widget"
    done
  done
}

__fzf_git_init files branches tags remotes hashes stashes lreflogs each_ref worktrees

# Hunk picker gets a manual binding: its name starts with 'h' (collides with
# `hashes` in the auto-init loop) and it stages directly rather than inserting
# text on the command line. Bound to CTRL-G CTRL-P (p = patch).
fzf-git-hunks-widget() { _fzf_git_hunks; zle reset-prompt }
zle -N fzf-git-hunks-widget
for m in emacs vicmd viins; do
  bindkey -M $m '^g^p' fzf-git-hunks-widget
  bindkey -M $m '^gp'  fzf-git-hunks-widget
done
