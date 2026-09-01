-- chaCon custom keybindings — ported from AeroSpace (macOS)
-- Uses ALT as the primary modifier to mirror the macOS muscle memory.
-- All keys below are free in the default Omarchy binding set.

-- ── Focus (ALT + i/j/k/l) ──────────────────────────────────────────────────
o.bind("ALT + J", "Focus left",  "hyprctl dispatch movefocus l")
o.bind("ALT + K", "Focus down",  "hyprctl dispatch movefocus d")
o.bind("ALT + I", "Focus up",    "hyprctl dispatch movefocus u")
o.bind("ALT + L", "Focus right", "hyprctl dispatch movefocus r")

-- ── Move window (ALT + SHIFT + i/j/k/l) ────────────────────────────────────
o.bind("ALT + SHIFT + J", "Move window left",  "hyprctl dispatch movewindow l")
o.bind("ALT + SHIFT + K", "Move window down",  "hyprctl dispatch movewindow d")
o.bind("ALT + SHIFT + I", "Move window up",    "hyprctl dispatch movewindow u")
o.bind("ALT + SHIFT + L", "Move window right", "hyprctl dispatch movewindow r")

-- ── Resize (ALT + - / =) ────────────────────────────────────────────────────
o.bind("ALT + MINUS", "Resize shrink", "hyprctl dispatch resizeactive -50 0")
o.bind("ALT + EQUAL", "Resize grow",   "hyprctl dispatch resizeactive 50 0")

-- ── Toggle float / split ────────────────────────────────────────────────────
o.bind("ALT + SLASH", "Toggle float",       "hyprctl dispatch togglefloating")
o.bind("ALT + COMMA", "Toggle split",       "hyprctl dispatch togglesplit")

-- ── Workspaces 1–5 (ALT + q/w/e/r/t) ───────────────────────────────────────
o.bind("ALT + Q", "Workspace 1", "hyprctl dispatch workspace 1")
o.bind("ALT + W", "Workspace 2", "hyprctl dispatch workspace 2")
o.bind("ALT + E", "Workspace 3", "hyprctl dispatch workspace 3")
o.bind("ALT + R", "Workspace 4", "hyprctl dispatch workspace 4")
o.bind("ALT + T", "Workspace 5", "hyprctl dispatch workspace 5")

-- ── Workspaces 6–10 (ALT + a/s/d/f/g) ──────────────────────────────────────
o.bind("ALT + A", "Workspace 6",  "hyprctl dispatch workspace 6")
o.bind("ALT + S", "Workspace 7",  "hyprctl dispatch workspace 7")
o.bind("ALT + D", "Workspace 8",  "hyprctl dispatch workspace 8")
o.bind("ALT + F", "Workspace 9",  "hyprctl dispatch workspace 9")
o.bind("ALT + G", "Workspace 10", "hyprctl dispatch workspace 10")

-- ── Move window to workspace 1–5 (ALT + SHIFT + q/w/e/r/t) ─────────────────
o.bind("ALT + SHIFT + Q", "Move to workspace 1", "hyprctl dispatch movetoworkspace 1")
o.bind("ALT + SHIFT + W", "Move to workspace 2", "hyprctl dispatch movetoworkspace 2")
o.bind("ALT + SHIFT + E", "Move to workspace 3", "hyprctl dispatch movetoworkspace 3")
o.bind("ALT + SHIFT + R", "Move to workspace 4", "hyprctl dispatch movetoworkspace 4")
o.bind("ALT + SHIFT + T", "Move to workspace 5", "hyprctl dispatch movetoworkspace 5")

-- ── Move window to workspace 6–10 (ALT + SHIFT + a/s/d/f/g) ────────────────
o.bind("ALT + SHIFT + A", "Move to workspace 6",  "hyprctl dispatch movetoworkspace 6")
o.bind("ALT + SHIFT + S", "Move to workspace 7",  "hyprctl dispatch movetoworkspace 7")
o.bind("ALT + SHIFT + D", "Move to workspace 8",  "hyprctl dispatch movetoworkspace 8")
o.bind("ALT + SHIFT + F", "Move to workspace 9",  "hyprctl dispatch movetoworkspace 9")
o.bind("ALT + SHIFT + G", "Move to workspace 10", "hyprctl dispatch movetoworkspace 10")
