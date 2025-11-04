"use client";

import { motion } from "framer-motion";
import { Heart, Shield, Star, Zap } from "lucide-react";
import { useState } from "react";

const IconRadio = () => {
	const [selected, setSelected] = useState("favorite");

	const options = [
		{ id: "favorite", label: "Favorite", icon: Heart },
		{ id: "popular", label: "Popular", icon: Star },
		{ id: "trending", label: "Trending", icon: Zap },
		{ id: "secure", label: "Secure", icon: Shield },
	];
	return (
		<div className="space-y-4">
			<h2 className="font-semibold text-xl">Icon Radio Selection</h2>
			<div className="flex flex-wrap gap-4">
				{options.map((option) => {
					const isSelected = selected === option.id;
					const Icon = option.icon;

					return (
						<motion.div
							className={`flex cursor-pointer flex-col items-center space-y-2 ${
								isSelected
									? "text-[#0A6EFF]"
									: "text-primary/50 hover:text-primary/80"
							}
          `}
							key={option.id}
							onClick={() => setSelected(option.id)}
							whileHover={{ y: -2 }}
							whileTap={{ scale: 0.95 }}
						>
							<motion.div
								animate={{
									scale: isSelected ? [1, 1.2, 1] : 1,
									rotate: isSelected ? [0, 10, -10, 0] : 0,
								}}
								className={`flex h-16 w-16 items-center justify-center rounded-full border ${isSelected ? "border-[#0A6EFF]" : ""}
            `}
								transition={{
									duration: 0.5,
									times: [0, 0.2, 0.5, 1],
									ease: "easeInOut",
								}}
							>
								<Icon
									className={`h-6 w-6 ${isSelected ? "text-[#0A6EFF]" : ""}`}
								/>
							</motion.div>
							<span className="font-medium">{option.label}</span>
						</motion.div>
					);
				})}
			</div>
		</div>
	);
};

export default IconRadio;
