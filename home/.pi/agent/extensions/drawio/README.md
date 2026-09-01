# drawio extension

Create and edit [drawio](https://www.drawio.com/) diagrams from pi.

## Commands

- `/create-diagram [name]` — the agent turns the current planning discussion
  into a `.drawio` diagram and saves it in your current folder (default
  `diagram.drawio`). It generates mxGraph XML and writes it via the
  `save_diagram` tool.
- `/diagram-open [name]` — starts a local editor server and opens the diagram
  in your browser using an embedded drawio instance. Edit by hand, then
  **Ctrl/Cmd+S** (or autosave) to write changes back to disk. The updated XML is
  fed into the conversation so the agent can read your edits.

The agent can also call the `save_diagram` tool directly at any time.

## Local drawio instance

The editor embeds a local drawio instance that **you run yourself**. Before
opening, `/diagram-open` pings it; if it is not reachable it tells you to start
it (it will not start the container for you).

Default URL is `http://localhost:1234`. Start the container, e.g.:

```bash
docker run -it --rm -p 1234:8080 --user 1234:1234 jgraph/drawio
```

Override the URL if you use a different port:

```bash
export PI_DRAWIO_EMBED_URL="http://localhost:8080"
```

## Files

- `index.ts` — commands, `save_diagram` tool, and the local editor HTTP server.
- `editor.html` — page that embeds drawio and syncs saves back to pi.
