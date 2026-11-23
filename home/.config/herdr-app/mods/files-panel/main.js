// Cmd-E: open the file tree (the right panel's "files" block, my-files mod) with the keyboard, or
// hide it if it's already showing. The same as the prefix's `e`, but a key of its own so it works
// where Ctrl-B belongs to tmux. Nothing to show: it acts and closes at once.
import { View, div } from "gpui-kit";
import { run, props, closeOverlay, layout, checking } from "herdr";

function findNode(node, id) {
  if (!node || typeof node !== "object") return null;
  if (node.id === id) return node;
  for (const c of node.children ?? []) { const hit = findNode(c, id); if (hit) return hit; }
  return null;
}

async function toggleFiles() {
  const root = layout(), panel = findNode(root, "panel"), stack = findNode(root, "panel-body");
  if (panel && !panel.hidden && stack?.active === "files") return run("layout.hide", { id: "panel" });
  await run("layout.select", { stack: "panel-body", child: "files" });
  await run("layout.show", { id: "panel" });
  run("my-files.focus");
}

export default class FilesPanel extends View {
  init(_props, cx) {
    if (checking()) return;
    // Closed first, then the panel takes the keyboard (as the prefix's `e` does).
    closeOverlay(props().overlay);
    toggleFiles();
  }

  render() { return div(); }
}
