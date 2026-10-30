return {
  settings = {
    gopls = {
      gofumpt = true,
      usePlaceholders = true,
      completeUnimported = true,
      staticcheck = true,
      analyses = {
        nilness = true,
        unusedparams = true,
        unusedwrite = true,
        useany = true,
      },
      directoryFilters = { "-.git", "-.vscode", "-.idea", "-node_modules" },
    },
  },
}
