-- vim-tmux-navigator for Rex: Ctrl-h/j/k/l move between windows and, at nvim's edge,
-- to the next Rex pane. Rex hands these keys to nvim (rex/navigator.lua). Replaces the
-- plain <C-w> mappings in keymaps.lua, which still apply outside Rex.
if not vim.env.REX_SESSION or vim.env.REX_SESSION == "" then
  return
end

for key, direction in pairs({ h = "left", j = "down", k = "up", l = "right" }) do
  vim.keymap.set("n", "<C-" .. key .. ">", function()
    local win = vim.api.nvim_get_current_win()
    vim.cmd("wincmd " .. key)
    if vim.api.nvim_get_current_win() == win then
      vim.system({ "rex", "focus", direction })
    end
  end, { desc = "Go to window or Rex pane " .. direction })
end
