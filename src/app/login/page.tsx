"use client";

import Link from "next/link";
import { TopNav } from "@/components/tumblr";
import { signInWithGoogle } from "@/lib/auth";

function GoogleMark() {
	return (
		<svg width="20" height="20" viewBox="0 0 24 24" aria-hidden>
			<path
				fill="#4285F4"
				d="M23.5 12.27c0-.85-.08-1.66-.22-2.45H12v4.64h6.45a5.52 5.52 0 0 1-2.39 3.62v3h3.87c2.26-2.09 3.57-5.16 3.57-8.81z"
			/>
			<path
				fill="#34A853"
				d="M12 24c3.24 0 5.96-1.07 7.93-2.91l-3.87-3c-1.07.72-2.45 1.15-4.06 1.15-3.13 0-5.78-2.11-6.73-4.96H1.29v3.1A12 12 0 0 0 12 24z"
			/>
			<path
				fill="#FBBC05"
				d="M5.27 14.28A7.2 7.2 0 0 1 4.89 12c0-.79.14-1.56.38-2.28v-3.1H1.29a12 12 0 0 0 0 10.76l3.98-3.1z"
			/>
			<path
				fill="#EA4335"
				d="M12 4.77c1.76 0 3.35.61 4.6 1.8l3.43-3.44A11.97 11.97 0 0 0 12 0 12 12 0 0 0 1.29 6.62l3.98 3.1C6.22 6.88 8.87 4.77 12 4.77z"
			/>
		</svg>
	);
}

export default function Login() {
	return (
		<div className="t-page">
			<TopNav />
			<main className="max-w-[480px] mx-auto px-4 pt-24 pb-20 anim-fadeup text-center">
				<h1 className="text-white text-[32px] font-extrabold mb-2">
					welcome back
				</h1>
				<p className="text-white/80 text-[15px] mb-12">
					one tap, no passwords
				</p>

				<button
					onClick={() => signInWithGoogle()}
					className="inline-flex items-center gap-3 bg-white text-[#1a1a1a] font-bold text-[16px] px-8 py-3.5 rounded-full hover:opacity-90"
				>
					<GoogleMark />
					continue with google
				</button>

				<p className="text-[13px] text-white/70 mt-8">
					no page yet?{" "}
					<Link href="/start" className="text-white/80 underline hover:text-white">
						make one
					</Link>
				</p>
			</main>
		</div>
	);
}
