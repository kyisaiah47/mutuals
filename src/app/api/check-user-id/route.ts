import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: NextRequest) {
	try {
		const { userId } = await request.json();

		if (!userId) {
			return NextResponse.json(
				{ success: false, message: "User ID is required" },
				{ status: 400 }
			);
		}

		const { data, error } = await getSupabase()
			.from("user_profiles")
			.select("user_id, auth_id")
			.eq("user_id", userId)
			.maybeSingle();
		if (error) throw error;

		return NextResponse.json({
			success: true,
			exists: !!data,
			claimable: !!data && !data.auth_id,
		});
	} catch (error) {
		console.error("Error in check-user-id API:", error);
		return NextResponse.json(
			{ success: false, message: "Internal server error" },
			{ status: 500 }
		);
	}
}
