import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { findSimilarUsers } from "@/lib/database";
import { TopNav, PostCard, EmojiTile } from "@/components/tumblr";
import { WaveBox, Wall, OwnerBar } from "./profile-client";

export const dynamic = "force-dynamic";

const CATEGORY_LABELS: Record<string, string> = {
	artist: "music",
	album: "albums",
	book: "books",
	movie: "movies",
	tv_show: "television",
	destination: "places",
	place: "places",
	brand: "brands",
	videogame: "games",
	podcast: "podcasts",
	actor: "people",
	director: "people",
	author: "people",
	person: "people",
	locality: "places",
	tag: "vibes",
	demographics: "vibes",
};

function groupInterests(interests: Record<string, string[]>) {
	const grouped: Record<string, string[]> = {};
	for (const [cat, items] of Object.entries(interests || {})) {
		if (!Array.isArray(items) || items.length === 0) continue;
		const label = CATEGORY_LABELS[cat] || cat;
		grouped[label] = [...(grouped[label] || []), ...items];
	}
	return grouped;
}

export default async function ProfilePage({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username: raw } = await params;
	const username = decodeURIComponent(raw);

	const { data: profile } = await getSupabase()
		.from("user_profiles")
		.select("*")
		.eq("user_id", username)
		.maybeSingle();

	if (!profile || !profile.profile_completed) notFound();

	const grouped = groupInterests(profile.interests);

	const matchResult = await findSimilarUsers(username);
	const topMutuals = (matchResult.success ? matchResult.similarUsers || [] : [])
		.slice(0, 8)
		.map((m) => ({
			name: m.user.user_id,
			emoji: m.user.emoji || "👤",
			match: Math.round(m.matchScore * 100),
		}));

	const totalLoves = Object.values(grouped).flat().length;

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[540px] mx-auto px-4 pt-8 pb-20">
				<OwnerBar username={username} />

				{/* header */}
				<div className="text-center mb-8">
					<div className="flex justify-center mb-3">
						<EmojiTile emoji={profile.emoji || "🌀"} size={96} />
					</div>
					<h1 className="text-white text-[20px] font-bold">{username}</h1>
					{profile.taste_profile_headline && (
						<p className="text-white/65 text-[14px] mt-1">
							{profile.taste_profile_headline.toLowerCase()}
						</p>
					)}
					<p className="text-white/45 text-[13px] mt-1.5">
						{topMutuals.length > 0 && (
							<>{matchResult.success ? matchResult.similarUsers?.length : 0} mutuals · </>
						)}
						{totalLoves} loves
						{profile.taste_profile_vibe && (
							<> · vibe: {profile.taste_profile_vibe.toLowerCase()}</>
						)}
					</p>
				</div>

				<WaveBox profileUser={username} />

				{/* taste profile post */}
				{profile.taste_profile_description && (
					<PostCard author={username} label="taste profile">
						<p className="text-[15px] leading-relaxed">
							{profile.taste_profile_description}
						</p>
						{Array.isArray(profile.taste_profile_traits) &&
							profile.taste_profile_traits.length > 0 && (
								<p className="text-[13px] mt-3.5 text-tmuted leading-relaxed">
									{profile.taste_profile_traits.map((t: string) => (
										<span key={t} className="mr-2">
											#{t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
										</span>
									))}
								</p>
							)}
					</PostCard>
				)}

				{/* things i love */}
				{Object.keys(grouped).length > 0 && (
					<PostCard author={username} label="things i love">
						{Object.entries(grouped).map(([label, items]) => (
							<p key={label} className="text-[15px] leading-loose mb-1.5">
								<strong>{label}:</strong>{" "}
								<span className="text-taccent">{items.join(", ")}</span>
							</p>
						))}
					</PostCard>
				)}

				{/* who i'd like to meet */}
				{profile.taste_profile_compatibility && (
					<PostCard author={username} label="who i'd like to meet">
						<p className="text-[15px] leading-relaxed">
							{profile.taste_profile_compatibility}
						</p>
					</PostCard>
				)}

				{/* top 8 */}
				<PostCard author={username} label="top 8 mutuals">
					{topMutuals.length > 0 ? (
						<div className="grid grid-cols-4 gap-2">
							{topMutuals.map((mu) => (
								<Link
									key={mu.name}
									href={`/u/${encodeURIComponent(mu.name)}`}
									className="text-center group"
								>
									<div className="aspect-square bg-[#f0f2f5] rounded-[3px] flex items-center justify-center text-[34px] group-hover:bg-[#e2e8f0]">
										{mu.emoji}
									</div>
									<p className="text-[11px] text-tmuted mt-1.5 truncate">
										{mu.name}
									</p>
									<p className="text-[11px] text-tgreen font-bold">
										{mu.match}%
									</p>
								</Link>
							))}
						</div>
					) : (
						<p className="text-[14px] text-tmuted">
							no mutuals yet — they&apos;ll show up here as more people make
							pages.
						</p>
					)}
				</PostCard>

				<Wall profileUser={username} />
			</main>
		</div>
	);
}
