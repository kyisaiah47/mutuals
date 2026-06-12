"use client";

import { getSupabase } from "./supabase";
import { clearSession } from "./session";

// google oauth: one tap, session out. /auth handles the return trip;
// usernames are page handles, not logins.

export async function signInWithGoogle() {
	await getSupabase().auth.signInWithOAuth({
		provider: "google",
		options: { redirectTo: `${window.location.origin}/auth` },
	});
}

export async function signOutAccount() {
	await getSupabase().auth.signOut();
	clearSession();
}

export async function getAccessToken(): Promise<string | null> {
	const { data } = await getSupabase().auth.getSession();
	return data.session?.access_token || null;
}

export async function hasSession(): Promise<boolean> {
	return !!(await getAccessToken());
}

export async function authedFetch(url: string, options: RequestInit = {}) {
	const token = await getAccessToken();
	return fetch(url, {
		...options,
		headers: {
			...(options.headers || {}),
			...(token ? { Authorization: `Bearer ${token}` } : {}),
		},
	});
}

// wizard state survives the trip to the inbox and back
const PENDING_KEY = "mutuals_pending_signup";

export interface PendingSignup {
	username: string;
	interests: Record<string, string[]>;
	contact?: string;
	avatarSeed?: string;
}

export function stashPendingSignup(p: PendingSignup) {
	localStorage.setItem(PENDING_KEY, JSON.stringify(p));
}

export function takePendingSignup(): PendingSignup | null {
	const raw = localStorage.getItem(PENDING_KEY);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as PendingSignup;
	} catch {
		return null;
	}
}

export function clearPendingSignup() {
	localStorage.removeItem(PENDING_KEY);
}
