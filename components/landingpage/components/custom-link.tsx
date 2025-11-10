import Link from "next/link";

interface CustomLinkProps {
	href: string;
	children?: React.ReactNode; // Ensure children is part of the props
}

export const CustomLink = (props: CustomLinkProps) => (
	<Link
		className="border-neutral-400 border-b-[1px] pb-0.5 text-neutral-400 transition duration-200 hover:border-white hover:text-white"
		{...props}
	>
		{props.children}
	</Link>
);
