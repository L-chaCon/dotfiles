-- Sessionizer: pick a project folder; switch to its session, or create one (project.lua).
local project = require("project")
local home = os.getenv("HOME")
local roots = { "workspace", ".config", "github.com/chaCon", "github.com/tails.com", "workspace/spikes" }

rex.action({
  name = "sessionizer",
  title = "Sessionizer…",
  run = function()
    local argv = { "fd", "-H", "--max-depth=1", "--type", "d", "." }
    for _, r in ipairs(roots) do
      argv[#argv + 1] = home .. "/" .. r
    end
    local found = rex.exec(argv, { timeout = 5, env = { PATH = "/opt/homebrew/bin:/usr/bin:/bin" } })
    local items = {}
    for line in ((found and found.stdout) or ""):gmatch("[^\n]+") do
      local dir = line:gsub("/$", "")
      items[#items + 1] = { id = dir, title = dir:match("[^/]+$"), subtitle = "~" .. dir:sub(#home + 1), icon = "folder" }
    end

    local dir = rex.ui.pick({ title = "Sessionizer", placeholder = "Project", items = items })
    if dir then
      project.open(dir, dir:match("[^/]+$"))
    end
  end,
})

rex.bind("ctrl+space", "sessionizer")
