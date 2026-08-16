/**
 * Web Tools for pi — webfetch + websearch
 *
 * Ports opencode's webfetch/websearch behavior to pi as plain TypeScript
 * (no Effect, no new npm deps). See docs/web-tools-design.md for the full spec.
 *
 * - webfetch: fetch a known HTTP(S) URL as markdown/text/html (or image block).
 * - websearch: search the web via a layered provider chain (Exa/Parallel with
 *   a key, anonymous Exa, or keyless DuckDuckGo scrape) with graceful cascade.
 *
 * Both actions are permission-gated per §5.3. websearch adds an interactive
 * "API key onboarding" flow (§9b) that, when no key is found, lets the user
 * paste a key, opt out to DuckDuckGo, or use the anonymous endpoint.
 */

import type { ExtensionAPI, ExtensionContext } from "@earendil-works/pi-coding-agent";
import { StringEnum } from "@earendil-works/pi-ai";
import { Type } from "typebox";

// ────────────────────────────────────────────────────────────────────────────
// Constants (§5.1)
// ────────────────────────────────────────────────────────────────────────────

const MAX_RESPONSE_BYTES = 5 * 1024 * 1024; // 5 MB
const DEFAULT_TIMEOUT_SECONDS = 30;
const MAX_TIMEOUT_SECONDS = 120;
const MAX_SEARCH_RESPONSE_BYTES = 256 * 1024; // search responses are small
const SEARCH_TIMEOUT_MS = 25_000;

const BROWSER_UA =
	"Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 " +
	"(KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36";
const FALLBACK_UA = "opencode"; // used for Cloudflare challenge retry

const EXA_BASE = "https://mcp.exa.ai/mcp";
const PARALLEL_URL = "https://search.parallel.ai/mcp";
const DDG_HTML = "https://html.duckduckgo.com/html/";
const DDG_LITE = "https://lite.duckduckgo.com/lite/";

const NO_RESULTS = "No search results found. Please try a different query.";
const SEARCH_UNAVAILABLE =
	"Web search is currently unavailable (all providers failed). " +
	"Provide an EXA_API_KEY / PARALLEL_API_KEY, set WEBSEARCH_ALLOW_ANON=1, " +
	"or give a specific URL to fetch.";

// ────────────────────────────────────────────────────────────────────────────
// HTML helpers (§5.2) — dependency-free
// ────────────────────────────────────────────────────────────────────────────

const NAMED_ENTITIES: Record<string, string> = {
	amp: "&",
	lt: "<",
	gt: ">",
	quot: '"',
	"#39": "'",
	apos: "'",
	nbsp: " ",
	mdash: "—",
	ndash: "–",
	hellip: "…",
	copy: "©",
	reg: "®",
	trade: "™",
};

function decodeEntities(s: string): string {
	return s.replace(/&(#x?[0-9a-fA-F]+|[a-zA-Z][a-zA-Z0-9]*);/g, (match, body: string) => {
		if (body[0] === "#") {
			const isHex = body[1] === "x" || body[1] === "X";
			const code = parseInt(body.slice(isHex ? 2 : 1), isHex ? 16 : 10);
			if (Number.isFinite(code) && code > 0) {
				try {
					return String.fromCodePoint(code);
				} catch {
					return match;
				}
			}
			return match;
		}
		const named = NAMED_ENTITIES[body] ?? NAMED_ENTITIES[body.toLowerCase()];
		return named ?? match;
	});
}

/** Strip whole elements (including inner content) that never carry useful text. */
function stripNonContentElements(html: string): string {
	return html
		.replace(/<!--[\s\S]*?-->/g, "")
		.replace(/<(script|style|noscript|iframe|object|embed)[\s\S]*?<\/\1>/gi, "");
}

function collapseBlankLines(s: string): string {
	return s
		.replace(/[ \t]+\n/g, "\n")
		.replace(/\n{3,}/g, "\n\n")
		.trim();
}

/** Reproduce opencode's HTML→text without htmlparser2. */
function extractTextFromHTML(html: string): string {
	let out = stripNonContentElements(html);
	// Turn block-level boundaries into newlines to avoid word joining.
	out = out
		.replace(/<\/(p|div|section|article|header|footer|li|tr|h[1-6]|blockquote)>/gi, "\n")
		.replace(/<br\s*\/?>(?=)/gi, "\n");
	// Drop all remaining tags.
	out = out.replace(/<[^>]+>/g, "");
	out = decodeEntities(out);
	return collapseBlankLines(out);
}

/** Lightweight, dependency-free HTML→markdown. Not a full turndown. */
function convertHTMLToMarkdown(html: string): string {
	let out = stripNonContentElements(html);

	// Headings
	for (let level = 1; level <= 6; level++) {
		const hashes = "#".repeat(level);
		out = out.replace(
			new RegExp(`<h${level}[^>]*>([\\s\\S]*?)<\\/h${level}>`, "gi"),
			(_m, inner) => `\n\n${hashes} ${stripTags(inner).trim()}\n\n`,
		);
	}

	// Preformatted / code blocks (before inline code)
	out = out.replace(/<pre[^>]*>([\s\S]*?)<\/pre>/gi, (_m, inner) => {
		const code = decodeEntities(stripTags(inner));
		return `\n\n\`\`\`\n${code.replace(/\n+$/g, "")}\n\`\`\`\n\n`;
	});
	out = out.replace(/<code[^>]*>([\s\S]*?)<\/code>/gi, (_m, inner) => `\`${stripTags(inner)}\``);

	// Images before links (both use similar attrs)
	out = out.replace(/<img\b[^>]*?>/gi, (tag) => {
		const src = attr(tag, "src");
		const alt = attr(tag, "alt") ?? "";
		return src ? `![${alt}](${src})` : "";
	});

	// Links
	out = out.replace(/<a\b[^>]*?href=["']([^"']*)["'][^>]*>([\s\S]*?)<\/a>/gi, (_m, href, inner) => {
		const text = stripTags(inner).trim();
		return text ? `[${text}](${href})` : href;
	});

	// Emphasis
	out = out
		.replace(/<(strong|b)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `**${stripTags(inner).trim()}**`)
		.replace(/<(em|i)\b[^>]*>([\s\S]*?)<\/\1>/gi, (_m, _t, inner) => `*${stripTags(inner).trim()}*`);

	// Blockquotes
	out = out.replace(/<blockquote[^>]*>([\s\S]*?)<\/blockquote>/gi, (_m, inner) => {
		const text = stripTags(inner).trim();
		return `\n\n${text
			.split("\n")
			.map((l) => `> ${l}`)
			.join("\n")}\n\n`;
	});

	// List items
	out = out.replace(/<li[^>]*>([\s\S]*?)<\/li>/gi, (_m, inner) => `\n- ${stripTags(inner).trim()}`);

	// Horizontal rules
	out = out.replace(/<hr\s*\/?>(?=)/gi, "\n\n---\n\n");

	// Block breaks
	out = out
		.replace(/<\/(p|div|section|article|header|footer|tr|table|ul|ol)>/gi, "\n\n")
		.replace(/<br\s*\/?>(?=)/gi, "\n");

	// Strip anything left, decode, collapse.
	out = stripTags(out);
	out = decodeEntities(out);
	return collapseBlankLines(out);
}

function stripTags(s: string): string {
	return s.replace(/<[^>]+>/g, "");
}

function attr(tag: string, name: string): string | undefined {
	const m = tag.match(new RegExp(`${name}\\s*=\\s*["']([^"']*)["']`, "i"));
	return m ? m[1] : undefined;
}

// ────────────────────────────────────────────────────────────────────────────
// Permission gate + session state (§5.3, §9b.2)
// ────────────────────────────────────────────────────────────────────────────

const allowedDomains = new Set<string>(); // webfetch, per hostname
let allowAllSearches = false; // websearch permission

// Search provider onboarding state (§9b.2), in-memory per session.
let sessionExaKey: string | undefined;
let sessionParallelKey: string | undefined;
let searchProviderChoice: "undecided" | "vendor" | "ddg" | "anon" = "undecided";

const exaKey = () => process.env.EXA_API_KEY || sessionExaKey;
const parallelKey = () => process.env.PARALLEL_API_KEY || sessionParallelKey;

async function gateFetch(ctx: ExtensionContext, url: string): Promise<void> {
	const domain = new URL(url).hostname;
	if (allowedDomains.has(domain)) return;
	if (!ctx.hasUI) throw new Error("webfetch denied (no interactive UI)");
	const choice = await ctx.ui.select(`Allow web fetch?\n\n  ${url}`, [
		"Allow once",
		"Allow domain this session",
		"Deny",
	]);
	if (!choice || choice === "Deny") throw new Error("webfetch denied by user");
	if (choice === "Allow domain this session") allowedDomains.add(domain);
}

async function gateSearch(ctx: ExtensionContext, query: string): Promise<void> {
	if (allowAllSearches) return;
	if (!ctx.hasUI) throw new Error("websearch denied (no interactive UI)");
	const choice = await ctx.ui.select(`Allow web search?\n\n  "${query}"`, [
		"Allow once",
		"Allow all searches this session",
		"Deny",
	]);
	if (!choice || choice === "Deny") throw new Error("websearch denied by user");
	if (choice === "Allow all searches this session") allowAllSearches = true;
}

// ────────────────────────────────────────────────────────────────────────────
// Search provider onboarding (§9b.3)
// ────────────────────────────────────────────────────────────────────────────

const PASTE_EXA = "Paste an Exa API key now";
const PASTE_PARALLEL = "Paste a Parallel API key now";
const USE_DDG = "Use DuckDuckGo — no key needed (default)";
const USE_ANON = "Use Exa anonymously this session";

/**
 * Ensure a search provider is resolved. When no key is configured and running
 * interactively, prompt the user to paste a key, opt out to DuckDuckGo, or use
 * the anonymous endpoint. "Wait" semantics: cancelling the paste dialog loops
 * back to the menu instead of silently falling through to DuckDuckGo.
 */
async function ensureSearchProvider(ctx: ExtensionContext): Promise<void> {
	if (envProviderOverride()) return;
	if (searchProviderChoice !== "undecided") return;
	if (exaKey() || parallelKey()) {
		searchProviderChoice = "vendor";
		return;
	}
	if (process.env.WEBSEARCH_ALLOW_ANON === "1") {
		searchProviderChoice = "anon";
		return;
	}
	if (!ctx.hasUI) {
		searchProviderChoice = "ddg"; // non-interactive: silent DDG
		return;
	}

	// Interactive: loop until a terminal choice is made.
	for (;;) {
		const choice = await ctx.ui.select(
			"No web search API key found.\nHow do you want pi to search the web?\n" +
				"(Get a free key at https://exa.ai or https://parallel.ai)",
			[PASTE_EXA, PASTE_PARALLEL, USE_DDG, USE_ANON],
		);

		if (choice === PASTE_EXA) {
			const key = await ctx.ui.input("Paste EXA_API_KEY (Enter to confirm, Esc to go back):", "exa_...");
			if (key && key.trim()) {
				sessionExaKey = key.trim();
				searchProviderChoice = "vendor";
				ctx.ui.notify("Exa key set for this session.", "info");
				return;
			}
			continue; // wait: back to menu
		}

		if (choice === PASTE_PARALLEL) {
			const key = await ctx.ui.input("Paste PARALLEL_API_KEY (Enter to confirm, Esc to go back):", "");
			if (key && key.trim()) {
				sessionParallelKey = key.trim();
				searchProviderChoice = "vendor";
				ctx.ui.notify("Parallel key set for this session.", "info");
				return;
			}
			continue;
		}

		if (choice === USE_DDG) {
			searchProviderChoice = "ddg";
			ctx.ui.setStatus?.("websearch", "web: duckduckgo (no key)");
			ctx.ui.notify("Using DuckDuckGo for web search this session.", "info");
			return;
		}

		if (choice === USE_ANON) {
			searchProviderChoice = "anon";
			return;
		}

		// Menu dismissed (Esc): abort this search without committing a choice.
		throw new Error("websearch cancelled (no provider selected)");
	}
}

function envProviderOverride(): "exa" | "parallel" | "ddg" | undefined {
	const v = process.env.WEBSEARCH_PROVIDER;
	if (v === "exa" || v === "parallel" || v === "ddg") return v;
	return undefined;
}

function resolveProvider(): "exa" | "parallel" | "ddg" {
	const override = envProviderOverride();
	if (override) return override;
	if (searchProviderChoice === "ddg") return "ddg";
	if (searchProviderChoice === "anon") return "exa";
	if (exaKey()) return "exa";
	if (parallelKey()) return "parallel";
	if (process.env.WEBSEARCH_ALLOW_ANON === "1") return "exa";
	return "ddg";
}

// ────────────────────────────────────────────────────────────────────────────
// webfetch (§5.4)
// ────────────────────────────────────────────────────────────────────────────

const WebfetchParams = Type.Object({
	url: Type.String({ description: "The HTTP or HTTPS URL to fetch content from" }),
	format: StringEnum(["markdown", "text", "html"], {
		description: "Return format. Defaults to markdown.",
		default: "markdown",
	}),
	timeout: Type.Optional(
		Type.Number({ description: `Optional timeout in seconds (max ${MAX_TIMEOUT_SECONDS})` }),
	),
});

const ACCEPT_BY_FORMAT: Record<string, string> = {
	markdown: "text/markdown;q=1.0, text/x-markdown;q=0.9, text/plain;q=0.8, text/html;q=0.7, */*;q=0.1",
	text: "text/plain;q=1.0, text/markdown;q=0.9, text/html;q=0.8, */*;q=0.1",
	html: "text/html;q=1.0, application/xhtml+xml;q=0.9, text/plain;q=0.8, text/markdown;q=0.7, */*;q=0.1",
};

/** Combine the tool signal with an internal timeout controller. */
function withTimeout(signal: AbortSignal | undefined, ms: number): { signal: AbortSignal; done: () => void } {
	const controller = new AbortController();
	const timer = setTimeout(() => controller.abort(), ms);
	const onAbort = () => controller.abort();
	if (signal) {
		if (signal.aborted) controller.abort();
		else signal.addEventListener("abort", onAbort, { once: true });
	}
	return {
		signal: controller.signal,
		done: () => {
			clearTimeout(timer);
			signal?.removeEventListener("abort", onAbort);
		},
	};
}

/** Read a response body enforcing the byte cap; aborts past the limit. */
async function readCapped(res: Response, cap: number, controller?: AbortController): Promise<Uint8Array> {
	const lenHeader = res.headers.get("content-length");
	if (lenHeader && Number(lenHeader) > cap) {
		throw new Error(`Response too large (${lenHeader} bytes > ${cap} cap)`);
	}
	if (!res.body) {
		const buf = new Uint8Array(await res.arrayBuffer());
		if (buf.byteLength > cap) throw new Error(`Response too large (> ${cap} cap)`);
		return buf;
	}
	const reader = res.body.getReader();
	const chunks: Uint8Array[] = [];
	let total = 0;
	for (;;) {
		const { done, value } = await reader.read();
		if (done) break;
		if (value) {
			total += value.byteLength;
			if (total > cap) {
				controller?.abort();
				await reader.cancel();
				throw new Error(`Response exceeded ${cap} byte cap`);
			}
			chunks.push(value);
		}
	}
	const out = new Uint8Array(total);
	let offset = 0;
	for (const c of chunks) {
		out.set(c, offset);
		offset += c.byteLength;
	}
	return out;
}

async function fetchWithPolicy(
	url: string,
	format: string,
	timeoutMs: number,
	signal: AbortSignal | undefined,
): Promise<Response> {
	const headers: Record<string, string> = {
		"User-Agent": BROWSER_UA,
		"Accept-Language": "en-US,en;q=0.9",
		Accept: ACCEPT_BY_FORMAT[format] ?? ACCEPT_BY_FORMAT.markdown,
	};

	const t1 = withTimeout(signal, timeoutMs);
	let res: Response;
	try {
		res = await fetch(url, { headers, signal: t1.signal });
	} finally {
		t1.done();
	}

	// Cloudflare challenge retry with a different UA.
	if (res.status === 403 && res.headers.get("cf-mitigated") === "challenge") {
		const t2 = withTimeout(signal, timeoutMs);
		try {
			res = await fetch(url, { headers: { ...headers, "User-Agent": FALLBACK_UA }, signal: t2.signal });
		} finally {
			t2.done();
		}
	}

	return res;
}

// ────────────────────────────────────────────────────────────────────────────
// websearch providers (§5.5)
// ────────────────────────────────────────────────────────────────────────────

const WebsearchParams = Type.Object({
	query: Type.String({ description: "The web search query" }),
	numResults: Type.Optional(Type.Number({ description: "Results to return (default 8, max 20)" })),
	livecrawl: Type.Optional(
		StringEnum(["fallback", "preferred"], { description: "Live crawl mode (vendor providers only)" }),
	),
	type: Type.Optional(
		StringEnum(["auto", "fast", "deep"], { description: "Search depth (vendor providers only)" }),
	),
	contextMaxCharacters: Type.Optional(
		Type.Number({ description: "Max characters of context to return (vendor providers only)" }),
	),
});

type WebsearchInput = {
	query: string;
	numResults?: number;
	livecrawl?: "fallback" | "preferred";
	type?: "auto" | "fast" | "deep";
	contextMaxCharacters?: number;
};

function clampNumResults(n: number | undefined): number {
	if (!n || !Number.isFinite(n)) return 8;
	return Math.max(1, Math.min(20, Math.floor(n)));
}

/** Parse an MCP response that may be direct JSON or an SSE stream. */
function parseMcpResponse(body: string): string | undefined {
	const trimmed = body.trim();
	if (!trimmed) return undefined;

	const takeText = (obj: any): string | undefined => {
		const content = obj?.result?.content;
		if (Array.isArray(content)) {
			const hit = content.find((c: any) => typeof c?.text === "string");
			if (hit) return hit.text as string;
		}
		return undefined;
	};

	if (trimmed[0] === "{") {
		try {
			return takeText(JSON.parse(trimmed));
		} catch {
			return undefined;
		}
	}

	// SSE: scan `data: ` lines.
	for (const line of trimmed.split(/\r?\n/)) {
		const m = line.match(/^data:\s*(.*)$/);
		if (!m) continue;
		const payload = m[1].trim();
		if (!payload || payload === "[DONE]") continue;
		try {
			const text = takeText(JSON.parse(payload));
			if (text) return text;
		} catch {
			// keep scanning
		}
	}
	return undefined;
}

async function mcpSearch(
	provider: "exa" | "parallel",
	params: WebsearchInput,
	signal: AbortSignal | undefined,
): Promise<string | undefined> {
	const numResults = clampNumResults(params.numResults);
	let url: string;
	const headers: Record<string, string> = {
		Accept: "application/json, text/event-stream",
		"Content-Type": "application/json",
	};
	let name: string;
	let args: Record<string, unknown>;

	if (provider === "exa") {
		const key = exaKey();
		url = key ? `${EXA_BASE}?exaApiKey=${encodeURIComponent(key)}` : EXA_BASE;
		name = "web_search_exa";
		args = {
			query: params.query,
			type: params.type || "auto",
			numResults,
			livecrawl: params.livecrawl || "fallback",
			...(params.contextMaxCharacters ? { contextMaxCharacters: params.contextMaxCharacters } : {}),
		};
	} else {
		url = PARALLEL_URL;
		const key = parallelKey();
		if (key) {
			headers.Authorization = `Bearer ${key}`;
			headers["User-Agent"] = "opencode/web.ts";
		}
		name = "web_search";
		args = {
			objective: params.query,
			search_queries: [params.query],
			session_id: `pi-${Date.now()}`,
		};
	}

	const body = JSON.stringify({
		jsonrpc: "2.0",
		id: 1,
		method: "tools/call",
		params: { name, arguments: args },
	});

	const t = withTimeout(signal, SEARCH_TIMEOUT_MS);
	let res: Response;
	try {
		res = await fetch(url, { method: "POST", headers, body, signal: t.signal });
	} finally {
		t.done();
	}
	if (!res.ok) throw new Error(`${provider} search failed: HTTP ${res.status}`);
	const bytes = await readCapped(res, MAX_SEARCH_RESPONSE_BYTES);
	const text = new TextDecoder().decode(bytes);
	const parsed = parseMcpResponse(text);
	if (!parsed) throw new Error(`${provider} search returned no parseable results`);
	return parsed;
}

/** Decode DuckDuckGo redirect hrefs (/l/?uddg=<encoded>) to the real URL. */
function decodeDdgHref(href: string): string {
	try {
		const abs = href.startsWith("http") ? href : `https://duckduckgo.com${href}`;
		const u = new URL(abs);
		const uddg = u.searchParams.get("uddg");
		if (uddg) return decodeURIComponent(uddg);
		return abs;
	} catch {
		return href;
	}
}

async function ddgSearch(
	endpoint: string,
	params: WebsearchInput,
	signal: AbortSignal | undefined,
): Promise<string | undefined> {
	const limit = clampNumResults(params.numResults);
	const url = `${endpoint}?q=${encodeURIComponent(params.query)}`;
	const headers: Record<string, string> = {
		"User-Agent": BROWSER_UA,
		"Accept-Language": "en-US,en;q=0.9",
		Accept: "text/html",
	};

	const t = withTimeout(signal, SEARCH_TIMEOUT_MS);
	let res: Response;
	try {
		res = await fetch(url, { headers, signal: t.signal });
	} finally {
		t.done();
	}
	if (!res.ok) throw new Error(`DuckDuckGo failed: HTTP ${res.status}`);
	const bytes = await readCapped(res, MAX_SEARCH_RESPONSE_BYTES);
	const html = new TextDecoder().decode(bytes);

	const results = parseDdgResults(html, limit);
	if (results.length === 0) return undefined;

	return results
		.map((r, i) => {
			const parts = [`${i + 1}. ${r.title}`, `   ${r.url}`];
			if (r.snippet) parts.push(`   ${r.snippet}`);
			return parts.join("\n");
		})
		.join("\n\n");
}

interface DdgResult {
	title: string;
	url: string;
	snippet?: string;
}

function parseDdgResults(html: string, limit: number): DdgResult[] {
	const results: DdgResult[] = [];

	// html.duckduckgo.com layout: result__a anchors + result__snippet anchors.
	const anchorRe =
		/<a[^>]*class="[^"]*result__a[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
	const snippetRe =
		/<a[^>]*class="[^"]*result__snippet[^"]*"[^>]*>([\s\S]*?)<\/a>/gi;

	const snippets: string[] = [];
	let sm: RegExpExecArray | null;
	while ((sm = snippetRe.exec(html)) !== null) {
		snippets.push(decodeEntities(stripTags(sm[1])).trim());
	}

	let am: RegExpExecArray | null;
	let idx = 0;
	while ((am = anchorRe.exec(html)) !== null && results.length < limit) {
		const url = decodeDdgHref(am[1]);
		const title = decodeEntities(stripTags(am[2])).trim();
		if (!title) continue;
		results.push({ title, url, snippet: snippets[idx] });
		idx++;
	}

	if (results.length > 0) return results;

	// lite.duckduckgo.com fallback: results are plain links in a table.
	const liteRe = /<a[^>]*class="[^"]*result-link[^"]*"[^>]*href="([^"]*)"[^>]*>([\s\S]*?)<\/a>/gi;
	let lm: RegExpExecArray | null;
	while ((lm = liteRe.exec(html)) !== null && results.length < limit) {
		const url = decodeDdgHref(lm[1]);
		const title = decodeEntities(stripTags(lm[2])).trim();
		if (title) results.push({ title, url });
	}

	return results;
}

async function searchWithCascade(
	params: WebsearchInput,
	signal: AbortSignal | undefined,
	details: Record<string, unknown>,
): Promise<{ text: string; provider: string }> {
	const primary = resolveProvider();
	const attempts: Array<{ name: string; run: () => Promise<string | undefined> }> = [];

	if (primary === "exa" || primary === "parallel") {
		attempts.push({ name: primary, run: () => mcpSearch(primary, params, signal) });
	}
	// DDG cascade steps (skip duplicating primary if it was already ddg-html).
	attempts.push({ name: "ddg-html", run: () => ddgSearch(DDG_HTML, params, signal) });
	attempts.push({ name: "ddg-lite", run: () => ddgSearch(DDG_LITE, params, signal) });

	const errors: string[] = [];
	for (const attempt of attempts) {
		try {
			const text = await attempt.run();
			if (text && text.trim()) {
				return { text, provider: attempt.name };
			}
			errors.push(`${attempt.name}: empty`);
		} catch (err) {
			errors.push(`${attempt.name}: ${(err as Error).message}`);
		}
	}

	details.errors = errors;
	return { text: SEARCH_UNAVAILABLE, provider: "none" };
}

// ────────────────────────────────────────────────────────────────────────────
// Registration (§8)
// ────────────────────────────────────────────────────────────────────────────

export type WebfetchInput = {
	url: string;
	format: "markdown" | "text" | "html";
	timeout?: number;
};

export default function web(pi: ExtensionAPI) {
	pi.registerTool({
		name: "webfetch",
		label: "Web Fetch",
		description: "Fetch the contents of a known HTTP/HTTPS URL as markdown, text, or html.",
		promptSnippet: "Fetch the contents of a known HTTP/HTTPS URL as markdown, text, or html.",
		promptGuidelines: [
			"Use webfetch only when you already have a concrete URL to read; if you only have a topic or question, use websearch instead.",
			"Prefer local files and your own knowledge before using webfetch; use it only when the task genuinely needs live external content.",
			"webfetch performs a network request that the user must approve; do not call it speculatively or in loops.",
		],
		parameters: WebfetchParams,

		async execute(_toolCallId, params: WebfetchInput, signal, _onUpdate, ctx) {
			let url = params.url.trim();
			if (url.startsWith("@")) url = url.slice(1);
			if (!/^https?:\/\//i.test(url)) {
				throw new Error(`Invalid URL (must be http or https): ${params.url}`);
			}

			await gateFetch(ctx, url);

			const format = params.format || "markdown";
			const timeoutMs = Math.min((params.timeout ?? DEFAULT_TIMEOUT_SECONDS) * 1000, MAX_TIMEOUT_SECONDS * 1000);

			const res = await fetchWithPolicy(url, format, timeoutMs, signal);
			if (!res.ok) throw new Error(`Fetch failed: HTTP ${res.status} for ${url}`);

			const contentType = res.headers.get("content-type") || "";
			const mime = contentType.split(";")[0].trim().toLowerCase();

			// Image content block (except SVG, treated as text).
			if (mime.startsWith("image/") && mime !== "image/svg+xml") {
				const bytes = await readCapped(res, MAX_RESPONSE_BYTES);
				const base64 = Buffer.from(bytes).toString("base64");
				return {
					content: [{ type: "image" as const, data: base64, mimeType: mime }],
					details: { url, contentType, format: "image" },
				};
			}

			const bytes = await readCapped(res, MAX_RESPONSE_BYTES);
			const raw = new TextDecoder().decode(bytes);
			const isHtml = mime === "text/html" || mime === "application/xhtml+xml" || /^\s*</.test(raw);

			let output: string;
			if (format === "html") {
				output = raw;
			} else if (format === "text") {
				output = isHtml ? extractTextFromHTML(raw) : raw;
			} else {
				output = isHtml ? convertHTMLToMarkdown(raw) : raw;
			}

			return {
				content: [{ type: "text" as const, text: output }],
				details: { url, contentType, format },
			};
		},
	});

	const currentYear = new Date().getFullYear();

	pi.registerTool({
		name: "websearch",
		label: "Web Search",
		description:
			`Search the web for a topic or question and get relevant results. ` +
			`The current year is ${currentYear}; use it when searching for recent events.`,
		promptSnippet: "Search the web for a topic or question and get relevant results.",
		promptGuidelines: [
			"Use websearch to discover information or URLs from a query; if you already have a URL, use webfetch instead.",
			"Prefer local files and your own knowledge before using websearch; only search when the task needs current or external information the user actually asked about.",
			"websearch performs a network request the user must approve; make searches intentional and specific, not exploratory batches.",
		],
		parameters: WebsearchParams,

		async execute(_toolCallId, params: WebsearchInput, signal, _onUpdate, ctx) {
			await gateSearch(ctx, params.query);
			await ensureSearchProvider(ctx);

			const details: Record<string, unknown> = { query: params.query };
			const { text, provider } = await searchWithCascade(params, signal, details);
			details.provider = provider;

			return {
				content: [{ type: "text" as const, text: text || NO_RESULTS }],
				details,
			};
		},
	});

	// §9b.4 — let the user change the search backend mid-session.
	pi.registerCommand("websearch-provider", {
		description: "Choose the web search provider (paste key / DuckDuckGo / anonymous)",
		handler: async (_args, ctx) => {
			if (!ctx.hasUI) {
				ctx.ui.notify("websearch-provider requires an interactive UI.", "warning");
				return;
			}
			searchProviderChoice = "undecided";
			ctx.ui.setStatus?.("websearch", undefined);
			await ensureSearchProvider(ctx);
			ctx.ui.notify(`Web search provider: ${resolveProvider()}`, "info");
		},
	});
}
