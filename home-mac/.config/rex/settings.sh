#!/usr/bin/env bash
# Apply my Rex app settings. Rex keeps these in macOS preferences
# (com.superlogical.rex), not in init.lua, so this script is the dotfiles copy.
# Quit Rex before running it, otherwise the app can overwrite the values.
#
# To capture a setting changed in the GUI:
#   defaults read com.superlogical.rex | grep Workspace.
#   defaults read-type com.superlogical.rex <key>
set -euo pipefail

d=com.superlogical.rex
w() { defaults write "$d" "$@"; }

if pgrep -xq Rex; then
  echo "Rex is running; quit it first so it doesn't overwrite these." >&2
  exit 1
fi

# Theme: Nightfox, imported from themes/nightfox. custom-themes.json is Rex's
# own copy of it (Workspace.customThemes). Only restored when this Mac has no
# custom themes yet, so it never replaces themes made here.
here="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"  # stowed beside this script
if defaults read "$d" Workspace.customThemes >/dev/null 2>&1; then
  echo "Custom themes already exist; leaving them. Import themes/nightfox by hand if it's missing."
else
  w Workspace.customThemes -data "$(python3 -I -c 'import json,sys; print(json.dumps(json.load(open(sys.argv[1])), separators=(",", ":")).encode().hex())' "$here/custom-themes.json")"
fi
w Workspace.darkThemeID -string "custom-B5E35F28-E908-4647-91BA-C380354CCCC1"

# Typography
w Workspace.terminalFontName -string "JetBrains Mono"
w Workspace.terminalFontPointSize -float 17
w Workspace.terminalFontSmoothing -bool false

# Terminal
w Workspace.terminalCursorStyle -string block
w Workspace.terminalCopyOnSelect -bool true
w Workspace.terminalSmoothScrolling -bool false

# Appearance
w Workspace.appearance -string system
w Workspace.interfaceStyle -string useTheme
w Workspace.inactivePaneFadeMode -string both
w Workspace.cursorShadersEnabled -bool false

# Layout
w Workspace.tabStyle -string horizontal # tabs in a bar (no sidebar)
w Workspace.tabBarEdge -string bottom
w Workspace.tabIconTintMode -string off
w Workspace.sidebarPosition -string left
w Workspace.sidebarShowsActivity -bool false
w Workspace.showsKeySequenceHints -bool true

# Experimental: Go to Anything (cmd+p, ctrl+b w) is unavailable without it.
w Workspace.experiments.usesNewQuickSwitcher -bool true

echo "Rex settings applied."
