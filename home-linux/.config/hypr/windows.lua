-- chaCon custom window rules
-- Assign apps to a default workspace on open. You can still move them freely
-- afterward with your ALT keybindings.

o.window("^(com\\.mitchellh\\.ghostty)$", { workspace = "6" })  -- Ghostty  -> workspace 6
o.window("^(zen)$", { workspace = "7" })                          -- Zen      -> workspace 7
