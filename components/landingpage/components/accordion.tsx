// Accordion.js

import { AnimatePresence, motion } from "motion/react";

type AccordionProps = {
	i: number;
	expanded: number | false;
	setExpanded: (value: number | false) => void;
	title: React.ReactNode;
	description: React.ReactNode;
};

const Accordion = ({
	i,
	expanded,
	setExpanded,
	title,
	description,
}: AccordionProps) => {
	const isOpen = i === expanded;

	return (
		<div className="">
			<motion.div
				className="relative flex cursor-pointer flex-col overflow-hidden rounded-xl bg-neutral-900 p-4 font-bold text-base"
				initial={false}
				onClick={() => setExpanded(isOpen ? false : i)}
			>
				{title}
				<AnimatePresence initial={false} mode="popLayout">
					{isOpen && (
						<motion.p
							animate="open"
							className="mt-4 font-normal text-base text-neutral-400"
							exit="collapsed"
							initial="collapsed"
							transition={{ duration: 0.2, ease: "easeOut" }}
							variants={{
								open: { opacity: 1, height: "auto" },
								collapsed: { opacity: 0, height: 0 },
							}}
						>
							{description}
						</motion.p>
					)}
				</AnimatePresence>
			</motion.div>
		</div>
	);
};

export default Accordion;
