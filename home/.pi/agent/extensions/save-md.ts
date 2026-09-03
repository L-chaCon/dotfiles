import type { ExtensionAPI, ExtensionCommandContext } from "@earendil-works/pi-coding-agent";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, isAbsolute, join } from "node:path";

type ContentBlock = { type?: string; text?: string };

type SessionEntry = {
	type: string;
	message?: {
		role?: string;
		content?: unknown;
	};
};

/** Extract plain text from a message content value. */
const extractText = (content: unknown): string => {
	if (typeof content === "string") return content;
	if (!Array.isArray(content)) return "";
	return content
		.filter((p): p is ContentBlock => !!p && typeof p === "object")
		.filter((p) => p.type === "text" && typeof p.text === "string")
		.map((p) => p.text as string)
		.join("\n");
};

/** Find the text of the most recent assistant message in the current branch. */
const getLastAssistantResponse = (entries: SessionEntry[]): string | undefined => {
	for (let i = entries.length - 1; i >= 0; i--) {
		const entry = entries[i];
		if (entry.type !== "message" || entry.message?.role !== "assistant") continue;
		const text = extractText(entry.message.content).trim();
		if (text.length > 0) return text;
	}
	return undefined;
};

/** Resolve the output file path from the command args (or a default). */
const resolvePath = (args: string, cwd: string): string => {
	const trimmed = args.trim();
	if (trimmed) {
		return isAbsolute(trimmed) ? trimmed : join(cwd, trimmed);
	}
	const stamp = new Date().toISOString().replace(/[:.]/g, "-");
	return join(cwd, `pi-response-${stamp}.md`);
};

const saveLastResponse = async (args: string, ctx: ExtensionCommandContext) => {
	const branch = ctx.sessionManager.getBranch() as SessionEntry[];
	const response = getLastAssistantResponse(branch);

	if (!response) {
		if (ctx.hasUI) ctx.ui.notify("No assistant response found to save", "warning");
		return;
	}

	const path = resolvePath(args, ctx.cwd);
	await mkdir(dirname(path), { recursive: true });
	await writeFile(path, `${response}\n`, "utf8");

	if (ctx.hasUI) ctx.ui.notify(`Saved last response to ${path}`, "info");
};

export default function (pi: ExtensionAPI) {
	pi.registerCommand("save-md", {
		description: "Save the agent's last response to a markdown file. Usage: /save-md [path]",
		handler: async (args, ctx) => {
			await saveLastResponse(args, ctx);
		},
	});
}
