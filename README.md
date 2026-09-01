# dotfiles

Personal developer environment for macOS and Omarchy (Arch Linux).

## Tools

| Category | Tool |
|---|---|
| Shell | Zsh + Starship |
| Terminal | Ghostty |
| Multiplexer | Herdr |
| Editor | Neovim (LazyVim) |
| Window manager | AeroSpace (macOS) · Hyprland (Omarchy) |
| File tools | fzf, fd, bat, lsd, ripgrep, zoxide |
| Version control | Git + delta |
| AI agent | pi |
| Dotfile manager | GNU Stow |
| Theme | Nord |

## Bootstrap — macOS

**Manual step first (one time):**
1. Install [1Password](https://1password.com) and sign in
2. **Settings → Developer** → enable **Use the SSH agent**
3. Confirm your SSH key is in your 1Password vault

```bash
git clone https://github.com/L-chaCon/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./pow init          # installs Homebrew, all packages, stows configs, sets zsh as default
./pow link          # makes `pow` available from anywhere
# restart terminal
pow git chacon      # set git identity (or: pow git work)
```

## Bootstrap — Omarchy

**Manual step first (one time):**
1. Open 1Password → **Settings → Developer** → enable **Use the SSH agent**
2. Confirm your SSH key is in your 1Password vault

```bash
git clone git@github.com:L-chaCon/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./pow init          # installs missing packages (lsd, git-delta, stow), stows configs, sets zsh as default
./pow link          # makes `pow` available from anywhere
# log out and back in (required for shell change to take effect)
pow git chacon
```

## Daily use

```bash
pow update          # pull latest dotfiles + update packages + restow
pow doctor          # health check
pow stow            # restow after editing configs
pow edit            # open ~/.dotfiles in $EDITOR
pow git list        # list git profiles
pow git current     # show active profile
pow git chacon      # switch to personal identity
pow git work        # switch to work identity
```

## Structure

```
.dotfiles/
├── pow                 # management CLI
├── packages/
│   ├── Brewfile        # macOS packages (brew + casks)
│   ├── Brewfile.work   # macOS work packages (fill in yourself)
│   └── pacman          # Arch/Omarchy extra packages
├── home/               # stowed to ~ on all platforms
├── home-mac/           # stowed to ~ on macOS only (aerospace, brew PATH, 1Password mac signing)
└── home-linux/         # stowed to ~ on Omarchy only (hyprland keybindings, 1Password linux signing)
```
