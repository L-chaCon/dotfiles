-- chaCon custom keybindings — ported from AeroSpace (macOS)
-- Uses ALT as the primary modifier to mirror the macOS muscle memory.
-- All keys below are free in the default Omarchy binding set.
-- Hyprland 0.56+ Lua config: use hl.dsp.* dispatchers, not "hyprctl dispatch ..." strings.

-- ── Focus (ALT + i/j/k/l) ──────────────────────────────────────────────────
o.bind("ALT + J", "Focus left",  hl.dsp.focus({ direction = "l" }))
o.bind("ALT + K", "Focus down",  hl.dsp.focus({ direction = "d" }))
o.bind("ALT + I", "Focus up",    hl.dsp.focus({ direction = "u" }))
o.bind("ALT + L", "Focus right", hl.dsp.focus({ direction = "r" }))

-- ── Move window (ALT + SHIFT + i/j/k/l) ────────────────────────────────────
o.bind("ALT + SHIFT + J", "Move window left",  hl.dsp.window.move({ direction = "l" }))
o.bind("ALT + SHIFT + K", "Move window down",  hl.dsp.window.move({ direction = "d" }))
o.bind("ALT + SHIFT + I", "Move window up",    hl.dsp.window.move({ direction = "u" }))
o.bind("ALT + SHIFT + L", "Move window right", hl.dsp.window.move({ direction = "r" }))

-- ── Resize (ALT + - / =) ────────────────────────────────────────────────────
o.bind("ALT + MINUS", "Resize shrink", hl.dsp.window.resize({ x = -50, y = 0, relative = true }))
o.bind("ALT + EQUAL", "Resize grow",   hl.dsp.window.resize({ x = 50, y = 0, relative = true }))

-- ── Toggle float / split ────────────────────────────────────────────────────
o.bind("ALT + SLASH", "Toggle float", hl.dsp.window.float({ action = "toggle" }))
o.bind("ALT + COMMA", "Toggle split", hl.dsp.layout("togglesplit"))

-- ── Workspaces 1–10 (ALT + q/w/e/r/t, a/s/d/f/g) ───────────────────────────
-- ── Move window to workspace (ALT + SHIFT + same keys) ─────────────────────
local workspace_keys = { "Q", "W", "E", "R", "T", "A", "S", "D", "F", "G" }
for workspace, key in ipairs(workspace_keys) do
  local ws = tostring(workspace)
  o.bind("ALT + " .. key, "Workspace " .. ws, hl.dsp.focus({ workspace = ws }))
  o.bind("ALT + SHIFT + " .. key, "Move to workspace " .. ws, hl.dsp.window.move({ workspace = ws }))
end
