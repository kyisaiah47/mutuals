"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { TopNav, PostCard, Spinner } from "@/components/tumblr";
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
			<main className="max-w-[540px] mx-auto px-4 pt-12 pb-20">
				<h1 className="text-center text-white text-[22px] font-extrabold mb-6">
					welcome back
				</h1>
				<PostCard>
					<label className="text-[13px] text-tmuted block mb-1.5">
						your username
					</label>
					<input
						value={username}
						onChange={(e) => {
							setUsername(e.target.value);
							setError("");
						}}
						onKeyDown={(e) => e.key === "Enter" && !loading && login()}
						placeholder="the name on your page"
						className="w-full border border-tline rounded px-3 py-2 text-[15px] outline-none focus:border-taccent"
						autoFocus
					/>
					{error && <p className="text-red-500 text-[13px] mt-2">{error}</p>}
					<button
						onClick={login}
						disabled={loading}
						className="mt-4 w-full bg-taccent text-white font-bold text-[14px] py-2.5 rounded hover:opacity-90 disabled:opacity-50"
					>
						{loading ? <Spinner label="logging in…" /> : "log in"}
					</button>
					<p className="text-[13px] text-tmuted mt-4 text-center">
						no page yet?{" "}
						<Link href="/start" className="text-taccent hover:underline">
							make one
						</Link>
					</p>
				</PostCard>
			</main>
		</div>
	);
}
