"use client";

import { getSupabase } from "./supabase";
import { setSessionUser, clearSession } from "./session";

// usernames are the identity; auth runs on synthetic emails under the hood
export const synthEmail = (username: string) =>
	`${username.toLowerCase()}@m.mutuals.app`;

export async function signUpAccount(username: string, password: string) {
	const { data, error } = await getSupabase().auth.signUp({
		email: synthEmail(username),
		password,
	});
	if (error || !data.user) {
		return { ok: false as const, error: error?.message || "signup failed" };
	}
	return { ok: true as const, authId: data.user.id };
}

export async function signInAccount(username: string, password: string) {
	const { data, error } = await getSupabase().auth.signInWithPassword({
		email: synthEmail(username),
		password,
	});
	if (error || !data.user) {
		return { ok: false as const, error: error?.message || "login failed" };
	}
	setSessionUser(username);
	return { ok: true as const };
}

export async function signOutAccount() {
	await getSupabase().auth.signOut();
	clearSession();
}

export async function getAccessToken(): Promise<string | null> {
	const { data } = await getSupabase().auth.getSession();
	return data.session?.access_token || null;
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
