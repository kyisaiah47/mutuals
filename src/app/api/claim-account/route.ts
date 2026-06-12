import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthId } from "@/lib/server-auth";

// Binds a fresh auth account to a pre-auth page (auth_id IS NULL only).
export async function POST(req: NextRequest) {
	try {
		const authId = await getAuthId(req);
		if (!authId) {
			return NextResponse.json(
				{ success: false, error: "log in first" },
				{ status: 401 }
			);
		}
		const { username } = await req.json();
		if (!username) {
			return NextResponse.json(
				{ success: false, error: "username required" },
				{ status: 400 }
			);
		}

		const { data, error } = await getSupabase()
			.from("user_profiles")
			.update({ auth_id: authId })
			.eq("user_id", username)
			.is("auth_id", null)
			.select("user_id")
			.maybeSingle();
		if (error) throw error;

		if (!data) {
			return NextResponse.json(
				{ success: false, error: "page not found or already claimed" },
				{ status: 409 }
			);
		}
		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("claim-account error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
