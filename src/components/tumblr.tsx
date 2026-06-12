"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { getSessionUser, clearSession } from "@/lib/session";

export function Logo({ size = 22, fill = "#fff" }: { size?: number; fill?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 50 50" fill="none" aria-hidden>
			<path
				d="M24.7 0C11.1 0 0 11.1 0 24.7C0 38.3 11.1 49.4 24.7 49.4C38.3 49.4 49.4 38.3 49.4 24.7C49.4 11.1 38.3 0 24.7 0ZM6.9 24.7C6.9 19.6 9.1 14.9 12.6 11.7C14 10.4 16.4 10.8 17.4 12.5L23.6 23.2C24.2 24.2 24.2 25.4 23.6 26.4L17.4 37.1C16.4 38.9 14 39.2 12.5 37.8C9.1 34.4 6.9 29.8 6.9 24.7ZM32 36.9L25.8 26.2C25.2 25.2 25.2 24 25.8 23L32 12.3C33 10.6 35.3 10.2 36.8 11.5C40.3 14.7 42.5 19.4 42.5 24.5C42.5 29.6 40.3 34.3 36.8 37.5C35.3 39.1 33 38.7 32 36.9Z"
				fill={fill}
			/>
		</svg>
	);
}

export function TopNav() {
	const [user, setUser] = useState<string | null>(null);
	useEffect(() => setUser(getSessionUser()), []);

	return (
		<div className="sticky top-0 z-20 bg-tnavy border-b border-white/15">
			<div className="max-w-[625px] mx-auto px-4 py-2.5 flex items-center justify-between">
				<Link href="/" className="flex items-center gap-2">
					<Logo />
					<span className="font-extrabold text-[22px] tracking-tight text-white">
						mutuals
					</span>
				</Link>
				<div className="flex items-center gap-5 text-[13px]">
					<Link href="/discover" className="text-white/85 hover:text-white">
						discover
					</Link>
					{user ? (
						<>
							<Link href={`/u/${user}`} className="text-white/85 hover:text-white">
								my page
							</Link>
							<button
								onClick={() => {
									clearSession();
									window.location.href = "/";
								}}
								className="text-white/80 hover:text-white"
							>
								log out
							</button>
						</>
					) : (
						<>
							<Link href="/login" className="text-white/85 hover:text-white">
								log in
							</Link>
							<Link
								href="/start"
								className="bg-white text-tnavy font-bold px-3 py-1.5 rounded hover:opacity-90"
							>
								make your page
							</Link>
						</>
					)}
				</div>
			</div>
		</div>
	);
}

export function PostCard({
	author,
	label,
	footer,
	children,
}: {
	author?: string;
	label?: string;
	footer?: React.ReactNode;
	children: React.ReactNode;
}) {
	return (
		<article className="bg-tcard text-tink rounded mb-6">
			<div className="px-5 py-4">
				{(author || label) && (
					<p className="text-[13px] text-tmuted mb-2.5">
						{author && <strong className="text-tink">{author}</strong>}
						{author && label && " · "}
						{label}
					</p>
				)}
				{children}
			</div>
			{footer && (
				<div className="border-t border-tline px-5 py-2.5 text-[13px] text-tmuted flex justify-between">
					{footer}
				</div>
			)}
		</article>
	);
}


export function Spinner({ label }: { label?: string }) {
	return (
		<span className="inline-flex items-center gap-2 text-tmuted text-[13px]">
			<span className="w-3.5 h-3.5 border-2 border-taccent border-t-transparent rounded-full animate-spin inline-block" />
			{label}
		</span>
	);
}
