import type { Metadata } from "next";
import { Inter, Sora } from "next/font/google";
import "./globals.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const sora = Sora({
	variable: "--font-sora",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "Mutuals - find people who love what you love",
	description:
		"Tell us what you love and AI finds the people whose taste genuinely overlaps with yours",
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en">
			<body
				className={`${inter.variable} ${sora.variable} ${inter.className} antialiased`}
			>
				{children}
			</body>
		</html>
	);
}
