-- Minimal config on Neovim's built-ins, plugins via vim.pack (lua/plugins.lua)
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

require("options")
require("plugins")
require("lsp")
require("keymaps")
require("autocmds")
require("compile")
