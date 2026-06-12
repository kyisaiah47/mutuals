"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav, Spinner } from "@/components/tumblr";
import { Avatar } from "@/components/avatar";
import { getSessionUser } from "@/lib/session";
import { fetchActivity, markSeen, ActivityItem } from "@/lib/activity";

function timeAgo(iso: string) {
	const s = (Date.now() - new Date(iso).getTime()) / 1000;
	if (s < 60) return "now";
	if (s < 3600) return `${Math.floor(s / 60)}m`;
	if (s < 86400) return `${Math.floor(s / 3600)}h`;
	return `${Math.floor(s / 86400)}d`;
}

function line(i: ActivityItem) {
	switch (i.type) {
		case "wave":
			return "waved at you — wave back to unlock contact";
		case "comment":
			return `commented on ${i.threadTitle ? `"${i.threadTitle}"` : "your thread"}`;
		case "heart":
			return `loved ${i.threadTitle ? `"${i.threadTitle}"` : "your thread"}`;
		case "note":
			return "left a note on your page";
	}
}

export default function ActivityPage() {
	const router = useRouter();
	const [me, setMe] = useState<string | null>(null);
	const [items, setItems] = useState<ActivityItem[] | null>(null);

	useEffect(() => {
		const u = getSessionUser();
		if (!u) {
			router.replace("/login");
			return;
		}
		setMe(u);
		fetchActivity().then((data) => {
			setItems(data);
			markSeen();
		});
	}, [router]);

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[560px] mx-auto px-4 pt-10 pb-20">
				<h1 className="text-center text-white text-[26px] font-extrabold mb-1">
					activity
				</h1>
				<p className="text-center text-white/70 text-[14px] mb-10">
					what happened while you were gone
				</p>

				{items === null ? (
					<div className="text-center pt-8">
						<Spinner label="catching you up…" />
					</div>
				) : items.length === 0 ? (
					<p className="text-center text-white/60 text-[14px] py-10">
						nothing yet — drop some takes, wave at people, it&apos;ll fill up.
					</p>
				) : (
					<div>
						{items.map((i, idx) => {
							const href =
								i.type === "wave"
									? `/u/${encodeURIComponent(i.actor)}`
									: i.type === "note"
									? me
										? `/u/${encodeURIComponent(me)}`
										: "#"
									: `/rooms?thread=${i.threadId}`;
							return (
								<Link
									key={idx}
									href={href}
									className="flex gap-3 items-start px-3 py-3.5 border-b border-white/10 hover:bg-white/5 rounded-lg"
								>
									<Avatar
										seed={i.actorAvatar}
										emoji={i.actorEmoji}
										size={38}
										className="rounded-full shrink-0"
									/>
									<div className="min-w-0 flex-1">
										<p className="text-[14px] leading-snug">
											<span className="font-bold">{i.actor}</span>{" "}
											<span className="text-white/85">{line(i)}</span>
										</p>
										{i.text && (
											<p className="text-[13px] text-white/70 mt-1 line-clamp-2">
												“{i.text}”
											</p>
										)}
									</div>
									<span className="text-white/50 text-[12px] shrink-0">
										{timeAgo(i.createdAt)}
									</span>
								</Link>
							);
						})}
					</div>
				)}
			</main>
		</div>
	);
}
