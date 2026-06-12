import { NextRequest, NextResponse } from "next/server";
import { generateText, parseJson } from "@/lib/claude";

const FALLBACK_PROFILE = {
	headline: "The Taste Explorer",
	description:
		"Someone with unique and diverse interests who loves discovering new experiences across different categories.",
	vibe: "Eclectic",
	traits: ["Curious", "Open-minded", "Adventurous", "Creative"],
	compatibility:
		"You'd connect well with fellow explorers who appreciate diversity in culture, art, and experiences.",
	emoji: "🌟",
};

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const {
			interests,
			insights,
			prompt: customPrompt,
			generateUsernameOnly,
		} = body;

		if (!interests || Object.keys(interests).length === 0) {
			return NextResponse.json(
				{ success: false, message: "Interests data is required" },
				{ status: 400 }
			);
		}

		if (generateUsernameOnly && customPrompt) {
			const text = await generateText(customPrompt, 64);
			const username = text
				.trim()
				.replace(/[^a-zA-Z0-9_]/g, "")
				.substring(0, 15);
			return NextResponse.json({
				success: true,
				message: "Username generated successfully",
				data: username,
			});
		}

		const insightsText = Object.entries(insights || {})
			.filter(([, entities]) => Array.isArray(entities) && entities.length > 0)
			.map(([category, entities]) => {
				const entityNames = (entities as Array<{ name: string }>)
					.slice(0, 3)
					.map((entity) => entity.name)
					.join(", ");
				return `${category} recommendations: ${entityNames}`;
			})
			.join("\n");

		const specificInterests = Object.entries(interests)
			.filter(([, values]) => Array.isArray(values) && values.length > 0)
			.map(([category, values]) => ({
				category,
				items: (values as string[]).slice(0, 3),
				count: (values as string[]).length,
			}));

		const totalInterests = Object.values(interests).flat().length;
		const categoryCount = Object.keys(interests).length;
		const dominantCategories = specificInterests
			.sort((a, b) => b.count - a.count)
			.slice(0, 3)
			.map((cat) => cat.category);
		const uniqueCombination = specificInterests
			.flatMap((cat) => cat.items)
			.slice(0, 8)
			.join(", ");

		const prompt = `
You are creating a highly personalized taste profile for someone with these SPECIFIC interests. Make this profile UNIQUE and avoid generic language.

DETAILED INTEREST BREAKDOWN:
${specificInterests
	.map(
		(cat) =>
			`${cat.category.toUpperCase()} (${cat.count} items): ${cat.items.join(
				", "
			)}`
	)
	.join("\n")}

AI PERSONALIZATION DATA:
${insightsText}

UNIQUENESS FACTORS:
- Total interests: ${totalInterests} across ${categoryCount} categories
- Dominant areas: ${dominantCategories.join(", ")}
- Unique combination: ${uniqueCombination}

Create a DISTINCTIVE profile that captures THIS SPECIFIC person's taste, not a generic template. Consider:
1. What makes their combination of interests unusual or interesting?
2. What personality type would have EXACTLY these tastes?
3. What subcultural niches do they bridge?
4. What does their breadth vs depth say about them?

Generate a JSON response with these fields:
{
  "headline": "A unique 4-8 word headline based on THEIR SPECIFIC combination (not generic like 'Music Lover' - be creative and specific)",
  "description": "2-3 sentences that feel like they were written FOR THIS SPECIFIC PERSON based on their exact tastes",
  "vibe": "One distinctive word that captures THEIR unique aesthetic (avoid common words like 'eclectic' - be more specific)",
  "traits": ["4-5 specific personality traits that someone with THESE EXACT interests would have"],
  "compatibility": "Who would connect with someone who has THIS SPECIFIC combination of interests",
  "emoji": "A single emoji character (exactly 1) that represents THEIR unique combination, not just one category"
}

CRITICAL: Make this feel like a custom-written profile, not a template. Respond with ONLY the JSON object.`;

		let profileData;
		try {
			const text = await generateText(prompt, 1024);
			profileData = parseJson<typeof FALLBACK_PROFILE>(text);
		} catch (parseError) {
			console.error("Failed to generate/parse AI profile:", parseError);
			profileData = FALLBACK_PROFILE;
		}

		// Keep emoji to a single grapheme (emoji can be 2 UTF-16 code units)
		if (profileData?.emoji) {
			profileData.emoji = [...profileData.emoji].slice(0, 2).join("");
		}

		return NextResponse.json({
			success: true,
			message: "Profile generated successfully",
			data: profileData,
		});
	} catch (error) {
		console.error("Error in /api/generate-profile:", error);
		return NextResponse.json({
			success: true,
			message: "Profile generated successfully",
			data: FALLBACK_PROFILE,
		});
	}
}
