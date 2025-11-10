"use client";
import { motion } from "motion/react";
import { DesktopNavbar } from "./desktop-navbar";
import { MobileNavbar } from "./mobile-navbar";

const navItems = [
	{
		title: "Features",
		link: "/features",
	},
	{
		title: "Pricing",
		link: "/pricing",
	},

	{
		title: "Blog",
		link: "/blog",
	},
	{
		title: "Contact",
		link: "/contact",
	},
];

export function NavBar() {
	return (
		<motion.nav
			animate={{
				y: 0,
			}}
			className="fixed inset-x-0 top-4 z-50 mx-auto w-[95%] max-w-7xl lg:w-full"
			initial={{
				y: -80,
			}}
			transition={{
				ease: [0.6, 0.05, 0.1, 0.9],
				duration: 0.8,
			}}
		>
			<div className="hidden w-full lg:block">
				<DesktopNavbar navItems={navItems} />
			</div>
			<div className="flex h-full w-full items-center lg:hidden">
				<MobileNavbar navItems={navItems} />
			</div>
		</motion.nav>
	);
}

{
	/* <div className="hidden md:block ">
        <DesktopNavbar />
      </div>
      <div className="flex h-full w-full items-center md:hidden ">
        <MobileNavbar navItems={navItems} />
      </div> */
}
