import { NextRequest, NextResponse } from "next/server";
import { saveUserProfile, generateUserId } from "@/lib/database";

export async function POST(request: NextRequest) {
	try {
		const body = await request.json();
		const { userId, interests, insights, contact, avatar } = body;

		// Generate a new user ID if not provided
		const finalUserId = userId || generateUserId();

		const result = await saveUserProfile(
			finalUserId,
			interests,
			insights,
			contact,
			avatar
		);

		if (result.success) {
			return NextResponse.json({
				success: true,
				message: "Profile saved successfully",
				data: {
					userId: finalUserId,
					profile: result.profile,
				},
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					message: "Failed to save profile",
					error: result.error,
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in save-profile API:", error);
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
