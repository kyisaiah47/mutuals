import { NextResponse } from "next/server";
import { generateText, parseJson } from "@/lib/claude";
import { getSupabase } from "@/lib/supabase";

// Resolve string usernames into profile UUIDs
async function getProfileUuid(input: string): Promise<string | null> {
	const isUuid =
		/^[0-9a-f]{8}-[0-9a-f]{4}-[1-5][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i.test(
			input
		);
	if (isUuid) return input;

	const { data, error } = await getSupabase()
		.from("user_profiles")
		.select("id")
		.eq("user_id", input)
		.maybeSingle();

	if (error) {
		console.error("UUID lookup failed:", error);
		return null;
	}
	return data?.id ?? null;
}

export async function POST(request: Request) {
	try {
		const {
			currentUserInterests,
			currentUserId: rawCurrentUserId,
			matchUserProfile,
			sharedEntities,
			matchScore,
		} = await request.json();

		const currentUserId = rawCurrentUserId
			? await getProfileUuid(rawCurrentUserId)
			: null;
		const matchUserId = await getProfileUuid(matchUserProfile.user_id);

		// Serve from cache when both users resolve
		if (currentUserId && matchUserId) {
			const { data: cached } = await getSupabase()
				.from("user_match_compatibility")
				.select("blurb, tags")
				.eq("user_id_1", currentUserId)
				.eq("user_id_2", matchUserId)
				.maybeSingle();

			if (cached?.blurb) {
				let tags: string[] = [];
				try {
					tags = cached.tags ? JSON.parse(cached.tags) : [];
				} catch {
					tags = [];
				}
				return NextResponse.json({
					success: true,
					data: { explanation: cached.blurb, tags },
					cached: true,
				});
			}
		}

		const sharedInterestsText = Object.entries(
			(sharedEntities || {}) as Record<string, string[]>
		)
			.map(([category, items]) => `${category}: ${items.join(", ")}`)
			.join("\n");

		const prompt = `
You are a matchmaking expert. Generate a JSON object with two fields:
1. "explanation": A warm, engaging compatibility blurb (3-5 sentences) explaining why these two users seem like a good fit based on their shared interests and preferences. Make it conversational, highlight the most interesting shared interests, and avoid being too generic.
2. "tags": An array of 2-4 short words or phrases ("match tags") that describe why these users are a good match (e.g., "indie film lovers", "jazz fans", "adventurous spirits").

CURRENT USER'S INTERESTS:
${Object.entries(currentUserInterests || {})
	.filter(([, values]) => Array.isArray(values) && values.length > 0)
	.map(
		([category, values]) => `${category}: ${(values as string[]).join(", ")}`
	)
	.join("\n")}

SHARED INTERESTS:
${sharedInterestsText}

MATCH SCORE: ${(matchScore * 100).toFixed(0)}%

Respond with ONLY the JSON object.`;

		const text = await generateText(prompt, 512);

		let explanation = "";
		let tags: string[] = [];
		try {
			const parsed = parseJson<{ explanation?: string; tags?: string[] }>(
				text
			);
			explanation = parsed.explanation?.trim() || "";
			tags = Array.isArray(parsed.tags) ? parsed.tags : [];
		} catch {
			explanation = text.trim();
		}

		if (!explanation) {
			throw new Error("No compatibility explanation generated");
		}

		if (currentUserId && matchUserId) {
			const { error: insertError } = await getSupabase()
				.from("user_match_compatibility")
				.insert([
					{
						user_id_1: currentUserId,
						user_id_2: matchUserId,
						blurb: explanation,
						tags: JSON.stringify(tags),
					},
				]);
			if (insertError) {
				console.error("Error saving compatibility blurb:", insertError);
			}
		}

		return NextResponse.json({
			success: true,
			data: { explanation, tags },
			cached: false,
		});
	} catch (error) {
		console.error("Error generating compatibility blurb:", error);
		return NextResponse.json(
			{
				success: false,
				error: "Failed to generate compatibility explanation",
				fallback:
					"You share amazing taste and similar interests - this looks like a great potential connection!",
			},
			{ status: 500 }
		);
	}
}
