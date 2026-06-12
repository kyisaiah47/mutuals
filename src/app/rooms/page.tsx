"use client";

import { Suspense, useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Logo, Spinner } from "@/components/tumblr";
import { Avatar } from "@/components/avatar";
import { CHIP_COLORS } from "@/lib/chips";
import { getSessionUser } from "@/lib/session";

// every thing is a room (m/radiohead). threads have titles; replies are comments.

function roomColor(name: string) {
	let h = 0;
	for (const c of name.toLowerCase()) h = (h * 31 + c.charCodeAt(0)) % 997;
	return CHIP_COLORS[h % CHIP_COLORS.length];
}

const slug = (s: string) => s.toLowerCase().replace(/\s+/g, "");

interface Post {
	id: string;
	author: string;
	authorEmoji?: string;
	authorAvatar?: string;
	room: string;
	title: string | null;
	kind: "take" | "rec";
	body: string;
	createdAt: string;
	hearts: number;
	replies: number;
	hearted: boolean;
}

interface RoomPerson {
	user_id: string;
	emoji?: string;
	avatar?: string | null;
}

function timeAgo(iso: string) {
	const s = (Date.now() - new Date(iso).getTime()) / 1000;
	if (s < 60) return "now";
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	if (s < 86400) return `${Math.floor(s / 3600)}h`;
	return `${Math.floor(s / 86400)}d`;
}

function RoomsApp() {
	const sp = useSearchParams();

	const [me, setMe] = useState<string | null>(null);
	const [myVibe, setMyVibe] = useState<string | null>(null);
	const [myAvatar, setMyAvatar] = useState<string | null>(null);
	const [myThings, setMyThings] = useState<string[]>([]);
	const [matchPct, setMatchPct] = useState<Record<string, number>>({});
	const [topPeople, setTopPeople] = useState<
		{ user: string; avatar?: string; emoji?: string; match: number }[]
	>([]);
	const [busyRooms, setBusyRooms] = useState<{ name: string; count: number }[]>([]);

	const [room, setRoom] = useState<string | null>(sp.get("room"));
	const [thread, setThread] = useState<Post | null>(null);
	const [comments, setComments] = useState<Post[] | null>(null);
	const [roomPeople, setRoomPeople] = useState<RoomPerson[] | null>(null);
	const [threads, setThreads] = useState<Post[] | null>(null);

	// composer
	const [title, setTitle] = useState("");
	const [body, setBody] = useState("");
	const [kind, setKind] = useState<"take" | "rec">("take");
	const [composerRoom, setComposerRoom] = useState<string>("");
	const [posting, setPosting] = useState(false);
	const [commentDraft, setCommentDraft] = useState("");

	const loadThreads = useCallback(async (r: string | null, user: string | null) => {
		setThreads(null);
		const params = new URLSearchParams();
		if (user) params.set("me", user);
		if (r) params.set("room", r);
		const res = await fetch(`/api/posts?${params}`).then((x) => x.json());
		setThreads(res?.success ? res.data : []);
	}, []);

	const loadRoomPeople = useCallback(async (r: string) => {
		setRoomPeople(null);
		const res = await fetch(`/api/discover?love=${encodeURIComponent(r)}`).then((x) =>
			x.json()
		);
		setRoomPeople(res?.success ? res.data.profiles : []);
	}, []);

	const loadComments = useCallback(async (threadId: string) => {
		setComments(null);
		const res = await fetch(`/api/posts?parent=${threadId}`).then((x) => x.json());
		setComments(res?.success ? res.data : []);
	}, []);

	const openThread = (p: Post) => {
		setThread(p);
		window.history.replaceState(null, "", `/rooms?thread=${p.id}`);
		loadComments(p.id);
	};

	const closeThread = () => {
		setThread(null);
		setComments(null);
		window.history.replaceState(
			null,
			"",
			room ? `/rooms?room=${encodeURIComponent(room)}` : "/rooms"
		);
	};

	const switchRoom = (r: string | null) => {
		setRoom(r);
		setThread(null);
		setComments(null);
		window.history.replaceState(
			null,
			"",
			r ? `/rooms?room=${encodeURIComponent(r)}` : "/rooms"
		);
		loadThreads(r, me);
		if (r) loadRoomPeople(r);
		else setRoomPeople(null);
	};

	useEffect(() => {
		const u = getSessionUser();
		setMe(u);
		const initialRoom = sp.get("room");
		const initialThread = sp.get("thread");
		loadThreads(initialRoom, u);
		if (initialRoom) loadRoomPeople(initialRoom);
		if (initialThread) {
			(async () => {
				const res = await fetch(
					`/api/posts?id=${initialThread}${u ? `&me=${encodeURIComponent(u)}` : ""}`
				).then((x) => x.json());
				if (res?.success && res.data[0]) {
					setThread(res.data[0]);
					loadComments(res.data[0].id);
				}
			})();
		}
		(async () => {
			const [discRes, matchRes, profRes] = await Promise.all([
				fetch("/api/discover").then((r) => r.json()),
				u
					? fetch("/api/find-matches", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ userId: u }),
					  }).then((r) => r.json())
					: Promise.resolve(null),
				u
					? fetch("/api/get-user-profile", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ userId: u }),
					  }).then((r) => r.json())
					: Promise.resolve(null),
			]);
			if (discRes?.success) setBusyRooms((discRes.data.popular || []).slice(0, 12));
			if (matchRes?.success) {
				const pct: Record<string, number> = {};
				const people: typeof topPeople = [];
				for (const m of matchRes.data || []) {
					pct[m.user.user_id] = Math.round(m.matchScore * 100);
					people.push({
						user: m.user.user_id,
						avatar: m.user.avatar,
						emoji: m.user.emoji,
						match: Math.round(m.matchScore * 100),
					});
				}
				setMatchPct(pct);
				setTopPeople(people.slice(0, 4));
			}
			if (profRes?.success) {
				const interests = (profRes.data.profile.interests || {}) as Record<
					string,
					string[]
				>;
				const things = Object.values(interests).flat();
				setMyThings(things);
				setComposerRoom(things[0] || "");
				setMyVibe(profRes.data.profile.taste_profile_vibe || null);
				setMyAvatar(profRes.data.profile.avatar || null);
			}
		})();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const submitThread = async () => {
		if (!me || !title.trim() || !body.trim() || posting) return;
		const targetRoom = room || composerRoom;
		if (!targetRoom) return;
		setPosting(true);
		try {
			const res = await fetch("/api/posts", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					author: me,
					room: targetRoom,
					title: title.trim(),
					kind,
					body: body.trim(),
				}),
			}).then((r) => r.json());
			if (res.success) {
				setTitle("");
				setBody("");
				await loadThreads(room, me);
			}
		} finally {
			setPosting(false);
		}
	};

	const submitComment = async () => {
		if (!me || !thread || !commentDraft.trim()) return;
		await fetch("/api/posts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({
				author: me,
				room: thread.room,
				body: commentDraft.trim(),
				parentId: thread.id,
			}),
		});
		setCommentDraft("");
		loadComments(thread.id);
	};

	const toggleHeart = async (post: Post) => {
		if (!me) return;
		const flip = (p: Post) =>
			p.id === post.id
				? { ...p, hearted: !p.hearted, hearts: p.hearts + (p.hearted ? -1 : 1) }
				: p;
		setThreads((prev) => prev?.map(flip) ?? null);
		setThread((prev) => (prev ? flip(prev) : prev));
		await fetch("/api/hearts", {
			method: "POST",
			headers: { "Content-Type": "application/json" },
			body: JSON.stringify({ postId: post.id, user: me }),
		});
	};

	const inMyRooms = room && myThings.some((t) => t.toLowerCase() === room.toLowerCase());

	return (
		<div className="min-h-screen bg-tnavy text-white font-['Helvetica_Neue',Helvetica,Arial,sans-serif]">
			<div className="max-w-[1180px] mx-auto grid grid-cols-[220px_minmax(0,630px)_280px] max-lg:grid-cols-[220px_1fr] max-md:grid-cols-1 gap-8 px-4">
				{/* ===== left nav ===== */}
				<nav className="max-md:hidden sticky top-0 h-screen pt-6 flex flex-col">
					<Link href="/" className="flex items-center gap-2 px-3 mb-7">
						<Logo size={26} />
						<span className="font-extrabold text-[20px] tracking-tight">mutuals</span>
					</Link>
					<div className="space-y-0.5">
						<button
							onClick={() => switchRoom(null)}
							className={`w-full text-left px-3 py-2 rounded-lg text-[15px] ${
								!room && !thread
									? "font-extrabold bg-white/5"
									: "text-white/80 hover:bg-white/5"
							}`}
						>
							home
						</button>
						<Link
							href="/discover"
							className="block px-3 py-2 rounded-lg text-[15px] text-white/80 hover:bg-white/5"
						>
							discover
						</Link>
						{me && (
							<Link
								href={`/u/${encodeURIComponent(me)}`}
								className="block px-3 py-2 rounded-lg text-[15px] text-white/80 hover:bg-white/5"
							>
								my page
							</Link>
						)}
					</div>

					{myThings.length > 0 && (
						<>
							<p className="text-white/50 text-[11px] uppercase tracking-widest px-3 mt-7 mb-2">
								your rooms
							</p>
							<div className="space-y-0.5 overflow-y-auto min-h-0 flex-1">
								{myThings.map((t) => (
									<button
										key={t}
										onClick={() => switchRoom(t)}
										className={`w-full flex items-center gap-2.5 px-3 py-1.5 rounded-lg text-[14px] text-left ${
											room?.toLowerCase() === t.toLowerCase()
												? "bg-white/10 font-bold"
												: "text-white/85 hover:bg-white/5"
										}`}
									>
										<span
											className="w-2.5 h-2.5 rounded-full shrink-0"
											style={{ background: roomColor(t) }}
										/>
										<span className="truncate">m/{slug(t)}</span>
									</button>
								))}
								<Link
									href="/edit"
									className="block px-3 py-1.5 text-[13px] text-white/50 hover:text-white"
								>
									+ add things
								</Link>
							</div>
						</>
					)}

					<div className="mt-auto pb-5 pt-3 px-3">
						{me ? (
							<Link href={`/u/${encodeURIComponent(me)}`} className="flex items-center gap-2.5">
								<Avatar seed={myAvatar} size={34} className="rounded-full" />
								<div className="min-w-0">
									<p className="text-[13px] font-bold truncate">{me}</p>
									{myVibe && (
										<p className="text-[11px] text-white/50 truncate">
											vibe: {myVibe.toLowerCase()}
										</p>
									)}
								</div>
							</Link>
						) : (
							<Link
								href="/start"
								className="block text-center bg-taccent text-tnavy font-bold text-[13px] px-4 py-2 rounded-full hover:opacity-90"
							>
								make your page
							</Link>
						)}
					</div>
				</nav>

				{/* ===== center ===== */}
				<main className="border-x border-white/10 min-h-screen max-md:border-x-0">
					{thread ? (
						/* ---------- thread view ---------- */
						<>
							<div className="sticky top-0 bg-tnavy/95 backdrop-blur border-b border-white/10 px-5 py-3.5 z-10 flex items-center gap-3">
								<button
									onClick={closeThread}
									className="text-white/70 hover:text-white text-[18px] leading-none"
								>
									←
								</button>
								<button
									onClick={() => switchRoom(thread.room)}
									className="font-extrabold text-[15px] hover:underline"
								>
									m/{slug(thread.room)}
								</button>
								<span className="text-white/50 text-[13px]">thread</span>
							</div>

							<div className="px-5 py-5 border-b border-white/10">
								<div className="flex items-center gap-2 text-[13px] mb-3 flex-wrap">
									<Link href={`/u/${encodeURIComponent(thread.author)}`} className="shrink-0">
										<Avatar
											seed={thread.authorAvatar}
											emoji={thread.authorEmoji}
											size={28}
											className="rounded-full inline-block"
										/>
									</Link>
									<Link
										href={`/u/${encodeURIComponent(thread.author)}`}
										className="font-bold hover:underline"
									>
										{thread.author}
									</Link>
									{matchPct[thread.author] !== undefined && (
										<span className="text-tgreen text-[11px] font-bold">
											{matchPct[thread.author]}%
										</span>
									)}
									<span className="text-white/50">{timeAgo(thread.createdAt)}</span>
									{thread.kind === "rec" && (
										<span className="text-[11px] uppercase tracking-wider text-taccent font-bold">
											rec
										</span>
									)}
								</div>
								<h1 className="text-[22px] font-extrabold leading-snug">
									{thread.title || thread.body.slice(0, 80)}
								</h1>
								<p className="text-[15px] text-white/90 leading-relaxed mt-2.5 whitespace-pre-wrap">
									{thread.body}
								</p>
								<button
									onClick={() => toggleHeart(thread)}
									className={`mt-3.5 text-[13px] ${
										thread.hearted ? "text-[#ff8fc1]" : "text-white/50 hover:text-[#ff8fc1]"
									}`}
								>
									♥ {thread.hearts}
								</button>
							</div>

							{/* comments */}
							<div className="px-5 py-4">
								<p className="text-white/60 text-[11px] uppercase tracking-widest mb-4">
									{comments?.length ?? "…"} comments
								</p>
								{me && (
									<div className="flex gap-2 mb-5">
										<Avatar seed={myAvatar} size={32} className="rounded-full shrink-0" />
										<input
											value={commentDraft}
											onChange={(e) => setCommentDraft(e.target.value)}
											onKeyDown={(e) => e.key === "Enter" && submitComment()}
											placeholder="add a comment…"
											maxLength={500}
											className="flex-1 bg-white/5 border border-white/15 rounded-full px-4 py-2 text-[14px] outline-none focus:border-white/50 placeholder:text-white/35"
										/>
										<button
											onClick={submitComment}
											disabled={!commentDraft.trim()}
											className="bg-taccent text-tnavy font-bold text-[13px] px-4 rounded-full hover:opacity-90 disabled:opacity-40"
										>
											comment
										</button>
									</div>
								)}
								{comments === null ? (
									<Spinner label="loading comments…" />
								) : comments.length === 0 ? (
									<p className="text-white/50 text-[14px]">
										no comments yet{me ? " — say something" : ""}.
									</p>
								) : (
									<div className="space-y-4">
										{comments.map((c) => (
											<div key={c.id} className="flex gap-2.5">
												<Link href={`/u/${encodeURIComponent(c.author)}`} className="shrink-0">
													<Avatar
														seed={c.authorAvatar}
														emoji={c.authorEmoji}
														size={32}
														className="rounded-full"
													/>
												</Link>
												<div className="min-w-0">
													<p className="text-[13px]">
														<Link
															href={`/u/${encodeURIComponent(c.author)}`}
															className="font-bold hover:underline"
														>
															{c.author}
														</Link>{" "}
														{matchPct[c.author] !== undefined && (
															<span className="text-tgreen text-[11px] font-bold mr-1">
																{matchPct[c.author]}%
															</span>
														)}
														<span className="text-white/40 text-[12px]">
															{timeAgo(c.createdAt)}
														</span>
													</p>
													<p className="text-[14.5px] text-white/90 leading-relaxed mt-0.5">
														{c.body}
													</p>
												</div>
											</div>
										))}
									</div>
								)}
							</div>
						</>
					) : (
						/* ---------- thread list ---------- */
						<>
							<div className="sticky top-0 bg-tnavy/95 backdrop-blur border-b border-white/10 px-5 py-3.5 z-10">
								{room ? (
									<div className="flex items-center gap-2.5">
										<span
											className="w-3 h-3 rounded-full inline-block"
											style={{ background: roomColor(room) }}
										/>
										<p className="font-extrabold text-[16px]">
											m/{slug(room)}
											<span className="text-white/50 font-normal text-[13px] ml-2">
												{roomPeople ? `${roomPeople.length} people love ${room}` : room}
											</span>
										</p>
									</div>
								) : (
									<p className="font-extrabold text-[16px]">
										home
										<span className="text-white/50 font-normal text-[13px] ml-2">
											threads from your rooms
										</span>
									</p>
								)}
							</div>

							{/* thread composer */}
							{me && (room ? true : myThings.length > 0) && (
								<div className="px-5 py-4 border-b border-white/10">
									<input
										value={title}
										onChange={(e) => setTitle(e.target.value)}
										placeholder={
											room ? `start a thread in m/${slug(room)}…` : "thread title…"
										}
										maxLength={120}
										className="w-full bg-transparent text-[17px] font-bold outline-none placeholder:text-white/35 placeholder:font-normal py-1"
									/>
									{(title.trim() || body.trim()) && (
										<textarea
											value={body}
											onChange={(e) => setBody(e.target.value)}
											placeholder="say more…"
											maxLength={500}
											rows={3}
											className="w-full bg-transparent text-[15px] outline-none placeholder:text-white/35 py-1 resize-none anim-fadeup"
										/>
									)}
									<div className="flex items-center justify-between gap-2 flex-wrap mt-1">
										<div className="flex items-center gap-1.5 text-[11px]">
											{(["take", "rec"] as const).map((k) => (
												<button
													key={k}
													onClick={() => setKind(k)}
													className={`px-2.5 py-1 rounded-full ${
														kind === k
															? "bg-white/15 text-white font-bold"
															: "bg-white/5 text-white/60 hover:bg-white/10"
													}`}
												>
													{k}
												</button>
											))}
											{!room && (
												<select
													value={composerRoom}
													onChange={(e) => setComposerRoom(e.target.value)}
													className="bg-white/5 text-white/80 rounded-full px-2 py-1 outline-none text-[11px] border border-white/10 max-w-[170px]"
												>
													{myThings.map((t) => (
														<option key={t} value={t} className="bg-tnavy">
															m/{slug(t)}
														</option>
													))}
												</select>
											)}
										</div>
										<button
											onClick={submitThread}
											disabled={posting || !title.trim() || !body.trim()}
											className="bg-taccent text-tnavy font-bold text-[13px] px-5 py-1.5 rounded-full hover:opacity-90 disabled:opacity-40 shrink-0"
										>
											{posting ? "…" : "post thread"}
										</button>
									</div>
								</div>
							)}

							{room && me && !inMyRooms && (
								<div className="px-5 py-3 border-b border-white/10 text-[13px] text-white/60">
									{room} isn&apos;t on your page yet —{" "}
									<Link href="/edit" className="text-taccent hover:underline">
										add it
									</Link>{" "}
									to get this room in your feed.
								</div>
							)}

							{threads === null ? (
								<div className="text-center py-14">
									<Spinner label="loading threads…" />
								</div>
							) : threads.length === 0 ? (
								<p className="text-center text-white/60 text-[14px] py-14 px-8">
									{room
										? `no threads in m/${slug(room)} yet — start the first one`
										: me
										? "your rooms are quiet — start a thread"
										: "make a page to join in"}
								</p>
							) : (
								threads.map((p) => (
									<article
										key={p.id}
										onClick={() => openThread(p)}
										className="px-5 py-4 border-b border-white/10 hover:bg-white/[0.04] cursor-pointer"
									>
										<div className="flex items-center gap-1.5 text-[12.5px] flex-wrap text-white/60">
											<Avatar
												seed={p.authorAvatar}
												emoji={p.authorEmoji}
												size={20}
												className="rounded-full"
											/>
											<span className="font-bold text-white/85">{p.author}</span>
											{matchPct[p.author] !== undefined && (
												<span className="text-tgreen text-[11px] font-bold">
													{matchPct[p.author]}%
												</span>
											)}
											<span>·</span>
											<span>{timeAgo(p.createdAt)}</span>
											{!room && (
												<>
													<span>·</span>
													<button
														onClick={(e) => {
															e.stopPropagation();
															switchRoom(p.room);
														}}
														className="font-bold px-2 py-0.5 rounded-full text-[#1a1a1a] text-[11px] hover:opacity-85"
														style={{ background: roomColor(p.room) }}
													>
														m/{slug(p.room)}
													</button>
												</>
											)}
											{p.kind === "rec" && (
												<span className="text-[10px] uppercase tracking-wider text-taccent font-bold">
													rec
												</span>
											)}
										</div>
										<h2 className="text-[16.5px] font-bold leading-snug mt-1.5">
											{p.title || p.body.slice(0, 80)}
										</h2>
										{p.title && (
											<p className="text-[13.5px] text-white/55 leading-relaxed mt-1 line-clamp-2">
												{p.body}
											</p>
										)}
										<div className="flex gap-5 mt-2 text-[12.5px] text-white/50">
											<span>💬 {p.replies} comments</span>
											<button
												onClick={(e) => {
													e.stopPropagation();
													toggleHeart(p);
												}}
												className={p.hearted ? "text-[#ff8fc1]" : "hover:text-[#ff8fc1]"}
											>
												♥ {p.hearts}
											</button>
										</div>
									</article>
								))
							)}
						</>
					)}
				</main>

				{/* ===== right rail ===== */}
				<aside className="max-lg:hidden sticky top-0 h-screen pt-6 space-y-6 overflow-y-auto pb-8">
					{room && (
						<div className="bg-white/5 border border-white/10 rounded-xl p-4">
							<p className="text-white/60 text-[11px] uppercase tracking-widest mb-3">
								people in this room
							</p>
							{roomPeople === null ? (
								<Spinner label="loading…" />
							) : roomPeople.length === 0 ? (
								<p className="text-[13px] text-white/60">nobody yet — claim it.</p>
							) : (
								roomPeople.slice(0, 8).map((m) => (
									<Link
										key={m.user_id}
										href={`/u/${encodeURIComponent(m.user_id)}`}
										className="flex items-center gap-2.5 py-1.5 hover:bg-white/5 rounded-lg px-1.5 -mx-1.5"
									>
										<Avatar seed={m.avatar} emoji={m.emoji} size={32} className="rounded-full" />
										<span className="text-[13px] font-bold truncate flex-1">{m.user_id}</span>
										{matchPct[m.user_id] !== undefined && (
											<span className="text-tgreen text-[12px] font-bold">
												{matchPct[m.user_id]}%
											</span>
										)}
									</Link>
								))
							)}
						</div>
					)}

					{topPeople.length > 0 && (
						<div className="bg-white/5 border border-white/10 rounded-xl p-4">
							<p className="text-white/60 text-[11px] uppercase tracking-widest mb-3">
								your people
							</p>
							{topPeople.map((m) => (
								<Link
									key={m.user}
									href={`/u/${encodeURIComponent(m.user)}`}
									className="flex items-center gap-2.5 py-1.5 hover:bg-white/5 rounded-lg px-1.5 -mx-1.5"
								>
									<Avatar seed={m.avatar} emoji={m.emoji} size={32} className="rounded-full" />
									<span className="text-[13px] font-bold truncate flex-1">{m.user}</span>
									<span className="text-tgreen text-[12px] font-bold">{m.match}%</span>
								</Link>
							))}
							<Link
								href="/discover"
								className="block text-[12px] text-white/50 hover:text-white mt-2"
							>
								see all matches →
							</Link>
						</div>
					)}

					{busyRooms.length > 0 && (
						<div className="bg-white/5 border border-white/10 rounded-xl p-4">
							<p className="text-white/60 text-[11px] uppercase tracking-widest mb-3">
								busy rooms
							</p>
							<div className="flex flex-wrap gap-2">
								{busyRooms.map((r) => (
									<button
										key={r.name}
										onClick={() => switchRoom(r.name)}
										className="font-bold text-[12px] px-3 py-1 rounded-full text-[#1a1a1a] hover:opacity-85"
										style={{ background: roomColor(r.name) }}
									>
										{r.name}
										{r.count > 1 && <span className="opacity-60"> ·{r.count}</span>}
									</button>
								))}
							</div>
						</div>
					)}

					<p className="text-white/40 text-[11px] px-1">
						mutuals — find people who love what you love
					</p>
				</aside>
			</div>
		</div>
	);
}

export default function RoomsPage() {
	return (
		<Suspense>
			<RoomsApp />
		</Suspense>
	);
}
