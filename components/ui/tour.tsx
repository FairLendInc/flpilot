"use client";

import { ChevronLeft, ChevronRight, X } from "lucide-react";
import { AnimatePresence, motion } from "motion/react";
import React from "react";
import { createPortal } from "react-dom";
import { Button } from "@/components/ui/button";
import {
	Card,
	CardContent,
	CardFooter,
	CardHeader,
} from "@/components/ui/card";
import { cn } from "@/lib/utils";

export type TourStep = {
	target: string;
	title: string;
	description: string;
	placement?: "top" | "bottom" | "left" | "right";
	offset?: { x?: number; y?: number };
};

export type TourProps = {
	steps: TourStep[];
	open?: boolean;
	onClose?: () => void;
	onFinish?: () => void;
	className?: string;
	maskClassName?: string;
	placement?: "top" | "bottom" | "left" | "right";
};

const ARROW_SIZE = 8;
const SPACING = 12;

export function Tour({
	steps,
	open = false,
	onClose,
	onFinish,
	className,
	placement: defaultPlacement = "bottom",
}: TourProps) {
	const [currentStep, setCurrentStep] = React.useState(0);
	const [targetElement, setTargetElement] = React.useState<HTMLElement | null>(
		null
	);
	const [position, setPosition] = React.useState({ top: 0, left: 0 });
	const cardRef = React.useRef<HTMLDivElement>(null);

	const calculatePosition = React.useCallback(() => {
		if (!(targetElement && cardRef.current)) return null;

		const targetRect = targetElement.getBoundingClientRect();
		const cardRect = cardRef.current.getBoundingClientRect();
		const placement = steps[currentStep].placement || defaultPlacement;
		const offset = steps[currentStep].offset || { x: 0, y: 0 };

		let top = 0;
		let left = 0;

		switch (placement) {
			case "top":
				top =
					targetRect.top -
					cardRect.height -
					SPACING -
					ARROW_SIZE +
					(offset.y || 0);
				left =
					targetRect.left +
					(targetRect.width - cardRect.width) / 2 +
					(offset.x || 0);
				break;
			case "bottom":
				top = targetRect.bottom + SPACING + ARROW_SIZE + (offset.y || 0);
				left =
					targetRect.left +
					(targetRect.width - cardRect.width) / 2 +
					(offset.x || 0);
				break;
			case "left":
				top =
					targetRect.top +
					(targetRect.height - cardRect.height) / 2 +
					(offset.y || 0);
				left =
					targetRect.left -
					cardRect.width -
					SPACING -
					ARROW_SIZE +
					(offset.x || 0);
				break;
			case "right":
				top =
					targetRect.top +
					(targetRect.height - cardRect.height) / 2 +
					(offset.y || 0);
				left = targetRect.right + SPACING + ARROW_SIZE + (offset.x || 0);
				break;
		}

		// Ensure the card stays within viewport bounds
		const viewport = {
			width: window.innerWidth,
			height: window.innerHeight,
		};

		top = Math.max(
			SPACING,
			Math.min(viewport.height - cardRect.height - SPACING, top)
		);
		left = Math.max(
			SPACING,
			Math.min(viewport.width - cardRect.width - SPACING, left)
		);

		return { top, left };
	}, [targetElement, currentStep, steps, defaultPlacement]);

	const updatePosition = React.useCallback(() => {
		const newPosition = calculatePosition();
		if (newPosition) {
			setPosition(newPosition);
		}
	}, [calculatePosition]);

	React.useEffect(() => {
		if (!open) return;

		const target = document.querySelector(
			steps[currentStep].target
		) as HTMLElement;
		setTargetElement(target);

		if (target) {
			target.style.position = "relative";
			target.style.zIndex = "60";

			target.scrollIntoView({
				behavior: "smooth",
				block: "center",
				inline: "center",
			});
		}

		return () => {
			if (target) {
				target.style.position = "";
				target.style.zIndex = "";
			}
		};
	}, [open, currentStep, steps]);

	React.useEffect(() => {
		if (!targetElement) return;

		updatePosition();
		window.addEventListener("resize", updatePosition);
		window.addEventListener("scroll", updatePosition);

		return () => {
			window.removeEventListener("resize", updatePosition);
			window.removeEventListener("scroll", updatePosition);
		};
	}, [targetElement, updatePosition]);

	if (!open) return null;

	const handleNext = () => {
		if (currentStep === steps.length - 1) {
			onFinish?.();
			return;
		}
		setCurrentStep((prev) => prev + 1);
	};

	const handlePrev = () => {
		setCurrentStep((prev) => prev - 1);
	};

	const handleClose = () => {
		setCurrentStep(0);
		onClose?.();
	};

	const placement = steps[currentStep].placement || defaultPlacement;

	return createPortal(
		<AnimatePresence>
			{open && (
				<>
					{/* Overlay with cutout */}
					<motion.div
						animate={{ opacity: 1 }}
						className="fixed inset-0 z-50"
						exit={{ opacity: 0 }}
						initial={{ opacity: 0 }}
						transition={{ duration: 0.2 }}
					>
						{/* Dark overlay sections */}
						<motion.div
							animate={{
								opacity: 1,
								scale: 1,
								clipPath: targetElement
									? `
              polygon(
                0% 0%,
                  0% 100%,
                  ${targetElement.getBoundingClientRect().left - 8}px 100%,
                  ${targetElement.getBoundingClientRect().left - 8}px ${
										targetElement.getBoundingClientRect().top - 8
									}px,
                  ${targetElement.getBoundingClientRect().right + 8}px ${
										targetElement.getBoundingClientRect().top - 8
									}px,
                  ${targetElement.getBoundingClientRect().right + 8}px ${
										targetElement.getBoundingClientRect().bottom + 8
									}px,
                  ${targetElement.getBoundingClientRect().left - 8}px ${
										targetElement.getBoundingClientRect().bottom + 8
									}px,
                  ${targetElement.getBoundingClientRect().left - 8}px 100%,
                  100% 100%,
                  100% 0%
                )`
									: "",
							}}
							className="absolute inset-0 bg-black/50 dark:bg-white/50"
							exit={{ opacity: 0, scale: 0.95 }}
							initial={{ opacity: 0, scale: 0.95 }}
							transition={{
								type: "spring",
								damping: 20,
								stiffness: 300,
								clipPath: { type: "spring", damping: 25, stiffness: 400 },
							}}
						/>
					</motion.div>

					{/* Tour card */}
					<motion.div
						animate={{
							opacity: 1,
							scale: 1,
							top: position.top,
							left: position.left,
						}}
						className={cn("fixed z-[70] w-[320px]", className)}
						exit={{ opacity: 0, scale: 0.9 }}
						initial={{ opacity: 0, scale: 0.9 }}
						ref={cardRef}
						transition={{
							type: "spring",
							damping: 20,
							stiffness: 300,
							opacity: { duration: 0.2 },
							top: { type: "spring", damping: 20, stiffness: 300 },
							left: { type: "spring", damping: 20, stiffness: 300 },
						}}
					>
						<div
							className={cn(
								"absolute h-0 w-0 border-8 border-transparent",
								placement === "top" &&
									"-translate-x-1/2 bottom-[-16px] left-1/2 border-t-white",
								placement === "bottom" &&
									"-translate-x-1/2 top-[-16px] left-1/2 border-b-white",
								placement === "left" &&
									"-translate-y-1/2 top-1/2 right-[-16px] border-l-white",
								placement === "right" &&
									"-translate-y-1/2 top-1/2 left-[-16px] border-r-white"
							)}
						/>
						<Card>
							<CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
								<div className="font-medium text-sm">
									Step {currentStep + 1} of {steps.length}
								</div>
								<Button
									className="h-8 w-8 p-0"
									onClick={handleClose}
									size="icon"
									variant="ghost"
								>
									<X className="h-4 w-4" />
								</Button>
							</CardHeader>
							<CardContent>
								<h4 className="font-semibold leading-none tracking-tight">
									{steps[currentStep].title}
								</h4>
								<p className="mt-2 text-muted-foreground text-sm">
									{steps[currentStep].description}
								</p>
							</CardContent>
							<CardFooter className="flex justify-between">
								<Button
									disabled={currentStep === 0}
									onClick={handlePrev}
									size="sm"
									variant="outline"
								>
									<ChevronLeft className="mr-2 h-4 w-4" />
									Previous
								</Button>
								<Button onClick={handleNext} size="sm">
									{currentStep === steps.length - 1 ? (
										"Finish"
									) : (
										<>
											Next
											<ChevronRight className="ml-2 h-4 w-4" />
										</>
									)}
								</Button>
							</CardFooter>
						</Card>
					</motion.div>
				</>
			)}
		</AnimatePresence>,
		document.body
	);
}
