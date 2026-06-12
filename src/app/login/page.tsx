"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav, Spinner } from "@/components/tumblr";
import { setSessionUser } from "@/lib/session";

export default function Login() {
	const router = useRouter();
	const [username, setUsername] = useState("");
	const [error, setError] = useState("");
	const [loading, setLoading] = useState(false);

	const login = async () => {
		const u = username.trim();
		if (!u) return setError("enter your username");
		setLoading(true);
		setError("");
		try {
			const res = await fetch("/api/get-user-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: u }),
			});
			const json = await res.json();
			if (json.success) {
				setSessionUser(u);
				router.push(`/u/${encodeURIComponent(u)}`);
			} else {
				setError("no page with that username — check the spelling?");
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
					welcome back
				</h1>
				<p className="text-center text-white/80 text-[15px] mb-12">
					your page missed you
				</p>

				<div className="flex items-baseline justify-center border-b-2 border-white/25 focus-within:border-white/70 transition-colors mb-3">
					<span className="text-white/80 text-[22px]">mutuals/u/</span>
					<input
						value={username}
						onChange={(e) => {
							setUsername(e.target.value);
							setError("");
						}}
						onKeyDown={(e) => e.key === "Enter" && !loading && login()}
						placeholder="yourname"
						className="bg-transparent text-white text-[22px] py-3 outline-none placeholder:text-white/35 min-w-0 flex-1"
						autoFocus
					/>
				</div>
				{error && (
					<p className="text-center text-[#ff7a70] text-[13px] mt-4">{error}</p>
				)}

				<div className="text-center mt-10">
					<button
						onClick={login}
						disabled={loading}
						className="bg-white text-tnavy font-bold text-[16px] px-10 py-3 rounded-full hover:opacity-90 disabled:opacity-50"
					>
						{loading ? <Spinner label="logging in…" /> : "log in"}
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
