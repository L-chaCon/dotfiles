-- Minimal config on Neovim's built-ins. Plan: dotfiles/docs/nvim-minimal-config-plan.md
vim.g.mapleader = " "
vim.g.maplocalleader = "\\"

require("options")
require("plugins")
require("lsp")
require("keymaps")
require("autocmds")
