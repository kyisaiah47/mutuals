import { NextRequest, NextResponse } from "next/server";
import { generateText, parseJson } from "@/lib/claude";
import { rateLimit } from "@/lib/rate-limit";

const CATEGORIES = [
	"artist",
	"album",
	"book",
	"movie",
	"tv_show",
	"destination",
	"place",
	"brand",
	"videogame",
	"podcast",
	"actor",
	"director",
	"author",
	"person",
	"locality",
	"tag",
] as const;

export async function POST(req: NextRequest) {
	if (!rateLimit(req, "categorize", 10)) {
		return NextResponse.json(
			{ success: false, error: "slow down — try again in a minute" },
			{ status: 429 }
		);
	}
	try {
		const { text } = await req.json();
		if (!text || typeof text !== "string" || !text.trim()) {
			return NextResponse.json(
				{ success: false, error: "text is required" },
				{ status: 400 }
			);
		}

		const prompt = `Someone listed things they love, freeform:

"""
${text.slice(0, 2000)}
"""

Sort every item into exactly one of these categories:
${CATEGORIES.join(", ")}

Rules:
- Fix obvious misspellings to the canonical name (e.g. "radiohed" -> "Radiohead").
- Use proper capitalization of the real entity name.
- "tag" is for general vibes/genres/activities that aren't a specific named entity (e.g. "hiking", "jazz", "thrifting").
- Drop items you cannot identify at all.
- Only include categories that have at least one item.

Respond with ONLY a JSON object mapping category -> array of item name strings.`;

		const raw = await generateText(prompt, 1024);
		const parsed = parseJson<Record<string, string[]>>(raw);

		const interests: Record<string, string[]> = {};
		for (const [cat, items] of Object.entries(parsed)) {
			if (
				(CATEGORIES as readonly string[]).includes(cat) &&
				Array.isArray(items) &&
				items.length > 0
			) {
				interests[cat] = items.filter((i) => typeof i === "string").slice(0, 15);
			}
		}

		return NextResponse.json({ success: true, data: interests });
	} catch (err) {
		console.error("categorize-interests error:", err);
		return NextResponse.json(
			{ success: false, error: "Failed to categorize interests" },
			{ status: 500 }
		);
	}
}
