import { NextRequest, NextResponse } from "next/server";
import { saveTasteProfile } from "@/lib/database";
import { getAuthedUsername } from "@/lib/server-auth";

export async function POST(request: NextRequest) {
	try {
		const { userId, tasteProfile } = await request.json();
		const authed = await getAuthedUsername(request);

		if (!authed || authed !== userId) {
			return NextResponse.json(
				{ success: false, error: "not your page" },
				{ status: 401 }
			);
		}
		if (!userId || !tasteProfile) {
			return NextResponse.json(
				{ success: false, error: "Missing required fields" },
				{ status: 400 }
			);
		}

		const result = await saveTasteProfile(userId, tasteProfile);

		if (result.success) {
			return NextResponse.json({
				success: true,
				data: result.data,
			});
		} else {
			return NextResponse.json(
				{
					success: false,
					error: result.error || "Failed to save taste profile",
				},
				{ status: 500 }
			);
		}
	} catch (error) {
		console.error("Error in save-taste-profile:", error);
		return NextResponse.json(
			{ success: false, error: "Internal server error" },
			{ status: 500 }
		);
	}
}
