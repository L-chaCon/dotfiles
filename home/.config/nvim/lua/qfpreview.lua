-- Floating preview above the quickfix/location window of the entry under the
-- cursor. P in the list toggles it. The file goes into a scratch buffer (no
-- ftplugins, no LSP attaching), highlighted with treesitter or plain syntax.
local enabled = true
local win, buf, shown

local function close()
  if win and vim.api.nvim_win_is_valid(win) then
    vim.api.nvim_win_close(win, true)
  end
  win, shown = nil, nil
end

local function show()
  local qfwin = vim.api.nvim_get_current_win()
  local loc = vim.fn.getwininfo(qfwin)[1].loclist == 1
  local item = (loc and vim.fn.getloclist(0) or vim.fn.getqflist())[vim.fn.line(".")]
  if not item or item.valid ~= 1 or item.bufnr == 0 then
    return close()
  end

  -- Room above the list: screen rows minus the border
  local height = math.min(20, vim.fn.win_screenpos(qfwin)[1] - 3)
  if height < 3 then
    return close()
  end

  local name = vim.api.nvim_buf_get_name(item.bufnr)
  if not (buf and vim.api.nvim_buf_is_valid(buf)) then
    buf = vim.api.nvim_create_buf(false, true)
    shown = nil
  end
  if shown ~= name then
    local lines
    if vim.api.nvim_buf_is_loaded(item.bufnr) then
      lines = vim.api.nvim_buf_get_lines(item.bufnr, 0, -1, false)
    else
      local ok, read = pcall(vim.fn.readfile, name)
      if not ok then
        return close()
      end
      lines = read
    end
    pcall(vim.treesitter.stop, buf)
    vim.bo[buf].syntax = ""
    vim.api.nvim_buf_set_lines(buf, 0, -1, false, lines)
    local ft = vim.filetype.match({ filename = name }) or ""
    local lang = vim.treesitter.language.get_lang(ft)
    if not (lang and pcall(vim.treesitter.start, buf, lang)) then
      vim.bo[buf].syntax = ft
    end
    shown = name
  end

  local cfg = {
    relative = "win",
    win = qfwin,
    row = -(height + 2),
    col = 0,
    width = vim.api.nvim_win_get_width(qfwin) - 2,
    height = height,
    border = "rounded",
    title = " " .. vim.fn.fnamemodify(name, ":~:.") .. " ",
    title_pos = "center",
  }
  if win and vim.api.nvim_win_is_valid(win) then
    vim.api.nvim_win_set_config(win, cfg)
  else
    cfg.style, cfg.focusable = "minimal", false
    win = vim.api.nvim_open_win(buf, false, cfg)
    vim.wo[win].number = true
    vim.wo[win].cursorline = true
  end
  local lnum = math.max(1, math.min(item.lnum, vim.api.nvim_buf_line_count(buf)))
  vim.api.nvim_win_set_cursor(win, { lnum, math.max(item.col - 1, 0) })
  vim.api.nvim_win_call(win, function()
    vim.cmd("normal! zz")
  end)
end

vim.api.nvim_create_autocmd("FileType", {
  group = vim.api.nvim_create_augroup("qf_preview", { clear = true }),
  pattern = "qf",
  callback = function(ev)
    vim.api.nvim_create_autocmd({ "CursorMoved", "WinEnter" }, {
      buffer = ev.buf,
      callback = function()
        if enabled then
          show()
        end
      end,
    })
    vim.api.nvim_create_autocmd({ "WinLeave", "BufHidden" }, { buffer = ev.buf, callback = close })
    vim.keymap.set("n", "P", function()
      enabled = not enabled
      if enabled then
        show()
      else
        close()
      end
    end, { buffer = ev.buf, desc = "Toggle quickfix preview" })
    -- :copen enters the window before it becomes a qf buffer; preview right away
    vim.schedule(function()
      if enabled and vim.api.nvim_get_current_buf() == ev.buf then
        show()
      end
    end)
  end,
})
