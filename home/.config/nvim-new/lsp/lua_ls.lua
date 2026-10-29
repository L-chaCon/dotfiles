-- Knows about the Neovim API when editing this config (replaces lazydev)
return {
  settings = {
    Lua = {
      runtime = { version = "LuaJIT" },
      workspace = {
        checkThirdParty = false,
        library = { vim.env.VIMRUNTIME },
      },
      diagnostics = { globals = { "Snacks", "MiniIcons" } },
      completion = { callSnippet = "Replace" },
      hint = { enable = true },
    },
  },
}
