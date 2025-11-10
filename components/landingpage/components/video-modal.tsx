"use client";

import { useEffect, useState } from "react";
import { FaPlay } from "react-icons/fa6";
import ReactPlayer from "react-player";
import { Dialog, DialogContent, DialogTrigger } from "@/components/ui/dialog";

export function VideoModal() {
	const [isMobile, setIsMobile] = useState(false);

	useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);
	return (
		<Dialog>
			<DialogTrigger asChild>
				<div className="flex h-16 w-16 items-center justify-center rounded-full bg-black/50 backdrop-blur-sm md:h-32 md:w-32">
					<FaPlay className="h-6 w-6 text-white md:h-10 md:w-10" />
				</div>
			</DialogTrigger>
			<DialogContent className="h-[50vh] w-[90vw] max-w-none border-none md:h-[90vh] md:w-[90vw]">
				<ReactPlayer
					controls // Don't talk about it.
					height={isMobile ? "100%" : "100%"}
					style={{
						margin: "auto",
					}}
					url="https://www.youtube.com/watch?v=dC1yHLp9bWA"
					width="90%"
				/>
			</DialogContent>
		</Dialog>
	);
}
