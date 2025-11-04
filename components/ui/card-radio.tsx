"use client";

import { motion } from "framer-motion";
import { Check } from "lucide-react";
import { useState } from "react";

export default function CardRadio() {
	const [selected, setSelected] = useState("option1");

	const options = [
		{
			id: "option1",
			title: "Basic Plan",
			description: "Perfect for starters",
			price: "$9/mo",
		},
		{
			id: "option2",
			title: "Pro Plan",
			description: "For growing businesses",
			price: "$19/mo",
		},
		{
			id: "option3",
			title: "Enterprise",
			description: "For large organizations",
			price: "$49/mo",
		},
	];

	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-xl">Card Radio Selection</h2>
			<div className="grid grid-cols-1 gap-4 md:grid-cols-3">
				{options.map((option) => (
					<motion.div
						className={`relative cursor-pointer rounded-xl border-2 bg-background p-4 dark:bg-zinc-900 ${
							selected === option.id ? "border-[#0A6EFF]" : ""
						}`}
						key={option.id}
						onClick={() => setSelected(option.id)}
						transition={{ type: "spring", stiffness: 300, damping: 20 }}
						whileHover={{ scale: 1.02 }}
						whileTap={{ scale: 0.98 }}
					>
						<div className="flex h-full flex-col">
							<h3 className="font-bold text-lg">{option.title}</h3>
							<p className="flex-grow text-gray-500">{option.description}</p>
							<p className="mt-2 font-bold text-xl">{option.price}</p>
						</div>

						{selected === option.id && (
							<motion.div
								animate={{ scale: 1 }}
								className="absolute top-2 right-2 rounded-full bg-[#0A6EFF] p-1 text-white"
								initial={{ scale: 0 }}
								transition={{ type: "spring", stiffness: 500, damping: 20 }}
							>
								<Check className="h-4 w-4" />
							</motion.div>
						)}
					</motion.div>
				))}
			</div>
		</div>
	);
}
