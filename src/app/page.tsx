"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { TopNav, PostCard } from "@/components/tumblr";
import { getSessionUser } from "@/lib/session";

export default function Landing() {
	const [user, setUser] = useState<string | null>(null);
	useEffect(() => setUser(getSessionUser()), []);

	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[540px] mx-auto px-4 pt-12 pb-20">
				<div className="text-center mb-10">
					<h1 className="text-[34px] font-extrabold tracking-tight text-white">
						mutuals
					</h1>
					<p className="text-white/80 text-[17px] mt-1">
						find people who love what you love
					</p>
					{user ? (
						<>
							<p className="text-white/75 text-[14px] mt-3 leading-relaxed max-w-[420px] mx-auto">
								welcome back, {user}.
							</p>
							<div className="mt-6 flex items-center justify-center gap-3">
								<Link
									href="/discover"
									className="bg-taccent text-white font-bold text-[14px] px-5 py-2.5 rounded hover:opacity-90"
								>
									discover people
								</Link>
								<Link
									href={`/u/${encodeURIComponent(user)}`}
									className="text-white/80 text-[14px] px-4 py-2.5 underline hover:text-white"
								>
									my page
								</Link>
							</div>
						</>
					) : (
						<>
							<p className="text-white/75 text-[14px] mt-3 leading-relaxed max-w-[420px] mx-auto">
								tell us 8–10 things you&apos;re into. we build your taste page
								and find the people whose taste actually overlaps with yours.
								no photos, no bios — just taste.
							</p>
							<div className="mt-6 flex items-center justify-center gap-3">
								<Link
									href="/start"
									className="bg-taccent text-white font-bold text-[14px] px-5 py-2.5 rounded hover:opacity-90"
								>
									make your page
								</Link>
								<Link
									href="/login"
									className="text-white/70 text-[14px] px-4 py-2.5 hover:text-white"
								>
									log in
								</Link>
							</div>
						</>
					)}
				</div>

				{/* sample post — show, don't tell */}
				<p className="text-white/70 text-[12px] text-center mb-3 uppercase tracking-wider">
					your page ends up looking like this
				</p>
				<PostCard
					author="isaiah"
					label="taste profile"
					footer={
						<>
							<span>♥ 412 notes</span>
							<span>23 mutuals</span>
						</>
					}
				>
					<p className="text-[15px] leading-relaxed">
						You&apos;re drawn to stories that fold back on themselves and
						soundtracks that blur the line between beauty and unease. You
						don&apos;t just consume art — you interrogate it.
					</p>
					<p className="text-[13px] mt-3.5 text-tmuted">
						#obsessively-pattern-seeking #emotionally-cerebral
						#aesthetically-driven
					</p>
				</PostCard>

				<PostCard author="isaiah" label="things i love">
					<p className="text-[15px] leading-relaxed mb-2">
						<strong>music:</strong>{" "}
						<span className="text-tlink">Radiohead, Portishead, Björk</span>
					</p>
					<p className="text-[15px] leading-relaxed mb-2">
						<strong>movies:</strong>{" "}
						<span className="text-tlink">Inception, Memento, Primer</span>
					</p>
					<p className="text-[15px] leading-relaxed">
						<strong>books:</strong>{" "}
						<span className="text-tlink">House of Leaves, Borges</span>
					</p>
				</PostCard>

				<div className="text-center mt-8">
					<Link
						href="/start"
						className="text-white/70 text-[14px] underline hover:text-white"
					>
						get yours → takes about a minute
					</Link>
				</div>
			</main>
		</div>
	);
}
