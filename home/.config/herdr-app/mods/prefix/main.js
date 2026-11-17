// tmux-style prefix: Ctrl-B opens this, the next key runs a command (like tmux), then it closes.
// Esc or any unbound key just closes it. Ctrl-B twice sends Ctrl-B to the program.
import { View, div } from "gpui-kit";
import { v_flex, h_flex } from "gpui-base";
import { run, hc, theme, props, closeOverlay, focused, spaces, layout } from "herdr";

const cwd = () => focused()?.cwd ?? spaces().find((s) => s.active)?.folder;

// The right panel (layouts/mine.json: column "panel" holding stack "panel-body" with the
// "files" block (my-files mod) and the shipped "changes" mod). Opens it on `child`; already showing
// that child: hides it. Opening the file tree also gives it the keyboard (vim keys).
function findNode(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const c of node.children ?? []) { const hit = findNode(c, id); if (hit) return hit; }
  return null;
}
async function togglePanel(child) {
  const root = layout(), panel = findNode(root, "panel"), stack = findNode(root, "panel-body");
  if (panel && !panel.hidden && stack?.active === child) return run("layout.hide", { id: "panel" });
  await run("layout.select", { stack: "panel-body", child });
  await run("layout.show", { id: "panel" });
  if (child === "files") run("my-files.focus");
}

// key -> [label, action]; keys are gpui key names ("shift" is folded into the character).
const KEYS = {
  c: ["new window", () => run("tab.new", { folder: cwd() })],
  n: ["next window", () => run("tab.next")],
  p: ["prev window", () => run("tab.prev")],
  ",": ["rename window", () => run("tab.rename")],
  "&": ["kill window", () => run("tab.close")],
  w: ["choose window", () => run("mod.open", { name: "picker" })],
  s: ["choose session", () => run("mod.open", { name: "picker" })],
  "(": ["prev session", () => run("space.prev")],
  ")": ["next session", () => run("space.next")],
  $: ["rename session", () => run("space.rename")],
  v: ["split side by side", () => run("pane.split", { direction: "right" })],
  "-": ["split stacked", () => run("pane.split", { direction: "down" })],
  x: ["kill pane", () => run("pane.close")],
  z: ["zoom pane", () => run("pane.zoom")],
  h: ["pane left", () => run("pane.go", { direction: "left" })],
  j: ["pane down", () => run("pane.go", { direction: "down" })],
  k: ["pane up", () => run("pane.go", { direction: "up" })],
  l: ["pane right", () => run("pane.go", { direction: "right" })],
  left: ["", () => run("pane.go", { direction: "left" })],
  down: ["", () => run("pane.go", { direction: "down" })],
  up: ["", () => run("pane.go", { direction: "up" })],
  right: ["", () => run("pane.go", { direction: "right" })],
  b: ["sidebar", () => run("layout.toggle", { id: "sidebar" })], // fully hidden, not the narrow rail
  e: ["files", () => togglePanel("files")],
  f: ["git changes", () => togglePanel("changes")],
  g: ["new worktree", () => run("mod.open", { name: "worktree-session" })],
  "[": ["search", () => run("terminal.search")],
  "?": ["commands", () => run("app.palette")],
};
for (let i = 1; i <= 9; i++) KEYS[String(i)] = [i === 1 ? "window 1-9" : "", () => run("tab.select", { index: i })];

// Turn a key event into the character tmux would see (shift+5 -> %, shift+' -> ").
const SHIFTED = { "1": "!", "2": "@", "3": "#", "4": "$", "5": "%", "6": "^", "7": "&", "8": "*", "9": "(", "0": ")", "'": '"', ",": "<", ".": ">", "/": "?", ";": ":", "[": "{", "]": "}", "-": "_", "=": "+" };
function keyOf(e) {
  const k = e.key;
  if (e.key_char && e.key_char.length === 1) return e.key_char;
  return e.modifiers.shift && SHIFTED[k] ? SHIFTED[k] : k;
}

export default class Prefix extends View {
  init(_props, cx) {
    this.handle = cx.focus_handle();
    this.handle.focus();
    cx.timer.after(50, () => this.handle.focus());
  }

  close() { closeOverlay(props().overlay); }

  render() {
    const t = theme();
    const cell = (k, label) => h_flex().w(130).gap(8).items_center()
      .child(div().w(22).px(4).rounded(4).bg(t.raised).text_color(t.accent).child(k))
      .child(div().text_color(t.muted).truncate().child(label));
    const shown = Object.entries(KEYS).filter(([, [l]]) => l);
    const rows = [];
    for (let i = 0; i < shown.length; i += 4) rows.push(h_flex().gap(6).children(shown.slice(i, i + 4).map(([k, [l]]) => cell(k, l))));

    return v_flex().id("prefix").track_focus(this.handle).w_full().min_h(0).p(14).gap(6).bg(t.popover).text_size(12)
      .on_key_down((e, cx) => {
        cx.stop_propagation();
        const m = e.modifiers;
        if (["shift", "control", "alt", "platform"].includes(e.key)) return; // a lone modifier: keep waiting
        this.close();
        if (m.control && e.key === "b") {
          const term = focused()?.terminal;
          if (term) hc(["keys", term, "ctrl+b"]);
          return;
        }
        if (m.control || m.platform) return;
        KEYS[keyOf(e)]?.[1]();
      })
      .child(div().text_size(13).text_color(t.foreground).child("C-b  (Esc to cancel)"))
      .children(rows)
      .child(div().text_size(11).text_color(t.dim).child("C-hjkl: move pane · C-b C-b: send C-b · C-Space: new session"));
  }
}
