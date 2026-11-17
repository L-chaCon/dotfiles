-- Herdr app integration (the my-files panel, home/.config/herdr-app/mods/my-files).
-- Only when nvim runs in a Herdr terminal (HC_TERMINAL_ID is set):
--   * listens on <state>/herdr/<terminal>.sock, so the panel can open files here
--     (`nvim --server <sock> --remote-expr "v:lua.HerdrOpen('<path>', '<cmd>')"`);
--   * keeps <state>/herdr/<terminal>.json = {"sock", "file"} up to date, so the panel
--     can follow the file shown here. Both go away when nvim quits.
-- A nested nvim in the same terminal (e.g. a commit message editor) finds the socket
-- taken and stays out of it.
local id = vim.env.HC_TERMINAL_ID
if not id or id == "" or vim.tbl_contains(vim.v.argv, "--headless") then
  return
end

local dir = vim.fn.stdpath("state") .. "/herdr"
vim.fn.mkdir(dir, "p")
local sock = dir .. "/" .. id .. ".sock"
local state = dir .. "/" .. id .. ".json"

-- A socket left by a crashed nvim is removed; a live one belongs to an outer nvim.
if vim.uv.fs_stat(sock) then
  local ok, ch = pcall(vim.fn.sockconnect, "pipe", sock, { rpc = true })
  if ok and ch > 0 then
    vim.fn.chanclose(ch)
    return
  end
  os.remove(sock)
end
if not pcall(vim.fn.serverstart, sock) then
  return
end

local last
local function publish()
  local buf = vim.api.nvim_get_current_buf()
  if vim.bo[buf].buftype ~= "" then
    return
  end
  local file = vim.api.nvim_buf_get_name(buf)
  file = file ~= "" and vim.fn.fnamemodify(file, ":p") or vim.NIL
  if file == last then
    return
  end
  last = file
  vim.fn.writefile({ vim.json.encode({ sock = sock, file = file }) }, state)
end
publish()

local group = vim.api.nvim_create_augroup("user_herdr", { clear = true })
vim.api.nvim_create_autocmd({ "BufEnter", "BufFilePost", "FocusGained" }, { group = group, callback = publish })
vim.api.nvim_create_autocmd("VimLeavePre", {
  group = group,
  callback = function()
    os.remove(state)
  end,
})

-- Opens `path` from the panel. `how`: "edit" (default) or "vsplit". Never lands in a
-- floating, terminal or other special window; a file already shown is jumped to.
function _G.HerdrOpen(path, how)
  if vim.fn.mode():sub(1, 1) ~= "n" then
    vim.cmd("stopinsert")
  end
  local function usable(win)
    return vim.api.nvim_win_get_config(win).relative == "" and vim.bo[vim.api.nvim_win_get_buf(win)].buftype == ""
  end
  if not usable(0) then
    for _, win in ipairs(vim.api.nvim_tabpage_list_wins(0)) do
      if usable(win) then
        vim.api.nvim_set_current_win(win)
        break
      end
    end
  end
  local cmd = how == "vsplit" and "vsplit" or "drop"
  local ok, err = pcall(vim.cmd, cmd .. " " .. vim.fn.fnameescape(path))
  return ok and "ok" or tostring(err)
end
