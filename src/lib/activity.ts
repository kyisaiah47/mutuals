"use client";

import { useEffect, useState } from "react";
import { authedFetch } from "./auth";
import { getSessionUser } from "./session";

const SEEN_KEY = "mutuals_activity_seen";

export interface ActivityItem {
	type: "wave" | "comment" | "heart" | "note";
	actor: string;
	actorEmoji?: string;
	actorAvatar?: string;
	text?: string;
	threadId?: string;
	threadTitle?: string;
	room?: string;
	createdAt: string;
}

export function getSeenAt(): number {
	if (typeof window === "undefined") return Date.now();
	return Number(localStorage.getItem(SEEN_KEY) || 0);
}

export function markSeen() {
	localStorage.setItem(SEEN_KEY, String(Date.now()));
}

export async function fetchActivity(): Promise<ActivityItem[]> {
	const res = await authedFetch("/api/activity").then((r) => r.json());
	return res?.success ? res.data : [];
}

export function useActivityBadge() {
	const [unread, setUnread] = useState(0);
	useEffect(() => {
		if (!getSessionUser()) return;
		fetchActivity()
			.then((items) => {
				const seen = getSeenAt();
				setUnread(items.filter((i) => new Date(i.createdAt).getTime() > seen).length);
			})
			.catch(() => {});
	}, []);
	return unread;
}
