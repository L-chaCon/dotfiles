-- Rex configuration: https://www.superlogical.com/rex/docs/customize/config
-- Read by the Rex server. Apply changes with: rex config reload
--
-- init.lua only covers key bindings, actions, modes and hosts. App settings
-- (theme, font, tab style...) live in macOS preferences; see settings.sh here.
-- Rex's names: session = tmux session, tab = tmux window, pane = pane.

require("navigator") -- ctrl+h/j/k/l
require("sessionizer") -- ctrl+space
require("worktree") -- ctrl+b g / ctrl+b G
require("urls") -- ctrl+b u / ctrl+b U

-- tmux prefix: ctrl+b, then one key.
local prefix = {
  ["ctrl+b"] = { "pane.send_key", { key = "ctrl+b" } }, -- twice sends ctrl+b
  c = { "client.tab.new" },
  n = { "client.tab.next" },
  p = { "client.tab.previous" },
  [","] = { "client.tab.rename" },
  ["shift+7"] = { "client.tab.close" }, -- &
  s = { "session.switch" },
  w = { "pane.go_to" },
  ["shift+9"] = { "session.previous" }, -- (
  ["shift+0"] = { "session.next" }, -- )
  ["shift+4"] = { "session.rename" }, -- $
  v = { "pane.split", { direction = "right" } },
  ["-"] = { "pane.split", { direction = "down" } },
  x = { "pane.close" },
  z = { "pane.zoom" },
  ["["] = { "client.find.open" },
  ["shift+/"] = { "client.palette.toggle" }, -- ?
}
for i = 1, 9 do
  prefix[tostring(i)] = { "client.tab.goto", { index = i } }
end
for key, b in pairs(prefix) do
  rex.bind("ctrl+b>" .. key, b[1], b[2])
end
