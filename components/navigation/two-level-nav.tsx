"use client";

import { AnimatePresence, motion } from "framer-motion";
import { Menu, Search, X } from "lucide-react";
import Link from "next/link";
// import React from "react";
import { useEffect, useState } from "react";
import { AlertBell } from "@/components/alerts/AlertBell";
import { UserAvatarMenu } from "@/components/auth/UserAvatarMenu";
import { BreadcrumbNav } from "@/components/breadcrumb-nav";
import { Button } from "@/components/ui/button";
import { isNavItemActive, navigationItems } from "@/lib/navigation";
import { cn } from "@/lib/utils";
import { FilterBar } from "../filter-bar";
import { CommandPalette } from "./command-palette";

type TwoLevelNavProps = {
	breadcrumbs?: { label: string; href?: string }[];
	pathname?: string;
};

function isListingsPage(pathname: string) {
	return (
		pathname.split("/").length === 2 && pathname.split("/")[1] === "listings"
	);
}

export function TwoLevelNav({
	breadcrumbs = [],
	pathname = "",
}: TwoLevelNavProps) {
	const [commandOpen, setCommandOpen] = useState(false);
	const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

	useEffect(() => {
		const down = (e: KeyboardEvent) => {
			if (e.key === "k" && (e.metaKey || e.ctrlKey)) {
				e.preventDefault();
				setCommandOpen((open) => !open);
			}
		};
		document.addEventListener("keydown", down);
		return () => document.removeEventListener("keydown", down);
	}, []);

	return (
		<>
			<div className="fixed top-0 right-0 left-0 z-50">
				<div className="border-border border-b bg-background/80 backdrop-blur-xl">
					<div className="flex h-16 items-center justify-between px-4 md:px-6">
						{/* Left Side - Logo and Project Selector */}
						<div className="flex items-center gap-2 md:gap-4">
							{/* Logo */}
							<div className="flex items-center gap-2 md:gap-3">
								<div className="flex size-6 items-center justify-center rounded-sm bg-primary">
									<div className="size-3 rounded-sm bg-background" />
								</div>
								<span className="font-semibold text-foreground">FairLend</span>
							</div>

							{/* Project Selector - Hidden on mobile */}
							{/* <div className="hidden cursor-pointer items-center gap-2 rounded-md bg-secondary/50 px-3 py-1.5 transition-colors hover:bg-secondary md:flex">
								<div className="size-2 rounded-full bg-primary" />
								<span className="text-foreground text-sm">Main Project</span>
								<Badge
									className="border-0 bg-primary/20 text-primary text-xs"
									variant="secondary"
								>
									Pro
								</Badge>
								<ChevronDown className="size-3 text-muted-foreground" />
							</div> */}
						</div>

						{/* Center - Tubelight Tabs (Desktop only) */}
						<div className="hidden items-center gap-3 rounded-full border border-border bg-background/5 px-1 py-1 shadow-lg backdrop-blur-lg lg:flex">
							{navigationItems.map((navItem) => {
								// const Icon = navItem.icon;
								const isActive = isNavItemActive(navItem, pathname);

								return (
									<Link
										href={navItem.href}
										key={`nav-link-${navItem.id}`}
										prefetch={true}
									>
										<button
											className={cn(
												"relative cursor-pointer rounded-full px-6 py-2 font-semibold text-sm transition-colors",
												"text-foreground/80 hover:text-primary",
												isActive && "bg-muted text-primary"
											)}
											key={navItem.id}
											// onClick={() => handleNavClick(navItem)}
											type="button"
										>
											<span>{navItem.label}</span>
											{isActive && (
												<motion.div
													className="-z-10 absolute inset-0 w-full rounded-full bg-primary/5"
													initial={false}
													layoutId="lamp"
													transition={{
														type: "spring",
														stiffness: 300,
														damping: 30,
													}}
												>
													<div className="-top-2 -translate-x-1/2 absolute left-1/2 h-1 w-8 rounded-t-full bg-primary">
														<div className="-top-2 -left-2 absolute h-6 w-12 rounded-full bg-primary/20 blur-md" />
														<div className="-top-1 absolute h-6 w-8 rounded-full bg-primary/20 blur-md" />
														<div className="absolute top-0 left-2 h-4 w-4 rounded-full bg-primary/20 blur-sm" />
													</div>
												</motion.div>
											)}
										</button>
									</Link>
								);
							})}
						</div>
						{/* Right Side - User Controls */}
						<div className="flex items-center gap-2 md:gap-3">
							{/* Notifications - Visible on all screen sizes */}
							<AlertBell />

							{/* User Avatar - Visible on all screen sizes */}
							<UserAvatarMenu />

							<Button
								className="lg:hidden"
								onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
								size="icon"
								variant="ghost"
							>
								{mobileMenuOpen ? (
									<X className="size-5" />
								) : (
									<Menu className="size-5" />
								)}
							</Button>
						</div>
					</div>
				</div>

				<div
					className={cn(
						"border-border border-b bg-background/95 backdrop-blur-xl",
						mobileMenuOpen && "hidden lg:block"
					)}
				>
					<div className="relative flex h-12 items-center px-4 md:px-6">
						{/* Breadcrumbs - Left */}
						<BreadcrumbNav items={breadcrumbs} />

						{/* Filters - Absolutely Centered */}
						<div className="md:-translate-x-1/2 flex items-center gap-2 md:absolute md:left-1/2">
							{isListingsPage(pathname) && <FilterBar />}
						</div>

						{/* Search/Feedback - Right */}
						{!isListingsPage(pathname) && (
							<div className="ml-auto flex items-center gap-2 md:gap-3">
								{/* ... search content ... */}
							</div>
						)}
						{!isListingsPage(pathname) && (
							<div className="flex items-center gap-2 md:gap-3">
								{/* Search */}
								{/* <Button
									className="flex items-center gap-2 rounded-lg bg-secondary/50 px-2 py-1.5 text-muted-foreground text-sm transition-colors hover:bg-secondary md:px-3"
									onClick={() => setCommandOpen(true)}
									variant="ghost"
								>
									<Search className="size-4" />
									<span className="hidden text-xs sm:inline">Search...</span>
								</Button> */}

								{/* Feedback - Hidden on small mobile */}
								<Button
									className="hidden h-8 text-sm sm:flex"
									size="sm"
									variant="ghost"
								>
									Feedback
								</Button>
							</div>
						)}
					</div>
				</div>

				<AnimatePresence>
					{mobileMenuOpen && (
						<>
							{/* Backdrop */}
							<motion.div
								animate={{ opacity: 1 }}
								className="fixed inset-0 top-28 z-40 bg-background/50 backdrop-blur-md lg:hidden"
								exit={{ opacity: 0 }}
								initial={{ opacity: 0 }}
								onClick={() => setMobileMenuOpen(false)}
								transition={{ duration: 0.2 }}
							/>

							{/* Menu Content */}
							<motion.div
								animate={{ opacity: 0.7, y: 0 }}
								className="fixed top-28 right-0 left-0 z-50 rounded-lg border-border border-b bg-background/50 shadow-2xl backdrop-blur-xl lg:hidden"
								exit={{ opacity: 0, y: -20 }}
								initial={{ opacity: 0, y: -20 }}
								transition={{ duration: 0.3, ease: "easeOut" }}
							>
								<div className="h-[calc(100vh-4rem)] space-y-1 overflow-y-auto rounded-lg bg-background/50 px-4 py-6">
									{/* Navigation Items */}
									{navigationItems.map((navItem) => {
										const Icon = navItem.icon;
										const isActive = isNavItemActive(navItem, pathname);

										return (
											<Link
												className=""
												href={navItem.href}
												key={navItem.id}
												prefetch={true}
											>
												<Button
													className={cn(
														"flex w-full items-center justify-start gap-3 rounded-lg px-4 py-3 text-left transition-colors",
														isActive
															? "bg-primary/10 font-semibold text-primary"
															: "text-foreground/80 hover:bg-secondary hover:text-foreground"
													)}
													key={navItem.id}
													onClick={() => setMobileMenuOpen(false)}
													variant="ghost"
												>
													<Icon className="size-5" />
													<span className="text-base">{navItem.label}</span>
													{isActive && (
														<motion.div
															className="ml-auto size-2 rounded-full bg-primary"
															layoutId="mobile-active"
															transition={{
																type: "spring",
																stiffness: 300,
																damping: 30,
															}}
														/>
													)}
												</Button>
											</Link>
										);
									})}

									{/* Divider */}
									<div className="my-4 h-px bg-border" />

									{/* Mobile-only actions */}
									<Button
										className="flex w-full items-center gap-3 rounded-lg px-4 py-3 text-left text-foreground/80 transition-colors hover:bg-secondary hover:text-foreground"
										onClick={() => {
											setCommandOpen(true);
											setMobileMenuOpen(false);
										}}
										variant="ghost"
									>
										<Search className="size-5" />
										<span className="text-base">Search</span>
									</Button>
								</div>
							</motion.div>
						</>
					)}
				</AnimatePresence>
			</div>

			{/* Command Palette */}
			<CommandPalette onOpenChange={setCommandOpen} open={commandOpen} />
		</>
	);
}
