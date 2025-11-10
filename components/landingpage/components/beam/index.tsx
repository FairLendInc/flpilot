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
		if (showBeam) {
			const meteor = meteorRef.current;

			if (!meteor) return;

			meteor.addEventListener("animationend", () => {
				meteor.style.visibility = "hidden";
				const animationDelay = Math.floor(Math.random() * (2 - 0) + 0);
				const animationDuration = Math.floor(Math.random() * (4 - 0) + 0);
				const meteorWidth = Math.floor(Math.random() * (150 - 80) + 80);
				meteor.style.setProperty("--meteor-delay", `${animationDelay}s`);
				meteor.style.setProperty("--meteor-duration", `${animationDuration}s`);
				meteor.style.setProperty("--meteor-width", `${meteorWidth}px`);

				restartAnimation();
			});

			meteor.addEventListener("animationstart", () => {
				meteor.style.visibility = "visible";
			});
		}

		return () => {
			const meteor = meteorRef.current;
			if (!meteor) return;
			meteor.removeEventListener("animationend", () => {});
			meteor.removeEventListener("animationstart", () => {});
		};
	}, []);
	const restartAnimation = () => {
		const meteor = meteorRef.current;
		if (!meteor) return;
		meteor.style.animation = "none";
		void meteor.offsetWidth;
		meteor.style.animation = "";
	};
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
