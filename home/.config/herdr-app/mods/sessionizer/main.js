// Ctrl-Space: pick a project folder and open a session for it.
// Type to filter, ↑/↓ (or ctrl-n/ctrl-p) and Enter to open, Esc to leave.
// A folder that already has a space is just shown. Otherwise a new space opens with
// three tabs: 1 nvim, 2 pi, 3 an empty shell (you land on the shell).
import { View, div, svg } from "gpui-kit";
import { v_flex, h_flex, InputState, Input } from "gpui-base";
import { exec, home, spaces, theme, props, run, closeOverlay, notify, checking } from "herdr";

const ROOTS = ["workspace", ".config", "github.com/chaCon", "github.com/tails.com", "workspace/spikes"];
const SHOWN = 11;

// Subsequence match; lower is better (gaps between matched chars), -1 when no match.
function score(text, q) {
  if (!q) return 0;
  let at = -1, cost = 0;
  for (const ch of q) {
    const i = text.indexOf(ch, at + 1);
    if (i < 0) return -1;
    cost += at < 0 ? 0 : i - at - 1;
    at = i;
  }
  return cost;
}

// Start through an interactive login zsh so programs get ~/.zshrc's env (EDITOR=nvim, work
// vars); herdr-core alone only passes the login PATH.
// The program reopens whenever it quits (nvim, pi), so the tab never drops to a shell.
const respawn = (cmd) => ["zsh", "-lic", `while true; do ${cmd}; done`];

async function doCmd(name, args) {
  const r = await exec("herdr-app", ["do", name, JSON.stringify(args)]);
  const out = JSON.parse(r.stdout || "{}");
  if (r.code !== 0 || out.error) throw new Error(`${name}: ${out.error ?? r.stderr}`);
  return out;
}

export default class Sessionizer extends View {
  init(_props, cx) {
    this.home = home();
    this.folders = [];
    this.filter = "";
    this.at = 0;
    this.busy = false;
    this.input = InputState.new({ placeholder: "Open a session in…" });
    this.input.on("change", (_e, cx) => { this.filter = this.input.value(); this.at = 0; cx.notify(); });
    this.input.on("submit", (_e, cx) => this.open(this.matches()[this.at], cx));
    this.handle = cx.focus_handle();
    this.input.focus();
    cx.timer.after(50, () => this.input.focus());
    cx.timer.after(600, () => this.input.focus());
    if (checking()) return;
    cx.spawn(async (cx) => {
      const roots = ROOTS.map((r) => `${this.home}/${r}`);
      const r = await exec("fd", ["-H", "--max-depth=1", "--type", "d", ".", ...roots]).catch(() => null);
      this.folders = (r?.stdout ?? "").split("\n").filter(Boolean).map((p) => p.replace(/\/$/, ""));
      cx.notify();
    });
  }

  short(p) { return p.startsWith(this.home) ? "~" + p.slice(this.home.length) : p; }

  matches() {
    const q = this.filter.toLowerCase().replace(/\s+/g, "");
    return this.folders
      .map((p) => ({ p, s: score(this.short(p).toLowerCase(), q) }))
      .filter((m) => m.s >= 0)
      .sort((a, b) => a.s - b.s)
      .map((m) => m.p);
  }

  close() { closeOverlay(props().overlay); }

  open(folder, cx) {
    if (!folder || this.busy) return;
    const existing = spaces().find((s) => !s.machine && s.folder === folder);
    if (existing) { this.close(); run("space.select", { id: existing.id }); return; }
    this.busy = true;
    cx.notify();
    cx.spawn(async () => {
      try {
        const name = folder.split("/").pop();
        const s = await doCmd("space.new", { name, folder, tab: "nvim", argv: respawn("nvim") });
        await doCmd("tab.new", { space: s.space, name: "pi", folder, argv: respawn("pi"), focus: true });
        await doCmd("tab.new", { space: s.space, name: "shell", folder, focus: true });
      } catch (e) {
        notify({ title: "New session failed", body: String(e?.message ?? e), level: "error" });
      }
      this.close();
    });
  }

  render() {
    const t = theme();
    const list = this.matches();
    this.at = Math.max(0, Math.min(this.at, list.length - 1));
    const first = Math.max(0, Math.min(this.at - Math.floor(SHOWN / 2), list.length - SHOWN));
    const shown = list.slice(first, first + SHOWN);
    const taken = new Set(spaces().filter((s) => !s.machine).map((s) => s.folder));
    const move = (d, cx) => { if (list.length) this.at = (this.at + d + list.length) % list.length; cx.stop_propagation(); cx.notify(); };

    return v_flex().id("sessionizer").track_focus(this.handle).w_full().min_h(0).p(18).gap(10).bg(t.popover).text_size(13)
      .on_key_down((e, cx) => {
        const k = e.key, c = e.modifiers.control;
        if (k === "escape") return this.close();
        if (k === "down" || (c && k === "n")) return move(1, cx);
        if (k === "up" || (c && k === "p")) return move(-1, cx);
      })
      .child(h_flex().items_center()
        .child(div().flex_1().text_size(15).text_color(t.foreground).child(this.busy ? "Opening…" : "New session"))
        .child(div().text_size(11).text_color(t.dim).child("tabs: nvim · pi · shell")))
      .child(h_flex().h(36).flex_none().px(10).gap(8).items_center().rounded(9).border_1().border_color(t.accent).bg(t.background)
        .child(svg("mods/workspace-chrome/search.svg").size(15).text_color(t.dim))
        .child(Input.new(this.input).flex_1().h_full().text_size(12.8).text_color(t.foreground)))
      .child(v_flex().gap(0).children(
        shown.length ? shown.map((p, i) => {
          const on = first + i === this.at;
          return h_flex().id(`ss-${p}`).h(30).px(10).gap(8).items_center().rounded(7).cursor_pointer()
            .when(on, (el) => el.bg(t.hover))
            .hover((s) => s.bg(t.hover))
            .on_click((_e, cx) => this.open(p, cx))
            .child(div().flex_1().truncate().text_color(on ? t.foreground : t.muted).child(this.short(p)))
            .when(taken.has(p), (el) => el.child(div().text_size(11).text_color(t.dim).child("open")));
        }) : [div().px(10).py(6).text_color(t.dim).child(this.folders.length ? "No match" : "Loading…")]))
      .child(div().text_size(11).text_color(t.dim).child(`${list.length} folders · ↑↓ to move · Enter to open · Esc to close`));
  }
}
