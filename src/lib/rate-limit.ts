import { NextRequest } from "next/server";

// In-memory sliding-window limiter. Per serverless instance, so it's a
// deterrent against credit-burning loops, not a hard guarantee.
const buckets = new Map<string, { count: number; resetAt: number }>();

export function rateLimit(
	req: NextRequest,
	name: string,
	max: number,
	windowMs = 60_000
): boolean {
	const ip =
		req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ||
		req.headers.get("x-real-ip") ||
		"unknown";
	const key = `${name}:${ip}`;
	const now = Date.now();

	const bucket = buckets.get(key);
	if (!bucket || now > bucket.resetAt) {
		buckets.set(key, { count: 1, resetAt: now + windowMs });
		return true;
	}
	if (bucket.count >= max) return false;
	bucket.count++;
	return true;
}
