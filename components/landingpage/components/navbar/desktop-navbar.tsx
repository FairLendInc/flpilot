"use client";
import {
	AnimatePresence,
	motion,
	useMotionValueEvent,
	useScroll,
} from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { Logo } from "../logo";
import { cn } from "@/lib/utils";
import { Button } from "../button";
import { NavBarItem } from "./navbar-item";

type Props = {
	navItems: {
		link: string;
		title: string;
		target?: "_blank";
	}[];
};

export const DesktopNavbar = ({ navItems }: Props) => {
	const { scrollY } = useScroll();

	const [showBackground, setShowBackground] = useState(false);

	useMotionValueEvent(scrollY, "change", (value) => {
		if (value > 100) {
			setShowBackground(true);
		} else {
			setShowBackground(false);
		}
	});
	return (
		<motion.div
			animate={{
				width: showBackground ? "80%" : "100%",
				background: showBackground ? "var(--neutral-900)" : "transparent",
			}}
			className={cn(
				"relative mx-auto flex w-full justify-between rounded-md bg-transparent px-4 py-3 transition duration-200"
			)}
			transition={{
				duration: 0.4,
			}}
		>
			<AnimatePresence>
				{showBackground && (
					<motion.div
						animate={{ opacity: 1 }}
						className="pointer-events-none absolute inset-0 h-full w-full rounded-full bg-neutral-900 [mask-image:linear-gradient(to_bottom,white,transparent,white)]"
						initial={{ opacity: 0 }}
						key={String(showBackground)}
						transition={{
							duration: 1,
						}}
					/>
				)}
			</AnimatePresence>
			<div className="flex flex-row items-center gap-2">
				<Logo />
				<div className="flex items-center gap-1.5">
					{navItems.map((item) => (
						<NavBarItem href={item.link} key={item.title} target={item.target}>
							{item.title}
						</NavBarItem>
					))}
				</div>
			</div>
			<div className="flex items-center space-x-2">
				<Button as={Link} href="/register" variant="simple">
					Register
				</Button>
				<Button>Book a demo</Button>
			</div>
		</motion.div>
	);
};
