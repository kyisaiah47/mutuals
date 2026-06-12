"use client";

import { useMemo } from "react";
import { createAvatar } from "@dicebear/core";
import { openPeeps } from "@dicebear/collection";

export function avatarUri(seed: string, size: number): string {
	return createAvatar(openPeeps, {
		seed,
		size,
		backgroundColor: ["f0f2f5"],
	}).toDataUri();
}

export function Avatar({
	seed,
	emoji,
	size = 48,
	className = "",
}: {
	seed?: string | null;
	emoji?: string | null;
	size?: number;
	className?: string;
}) {
	const uri = useMemo(
		() => (seed ? avatarUri(seed, size * 2) : null),
		[seed, size]
	);

	if (uri) {
		return (
			// eslint-disable-next-line @next/next/no-img-element
			<img
				src={uri}
				alt=""
				width={size}
				height={size}
				className={`rounded-[3px] shrink-0 ${className}`}
			/>
		);
	}
	return (
		<span
			className={`bg-white/10 rounded-[3px] flex items-center justify-center shrink-0 ${className}`}
			style={{ width: size, height: size, fontSize: size / 2 }}
		>
			{emoji || "👤"}
		</span>
	);
}
