# ==== chaCon zshrc ====

source $HOME/.chaCon

# ── Always-on modules ──────────────────────────────────────────────────────────
source $HOME/.local/zshrc/personal
source $HOME/.local/zshrc/fzf
source $HOME/.local/zshrc/lsd
source $HOME/.local/zshrc/zoxie
source $HOME/.local/zshrc/opencode

# ── Platform: macOS only ───────────────────────────────────────────────────────
[[ "$(uname)" == "Darwin" ]] && \
  [[ -f "$HOME/.local/zshrc/brew" ]] && source $HOME/.local/zshrc/brew

# ── Optional modules (add the file locally on machines that need them) ─────────
[[ -f "$HOME/.local/zshrc/kafka" ]] && source $HOME/.local/zshrc/kafka
[[ -f "$HOME/.local/zshrc/kube"  ]] && source $HOME/.local/zshrc/kube
[[ -f "$HOME/.local/zshrc/tails" ]] && source $HOME/.local/zshrc/tails
