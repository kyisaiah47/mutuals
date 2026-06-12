import { notFound } from "next/navigation";
import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { findSimilarUsers } from "@/lib/database";
import { TopNav, SectionLabel } from "@/components/tumblr";
import { chipStyle } from "@/lib/chips";
import { Avatar } from "@/components/avatar";
import { WaveBox, Wall, OwnerBar } from "./profile-client";

export const dynamic = "force-dynamic";

export async function generateMetadata({
	params,
}: {
	params: Promise<{ username: string }>;
}) {
	const { username: raw } = await params;
	const username = decodeURIComponent(raw);
	const { data: profile } = await getSupabase()
		.from("user_profiles")
		.select("taste_profile_headline, taste_profile_description")
		.eq("user_id", username)
		.maybeSingle();
	if (!profile) return { title: "mutuals" };
	return {
		title: `${username} — mutuals`,
		description:
			profile.taste_profile_headline ||
			"find people who love what you love",
		openGraph: {
			title: `${username} — mutuals`,
			description:
				profile.taste_profile_description?.slice(0, 160) ||
				"find people who love what you love",
		},
	};
}

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
	const allMatches = matchResult.success ? matchResult.similarUsers || [] : [];
	const topMutuals = allMatches.slice(0, 8).map((m) => ({
		name: m.user.user_id,
		emoji: m.user.emoji || "👤",
		avatar: (m.user as { avatar?: string | null }).avatar || null,
		match: Math.round(m.matchScore * 100),
	}));

	const totalLoves = Object.values(grouped).flat().length;
	let chipIndex = 0;

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[1000px] mx-auto px-6 pt-10 pb-24">
				<OwnerBar username={username} />

				{/* header — banner style */}
				<div className="flex items-center gap-6 max-md:flex-col max-md:text-center max-md:gap-3 mb-4">
					<Avatar
						seed={profile.avatar}
						emoji={profile.emoji || "🌀"}
						size={110}
						className="rounded-lg"
					/>
					<div className="min-w-0 flex-1">
						<h1 className="text-white text-[28px] font-extrabold tracking-tight">
							{username}
						</h1>
						{profile.taste_profile_headline && (
							<p className="text-white/85 text-[16px] mt-0.5">
								{profile.taste_profile_headline.toLowerCase()}
							</p>
						)}
						<p className="text-white/70 text-[13px] mt-1.5">
							{allMatches.length} mutuals · {totalLoves} loves
							{profile.taste_profile_vibe && (
								<> · vibe: {profile.taste_profile_vibe.toLowerCase()}</>
							)}
						</p>
					</div>
				</div>

				<WaveBox profileUser={username} />

				<div className="grid md:grid-cols-[1.6fr_1fr] gap-x-14 gap-y-10 mt-10">
					{/* ===== main column ===== */}
					<div className="space-y-10 min-w-0">
						{/* things i love — the signature chips */}
						{Object.keys(grouped).length > 0 && (
							<section>
								<SectionLabel>things {username} loves</SectionLabel>
								<div className="space-y-4">
									{Object.entries(grouped).map(([label, items]) => (
										<div key={label}>
											<p className="text-white/60 text-[11px] uppercase tracking-widest mb-2">
												{label}
											</p>
											<div className="flex flex-wrap gap-2">
												{items.map((it) => (
													<span
														key={it}
														className="anim-chip text-[#1a1a1a] font-bold text-[14px] px-3.5 py-1.5 rounded-full"
														style={chipStyle(chipIndex++)}
													>
														{it}
													</span>
												))}
											</div>
										</div>
									))}
								</div>
							</section>
						)}

						{/* taste profile */}
						{profile.taste_profile_description && (
							<section>
								<SectionLabel>taste profile</SectionLabel>
								<p className="text-white/90 text-[15px] leading-relaxed">
									{profile.taste_profile_description}
								</p>
								{Array.isArray(profile.taste_profile_traits) &&
									profile.taste_profile_traits.length > 0 && (
										<p className="text-white/60 text-[13px] mt-4 leading-relaxed">
											{profile.taste_profile_traits.map((t: string) => (
												<span key={t} className="mr-2">
													#{t.toLowerCase().replace(/[^a-z0-9]+/g, "-")}
												</span>
											))}
										</p>
									)}
							</section>
						)}

						{/* who i'd like to meet */}
						{profile.taste_profile_compatibility && (
							<section>
								<SectionLabel>who they&apos;d like to meet</SectionLabel>
								<p className="text-white/90 text-[15px] leading-relaxed">
									{profile.taste_profile_compatibility}
								</p>
							</section>
						)}
					</div>

					{/* ===== side column ===== */}
					<div className="space-y-10 min-w-0">
						<section>
							<SectionLabel>top 8 mutuals</SectionLabel>
							{topMutuals.length > 0 ? (
								<div className="grid grid-cols-4 gap-2.5">
									{topMutuals.map((mu) => (
										<Link
											key={mu.name}
											href={`/u/${encodeURIComponent(mu.name)}`}
											className="text-center group"
											title={mu.name}
										>
											<div className="aspect-square bg-white/10 rounded-lg flex items-center justify-center text-[30px] overflow-hidden border border-white/10 group-hover:border-white/40 transition-colors">
												{mu.avatar ? (
													<Avatar
														seed={mu.avatar}
														size={96}
														className="w-full h-auto"
													/>
												) : (
													mu.emoji
												)}
											</div>
											<p className="text-[11px] text-white/80 mt-1.5 truncate group-hover:underline">
												{mu.name}
											</p>
											<p className="text-[11px] text-tgreen font-bold">
												{mu.match}%
											</p>
										</Link>
									))}
								</div>
							) : (
								<p className="text-white/70 text-[14px]">
									no mutuals yet — they&apos;ll show up here as more people
									make pages.
								</p>
							)}
						</section>

						<Wall profileUser={username} />
					</div>
				</div>
			</main>
		</div>
	);
}
