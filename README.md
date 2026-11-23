# dotfiles

Personal developer environment for macOS and Omarchy (Arch Linux).

## Tools

| Category | Tool |
|---|---|
| Shell | Zsh + Starship |
| Terminal + multiplexer | Rex (macOS) |
| Editor | Neovim (built-ins + vim.pack) |
| Window manager | AeroSpace (macOS) · Hyprland (Omarchy) |
| File tools | fzf, fd, bat, lsd, ripgrep, zoxide |
| Version control | Git + delta |
| Kubernetes | k9s |
| AI agent | pi |
| Dotfile manager | GNU Stow |
| Theme | Nightfox (Rex, editor, k9s, bat, pi, Omarchy) |

## Bootstrap — macOS

**Manual step first (one time):**
1. Install [1Password](https://1password.com) and sign in
2. **Settings → Developer** → enable **Use the SSH agent**
3. Confirm your SSH key is in your 1Password vault

```bash
git clone https://github.com/L-chaCon/dotfiles.git ~/.dotfiles
cd ~/.dotfiles
./pow init          # installs Homebrew, clones ai_docs, installs packages, stows configs, inserts a managed block into ~/.zshrc
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
./pow init          # clones ai_docs, installs packages/pacman, stows configs, links Omarchy themes, inserts a managed block into ~/.zshrc
./pow link          # makes `pow` available from anywhere (the Omarchy hooks call ~/.local/bin/pow)
# log out and back in if pow changed your login shell
pow git chacon
omarchy theme set nightfox
```

The repo can live anywhere — `pow` resolves its own location, so it doesn't have to be `~/.dotfiles`.

## Daily use

```bash
pow update          # pull latest dotfiles + ai_docs, update packages, restow
pow doctor          # health check (tools, nvim tools, ai_docs, symlinks, git profile, Omarchy drift)
pow stow            # restow after adding or removing config files
pow check           # Omarchy only: detect configs Omarchy reset or unlinked
pow repair          # Omarchy only: restore reset configs from git, restow, reload Hyprland
pow unlink          # remove pow from ~/.local/bin
pow edit            # open the dotfiles repo in $EDITOR
pow git list        # list git profiles
pow git current     # show active profile
pow git chacon      # switch to personal identity
pow git work        # switch to work identity
```

## ai_docs

`pow init` clones the private [`L-chaCon/ai_docs`](https://github.com/L-chaCon/ai_docs) repo to `~/.ai_docs` over SSH
(through the 1Password agent, so do the 1Password step first). It's the library the `recall-docs` and `archive-docs`
pi skills read and write. If it's already there, init leaves it alone; `pow doctor` reports it missing. `pow update` pulls it
(fast-forward only), and skips it with a reminder to commit first if it has uncommitted changes.

## Zsh model

`pow init` / `pow stow` ensures `~/.zshrc` contains this managed block:

```zsh
### MANAGED BY DOTFILES START (DO NOT EDIT)
[[ -f "$HOME/.config/zsh/core.zsh" ]] && source "$HOME/.config/zsh/core.zsh"
### MANAGED BY DOTFILES END (DO NOT EDIT)
```

Everything outside that block stays machine-local and may be edited by you or by other tools.

`core.zsh` always loads the common modules in `~/.config/zsh/modules/` (aliases in `personal.zsh`, fzf, lsd, zoxide, and `claude.zsh`, the
`pi`/`claude` wrappers that pick the work or personal account from the launch folder);
`brew.zsh` comes from `home-mac/` and is only loaded on macOS.

pi subagents (`@tintinweb/pi-subagents`, in `packages/pi`) get two TDD agents from `home/.pi/agent/agents/`
(`test-writer`, `implementer`) and a gated `tdd` workflow from `home/.pi/agent/workflows/tdd.js`: the test-writer's
tests must fail, get sha256-fingerprinted, and the implementer only passes if they are unchanged and green.
Use it with *"run the tdd workflow: <task>"*, or step by step with `@test-writer …` then `@implementer …`.

Work-only shell modules live in `~/.config/zsh/work/` and are **not** auto-loaded.
Opt in from your real `~/.zshrc` when needed, for example:

```zsh
[[ -f "$HOME/.config/zsh/work/kube.zsh" ]] && source "$HOME/.config/zsh/work/kube.zsh"
[[ -f "$HOME/.config/zsh/work/kafka.zsh" ]] && source "$HOME/.config/zsh/work/kafka.zsh"
```

`work/tails.zsh` contains internal account IDs/URLs and is gitignored — it only exists on work machines.

## Rex

Rex's config is Lua, in `home/.config/rex/` (stowed to `~/.config/rex/`). Apply edits with `rex config reload`.

| Key | Action |
|---|---|
| `Ctrl-b` then `c` / `n` / `p` / `1`–`9` / `,` / `&` | New / next / previous / go to / rename / close tab |
| `Ctrl-b` then `s` / `w` / `(` / `)` / `$` | Session switcher / Go to Anything / previous / next / rename session |
| `Ctrl-b` then `v` / `-` / `x` / `z` | Split right / down, close pane, zoom |
| `Ctrl-b` then `[` / `?` | Find / command palette (`Ctrl-b Ctrl-b` sends `Ctrl-b`) |
| `Ctrl-b` then `g` / `G` | New git worktree as a session / remove this worktree |
| `Ctrl-b` then `u` / `U` | Open / copy a URL from the pane or a docker port |
| `Ctrl-h/j/k/l` | Move between panes, through nvim windows (`nvim/lua/rex.lua`) |
| `Ctrl-Space` | Sessionizer: a project as a session with `nvim`, `pi` and `shell` tabs |

App settings (theme, font, toolbar) are not read from the config file; Rex keeps them in macOS
preferences. `home-mac/.config/rex/settings.sh` writes them, Nightfox included
(`custom-themes.json`). Quit Rex and run `~/.config/rex/settings.sh` on a new Mac.

Inside Rex, pi gets a `shell_job` tool (`home/.pi/agent/extensions/rex-shell.ts`) that runs
slow commands (tests, builds, servers) in their own Rex pane and reports the result back.

## Omarchy

Hyprland uses Omarchy's Lua config. `hyprland.lua` loads Omarchy's defaults first, then the files in
`~/.config/hypr/`. Only the files that differ from Omarchy's stock versions are tracked:

| File | Purpose |
|---|---|
| `hyprland.lua` | Entry point (loads Omarchy defaults + the overrides below) |
| `bindings.lua` | ALT-based keybindings ported from AeroSpace |
| `monitors.lua` | External monitor on the left, laptop on the right, workspace-to-monitor rules |
| `windows.lua` | Default workspace per app |

The rest (`input.lua`, `looknfeel.lua`, `autostart.lua`, `hyprsunset.conf`, `xdph.conf`, `.luarc.json`) are
Omarchy's own files, left as regular files in `~/.config/hypr/` so Omarchy updates them normally.

### Themes

`omarchy/themes/<name>/` is **not** stowed. `pow stow` symlinks each theme directory as a whole to
`~/.config/omarchy/themes/<name>`, because `omarchy theme set` copies theme files and would otherwise copy stow's
per-file relative symlinks and leave them dangling. Omarchy generates the Hyprland, shell, btop, etc. colours from
`colors.toml`.

### Drift detection

Some Omarchy tools write over stowed configs:

- `omarchy refresh <x>` copies the stock file **through** the symlink into this repo (a *reset*).
- The monitor scaling menu edits `monitors.lua` with `sed -i`, replacing the symlink with a regular file (*unlinked*).

`home-linux/.config/omarchy/hooks/{post-boot,post-update}.d/dotfiles-drift.hook` run `pow check --notify`
after every boot and Omarchy update, and send a desktop notification if anything drifted. Fix it with `pow repair`.

## Structure

```
.dotfiles/
├── pow                 # management CLI
├── packages/
│   ├── Brewfile        # macOS packages (brew + casks)
│   ├── Brewfile.work   # macOS work packages (fill in yourself)
│   ├── pacman          # Arch/Omarchy extra packages + nvim language tools
│   └── pi              # pi extensions (all platforms)
├── home/               # stowed to ~ on all platforms (zsh, nvim, rex, git, k9s, bat, lsd, starship, pi, scripts)
├── home-mac/           # stowed to ~ on macOS only (AeroSpace, Rex app settings, brew zsh module, 1Password mac signing)
├── home-linux/         # stowed to ~ on Omarchy only (Hyprland, Omarchy hooks, 1Password linux signing)
├── omarchy/themes/     # Omarchy themes, symlinked as whole directories (not stowed)
└── .github/workflows/  # gitleaks secret scan on PRs and pushes to main
```

Notes:
- `pow` uses `stow --no-folding` so apps keep real config directories and only files are linked.
- Files that block a stow are moved aside as `<file>.bak.<timestamp>` (gitignored).
- `~/.zshrc` is local; the repo owns `~/.config/zsh/core.zsh` and the managed block only.
- The repo is public: secrets and work-internal details must stay out of it (CI runs gitleaks).
