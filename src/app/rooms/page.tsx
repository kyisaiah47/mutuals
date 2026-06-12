"use client";

/* MOCK — Bluesky/Reddit-style feed layout for taste rooms.
   Hardcoded data; nothing wired to the DB yet. */

import { useState } from "react";
import { Logo } from "@/components/tumblr";
import { Avatar } from "@/components/avatar";
import { CHIP_COLORS } from "@/lib/chips";

const MY_THINGS = [
	"Radiohead",
	"Inception",
	"Twin Peaks",
	"Outer Wilds",
	"House of Leaves",
	"Portishead",
	"Severance",
	"Disco Elysium",
];

function roomColor(name: string) {
	let h = 0;
	for (const c of name) h = (h * 31 + c.charCodeAt(0)) % 997;
	return CHIP_COLORS[h % CHIP_COLORS.length];
}

interface Post {
	user: string;
	avatar: string;
	match?: number;
	room: string;
	kind: "take" | "rec";
	time: string;
	text: string;
	hearts: number;
	replies: number;
}

const FEED: Post[] = [
	{
		user: "midnightreruns",
		avatar: "mrerun7",
		match: 55,
		room: "Radiohead",
		kind: "take",
		time: "2h",
		text: "in rainbows is the best 'first radiohead album' and i will not be taking questions. ok computer first is how you scare people off.",
		hearts: 14,
		replies: 6,
	},
	{
		user: "pixelpilgrim",
		avatar: "pxpil33",
		match: 37,
		room: "Outer Wilds",
		kind: "take",
		time: "4h",
		text: "finished my third loop-reset of this game and i'm convinced it's unspoilable. you can know everything and the ending still wrecks you.",
		hearts: 22,
		replies: 9,
	},
	{
		user: "staticbloom",
		avatar: "stblm44",
		match: 23,
		room: "Severance",
		kind: "rec",
		time: "7h",
		text: "if the severance hallways live in your head: play NORCO. southern gothic point-and-click, same corporate dread, criminally unknown.",
		hearts: 17,
		replies: 4,
	},
	{
		user: "velvetcassette",
		avatar: "vcass01",
		match: 22,
		room: "Portishead",
		kind: "take",
		time: "1d",
		text: "dummy is autumn, third is 3am in january. portishead albums are weather systems not records",
		hearts: 31,
		replies: 11,
	},
	{
		user: "paperbackghost",
		avatar: "pbg0st2",
		match: 27,
		room: "House of Leaves",
		kind: "rec",
		time: "1d",
		text: "for everyone who finished this and felt homeless after: Piranesi by Susanna Clarke. the same architectural unreality but warm instead of dreadful.",
		hearts: 26,
		replies: 8,
	},
	{
		user: "midnightreruns",
		avatar: "mrerun7",
		match: 55,
		room: "Twin Peaks",
		kind: "take",
		time: "2d",
		text: "the return episode 8 is the bravest hour of television ever aired and it's not close. network tv let lynch do THAT.",
		hearts: 44,
		replies: 15,
	},
];

const POPULAR_ROOMS = [
	{ name: "Radiohead", members: 7 },
	{ name: "Inception", members: 6 },
	{ name: "Severance", members: 3 },
	{ name: "Twin Peaks", members: 3 },
	{ name: "Disco Elysium", members: 2 },
];

const YOUR_PEOPLE = [
	{ user: "midnightreruns", avatar: "mrerun7", match: 55 },
	{ user: "pixelpilgrim", avatar: "pxpil33", match: 37 },
	{ user: "paperbackghost", avatar: "pbg0st2", match: 27 },
];

export default function FeedMock() {
	const [roomFilter, setRoomFilter] = useState<string | null>(null);
	const posts = roomFilter ? FEED.filter((p) => p.room === roomFilter) : FEED;

	return (
		<div className="min-h-screen bg-tnavy text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
			<div className="max-w-[1180px] mx-auto grid grid-cols-[210px_minmax(0,640px)_280px] max-lg:grid-cols-[210px_1fr] max-md:grid-cols-1 gap-8 px-4">
				{/* ===== left nav ===== */}
				<nav className="max-md:hidden sticky top-0 h-screen pt-6 flex flex-col">
					<a href="/" className="flex items-center gap-2 px-3 mb-7">
						<Logo size={26} />
						<span className="font-extrabold text-[20px] tracking-tight">
							mutuals
						</span>
					</a>
					<div className="space-y-0.5">
						<button
							onClick={() => setRoomFilter(null)}
							className={`w-full text-left px-3 py-2 rounded-lg text-[15px] ${
								!roomFilter ? "font-extrabold bg-white/5" : "text-white/80 hover:bg-white/5"
							}`}
						>
							home
						</button>
						<a href="#" className="block px-3 py-2 rounded-lg text-[15px] text-white/80 hover:bg-white/5">
							discover
						</a>
						<a href="#" className="block px-3 py-2 rounded-lg text-[15px] text-white/80 hover:bg-white/5">
							my page
						</a>
					</div>

					<p className="text-white/50 text-[11px] uppercase tracking-widest px-3 mt-8 mb-2">
						your rooms
					</p>
					<div className="space-y-0.5 overflow-y-auto">
						{MY_THINGS.map((t) => (
							<button
								key={t}
								onClick={() => setRoomFilter(roomFilter === t ? null : t)}
								className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] text-left ${
									roomFilter === t
										? "bg-white/10 font-bold"
										: "text-white/85 hover:bg-white/5"
								}`}
							>
								<span
									className="w-2.5 h-2.5 rounded-full shrink-0"
									style={{ background: roomColor(t) }}
								/>
								<span className="truncate">{t}</span>
							</button>
						))}
						<button className="w-full px-3 py-1.5 text-left text-[13px] text-white/50 hover:text-white">
							+ add things
						</button>
					</div>

					<div className="mt-auto pb-5 flex items-center gap-2.5 px-3">
						<Avatar seed="vcass01" size={34} className="rounded-full" />
						<div className="min-w-0">
							<p className="text-[13px] font-bold truncate">kyisaiah47</p>
							<p className="text-[11px] text-white/50">vibe: labyrinthine</p>
						</div>
					</div>
				</nav>

				{/* ===== center feed ===== */}
				<main className="border-x border-white/10 min-h-screen max-md:border-x-0">
					<div className="sticky top-0 bg-tnavy/95 backdrop-blur border-b border-white/10 px-5 py-3.5 z-10">
						<p className="font-extrabold text-[16px]">
							{roomFilter ? (
								<>
									<span
										className="w-2.5 h-2.5 rounded-full inline-block mr-2"
										style={{ background: roomColor(roomFilter) }}
									/>
									{roomFilter}
									<span className="text-white/50 font-normal text-[13px] ml-2">
										taste room · 7 people
									</span>
								</>
							) : (
								<>
									home
									<span className="text-white/50 font-normal text-[13px] ml-2">
										posts from your rooms
									</span>
								</>
							)}
						</p>
					</div>

					{/* composer */}
					<div className="px-5 py-4 border-b border-white/10 flex gap-3">
						<Avatar seed="vcass01" size={40} className="rounded-full" />
						<div className="flex-1">
							<input
								placeholder={
									roomFilter
										? `drop a take in ${roomFilter}…`
										: "drop a take or a rec in one of your rooms…"
								}
								className="w-full bg-transparent text-[16px] outline-none placeholder:text-white/35 py-2"
							/>
							<div className="flex items-center justify-between mt-1">
								<div className="flex gap-1.5 text-[11px]">
									<span className="px-2 py-0.5 rounded-full bg-white/10 text-white/70 cursor-pointer hover:bg-white/15">
										take
									</span>
									<span className="px-2 py-0.5 rounded-full bg-white/5 text-white/50 cursor-pointer hover:bg-white/15">
										rec
									</span>
								</div>
								<button className="bg-taccent text-tnavy font-bold text-[13px] px-5 py-1.5 rounded-full hover:opacity-90">
									post
								</button>
							</div>
						</div>
					</div>

					{/* posts */}
					{posts.map((p) => (
						<article
							key={p.user + p.time}
							className="px-5 py-4 border-b border-white/10 hover:bg-white/[0.03] cursor-pointer flex gap-3"
						>
							<Avatar seed={p.avatar} size={42} className="rounded-full shrink-0" />
							<div className="min-w-0 flex-1">
								<p className="text-[14px] flex items-center gap-1.5 flex-wrap">
									<span className="font-bold hover:underline">{p.user}</span>
									{p.match !== undefined && (
										<span className="text-tgreen text-[11px] font-bold">
											{p.match}%
										</span>
									)}
									<span className="text-white/40">·</span>
									<span className="text-white/50 text-[13px]">{p.time}</span>
									<span className="text-white/40">·</span>
									<span
										className="text-[12px] font-bold px-2 py-0.5 rounded-full text-[#1a1a1a]"
										style={{ background: roomColor(p.room) }}
									>
										{p.room}
									</span>
									{p.kind === "rec" && (
										<span className="text-[11px] uppercase tracking-wider text-taccent font-bold">
											rec
										</span>
									)}
								</p>
								<p className="text-[15px] text-white/90 leading-relaxed mt-1.5">
									{p.text}
								</p>
								<div className="flex gap-6 mt-2.5 text-[13px] text-white/50">
									<span className="hover:text-white">💬 {p.replies}</span>
									<span className="hover:text-[#ff8fc1]">♥ {p.hearts}</span>
									<span className="hover:text-white">share</span>
								</div>
							</div>
						</article>
					))}
					<p className="text-center text-white/40 text-[13px] py-10">
						that&apos;s everything from your rooms today — go drop a take
					</p>
				</main>

				{/* ===== right rail ===== */}
				<aside className="max-lg:hidden sticky top-0 h-screen pt-6 space-y-7 overflow-y-auto pb-8">
					<div className="bg-white/5 border border-white/10 rounded-xl p-4">
						<p className="text-white/60 text-[11px] uppercase tracking-widest mb-3">
							your people
						</p>
						{YOUR_PEOPLE.map((m) => (
							<a
								key={m.user}
								href={`/u/${m.user}`}
								className="flex items-center gap-2.5 py-1.5 hover:bg-white/5 rounded-lg px-1.5 -mx-1.5"
							>
								<Avatar seed={m.avatar} size={32} className="rounded-full" />
								<span className="text-[13px] font-bold truncate flex-1">
									{m.user}
								</span>
								<span className="text-tgreen text-[12px] font-bold">
									{m.match}%
								</span>
							</a>
						))}
						<a href="#" className="block text-[12px] text-white/50 hover:text-white mt-2">
							see all matches →
						</a>
					</div>

					<div className="bg-white/5 border border-white/10 rounded-xl p-4">
						<p className="text-white/60 text-[11px] uppercase tracking-widest mb-3">
							busy rooms
						</p>
						<div className="flex flex-wrap gap-2">
							{POPULAR_ROOMS.map((r) => (
								<button
									key={r.name}
									onClick={() => setRoomFilter(r.name)}
									className="font-bold text-[12px] px-3 py-1 rounded-full text-[#1a1a1a] hover:opacity-85"
									style={{ background: roomColor(r.name) }}
								>
									{r.name} <span className="opacity-60">·{r.members}</span>
								</button>
							))}
						</div>
					</div>

					<p className="text-white/30 text-[11px] px-1">
						mutuals — find people who love what you love
					</p>
				</aside>
			</div>
		</div>
	);
}
