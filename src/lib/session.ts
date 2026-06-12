// Lightweight client-side "session" — username persisted in localStorage.
// Placeholder until real auth lands.

const KEY = "mutuals_user";

export function getSessionUser(): string | null {
	if (typeof window === "undefined") return null;
	return localStorage.getItem(KEY);
}

export function setSessionUser(username: string) {
	localStorage.setItem(KEY, username);
}

export function clearSession() {
	localStorage.removeItem(KEY);
}
