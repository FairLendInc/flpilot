"use client";

import { useEffect, useRef, useState } from "react";
import FaultyTerminal from "@/components/FaultyTerminal";
import { Problems } from "@/components/landingpage/components/problems";

export default function TerminalSection() {
	const [terminalVisible, setTerminalVisible] = useState(false);
	const [terminalAnimated, setTerminalAnimated] = useState(false);
	const [turnOff, setTurnOff] = useState(false);
	const [scrollProgress, setScrollProgress] = useState(0);
	const [isSticky, setIsSticky] = useState(false);
	const terminalSectionRef = useRef<HTMLDivElement>(null);
	const accumulatedScroll = useRef(0);
	const SCROLL_THRESHOLD = 900; // Amount of scroll needed to trigger turn-off

	useEffect(() => {
		const observer = new IntersectionObserver(
			([entry]) => {
				if (entry.isIntersecting && !terminalAnimated) {
					setTerminalVisible(true);
					setTerminalAnimated(true);
					setIsSticky(true);
				}
			},
			{ threshold: 0.8 }
		);

		if (terminalSectionRef.current) {
			observer.observe(terminalSectionRef.current);
		}

		return () => {
			if (terminalSectionRef.current) {
				observer.unobserve(terminalSectionRef.current);
			}
		};
	}, [terminalAnimated]);

	useEffect(() => {
		const handleScroll = (e: WheelEvent) => {
			if (!isSticky || turnOff) return;

			const scrollingDown = e.deltaY > 0;

			if (scrollingDown) {
				e.preventDefault();

				accumulatedScroll.current += e.deltaY;
				const progress = Math.min(
					accumulatedScroll.current / SCROLL_THRESHOLD,
					1
				);
				setScrollProgress(progress);

				if (progress >= 1) {
					setTurnOff(true);
					setIsSticky(false);
					// Allow natural scrolling to resume after animation
					setTimeout(() => {
						window.scrollBy({ top: 100, behavior: "smooth" });
					}, 600);
				}
			}
		};

		if (isSticky) {
			window.addEventListener("wheel", handleScroll, { passive: false });
		}

		return () => {
			window.removeEventListener("wheel", handleScroll);
		};
	}, [isSticky, turnOff]);

	return (
		<div
			className="relative"
			data-testid="terminal-section"
			ref={terminalSectionRef}
			style={{
				width: "100%",
				height: isSticky ? "200vh" : "100vh",
				minHeight: "100vh",
			}}
		>
			{isSticky && (
				<div
					className="fixed inset-0 z-40"
					style={{
						pointerEvents: turnOff ? "none" : "auto",
					}}
				/>
			)}
			<div className="pointer-events-none absolute z-50 h-full w-full">
				<Problems isVisible={terminalVisible} turnOff={turnOff} />
			</div>
			<div
				className={`h-full w-full transition-all ${isSticky ? "fixed inset-0" : "absolute"}`}
				style={{
					opacity: terminalVisible && !turnOff ? 1 : 0,
					animation: turnOff
						? "crtTurnOff 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards"
						: terminalVisible
							? "crtTurnOn 1.5s cubic-bezier(0.25, 0.46, 0.45, 0.94) forwards"
							: "none",
					filter: turnOff ? `brightness(${3 - scrollProgress * 2})` : undefined,
				}}
			>
				<FaultyTerminal
					brightness={0.6}
					digitSize={1.2}
					dither={true}
					flickerAmount={1}
					glitchAmount={1}
					gridMul={[2, 1]}
					mouseReact={true}
					mouseStrength={0.5}
					noiseAmp={1}
					pageLoadAnimation={true}
					pause={false}
					scale={2.0}
					scanlineIntensity={1}
					timeScale={0.5}
					tint="#a7ef9e"
				/>
			</div>
			<style jsx>{`
				@keyframes crtTurnOn {
					0% {
						transform: scaleY(0.01) scaleX(1);
						opacity: 0;
						filter: brightness(3) contrast(2);
					}
					10% {
						transform: scaleY(0.1) scaleX(1);
						opacity: 0.5;
					}
					20% {
						transform: scaleY(0.3) scaleX(0.95);
						opacity: 0.7;
						filter: brightness(2.5) contrast(1.8);
					}
					40% {
						transform: scaleY(0.7) scaleX(0.98);
						opacity: 0.9;
						filter: brightness(2) contrast(1.5);
					}
					60% {
						transform: scaleY(0.95) scaleX(1);
						opacity: 1;
						filter: brightness(1.5) contrast(1.2);
					}
					80% {
						transform: scaleY(1) scaleX(1);
						filter: brightness(1.2) contrast(1.1);
					}
					100% {
						transform: scaleY(1) scaleX(1);
						opacity: 1;
						filter: brightness(1) contrast(1);
					}
				}

				@keyframes crtTurnOff {
					0% {
						transform: scaleY(1) scaleX(1);
						opacity: 1;
						filter: brightness(1) contrast(1);
					}
					20% {
						transform: scaleY(1) scaleX(1);
						opacity: 1;
						filter: brightness(1.5) contrast(1.3);
					}
					40% {
						transform: scaleY(0.95) scaleX(1.02);
						opacity: 0.9;
						filter: brightness(2) contrast(1.5);
					}
					60% {
						transform: scaleY(0.1) scaleX(1);
						opacity: 0.5;
						filter: brightness(3) contrast(2);
					}
					80% {
						transform: scaleY(0.01) scaleX(1);
						opacity: 0.1;
						filter: brightness(5) contrast(3);
					}
					100% {
						transform: scaleY(0.001) scaleX(1);
						opacity: 0;
						filter: brightness(10) contrast(5);
					}
				}
			`}</style>
		</div>
	);
}
