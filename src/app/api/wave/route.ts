import { NextRequest, NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAuthedUsername } from "@/lib/server-auth";

async function isMutual(a: string, b: string) {
	const { data } = await getSupabase()
		.from("waves")
		.select("from_user_id, to_user_id")
		.or(
			`and(from_user_id.eq.${a},to_user_id.eq.${b}),and(from_user_id.eq.${b},to_user_id.eq.${a})`
		);
	const sentByMe = data?.some((w) => w.from_user_id === a) ?? false;
	const sentByThem = data?.some((w) => w.from_user_id === b) ?? false;
	return { waved: sentByMe, mutual: sentByMe && sentByThem };
}

export async function GET(req: NextRequest) {
	try {
		const me = await getAuthedUsername(req);
		const them = req.nextUrl.searchParams.get("them");
		if (!me || !them) {
			return NextResponse.json(
				{ success: false, error: "auth and them required" },
				{ status: 401 }
			);
		}

		const { waved, mutual } = await isMutual(me, them);
		let contact: string | undefined;
		if (mutual) {
			const { data } = await getSupabase()
				.from("user_profiles")
				.select("contact")
				.eq("user_id", them)
				.maybeSingle();
			contact = data?.contact || undefined;
		}

		return NextResponse.json({ success: true, data: { waved, mutual, contact } });
	} catch (err) {
		console.error("wave GET error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}

export async function POST(req: NextRequest) {
	try {
		const from = await getAuthedUsername(req);
		if (!from) {
			return NextResponse.json({ success: false, error: "log in first" }, { status: 401 });
		}
		const { to } = await req.json();
		if (!to || from === to) {
			return NextResponse.json(
				{ success: false, error: "invalid wave" },
				{ status: 400 }
			);
		}

		const { error } = await getSupabase()
			.from("waves")
			.upsert(
				{ from_user_id: from, to_user_id: to },
				{ onConflict: "from_user_id,to_user_id", ignoreDuplicates: true }
			);
		if (error) throw error;

		const { mutual } = await isMutual(from, to);
		return NextResponse.json({ success: true, data: { mutual } });
	} catch (err) {
		console.error("wave POST error:", err);
		return NextResponse.json({ success: false }, { status: 500 });
	}
}
