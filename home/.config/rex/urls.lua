-- URL picker: the URLs in the focused pane (screen and scrollback, newest first),
-- bare localhost/0.0.0.0/127.0.0.1 ports, and the ports running docker containers
-- publish. ctrl+b u opens the pick in the browser, ctrl+b U copies it.
local home = os.getenv("HOME")
local PATH = home .. "/.rd/bin:/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin"
local url_chars = "[%w%-%._~:/%?#%[%]@!%$&%%%*%+,;=]"

local function pane_text(ctx)
  local r = rex.block.call("com.superlogical.terminal", "format", {
    session_id = ctx.session_id,
    block_id = ctx.block_id,
    trim = true,
    unwrap = true,
  })
  return r and r.content or ""
end

local function urls(ctx)
  local items = {}
  -- Newest first: a URL seen again moves to the top. Without a title, the URL is the
  -- title (minus the scheme) and the line it was found in is the subtitle.
  local function add(url, it)
    url = url:gsub("[%.,;:!%?'\"%)%]]+$", ""):gsub("^(https?://[^/]+)/$", "%1")
    for i, old in ipairs(items) do
      if old.id == url then
        table.remove(items, i)
        break
      end
    end
    it.id = url
    it.title = it.title or url:gsub("^https?://", "")
    table.insert(items, 1, it)
  end
  local function from_pane(url, line)
    line = line:gsub("^%s+", ""):gsub("%s+$", "")
    add(url, { subtitle = #line > 100 and line:sub(1, 99) .. "…" or line, detail = "pane", icon = "link" })
  end

  for line in pane_text(ctx):gmatch("[^\n]+") do
    for url in line:gmatch("https?://" .. url_chars .. "+") do
      from_pane(url, line)
    end
    -- Ports without a scheme, such as "localhost:3000" or docker's "0.0.0.0:8080->80/tcp".
    -- (Rex's Lua 5.1 has no %f, so a leading space stands in for the line start.)
    local bare = " " .. line:gsub("https?://" .. url_chars .. "+", "")
    for _, host in ipairs({ "localhost", "0%.0%.0%.0", "127%.0%.0%.1" }) do
      for port in bare:gmatch("[^%w%.]" .. host .. ":(%d+)") do
        from_pane("http://localhost:" .. port, line)
      end
    end
  end

  -- Docker last, so it is listed first.
  local ps = rex.exec({ "docker", "ps", "--format", "{{.Names}}\t{{.Ports}}" }, { timeout = 3, env = { PATH = PATH } })
  for line in ((ps and ps.ok and ps.stdout) or ""):gmatch("[^\n]+") do
    local name, ports = line:match("^(.-)\t(.*)$")
    for port, inner in (ports or ""):gmatch(":(%d+)%->(%d+/%a+)") do
      add("http://localhost:" .. port, {
        title = name,
        subtitle = "http://localhost:" .. port,
        detail = "docker · " .. inner,
        icon = "package",
      })
    end
  end
  return items
end

local function picker(name, title, run)
  rex.action({
    name = name,
    title = title,
    run = function(ctx)
      local items = urls(ctx)
      if #items == 0 then
        error("No URLs in this pane, and no docker ports.", 0)
      end
      local url = rex.ui.pick({ title = title, placeholder = "URL", items = items })
      if url then
        run(url)
      end
    end,
  })
end

picker("urls_open", "Open URL…", function(url)
  rex.exec({ "open", url })
end)
picker("urls_copy", "Copy URL…", function(url)
  rex.exec({ "pbcopy" }, { stdin = url })
end)

rex.bind("ctrl+b>u", "urls_open")
rex.bind("ctrl+b>shift+u", "urls_copy")
