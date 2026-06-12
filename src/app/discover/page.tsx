import Link from "next/link";
import { getSupabase } from "@/lib/supabase";
import { TopNav, PostCard } from "@/components/tumblr";

export const dynamic = "force-dynamic";

export default async function Discover() {
	const { data: profiles } = await getSupabase()
		.from("user_profiles")
		.select(
			"user_id, emoji, interests, taste_profile_headline, taste_profile_vibe, created_at"
		)
		.eq("profile_completed", true)
		.order("created_at", { ascending: false })
		.limit(30);

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[540px] mx-auto px-4 pt-8 pb-20">
				<h1 className="text-center text-white text-[22px] font-extrabold mb-1">
					discover
				</h1>
				<p className="text-center text-white/50 text-[14px] mb-8">
					recently made pages — go find your people
				</p>

				{(profiles || []).length === 0 ? (
					<p className="text-center text-white/45 text-[14px]">
						nobody here yet — be the first.
					</p>
				) : (
					(profiles || []).map((p) => {
						const loves = Object.values(
							(p.interests || {}) as Record<string, string[]>
						)
							.flat()
							.slice(0, 6);
						return (
							<PostCard
								key={p.user_id}
								footer={
									<>
										<span>
											{p.taste_profile_vibe
												? `vibe: ${p.taste_profile_vibe.toLowerCase()}`
												: ""}
										</span>
										<Link
											href={`/u/${encodeURIComponent(p.user_id)}`}
											className="text-taccent hover:underline"
										>
											visit page →
										</Link>
									</>
								}
							>
								<div className="flex gap-3.5 items-start">
									<div className="w-14 h-14 bg-[#f0f2f5] rounded-[3px] flex items-center justify-center text-[28px] shrink-0">
										{p.emoji || "👤"}
									</div>
									<div className="min-w-0">
										<Link
											href={`/u/${encodeURIComponent(p.user_id)}`}
											className="font-bold text-[15px] text-tink hover:text-taccent"
										>
											{p.user_id}
										</Link>
										{p.taste_profile_headline && (
											<p className="text-[13px] text-tmuted mt-0.5">
												{p.taste_profile_headline.toLowerCase()}
											</p>
										)}
										{loves.length > 0 && (
											<p className="text-[13px] text-taccent mt-2 leading-relaxed">
												{loves.join(" · ")}
											</p>
										)}
									</div>
								</div>
							</PostCard>
						);
					})
				)}
			</main>
		</div>
	);
}
