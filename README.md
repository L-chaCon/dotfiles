# Dotfiles

Personal macOS developer environment setup. Manages dotfiles and bootstraps a full workstation from scratch.

## What's managed

| Layer | Tool |
|---|---|
| Shell | Zsh + Starship prompt |
| Terminal | Ghostty |
| Multiplexer | Herdr |
| Editor | Neovim (built from source) |
| Window manager | AeroSpace |
| File tools | fzf, fd, bat, lsd, ripgrep, zoxide |
| Version control | Git, delta, jj* |
| Dotfile manager | GNU Stow |
| Theme | Nord |

> `*` = manually installed, not managed by the bootstrap scripts.

## Prerequisites

- macOS
- [Homebrew](https://brew.sh) installed
- SSH key added to GitHub (the bootstrap will prompt you)

## Bootstrap a new machine

```bash
git clone git@github.com:L-chaCon/dotfiles.git $HOME/.dotfiles
cd $HOME/.dotfiles
./pow
```

The `pow` script runs `scripts/1_core` through `scripts/6_dotfiles` in order. Each script is idempotent — safe to re-run.

## Dotfiles

Dotfiles live in `dotfiles/` and are managed with GNU Stow. Each subdirectory is a package that mirrors the `$HOME` path structure.

```
dotfiles/
├── aerospace/    → ~/.config/aerospace/
├── bat/          → ~/.config/bat/
├── bin/          → ~/.local/scripts/
├── btop/         → ~/.config/btop/
├── dash/         → ~/.local/dashdocs/
├── ghostty/      → ~/.config/ghostty/
├── git/          → ~/.gitconfig, ~/.gitignore
├── opencode/     → ~/.config/opencode/
├── starship/     → ~/.config/starship.toml
├── tmux/         → ~/.tmux.conf, ~/.gitmux.conf
└── zsh/          → ~/.chaCon, ~/.local/zshrc/*, ~/.config/lsd/
```

### Stow all packages

```bash
cd dotfiles
./install    # symlink everything to $HOME
./uninstall  # remove all symlinks
```

## Structure

```
.chaConfig/
├── pow                # master bootstrap runner
├── scripts/           # numbered setup scripts (run in order by pow)
│   ├── 1_core         # brew tools, SSH key, fonts, Ghostty
│   ├── 2_zsh          # Zsh, Oh My Zsh, CLI tools, plugins
│   ├── 3_tmux         # Tmux, TPM, gitmux, Catppuccin
│   ├── 4_nvim         # Neovim (built from source) + config
│   ├── 5_aerospace    # AeroSpace tiling WM
│   └── 6_dotfiles     # GNU Stow + .zshrc bootstrap
└── dotfiles/          # Stow-managed config packages
```

## Extra

This is a consolidation of:

- https://github.com/L-chaCon/chaCon.nvim
- https://github.com/L-chaCon/chaCon
