import { NextRequest, NextResponse } from "next/server";
import { generateText, parseJson } from "@/lib/claude";

interface ExpandedEntity {
	entity_id: string;
	name: string;
	popularity?: number;
}

const slugify = (name: string) =>
	"kindred:" +
	name
		.toLowerCase()
		.trim()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-|-$/g, "");

export async function POST(req: NextRequest) {
	try {
		const { interests } = (await req.json()) as {
			interests: Record<string, string[]>;
		};

		const filled = Object.entries(interests || {}).filter(
			([, values]) => Array.isArray(values) && values.length > 0
		);

		if (filled.length === 0) {
			return NextResponse.json({ success: true, data: {} });
		}

		const interestsText = filled
			.map(([category, values]) => `${category}: ${values.join(", ")}`)
			.join("\n");

		const prompt = `You are a cultural taste engine. For each category below, suggest up to 5 closely related entities (real, well-known names of the same kind) that someone with these tastes would also love. These are used to find overlap between people with similar taste, so prefer canonical, widely recognized names over obscure ones, and always use the most common spelling.

USER INTERESTS:
${interestsText}

Respond with ONLY a JSON object mapping each category to an array of objects:
{
  "<category>": [{ "name": "<entity name>", "popularity": <0-100 integer estimate of how widely known it is> }]
}

Rules:
- Only include categories that appear in the user's interests.
- Do not repeat items the user already listed.
- Names must be real entities of the matching category (e.g. real artists for "artist").`;

		const text = await generateText(prompt, 2048);
		const parsed = parseJson<Record<string, { name: string; popularity?: number }[]>>(text);

		const data: Record<string, ExpandedEntity[]> = {};
		for (const [category, items] of Object.entries(parsed)) {
			if (!Array.isArray(items)) continue;
			data[category] = items
				.filter((item) => item && typeof item.name === "string")
				.slice(0, 5)
				.map((item) => ({
					entity_id: slugify(item.name),
					name: item.name,
					popularity: typeof item.popularity === "number" ? item.popularity : 50,
				}));
		}

		return NextResponse.json({ success: true, data });
	} catch (err) {
		console.error("expand-tastes error:", err);
		// Expansion is an enhancement; matching still works on raw interests
		return NextResponse.json({ success: true, data: {} });
	}
}
