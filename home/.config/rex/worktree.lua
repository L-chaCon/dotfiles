-- Git worktrees as sessions (project.lua), for the repo of the focused pane.
--   worktree:        ask for a branch, check it out in ~/worktrees/<repo>/<branch>
--                    (a new branch starts from origin/main), open it as "<repo>/<branch>".
--   worktree_remove: remove the worktree you're in (git refuses if it has changes)
--                    and close its session. The branch is kept.
local project = require("project")
local home = os.getenv("HOME")

local function git(dir, ...)
  local r = rex.exec({ "git", "-C", dir, ... }, { timeout = 120 })
  return r and r.ok, r and (r.ok and r.stdout or r.stderr):gsub("%s+$", "") or "git did not run"
end

-- The focused pane's folder, its checkout's top and the main checkout.
local function where(ctx)
  local p = rex.block.call("com.superlogical.terminal", "process", { session_id = ctx.session_id, block_id = ctx.block_id })
  local cwd = p and p.foreground and p.foreground.cwd
  local ok, top = git(cwd or home, "rev-parse", "--show-toplevel")
  if not cwd or not ok then
    error("The focused pane isn't in a git repo.", 0)
  end
  local _, common = git(cwd, "rev-parse", "--path-format=absolute", "--git-common-dir")
  return top, (common:gsub("/%.git/?$", ""))
end

rex.action({
  name = "worktree",
  title = "New Worktree…",
  run = function(ctx)
    local _, main = where(ctx)
    local repo = main:match("[^/]+$")
    local branch = rex.ui.input({ title = "New worktree in " .. repo, placeholder = "branch name" })
    branch = branch and branch:gsub("^%s+", ""):gsub("%s+$", "")
    if not branch or branch == "" then
      return
    end
    local path = home .. "/worktrees/" .. repo .. "/" .. branch:gsub("[^%w._-]+", "-")

    local ok, err
    if git(main, "show-ref", "--verify", "--quiet", "refs/heads/" .. branch) then
      ok, err = git(main, "worktree", "add", path, branch)
    else
      git(main, "fetch", "--quiet", "origin")
      if git(main, "show-ref", "--verify", "--quiet", "refs/remotes/origin/" .. branch) then
        ok, err = git(main, "worktree", "add", path, branch) -- tracks origin/<branch>
      else
        local has_remote, base = git(main, "symbolic-ref", "--short", "refs/remotes/origin/HEAD")
        if not has_remote then
          base = git(main, "show-ref", "--verify", "--quiet", "refs/heads/main") and "main" or "master"
        end
        ok, err = git(main, "worktree", "add", "--no-track", "-b", branch, path, base)
      end
    end
    if not ok then
      error(err, 0)
    end
    project.open(path, repo .. "/" .. branch)
  end,
})

rex.action({
  name = "worktree_remove",
  title = "Remove This Worktree…",
  run = function(ctx)
    local top, main = where(ctx)
    if top == main then
      error("This is the main checkout, not a worktree.", 0)
    end
    local name = top:sub(#home + 2)
    if rex.ui.pick({ title = "Remove ~/" .. name .. "?", items = { "Remove" } }) ~= "Remove" then
      return
    end
    local ok, err = git(main, "worktree", "remove", top)
    if not ok then
      error(err, 0)
    end
    local back = project.find(main:match("[^/]+$"))
    if back then
      rex.client.queue("session.select", { session_id = back })
    end
    rex.call("session.attach", { session_id = ctx.session_id }) -- destroy needs it
    local _, derr = rex.call("session.destroy", { session_id = ctx.session_id })
    if derr then
      error("Worktree removed, but its session didn't close: " .. derr, 0)
    end
  end,
})

rex.bind("ctrl+b>g", "worktree")
rex.bind("ctrl+b>shift+g", "worktree_remove")
