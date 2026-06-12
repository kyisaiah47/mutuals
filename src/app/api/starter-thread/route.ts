import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthedUsername } from "@/lib/server-auth";
import { generateText, parseJson } from "@/lib/claude";
import { rateLimit } from "@/lib/rate-limit";

// When an empty room is first visited, the system account seeds one
// discussion-starter thread so no room ever feels dead.
export async function POST(req: NextRequest) {
	if (!rateLimit(req, "starter", 5)) {
		return NextResponse.json({ success: false }, { status: 429 });
	}
	try {
		const me = await getAuthedUsername(req);
		if (!me) {
			return NextResponse.json(
				{ success: false, error: "log in first" },
				{ status: 401 }
			);
		}
		const { room } = await req.json();
		if (!room?.trim()) {
			return NextResponse.json(
				{ success: false, error: "room required" },
				{ status: 400 }
			);
		}

		// only seed truly empty rooms
		const { count } = await getSupabase()
			.from("room_posts")
			.select("id", { count: "exact", head: true })
			.ilike("category", room)
			.is("parent_id", null);
		if ((count || 0) > 0) {
			return NextResponse.json({ success: true, data: { seeded: false } });
		}

		const raw = await generateText(
			`Write one discussion-starter thread for a fan forum room about "${room}".
Voice: lowercase, casual, opinionated-but-welcoming, like a thoughtful fan — not corporate.
The thread should pose one specific, fun question people will want to answer.

Respond with ONLY JSON: {"title": "<punchy title, max 80 chars>", "body": "<1-3 sentences ending in the question>"}`,
			300
		);
		const { title, body } = parseJson<{ title: string; body: string }>(raw);
		if (!title?.trim() || !body?.trim()) throw new Error("bad generation");

		const { data, error } = await getSupabase()
			.from("room_posts")
			.insert({
				author_user_id: "mutuals",
				category: room.trim(),
				title: title.slice(0, 120),
				kind: "take",
				body: body.slice(0, 500),
			})
			.select()
			.single();
		if (error) throw error;

		return NextResponse.json({ success: true, data: { seeded: true, post: data } });
	} catch (err) {
		console.error("starter-thread error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
