-- Uses <root>/.venv when it exists (created by `docker-venv`), so there is no
-- venv to pick by hand.
return {
  before_init = function(_, config)
    local python = vim.fs.joinpath(config.root_dir or vim.fn.getcwd(), ".venv", "bin", "python")
    if vim.uv.fs_stat(python) then
      config.settings.python = vim.tbl_deep_extend("force", config.settings.python or {}, { pythonPath = python })
    end
  end,
  settings = {
    python = {
      analysis = {
        autoSearchPaths = true,
        diagnosticMode = "openFilesOnly",
        useLibraryCodeForTypes = true,
        -- Diagnostics come from ruff/mypy; pyright is for navigation and types
        ignore = { "*" },
      },
    },
  },
}
