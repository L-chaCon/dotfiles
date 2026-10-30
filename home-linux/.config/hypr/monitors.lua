-- See https://wiki.hypr.land/Configuring/Basics/Monitors/
-- List current monitors and supported resolutions with: hyprctl monitors all

local omarchy_gdk_scale = 2
local fallback_scale = "auto"
local external_scale = 1
local laptop_scale = 1.5

hl.env("GDK_SCALE", tostring(omarchy_gdk_scale))

-- Fallback for any monitor not configured explicitly below (keeps the
-- laptop-only setup working when nothing is plugged in: all workspaces land
-- on eDP-1 automatically).
hl.monitor({ output = "", mode = "preferred", position = "auto", scale = fallback_scale })

-- Physical layout: external HKC (HDMI-A-1) is the MAIN screen on the LEFT,
-- laptop (eDP-1) sits to its RIGHT. Effective width = 1920 / external_scale = 1920.
hl.monitor({ output = "HDMI-A-1", mode = "1920x1080@60", position = "0x0",    scale = external_scale })
hl.monitor({ output = "eDP-1",    mode = "1920x1080@60", position = "1920x0", scale = laptop_scale })

-- Workspace-to-monitor assignment (mirrors the AeroSpace setup).
-- Main screen (HDMI-A-1): workspaces 1-4 and 6-9. Also the default for new
-- workspaces. Laptop (eDP-1): workspaces 5 and 10 (messaging / background apps).
-- These rules only bind when the named monitor exists; unplugged -> fallback
-- above puts everything on the laptop.
for _, ws in ipairs({ 1, 2, 3, 4, 6, 7, 8, 9 }) do
  hl.workspace_rule({ workspace = tostring(ws), monitor = "HDMI-A-1", default = true })
end
for _, ws in ipairs({ 5, 10 }) do
  hl.workspace_rule({ workspace = tostring(ws), monitor = "eDP-1" })
end
