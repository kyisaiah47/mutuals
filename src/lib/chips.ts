export const CHIP_COLORS = ["#9fef00", "#ffb02e", "#2dd4a8", "#b18cff", "#ff8fc1"];

export function chipStyle(i: number): React.CSSProperties {
	const rot = ((i * 7919) % 7) - 3;
	return {
		background: CHIP_COLORS[i % CHIP_COLORS.length],
		["--rot" as string]: `${rot}deg`,
		animationDelay: `${(i % 8) * 0.05}s, ${0.25 + (i % 8) * 0.05}s`,
	};
}
