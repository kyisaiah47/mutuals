import Anthropic from "@anthropic-ai/sdk";

let client: Anthropic | null = null;

function getClient(): Anthropic {
	if (!client) {
		client = new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY });
	}
	return client;
}

export const CLAUDE_MODEL = "claude-haiku-4-5-20251001";

export async function generateText(
	prompt: string,
	maxTokens = 1024
): Promise<string> {
	const message = await getClient().messages.create({
		model: CLAUDE_MODEL,
		max_tokens: maxTokens,
		messages: [{ role: "user", content: prompt }],
	});
	const block = message.content[0];
	return block.type === "text" ? block.text : "";
}

// Extracts the first complete JSON object from a model response,
// tolerating prose before/after it (a greedy regex breaks on trailing braces)
export function parseJson<T>(text: string): T {
	const start = text.indexOf("{");
	if (start === -1) throw new Error("No JSON found in model response");

	let depth = 0;
	let inString = false;
	let escaped = false;
	for (let i = start; i < text.length; i++) {
		const ch = text[i];
		if (escaped) {
			escaped = false;
		} else if (ch === "\\") {
			escaped = true;
		} else if (ch === '"') {
			inString = !inString;
		} else if (!inString) {
			if (ch === "{") depth++;
			else if (ch === "}") {
				depth--;
				if (depth === 0) {
					return JSON.parse(text.slice(start, i + 1)) as T;
				}
			}
		}
	}
	throw new Error("Unbalanced JSON in model response");
}
