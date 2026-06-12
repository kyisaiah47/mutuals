"use client";

import { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { getSessionUser } from "@/lib/session";
import { Spinner } from "@/components/tumblr";
import { Avatar } from "@/components/avatar";

export function OwnerBar({ username }: { username: string }) {
	const [isOwner, setIsOwner] = useState(false);
	const [copied, setCopied] = useState(false);
	useEffect(() => setIsOwner(getSessionUser() === username), [username]);
	if (!isOwner) return null;

	const copy = async () => {
		await navigator.clipboard.writeText(window.location.href);
		setCopied(true);
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<>
			{copied && (
				<div className="fixed bottom-6 left-1/2 -translate-x-1/2 z-50 bg-white text-tnavy text-[13px] font-bold px-5 py-2 rounded-full shadow-lg anim-fadeup">
					link copied — go share your page
				</div>
			)}
			<div className="mb-6 flex items-center justify-between bg-white/8 border border-white/15 rounded px-4 py-2.5 text-[13px]">
				<span className="text-white/70">this is your page</span>
				<div className="flex gap-4">
					<Link href="/edit" className="text-white/80 underline hover:text-white">
						edit your things
					</Link>
					<button
						onClick={copy}
						className="text-white/80 underline hover:text-white"
					>
						{copied ? "copied!" : "copy link"}
					</button>
				</div>
			</div>
		</>
	);
}

export function WaveBox({ profileUser }: { profileUser: string }) {
	const [me, setMe] = useState<string | null>(null);
	const [state, setState] = useState<{
		waved: boolean;
		mutual: boolean;
		contact?: string;
	} | null>(null);
	const [busy, setBusy] = useState(false);

	const load = useCallback(async (user: string) => {
		try {
			const res = await fetch(
				`/api/wave?me=${encodeURIComponent(user)}&them=${encodeURIComponent(profileUser)}`
			);
			const json = await res.json();
			if (json.success) setState(json.data);
		} catch {}
	}, [profileUser]);

	useEffect(() => {
		const u = getSessionUser();
		setMe(u);
		if (u && u !== profileUser) load(u);
	}, [profileUser, load]);

	if (!me || me === profileUser) return null;

	const wave = async () => {
		setBusy(true);
		try {
			await fetch("/api/wave", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ from: me, to: profileUser }),
			});
			await load(me);
		} finally {
			setBusy(false);
		}
	};

	return (
		<div className="mb-6 bg-white/8 border border-white/15 rounded px-4 py-3 text-[13px] flex items-center justify-between">
			{state?.mutual ? (
				<span className="text-white/85">
					you&apos;re mutuals!{" "}
					{state.contact ? (
						<>
							reach them at{" "}
							<strong className="text-white">{state.contact}</strong>
						</>
					) : (
						<span className="text-white/80">
							(they haven&apos;t added contact info)
						</span>
					)}
				</span>
			) : state?.waved ? (
				<span className="text-white/80">
					you waved — if they wave back, contact unlocks
				</span>
			) : (
				<>
					<span className="text-white/80">
						like their taste? wave — if it&apos;s mutual, contact unlocks
					</span>
					<button
						onClick={wave}
						disabled={busy}
						className="bg-taccent text-tnavy font-bold px-5 py-1.5 rounded-full hover:opacity-90 disabled:opacity-50 shrink-0 ml-3"
					>
						{busy ? "…" : "wave"}
					</button>
				</>
			)}
		</div>
	);
}

interface WallComment {
	id: string;
	author_user_id: string;
	author_emoji?: string;
	author_avatar?: string;
	body: string;
	created_at: string;
}

export function Wall({ profileUser }: { profileUser: string }) {
	const [comments, setComments] = useState<WallComment[] | null>(null);
	const [me, setMe] = useState<string | null>(null);
	const [draft, setDraft] = useState("");
	const [posting, setPosting] = useState(false);

	const load = useCallback(async () => {
		try {
			const res = await fetch(
				`/api/wall?user=${encodeURIComponent(profileUser)}`
			);
			const json = await res.json();
			setComments(json.success ? json.data : []);
		} catch {
			setComments([]);
		}
	}, [profileUser]);

	useEffect(() => {
		setMe(getSessionUser());
		load();
	}, [load]);

	const post = async () => {
		if (!draft.trim() || !me) return;
		setPosting(true);
		try {
			await fetch("/api/wall", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					profileUser,
					author: me,
					body: draft.trim(),
				}),
			});
			setDraft("");
			await load();
		} finally {
			setPosting(false);
		}
	};

	return (
		<section>
			<p className="text-white/60 text-[12px] uppercase tracking-widest border-b border-white/15 pb-2 mb-4">
				{comments?.length ?? "…"} notes on {profileUser}
			</p>
			{me && me !== profileUser && (
				<div className="flex gap-2 mb-4">
					<input
						value={draft}
						onChange={(e) => setDraft(e.target.value)}
						onKeyDown={(e) => e.key === "Enter" && !posting && post()}
						placeholder="leave a note…"
						maxLength={280}
						className="flex-1 bg-white/5 border border-white/15 text-white rounded-full px-4 py-2 text-[14px] outline-none focus:border-white/50 placeholder:text-white/35"
					/>
					<button
						onClick={post}
						disabled={posting || !draft.trim()}
						className="bg-taccent text-tnavy text-[13px] font-bold px-5 rounded-full hover:opacity-90 disabled:opacity-40"
					>
						post
					</button>
				</div>
			)}
			{comments === null ? (
				<Spinner label="loading notes…" />
			) : comments.length === 0 ? (
				<p className="text-[14px] text-white/70">
					no notes yet{me && me !== profileUser ? " — be the first" : ""}.
				</p>
			) : (
				comments.map((c) => (
					<div
						key={c.id}
						className="flex gap-2.5 py-3 border-t border-white/10 first:border-t-0"
					>
						<Avatar seed={c.author_avatar} emoji={c.author_emoji} size={32} />
						<p className="text-[13px] leading-relaxed min-w-0 text-white/90">
							<Link
								href={`/u/${encodeURIComponent(c.author_user_id)}`}
								className="font-bold text-white hover:underline"
							>
								{c.author_user_id}
							</Link>{" "}
							<span className="text-white/50">
								{new Date(c.created_at)
									.toLocaleDateString("en-US", {
										month: "short",
										day: "numeric",
									})
									.toLowerCase()}
							</span>
							<br />
							{c.body}
						</p>
					</div>
				))
			)}
		</section>
	);
}
