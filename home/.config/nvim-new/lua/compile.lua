-- Emacs `M-x compile` on the quickfix list. :Compile {cmd} runs the command
-- async and streams its output into the quickfix window: <CR> on an error
-- jumps to it, ]q [q walk them. :Compile with no args reruns the last one.
-- In an oil buffer it runs in the folder oil shows, elsewhere in the cwd.
local M = {}

local last = { cmd = nil, dir = nil }
local job

-- Run fn with this window's cwd set to dir, so the quickfix list resolves
-- relative paths in the output (src/main.c:3:1) against where the command ran
local function in_dir(dir, fn)
  local global, tab, win = vim.fn.getcwd(-1, -1), vim.fn.getcwd(-1, 0), vim.fn.getcwd()
  local had_win, had_tab = vim.fn.haslocaldir() == 1, vim.fn.haslocaldir(-1, 0) == 1
  vim.cmd("noautocmd lcd " .. vim.fn.fnameescape(dir))
  pcall(fn)
  if had_win then
    vim.cmd("noautocmd lcd " .. vim.fn.fnameescape(win))
  elseif had_tab then
    vim.cmd("noautocmd tcd " .. vim.fn.fnameescape(tab))
  else
    vim.cmd("noautocmd cd " .. vim.fn.fnameescape(global))
  end
end

local function open_qf()
  if vim.fn.getqflist({ winid = 0 }).winid == 0 then
    vim.cmd(("botright copen %d"):format(math.max(10, math.floor(vim.o.lines * 0.4))))
    vim.cmd.wincmd("p") -- like Emacs, show the output but stay where you were
  end
end

function M.run(cmd, dir)
  if job then
    job:kill("sigterm")
  end
  last = { cmd = cmd, dir = dir }
  local start = vim.uv.hrtime()
  vim.fn.setqflist({}, " ", { title = ("%s  (%s)"):format(cmd, vim.fn.fnamemodify(dir, ":~")) })
  local id = vim.fn.getqflist({ id = 0 }).id
  local function append(what)
    -- The list may have been replaced by :grep or a newer :Compile
    if vim.fn.getqflist({ id = id }).id ~= id then
      return
    end
    what.id = id
    in_dir(dir, function()
      vim.fn.setqflist({}, "a", what)
    end)
    local winid = vim.fn.getqflist({ winid = 0 }).winid
    if winid ~= 0 and vim.api.nvim_get_current_win() ~= winid then
      vim.api.nvim_win_call(winid, function()
        vim.cmd("normal! G")
      end)
    end
  end
  append({ items = { { text = "-*- Compiling in " .. dir .. " -*-" } } })
  open_qf()

  local pending = ""
  local function on_output(_, data)
    if not data then
      return
    end
    pending = pending .. data
    local lines = vim.split(pending, "\n", { plain = true })
    pending = table.remove(lines)
    if #lines > 0 then
      vim.schedule(function()
        append({ lines = lines })
      end)
    end
  end

  -- `{ cmd\n} 2>&1` keeps stdout and stderr in order, even for pipelines
  job = vim.system({ vim.o.shell, vim.o.shellcmdflag, "{ " .. cmd .. "\n} 2>&1" }, {
    cwd = dir,
    stdout = on_output,
    env = { TERM = "dumb" },
  }, function(res)
    vim.schedule(function()
      job = nil
      if pending ~= "" then
        append({ lines = { pending } })
        pending = ""
      end
      local secs = (vim.uv.hrtime() - start) / 1e9
      local msg = res.code == 0 and "Compilation finished"
        or res.signal ~= 0 and "Compilation killed"
        or ("Compilation exited abnormally with code %d"):format(res.code)
      append({ items = { { text = ("%s at %s (%.1fs)"):format(msg, os.date("%H:%M:%S"), secs) } } })
    end)
  end)
end

-- Where :Compile runs: the folder oil shows, else nvim's cwd
function M.dir()
  local ok, oil = pcall(require, "oil")
  return ok and oil.get_current_dir() or vim.fn.getcwd()
end

vim.api.nvim_create_user_command("Compile", function(opts)
  if opts.args ~= "" then
    M.run(opts.args, M.dir())
  elseif last.cmd then
    M.run(last.cmd, last.dir)
  else
    vim.notify("Compile: no previous command", vim.log.levels.WARN)
  end
end, { nargs = "*", complete = "shellcmd", desc = "Run a command, output to quickfix" })

vim.api.nvim_create_user_command("CompileKill", function()
  if job then
    job:kill("sigterm")
  end
end, { desc = "Stop the running :Compile" })

-- Like Emacs' compile prompt: offers the last command to edit
vim.keymap.set("n", "<leader>cc", function()
  vim.api.nvim_feedkeys(":Compile " .. (last.cmd or ""), "n", false)
end, { desc = "Compile" })
vim.keymap.set("n", "<leader>cC", "<cmd>Compile<cr>", { desc = "Recompile (last command)" })

return M
