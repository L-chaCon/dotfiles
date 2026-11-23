-- vim-tmux-navigator: ctrl+h/j/k/l go to nvim when the pane runs it, else to the
-- pane that way. nvim moves between its own windows and, at its edge, runs
-- `rex focus <direction>` (nvim/lua/rex.lua). Based on rex-navigator.nvim.
local function in_nvim(ctx)
  local p = rex.block.call("com.superlogical.terminal", "process", {
    session_id = ctx.session_id,
    block_id = ctx.block_id,
  })
  return p and p.foreground and p.foreground.name == "nvim"
end

for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
  rex.action({
    name = "navigate_" .. direction,
    title = "Navigate " .. direction .. " (nvim aware)",
    repeats = true,
    run = function(ctx)
      if in_nvim(ctx) then
        rex.client.queue("pane.send_key", { key = "ctrl+" .. key })
      else
        rex.session.focus_direction({ direction = direction })
      end
    end,
  })
  rex.bind("ctrl+" .. key, "navigate_" .. direction)
end
