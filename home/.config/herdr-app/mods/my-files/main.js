// my-files: Herdr's Files panel (cloned from the shipped `files` 0.1.16), extended:
// - icons per file type, the same as nvim's mini.icons (table generated from it, below);
// - clicking a file opens it in this space's nvim (no read-only preview); with no nvim
//   listening, a new "nvim" tab opens on it;
// - permissions, size, age and symlink targets on every row (`i` toggles them);
// - git colors on names, and on the folders holding changes;
// - hidden files shown, git-ignored ones hidden; `.` and `I` (or the header) toggle them;
// - vim keys once it has the keyboard (Ctrl-B e, or Ctrl-l into it): `?` lists them;
// - a right-click menu (`m`): open, split, copy paths, reveal, rename, trash;
// - follows nvim: the file nvim shows is revealed and highlighted.
// The nvim side is home/.config/nvim/lua/herdr.lua: each nvim in a Herdr terminal listens
// on ~/.local/state/nvim/herdr/<terminal>.sock and writes <terminal>.json {sock, file}.
// The same mod draws the right-click menu when opened as a popup with props { menu }.
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input, ScrollHandle } from "gpui-base";
import {
  spaces, panes, focused, exec, readTextFile, watchFolder, theme, settings, window, terminals,
  run, hc, home, props, openOverlay, closeOverlay, nextCommand, notify, checking,
} from "herdr";

// `live`: folders found by asking another machine (remoteCwd below), by terminal address.
function location(live) {
  const space = spaces().find(s => s.active), f = focused();
  const pane = f?.pane ? panes().find(p => p.pane === f.pane) : null;
  const on = f?.pane === null ? (f.terminal?.includes("/") ? f.terminal.split("/")[0] : null) : space?.machine ?? null;
  const remote = on && f?.terminal ? live?.get(f.terminal) : null;
  return { cwd: remote || pane?.cwd || f?.cwd || space?.folder, on, space: space?.id };
}

// Where a remote terminal really is. Herdr only knows the folder it started in (the remote
// shell doesn't report `cd`s), so ask that machine: the shell's own folder, or under tmux
// the folder of the tmux pane its client shows.
async function remoteCwd(address, on) {
  const g = await hc(["get", address, "--json"]).catch(() => null);
  let fg; try { fg = JSON.parse(g?.stdout ?? "").foreground; } catch { return null; }
  if (!fg) return null;
  if (!/^tmux/i.test(fg.name ?? "")) return fg.cwd ?? null;
  const r = await exec("tmux", ["list-clients", "-F", "#{client_pid}\t#{pane_current_path}"], { on, timeout: 5000 }).catch(() => null);
  const line = r?.stdout.split("\n").find(l => l.split("\t")[0] === String(fg.pid));
  return line?.split("\t")[1] || fg.cwd || null;
}
const PER_FOLDER = 500, TOTAL = 5000, ROW = 26;

// ---------- icons ----------

// File icons: the same glyphs and colors as nvim's mini.icons (generated from it), drawn
// with the Symbols Nerd Font. Colors are mini.icons' names, mapped to the theme in main.js.
const ICON_FONT = "Symbols Nerd Font"; // not "… Mono": Herdr draws none of its glyphs
const FILE = { ".DS_Store": ["󰒓", "Red"], ".bash_profile": ["󰒓", "Green"], ".bashrc": ["󰒓", "Green"], ".dockerignore": ["󰡨", "Orange"], ".editorconfig": ["", "Grey"], ".env": ["󰈔", "Grey"], ".envrc": ["", "Grey"], ".eslintrc": ["󰘦", "Yellow"], ".eslintrc.json": ["󰘦", "Yellow"], ".gitattributes": ["󰊢", "Yellow"], ".gitconfig": ["󰒓", "Orange"], ".gitignore": ["󰊢", "Purple"], ".gitlab-ci.yml": ["󰮠", "Orange"], ".gitmodules": ["󰒓", "Orange"], ".luarc.json": ["󰘦", "Yellow"], ".npmrc": ["󰯂", "Azure"], ".nvmrc": ["󰒓", "Green"], ".prettierignore": ["", "Orange"], ".prettierrc": ["󰘦", "Yellow"], ".profile": ["", "Grey"], ".stylua.toml": ["", "Orange"], ".tmux.conf": ["󰒓", "Grey"], ".travis.yml": ["", "Purple"], ".vimrc": ["", "Green"], ".zprofile": ["", "Green"], ".zshenv": ["", "Green"], ".zshrc": ["󰒓", "Green"], "AGENTS.md": ["󰍔", "Grey"], "Brewfile": ["󰴭", "Red"], "CHANGELOG.md": ["󰉻", "Blue"], "CLAUDE.md": ["󰍔", "Grey"], "CMakeLists.txt": ["󱁤", "Orange"], "CODEOWNERS": ["󰜻", "Purple"], "CONTRIBUTING.md": ["󰺾", "Azure"], "Cargo.lock": ["", "Orange"], "Cargo.toml": ["", "Orange"], "Containerfile": ["󰡨", "Blue"], "Dockerfile": ["󰡨", "Blue"], "GNUmakefile": ["󱁤", "Grey"], "Gemfile": ["󰴭", "Red"], "Gruntfile.js": ["󰌞", "Yellow"], "Jenkinsfile": ["", "Azure"], "Justfile": ["󰖷", "Orange"], "LICENSE": ["", "Cyan"], "LICENSE.md": ["", "Cyan"], "Makefile": ["󱁤", "Grey"], "Pipfile": ["", "Orange"], "README": ["", "Yellow"], "README.md": ["", "Yellow"], "Rakefile": ["󰴭", "Red"], "Taskfile.yml": ["", "Purple"], "Vagrantfile": ["󰴭", "Red"], "compose.yaml": ["", "Purple"], "compose.yml": ["", "Purple"], "deno.json": ["󰘦", "Yellow"], "docker-compose.yaml": ["", "Purple"], "docker-compose.yml": ["", "Purple"], "eslint.config.js": ["󰌞", "Yellow"], "flake.lock": ["󰘦", "Yellow"], "flake.nix": ["󱄅", "Azure"], "go.mod": ["󰫺", "Cyan"], "go.sum": ["󰟓", "Cyan"], "init.lua": ["", "Green"], "jsconfig.json": ["󰘦", "Yellow"], "justfile": ["󰖷", "Orange"], "makefile": ["󱁤", "Grey"], "package-lock.json": ["󰘦", "Yellow"], "package.json": ["󰘦", "Yellow"], "pnpm-lock.yaml": ["", "Purple"], "pyproject.toml": ["", "Orange"], "requirements.txt": ["󱘎", "Purple"], "setup.py": ["󰌠", "Yellow"], "starship.toml": ["", "Orange"], "stylua.toml": ["", "Orange"], "tailwind.config.js": ["󰌞", "Yellow"], "tmux.conf": ["󰒓", "Grey"], "tsconfig.json": ["󰘦", "Yellow"], "uv.lock": ["", "Orange"], "vite.config.js": ["󰌞", "Yellow"], "vite.config.ts": ["󰛦", "Azure"], "webpack.config.js": ["󰌞", "Yellow"], "yarn.lock": ["", "Purple"] };
const EXT = { "7z": ["󰗄", "Blue"], "am": ["󰫲", "Green"], "astro": ["", "Orange"], "avi": ["󰈫", "Grey"], "bash": ["", "Grey"], "bat": ["󰯂", "Green"], "bmp": ["󰈟", "Green"], "bz2": ["󰗄", "Orange"], "c": ["󰙱", "Blue"], "cc": ["󰙲", "Azure"], "cfg": ["󰒓", "Blue"], "cjs": ["󰌞", "Yellow"], "clj": ["", "Green"], "cljs": ["", "Green"], "cmake": ["󱁤", "Orange"], "cmd": ["󰯂", "Green"], "conf": ["󰒓", "Grey"], "cpp": ["󰙲", "Azure"], "crt": ["󰌇", "Yellow"], "cs": ["󰌛", "Green"], "csproj": ["󰗀", "Orange"], "css": ["󰌜", "Azure"], "csv": ["", "Green"], "cts": ["󰛦", "Azure"], "cue": ["󰝚", "Yellow"], "dart": ["", "Blue"], "diff": ["󰦓", "Red"], "el": ["", "Grey"], "elm": ["", "Azure"], "env": ["󰈔", "Grey"], "erl": ["", "Red"], "ex": ["", "Purple"], "exs": ["", "Purple"], "fish": ["", "Grey"], "flac": ["󰈣", "Orange"], "gif": ["󰵸", "Azure"], "go": ["󰟓", "Azure"], "gql": ["󰡷", "Red"], "gradle": ["", "Azure"], "graphql": ["󰡷", "Red"], "gz": ["󰗄", "Grey"], "h": ["󰫵", "Purple"], "hbs": ["󰌞", "Green"], "hcl": ["󰫵", "Azure"], "hh": ["󰙲", "Azure"], "hpp": ["󰙲", "Azure"], "hs": ["󰲒", "Purple"], "htm": ["󰌝", "Orange"], "html": ["󰌝", "Orange"], "http": ["󰌷", "Orange"], "ini": ["󰯂", "Azure"], "ipynb": ["󰠮", "Orange"], "java": ["󰬷", "Orange"], "jl": ["", "Purple"], "jpeg": ["󰈥", "Orange"], "jpg": ["󰈥", "Orange"], "js": ["󰌞", "Yellow"], "json": ["󰘦", "Yellow"], "json5": ["󰘦", "Orange"], "jsonc": ["󰘦", "Yellow"], "jsonnet": ["󰫷", "Yellow"], "jsx": ["", "Azure"], "kdl": ["󰫸", "Grey"], "kt": ["󱈙", "Blue"], "kts": ["󱈙", "Blue"], "less": ["󰌜", "Purple"], "lua": ["󰢱", "Azure"], "m": ["󰿈", "Orange"], "markdown": ["󰍔", "Grey"], "md": ["󰍔", "Grey"], "mjs": ["󰌞", "Yellow"], "mk": ["󱁤", "Grey"], "mkv": ["󰈫", "Green"], "ml": ["", "Orange"], "mm": ["󰫻", "Cyan"], "mod": ["󰫺", "Cyan"], "mov": ["󰈫", "Cyan"], "mp3": ["󰈣", "Azure"], "mp4": ["󰈫", "Azure"], "mts": ["󰛦", "Azure"], "nim": ["", "Yellow"], "nix": ["󱄅", "Azure"], "nu": ["", "Purple"], "org": ["", "Cyan"], "patch": ["󰦓", "Red"], "pdf": ["󰈦", "Red"], "pem": ["󰌇", "Yellow"], "php": ["󰌟", "Purple"], "pkg": ["󰒓", "Cyan"], "pl": ["", "Azure"], "png": ["󰸭", "Purple"], "prisma": ["", "Blue"], "properties": ["󰬷", "Green"], "proto": ["", "Red"], "ps1": ["󰨊", "Blue"], "pug": ["", "Purple"], "py": ["󰌠", "Yellow"], "pyi": ["󰌠", "Yellow"], "r": ["󰟔", "Blue"], "rar": ["󰗄", "Green"], "rb": ["󰴭", "Red"], "ron": ["󱘗", "Cyan"], "rs": ["󱘗", "Orange"], "rst": ["󰊄", "Yellow"], "sass": ["󰟬", "Red"], "scala": ["", "Red"], "scss": ["󰟬", "Red"], "sh": ["", "Grey"], "sln": ["󰘐", "Blue"], "sql": ["󰆼", "Grey"], "sum": ["󰫵", "Red"], "svelte": ["", "Orange"], "svg": ["󰜡", "Yellow"], "swift": ["󰛥", "Orange"], "tar": ["󰗄", "Cyan"], "tf": ["󱁢", "Blue"], "tfvars": ["󱁢", "Azure"], "tgz": ["󰗄", "Grey"], "tiff": ["󰈟", "Yellow"], "tmpl": ["󰬁", "Green"], "toml": ["", "Orange"], "tpl": ["", "Yellow"], "ts": ["󰛦", "Azure"], "tsv": ["", "Blue"], "tsx": ["", "Blue"], "txt": ["󰦪", "Yellow"], "vim": ["", "Green"], "vue": ["󰡄", "Green"], "wat": ["", "Purple"], "wav": ["󰈣", "Green"], "webm": ["󰈫", "Grey"], "webp": ["󰈟", "Blue"], "xml": ["󰗀", "Orange"], "xz": ["󰗄", "Green"], "yaml": ["", "Purple"], "yml": ["", "Purple"], "zig": ["", "Orange"], "zip": ["󰗄", "Azure"], "zsh": ["", "Green"] };
const DIR = { ".cache": ["󰪺", "Cyan"], ".config": ["󱁿", "Cyan"], ".git": ["", "Orange"], ".github": ["", "Azure"], ".local": ["󰉌", "Cyan"], "bin": ["󱧺", "Yellow"], "build": ["󱧼", "Grey"], "doc": ["󱂷", "Purple"], "docs": ["󱂷", "Purple"], "home": ["󱂵", "Yellow"], "lib": ["󰲂", "Yellow"], "lua": ["󰉋", "Blue"], "node_modules": ["", "Green"], "nvim": ["󰉋", "Green"], "src": ["󰴉", "Purple"], "test": ["󱞊", "Blue"], "tests": ["󱞊", "Blue"] };
const DEFAULT_FILE = ["󰈔", "Grey"];
const DEFAULT_DIR = ["󰉋", "Azure"];
const OPEN_DIR = ["\u{f0770}", "Azure"];

function iconFor(name, dir, open) {
  if (dir) return DIR[name] ?? (open ? OPEN_DIR : DEFAULT_DIR);
  if (FILE[name]) return FILE[name];
  const lower = name.toLowerCase();
  for (let i = lower.indexOf("."); i !== -1; i = lower.indexOf(".", i + 1)) {
    const hit = EXT[lower.slice(i + 1)];
    if (hit) return hit;
  }
  return DEFAULT_FILE;
}

// ---------- listing ----------

// One perl run per folder: kind, name, mode, size, mtime and link target per entry.
const PERL = 'my $d = shift; opendir(my $h, $d) or die "$!\\n"; my $n = 0;'
  + ' for my $e (sort readdir $h) { next if $e eq "." or $e eq ".." or $e eq ".git"; my $p = "$d/$e";'
  + ' my @s = lstat($p) or next; my $l = -l _ ? readlink($p) : ""; $l = "" unless defined $l;'
  + ' print join("\\0", (-d $p ? "d" : "f"), $e, $s[2], $s[7], $s[9], $l), "\\0"; last if ++$n > 500; }';

async function directory(path, on) {
  const windowsDirectory = async () => {
    // Windows PowerShell otherwise uses the console code page; exec decodes UTF-8.
    // Links keep directory attributes even when dangling; check their target.
    // Other reparse points (OneDrive's folders) have no LinkType and are folders.
    // PowerShell reads curly single quotes as quotes too, so they're doubled like '.
    const r = await exec("powershell", ["-NoProfile", "-Command", "[Console]::OutputEncoding = [System.Text.UTF8Encoding]::new($false); & { param($p) @(Get-ChildItem -LiteralPath $p -Force -ErrorAction Stop | Where-Object Name -ne '.git' | Select-Object -First 501 | ForEach-Object { @{ name=$_.Name; dir=($_.PSIsContainer -and (-not ($_.Attributes -band [IO.FileAttributes]::ReparsePoint) -or -not $_.LinkType -or ($_.Target -and [IO.Directory]::Exists(([IO.Path]::Combine([IO.Path]::GetDirectoryName($_.FullName), $_.Target[0])))))) } }) | ConvertTo-Json -Compress } '" + path.replace(/['‘’‚‛]/g, "$&$&") + "'"], { on });
    if (r.code !== 0) throw new Error(r.stderr || "Cannot list this folder");
    const result = JSON.parse(r.stdout || "[]");
    return Array.isArray(result) ? result : [result];
  };
  if (!on && window()?.platform === "windows") return windowsDirectory();
  let r;
  try { r = await exec("perl", ["-e", PERL, path], { on }); }
  catch (e) {
    if (on && String(e).includes("program not found")) return plainDirectory(path, on, windowsDirectory);
    throw e;
  }
  if (r.code !== 0) throw new Error(r.stderr || "Cannot list this folder");
  const fields = r.stdout.split("\0"), out = [];
  for (let i = 0; i + 5 < fields.length; i += 6) {
    out.push({ name: fields[i + 1], dir: fields[i] === "d", mode: Number(fields[i + 2]), size: Number(fields[i + 3]), mtime: Number(fields[i + 4]), link: fields[i + 5] || null });
  }
  return out;
}

// The shipped listing (no details), for a machine without perl.
async function plainDirectory(path, on, windowsDirectory) {
  const script = 'n=0; for p in "$1"/* "$1"/.[!.]* "$1"/..?*; do [ -e "$p" ] || [ -L "$p" ] || continue; name=${p##*/}; [ "$name" = .git ] && continue; if [ -d "$p" ]; then kind=d; else kind=f; fi; printf "%s\\0%s\\0" "$kind" "$name"; n=$((n+1)); [ "$n" -gt 500 ] && break; done; test -d "$1"';
  let r;
  try { r = await exec("sh", ["-c", script, "files", path], { on }); }
  catch (e) {
    if (on && String(e).includes("cannot start sh: program not found")) return windowsDirectory();
    throw e;
  }
  if (r.code !== 0) throw new Error(r.stderr || "Cannot list this folder");
  const fields = r.stdout.split("\0"), out = [];
  for (let i = 0; i + 1 < fields.length; i += 2) out.push({ name: fields[i + 1], dir: fields[i] === "d" });
  return out;
}

function modeString(mode, link) {
  if (mode === undefined || Number.isNaN(mode)) return "";
  const type = link ? "l" : (mode & 0o170000) === 0o040000 ? "d" : "-";
  let s = type;
  for (let i = 0; i < 9; i++) s += mode & (1 << (8 - i)) ? "rwxrwxrwx"[i] : "-";
  return s;
}
function sizeString(size, dir) {
  if (dir || size === undefined || Number.isNaN(size)) return "";
  const units = ["B", "K", "M", "G", "T"];
  let n = size, u = 0;
  while (n >= 1024 && u < units.length - 1) { n /= 1024; u++; }
  return u === 0 ? `${n}B` : `${n < 10 ? n.toFixed(1) : Math.round(n)}${units[u]}`;
}
function ageString(mtime) {
  if (!mtime) return "";
  const s = Math.max(0, Date.now() / 1000 - mtime);
  if (s < 60) return "now";
  if (s < 3600) return `${Math.floor(s / 60)}m`;
  if (s < 86400) return `${Math.floor(s / 3600)}h`;
  if (s < 86400 * 14) return `${Math.floor(s / 86400)}d`;
  if (s < 86400 * 60) return `${Math.floor(s / 604800)}w`;
  if (s < 86400 * 365) return `${Math.floor(s / 2592000)}mo`;
  return `${Math.floor(s / 31536000)}y`;
}

// ---------- nvim ----------

const nvimDir = () => `${home()}/.local/state/nvim/herdr`;
const vimString = (s) => `'${String(s).replace(/'/g, "''")}'`;
const shellQuote = (s) => `'${String(s).replace(/'/g, `'\\''`)}'`;

// This space's nvim that listens for us: the "nvim" tab's first, then any other.
async function nvimFor(spaceId) {
  const space = spaces().find(s => s.id === spaceId);
  if (!space || space.machine) return null;
  const tabName = (id) => space.tabs.find(t => t.id === id)?.name;
  const list = terminals().filter(t => t.labels?.["herdr.space"] === spaceId && t.state === "live" && !String(t.address).includes("/"));
  list.sort((a, b) => Number(tabName(b.labels["herdr.tab"]) === "nvim") - Number(tabName(a.labels["herdr.tab"]) === "nvim"));
  for (const t of list) {
    const text = await readTextFile(`${nvimDir()}/${t.address}.json`).catch(() => null);
    if (!text) continue;
    try {
      const s = JSON.parse(text);
      if (s?.sock) return { address: t.address, tab: t.labels["herdr.tab"], sock: s.sock, file: s.file ?? null };
    } catch {}
  }
  return null;
}

// ---------- nvim on another machine ----------
// None of our config there: a stock nvim we start in the space's "nvim" tab, listening on a
// socket named after the space, and drive with `nvim --server` run on that machine. Its yanks
// go to this Mac's clipboard via OSC 52 (Herdr never lets programs read the clipboard, so
// pasting gives back nvim's own last yank; Cmd-V pastes the Mac's). Without nvim there: vim,
// else vi, in a tab of their own per file (they can't be told to open another one).
const remoteSock = (space) => `/tmp/herdr-nvim-${String(space).split("/").pop()}.sock`;
const REMOTE_LUA = String.raw`local ok, osc = pcall(require, 'vim.ui.clipboard.osc52'); if ok then local last = {{''}, 'v'}; local copy = osc.copy('+'); local function save(lines, regtype) last = {lines, regtype}; copy(lines, regtype) end; local function paste() return last end; vim.g.clipboard = {name = 'herdr-osc52', copy = {['+'] = save, ['*'] = save}, paste = {['+'] = paste, ['*'] = paste}}; vim.o.clipboard = 'unnamedplus' end`;
const warnedNoNvim = new Set();

async function openRemote(abs, how, ctx) {
  const sock = remoteSock(ctx.space), on = ctx.on;
  const showTab = () => {
    const tab = spaces().find(s => s.id === ctx.space)?.tabs.find(t => t.name === "nvim");
    if (tab) run("tab.select", { id: tab.id });
  };
  const expr = `[execute(${vimString(how + " ")} .. fnameescape(${vimString(abs)})), 'ok'][1]`;
  const r = await exec("nvim", ["--server", sock, "--remote-expr", expr], { on, timeout: 5000 }).catch(() => null);
  if (r?.code === 0 && r.stdout.trim() === "ok") return showTab();
  if (r?.code === 0 && r.stdout.trim()) return notify({ title: "nvim couldn't open it", body: r.stdout.trim(), level: "error" });

  // Nobody listening (or no nvim there): start one.
  const which = await exec("sh", ["-lc", "command -v nvim || command -v vim || command -v vi"], { on, timeout: 10000 }).catch(() => null);
  const editor = which?.stdout.trim().split("\n")[0]?.split("/").pop();
  if (!editor) return notify({ title: `No nvim, vim or vi on ${on}`, level: "error" });
  if (editor !== "nvim") {
    if (!warnedNoNvim.has(on)) { warnedNoNvim.add(on); notify({ title: `No nvim on ${on}: using ${editor}`, body: "Install neovim there to open files in one editor tab.", level: "info" }); }
    return run("tab.new", { name: abs.split("/").pop(), space: ctx.space, folder: ctx.root, argv: ["sh", "-lc", `${editor} ${shellQuote(abs)}`] });
  }
  const nvim = `rm -f ${shellQuote(sock)}; nvim --listen ${shellQuote(sock)} --cmd ${shellQuote("lua " + REMOTE_LUA)}`;
  run("tab.new", { name: "nvim", space: ctx.space, folder: ctx.root, argv: ["sh", "-lc", `${nvim} ${shellQuote(abs)}; while true; do ${nvim}; done`] });
}

// Opens a file in the space's nvim ("edit" or "vsplit") and shows that nvim.
async function openInNvim(abs, how, ctx) {
  if (ctx.on) return openRemote(abs, how, ctx);
  const n = await nvimFor(ctx.space);
  if (n) {
    const r = await exec("nvim", ["--server", n.sock, "--remote-expr", `v:lua.HerdrOpen(${vimString(abs)}, ${vimString(how)})`], { timeout: 5000 })
      .catch((e) => ({ code: 1, stdout: "", stderr: String(e?.message ?? e) }));
    const said = r.stdout.trim();
    if (r.code === 0 && said === "ok") {
      run("tab.select", { id: n.tab });
      run("pane.focus", { terminal: n.address });
      return;
    }
    if (r.code === 0 && said) { notify({ title: "nvim couldn't open it", body: said, level: "error" }); return; }
    // Not answering (gone without cleaning up): start a fresh one below.
  }
  run("tab.new", { name: "nvim", space: ctx.space, folder: ctx.root, argv: ["zsh", "-lic", `nvim ${shellQuote(abs)}; while true; do nvim; done`] });
}

// ---------- colors ----------

const iconColor = (t, name) => ({ Azure: t.ansi12, Blue: t.ansi4, Cyan: t.ansi6, Green: t.ansi2, Grey: t.muted, Orange: "#f4a261", Purple: t.ansi5, Red: t.ansi1, Yellow: t.ansi3 })[name] ?? t.muted;
const markColor = (t, mark) => mark === "A" ? t.ansi2 : mark === "D" || mark === "U" ? t.ansi1 : t.ansi3;
const RANK = { M: 1, A: 2, D: 3, U: 4 };

const KEY_HELP = [
  ["j k", "down / up"], ["gg G", "top / bottom"], ["^d ^u", "half page"],
  ["l ⏎ o", "open (folder: expand)"], ["h", "collapse / parent"], ["v", "open in nvim split"],
  ["m", "menu"], ["r", "rename"], ["d", "move to Trash"],
  ["y Y", "copy relative / full path"], [". I", "hidden / ignored files"], ["i", "details"],
  ["R", "refresh"], ["esc", "back to terminal"], ["q", "close panel"],
];

export default class Files extends View {
  init(_props, cx) {
    this.handle = cx.focus_handle();
    if (props()?.menu) return this.initMenu(cx);

    this.saved = new Map();
    this.entries = new Map(); this.folders = new Set(); this.pending = new Set(); this.marks = {};
    this.dirMarks = {}; this.ignored = new Set();
    this.scroll = ScrollHandle.new();
    this.flat = [];
    this.showHidden = localStorage.getItem("hidden") !== "0";
    this.showIgnored = localStorage.getItem("ignored") === "1";
    this.showInfo = localStorage.getItem("info") !== "0";
    this.live = new Map();
    this.refresh(cx);
    cx.timer.every(10000, cx => { this.refresh(cx); this.probe(cx); });
    cx.spawn(async cx => { for (;;) { const c = await nextCommand(); this.command(c, cx); cx.notify(); } });
    if (checking()) return;
    // Follow nvim: its state files change whenever it shows another file.
    cx.spawn(async cx => {
      await exec("mkdir", ["-p", nvimDir()]).catch(() => null);
      for (;;) {
        await this.syncNvim(cx);
        try { await watchFolder(nvimDir()); } catch { return; }
      }
    });
  }

  // ---------- where we are ----------

  hasKeys() { return Boolean(this.handle?.is_focused()); }

  // While the panel has the keyboard, it stays on the folder it showed.
  here(force) {
    if (!force && this.hasKeys() && this.context) return { cwd: this.context.cwd, on: this.context.on, space: this.context.space, key: this.context.key };
    const l = location(this.live);
    return { ...l, key: JSON.stringify(l) };
  }

  // Remote terminals: look up where they are; a new folder moves the tree there (`force`: even
  // while the tree has the keyboard, as right after Cmd-E / prefix-e).
  probe(cx, force) {
    const f = focused(), { on } = location();
    if (!on || !f?.terminal || checking()) return;
    const address = f.terminal;
    cx.spawn(async cx => {
      const cwd = await remoteCwd(address, on);
      if (!cwd || this.live.get(address) === cwd) return;
      this.live.set(address, cwd);
      if (force || !this.hasKeys()) this.refresh(cx, true);
      cx.notify();
    });
  }

  watch(root, cx) {
    if (this.on || this.watched === root) return;
    this.watched = root;
    const context = this.context;
    cx.spawn(async cx => {
      try { while (this.context === context) { await watchFolder(root); if (this.current(context)) this.refresh(cx); } }
      catch { if (this.context === context) this.watched = null; }
    });
  }

  current(context) {
    return this.context === context && this.here().key === context.key;
  }

  async loadFolder(path, context) {
    const { on, cwd: root } = context;
    const entries = await directory(path ? `${root}/${path}` : root, on);
    if (!this.current(context) || (path && !this.folders.has(path))) return;
    const used = [...this.entries.entries()].filter(([p]) => p !== path).reduce((n, [, e]) => n + e.length, 0);
    this.entries.set(path, entries.slice(0, Math.max(0, Math.min(PER_FOLDER, TOTAL - used))).sort((a, b) => Number(b.dir) - Number(a.dir) || a.name.localeCompare(b.name)));
    if (entries.length > PER_FOLDER || used + entries.length > TOTAL) this.limited = true;
  }

  refresh(cx, force) {
    const { cwd, on, space, key: next } = this.here(force);
    if (next !== this.context?.key) {
      if (this.context) this.saved.set(this.context.key, { folders: this.folders, cursor: this.cursor });
      const saved = this.saved.get(next);
      this.context = { key: next, cwd, on, space }; this.root = cwd; this.on = on; this.entries = new Map(); this.folders = new Set(saved?.folders);
      this.pending = new Set(); this.marks = {}; this.dirMarks = {}; this.ignored = new Set(); this.watched = null; this.error = null; this.limited = false;
      this.loading = false; this.cursor = saved?.cursor ?? null; this.nvimFile = undefined;
      if (!checking()) cx.spawn(async cx => this.syncNvim(cx));
    }
    if (!cwd || this.loading) return;
    const context = this.context;
    this.loading = true;
    this.limited = false;
    cx.spawn(async cx => {
      try {
        for (const path of ["", ...this.folders]) {
          if (!this.current(context)) return;
          await this.loadFolder(path, context);
        }
        const top = await exec("git", ["rev-parse", "--show-toplevel"], { cwd, on }).catch(() => null);
        const marks = {}, dirMarks = {}, ignored = new Set();
        if (top?.code === 0) {
          const root = top.stdout.trim();
          // Writes nothing under .git (index lock, fsmonitor cookie): the folder watch would refresh again.
          // --ignored=matching lists ignored folders once ("node_modules/"), not their contents.
          const status = await exec("git", ["--no-optional-locks", "-c", "core.fsmonitor=false", "status", "--porcelain=v1", "-z", "--no-renames", "--untracked-files=all", "--ignored=matching"], { cwd, on }).catch(() => null);
          if (status?.code === 0) for (const entry of status.stdout.split("\0").filter(Boolean).slice(0, TOTAL * 2)) {
            const xy = entry.slice(0, 2), abs = `${root}/${entry.slice(3)}`.replace(/\/$/, "");
            if (xy === "!!") { ignored.add(abs); continue; }
            const mark = xy === "??" || xy.includes("A") ? "A" : xy.includes("U") ? "U" : xy.includes("D") ? "D" : "M";
            marks[abs] = mark;
            // Folders holding changes take the strongest change below them.
            for (let p = abs.slice(0, abs.lastIndexOf("/")); p.length > root.length; p = p.slice(0, p.lastIndexOf("/"))) {
              if ((RANK[dirMarks[p]] ?? 0) < RANK[mark]) dirMarks[p] = mark;
            }
          }
        }
        if (!this.current(context)) return;
        this.marks = marks; this.dirMarks = dirMarks; this.ignored = ignored; this.error = null; this.watch(cwd, cx);
      } catch (e) { if (this.current(context)) this.error = String(e); }
      finally { if (this.context === context) this.loading = false; cx.notify(); }
    });
  }

  isIgnored(abs) {
    if (!this.ignored.size) return false;
    for (let p = abs; p.length > (this.root?.length ?? 0); p = p.slice(0, p.lastIndexOf("/"))) if (this.ignored.has(p)) return true;
    return false;
  }

  toggle(path, cx) {
    if (this.folders.has(path)) {
      for (const folder of [...this.folders]) if (folder === path || folder.startsWith(path + "/")) {
        this.folders.delete(folder);
        this.entries.delete(folder);
      }
    } else {
      this.folders.add(path);
      if (!this.entries.has(path) && !this.pending.has(path)) {
        const context = this.context;
        this.pending.add(path);
        cx.spawn(async cx => {
          try { await this.loadFolder(path, context); }
          catch (e) { if (this.current(context)) this.error = String(e); }
          finally { if (this.context === context) this.pending.delete(path); cx.notify(); }
        });
      }
    }
    cx.notify();
  }

  // Expands every folder down to `path` (relative), loading what's missing.
  async reveal(path, context) {
    const parts = path.split("/");
    for (let i = 1; i < parts.length; i++) {
      const folder = parts.slice(0, i).join("/");
      this.folders.add(folder);
      if (!this.entries.has(folder)) await this.loadFolder(folder, context).catch(() => null);
      if (!this.current(context)) return;
    }
  }

  async syncNvim(cx) {
    const context = this.context;
    if (!context || context.on || !context.space) return;
    const n = await nvimFor(context.space);
    const file = n?.file ?? null;
    if (!this.current(context) || file === this.nvimFile) return;
    this.nvimFile = file;
    if (file && this.root && file.startsWith(this.root + "/") && !this.hasKeys()) {
      const rel = file.slice(this.root.length + 1);
      await this.reveal(rel, context);
      if (!this.current(context)) return;
      this.cursor = rel; this.scrollToCursor = true;
    }
    cx.notify();
  }

  // ---------- actions ----------

  ctx() { return { space: this.context?.space, root: this.root, on: this.on }; }

  open(path, entry, how, cx) {
    this.cursor = path;
    if (entry.dir) return this.toggle(path, cx);
    const abs = `${this.root}/${path}`;
    cx.spawn(async () => openInNvim(abs, how, this.ctx()));
    cx.notify();
  }

  menu(path, entry, mode) {
    if (!path || !entry) return;
    openOverlay({ mod: "my-files", kind: "popup", width: 260, height: mode ? 150 : entry.dir ? 256 : 306,
      props: { menu: { abs: `${this.root}/${path}`, rel: path, name: entry.name, dir: entry.dir, ...this.ctx(), mode: mode ?? null } } });
  }

  toggleSetting(name, cx) {
    const field = { hidden: "showHidden", ignored: "showIgnored", info: "showInfo" }[name];
    this[field] = !this[field];
    localStorage.setItem(name, this[field] ? "1" : "0");
    cx.notify();
  }

  leave() {
    const back = this.backPane && panes().some(p => p.pane === this.backPane) ? this.backPane : null;
    if (back) run("pane.focus", { pane: back }); else run("pane.go", { direction: "left" });
  }

  command(c, cx) {
    if (c === "focus") {
      this.probe(cx, true);
      this.handle.focus();
      if (!this.cursor || !this.flat.some(r => r.path === this.cursor)) this.cursor = this.flat[0]?.path ?? null;
      this.scrollToCursor = true;
    } else if (c === "refresh") this.refresh(cx);
  }

  move(by, cx) {
    if (!this.flat.length) return;
    const at = Math.max(0, this.flat.findIndex(r => r.path === this.cursor));
    const next = Math.min(this.flat.length - 1, Math.max(0, at + by));
    this.cursor = this.flat[next].path; this.scrollToCursor = true;
    cx.notify();
  }

  key(e, cx) {
    const k = e.keystroke, ch = e.key_char ?? e.key;
    if (e.modifiers.platform || (e.modifiers.control && !["ctrl-d", "ctrl-u", "ctrl-n", "ctrl-p"].includes(k))) return; // global keys (Ctrl-B, Ctrl-h/j/k/l)
    const row = this.flat.find(r => r.path === this.cursor);
    const half = Math.max(5, Math.floor((this.size?.height ?? 400) / ROW / 2));
    const wasG = this.pendingG; this.pendingG = false;
    let handled = true;
    if (k === "escape") this.leave();
    else if (ch === "j" || k === "down" || k === "ctrl-n") this.move(1, cx);
    else if (ch === "k" || k === "up" || k === "ctrl-p") this.move(-1, cx);
    else if (k === "ctrl-d") this.move(half, cx);
    else if (k === "ctrl-u") this.move(-half, cx);
    else if (ch === "g") { if (wasG) this.move(-Infinity, cx); else this.pendingG = true; }
    else if (ch === "G") this.move(Infinity, cx);
    else if (ch === "l" || k === "right") {
      if (row?.entry.dir && !this.folders.has(row.path)) this.toggle(row.path, cx);
      else if (row?.entry.dir) this.move(1, cx);
      else if (row) this.open(row.path, row.entry, "edit", cx);
    }
    else if (k === "enter" || ch === "o") { if (row) this.open(row.path, row.entry, "edit", cx); }
    else if (ch === "h" || k === "left") {
      if (row?.entry.dir && this.folders.has(row.path)) this.toggle(row.path, cx);
      else if (row?.path.includes("/")) { this.cursor = row.path.slice(0, row.path.lastIndexOf("/")); this.scrollToCursor = true; cx.notify(); }
    }
    else if (ch === "v") { if (row && !row.entry.dir) this.open(row.path, row.entry, "vsplit", cx); }
    else if (ch === "m") this.menu(row?.path, row?.entry);
    else if (ch === "r") this.menu(row?.path, row?.entry, "rename");
    else if (ch === "d") this.menu(row?.path, row?.entry, "trash");
    else if (ch === "y" || ch === "Y") { if (row) { cx.write_to_clipboard(ch === "y" ? row.path : `${this.root}/${row.path}`); notify({ title: "Copied", body: ch === "y" ? row.path : `${this.root}/${row.path}`, timeout: 2000 }); } }
    else if (ch === ".") this.toggleSetting("hidden", cx);
    else if (ch === "I") this.toggleSetting("ignored", cx);
    else if (ch === "i") this.toggleSetting("info", cx);
    else if (ch === "R") this.refresh(cx);
    else if (ch === "?") { this.help = !this.help; cx.notify(); }
    else if (ch === "q") { run("layout.hide", { id: "panel" }); this.leave(); }
    else handled = false;
    if (handled) cx.stop_propagation();
  }

  // ---------- drawing ----------

  rows(prefix, depth, out, t) {
    if (out.length >= TOTAL || depth > 40) return out;
    const focusedNow = this.hasKeys(), mono = settings().font_family;
    for (const entry of this.entries.get(prefix) ?? []) {
      if (out.length >= TOTAL) break;
      const path = prefix ? `${prefix}/${entry.name}` : entry.name, abs = `${this.root}/${path}`;
      const ignored = this.isIgnored(abs);
      if (!this.showHidden && entry.name.startsWith(".")) continue;
      if (!this.showIgnored && ignored) continue;
      const open = this.folders.has(path), mark = entry.dir ? null : this.marks[abs], dirMark = entry.dir ? this.dirMarks[abs] : null;
      const isCursor = this.cursor === path, inNvim = this.nvimFile === abs;
      const [glyph, color] = iconFor(entry.name, entry.dir, open);
      const nameColor = mark || dirMark ? markColor(t, mark || dirMark) : ignored ? t.dim : t.foreground;
      this.flat.push({ path, entry });
      out.push(h_flex().id(`file-${path}`).h(ROW).flex_none().pl(6 + depth * 14).pr(8).gap(6).items_center().rounded(6).cursor_pointer()
        .when(isCursor, el => el.bg(focusedNow ? t.selected : t.surface))
        .hover(s => s.bg(t.hover))
        .on_click((_e, cx) => this.open(path, entry, "edit", cx))
        .on_mouse_down("right", (_e, cx) => { cx.stop_propagation(); this.cursor = path; cx.notify(); this.menu(path, entry); })
        .child(entry.dir ? svg(`mods/my-files/chevron-${open ? "down" : "right"}.svg`).size(12).flex_none().text_color(t.dim) : div().w(12).flex_none())
        .child(div().w(16).flex_none().font_family(ICON_FONT).text_size(14).text_color(ignored ? t.dim : iconColor(t, color)).child(glyph))
        .child(h_flex().flex_1().min_w(0).gap(6).items_center()
          .child(div().flex_shrink_0().max_w_full().truncate().text_color(nameColor).when(inNvim, el => el.underline()).child(entry.name))
          .when(Boolean(entry.link), el => el.child(div().min_w(0).flex_1().truncate().text_size(11).text_color(t.dim).child(`→ ${entry.link}`))))
        .when(this.showInfo && entry.mode !== undefined, el => el
          .child(div().flex_none().font_family(mono).text_size(10.5).text_color(t.dim).child(modeString(entry.mode, entry.link)))
          .child(div().w(34).flex_none().font_family(mono).text_size(10.5).text_color(t.dim).text_right().child(sizeString(entry.size, entry.dir)))
          .child(div().w(26).flex_none().font_family(mono).text_size(10.5).text_color(t.dim).text_right().child(ageString(entry.mtime))))
        .child(div().w(10).flex_none().text_size(11).text_color(markColor(t, mark)).child(mark ?? "")));
      if (entry.dir && open) this.rows(path, depth + 1, out, t);
    }
    return out;
  }

  chip(id, label, on, t, action) {
    return div().id(id).px(6).h(20).flex().items_center().rounded(5).cursor_pointer().text_size(11)
      .text_color(on ? t.foreground : t.dim).when(on, el => el.bg(t.raised)).hover(s => s.bg(t.hover))
      .on_click((_e, cx) => action(cx)).child(label);
  }

  render(cx) {
    if (this.isMenu) return this.renderMenu(cx);
    if (this.here().key !== this.context?.key) {
      const t = focused()?.terminal;
      if (t !== this.probed) { this.probed = t; this.probe(cx); } // another terminal: where is it?
      this.refresh(cx);
    }
    const f = focused();
    if (f?.pane && !this.hasKeys()) this.backPane = f.pane;
    const t = theme(), keys = this.hasKeys();
    this.flat = [];
    const rows = this.rows("", 0, [], t);
    if (this.scrollToCursor) {
      this.scrollToCursor = false;
      const at = this.flat.findIndex(r => r.path === this.cursor);
      if (at >= 0) this.scroll.scroll_to_item(at);
    }
    return v_flex().id("files").track_focus(this.handle).on_key_down((e, cx) => this.key(e, cx))
      .on_size_change((size, cx) => { this.size = size; })
      .size_full().min_h(0).rounded(10).overflow_hidden().bg(t.background).border_1().border_color(keys ? t.accent : t.border).text_color(t.foreground).text_size(13)
      .child(h_flex().h(42).flex_none().px(12).gap(6).items_center().border_b(1).border_color(t.border)
        .child(div().child("Files"))
        .child(div().flex_1().min_w(0).truncate().text_size(12).text_color(t.dim).child(this.root?.split(/[\\/]/).pop() ?? ""))
        .child(this.chip("chip-hidden", ".hidden", this.showHidden, t, cx => this.toggleSetting("hidden", cx)))
        .child(this.chip("chip-ignored", "ignored", this.showIgnored, t, cx => this.toggleSetting("ignored", cx)))
        .child(this.chip("chip-info", "info", this.showInfo, t, cx => this.toggleSetting("info", cx))))
      .child(v_flex().id("files-tree").track_scroll(this.scroll).flex_1().min_h(0).overflow_y_scrollbar().p(6).children(rows)
        .when(Boolean(this.error) || !this.entries.get("")?.length, el => el.child(div().p(8).text_size(12).text_color(t.dim).child(this.error || (this.loading ? "Loading files…" : this.root ? "No files" : "No folder"))))
        .when(this.limited, el => el.child(div().p(8).text_size(11).text_color(t.dim).child("File list limited to 500 entries per folder and 5,000 total"))))
      .when(keys && this.help, el => el.child(v_flex().flex_none().p(10).gap(2).border_t(1).border_color(t.border).text_size(11)
        .children(KEY_HELP.map(([k, what]) => h_flex().gap(8).child(div().w(44).flex_none().text_color(t.accent).child(k)).child(div().text_color(t.muted).child(what))))))
      .when(keys && !this.help, el => el.child(div().flex_none().px(12).py(5).border_t(1).border_color(t.border).text_size(11).text_color(t.dim).truncate()
        .child("j/k move · l open · h back · v split · m menu · ? keys")));
  }

  // ---------- the right-click menu (this mod, opened as a popup) ----------

  initMenu(cx) {
    this.isMenu = true;
    const m = props().menu;
    this.mode = m.mode;
    this.at = 0;
    this.input = InputState.new({ value: m.name });
    const dot = m.name.lastIndexOf(".");
    this.input.set_selected_range({ start: 0, end: !m.dir && dot > 0 ? dot : m.name.length });
    this.input.on("submit", (_e, cx) => this.rename(cx));
    if (this.mode === "rename") { this.input.focus(); cx.timer.after(50, () => this.input.focus()); }
    else { this.handle.focus(); cx.timer.after(50, () => this.handle.focus()); }
  }

  done() { closeOverlay(props().overlay); }

  items() {
    const m = props().menu, local = !m.on, items = [];
    const copy = (text) => (cx) => { cx.write_to_clipboard(text); this.done(); };
    if (!m.dir) {
      items.push(["Open in nvim", "o", () => { this.done(); openInNvim(m.abs, "edit", m); }]);
      items.push(["Open in nvim split", "v", () => { this.done(); openInNvim(m.abs, "vsplit", m); }]);
    } else {
      items.push(["New tab here", "", () => { this.done(); run("tab.new", { space: m.space, folder: m.abs }); }]);
    }
    items.push(null);
    items.push(["Copy relative path", "y", copy(m.rel)]);
    items.push(["Copy full path", "Y", copy(m.abs)]);
    items.push(["Copy name", "", copy(m.name)]);
    if (local) items.push(["Reveal in Finder", "", () => { this.done(); exec("open", ["-R", m.abs]); }]);
    items.push(null);
    items.push(["Rename…", "r", (cx) => { this.mode = "rename"; this.input.focus(); cx.notify(); }]);
    if (local) items.push(["Move to Trash…", "d", (cx) => { this.mode = "trash"; cx.notify(); }, true]);
    return items;
  }

  rename(cx) {
    const m = props().menu, name = this.input.value().trim();
    if (!name || name === m.name) return this.done();
    if (name.includes("/")) { this.problem = "A name can't contain /"; cx.notify(); return; }
    const to = `${m.abs.slice(0, m.abs.lastIndexOf("/"))}/${name}`;
    cx.spawn(async (cx) => {
      const r = await exec("sh", ["-c", '[ -e "$2" ] || [ -L "$2" ] && { echo "$3 already exists" >&2; exit 1; }; mv -- "$1" "$2"', "rename", m.abs, to, name], { on: m.on })
        .catch((e) => ({ code: 1, stderr: String(e?.message ?? e) }));
      if (r.code === 0) return this.done();
      this.problem = r.stderr.trim() || "Rename failed"; cx.notify();
    });
  }

  trash(cx) {
    const m = props().menu;
    cx.spawn(async (cx) => {
      const r = await exec("trash", [m.abs]).catch((e) => ({ code: 1, stderr: String(e?.message ?? e) }));
      if (r.code === 0) return this.done();
      this.problem = r.stderr.trim() || "Couldn't move it to the Trash"; cx.notify();
    });
  }

  menuKey(e, cx) {
    const live = this.items().filter(Boolean), ch = e.key_char ?? e.key;
    if (e.key === "escape") { if (this.mode && !props().menu.mode) { this.mode = null; this.problem = null; cx.notify(); } else this.done(); cx.stop_propagation(); return; }
    if (this.mode === "trash") { if (e.key === "enter" || ch === "y") this.trash(cx); cx.stop_propagation(); return; }
    if (this.mode) return; // the rename field has it
    if (ch === "j" || e.key === "down") this.at = (this.at + 1) % live.length;
    else if (ch === "k" || e.key === "up") this.at = (this.at - 1 + live.length) % live.length;
    else if (e.key === "enter") live[this.at]?.[2](cx);
    else { const hit = live.find(it => it[1] && it[1] === ch); if (hit) hit[2](cx); else return; }
    cx.stop_propagation(); cx.notify();
  }

  renderMenu(cx) {
    const t = theme(), m = props().menu;
    const box = v_flex().id("files-menu").track_focus(this.handle).on_key_down((e, cx) => this.menuKey(e, cx))
      .size_full().p(6).gap(1).bg(t.popover).text_color(t.foreground).text_size(12.5);
    const title = div().px(8).pt(2).pb(6).text_size(11).text_color(t.dim).truncate().child(m.rel);
    const button = (id, label, primary, action) => div().id(id).h(28).px(12).flex().items_center().rounded(7).cursor_pointer()
      .bg(primary ? t.solid : t.raised).text_color(primary ? t.solid_foreground : t.foreground).hover(s => s.opacity(0.88))
      .on_click((_e, cx) => action(cx)).child(label);
    const problem = (el) => el.when(Boolean(this.problem), el => el.child(div().px(8).pt(6).text_size(11).text_color(t.ansi1).child(this.problem)));
    if (this.mode === "rename") {
      return problem(box.child(title)
        .child(div().px(4).child(Input.new(this.input).h(32).px(8).rounded(7).border_1().border_color(t.accent).bg(t.background).text_size(12.5).text_color(t.foreground)))
        .child(h_flex().px(4).pt(10).gap(6).justify_end()
          .child(button("rn-cancel", "Cancel", false, () => this.done()))
          .child(button("rn-save", "Rename", true, (cx) => this.rename(cx)))));
    }
    if (this.mode === "trash") {
      return problem(box.child(title)
        .child(div().px(8).text_color(t.foreground).child(`Move ${m.dir ? "this folder" : "this file"} to the Trash?`))
        .child(h_flex().px(4).pt(12).gap(6).justify_end()
          .child(button("tr-cancel", "Cancel", false, () => this.done()))
          .child(button("tr-ok", "Move to Trash", true, (cx) => this.trash(cx)))));
    }
    let n = -1;
    return box.child(title).children(this.items().map((it, i) => {
      if (!it) return div().id(`sep-${i}`).h(1).my(3).mx(6).bg(t.border);
      const at = ++n, [label, hint, action, danger] = it;
      return h_flex().id(`item-${i}`).h(26).px(8).rounded(6).items_center().cursor_pointer()
        .when(at === this.at, el => el.bg(t.hover)).hover(s => s.bg(t.hover))
        .on_click((_e, cx) => action(cx))
        .child(div().flex_1().text_color(danger ? t.ansi1 : t.foreground).child(label))
        .child(div().text_size(11).text_color(t.dim).child(hint));
    }));
  }
}
