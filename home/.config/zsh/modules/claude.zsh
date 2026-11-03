# vim: ft=zsh
#
# Work vs personal account, chosen by the folder you launch from.
#
#                       pi config (MCP, sessions)   Claude account
#   ~/github.com/chaCon/**  ~/.pi/agent-personal    ~/.claude       (montt.octavio@gmail.com)
#   everywhere else         ~/.pi/agent             ~/.claude-work  (octavio.montt@tails.com)
#
# pi uses Claude through pi-claude-bridge, which runs the `claude` CLI and
# inherits CLAUDE_CONFIG_DIR. MCP servers live in each pi dir's mcp.json, so
# `pi mcp add` lands in whichever account the current folder belongs to.
# Everything else (settings, extensions, skills, themes, AGENTS.md) is shared:
# the personal dir symlinks it from ~/.pi/agent.
#
# Personal must leave CLAUDE_CONFIG_DIR *unset*: setting it (even to ~/.claude)
# makes Claude Code use a different keychain entry, which looks logged out.
# First-time login per account: run `claude` in a folder of that type, then /login.

__claude_is_personal() { [[ "${PWD:A}/" == "$HOME/github.com/chaCon/"* ]]; }

__pi_personal_dir_ensure() {
  local shared="$HOME/.pi/agent" personal="$HOME/.pi/agent-personal" item
  mkdir -p "$personal"
  for item in AGENTS.md settings.json claude-bridge.json extensions npm skills themes; do
    [[ -e "$shared/$item" && ! -e "$personal/$item" ]] && ln -s "$shared/$item" "$personal/$item"
  done
}

__claude_run() {
  if __claude_is_personal; then
    __pi_personal_dir_ensure
    env -u CLAUDE_CONFIG_DIR PI_CODING_AGENT_DIR="$HOME/.pi/agent-personal" "$@"
  else
    env CLAUDE_CONFIG_DIR="$HOME/.claude-work" PI_CODING_AGENT_DIR="$HOME/.pi/agent" "$@"
  fi
}

pi()     { __claude_run pi "$@"; }
claude() { __claude_run claude "$@"; }
