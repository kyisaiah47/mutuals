"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/tumblr";
import { setSessionUser } from "@/lib/session";
import {
	getAccessToken,
	authedFetch,
	takePendingSignup,
	clearPendingSignup,
} from "@/lib/auth";

// magic-link landing: finish signup if one is pending, otherwise route home

export default function AuthCallback() {
	const router = useRouter();
	const [status, setStatus] = useState("logging you in…");
	const [failed, setFailed] = useState(false);

	useEffect(() => {
		(async () => {
			// supabase-js parses the link tokens from the URL; give it a moment
			let token: string | null = null;
			for (let i = 0; i < 10; i++) {
				token = await getAccessToken();
				if (token) break;
				await new Promise((r) => setTimeout(r, 500));
			}
			if (!token) {
				setFailed(true);
				return;
			}

			const pending = takePendingSignup();
			if (pending) {
				try {
					setStatus("checking your username…");
					const check = await fetch("/api/check-user-id", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ userId: pending.username }),
					}).then((r) => r.json());

					if (check.exists) {
						if (check.claimable) {
							setStatus("claiming your page…");
							const claimed = await authedFetch("/api/claim-account", {
								method: "POST",
								headers: { "Content-Type": "application/json" },
								body: JSON.stringify({ username: pending.username }),
							}).then((r) => r.json());
							if (claimed.success) {
								clearPendingSignup();
								setSessionUser(pending.username);
								return router.replace(`/u/${encodeURIComponent(pending.username)}`);
							}
						}
						clearPendingSignup();
						setFailed(true);
						setStatus("that username got taken — start again");
						return;
					}

					setStatus("expanding your taste…");
					const insights = (
						await fetch("/api/expand-tastes", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({ interests: pending.interests }),
						}).then((r) => r.json())
					).data || {};

					setStatus("building your page…");
					const save = await authedFetch("/api/save-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({
							userId: pending.username,
							interests: pending.interests,
							insights,
							contact: pending.contact || undefined,
							avatar: pending.avatarSeed || undefined,
						}),
					}).then((r) => r.json());
					if (!save.success) throw new Error("save failed");

					setStatus("writing your taste profile…");
					const prof = await fetch("/api/generate-profile", {
						method: "POST",
						headers: { "Content-Type": "application/json" },
						body: JSON.stringify({ interests: pending.interests, insights }),
					}).then((r) => r.json());
					if (prof.success && prof.data?.headline) {
						await authedFetch("/api/save-taste-profile", {
							method: "POST",
							headers: { "Content-Type": "application/json" },
							body: JSON.stringify({
								userId: pending.username,
								tasteProfile: prof.data,
							}),
						});
					}

					clearPendingSignup();
					setSessionUser(pending.username);
					return router.replace(`/u/${encodeURIComponent(pending.username)}`);
				} catch (e) {
					console.error(e);
					setFailed(true);
					setStatus("something broke finishing your page");
					return;
				}
			}

			// no pending signup — existing user or fresh visitor
			const who = await authedFetch("/api/whoami").then((r) => r.json());
			if (who.data?.username) {
				setSessionUser(who.data.username);
				return router.replace("/rooms");
			}
			return router.replace("/start");
		})();
	}, [router]);

	return (
		<div className="t-page flex flex-col items-center justify-center gap-5">
			<div className={failed ? "" : "anim-pulse-logo"}>
				<Logo size={56} />
			</div>
			<p className="text-white/85 text-[15px]">{status}</p>
			{failed && (
				<p className="text-white/70 text-[14px]">
					<Link href="/login" className="underline hover:text-white">
						try logging in again
					</Link>
					{" · "}
					<Link href="/start" className="underline hover:text-white">
						start over
					</Link>
				</p>
			)}
		</div>
	);
}
