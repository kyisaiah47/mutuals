import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
	try {
		const user = req.nextUrl.searchParams.get("user");
		if (!user) {
			return NextResponse.json(
				{ success: false, error: "user required" },
				{ status: 400 }
			);
		}

		const { data: comments, error } = await getSupabase()
			.from("wall_comments")
			.select("id, author_user_id, body, created_at")
			.eq("profile_user_id", user)
			.order("created_at", { ascending: false })
			.limit(50);
		if (error) throw error;

		// attach author emojis
		const authors = [...new Set((comments || []).map((c) => c.author_user_id))];
		const emojiByUser: Record<string, string> = {};
		if (authors.length > 0) {
			const { data: profiles } = await getSupabase()
				.from("user_profiles")
				.select("user_id, emoji")
				.in("user_id", authors);
			for (const p of profiles || []) {
				if (p.emoji) emojiByUser[p.user_id] = p.emoji;
			}
		}

		return NextResponse.json({
			success: true,
			data: (comments || []).map((c) => ({
				...c,
				author_emoji: emojiByUser[c.author_user_id],
			})),
		});
	} catch (err) {
		console.error("wall GET error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const { profileUser, author, body } = await req.json();
		if (!profileUser || !author || !body?.trim()) {
			return NextResponse.json(
				{ success: false, error: "missing fields" },
				{ status: 400 }
			);
		}

		const { error } = await getSupabase().from("wall_comments").insert({
			profile_user_id: profileUser,
			author_user_id: author,
			body: String(body).slice(0, 280),
		});
		if (error) throw error;

		return NextResponse.json({ success: true });
	} catch (err) {
		console.error("wall POST error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
