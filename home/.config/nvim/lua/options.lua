local opt = vim.opt

-- Nothing here uses python/node/ruby/perl plugins
vim.g.loaded_python3_provider = 0
vim.g.loaded_node_provider = 0
vim.g.loaded_ruby_provider = 0
vim.g.loaded_perl_provider = 0

-- Keep markdown's ftplugin from forcing 4-space indents
vim.g.markdown_recommended_style = 0

-- Format on save, toggled with <leader>uf (see plugins.lua conform)
vim.g.autoformat = true

-- System clipboard only through <leader>y
opt.clipboard = ""

-- UI
opt.number = false
opt.relativenumber = false
opt.signcolumn = "yes"
opt.cursorline = false
opt.colorcolumn = "80" -- If it is 80, is not line inclusive
opt.laststatus = 3 -- one statusline for all windows
opt.showmode = false -- lualine shows it
opt.ruler = false
opt.termguicolors = true
opt.list = true
opt.fillchars = { foldopen = "", foldclose = "", fold = " ", foldsep = " ", diff = "╱", eob = " " }
opt.pumheight = 10
opt.winminwidth = 5
opt.wrap = false
opt.linebreak = true
opt.breakindent = true
opt.smoothscroll = true
opt.scrolloff = 10
opt.sidescrolloff = 8
opt.splitbelow = true
opt.splitright = true
opt.splitkeep = "screen"
opt.shortmess:append({ W = true, I = true, c = true, C = true })

-- Mouse
opt.mouse = "a"
opt.mousemoveevent = true

-- Editing
opt.expandtab = true
opt.shiftwidth = 2
opt.tabstop = 2
opt.shiftround = true
opt.smartindent = true
opt.virtualedit = "block"
opt.formatoptions = "jcroqlnt"
opt.confirm = true
opt.undofile = true
opt.undolevels = 10000
opt.spelllang = "en_gb"

-- Search
opt.ignorecase = true
opt.smartcase = true
opt.hlsearch = false
opt.inccommand = "nosplit"
opt.grepprg = "rg --vimgrep"
opt.grepformat = "%f:%l:%c:%m"
opt.jumpoptions = "view"
opt.wildmode = "longest:full,full"

-- Folds (treesitter sets foldexpr per buffer in autocmds.lua)
opt.foldlevel = 99
opt.foldmethod = "indent"
opt.foldtext = ""

-- Timing
opt.updatetime = 50
opt.timeoutlen = 300
