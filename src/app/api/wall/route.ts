import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthedUsername } from "@/lib/server-auth";

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

		// attach author emojis/avatars
		const authors = [...new Set((comments || []).map((c) => c.author_user_id))];
		const byUser: Record<string, { emoji?: string; avatar?: string }> = {};
		if (authors.length > 0) {
			const { data: profiles } = await getSupabase()
				.from("user_profiles")
				.select("user_id, emoji, avatar")
				.in("user_id", authors);
			for (const p of profiles || []) {
				byUser[p.user_id] = { emoji: p.emoji, avatar: p.avatar };
			}
		}

		return NextResponse.json({
			success: true,
			data: (comments || []).map((c) => ({
				...c,
				author_emoji: byUser[c.author_user_id]?.emoji,
				author_avatar: byUser[c.author_user_id]?.avatar,
			})),
		});
	} catch (err) {
		console.error("wall GET error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const author = await getAuthedUsername(req);
		if (!author) {
			return NextResponse.json({ success: false, error: "log in first" }, { status: 401 });
		}
		const { profileUser, body } = await req.json();
		if (!profileUser || !body?.trim()) {
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
