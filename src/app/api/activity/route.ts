import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthedUsername } from "@/lib/server-auth";

interface ActivityItem {
	type: "wave" | "comment" | "heart" | "note";
	actor: string;
	text?: string;
	threadId?: string;
	threadTitle?: string;
	room?: string;
	createdAt: string;
}

export async function GET(req: NextRequest) {
	try {
		const me = await getAuthedUsername(req);
		if (!me) {
			return NextResponse.json(
				{ success: false, error: "log in first" },
				{ status: 401 }
			);
		}

		const { data: myPosts } = await getSupabase()
			.from("room_posts")
			.select("id, title, category, parent_id")
			.eq("author_user_id", me)
			.order("created_at", { ascending: false })
			.limit(200);

		const myTop = (myPosts || []).filter((p) => !p.parent_id);
		const myTopIds = myTop.map((p) => p.id);
		const titleById: Record<string, { title: string | null; room: string }> = {};
		for (const p of myTop) titleById[p.id] = { title: p.title, room: p.category };

		const [wavesRes, commentsRes, heartsRes, notesRes] = await Promise.all([
			getSupabase()
				.from("waves")
				.select("from_user_id, created_at")
				.eq("to_user_id", me)
				.order("created_at", { ascending: false })
				.limit(30),
			myTopIds.length
				? getSupabase()
						.from("room_posts")
						.select("author_user_id, body, parent_id, created_at")
						.in("parent_id", myTopIds)
						.neq("author_user_id", me)
						.order("created_at", { ascending: false })
						.limit(30)
				: Promise.resolve({ data: [] }),
			myTopIds.length
				? getSupabase()
						.from("post_hearts")
						.select("user_id, post_id, created_at")
						.in("post_id", myTopIds)
						.neq("user_id", me)
						.order("created_at", { ascending: false })
						.limit(30)
				: Promise.resolve({ data: [] }),
			getSupabase()
				.from("wall_comments")
				.select("author_user_id, body, created_at")
				.eq("profile_user_id", me)
				.neq("author_user_id", me)
				.order("created_at", { ascending: false })
				.limit(30),
		]);

		const items: ActivityItem[] = [
			...(wavesRes.data || []).map((w) => ({
				type: "wave" as const,
				actor: w.from_user_id,
				createdAt: w.created_at,
			})),
			...(commentsRes.data || []).map((c) => ({
				type: "comment" as const,
				actor: c.author_user_id,
				text: c.body,
				threadId: c.parent_id,
				threadTitle: titleById[c.parent_id]?.title || undefined,
				room: titleById[c.parent_id]?.room,
				createdAt: c.created_at,
			})),
			...(heartsRes.data || []).map((h) => ({
				type: "heart" as const,
				actor: h.user_id,
				threadId: h.post_id,
				threadTitle: titleById[h.post_id]?.title || undefined,
				room: titleById[h.post_id]?.room,
				createdAt: h.created_at,
			})),
			...(notesRes.data || []).map((n) => ({
				type: "note" as const,
				actor: n.author_user_id,
				text: n.body,
				createdAt: n.created_at,
			})),
		]
			.sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
			.slice(0, 40);

		// actor avatars
		const actors = [...new Set(items.map((i) => i.actor))];
		const byActor: Record<string, { emoji?: string; avatar?: string }> = {};
		if (actors.length) {
			const { data: profiles } = await getSupabase()
				.from("user_profiles")
				.select("user_id, emoji, avatar")
				.in("user_id", actors);
			for (const p of profiles || []) {
				byActor[p.user_id] = { emoji: p.emoji, avatar: p.avatar };
			}
		}

		return NextResponse.json({
			success: true,
			data: items.map((i) => ({
				...i,
				actorEmoji: byActor[i.actor]?.emoji,
				actorAvatar: byActor[i.actor]?.avatar,
			})),
		});
	} catch (err) {
		console.error("activity error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
