import Link from "next/link";
import { Logo } from "./logo";

export const Footer = () => {
	const links = [
		{
			name: "Pricing",
			href: "/pricing",
		},
		{
			name: "Blog",
			href: "/blog",
		},
		{
			name: "Contact",
			href: "/contact",
		},
	];
	const legal = [
		{
			name: "Privacy Policy",
			href: "#",
		},
		{
			name: "Terms of Service",
			href: "#",
		},
		{
			name: "Refund Policy",
			href: "#",
		},
	];
	const socials = [
		{
			name: "Twitter",
			href: "https://twitter.com/mannupaaji",
		},
		{
			name: "LinkedIn",
			href: "https://linkedin.com/in/manuarora28",
		},
		{
			name: "GitHub",
			href: "https://github.com/manuarora700",
		},
	];
	return (
		<div className="relative">
			<div className="relative border-neutral-900 border-t bg-primary px-8 pt-20 pb-32">
				<div className="mx-auto flex max-w-7xl flex-col items-start justify-between text-neutral-500 text-sm sm:flex-row dark:text-neutral-400">
					<div>
						<div className="mr-4 mb-4 md:flex">
							<Logo />
						</div>
						<div>Copyright &copy; 2024 Proactiv INC</div>
						<div className="mt-2">All rights reserved</div>
					</div>
					<div className="mt-10 grid grid-cols-3 items-start gap-10 md:mt-0">
						<div className="mt-4 flex flex-col justify-center space-y-4">
							{links.map((link) => (
								<Link
									className="text-muted text-xs transition-colors hover:text-black sm:text-sm dark:text-muted-dark dark:hover:text-neutral-400"
									href={link.href}
									key={link.name}
								>
									{link.name}
								</Link>
							))}
						</div>
						<div className="mt-4 flex flex-col justify-center space-y-4">
							{legal.map((link) => (
								<Link
									className="text-muted text-xs transition-colors hover:text-black sm:text-sm dark:text-muted-dark dark:hover:text-neutral-400"
									href={link.href}
									key={link.name}
								>
									{link.name}
								</Link>
							))}
						</div>
						<div className="mt-4 flex flex-col justify-center space-y-4">
							{socials.map((link) => (
								<Link
									className="text-muted text-xs transition-colors hover:text-black sm:text-sm dark:text-muted-dark dark:hover:text-neutral-400"
									href={link.href}
									key={link.name}
								>
									{link.name}
								</Link>
							))}
						</div>
					</div>
				</div>
			</div>
		</div>
	);
};
