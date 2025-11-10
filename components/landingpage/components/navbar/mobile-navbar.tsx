"use client";
import { useMotionValueEvent, useScroll } from "motion/react";
import Link from "next/link";
import { useState } from "react";
import { IoIosClose, IoIosMenu } from "react-icons/io";
import { Button } from "../button";
import { Logo } from "../logo";
import { cn } from "@/lib/utils";

type NavItem = {
	title: string;
	link: string;
	children?: NavItem[];
};

type MobileNavbarProps = {
	navItems: NavItem[];
};

export const MobileNavbar = ({ navItems }: MobileNavbarProps) => {
	const [open, setOpen] = useState(false);

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
		<div
			className={cn(
				"flex w-full items-center justify-between rounded-md bg-transparent px-2.5 py-1.5 transition duration-200",
				showBackground &&
					"bg-neutral-900 shadow-[0px_-2px_0px_0px_var(--neutral-800),0px_2px_0px_0px_var(--neutral-800)]"
			)}
		>
			<Logo />
			<IoIosMenu
				className="h-6 w-6 text-white"
				onClick={() => setOpen(!open)}
			/>
			{open && (
				<div className="fixed inset-0 z-50 flex flex-col items-start justify-start space-y-10 bg-black pt-5 text-xl text-zinc-600 transition duration-200 hover:text-zinc-800">
					<div className="flex w-full items-center justify-between px-5">
						<Logo />
						<div className="flex items-center space-x-2">
							<IoIosClose
								className="h-8 w-8 text-white"
								onClick={() => setOpen(!open)}
							/>
						</div>
					</div>
					<div className="flex flex-col items-start justify-start gap-[14px] px-8">
						{navItems.map((navItem, idx) => (
							<div key={`nav-item-${idx}`}>
								{navItem.children && navItem.children.length > 0 ? (
									<>
										{navItem.children.map((childNavItem, childIdx) => (
											<Link
												className="relative max-w-[15rem] text-left text-2xl"
												href={childNavItem.link}
												key={`child-link-${childIdx}`}
												onClick={() => setOpen(false)}
											>
												<span className="block text-white">
													{childNavItem.title}
												</span>
											</Link>
										))}
									</>
								) : (
									<Link
										className="relative"
										href={navItem.link}
										key={`link-${idx}`}
										onClick={() => setOpen(false)}
									>
										<span className="block text-[26px] text-white">
											{navItem.title}
										</span>
									</Link>
								)}
							</div>
						))}
					</div>
					<div className="flex w-full flex-row items-start gap-2.5 px-8 py-4">
						<Button>Book a demo</Button>
						<Button
							as={Link}
							href="/register"
							onClick={() => {
								setOpen(false);
							}}
							variant="simple"
						>
							Register
						</Button>
					</div>
				</div>
			)}
		</div>
	);
};
