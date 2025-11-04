import type { ReactNode } from "react";

export type BorderGradientIconProps = {
	title: string;
	icon: ReactNode;
	width?: string;
	height?: string;
	iconClassName?: string;
};

export const BorderGradientIcon = ({
	title,
	icon,
	width = "120px",
	height = "120px",
	iconClassName = "",
}: BorderGradientIconProps) => (
	<div
		className="cursor-pointer rounded-[38px] bg-gradient-to-b from-neutral-300 to-background p-[1px] dark:from-[#404040] dark:to-black"
		style={{ width, height }}
	>
		<div
			aria-label={title}
			className="flex h-full w-full items-center justify-center rounded-[38px] bg-gradient-to-br from-gray-100 to-white transition-all duration-300 hover:opacity-60 active:opacity-75 dark:from-[#101010] dark:to-[#000000]"
			role="button"
			title={title}
		>
			<div
				className={`flex items-center justify-center text-black dark:text-white ${iconClassName}`}
			>
				{icon}
			</div>
		</div>
	</div>
);
