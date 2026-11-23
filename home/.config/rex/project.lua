-- A project session: three tabs, nvim and pi (both restart when they quit) and a
-- shell, landing on the shell. Used by the sessionizer and worktrees.
local M = {}

local function tab(label, dir, cmd)
  local options = { cwd = dir }
  if cmd then
    -- Login + interactive zsh so programs get ~/.zshrc's env.
    options.command = { "zsh", "-lic", "while true; do " .. cmd .. "; done" }
    options.shell = "none"
  end
  return {
    window_label = label,
    layout = rex.layout.block({ flavor = "com.superlogical.terminal.shell", options = options }),
  }
end

-- The session labelled `label`, if there is one.
function M.find(label)
  for _, s in ipairs(rex.call("session.list", {}).sessions or {}) do
    if s.label == label then
      return s.session_id
    end
  end
end

-- Switch to the session labelled `label`, creating it for `dir` first if needed.
function M.open(dir, label)
  local id = M.find(label)
  if not id then
    id = rex.call("session.create", {
      label = label,
      initial_windows = { tab("nvim", dir, "nvim"), tab("pi", dir, "pi"), tab("shell", dir) },
    }).session_id
  end
  rex.client.queue("session.select", { session_id = id })
end

return M
