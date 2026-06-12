"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav, Spinner } from "@/components/tumblr";
import { setSessionUser } from "@/lib/session";
import { signInAccount, signUpAccount, authedFetch } from "@/lib/auth";

export default function Login() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);
	const [claimMode, setClaimMode] = useState(false);

	const go = (u: string) => router.push(`/u/${encodeURIComponent(u)}`);

	const login = async () => {
		const u = username.trim().toLowerCase();
		if (!u) return setError("enter your username");
		if (password.length < 8) return setError("password is at least 8 characters");
		setLoading(true);
		setError("");
		try {
			if (claimMode) {
				const signup = await signUpAccount(u, password);
				if (!signup.ok) {
					return setError("couldn't set a password — try a different one");
				}
				const res = await authedFetch("/api/claim-account", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ username: u }),
				}).then((r) => r.json());
				if (!res.success) {
					return setError("this page was already claimed — wrong password?");
				}
				setSessionUser(u);
				return go(u);
			}

			const result = await signInAccount(u, password);
			if (result.ok) return go(u);

			// no auth account — maybe a pre-auth page that can be claimed
			const prof = await fetch("/api/get-user-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: u }),
			}).then((r) => r.json());

			if (prof.success && !prof.data.profile.auth_id) {
				// page exists but was made before passwords — claimable
				setClaimMode(true);
				setError("");
			} else {
				setError("wrong username or password");
			}
		} catch {
			setError("something broke, try again");
		} finally {
			setLoading(false);
		}
	};

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[480px] mx-auto px-4 pt-24 pb-20 anim-fadeup">
				<h1 className="text-center text-white text-[32px] font-extrabold mb-2">
					{claimMode ? "claim your page" : "welcome back"}
				</h1>
				<p className="text-center text-white/80 text-[15px] mb-12">
					{claimMode
						? `${username} exists but has no password yet — set one now and it's yours forever`
						: "your page missed you"}
				</p>

				<div className="flex items-baseline justify-center border-b-2 border-white/25 focus-within:border-white/70 transition-colors mb-6">
					<span className="text-white/80 text-[22px]">mutuals/u/</span>
					<input
						value={username}
						onChange={(e) => {
							setUsername(e.target.value.toLowerCase());
							setError("");
							setClaimMode(false);
						}}
						placeholder="yourname"
						className="bg-transparent text-white text-[22px] py-3 outline-none placeholder:text-white/35 min-w-0 flex-1"
						autoFocus
					/>
				</div>

				<input
					type="password"
					value={password}
					onChange={(e) => {
						setPassword(e.target.value);
						setError("");
					}}
					onKeyDown={(e) => e.key === "Enter" && !loading && login()}
					placeholder={claimMode ? "choose a password (8+ chars)" : "password"}
					className="w-full bg-transparent border-b-2 border-white/25 focus:border-white/70 transition-colors text-white text-[18px] py-3 outline-none placeholder:text-white/35"
				/>

				{error && (
					<p className="text-center text-[#ff7a70] text-[13px] mt-5">{error}</p>
				)}

				<div className="text-center mt-10">
					<button
						onClick={login}
						disabled={loading}
						className="bg-white text-tnavy font-bold text-[16px] px-10 py-3 rounded-full hover:opacity-90 disabled:opacity-50"
					>
						{loading ? (
							<Spinner label={claimMode ? "claiming…" : "logging in…"} />
						) : claimMode ? (
							"claim it"
						) : (
							"log in"
						)}
					</button>
					<p className="text-[13px] text-white/70 mt-6">
						no page yet?{" "}
						<Link href="/start" className="text-white/80 underline hover:text-white">
							make one
						</Link>
					</p>
				</div>
			</main>
		</div>
	);
}
