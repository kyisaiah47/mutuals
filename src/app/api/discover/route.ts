import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function GET(req: NextRequest) {
	try {
		const love = req.nextUrl.searchParams.get("love");

		if (love) {
			// people who love a specific thing
			const { data: rows, error } = await getSupabase()
				.from("user_interests")
				.select("user_id")
				.ilike("interest_name", love)
				.limit(50);
			if (error) throw error;

			const userIds = [...new Set((rows || []).map((r) => r.user_id))];
			if (userIds.length === 0) {
				return NextResponse.json({ success: true, data: { profiles: [] } });
			}

			const { data: profiles } = await getSupabase()
				.from("user_profiles")
				.select("user_id, emoji, avatar, taste_profile_headline, taste_profile_vibe")
				.in("user_id", userIds)
				.eq("profile_completed", true)
				.limit(30);

			return NextResponse.json({
				success: true,
				data: { profiles: profiles || [] },
			});
		}

		// default: popular things + fresh pages
		const [{ data: interestRows }, { data: recent }] = await Promise.all([
			getSupabase()
				.from("user_interests")
				.select("interest_name")
				.order("created_at", { ascending: false })
				.limit(400),
			getSupabase()
				.from("user_profiles")
				.select("user_id, emoji, avatar, taste_profile_headline, created_at")
				.eq("profile_completed", true)
				.order("created_at", { ascending: false })
				.limit(6),
		]);

		const counts = new Map<string, { name: string; count: number }>();
		for (const r of interestRows || []) {
			const key = r.interest_name.toLowerCase();
			const cur = counts.get(key);
			if (cur) cur.count++;
			else counts.set(key, { name: r.interest_name, count: 1 });
		}
		const popular = [...counts.values()]
			.sort((a, b) => b.count - a.count)
			.slice(0, 24);

		return NextResponse.json({
			success: true,
			data: { popular, recent: recent || [] },
		});
	} catch (err) {
		console.error("discover error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
