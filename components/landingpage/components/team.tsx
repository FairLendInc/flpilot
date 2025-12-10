"use client";

import { motion } from "motion/react";
import Image from "next/image";
import Link from "next/link";

const peopleData = [
	{
		name: "Elie Soberano",
		role: "Founder & CEO",
		bio: "I've brokered over $2 billion in mortgages across 26 years—one of Canada's top 1% brokers. Scotiabank hires me at $2K/hour to consult on mortgage product strategy. I'm also a 30% owner of Cannect, a commercial-mortgage crowdfunding platform. I've built and scaled this model before—and I'm migrating my entire origination pipeline here.",
		avatar: "/elie.png",
		link: "#",
	},
	{
		name: "Connor Beleznay",
		role: "CTO",
		bio: "Previously built infrastructure at RBC Capital Markets and RBC Digital, developing real-time and mobile banking systems. He's the technical co-founder of Human Feedback, their expertise is powering our human-in-the-loop model-training pipeline.",
		avatar: "/connor.jpg",
		link: "#",
	},
	{
		name: "Bogdan Krystek",
		role: "CFO",
		bio: "Runs Barton Engineering, a Tier-1 manufacturer for Ford and Caterpillar—bringing operational discipline and quality-system thinking.",
		avatar: "/bogdan.jpeg",
		link: "#",
	},
	{
		name: "Austin Krystek",
		role: "COO",
		bio: "Combines financial rigor with operational execution. Before co-founding FairLend, he served as a procurement officer with Canada's Department of National Defence, where he managed over $50 million in aerospace acquisitions. He also co-founded Human Feedback, an AI-training company.",
		avatar: "/austin.png",
		link: "#",
	},
	{
		name: "Joel",
		role: "CLO",
		bio: "Has 20 years in private-equity law and served as a cybersecurity consultant with Canadian intelligence agencies. He oversees licensing, compliance, and data protection.",
		avatar: "https://alt.tailus.io/images/team/member-two.webp",
		link: "#",
	},

];

const containerVariants = {
	hidden: { opacity: 0 },
	visible: {
		opacity: 1,
		transition: {
			staggerChildren: 0.12,
			delayChildren: 0.2,
		},
	},
};

const cardVariants = {
	hidden: {
		opacity: 0,
		x: -40,
		y: -20,
		scale: 0.95,
		zIndex: 0,
	},
	visible: {
		opacity: 1,
		x: 0,
		y: 0,
		scale: 1,
		zIndex: 1,
		transition: {
			type: "spring" as const,
			stiffness: 100,
			damping: 20,
		},
	},
};

export default function Team({
	title = "Meet the Team",
	subtitle = "mortgage insiders building fintech",
	description = " We're fintech operators and private-equity professionals, not outsiders bolting tech onto an industry we don't understand.",
	members = peopleData,
}) {
	const ceo = members[0];
	const otherMembers = members.slice(1);

	return (
		<section className="overflow-hidden py-32">
			<div className="mx-auto max-w-5xl px-8 lg:px-0">
				<motion.div
					initial={{ opacity: 0, y: 20 }}
					transition={{ duration: 0.6 }}
					viewport={{ once: true }}
					whileInView={{ opacity: 1, y: 0 }}
				>
					<h2 className="font-medium text-5xl md:text-6xl">
						{title} <br />
						<span className="text-foreground/50">{subtitle}</span>
					</h2>
					<p className="mt-6 max-w-md text-foreground/70">{description}</p>
				</motion.div>

				<div className="relative">
					<div className="mt-12 space-y-12">
						{/* CEO Row */}
						<motion.div
							className="grid gap-8 lg:grid-cols-[350px_1fr] items-center"
							initial={{ opacity: 0, y: 20 }}
							whileInView={{ opacity: 1, y: 0 }}
							viewport={{ once: true }}
							transition={{ duration: 0.6 }}
						>
							<motion.div className="group overflow-hidden">
								<Image
									alt={`${ceo.name}, ${ceo.role}`}
									className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-90 group-hover:rounded-xl"
									height={1239}
									src={ceo.avatar}
									width={826}
								/>
								<div className="px-2 pt-2 sm:pt-4 sm:pb-0">
									<div className="flex justify-between">
										<h3 className="font-medium text-base transition-all duration-500 group-hover:tracking-wider">
											{ceo.name}
										</h3>
										<span className="text-xs">Founder</span>
									</div>
									<div className="mt-1 flex items-center justify-between">
										<span className="inline-block text-muted-foreground text-sm">
											{ceo.role}
										</span>
									</div>
								</div>
							</motion.div>
							
							<div className="space-y-6">
								<h3 className="text-3xl font-medium">Head of Mortgage Strategy</h3>
								<div className="space-y-4 text-lg text-muted-foreground leading-relaxed">
									<ul className="space-y-3">
										<li className="flex gap-3">
											<span>Top <strong>1% of mortgage brokers in Canada</strong> by volume.</span>
										</li>
										<li className="flex gap-3">
											<span>Over <strong>$2,000,000,000</strong> in funded mortgage deals across a 30-year career.</span>
										</li>
										<li className="flex gap-3">
											<span>Brought in by <strong>Scotiabank</strong> as a consultant at <strong>$2,000/hour</strong> to advise on their mortgage products and strategy.</span>
										</li>
										<li className="flex gap-3">
											<span>Deep, hands-on experience across private, alternative, and institutional mortgage channels.</span>
										</li>
									</ul>
									<p className="text-muted-foreground bg-muted/30 p-4 rounded-lg">
										Eli leads the credit, deal selection, and structuring side of the MIC — which mortgages we fund, how we price them, and how we manage risk before they are spun out to long-term investors.
									</p>
								</div>
							</div>
						</motion.div>

						{/* Team Grid */}
						<motion.div
							className="grid gap-x-2 gap-y-12 sm:grid-cols-2 lg:grid-cols-4"
							initial="hidden"
							variants={containerVariants}
							viewport={{ once: true }}
							whileInView="visible"
						>
							{otherMembers.map((member, index) => (
								<motion.div
									className="group overflow-hidden"
									key={member.name}
									variants={cardVariants}
								>
									<Image
										alt={`${member.name}, ${member.role}`}
										className="h-96 w-full rounded-md object-cover object-top grayscale transition-all duration-500 hover:grayscale-0 group-hover:h-90 group-hover:rounded-xl"
										height={1239}
										src={member.avatar}
										width={826}
									/>
									<div className="px-2 pt-2 sm:pt-4 sm:pb-0">
										<div className="flex justify-between">
											<h3 className="font-medium text-base transition-all duration-500 group-hover:tracking-wider">
												{member.name}
											</h3>
											<span className="text-xs">_0{index + 1}</span>
										</div>
										<div className="mt-1 flex items-center justify-between">
											<span className="inline-block translate-y-6 text-muted-foreground text-sm opacity-0 transition duration-300 group-hover:translate-y-0 group-hover:opacity-100">
												{member.role}
											</span>
											<Link
												className="inline-block translate-y-8 text-sm tracking-wide opacity-0 transition-all duration-500 hover:underline group-hover:translate-y-0 group-hover:text-primary-600 group-hover:opacity-100 dark:group-hover:text-primary-400"
												href={member.link}
											>
												{" "}
												Linktree
											</Link>
										</div>
									</div>
								</motion.div>
							))}
						</motion.div>
					</div>
				</div>
			</div>
		</section>
	);
}
