import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(req: NextRequest) {
	try {
		const { postId, user } = await req.json();
		if (!postId || !user) {
			return NextResponse.json(
				{ success: false, error: "postId and user required" },
				{ status: 400 }
			);
		}

		const { data: existing } = await getSupabase()
			.from("post_hearts")
			.select("id")
			.eq("post_id", postId)
			.eq("user_id", user)
			.maybeSingle();

		if (existing) {
			await getSupabase().from("post_hearts").delete().eq("id", existing.id);
			return NextResponse.json({ success: true, data: { hearted: false } });
		}

		const { error } = await getSupabase()
			.from("post_hearts")
			.insert({ post_id: postId, user_id: user });
		if (error) throw error;

		return NextResponse.json({ success: true, data: { hearted: true } });
	} catch (err) {
		console.error("hearts error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
