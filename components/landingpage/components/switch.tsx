import { motion } from "motion/react";
import { useId } from "react";
import { cn } from "@/lib/utils";
export const Switch = ({
	checked,
	setChecked,
}: {
	checked: boolean;
	setChecked: (checked: boolean) => void;
}) => {
	const id = useId();
	return (
		<form className="flex items-center space-x-4 antialiased">
			<p
				className={cn(
					"text-neutral-400 text-sm transition duration-200",
					!checked && "text-neutral-100"
				)}
			>
				monthly
			</p>
			<label
				className={cn(
					"relative flex h-5 w-[40px] cursor-pointer items-center rounded-full border border-transparent px-1 shadow-[inset_0px_0px_12px_rgba(0,0,0,0.25)] transition duration-200",
					checked ? "bg-neutral-700" : "border-neutral-500 bg-neutral-900"
				)}
				htmlFor={id}
			>
				<motion.div
					animate={{
						height: ["12px", "10px", "12px"],
						width: ["12px", "18px", "12px", "12px"],
						x: checked ? 20 : -2,
					}}
					className={cn("z-10 block h-[20px] rounded-full bg-white shadow-md")}
					initial={{
						height: "12px",
						width: "12px",
						x: checked ? -2 : 20,
					}}
					key={String(checked)}
					transition={{
						duration: 0.3,
						delay: 0.1,
					}}
				/>
				<input
					checked={checked}
					className="hidden"
					id={id}
					onChange={(e) => setChecked(e.target.checked)}
					type="checkbox"
				/>
			</label>
			<p
				className={cn(
					"text-neutral-400 text-sm transition duration-200",
					checked && "text-neutral-100"
				)}
			>
				yearly
			</p>
		</form>
	);
};
