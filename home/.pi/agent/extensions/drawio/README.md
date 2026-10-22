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

### What `save_diagram` checks before writing

The XML is rejected (nothing is written, the agent gets a list of problems to fix) when:

- it doesn't start with `<mxfile` / end with `</mxfile>` (e.g. truncated output),
- `<diagram>` elements are missing or unbalanced,
- there's an unescaped `&`,
- on an uncompressed page: an `mxCell` id is duplicated or missing, the root cells
  `0`/`1` are missing, or a `source`/`target`/`parent` points at no cell.

Compressed (base64) pages are accepted without cell checks. The result says whether
an existing file was overwritten, and the `/diagram-open …` hint uses the path
relative to the current folder (so files saved in subfolders like
`docs/diagrams/flow.drawio` reopen correctly; it used to print only the basename).

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
