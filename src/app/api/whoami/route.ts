import { NextRequest, NextResponse } from "next/server";
import { getAuthedUsername } from "@/lib/server-auth";

export async function GET(req: NextRequest) {
	const username = await getAuthedUsername(req);
	return NextResponse.json({ success: true, data: { username } });
}
