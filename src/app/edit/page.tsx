"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { TopNav, PostCard, Spinner } from "@/components/tumblr";
import { getSessionUser } from "@/lib/session";

export default function EditPage() {
	const router = useRouter();
	const [me, setMe] = useState<string | null>(null);
	const [text, setText] = useState("");
	const [loaded, setLoaded] = useState(false);
	const [error, setError] = useState("");
	const [saving, setSaving] = useState<string | null>(null);

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
					setText(Object.values(interests).flat().join(", "));
				}
			} finally {
				setLoaded(true);
			}
		})();
	}, [router]);

	const save = async () => {
		if (!me) return;
		setError("");
		try {
			setSaving("reading your taste…");
			const catRes = await fetch("/api/categorize-interests", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ text }),
			});
			const cat = await catRes.json();
			if (!cat.success || Object.keys(cat.data).length === 0) {
				setSaving(null);
				return setError("couldn't make sense of that — name specific things");
			}

			setSaving("expanding your taste…");
			const expandRes = await fetch("/api/expand-tastes", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ interests: cat.data }),
			});
			const insights = (await expandRes.json()).data || {};

			setSaving("saving…");
			await fetch("/api/update-user-profile", {
				method: "POST",
				headers: { "Content-Type": "application/json" },
				body: JSON.stringify({ userId: me, interests: cat.data, insights }),
			});

			setSaving("rewriting your taste profile…");
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
			setSaving(null);
			setError("something broke — try again");
		}
	};

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[540px] mx-auto px-4 pt-12 pb-20">
				<h1 className="text-center text-white text-[22px] font-extrabold mb-1">
					edit your things
				</h1>
				<p className="text-center text-white/50 text-[14px] mb-6">
					add, remove, rewrite — we&apos;ll re-sort it and refresh your taste
					profile.
				</p>
				<PostCard>
					{!loaded ? (
						<Spinner label="loading your things…" />
					) : (
						<>
							<textarea
								value={text}
								onChange={(e) => {
									setText(e.target.value);
									setError("");
								}}
								className="w-full h-40 border border-tline rounded px-3 py-2.5 text-[15px] leading-relaxed outline-none focus:border-taccent resize-none"
							/>
							{error && (
								<p className="text-red-500 text-[13px] mt-2">{error}</p>
							)}
							<button
								onClick={save}
								disabled={!!saving}
								className="mt-3 w-full bg-taccent text-white font-bold text-[14px] py-2.5 rounded hover:opacity-90 disabled:opacity-50"
							>
								{saving ? <Spinner label={saving} /> : "save changes"}
							</button>
						</>
					)}
				</PostCard>
			</main>
		</div>
	);
}
