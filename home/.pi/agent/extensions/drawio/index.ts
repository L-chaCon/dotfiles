/**
 * drawio extension
 *
 * Workflow:
 *   1. /create-diagram [name]  -> the agent builds a .drawio diagram from the
 *      current planning session and saves it in the current folder.
 *   2. /diagram-open [name]    -> opens the diagram in a browser-based drawio
 *      editor served from a local instance so you can edit it by hand.
 *   3. When you save in the browser, the file is written back to disk and the
 *      change is fed into the conversation so the agent can read it.
 *
 * A local drawio editor is served at http://127.0.0.1:<port>/. It embeds a
 * local drawio instance (e.g. a `jgraph/drawio` Docker container) that you run
 * yourself. Before opening, the extension pings that instance; if it is not up,
 * it asks you to start it rather than starting it for you.
 *
 * Config (env):
 *   PI_DRAWIO_EMBED_URL  Base URL of the local drawio editor to embed.
 *                        Default: http://localhost:1234
 */

import type {
	ExtensionAPI,
	ExtensionCommandContext,
} from "@earendil-works/pi-coding-agent";
import { Type } from "typebox";
import { createServer, type Server } from "node:http";
import { spawn } from "node:child_process";
import { readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { watch, type FSWatcher } from "node:fs";
import { dirname, isAbsolute, join, basename } from "node:path";
import { fileURLToPath } from "node:url";

const HERE = dirname(fileURLToPath(import.meta.url));
const EMBED_URL =
	process.env.PI_DRAWIO_EMBED_URL?.replace(/\/+$/, "") || "http://localhost:1234";

/** Ping the local drawio instance to check it is running. */
async function drawioIsUp(timeoutMs = 1500): Promise<boolean> {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), timeoutMs);
	try {
		await fetch(`${EMBED_URL}/`, { signal: controller.signal });
		return true; // any HTTP response means the server is up
	} catch {
		return false;
	} finally {
		clearTimeout(timer);
	}
}

/** Blank drawio document used when creating a file that does not exist yet. */
const BLANK_DIAGRAM = `<mxfile host="pi-drawio">
  <diagram name="Page-1" id="page-1">
    <mxGraphModel dx="800" dy="600" grid="1" gridSize="10" guides="1" tooltips="1" connect="1" arrows="1" fold="1" page="1" pageScale="1" pageWidth="850" pageHeight="1100" math="0" shadow="0">
      <root>
        <mxCell id="0" />
        <mxCell id="1" parent="0" />
      </root>
    </mxGraphModel>
  </diagram>
</mxfile>
`;

/** Normalize a user-supplied name into an absolute .drawio path under cwd. */
function resolveDiagramPath(name: string, cwd: string): string {
	let trimmed = name.trim();
	if (!trimmed) trimmed = "diagram";
	if (!/\.drawio$/i.test(trimmed) && !/\.xml$/i.test(trimmed)) {
		trimmed += ".drawio";
	}
	return isAbsolute(trimmed) ? trimmed : join(cwd, trimmed);
}

async function fileExists(path: string): Promise<boolean> {
	try {
		await stat(path);
		return true;
	} catch {
		return false;
	}
}

/** Open a URL in the OS default browser. */
function openBrowser(url: string): void {
	const platform = process.platform;
	const cmd =
		platform === "darwin" ? "open" : platform === "win32" ? "cmd" : "xdg-open";
	const args = platform === "win32" ? ["/c", "start", "", url] : [url];
	try {
		spawn(cmd, args, { stdio: "ignore", detached: true }).unref();
	} catch {
		/* ignore */
	}
}

// ---------------------------------------------------------------------------
// Local editor server (one at a time, session-scoped)
// ---------------------------------------------------------------------------

interface EditorSession {
	server: Server;
	watcher?: FSWatcher;
	port: number;
	file: string;
}

let editor: EditorSession | null = null;

async function closeEditor(): Promise<void> {
	if (!editor) return;
	const current = editor;
	editor = null;
	current.watcher?.close();
	await new Promise<void>((resolve) => current.server.close(() => resolve()));
}

/**
 * Start (or restart) the local drawio editor bound to `file`.
 * `onSave` is called with the new XML whenever the browser saves the diagram.
 */
async function startEditor(
	file: string,
	onSave: (xml: string) => void,
): Promise<number> {
	await closeEditor();

	const htmlTemplate = await readFile(join(HERE, "editor.html"), "utf-8");
	const html = htmlTemplate.replace(/__EMBED_URL__/g, EMBED_URL);

	const server = createServer(async (req, res) => {
		const url = new URL(req.url ?? "/", "http://127.0.0.1");

		// Serve the editor page.
		if (req.method === "GET" && url.pathname === "/") {
			res.writeHead(200, { "content-type": "text/html; charset=utf-8" });
			res.end(html);
			return;
		}

		// Return current diagram XML.
		if (req.method === "GET" && url.pathname === "/api/diagram") {
			let xml = BLANK_DIAGRAM;
			if (await fileExists(file)) xml = await readFile(file, "utf-8");
			res.writeHead(200, {
				"content-type": "application/xml; charset=utf-8",
				"x-diagram-name": basename(file),
			});
			res.end(xml);
			return;
		}

		// Persist edited diagram XML.
		if (req.method === "POST" && url.pathname === "/api/diagram") {
			const chunks: Buffer[] = [];
			for await (const chunk of req) chunks.push(chunk as Buffer);
			const xml = Buffer.concat(chunks).toString("utf-8");
			try {
				await mkdir(dirname(file), { recursive: true });
				await writeFile(file, xml, "utf-8");
				onSave(xml);
				res.writeHead(200, { "content-type": "application/json" });
				res.end(JSON.stringify({ ok: true }));
			} catch (err) {
				res.writeHead(500, { "content-type": "application/json" });
				res.end(JSON.stringify({ ok: false, error: String(err) }));
			}
			return;
		}

		res.writeHead(404);
		res.end("not found");
	});

	const port = await new Promise<number>((resolve, reject) => {
		server.once("error", reject);
		server.listen(0, "127.0.0.1", () => {
			const addr = server.address();
			if (addr && typeof addr === "object") resolve(addr.port);
			else reject(new Error("failed to bind editor server"));
		});
	});

	editor = { server, port, file };
	return port;
}

// ---------------------------------------------------------------------------
// Extension entry point
// ---------------------------------------------------------------------------

export default function drawioExtension(pi: ExtensionAPI) {
	// Tool the agent calls to write a diagram to disk.
	pi.registerTool({
		name: "save_diagram",
		label: "Save Diagram",
		description:
			"Save a drawio (.drawio) diagram to disk. `xml` must be a complete " +
			"drawio/mxGraph document (an <mxfile> containing a <diagram> with an " +
			"<mxGraphModel>). Use this to persist diagrams created from planning.",
		parameters: Type.Object({
			xml: Type.String({
				description:
					"Complete drawio XML document (<mxfile>...</mxfile>). Must be valid " +
					"mxGraph XML that drawio can open.",
			}),
			name: Type.Optional(
				Type.String({
					description:
						"File name (with or without .drawio). Saved in the current " +
						"working directory unless an absolute path is given.",
				}),
			),
		}),
		async execute(_toolCallId, params, _signal, _onUpdate, ctx) {
			const path = resolveDiagramPath(params.name ?? "diagram", ctx.cwd);
			await mkdir(dirname(path), { recursive: true });
			await writeFile(path, params.xml, "utf-8");
			return {
				content: [
					{
						type: "text",
						text: `Saved diagram to ${path}\nOpen it for manual editing with: /diagram-open ${basename(path)}`,
					},
				],
				details: { path },
			};
		},
	});

	// 1. Ask the agent to build a diagram from the current planning session.
	pi.registerCommand("create-diagram", {
		description:
			"Create a drawio diagram from the current planning session and save it",
		handler: async (args, ctx: ExtensionCommandContext) => {
			const path = resolveDiagramPath(args || "diagram", ctx.cwd);
			const prompt =
				`Create a diagram in drawio format that represents our current ` +
				`planning discussion (architecture, flow, or structure as appropriate). ` +
				`Produce a complete, valid mxGraph XML document and save it by calling ` +
				`the save_diagram tool with name "${basename(path)}". ` +
				`Lay out nodes so they do not overlap, label edges where useful, and ` +
				`keep the diagram readable.`;
			pi.sendMessage(
				{ customType: "drawio", content: prompt, display: true },
				{ triggerTurn: true },
			);
		},
	});

	// 2. Open a diagram in the local browser-based drawio editor.
	pi.registerCommand("diagram-open", {
		description: "Open a .drawio file in a local browser editor",
		handler: async (args, ctx: ExtensionCommandContext) => {
			const path = resolveDiagramPath(args || "diagram", ctx.cwd);

			// The local drawio instance is your responsibility to run.
			if (!(await drawioIsUp())) {
				ctx.ui.notify(
					`drawio is not reachable at ${EMBED_URL}. Start your local drawio ` +
						`container (e.g. \`docker run -it --rm -p 1234:8080 --user 1234:1234 jgraph/drawio\`), then ` +
						`run /diagram-open again.`,
					"error",
				);
				return;
			}

			if (!(await fileExists(path))) {
				const create = await ctx.ui.confirm(
					"Diagram not found",
					`${basename(path)} does not exist. Create a blank diagram?`,
				);
				if (!create) return;
				await mkdir(dirname(path), { recursive: true });
				await writeFile(path, BLANK_DIAGRAM, "utf-8");
			}

			let port: number;
			try {
				port = await startEditor(path, (xml) => {
					// 3. Feed the saved change back into the conversation.
					pi.sendMessage(
						{
							customType: "drawio",
							content:
								`The diagram "${basename(path)}" was edited and saved in the ` +
								`browser. Updated drawio XML:\n\n\`\`\`xml\n${xml}\n\`\`\``,
							display: true,
						},
						{ triggerTurn: false },
					);
					if (ctx.hasUI) ctx.ui.notify(`Saved ${basename(path)}`, "info");
				});
			} catch (err) {
				ctx.ui.notify(`Failed to start editor: ${String(err)}`, "error");
				return;
			}

			const url = `http://127.0.0.1:${port}/`;
			openBrowser(url);
			ctx.ui.notify(
				`Editing ${basename(path)} at ${url} (save in-browser to sync back)`,
				"info",
			);
		},
	});

	// Close the editor when the session goes away.
	pi.on("session_shutdown", async () => {
		await closeEditor();
	});
}
