import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthedUsername } from "@/lib/server-auth";

// rooms are things: room_posts.category holds the thing name (e.g. "Radiohead")

export async function GET(req: NextRequest) {
	try {
		const sp = req.nextUrl.searchParams;
		const room = sp.get("room");
		const parent = sp.get("parent");
		const id = sp.get("id");
		const me = sp.get("me");

		let query = getSupabase()
			.from("room_posts")
			.select("*")
			.order("created_at", { ascending: false })
			.limit(60);

		if (id) {
			query = query.eq("id", id);
		} else if (parent) {
			query = query.eq("parent_id", parent).order("created_at", { ascending: true });
		} else {
			query = query.is("parent_id", null);
			if (room) {
				query = query.ilike("category", room);
			} else if (me) {
				// home feed: threads from MY rooms
				const { data: prof } = await getSupabase()
					.from("user_profiles")
					.select("interests")
					.eq("user_id", me)
					.maybeSingle();
				const myThings = Object.values(
					(prof?.interests || {}) as Record<string, string[]>
				).flat();
				if (myThings.length === 0) {
					return NextResponse.json({ success: true, data: [] });
				}
				query = query.in("category", myThings);
			}
		}

		const { data: posts, error } = await query;
		if (error) throw error;
		if (!posts || posts.length === 0) {
			return NextResponse.json({ success: true, data: [] });
		}

		const postIds = posts.map((p) => p.id);
		const authors = [...new Set(posts.map((p) => p.author_user_id))];

		const [heartsRes, repliesRes, profilesRes] = await Promise.all([
			getSupabase().from("post_hearts").select("post_id, user_id").in("post_id", postIds),
			getSupabase().from("room_posts").select("parent_id").in("parent_id", postIds),
			getSupabase()
				.from("user_profiles")
				.select("user_id, emoji, avatar")
				.in("user_id", authors),
		]);

		const heartCounts: Record<string, number> = {};
		const heartedByMe = new Set<string>();
		for (const h of heartsRes.data || []) {
			heartCounts[h.post_id] = (heartCounts[h.post_id] || 0) + 1;
			if (me && h.user_id === me) heartedByMe.add(h.post_id);
		}

		const replyCounts: Record<string, number> = {};
		for (const r of repliesRes.data || []) {
			if (r.parent_id) replyCounts[r.parent_id] = (replyCounts[r.parent_id] || 0) + 1;
		}

		const profileByUser: Record<string, { emoji?: string; avatar?: string }> = {};
		for (const p of profilesRes.data || []) {
			profileByUser[p.user_id] = { emoji: p.emoji, avatar: p.avatar };
		}

		const enriched = posts.map((p) => ({
			id: p.id,
			author: p.author_user_id,
			authorEmoji: profileByUser[p.author_user_id]?.emoji,
			authorAvatar: profileByUser[p.author_user_id]?.avatar,
			room: p.category,
			title: p.title,
			kind: p.kind,
			body: p.body,
			createdAt: p.created_at,
			hearts: heartCounts[p.id] || 0,
			replies: replyCounts[p.id] || 0,
			hearted: heartedByMe.has(p.id),
		}));

		return NextResponse.json({ success: true, data: enriched });
	} catch (err) {
		console.error("posts GET error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const author = await getAuthedUsername(req);
		if (!author) {
			return NextResponse.json({ success: false, error: "log in first" }, { status: 401 });
		}
		const { room, title, kind, body, parentId } = await req.json();

		if (!body?.trim()) {
			return NextResponse.json(
				{ success: false, error: "body required" },
				{ status: 400 }
			);
		}
		if (!parentId && (!room?.trim() || !title?.trim())) {
			return NextResponse.json(
				{ success: false, error: "room and title required" },
				{ status: 400 }
			);
		}

		const { data, error } = await getSupabase()
			.from("room_posts")
			.insert({
				author_user_id: author,
				category: room?.trim() || "reply",
				title: parentId ? null : String(title).slice(0, 120),
				kind: kind === "rec" ? "rec" : "take",
				body: String(body).slice(0, 500),
				parent_id: parentId || null,
			})
			.select()
			.single();
		if (error) throw error;

		return NextResponse.json({ success: true, data });
	} catch (err) {
		console.error("posts POST error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
