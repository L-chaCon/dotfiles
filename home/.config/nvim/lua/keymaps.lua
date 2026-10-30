-- Built in, no mapping needed: ]q [q (quickfix), ]b [b (buffers), ]d [d
-- (diagnostics), gc/gcc (comment), K (hover). LSP keys are in lsp.lua, git
-- hunk keys in plugins.lua (gitsigns).
local map = vim.keymap.set

-- Moverse media pagina y centrar
map("n", "<C-d>", "<C-d>zz", { desc = "Half Page DOWN" })
map("n", "<C-u>", "<C-u>zz", { desc = "Half Page UP" })

-- Buscar y quedarse al medio
map("n", "n", "nzzzv")
map("n", "N", "Nzzzv")

-- Copiar a clipboard
map({ "n", "v" }, "<leader>y", '"+y', { desc = "Yank clipboard" })
map("n", "<leader>Y", 'gg"+yG', { desc = "Yank clipboard todo el buffer" })

-- Mover entremedio de funciones lineas
map("v", "J", ":m '>+1<CR>gv=gv", { silent = true, desc = "Mover todo entre funcion UP" })
map("v", "K", ":m '<-2<CR>gv=gv", { silent = true, desc = "Mover todo entre funcion DOWN" })

-- Wrapped lines move by screen line, counts still move by real line
map({ "n", "x" }, "j", "v:count == 0 ? 'gj' : 'j'", { expr = true, silent = true })
map({ "n", "x" }, "k", "v:count == 0 ? 'gk' : 'k'", { expr = true, silent = true })

-- TIP: Disable arrow keys in normal mode
map("n", "<left>", '<cmd>echo "Use h to move!!"<CR>')
map("n", "<right>", '<cmd>echo "Use l to move!!"<CR>')
map("n", "<up>", '<cmd>echo "Use k to move!!"<CR>')
map("n", "<down>", '<cmd>echo "Use j to move!!"<CR>')

-- Keep the selection when indenting
map("x", "<", "<gv")
map("x", ">", ">gv")

-- Windows
map("n", "<C-h>", "<C-w>h", { desc = "Go to Left Window" })
map("n", "<C-j>", "<C-w>j", { desc = "Go to Lower Window" })
map("n", "<C-k>", "<C-w>k", { desc = "Go to Upper Window" })
map("n", "<C-l>", "<C-w>l", { desc = "Go to Right Window" })
map("n", "<leader>-", "<C-w>s", { desc = "Split Window Below" })
map("n", "<leader>|", "<C-w>v", { desc = "Split Window Right" })
map("n", "<leader>wd", "<C-w>c", { desc = "Delete Window" })

-- Buffers, files, quit
map({ "i", "x", "n", "s" }, "<C-s>", "<cmd>w<cr><esc>", { desc = "Save File" })
map("n", "<leader>bb", "<cmd>e #<cr>", { desc = "Switch to Other Buffer" })
map("n", "<leader>bd", function() Snacks.bufdelete() end, { desc = "Delete Buffer" })
map("n", "<leader>bo", function() Snacks.bufdelete.other() end, { desc = "Delete Other Buffers" })
map("n", "<leader>fn", "<cmd>enew<cr>", { desc = "New File" })
map("n", "<leader>qq", "<cmd>qa<cr>", { desc = "Quit All" })

-- Copy current path
map("n", "<leader>fy", function()
  local path = vim.fn.expand("%:.")
  vim.fn.setreg("+", path)
  vim.notify("Copied: " .. path)
end, { desc = "Copy relative file path" })
map("n", "<leader>fY", function()
  local path = vim.fn.expand("%:p")
  vim.fn.setreg("+", path)
  vim.notify("Copied: " .. path)
end, { desc = "Copy full file path" })

-- Format with jq (for buffers that aren't .json files; .json formats on save)
map("n", "<leader>aj", "<cmd>%!jq --indent 4 .<cr>", { desc = "Autoformat JSON 4 indent" })
map("n", "<leader>as", "<cmd>%!jq -S .<cr>", { desc = "Sort JSON alphabetic" })
map("n", "<leader>ar", "<cmd>%!jq -r .<cr>", { desc = "RAW JSON" })
map("n", "<leader>ac", "<cmd>%!jq -c .<cr>", { desc = "Compact JSON" })
map("n", "<leader>aR", "<cmd>%!jq -Rs .<cr>", { desc = "UN-RAW JSON" })

-- Code
map({ "n", "x" }, "<leader>cf", function() require("conform").format() end, { desc = "Format" })
map("n", "<leader>cd", vim.diagnostic.open_float, { desc = "Line Diagnostics" })
local function diagnostic_jump(count, severity)
  return function()
    vim.diagnostic.jump({ count = count, float = true, severity = severity })
  end
end
map("n", "]e", diagnostic_jump(1, vim.diagnostic.severity.ERROR), { desc = "Next Error" })
map("n", "[e", diagnostic_jump(-1, vim.diagnostic.severity.ERROR), { desc = "Prev Error" })
map("n", "]w", diagnostic_jump(1, vim.diagnostic.severity.WARN), { desc = "Next Warning" })
map("n", "[w", diagnostic_jump(-1, vim.diagnostic.severity.WARN), { desc = "Prev Warning" })

-- Quickfix
map("n", "<leader>xq", function()
  if vim.fn.getqflist({ winid = 0 }).winid ~= 0 then
    vim.cmd.cclose()
  else
    -- Full width at the bottom, 40% of the screen tall (default is 10 lines)
    vim.cmd(("botright copen %d"):format(math.max(10, math.floor(vim.o.lines * 0.4))))
  end
end, { desc = "Toggle Quickfix List" })
map("n", "<leader>xr", "<cmd>QFRemoveCurrent<cr>", { desc = "Remove current from QuixFix List" })
-- New list with only the entries ]q stops on; :colder gets the full one back
map("n", "<leader>xv", function()
  local items = vim.tbl_filter(function(i) return i.valid == 1 end, vim.fn.getqflist())
  vim.fn.setqflist({}, " ", { title = "locations only", items = items })
end, { desc = "Quickfix: locations only" })

-- Pickers (Snacks)
local pick = function(source, opts)
  return function() Snacks.picker[source](opts) end
end
map("n", "<leader><space>", pick("files"), { desc = "Find Files" })
map("n", "<leader>ff", pick("files"), { desc = "Find Files" })
map("n", "<leader>fa", pick("files", { ignored = true, hidden = true }), { desc = "Find all files (including ignored)" })
map("n", "<leader>fg", pick("git_files"), { desc = "Find Files (git-files)" })
map("n", "<leader>fr", pick("recent"), { desc = "Recent" })
map("n", "<leader>fc", pick("files", { cwd = vim.fn.stdpath("config") }), { desc = "Find Config File" })
map("n", "<leader>,", pick("buffers"), { desc = "Buffers" })
map("n", "<leader>fb", pick("buffers"), { desc = "Buffers" })
map("n", "<leader>/", pick("grep"), { desc = "Grep" })
map("n", "<leader>sg", pick("grep"), { desc = "Grep" })
map("n", "<leader>sA", pick("grep", { ignored = true, hidden = true }), { desc = "Grep all (including ignored)" })
-- Only the folder you're in: the one oil shows, or the current file's
local function here()
  return require("oil").get_current_dir() or vim.fn.expand("%:p:h")
end
map("n", "<leader>sG", function() Snacks.picker.grep({ cwd = here() }) end, { desc = "Grep (current folder)" })
map("n", "<leader>fF", function() Snacks.picker.files({ cwd = here() }) end, { desc = "Find Files (current folder)" })
map({ "n", "x" }, "<leader>sw", pick("grep_word"), { desc = "Grep word / selection" })
map("n", "<leader>sb", pick("lines"), { desc = "Buffer Lines" })
map("n", "<leader>sd", pick("diagnostics"), { desc = "Diagnostics" })
map("n", "<leader>sD", pick("diagnostics_buffer"), { desc = "Buffer Diagnostics" })
map("n", "<leader>sh", pick("help"), { desc = "Help Pages" })
map("n", "<leader>sk", pick("keymaps"), { desc = "Keymaps" })
map("n", "<leader>sj", pick("jumps"), { desc = "Jumps" })
map("n", "<leader>sm", pick("marks"), { desc = "Marks" })
map("n", "<leader>sq", pick("qflist"), { desc = "Quickfix List" })
map("n", "<leader>sR", pick("resume"), { desc = "Resume" })
map("n", "<leader>su", pick("undo"), { desc = "Undo History" })
map("n", "<leader>sc", pick("command_history"), { desc = "Command History" })
map("n", "<leader>sC", pick("commands"), { desc = "Commands" })
map("n", "<leader>st", function() Snacks.picker.todo_comments() end, { desc = "Todo" })
map("n", "]t", function() require("todo-comments").jump_next() end, { desc = "Next Todo" })
map("n", "[t", function() require("todo-comments").jump_prev() end, { desc = "Prev Todo" })
map("n", "<leader>n", function() Snacks.notifier.show_history() end, { desc = "Notification History" })
map("n", "<leader>e", "<cmd>Oil<cr>", { desc = "Oil (file's directory)" })
map("n", "<leader>E", function() require("oil").open(vim.fn.getcwd()) end, { desc = "Oil (cwd)" })
map("n", "<leader>fe", function() Snacks.explorer() end, { desc = "File Explorer (tree)" })
map("n", "<leader>;", function() require("dropbar.api").pick() end, { desc = "Pick Breadcrumb" })

-- Git
map("n", "<leader>gs", pick("git_status"), { desc = "Git Status" })
map("n", "<leader>gd", pick("git_diff"), { desc = "Git Diff (hunks)" })
map("n", "<leader>gl", pick("git_log"), { desc = "Git Log" })
map("n", "<leader>gf", pick("git_log_file"), { desc = "Git File History" })
map("n", "<leader>gb", pick("git_log_line"), { desc = "Git Blame Line" })
map({ "n", "x" }, "<leader>gB", function() Snacks.gitbrowse() end, { desc = "Git Browse (open)" })

-- Toggles
Snacks.toggle({
  name = "Auto Format (global)",
  get = function() return vim.g.autoformat end,
  set = function(state) vim.g.autoformat = state end,
}):map("<leader>uf")
Snacks.toggle({
  name = "Auto Format (buffer)",
  get = function() return vim.b.autoformat ~= false end,
  set = function(state) vim.b.autoformat = state end,
}):map("<leader>uF")
Snacks.toggle.option("number", { name = "Line Numbers" }):map("<leader>ul")
Snacks.toggle.option("relativenumber", { name = "Relative Numbers" }):map("<leader>uL")
Snacks.toggle.option("wrap", { name = "Wrap" }):map("<leader>uw")
Snacks.toggle.option("spell", { name = "Spelling" }):map("<leader>us")
Snacks.toggle.option("conceallevel", { off = 0, on = 2, name = "Conceal Level" }):map("<leader>uc")
Snacks.toggle.diagnostics():map("<leader>ud")
Snacks.toggle.inlay_hints():map("<leader>uh")
