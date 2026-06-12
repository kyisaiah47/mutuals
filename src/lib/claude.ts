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

// Extracts the first JSON object from a model response
export function parseJson<T>(text: string): T {
	const match = text.match(/\{[\s\S]*\}/);
	if (!match) throw new Error("No JSON found in model response");
	return JSON.parse(match[0]) as T;
}
