"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav, Spinner } from "@/components/tumblr";
import { Avatar } from "@/components/avatar";
import { getSessionUser } from "@/lib/session";

const CHIP_COLORS = ["#9fef00", "#ffb02e", "#2dd4a8", "#b18cff", "#ff8fc1"];

interface PersonRow {
	user_id: string;
	emoji?: string;
	avatar?: string | null;
	headline?: string;
	vibe?: string;
	shared?: string;
	match?: number;
}

function chipStyle(i: number): React.CSSProperties {
	const rot = ((i * 7919) % 7) - 3;
	return {
		background: CHIP_COLORS[i % CHIP_COLORS.length],
		["--rot" as string]: `${rot}deg`,
		animationDelay: `${(i % 8) * 0.05}s, ${0.25 + (i % 8) * 0.05}s`,
	};
}

function PeopleTable({
	rows,
	showMatch,
	emptyText,
}: {
	rows: PersonRow[];
	showMatch?: boolean;
	emptyText: string;
}) {
	const router = useRouter();
	if (rows.length === 0) {
		return (
			<p className="text-center text-white/70 text-[14px] py-10">{emptyText}</p>
		);
	}
	return (
		<div className="w-full">
			{/* header */}
			<div className="grid grid-cols-[44px_minmax(160px,240px)_1fr_120px_70px] max-md:grid-cols-[44px_1fr_70px] gap-x-4 px-3 pb-2 border-b border-white/15 text-[11px] uppercase tracking-widest text-white/80">
				<span>#</span>
				<span>person</span>
				<span className="max-md:hidden">taste</span>
				<span className="max-md:hidden">vibe</span>
				<span className="text-right">{showMatch ? "match" : ""}</span>
			</div>
			{rows.map((r, i) => (
				<div
					key={r.user_id}
					onClick={() => router.push(`/u/${encodeURIComponent(r.user_id)}`)}
					className="grid grid-cols-[44px_minmax(160px,240px)_1fr_120px_70px] max-md:grid-cols-[44px_1fr_70px] gap-x-4 items-center px-3 py-2.5 border-b border-white/8 hover:bg-white/5 cursor-pointer group"
				>
					<span className="text-white/70 text-[13px] tabular-nums">{i + 1}</span>
					<span className="flex items-center gap-2.5 min-w-0">
						<Avatar seed={r.avatar} emoji={r.emoji} size={32} />
						<span className="text-white font-bold text-[14px] truncate group-hover:underline">
							{r.user_id}
						</span>
					</span>
					<span className="max-md:hidden text-white/80 text-[13px] truncate">						{r.shared ? (
							<>
								<span className="text-white/80">you both love </span>
								{r.shared}
							</>
						) : (
							r.headline?.toLowerCase()
						)}
					</span>
					<span className="max-md:hidden text-white/70 text-[13px] truncate">						{r.vibe?.toLowerCase() || "—"}
					</span>
					<span className="text-right text-tgreen font-bold text-[14px] tabular-nums">
						{showMatch && r.match !== undefined ? `${r.match}%` : ""}
					</span>
				</div>
			))}
		</div>
	);
}

function SectionLabel({ children }: { children: React.ReactNode }) {
	return (
		<p className="text-white/70 text-[12px] uppercase tracking-widest mb-3 px-3">
			{children}
		</p>
	);
}

interface Match {
	user: { user_id: string; emoji?: string; avatar?: string | null };
	matchScore: number;
	sharedEntities: Record<string, string[]>;
}

interface MiniProfile {
	user_id: string;
	emoji?: string;
	avatar?: string | null;
	taste_profile_headline?: string;
	taste_profile_vibe?: string;
}

const toRow = (p: MiniProfile): PersonRow => ({
	user_id: p.user_id,
	emoji: p.emoji,
	avatar: p.avatar,
	headline: p.taste_profile_headline,
	vibe: p.taste_profile_vibe,
});

export default function Discover() {
	const [me, setMe] = useState<string | null>(null);
	const [matches, setMatches] = useState<Match[] | null>(null);
	const [popular, setPopular] = useState<{ name: string; count: number }[]>([]);
	const [recent, setRecent] = useState<MiniProfile[]>([]);
	const [loveFilter, setLoveFilter] = useState<string | null>(null);
	const [lovers, setLovers] = useState<MiniProfile[] | null>(null);
	const [loaded, setLoaded] = useState(false);

	useEffect(() => {
		const u = getSessionUser();
		setMe(u);
		(async () => {
			const [discRes, matchRes] = await Promise.all([
				fetch("/api/discover").then((r) => r.json()),
				u
					? fetch("/api/find-matches", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ userId: u }),
					  }).then((r) => r.json())
					: Promise.resolve(null),
			]);
			if (discRes?.success) {
				setPopular(discRes.data.popular || []);
				setRecent(discRes.data.recent || []);
			}
			if (matchRes?.success) setMatches(matchRes.data || []);
			setLoaded(true);
		})();
	}, []);

	const browseLove = useCallback(async (name: string) => {
		setLoveFilter(name);
		setLovers(null);
		const res = await fetch(
			`/api/discover?love=${encodeURIComponent(name)}`
		).then((r) => r.json());
		setLovers(res?.success ? res.data.profiles : []);
	}, []);

	const matchRows: PersonRow[] = (matches || []).map((m) => ({
		user_id: m.user.user_id,
		emoji: m.user.emoji,
		avatar: m.user.avatar,
		match: Math.round(m.matchScore * 100),
		shared:
			Object.values(m.sharedEntities)
				.flat()
				.filter((s) => !s.startsWith("kindred:"))
				.slice(0, 3)
				.join(", ") || undefined,
	}));

	const loverRows: PersonRow[] = (lovers || [])
		.filter((p) => p.user_id !== me)
		.map(toRow);

	const freshRows: PersonRow[] = recent
		.filter((p) => p.user_id !== me)
		.map(toRow);

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[1100px] mx-auto px-6 pt-12 pb-24">
				<h1 className="text-center text-white text-[32px] font-extrabold mb-2">
					discover
				</h1>
				<p className="text-center text-white/80 text-[15px] mb-10">
					{me
						? "start with a thing you love — or meet your top matches"
						: "see who's here — or make your own page"}
				</p>

				{!loaded ? (
					<div className="text-center pt-8">
						<Spinner label="finding your people…" />
					</div>
				) : (
					<>
						{/* chips first */}
						<div className="mb-12">
							<div className="flex flex-wrap justify-center gap-2.5 max-w-[820px] mx-auto">
								{popular.map((p, i) => (
									<button
										key={p.name}
										onClick={() =>
											loveFilter === p.name
												? (setLoveFilter(null), setLovers(null))
												: browseLove(p.name)
										}
										className={`anim-chip font-bold text-[14px] px-4 py-2 rounded-full hover:opacity-85 text-[#1a1a1a] ${
											loveFilter === p.name ? "ring-[3px] ring-white" : ""
										}`}
										style={chipStyle(i)}
									>
										{p.name}
										{p.count > 1 && (
											<span className="opacity-50 font-normal"> ·{p.count}</span>
										)}
									</button>
								))}
							</div>
							<p className="text-center text-white/80 text-[12px] mt-4">
								tap a thing to see everyone who loves it
							</p>
						</div>

						{loveFilter ? (
							<div className="anim-fadeup">
								<div className="flex items-baseline justify-between px-3 mb-3">
									<p className="text-white/70 text-[12px] uppercase tracking-widest">
										people who love {loveFilter}
									</p>
									<button
										onClick={() => {
											setLoveFilter(null);
											setLovers(null);
										}}
										className="text-white/80 text-[13px] underline hover:text-white"
									>
										clear
									</button>
								</div>
								{lovers === null ? (
									<div className="text-center py-10">
										<Spinner label="looking…" />
									</div>
								) : (
									<PeopleTable
										rows={loverRows}
										emptyText="nobody else yet — you're the taste pioneer here."
									/>
								)}
							</div>
						) : (
							<>
								{me && matches && (
									<div className="mb-12">
										<SectionLabel>
											your people — ranked by taste overlap
										</SectionLabel>
										<PeopleTable
											rows={matchRows}
											showMatch
											emptyText="no matches yet — taste twins show up here as more people make pages."
										/>
									</div>
								)}

								{!me && (
									<p className="text-center text-white/80 text-[14px] mb-12">
										<Link
											href="/start"
											className="text-white underline hover:opacity-80 font-bold"
										>
											make your page
										</Link>{" "}
										to see who shares your taste — ranked by real overlap.
									</p>
								)}

								{freshRows.length > 0 && (
									<div>
										<SectionLabel>fresh pages</SectionLabel>
										<PeopleTable rows={freshRows} emptyText="" />
									</div>
								)}
							</>
						)}
					</>
				)}
			</main>
		</div>
	);
}
