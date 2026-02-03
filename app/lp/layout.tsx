import type { Metadata } from "next"; // Rebuild trigger
import { Instrument_Serif, Inter, Space_Grotesk } from "next/font/google";
import "./lp.css";

const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const instrumentSerif = Instrument_Serif({
	variable: "--font-instrument-serif",
	weight: "400",
	subsets: ["latin"],
});

const spaceGrotesk = Space_Grotesk({
	variable: "--font-space-grotesk",
	subsets: ["latin"],
});

export const metadata: Metadata = {
	title: "MIC - Structured Data Overview",
	description:
		"Synthesizing real-estate debt markets with algorithmic precision.",
};

// import { ThemeProvider } from "./components/theme-provider";

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${inter.variable} ${instrumentSerif.variable} ${spaceGrotesk.variable} antialiased`}
			>
				{/* <ThemeProvider
					attribute="class"
					defaultTheme="system"
					disableTransitionOnChange
					enableSystem
				> */}
				{children}
				{/* </ThemeProvider> */}
			</body>
		</html>
	);
}
