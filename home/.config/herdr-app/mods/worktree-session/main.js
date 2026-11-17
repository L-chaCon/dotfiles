// Ctrl-B g: new git worktree of the focused pane's repo, opened as a space with the same
// three tabs as Ctrl-Space (nvim, pi, shell; you land on the shell). Checkouts go where
// Herdr's own New worktree puts them (settings.json worktrees.directory, default
// ~/.herdr/worktrees/<repo>/<branch>), and the space is left unnamed so the sidebar nests
// it under its repo. An existing local or remote branch is checked out; a new name branches
// from the current HEAD.
import { View, div } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, home, theme, props, closeOverlay, focused, spaces, settings, checking } from "herdr";

// The program reopens whenever it quits (nvim, pi), so the tab never drops to a shell.
const respawn = (cmd) => ["zsh", "-lic", `while true; do ${cmd}; done`];
const slug = (b) => b.replace(/[^\p{L}\p{M}\p{N}._-]+/gu, "-").replace(/^-+|-+$/g, "") || "branch";
const tilde = (p) => (p.startsWith(home()) ? "~" + p.slice(home().length) : p);

async function git(cwd, args) {
  const r = await exec("git", args, { cwd, timeout: 600_000 });
  return { ok: r.code === 0, out: r.stdout.trim(), err: r.stderr.trim() };
}

async function doCmd(name, args) {
  const r = await exec("herdr-app", ["do", name, JSON.stringify(args)]);
  const out = JSON.parse(r.stdout || "{}");
  if (r.code !== 0 || out.error) throw new Error(`${name}: ${out.error ?? r.stderr}`);
  return out;
}

export default class WorktreeSession extends View {
  init(_props, cx) {
    this.repo = undefined; // undefined: looking, null: not a git repo
    this.error = "";
    this.busy = false;
    this.handle = cx.focus_handle();
    this.input = InputState.new({ placeholder: "branch name" });
    this.input.on("change", (_e, cx) => { this.error = ""; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.create(cx));
    this.input.focus();
    cx.timer.after(50, () => this.input.focus());
    cx.timer.after(600, () => this.input.focus());
    if (checking()) return;
    cx.spawn(async (cx) => {
      const cwd = focused()?.cwd ?? spaces().find((s) => s.active)?.folder ?? home();
      const common = await git(cwd, ["rev-parse", "--path-format=absolute", "--git-common-dir"]).catch(() => ({ ok: false }));
      // The main checkout is the folder holding the shared .git, so worktrees of worktrees still name the repo.
      this.repo = common.ok ? common.out.replace(/\/\.git\/?$/, "") : null;
      cx.notify();
    });
  }

  close() { closeOverlay(props().overlay); }

  create(cx) {
    const branch = this.input.value().trim();
    if (this.busy || !this.repo || !branch) return;
    this.busy = true;
    cx.notify();
    cx.spawn(async (cx) => {
      try {
        let dir = settings()?.worktrees?.directory ?? "~/.herdr/worktrees";
        if (dir === "~" || dir.startsWith("~/")) dir = home() + dir.slice(1);
        const path = `${dir.replace(/\/+$/, "")}/${this.repo.split("/").pop()}/${slug(branch)}`;
        const local = (await git(this.repo, ["show-ref", "--verify", "--quiet", `refs/heads/${branch}`])).ok;
        const remote = (await git(this.repo, ["for-each-ref", "--format=%(refname)", `refs/remotes/*/${branch}`])).out !== "";
        const add = local || remote ? ["worktree", "add", path, branch] : ["worktree", "add", "-b", branch, path, "HEAD"];
        const r = await git(this.repo, add);
        if (!r.ok) throw new Error(r.err || "git worktree add failed");
        const s = await doCmd("space.new", { folder: path, tab: "nvim", argv: respawn("nvim") });
        await doCmd("tab.new", { space: s.space, name: "pi", folder: path, argv: respawn("pi"), focus: true });
        await doCmd("tab.new", { space: s.space, name: "shell", folder: path, focus: true });
        this.close();
      } catch (e) {
        this.error = String(e?.message ?? e);
        this.busy = false;
        cx.notify();
      }
    });
  }

  render() {
    const t = theme();
    const sub = this.repo === undefined ? "Looking for the repo…" : this.repo === null ? "This pane isn't in a git repo." : `${tilde(this.repo)} · tabs: nvim · pi · shell`;
    return v_flex().id("worktree-session").track_focus(this.handle).w_full().min_h(0).p(18).gap(10).bg(t.popover).text_size(13)
      .on_key_down((e) => { if (e.key === "escape") this.close(); })
      .child(h_flex().items_center()
        .child(div().flex_1().text_size(15).text_color(t.foreground).child(this.busy ? "Creating…" : "New worktree"))
        .child(div().text_size(11).text_color(t.dim).truncate().child(sub)))
      .child(h_flex().h(36).flex_none().px(10).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background)
        .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)))
      .child(div().text_size(11).text_color(this.error ? t.blocked : t.dim).child(this.error || "Enter to create · Esc to close · existing branches are checked out"));
  }
}
