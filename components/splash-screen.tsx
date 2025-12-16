import Image from "next/image";

export function SplashScreen() {
	return (
		<div className="flex h-screen w-screen flex-col items-center justify-center bg-background">
			<div className="relative flex flex-col items-center">
				<div className="animate-pulse">
					<Image
						alt="FairLend Logo"
						className="h-auto w-48 object-contain md:w-64"
						height={120}
						priority
						src="/logo.png"
						width={400}
					/>
				</div>
				{/* Optional: Add a spinner or loading text if desired, but a clean logo pulse is often more "premium" */}
				{/* <div className="mt-8 h-1 w-32 overflow-hidden rounded-full bg-muted">
                    <div className="h-full w-full animate-progress origin-left bg-emerald-500" />
                </div> */}
			</div>
		</div>
	);
}
