import { NextRequest } from "next/server";
import { getSupabase } from "./supabase";

// Resolves the bearer token to a username via user_profiles.auth_id.
// Returns null when the request carries no valid identity.
export async function getAuthedUsername(req: NextRequest): Promise<string | null> {
	const header = req.headers.get("authorization");
	if (!header?.startsWith("Bearer ")) return null;
	const token = header.slice(7);

	const { data, error } = await getSupabase().auth.getUser(token);
	if (error || !data.user) return null;

	const { data: profile } = await getSupabase()
		.from("user_profiles")
		.select("user_id")
		.eq("auth_id", data.user.id)
		.maybeSingle();

	return profile?.user_id || null;
}

export async function getAuthId(req: NextRequest): Promise<string | null> {
	const header = req.headers.get("authorization");
	if (!header?.startsWith("Bearer ")) return null;
	const { data, error } = await getSupabase().auth.getUser(header.slice(7));
	return error ? null : data.user?.id || null;
}
