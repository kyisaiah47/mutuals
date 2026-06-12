"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav, Logo } from "@/components/tumblr";
import { CHIP_COLORS, chipStyle } from "@/lib/chips";
import { Avatar } from "@/components/avatar";
import { setSessionUser } from "@/lib/session";
import { authedFetch, hasSession, signInWithGoogle, stashPendingSignup } from "@/lib/auth";

const randSeed = () => Math.random().toString(36).slice(2, 10);

type Interests = Record<string, string[]>;

const CATEGORY_LABELS: Record<string, string> = {
	artist: "music",
	album: "albums",
	book: "books",
	movie: "movies",
	tv_show: "television",
	destination: "places",
	place: "places",
	brand: "brands",
	videogame: "games",
	podcast: "podcasts",
	actor: "people",
	director: "people",
	author: "people",
	person: "people",
	locality: "places",
	tag: "vibes",
};

function encouragement(n: number) {
	if (n === 0) return "type something and hit enter ↵";
	if (n === 1) return "good start — what else?";
	if (n <= 3) return "now we're talking";
	if (n <= 5) return "ok, your page is going to be good";
	if (n <= 7) return "almost there — a couple more";
	return "perfect. add more, or hit next →";
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
			<p key={i} className="anim-fadeup text-white/75 text-[15px]">
				{messages[i]}
			</p>
		</div>
	);
}

export default function Start() {
	const router = useRouter();
	const [step, setStep] = useState<"add" | "confirm" | "claim">("add");
	const [things, setThings] = useState<string[]>([]);
	const [input, setInput] = useState("");
	const [interests, setInterests] = useState<Interests>({});
	const [username, setUsername] = useState("");
	const [contact, setContact] = useState("");
	const [error, setError] = useState("");
	const [loadingMsgs, setLoadingMsgs] = useState<string[] | null>(null);
	const [suggesting, setSuggesting] = useState(false);
	const [avatarSeeds, setAvatarSeeds] = useState<string[]>([]);
	const [avatarSeed, setAvatarSeed] = useState<string | null>(null);
	const inputRef = useRef<HTMLInputElement>(null);

	// seeds are random — generate after mount to avoid hydration mismatch
	useEffect(() => {
		const seeds = Array.from({ length: 16 }, randSeed);
		setAvatarSeeds(seeds);
		setAvatarSeed(seeds[0]);
	}, []);

	const shuffleAvatars = () => {
		const seeds = Array.from({ length: 16 }, randSeed);
		setAvatarSeeds(seeds);
		setAvatarSeed(seeds[0]);
	};

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

	const categorize = async () => {
		const all = [...things, ...(input.trim() ? [input.trim()] : [])];
		if (all.length < 3) {
			return setError("give us at least 3 — 8 or more works best");
		}
		setLoadingMsgs([
			"reading your taste…",
			"connecting the threads…",
			"sorting your loves…",
		]);
		try {
			const res = await fetch("/api/categorize-interests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text: all.join(", ") }),
			});
			const json = await res.json();
			if (json.success && Object.keys(json.data).length > 0) {
				setInterests(json.data);
				setStep("confirm");
			} else {
				setError("couldn't make sense of that — try naming specific things");
			}
		} catch {
			setError("something broke, try again");
		} finally {
			setLoadingMsgs(null);
		}
	};

	const removeItem = (cat: string, item: string) => {
		setInterests((prev) => {
			const next = { ...prev, [cat]: prev[cat].filter((i) => i !== item) };
			if (next[cat].length === 0) delete next[cat];
			return next;
		});
	};

	const suggestUsername = async () => {
		setSuggesting(true);
		try {
			const interestsText = Object.entries(interests)
				.map(([c, items]) => `${c}: ${items.join(", ")}`)
				.join("\n");
			const res = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					interests,
					generateUsernameOnly: true,
					prompt: `Based on these interests, generate one creative lowercase username, 6-15 chars, letters/numbers/underscores only. Respond with ONLY the username.\n\n${interestsText}`,
				}),
			});
			const json = await res.json();
			if (json.success && typeof json.data === "string" && json.data) {
				setUsername(json.data.toLowerCase());
			}
		} finally {
			setSuggesting(false);
		}
	};

	const create = async () => {
		const u = username.trim().toLowerCase();
		if (!/^[a-z0-9_]{3,20}$/.test(u)) {
			return setError("username: 3–20 chars, letters/numbers/underscores");
		}
		setError("");

		const loggedIn = await hasSession();
		if (!loggedIn) {
			// no session yet: stash the wizard and bounce through google
			const check = await fetch("/api/check-user-id", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: u }),
			}).then((r) => r.json());
			if (check.exists && !check.claimable) {
				return setError("that username is taken — pick another");
			}
			stashPendingSignup({
				username: u,
				interests,
				contact: contact.trim() || undefined,
				avatarSeed: avatarSeed || undefined,
			});
			await signInWithGoogle();
			return;
		}

		setLoadingMsgs([
			"checking the name…",
			"expanding your taste…",
			"writing your taste profile…",
			"building your page…",
		]);
		try {
			const checkRes = await fetch("/api/check-user-id", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: u }),
			});
			if ((await checkRes.json()).exists) {
				setLoadingMsgs(null);
				return setError("that username is taken — pick another or log in");
			}

			const expandRes = await fetch("/api/expand-tastes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ interests }),
			});
			const insights = (await expandRes.json()).data || {};

			const saveRes = await authedFetch("/api/save-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({
					userId: u,
					interests,
					insights,
					contact: contact.trim() || undefined,
					avatar: avatarSeed || undefined,
				}),
			});
			if (!(await saveRes.json()).success) throw new Error("save failed");

			const profRes = await fetch("/api/generate-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ interests, insights }),
			});
			const prof = await profRes.json();
			if (prof.success && prof.data?.headline) {
				await authedFetch("/api/save-taste-profile", {
					method: "POST",
					headers: { "Content-Type": "application/json" },
					body: JSON.stringify({ userId: u, tasteProfile: prof.data }),
				});
			}

			setSessionUser(u);
			router.push(`/u/${encodeURIComponent(u)}`);
		} catch (e) {
			console.error(e);
			setLoadingMsgs(null);
			setError("something broke while creating your page — try again");
		}
	};

	const count = things.length;

	return (
		<div className="t-page">
			<TopNav />
			{loadingMsgs && <LoadingOverlay messages={loadingMsgs} />}
			<main className="max-w-[640px] mx-auto px-4 pt-14 pb-24">
				{step === "add" && (
					<div className="anim-fadeup">
						<p className="text-center text-white/70 text-[13px] font-bold tracking-widest uppercase mb-2">
							step 1 of 3
						</p>
						<h1 className="text-center text-white text-[32px] font-extrabold mb-2">
							what do you love?
						</h1>
						<p className="text-center text-white/80 text-[15px] mb-10">
							bands, films, books, games, shows, places — one at a time, hit
							enter after each.
						</p>

						{/* big input */}
						<div className="border-b-2 border-white/25 focus-within:border-white/70 transition-colors mb-3">
							<input
								ref={inputRef}
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
								placeholder={count === 0 ? "radiohead" : "what else?"}
								className="w-full bg-transparent text-white text-[26px] text-center py-3 outline-none placeholder:text-white/35"
								autoFocus
							/>
						</div>

						{/* progress + encouragement */}
						<div className="flex items-center justify-center gap-1.5 mb-2">
							{Array.from({ length: 8 }).map((_, i) => (
								<span
									key={i}
									className="w-2 h-2 rounded-full transition-all duration-300"
									style={{
										background:
											i < count ? CHIP_COLORS[i % CHIP_COLORS.length] : "rgba(255,255,255,.15)",
										transform: i < count ? "scale(1.15)" : "scale(1)",
									}}
								/>
							))}
						</div>
						<p className="text-center text-white/75 text-[13px] mb-8">
							{encouragement(count)}
						</p>

						{/* the pile */}
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
							<p className="text-center text-[#ff7a70] text-[13px] mb-4">{error}</p>
						)}
						{count >= 3 && (
							<div className="text-center anim-fadeup">
								<button
									onClick={categorize}
									className="bg-taccent text-tnavy font-bold text-[16px] px-10 py-3 rounded-full hover:opacity-90"
								>
									next →
								</button>
							</div>
						)}
					</div>
				)}

				{step === "confirm" && (
					<div className="anim-fadeup">
						<p className="text-center text-white/70 text-[13px] font-bold tracking-widest uppercase mb-2">
							step 2 of 3
						</p>
						<h1 className="text-center text-white text-[32px] font-extrabold mb-2">
							here&apos;s what we got
						</h1>
						<p className="text-center text-white/80 text-[15px] mb-10">
							click anything that&apos;s wrong to remove it ·{" "}
							<button
								onClick={() => setStep("add")}
								className="text-white/80 underline hover:text-white"
							>
								← go back
							</button>
						</p>

						<div className="space-y-7 mb-12">
							{Object.entries(interests).map(([cat, items], gi) => (
								<div
									key={cat}
									className="anim-fadeup"
									style={{ animationDelay: `${gi * 0.1}s` }}
								>
									<p className="text-center text-white/70 text-[12px] uppercase tracking-widest mb-3">
										{CATEGORY_LABELS[cat] || cat}
									</p>
									<div className="flex flex-wrap justify-center gap-2.5">
										{items.map((it, i) => (
											<button
												key={it}
												onClick={() => removeItem(cat, it)}
												title="remove"
												className="anim-chip text-[#1a1a1a] font-bold text-[15px] px-3.5 py-1.5 rounded-full hover:opacity-80"
												style={chipStyle(gi * 3 + i)}
											>
												{it} <span className="opacity-50 font-normal">×</span>
											</button>
										))}
									</div>
								</div>
							))}
						</div>

						<div className="text-center">
							<button
								onClick={() => setStep("claim")}
								className="bg-taccent text-tnavy font-bold text-[16px] px-10 py-3 rounded-full hover:opacity-90"
							>
								looks right →
							</button>
						</div>
					</div>
				)}

				{step === "claim" && (
					<div className="anim-fadeup max-w-[480px] mx-auto">
						<p className="text-center text-white/70 text-[13px] font-bold tracking-widest uppercase mb-2">
							step 3 of 3
						</p>
						<h1 className="text-center text-white text-[32px] font-extrabold mb-2">
							claim your page
						</h1>
						<p className="text-center text-white/80 text-[15px] mb-10">
							this is your corner of the internet now
						</p>

						<div className="flex items-baseline justify-center gap-0 border-b-2 border-white/25 focus-within:border-white/70 transition-colors mb-3">
							<span className="text-white/80 text-[22px]">mutuals/u/</span>
							<input
								value={username}
								onChange={(e) => {
									setUsername(e.target.value.toLowerCase());
									setError("");
								}}
								onKeyDown={(e) => e.key === "Enter" && create()}
								placeholder="yourname"
								className="bg-transparent text-white text-[22px] py-3 outline-none placeholder:text-white/35 min-w-0 flex-1"
								autoFocus
							/>
							<button
								onClick={suggestUsername}
								disabled={suggesting}
								title="suggest one from your taste"
								className="text-white/80 text-[14px] hover:text-white disabled:opacity-50 shrink-0"
							>
								{suggesting ? "…" : "suggest"}
							</button>
						</div>

	
						<div className="mt-10">
							<div className="flex items-center justify-between mb-3">
								<span className="text-white/70 text-[13px]">
									pick your face
								</span>
								<button
									onClick={shuffleAvatars}
									className="text-white/80 text-[13px] underline hover:text-white"
								>
									shuffle
								</button>
							</div>
							<div className="grid grid-cols-8 max-sm:grid-cols-4 gap-2">
								{avatarSeeds.map((s) => (
									<button
										key={s}
										onClick={() => setAvatarSeed(s)}
										className={`rounded-md overflow-hidden transition-transform hover:scale-105 ${
											avatarSeed === s
												? "ring-[3px] ring-white scale-105"
												: "opacity-80 hover:opacity-100"
										}`}
									>
										<Avatar seed={s} size={52} className="w-full h-auto" />
									</button>
								))}
							</div>
						</div>

						<label className="block text-white/70 text-[13px] mt-8 mb-1.5">
							contact (optional) — only revealed to mutual waves
						</label>
						<input
							value={contact}
							onChange={(e) => setContact(e.target.value)}
							placeholder="email, IG, discord — whatever you want"
							className="w-full bg-transparent border-b-2 border-white/25 focus:border-white/70 transition-colors text-white text-[16px] py-2 outline-none placeholder:text-white/35"
						/>

						{error && (
							<p className="text-center text-[#ff7a70] text-[13px] mt-6">{error}</p>
						)}
						<div className="text-center mt-10">
							<button
								onClick={create}
								className="bg-taccent text-tnavy font-bold text-[16px] px-10 py-3 rounded-full hover:opacity-90"
							>
								make my page with google
							</button>
							<p className="text-white/60 text-[12px] mt-3">
								you&apos;ll tap through google real quick — everything here is saved
							</p>
							<p className="mt-4">
								<button
									onClick={() => setStep("confirm")}
									className="text-white/70 text-[13px] hover:text-white"
								>
									← back
								</button>
							</p>
						</div>
					</div>
				)}
			</main>
		</div>
	);
}
