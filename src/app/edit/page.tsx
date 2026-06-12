"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav, Logo, Spinner } from "@/components/tumblr";
import { getSessionUser } from "@/lib/session";

const CHIP_COLORS = ["#9fef00", "#ffb02e", "#2dd4a8", "#b18cff", "#ff8fc1"];

function chipStyle(i: number): React.CSSProperties {
	const rot = ((i * 7919) % 7) - 3;
	return {
		background: CHIP_COLORS[i % CHIP_COLORS.length],
		["--rot" as string]: `${rot}deg`,
		animationDelay: `${(i % 5) * 0.08}s, ${0.25 + (i % 5) * 0.08}s`,
	};
}

function LoadingOverlay({ messages }: { messages: string[] }) {
	const [i, setI] = useState(0);
	useEffect(() => {
		const t = setInterval(() => setI((v) => (v + 1) % messages.length), 1800);
		return () => clearInterval(t);
	}, [messages.length]);
	return (
		<div className="fixed inset-0 z-50 bg-tnavy/95 flex flex-col items-center justify-center gap-5">
			<div className="anim-pulse-logo">
				<Logo size={56} />
			</div>
			<p key={i} className="anim-fadeup text-white/85 text-[15px]">
				{messages[i]}
			</p>
		</div>
	);
}

export default function EditPage() {
	const router = useRouter();
	const [me, setMe] = useState<string | null>(null);
	const [things, setThings] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState("");
	const [loadingMsgs, setLoadingMsgs] = useState<string[] | null>(null);

	useEffect(() => {
		const u = getSessionUser();
		if (!u) {
			router.replace("/login");
			return;
		}
		setMe(u);
		(async () => {
			try {
				const res = await fetch("/api/get-user-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: u }),
				});
				const json = await res.json();
				if (json.success) {
					const interests = (json.data.profile.interests || {}) as Record<
						string,
						string[]
					>;
					setThings(Object.values(interests).flat());
				}
			} finally {
				setLoaded(true);
			}
		})();
	}, [router]);

	const addThings = (raw: string) => {
		const parts = raw
			.split(/[,\n;]+/)
			.map((s) => s.trim())
			.filter(Boolean);
		if (parts.length === 0) return;
		setThings((prev) => [
			...prev,
			...parts.filter(
				(p) => !prev.some((x) => x.toLowerCase() === p.toLowerCase())
			),
		]);
		setInput("");
		setError("");
	};

	const removeThing = (t: string) =>
		setThings((prev) => prev.filter((x) => x !== t));

	const save = async () => {
		if (!me) return;
		const all = [...things, ...(input.trim() ? [input.trim()] : [])];
		if (all.length < 3) {
			return setError("keep at least 3 things on your page");
		}
		setError("");
		setLoadingMsgs([
			"re-sorting your loves…",
			"expanding your taste…",
			"rewriting your taste profile…",
		]);
		try {
			const catRes = await fetch("/api/categorize-interests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: all.join(", ") }),
			});
			const cat = await catRes.json();
			if (!cat.success || Object.keys(cat.data).length === 0) {
				setLoadingMsgs(null);
				return setError("couldn't make sense of that — name specific things");
			}

			const expandRes = await fetch("/api/expand-tastes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ interests: cat.data }),
			});
			const insights = (await expandRes.json()).data || {};

			await fetch("/api/update-user-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: me, interests: cat.data, insights }),
			});

			const profRes = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ interests: cat.data, insights }),
			});
			const prof = await profRes.json();
			if (prof.success && prof.data?.headline) {
				await fetch("/api/save-taste-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: me, tasteProfile: prof.data }),
				});
			}

			router.push(`/u/${encodeURIComponent(me)}`);
		} catch (e) {
			console.error(e);
			setLoadingMsgs(null);
			setError("something broke — try again");
		}
	};

	const count = things.length;

	return (
		<div className="t-page">
			<TopNav />
			{loadingMsgs && <LoadingOverlay messages={loadingMsgs} />}
			<main className="max-w-[640px] mx-auto px-4 pt-14 pb-24 anim-fadeup">
				<h1 className="text-center text-white text-[32px] font-extrabold mb-2">
					edit your things
				</h1>
				<p className="text-center text-white/80 text-[15px] mb-10">
					click a chip to remove it, type to add more — your taste profile
					gets rewritten when you save.
				</p>

				{!loaded ? (
					<div className="text-center pt-8">
						<Spinner label="loading your things…" />
					</div>
				) : (
					<>
						<div className="border-b-2 border-white/25 focus-within:border-white/70 transition-colors mb-8">
							<input
								value={input}
								onChange={(e) => {
									if (/[,;\n]/.test(e.target.value)) addThings(e.target.value);
									else setInput(e.target.value);
								}}
								onKeyDown={(e) => {
									if (e.key === "Enter") {
										e.preventDefault();
										addThings(input);
									} else if (e.key === "Backspace" && !input && count > 0) {
										removeThing(things[count - 1]);
									}
								}}
								placeholder="add something new…"
								className="w-full bg-transparent text-white text-[24px] text-center py-3 outline-none placeholder:text-white/35"
								autoFocus
							/>
						</div>

						<div className="flex flex-wrap justify-center gap-2.5 min-h-[120px] mb-10">
							{things.map((t, i) => (
								<button
									key={t}
									onClick={() => removeThing(t)}
									title="remove"
									className="anim-chip text-[#1a1a1a] font-bold text-[15px] px-3.5 py-1.5 rounded-full hover:opacity-80"
									style={chipStyle(i)}
								>
									{t} <span className="opacity-50 font-normal">×</span>
								</button>
							))}
						</div>

						{error && (
							<p className="text-center text-[#ff7a70] text-[13px] mb-4">
								{error}
							</p>
						)}
						<div className="text-center">
							<button
								onClick={save}
								className="bg-taccent text-white font-bold text-[16px] px-10 py-3 rounded-full hover:opacity-90"
							>
								save changes
							</button>
							<p className="mt-4">
								<button
									onClick={() =>
										me && router.push(`/u/${encodeURIComponent(me)}`)
									}
									className="text-white/70 text-[13px] hover:text-white"
								>
									← back to your page
								</button>
							</p>
						</div>
					</>
				)}
			</main>
		</div>
	);
}
