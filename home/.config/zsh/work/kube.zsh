# vim: ft=zsh

alias k="kubectl"
alias kctx="k ctx"
alias kns="k ns"

k8h() {
  if [[ -z ${1:-} ]]; then
    echo "Usage: k8h DEPLOYMENT_NAME"
    return 1
  fi

  kubectl rollout history "$1" -o yaml |
    grep --color=auto --exclude-dir={.bzr,CVS,.git,.hg,.svn,.idea,.tox,.venv,venv} -E 'revision|image:'
}

export PATH="${KREW_ROOT:-$HOME/.krew}/bin:$PATH"

# Open k9s on the context picker; once a context is picked, land on namespaces.
# k9s remembers the last view per context, so reset it to namespaces on every launch.
k9s() {
  local clusters
  if [[ $OSTYPE == darwin* ]]; then
    clusters="$HOME/Library/Application Support/k9s/clusters"
  else
    clusters="${XDG_DATA_HOME:-$HOME/.local/share}/k9s/clusters"
  fi

  if [[ -d $clusters ]]; then
    find "$clusters" -name config.yaml -exec \
      sed -i.bak -E '/^  view:/,/^  [^ ]/ s/^(    active:).*/\1 ns/' {} + 2>/dev/null
    find "$clusters" -name config.yaml.bak -delete
  fi

  command k9s -c ctx "$@"
}
