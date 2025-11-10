"use client";
import { useEffect, useRef } from "react";
import { cn } from "@/lib/utils";
import styles from "./styles.module.css";

const Beam = ({
	showBeam = true,
	className,
}: {
	showBeam?: boolean;
	className?: string;
}) => {
	const meteorRef = useRef<HTMLSpanElement>(null);

	useEffect(() => {
		if (!showBeam) return;

		const meteor = meteorRef.current;
		if (!meteor) return;

		const restartAnimation = () => {
			const currentMeteor = meteorRef.current;
			if (!currentMeteor) return;
			currentMeteor.style.animation = "none";
			// Force reflow to restart animation
			// biome-ignore lint/nursery/noUnusedExpressions: Intentional property access to force reflow
			currentMeteor.offsetWidth;
			currentMeteor.style.animation = "";
		};

		const handleAnimationEnd = () => {
			meteor.style.visibility = "hidden";
			const animationDelay = Math.floor(Math.random() * (2 - 0) + 0);
			const animationDuration = Math.floor(Math.random() * (4 - 0) + 0);
			const meteorWidth = Math.floor(Math.random() * (150 - 80) + 80);
			meteor.style.setProperty("--meteor-delay", `${animationDelay}s`);
			meteor.style.setProperty("--meteor-duration", `${animationDuration}s`);
			meteor.style.setProperty("--meteor-width", `${meteorWidth}px`);

			restartAnimation();
		};

		const handleAnimationStart = () => {
			meteor.style.visibility = "visible";
		};

		meteor.addEventListener("animationend", handleAnimationEnd);
		meteor.addEventListener("animationstart", handleAnimationStart);

		return () => {
			const cleanupMeteor = meteorRef.current;
			if (!cleanupMeteor) return;
			cleanupMeteor.removeEventListener("animationend", handleAnimationEnd);
			cleanupMeteor.removeEventListener("animationstart", handleAnimationStart);
		};
	}, [showBeam]);
	return (
		showBeam && (
			<span
				className={cn(
					"-top-4 absolute z-[40] h-[0.1rem] w-[0.1rem] rotate-[180deg] rounded-[9999px] bg-blue-700 shadow-[0_0_0_1px_#ffffff10]",
					styles.meteor,
					className
				)}
				ref={meteorRef}
			/>
		)
	);
};

export default Beam;
