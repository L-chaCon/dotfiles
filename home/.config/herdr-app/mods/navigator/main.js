// navigator: vim-tmux-navigator for Herdr.
// Ctrl-h/j/k/l (keys.json: navigator.left/down/up/right): when the focused pane runs nvim,
// the key goes to nvim, which moves between its windows and, at its edge, runs
// `herdr-app do pane.go` (home/.config/nvim/lua/herdr.lua). Anywhere else: pane.go here.
// It sits in a 0px block of layouts/mine.json ("navigator") because key commands only
// reach mod copies that are shown.
import { View, div } from "gpui-kit";
import { focused, panes, hc, run, nextCommand, checking } from "herdr";

const KEY = { left: "h", down: "j", up: "k", right: "l" };

const runsNvim = (terminal) => panes().find((p) => p.terminal === terminal)?.program?.key === "nvim";

export default class Navigator extends View {
  init(_props, cx) {
    if (checking()) return;
    cx.spawn(async () => {
      for (;;) {
        const dir = await nextCommand();
        if (!KEY[dir]) continue;
        const terminal = focused()?.terminal;
        if (terminal && runsNvim(terminal)) await hc(["keys", terminal, `ctrl+${KEY[dir]}`]);
        else run("pane.go", { direction: dir });
      }
    });
  }

  render() {
    return div();
  }
}
