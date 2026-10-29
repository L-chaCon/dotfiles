-- Autocmds are automatically loaded on the VeryLazy event
-- Default autocmds that are always set: https://github.com/LazyVim/LazyVim/blob/main/lua/lazyvim/config/autocmds.lua
--
-- Add any additional autocmds here
-- with `vim.api.nvim_create_autocmd`
--
-- Or remove existing autocmds by their group name (which is prefixed with `lazyvim_` for the defaults)
-- e.g. vim.api.nvim_del_augroup_by_name("lazyvim_wrap_spell")

-- Markdown: keep ``` fences and other markup visible (treesitter conceals them)
vim.api.nvim_create_autocmd("FileType", {
  group = vim.api.nvim_create_augroup("markdown_no_conceal", { clear = true }),
  pattern = { "markdown" },
  callback = function()
    vim.opt_local.conceallevel = 0
  end,
})

-- QFix list
vim.api.nvim_create_user_command("QFRemoveCurrent", function()
  local qf = vim.fn.getqflist({ idx = 0, items = 0 })

  -- No quickfix list or invalid index
  if not qf.items or #qf.items == 0 or qf.idx == 0 then
    return
  end

  -- Remove current entry (idx is 1-based)
  table.remove(qf.items, qf.idx)

  -- Replace quickfix list
  vim.fn.setqflist({}, "r", {
    items = qf.items,
    idx = math.min(qf.idx, #qf.items),
  })
end, {})

-- :make output often comes from Docker. Map container paths to this machine
-- (/app/x -> x, site-packages -> local .venv/venv), and turn entries whose
-- file doesn't exist (timestamps read as "file:line", libraries not installed
-- locally) back into plain text so ]q skips them. Runs before :make jumps.
vim.api.nvim_create_autocmd("QuickFixCmdPost", {
  group = vim.api.nvim_create_augroup("qf_local_paths", { clear = true }),
  pattern = { "make", "lmake" },
  callback = function(ev)
    local loc = ev.match == "lmake"
    local what = { items = 0, title = 0 }
    local list = loc and vim.fn.getloclist(0, what) or vim.fn.getqflist(what)
    local exists = function(path)
      return vim.uv.fs_stat(path) ~= nil
    end
    local function resolve(name)
      if exists(name) then
        return name
      end
      local rel = name:match("^/app/(.+)")
      if rel and exists(rel) then
        return rel
      end
      local ver, pkg = name:match("^/usr/local/lib/python([%d.]+)/site%-packages/(.+)")
      for _, venv in ipairs(pkg and { ".venv", "venv" } or {}) do
        local path = ("%s/lib/python%s/site-packages/%s"):format(venv, ver, pkg)
        if exists(path) then
          return path
        end
      end
    end

    local junk = {}
    for _, item in ipairs(list.items) do
      if item.valid == 1 and item.bufnr > 0 then
        local name = vim.fn.bufname(item.bufnr)
        local path = resolve(name)
        if path ~= name then
          if not vim.api.nvim_buf_is_loaded(item.bufnr) then
            junk[item.bufnr] = true
          end
          item.bufnr = nil
          if path then
            item.filename = path
          else
            local col = item.col > 0 and (":" .. item.col) or ""
            item.text = ("%s:%d%s:%s"):format(name, item.lnum, col, item.text)
            item.valid, item.lnum, item.col = 0, 0, 0
          end
        end
      end
    end

    -- :make jumps to the list's current entry; point it at the first real one
    local first = 1
    for i, item in ipairs(list.items) do
      if item.valid == 1 then
        first = i
        break
      end
    end
    local new = { items = list.items, title = list.title, idx = first }
    if loc then
      vim.fn.setloclist(0, {}, "r", new)
    else
      vim.fn.setqflist({}, "r", new)
    end
    for buf in pairs(junk) do
      pcall(vim.api.nvim_buf_delete, buf, {})
    end
  end,
})
