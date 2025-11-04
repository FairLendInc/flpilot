"use client";

import * as LabelPrimitive from "@radix-ui/react-label";
import { Slot } from "@radix-ui/react-slot";
import { cva, type VariantProps } from "class-variance-authority";
import { type ClassValue, clsx } from "clsx";
import { Eye, EyeOff } from "lucide-react";
import React, { useEffect, useId, useState } from "react";
import { twMerge } from "tailwind-merge";

function cn(...inputs: ClassValue[]) {
	return twMerge(clsx(inputs));
}

export type TypewriterProps = {
	text: string | string[];
	speed?: number;
	cursor?: string;
	loop?: boolean;
	deleteSpeed?: number;
	delay?: number;
	className?: string;
};

export function Typewriter({
	text,
	speed = 100,
	cursor = "|",
	loop = false,
	deleteSpeed = 50,
	delay = 1500,
	className,
}: TypewriterProps) {
	const [displayText, setDisplayText] = useState("");
	const [currentIndex, setCurrentIndex] = useState(0);
	const [isDeleting, setIsDeleting] = useState(false);
	const [textArrayIndex, setTextArrayIndex] = useState(0);

	const textArray = Array.isArray(text) ? text : [text];
	const currentText = textArray[textArrayIndex] || "";

	useEffect(() => {
		if (!currentText) return;

		const timeout = setTimeout(
			() => {
				if (isDeleting) {
					if (displayText.length > 0) {
						setDisplayText((prev) => prev.slice(0, -1));
					} else {
						setIsDeleting(false);
						setCurrentIndex(0);
						setTextArrayIndex((prev) => (prev + 1) % textArray.length);
					}
				} else if (currentIndex < currentText.length) {
					setDisplayText((prev) => prev + currentText[currentIndex]);
					setCurrentIndex((prev) => prev + 1);
				} else if (loop) {
					setTimeout(() => setIsDeleting(true), delay);
				}
			},
			isDeleting ? deleteSpeed : speed
		);

		return () => clearTimeout(timeout);
	}, [
		currentIndex,
		isDeleting,
		currentText,
		loop,
		speed,
		deleteSpeed,
		delay,
		displayText,
		textArray.length,
	]);

	return (
		<span className={className}>
			{displayText}
			<span className="animate-pulse">{cursor}</span>
		</span>
	);
}

const labelVariants = cva(
	"font-medium text-sm leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
);

const Label = React.forwardRef<
	React.ElementRef<typeof LabelPrimitive.Root>,
	React.ComponentPropsWithoutRef<typeof LabelPrimitive.Root> &
		VariantProps<typeof labelVariants>
>(({ className, ...props }, ref) => (
	<LabelPrimitive.Root
		className={cn(labelVariants(), className)}
		ref={ref}
		{...props}
	/>
));
Label.displayName = LabelPrimitive.Root.displayName;

const buttonVariants = cva(
	"inline-flex items-center justify-center gap-2 whitespace-nowrap rounded-md font-medium text-sm ring-offset-background transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 [&_svg]:pointer-events-none [&_svg]:size-4 [&_svg]:shrink-0",
	{
		variants: {
			variant: {
				default: "bg-primary text-primary-foreground hover:bg-primary/90",
				destructive:
					"bg-destructive text-destructive-foreground hover:bg-destructive/90",
				outline:
					"border border-input bg-background hover:bg-accent hover:text-accent-foreground dark:border-input/50",
				secondary:
					"bg-secondary text-secondary-foreground hover:bg-secondary/80",
				ghost: "hover:bg-accent hover:text-accent-foreground",
				link: "text-primary-foreground/60 underline-offset-4 hover:underline",
			},
			size: {
				default: "h-10 px-4 py-2",
				sm: "h-9 rounded-md px-3",
				lg: "h-12 rounded-md px-6",
				icon: "h-8 w-8",
			},
		},
		defaultVariants: {
			variant: "default",
			size: "default",
		},
	}
);
interface ButtonProps
	extends React.ButtonHTMLAttributes<HTMLButtonElement>,
		VariantProps<typeof buttonVariants> {
	asChild?: boolean;
}
const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
	({ className, variant, size, asChild = false, ...props }, ref) => {
		const Comp = asChild ? Slot : "button";
		return (
			<Comp
				className={cn(buttonVariants({ variant, size, className }))}
				ref={ref}
				{...props}
			/>
		);
	}
);
Button.displayName = "Button";

const Input = React.forwardRef<HTMLInputElement, React.ComponentProps<"input">>(
	({ className, type, ...props }, ref) => (
		<input
			className={cn(
				"flex h-10 w-full rounded-lg border border-input bg-background px-3 py-3 text-foreground text-sm shadow-black/5 shadow-sm transition-shadow placeholder:text-muted-foreground/70 focus-visible:bg-accent focus-visible:outline-none disabled:cursor-not-allowed disabled:opacity-50 dark:border-input/50",
				className
			)}
			ref={ref}
			type={type}
			{...props}
		/>
	)
);
Input.displayName = "Input";

export interface PasswordInputProps
	extends React.InputHTMLAttributes<HTMLInputElement> {
	label?: string;
}
const PasswordInput = React.forwardRef<HTMLInputElement, PasswordInputProps>(
	({ className, label, ...props }, ref) => {
		const id = useId();
		const [showPassword, setShowPassword] = useState(false);
		const togglePasswordVisibility = () => setShowPassword((prev) => !prev);
		return (
			<div className="grid w-full items-center gap-2">
				{label && <Label htmlFor={id}>{label}</Label>}
				<div className="relative">
					<Input
						className={cn("pe-10", className)}
						id={id}
						ref={ref}
						type={showPassword ? "text" : "password"}
						{...props}
					/>
					<button
						aria-label={showPassword ? "Hide password" : "Show password"}
						className="absolute inset-y-0 end-0 flex h-full w-10 items-center justify-center text-muted-foreground/80 transition-colors hover:text-foreground focus-visible:text-foreground focus-visible:outline-none disabled:pointer-events-none disabled:opacity-50"
						onClick={togglePasswordVisibility}
						type="button"
					>
						{showPassword ? (
							<EyeOff aria-hidden="true" className="size-4" />
						) : (
							<Eye aria-hidden="true" className="size-4" />
						)}
					</button>
				</div>
			</div>
		);
	}
);
PasswordInput.displayName = "PasswordInput";

function SignInForm() {
	const handleSignIn = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("UI: Sign In form submitted");
	};
	return (
		<form
			autoComplete="on"
			className="flex flex-col gap-8"
			onSubmit={handleSignIn}
		>
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="font-bold text-2xl">Sign in to your account</h1>
				<p className="text-balance text-muted-foreground text-sm">
					Enter your email below to sign in
				</p>
			</div>
			<div className="grid gap-4">
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						autoComplete="email"
						id="email"
						name="email"
						placeholder="m@example.com"
						required
						type="email"
					/>
				</div>
				<PasswordInput
					autoComplete="current-password"
					label="Password"
					name="password"
					placeholder="Password"
					required
				/>
				<Button className="mt-2" type="submit" variant="outline">
					Sign In
				</Button>
			</div>
		</form>
	);
}

function SignUpForm() {
	const handleSignUp = (event: React.FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		console.log("UI: Sign Up form submitted");
	};
	return (
		<form
			autoComplete="on"
			className="flex flex-col gap-8"
			onSubmit={handleSignUp}
		>
			<div className="flex flex-col items-center gap-2 text-center">
				<h1 className="font-bold text-2xl">Create an account</h1>
				<p className="text-balance text-muted-foreground text-sm">
					Enter your details below to sign up
				</p>
			</div>
			<div className="grid gap-4">
				<div className="grid gap-1">
					<Label htmlFor="name">Full Name</Label>
					<Input
						autoComplete="name"
						id="name"
						name="name"
						placeholder="John Doe"
						required
						type="text"
					/>
				</div>
				<div className="grid gap-2">
					<Label htmlFor="email">Email</Label>
					<Input
						autoComplete="email"
						id="email"
						name="email"
						placeholder="m@example.com"
						required
						type="email"
					/>
				</div>
				<PasswordInput
					autoComplete="new-password"
					label="Password"
					name="password"
					placeholder="Password"
					required
				/>
				<Button className="mt-2" type="submit" variant="outline">
					Sign Up
				</Button>
			</div>
		</form>
	);
}

function AuthFormContainer({
	isSignIn,
	onToggle,
}: {
	isSignIn: boolean;
	onToggle: () => void;
}) {
	return (
		<div className="mx-auto grid w-[350px] gap-2">
			{isSignIn ? <SignInForm /> : <SignUpForm />}
			<div className="text-center text-sm">
				{isSignIn ? "Don't have an account?" : "Already have an account?"}{" "}
				<Button
					className="pl-1 text-foreground"
					onClick={onToggle}
					variant="link"
				>
					{isSignIn ? "Sign up" : "Sign in"}
				</Button>
			</div>
			<div className="relative text-center text-sm after:absolute after:inset-0 after:top-1/2 after:z-0 after:flex after:items-center after:border-border after:border-t">
				<span className="relative z-10 bg-background px-2 text-muted-foreground">
					Or continue with
				</span>
			</div>
			<Button
				onClick={() => console.log("UI: Google button clicked")}
				type="button"
				variant="outline"
			>
				<img
					alt="Google icon"
					className="mr-2 h-4 w-4"
					src="https://www.svgrepo.com/show/475656/google-color.svg"
				/>
				Continue with Google
			</Button>
		</div>
	);
}

type AuthContentProps = {
	image?: {
		src: string;
		alt: string;
	};
	quote?: {
		text: string;
		author: string;
	};
};

type AuthUIProps = {
	signInContent?: AuthContentProps;
	signUpContent?: AuthContentProps;
};

const defaultSignInContent = {
	image: {
		src: "https://i.ibb.co/XrkdGrrv/original-ccdd6d6195fff2386a31b684b7abdd2e-removebg-preview.png",
		alt: "A beautiful interior design for sign-in",
	},
	quote: {
		text: "Welcome Back! The journey continues.",
		author: "EaseMize UI",
	},
};

const defaultSignUpContent = {
	image: {
		src: "https://i.ibb.co/HTZ6DPsS/original-33b8479c324a5448d6145b3cad7c51e7-removebg-preview.png",
		alt: "A vibrant, modern space for new beginnings",
	},
	quote: {
		text: "Create an account. A new chapter awaits.",
		author: "EaseMize UI",
	},
};

export function AuthUI({
	signInContent = {},
	signUpContent = {},
}: AuthUIProps) {
	const [isSignIn, setIsSignIn] = useState(true);
	const toggleForm = () => setIsSignIn((prev) => !prev);

	const finalSignInContent = {
		image: { ...defaultSignInContent.image, ...signInContent.image },
		quote: { ...defaultSignInContent.quote, ...signInContent.quote },
	};
	const finalSignUpContent = {
		image: { ...defaultSignUpContent.image, ...signUpContent.image },
		quote: { ...defaultSignUpContent.quote, ...signUpContent.quote },
	};

	const currentContent = isSignIn ? finalSignInContent : finalSignUpContent;

	return (
		<div className="min-h-screen w-full md:grid md:grid-cols-2">
			<style>{`
        input[type="password"]::-ms-reveal,
        input[type="password"]::-ms-clear {
          display: none;
        }
      `}</style>
			<div className="flex h-screen items-center justify-center p-6 md:h-auto md:p-0 md:py-12">
				<AuthFormContainer isSignIn={isSignIn} onToggle={toggleForm} />
			</div>

			<div
				className="relative hidden bg-center bg-cover transition-all duration-500 ease-in-out md:block"
				key={currentContent.image.src}
				style={{ backgroundImage: `url(${currentContent.image.src})` }}
			>
				<div className="absolute inset-x-0 bottom-0 h-[100px] bg-gradient-to-t from-background to-transparent" />

				<div className="relative z-10 flex h-full flex-col items-center justify-end p-2 pb-6">
					<blockquote className="space-y-2 text-center text-foreground">
						<p className="font-medium text-lg">
							“
							<Typewriter
								key={currentContent.quote.text}
								speed={60}
								text={currentContent.quote.text}
							/>
							”
						</p>
						<cite className="block font-light text-muted-foreground text-sm not-italic">
							— {currentContent.quote.author}
						</cite>
					</blockquote>
				</div>
			</div>
		</div>
	);
}
