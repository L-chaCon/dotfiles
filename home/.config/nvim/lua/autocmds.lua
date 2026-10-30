local function augroup(name)
  return vim.api.nvim_create_augroup("user_" .. name, { clear = true })
end
local autocmd = vim.api.nvim_create_autocmd

-- Treesitter highlighting, folds and indent for any filetype with a parser
autocmd("FileType", {
  group = augroup("treesitter"),
  callback = function(ev)
    if not pcall(vim.treesitter.start, ev.buf) then
      return
    end
    vim.wo[0][0].foldmethod = "expr"
    vim.wo[0][0].foldexpr = "v:lua.vim.treesitter.foldexpr()"
    local lang = vim.treesitter.language.get_lang(vim.bo[ev.buf].filetype)
    if lang and vim.treesitter.query.get(lang, "indents") then
      vim.bo[ev.buf].indentexpr = "v:lua.require'nvim-treesitter'.indentexpr()"
    end
  end,
})

-- Reload a file that changed outside nvim
autocmd({ "FocusGained", "TermClose", "TermLeave" }, {
  group = augroup("checktime"),
  callback = function()
    if vim.o.buftype ~= "nofile" then
      vim.cmd("checktime")
    end
  end,
})

autocmd("TextYankPost", {
  group = augroup("highlight_yank"),
  callback = function()
    vim.hl.on_yank()
  end,
})

-- Keep splits equal when the terminal resizes
autocmd("VimResized", {
  group = augroup("resize_splits"),
  callback = function()
    local current_tab = vim.fn.tabpagenr()
    vim.cmd("tabdo wincmd =")
    vim.cmd("tabnext " .. current_tab)
  end,
})

-- Reopen files at the last cursor position
autocmd("BufReadPost", {
  group = augroup("last_loc"),
  callback = function(ev)
    local exclude = { "gitcommit" }
    if vim.tbl_contains(exclude, vim.bo[ev.buf].filetype) or vim.b[ev.buf].last_loc then
      return
    end
    vim.b[ev.buf].last_loc = true
    local mark = vim.api.nvim_buf_get_mark(ev.buf, '"')
    if mark[1] > 0 and mark[1] <= vim.api.nvim_buf_line_count(ev.buf) then
      pcall(vim.api.nvim_win_set_cursor, 0, mark)
    end
  end,
})

-- Close throwaway windows with q
autocmd("FileType", {
  group = augroup("close_with_q"),
  pattern = { "help", "qf", "man", "checkhealth", "gitsigns-blame", "notify" },
  callback = function(ev)
    vim.bo[ev.buf].buflisted = false
    vim.keymap.set("n", "q", "<cmd>close<cr>", { buffer = ev.buf, silent = true, desc = "Quit buffer" })
  end,
})

-- Wrap and spell-check prose
autocmd("FileType", {
  group = augroup("wrap_spell"),
  pattern = { "text", "plaintex", "typst", "gitcommit", "markdown" },
  callback = function()
    vim.opt_local.wrap = true
    vim.opt_local.spell = true
  end,
})

-- Create missing parent directories on save
autocmd("BufWritePre", {
  group = augroup("auto_create_dir"),
  callback = function(ev)
    if ev.match:match("^%w%w+:[\\/][\\/]") then
      return
    end
    local file = vim.uv.fs_realpath(ev.match) or ev.match
    vim.fn.mkdir(vim.fn.fnamemodify(file, ":p:h"), "p")
  end,
})

-- QFix list: :Cfilter /pat/ keeps matching entries, :Cfilter! /pat/ drops them
vim.cmd.packadd("cfilter")

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
