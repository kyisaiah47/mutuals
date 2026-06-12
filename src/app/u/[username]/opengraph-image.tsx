import { ImageResponse } from "next/og";
import { createAvatar } from "@dicebear/core";
import { openPeeps } from "@dicebear/collection";
import { getSupabase } from "@/lib/supabase";
import { CHIP_COLORS } from "@/lib/chips";

export const size = { width: 1200, height: 630 };
export const contentType = "image/png";
export const alt = "mutuals taste page";

function chipColor(name: string) {
	let h = 0;
	for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 997;
	return CHIP_COLORS[h % CHIP_COLORS.length];
}

export default async function OgImage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username: raw } = await params;
	const username = decodeURIComponent(raw);

	const { data: profile } = await getSupabase()
		.from("user_profiles")
		.select("avatar, emoji, interests, taste_profile_headline, taste_profile_vibe")
		.eq("user_id", username)
		.maybeSingle();

	const things = Object.values(
		(profile?.interests || {}) as Record<string, string[]>
	)
		.flat()
		.slice(0, 7);

	// satori only accepts base64 data URIs, not utf8-encoded SVG
	const avatarUri = profile?.avatar
		? `data:image/svg+xml;base64,${Buffer.from(
				createAvatar(openPeeps, {
					seed: profile.avatar,
					size: 320,
					backgroundColor: ["f0f2f5"],
				}).toString()
		  ).toString("base64")}`
		: null;

	return new ImageResponse(
		(
			<div
				style={{
					width: "100%",
					height: "100%",
					display: "flex",
					background: "#001935",
					padding: 64,
					fontFamily: "Helvetica, Arial, sans-serif",
				}}
			>
				{/* avatar */}
				<div style={{ display: "flex", alignItems: "center", marginRight: 56 }}>
					{avatarUri ? (
						<img
							src={avatarUri}
							alt=""
							width={300}
							height={300}
							style={{ borderRadius: 24 }}
						/>
					) : (
						<div
							style={{
								width: 300,
								height: 300,
								borderRadius: 24,
								background: "rgba(255,255,255,0.1)",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								fontSize: 150,
							}}
						>
							{profile?.emoji || "🌀"}
						</div>
					)}
				</div>

				{/* text */}
				<div
					style={{
						display: "flex",
						flexDirection: "column",
						justifyContent: "center",
						flex: 1,
					}}
				>
					<div style={{ display: "flex", color: "#fff", fontSize: 64, fontWeight: 800 }}>
						{username}
					</div>
					{profile?.taste_profile_headline && (
						<div
							style={{
								display: "flex",
								color: "rgba(255,255,255,0.8)",
								fontSize: 30,
								marginTop: 10,
							}}
						>
							{profile.taste_profile_headline.toLowerCase()}
						</div>
					)}

					{/* chips */}
					<div
						style={{
							display: "flex",
							flexWrap: "wrap",
							gap: 12,
							marginTop: 34,
						}}
					>
						{things.map((t) => (
							<div
								key={t}
								style={{
									display: "flex",
									background: chipColor(t),
									color: "#1a1a1a",
									fontSize: 24,
									fontWeight: 700,
									padding: "8px 22px",
									borderRadius: 999,
								}}
							>
								{t}
							</div>
						))}
					</div>

					<div
						style={{
							display: "flex",
							alignItems: "center",
							marginTop: 48,
							color: "rgba(255,255,255,0.55)",
							fontSize: 26,
						}}
					>
						<svg width="34" height="34" viewBox="0 0 50 50" style={{ marginRight: 12 }}>
							<path
								d="M24.7 0C11.1 0 0 11.1 0 24.7C0 38.3 11.1 49.4 24.7 49.4C38.3 49.4 49.4 38.3 49.4 24.7C49.4 11.1 38.3 0 24.7 0ZM6.9 24.7C6.9 19.6 9.1 14.9 12.6 11.7C14 10.4 16.4 10.8 17.4 12.5L23.6 23.2C24.2 24.2 24.2 25.4 23.6 26.4L17.4 37.1C16.4 38.9 14 39.2 12.5 37.8C9.1 34.4 6.9 29.8 6.9 24.7ZM32 36.9L25.8 26.2C25.2 25.2 25.2 24 25.8 23L32 12.3C33 10.6 35.3 10.2 36.8 11.5C40.3 14.7 42.5 19.4 42.5 24.5C42.5 29.6 40.3 34.3 36.8 37.5C35.3 39.1 33 38.7 32 36.9Z"
								fill="#fff"
							/>
						</svg>
						mutuals — find people who love what you love
					</div>
				</div>
			</div>
		),
		size
	);
}
