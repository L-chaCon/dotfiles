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
./pow init
```

The `pow init` command runs `scripts/1_core` through `scripts/6_dotfiles` in order. Each script is idempotent — safe to re-run. After the first run, `pow` is available on your `PATH` (via `~/.local/scripts`), so you can just run `pow init` from anywhere.

## The `pow` command

`pow` is the dotfiles CLI. Run it with no arguments to see what's available:

```bash
pow                # show help
pow init           # run all bootstrap scripts
pow init --list    # list available scripts
pow init 3_tmux    # run a single script (exact or partial match)
```

### Switching GitHub accounts

`~/.gitconfig` holds the shared git config and includes `~/.gitconfig.active`,
a symlink that points at the active identity profile. Switch identities with:

```bash
pow git list       # list profiles (chacon, work)
pow git current    # show the active profile
pow git chacon     # switch to personal identity
pow git work       # switch to work identity
```

Only user-specific settings (name, email, username, signing key, ssh command)
live in the profile files `~/.gitconfig.chacon` and `~/.gitconfig.work`.
Switching warns if the 1Password SSH signer is missing.

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
├── git/          → ~/.gitconfig, ~/.gitconfig.chacon, ~/.gitconfig.work, ~/.gitignore
├── opencode/     → ~/.config/opencode/
├── pow/          → ~/.local/scripts/pow
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
├── pow                # dotfiles CLI (wrapper → dotfiles/pow/.local/scripts/pow)
├── scripts/           # numbered setup scripts (run in order by `pow init`)
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
