-- Server definitions come from nvim-lspconfig; overrides live in ../lsp/<name>.lua.
-- Binaries are installed by `pow` (packages/Brewfile), not mason.
vim.lsp.enable({
  "pyright",
  "ruff",
  "gopls",
  "lua_ls",
  "jsonls",
  "rust_analyzer",
  "clangd",
})

vim.diagnostic.config({
  severity_sort = true,
  underline = true,
  update_in_insert = false,
  virtual_text = { spacing = 4, source = "if_many", prefix = "●" },
  float = { border = "rounded", source = "if_many" },
  signs = {
    text = {
      [vim.diagnostic.severity.ERROR] = " ",
      [vim.diagnostic.severity.WARN] = " ",
      [vim.diagnostic.severity.HINT] = " ",
      [vim.diagnostic.severity.INFO] = " ",
    },
  },
})

-- Neovim maps gra/grn/grr/gri/grt/grx globally. `gr` below is "references"
-- with nowait, which would shadow them anyway, so drop them for <leader>c*.
for _, lhs in ipairs({ "gra", "grn", "grr", "gri", "grt", "grx" }) do
  pcall(vim.keymap.del, "n", lhs)
end
pcall(vim.keymap.del, "x", "gra")

vim.api.nvim_create_autocmd("LspAttach", {
  group = vim.api.nvim_create_augroup("lsp_attach", { clear = true }),
  callback = function(ev)
    local client = vim.lsp.get_client_by_id(ev.data.client_id)
    local function map(mode, lhs, rhs, desc, opts)
      vim.keymap.set(mode, lhs, rhs, vim.tbl_extend("force", { buffer = ev.buf, desc = desc }, opts or {}))
    end

    -- K (hover) and <C-s> in insert (signature help) are Neovim defaults
    map("n", "gd", function() Snacks.picker.lsp_definitions() end, "Goto Definition")
    map("n", "gD", function() Snacks.picker.lsp_declarations() end, "Goto Declaration")
    map("n", "gr", function() Snacks.picker.lsp_references() end, "References", { nowait = true })
    map("n", "gI", function() Snacks.picker.lsp_implementations() end, "Goto Implementation")
    map("n", "gy", function() Snacks.picker.lsp_type_definitions() end, "Goto T[y]pe Definition")
    map({ "n", "x" }, "<leader>ca", vim.lsp.buf.code_action, "Code Action")
    map("n", "<leader>cr", vim.lsp.buf.rename, "Rename")
    map("n", "<leader>ss", function() Snacks.picker.lsp_symbols() end, "LSP Symbols")
    map("n", "<leader>sS", function() Snacks.picker.lsp_workspace_symbols() end, "LSP Workspace Symbols")
    map("n", "<leader>cl", "<cmd>checkhealth vim.lsp<cr>", "LSP Info")

    if client and client.name == "ruff" then
      -- pyright's hover is the useful one
      client.server_capabilities.hoverProvider = false
      map("n", "<leader>co", function()
        vim.lsp.buf.code_action({ apply = true, context = { only = { "source.organizeImports" }, diagnostics = {} } })
      end, "Organize Imports")
    end
  end,
})
