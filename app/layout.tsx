import type { Metadata } from "next";
import {
	Fira_Code,
	Geist,
	Geist_Mono,
	Inter,
	JetBrains_Mono,
	Montserrat,
	Poppins,
	Roboto_Mono,
	Source_Serif_4,
} from "next/font/google";
import { ConvexClientProvider } from "@/components/ConvexClientProvider";
import "./globals.css";
import { VercelToolbar } from "@vercel/toolbar/next";
import { Suspense } from "react";
import { SplashScreen } from "@/components/splash-screen";
// import { PageSkeleton } from "@/components/skeletons"; // Removed or keep if used elsewhere (unlikely here)
import { ThemeProvider } from "@/components/theme-provider";
import { Toaster } from "@/components/ui/sonner";

const geistSans = Geist({
	variable: "--font-geist-sans",
	subsets: ["latin"],
});

const geistMono = Geist_Mono({
	variable: "--font-geist-mono",
	subsets: ["latin"],
});

// Load fonts for theme support (Inter, Source Serif 4, JetBrains Mono)
const inter = Inter({
	variable: "--font-inter",
	subsets: ["latin"],
});

const sourceSerif4 = Source_Serif_4({
	variable: "--font-source-serif-4",
	subsets: ["latin"],
});

const jetbrainsMono = JetBrains_Mono({
	variable: "--font-jetbrains-mono",
	subsets: ["latin"],
});

// Load fonts for theme support (Poppins, Roboto Mono)
const poppins = Poppins({
	variable: "--font-poppins",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
});

const robotoMono = Roboto_Mono({
	variable: "--font-roboto-mono",
	subsets: ["latin"],
});

// Load fonts for theme support (Montserrat, Fira Code)
const montserrat = Montserrat({
	variable: "--font-montserrat",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

const firaCode = Fira_Code({
	variable: "--font-fira-code",
	subsets: ["latin"],
	weight: ["300", "400", "500", "600", "700"],
	display: "swap",
});

export const metadata: Metadata = {
	title: "Fairlend",
	description: "Fairlend: Smarter Mortgage Investing.",
	icons: {
		icon: "/favicon.ico",
	},
};

export default function RootLayout({
	children,
}: Readonly<{
	children: React.ReactNode;
}>) {
	return (
		<html lang="en" suppressHydrationWarning>
			<body
				className={`${geistSans.variable} ${geistMono.variable} ${inter.variable} ${sourceSerif4.variable} ${jetbrainsMono.variable} ${poppins.variable} ${robotoMono.variable} ${montserrat.variable} ${firaCode.variable} antialiased`}
			>
				<Suspense fallback={<SplashScreen />}>
					<ConvexClientProvider>
						<ThemeProvider>
							{/* <NavigationProvider> */}
							{process.env.NODE_ENV !== "production" && <VercelToolbar />}
							<div className="h-full w-full bg-background" id="main-content">
								{children}
							</div>
							<Toaster />
							{/* {enableToolbar ? <VercelToolbar /> : null} */}
							{/* </NavigationProvider> */}
						</ThemeProvider>
					</ConvexClientProvider>
				</Suspense>
			</body>
		</html>
	);
}
