"use client";
import {
	IconBrandGithubFilled,
	IconBrandGoogleFilled,
} from "@tabler/icons-react";
import { motion } from "motion/react";
import type React from "react";
import { useState } from "react";
import { Button } from "./button";
import { Container } from "./container";
import { Logo } from "./logo";

export const Register = () => {
	const [isClicked, setIsClicked] = useState(false);

	const handleSubmit = (e: React.FormEvent<HTMLInputElement>) => {
		e.preventDefault();
		const target = e.target as HTMLInputElement; // Typecasting to HTMLInputElement
		console.log(target.value);
	};
	return (
		<Container className="mx-auto flex h-screen max-w-lg flex-col items-center justify-center">
			<Logo />
			<h1 className="my-4 font-bold text-xl md:text-4xl">
				Welcome to Proactiv
			</h1>

			<div className="flex w-full flex-col gap-4 sm:flex-row">
				<button className="flex flex-1 items-center justify-center space-x-2 rounded-md bg-white px-4 py-3 text-black shadow-[0px_1px_0px_0px_#00000040_inset] transition duration-200 hover:bg-white/80">
					<IconBrandGithubFilled className="h-4 w-4 text-black" />
					<span className="text-sm">Login with GitHub</span>
				</button>
				<button className="flex flex-1 items-center justify-center space-x-2 rounded-md bg-white px-4 py-3 text-black shadow-[0px_1px_0px_0px_#00000040_inset] transition duration-200 hover:bg-white/80">
					<IconBrandGoogleFilled className="h-4 w-4 text-black" />
					<span className="text-sm">Login with Google</span>
				</button>
			</div>

			<div className="my-6 h-px w-full bg-neutral-800" />
			<motion.input
				animate={{
					height: isClicked ? "40px" : "0px",
					opacity: isClicked ? 1 : 0,
					marginBottom: isClicked ? "10px" : "0px",
				}}
				className="h-10 w-full rounded-md border border-neutral-800 bg-charcoal pl-4 text-sm text-white placeholder-neutral-500 outline-none focus:outline-none focus:ring-2 focus:ring-neutral-800 active:outline-none"
				initial={{
					height: "0px",
					opacity: 0,
					marginBottom: "0px",
				}}
				placeholder="contact@aceternity.com"
				type="email"
			/>
			<Button
				className="w-full py-3"
				onClick={(e: React.FormEvent<HTMLInputElement>) => {
					if (!isClicked) {
						setIsClicked(true);
						return;
					}
					handleSubmit(e);
				}}
				variant="muted"
			>
				<span className="text-sm">Continue with Email</span>
			</Button>
		</Container>
	);
};
