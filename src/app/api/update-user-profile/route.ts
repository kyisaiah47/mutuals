import { NextRequest, NextResponse } from "next/server";
import {
	getSupabase,
	UserInterest,
	UserInsight,
	InsightItem,
} from "@/lib/supabase";
import { getAuthedUsername } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
	try {
		const authed = await getAuthedUsername(request);
		const body = await request.json();
		const { userId, profileData, interests, insights } = body;

		if (!authed || authed !== userId) {
			return NextResponse.json(
				{ success: false, message: "not your page" },
				{ status: 401 }
			);
		}
		if (!userId) {
			return NextResponse.json(
				{
					success: false,
					message: "User ID is required",
				},
				{ status: 400 }
			);
		}

		// Update the main profile data
		if (profileData || interests || insights) {
			const updateData: Record<string, unknown> = {
				updated_at: new Date().toISOString(),
			};

			if (profileData) {
				// Merge profile data (like emoji, name, etc.)

				Object.assign(updateData, profileData);
			}

			if (interests) {
				updateData.interests = interests;
			}

			if (insights) {
				updateData.insights = insights;
			}

			const { data: profile, error: profileError } = await getSupabase().from("user_profiles")
				.update(updateData)
				.eq("user_id", userId)
				.select()
				.single();

			if (profileError) {
				console.error("Error updating profile:", profileError);
				return NextResponse.json(
					{
						success: false,
						message: "Failed to update profile",
						error: profileError.message,
					},
					{ status: 500 }
				);
			}

			// If interests were updated, also update the user_interests table
			if (interests) {
				// Delete existing interests for this user
				await getSupabase().from("user_interests").delete().eq("user_id", userId);

				// Insert new interests
				const interestRecords: Omit<UserInterest, "id" | "created_at">[] = [];
				Object.entries(interests as Record<string, string[]>).forEach(
					([category, interestList]) => {
						if (Array.isArray(interestList)) {
							interestList.forEach((interest) => {
								interestRecords.push({
									user_id: userId,
									category,
									interest_name: interest,
								});
							});
						}
					}
				);

				if (interestRecords.length > 0) {
					const { error: interestsError } = await getSupabase().from("user_interests")
						.insert(interestRecords);

					if (interestsError) {
						console.error("Error updating interests:", interestsError);
					}
				}
			}

			// If insights were updated, also update the user_insights table
			if (insights) {
				// Delete existing insights for this user
				await getSupabase().from("user_insights").delete().eq("user_id", userId);

				// Insert new insights
				const insightRecords: Omit<UserInsight, "id" | "created_at">[] = [];
				Object.entries(insights as Record<string, InsightItem[]>).forEach(
					([category, insightList]) => {
						if (Array.isArray(insightList)) {
							insightList.forEach((insight) => {
								insightRecords.push({
									user_id: userId,
									category,
									insight_type: "recommendation",
									entity_id: insight.entity_id,
									entity_name: insight.name,
									popularity_score: insight.popularity || 0,
									metadata: { source: "ai" },
								});
							});
						}
					}
				);

				if (insightRecords.length > 0) {
					const { error: insightsError } = await getSupabase().from("user_insights")
						.insert(insightRecords);

					if (insightsError) {
						console.error("Error updating insights:", insightsError);
					}
				}
			}

			return NextResponse.json({
				success: true,
				message: "Profile updated successfully",
				data: profile,
			});
		}

		return NextResponse.json(
			{
				success: false,
				message: "No data provided to update",
			},
			{ status: 400 }
		);
	} catch (error) {
		console.error("Error in update-user-profile API:", error);
		return NextResponse.json(
			{
				success: false,
				message: "Internal server error",
				error: error instanceof Error ? error.message : "Unknown error",
			},
			{ status: 500 }
		);
	}
}
