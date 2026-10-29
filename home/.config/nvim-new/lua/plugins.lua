-- Plugins are installed by vim.pack (`:h vim.pack`). Versions are pinned in
-- nvim-pack-lock.json. Update with `:lua vim.pack.update()`, review, `:write`.
local gh = function(repo)
  return "https://github.com/" .. repo
end

-- Build hooks have to exist before vim.pack.add() so they also run on install
vim.api.nvim_create_autocmd("PackChanged", {
  callback = function(ev)
    local name, kind = ev.data.spec.name, ev.data.kind
    if name == "nvim-treesitter" and kind == "update" then
      if not ev.data.active then
        vim.cmd.packadd("nvim-treesitter")
      end
      vim.cmd("TSUpdate")
    end
  end,
})

vim.pack.add({
  gh("EdenEast/nightfox.nvim"),
  gh("nvim-mini/mini.icons"),
  gh("folke/snacks.nvim"),
  gh("folke/which-key.nvim"),
  gh("neovim/nvim-lspconfig"),
  gh("stevearc/conform.nvim"),
  -- A release tag gets the prebuilt fuzzy matcher instead of a cargo build
  { src = gh("saghen/blink.cmp"), version = vim.version.range("1.*") },
  { src = gh("nvim-treesitter/nvim-treesitter"), version = "main" },
  gh("nvim-mini/mini.ai"),
  gh("lewis6991/gitsigns.nvim"),
  gh("nvim-lualine/lualine.nvim"),
  gh("Bekaboo/dropbar.nvim"),
  gh("folke/todo-comments.nvim"),
}, { confirm = false })

-- Colorscheme -----------------------------------------------------------------
require("nightfox").setup({
  options = {
    styles = {
      comments = "italic",
      keywords = "bold",
    },
    inverse = {
      search = true,
    },
  },
  groups = {
    all = {
      SnacksDashboardHeader = { fg = "palette.cyan.base" },
      SnacksDashboardIcon = { fg = "palette.orange.base" },
      SnacksDashboardDesc = { fg = "palette.orange.base" },
      SnacksDashboardKey = { fg = "palette.orange.base" },
    },
  },
})
vim.cmd.colorscheme("nightfox")

-- Icons: one set, also served to plugins that ask for nvim-web-devicons
require("mini.icons").setup()
MiniIcons.mock_nvim_web_devicons()

-- Snacks: picker, explorer, dashboard, notifications --------------------------
local ivy = { layout = { preset = "ivy" } }
require("snacks").setup({
  explorer = { enabled = true }, -- replaces netrw
  indent = { enabled = true },
  notifier = { enabled = true },
  picker = {
    enabled = true, -- also makes vim.ui.select (code actions...) use the picker
    sources = {
      -- Have the file explorer pop on the right
      explorer = { layout = { layout = { position = "right" } } },
      files = ivy,
      grep = ivy,
      grep_word = ivy,
      git_files = ivy,
      git_status = ivy,
      recent = ivy,
    },
  },
  dashboard = {
    enabled = true,
    sections = {
      { section = "header" },
      { section = "keys", gap = 1, padding = 1 },
    },
    preset = {
      header = [[
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⢲⣦⣤⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠹⣿⣿⣿⠷⠂⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠿⠁⢀⣴⣶⣶⡀⠀⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠿⣿⣿⣿⣿⡄⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⢿⣿⣿⡀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣴⣶⣾⡿⠓⠶⣤⡀⠀⠀
⠈⣷⣦⣄⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣀⣠⠄⠀⣴⣶⣶⣶⣤⣤⣼⣿⣿⣿⣿⣿⡌⠻⣦⢻⡀⠀
⠀⠸⣿⣿⣿⣿⣶⣦⠀⠀⠀⠀⢤⣴⣾⣿⣿⣿⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣷⣶⣾⣿⣄
⠀⠀⢻⣿⣿⣿⣿⣿⠀⠀⠰⣄⠀⠀⠉⠛⠛⠿⠧⠀⠘⠛⠛⠋⠉⠈⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿
⠀⠀⠈⢿⣿⣿⡿⠏⠀⠀⠀⣿⣿⣆⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⡿⠋⠀
⠀⠀⠀⠀⠉⠉⠀⠀⠀⢀⣼⣿⣿⣿⣧⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⠋⠁⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠲⢶⣶⣿⣿⣿⣿⣿⣿⣧⣴⣶⣶⣦⣤⣄⣀⣀⣠⣾⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠈⠙⠛⠿⠿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣼⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⣿⡇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣸⣿⣿⣿⣿⣿⣿⠋⡀⢹⣿⣿⣿⣿⣿⣿⣿⣿⣿⠋⠙⣿⠇⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣠⣿⣿⣿⣿⣿⣿⠃⣼⡇⣸⠏⠀⠀⢻⣿⣿⣿⣿⡏⣸⡆⡟⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⢰⣿⣿⣿⣿⣿⣿⣿⠀⢋⠔⠁⠀⠀⠀⢸⣿⣿⡿⣿⡇⠛⢠⠁⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠘⣿⣿⠏⢰⣿⣿⡿⠛⠁⠀⠀⠀⠀⠀⢸⣿⣿⡇⢸⣿⣶⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⡇⣼⣿⣿⠃⠀⠀⠀⠀⠀⠀⠀⠀⠻⣿⣷⢸⣿⣿⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⣿⣿⣧⣿⣿⣿⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠙⣿⣿⣿⣿⡇⠀⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠛⠻⠛⢿⣿⣧⣀⡀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠉⢹⣿⣿⣄⠀⠀⠀⠀⠀
⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠛⠿⠿⠟⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠀⠈⠉⠉⠀⠀⠀⠀⠀
]],
      keys = {
        { icon = " ", key = "f", desc = "Find File", action = ":lua Snacks.dashboard.pick('files')" },
        { icon = " ", key = "n", desc = "New File", action = ":ene | startinsert" },
        { icon = " ", key = "g", desc = "Find Text", action = ":lua Snacks.dashboard.pick('live_grep')" },
        { icon = " ", key = "r", desc = "Recent Files", action = ":lua Snacks.dashboard.pick('oldfiles')" },
        {
          icon = " ",
          key = "c",
          desc = "Config",
          action = ":lua Snacks.dashboard.pick('files', {cwd = vim.fn.stdpath('config')})",
        },
        { icon = "󰒲 ", key = "u", desc = "Update Plugins", action = ":lua vim.pack.update()" },
        { icon = " ", key = "q", desc = "Quit", action = ":qa" },
      },
    },
  },
})

-- which-key -------------------------------------------------------------------
require("which-key").setup({
  preset = "helix",
  spec = {
    {
      mode = { "n", "x" },
      { "<leader>a", group = "json (jq)", icon = { icon = "", color = "yellow" } },
      { "<leader>b", group = "buffer" },
      { "<leader>c", group = "code" },
      { "<leader>f", group = "file/find" },
      { "<leader>g", group = "git" },
      { "<leader>gh", group = "hunks" },
      { "<leader>q", group = "quit" },
      { "<leader>s", group = "search" },
      { "<leader>u", group = "ui" },
      { "<leader>x", group = "quickfix" },
      { "[", group = "prev" },
      { "]", group = "next" },
      { "g", group = "goto" },
      { "z", group = "fold" },
    },
  },
})

-- Formatting: format on save --------------------------------------------------
require("conform").setup({
  formatters_by_ft = {
    lua = { "stylua" },
    sh = { "shfmt" },
    go = { "goimports", "gofumpt" },
    -- python (ruff), json (jsonls), rust, c/cpp go through their LSP
  },
  default_format_opts = { lsp_format = "fallback" },
  format_on_save = function(buf)
    if vim.g.autoformat and vim.b[buf].autoformat ~= false then
      return { timeout_ms = 3000 }
    end
  end,
})
vim.o.formatexpr = "v:lua.require'conform'.formatexpr()"

-- Completion ------------------------------------------------------------------
require("blink.cmp").setup({
  -- default preset: <C-y> accept, <C-n>/<C-p> move, <C-space> open, <C-e> close.
  -- <CR> is never mapped, so Enter is always a newline.
  keymap = { preset = "default" },
  completion = {
    list = { selection = { preselect = false } },
    accept = { auto_brackets = { enabled = false } },
    documentation = { auto_show = true, auto_show_delay_ms = 200 },
  },
  -- Snippets still come from the LSP; there is no snippet collection
  sources = { default = { "lsp", "path", "buffer" } },
  cmdline = { completion = { menu = { auto_show = true } } },
})

-- Treesitter: parsers only, highlighting is Neovim's (autocmds.lua) -----------
local parsers = {
  "bash", "c", "cpp", "diff", "dockerfile", "go", "gomod", "gosum", "gowork",
  "html", "javascript", "json", "json5", "lua", "luadoc", "make", "markdown",
  "markdown_inline", "python", "query", "regex", "rust", "toml", "tsx",
  "typescript", "vim", "vimdoc", "xml", "yaml",
}
local installed = require("nvim-treesitter").get_installed()
local missing = vim.tbl_filter(function(p)
  return not vim.list_contains(installed, p)
end, parsers)
if #missing > 0 then
  require("nvim-treesitter").install(missing)
end

-- Text objects: built-ins (iw, i", i(, ...) plus `ie`, a camelCase/snake_case part
local ai = require("mini.ai")
ai.setup({
  n_lines = 500,
  custom_textobjects = {
    e = {
      { "%u[%l%d]+%f[^%l%d]", "%f[%S][%l%d]+%f[^%l%d]", "%f[%P][%l%d]+%f[^%l%d]", "^[%l%d]+%f[^%l%d]" },
      "^().*()$",
    },
  },
})

-- Git -------------------------------------------------------------------------
require("gitsigns").setup({
  current_line_blame = true,
  numhl = true,
  signs = {
    add = { text = "▎" },
    change = { text = "▎" },
    delete = { text = "" },
    topdelete = { text = "" },
    changedelete = { text = "▎" },
    untracked = { text = "▎" },
  },
  on_attach = function(buf)
    local gs = package.loaded.gitsigns
    local function map(mode, l, r, desc)
      vim.keymap.set(mode, l, r, { buffer = buf, desc = desc })
    end
    map("n", "]h", function()
      if vim.wo.diff then
        vim.cmd.normal({ "]c", bang = true })
      else
        gs.nav_hunk("next")
      end
    end, "Next Hunk")
    map("n", "[h", function()
      if vim.wo.diff then
        vim.cmd.normal({ "[c", bang = true })
      else
        gs.nav_hunk("prev")
      end
    end, "Prev Hunk")
    map({ "n", "x" }, "<leader>ghs", ":Gitsigns stage_hunk<CR>", "Stage Hunk")
    map({ "n", "x" }, "<leader>ghr", ":Gitsigns reset_hunk<CR>", "Reset Hunk")
    map("n", "<leader>ghS", gs.stage_buffer, "Stage Buffer")
    map("n", "<leader>ghR", gs.reset_buffer, "Reset Buffer")
    map("n", "<leader>ghp", gs.preview_hunk_inline, "Preview Hunk Inline")
    map("n", "<leader>ghb", function()
      gs.blame_line({ full = true })
    end, "Blame Line")
    map("n", "<leader>ghB", gs.blame, "Blame Buffer")
    map("n", "<leader>ghd", gs.diffthis, "Diff This")
    map({ "o", "x" }, "ih", ":<C-U>Gitsigns select_hunk<CR>", "Select Hunk")
  end,
})

-- Statusline ------------------------------------------------------------------
require("lualine").setup({
  options = {
    theme = "auto",
    globalstatus = true,
    disabled_filetypes = { statusline = { "snacks_dashboard" } },
  },
  sections = {
    lualine_a = { "mode" },
    lualine_b = { "branch" },
    lualine_c = { "diagnostics", { "filename", path = 1 } },
    lualine_x = {
      {
        "diff",
        source = function()
          local g = vim.b.gitsigns_status_dict
          if g then
            return { added = g.added, modified = g.changed, removed = g.removed }
          end
        end,
      },
      "filetype",
    },
    lualine_y = {
      { "progress", separator = " ", padding = { left = 1, right = 1 } },
    },
    lualine_z = {
      { "location", padding = { left = 0, right = 1 } },
    },
  },
})

-- Breadcrumbs (attaches itself; <leader>; to pick a segment)
require("dropbar").setup({})

require("todo-comments").setup({})
