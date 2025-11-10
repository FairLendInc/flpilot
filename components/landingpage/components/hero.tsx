"use client";
import {
	type MotionValue,
	motion,
	useScroll,
	useTransform,
} from "motion/react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import React, { useRef } from "react";
import { HiArrowRight } from "react-icons/hi2";
import Beam from "./beam";
import { Button } from "./button";
import { Container } from "./container";
import { FeaturedImages } from "./featured-images";
import { Heading } from "./heading";
import { Subheading } from "./subheading";
import { VideoModal } from "./video-modal";
export const Hero = () => {
	const router = useRouter();

	const containerRef = useRef<any>(null);
	const { scrollYProgress } = useScroll({
		target: containerRef,
	});
	const [isMobile, setIsMobile] = React.useState(false);

	React.useEffect(() => {
		const checkMobile = () => {
			setIsMobile(window.innerWidth <= 768);
		};
		checkMobile();
		window.addEventListener("resize", checkMobile);
		return () => {
			window.removeEventListener("resize", checkMobile);
		};
	}, []);

	const scaleDimensions = () => (isMobile ? [0.7, 0.9] : [1.05, 1.2]);

	const rotate = useTransform(scrollYProgress, [0, 0.5], [20, 0]);
	const scale = useTransform(scrollYProgress, [0, 1], scaleDimensions());
	const translate = useTransform(scrollYProgress, [0, 1], [0, 100]);
	return (
		<div
			className="relative flex min-h-[70rem] flex-col overflow-hidden pt-20 md:min-h-[100rem] md:pt-40"
			ref={containerRef}
		>
			<Container className="flex flex-col items-center justify-center">
				<Heading
					as="h1"
					className="relative z-10 mx-auto mt-6 max-w-6xl py-6 text-center font-semibold text-4xl md:text-4xl lg:text-8xl"
				>
					Transform Your Marketing with Proactiv
				</Heading>
				<Subheading className="relative z-10 mx-auto mt-2 max-w-3xl text-center text-base text-muted md:mt-6 md:text-xl dark:text-muted-dark">
					Automate Campaigns, Engage Audiences, and Boost Lead Generation with
					Our All-in-One Marketing Solution
				</Subheading>
				<FeaturedImages
					className="items-center justify-center lg:justify-start"
					showStars
					textClassName="lg:text-left text-center"
				/>
				<div className="relative z-10 my-10 flex items-center justify-center gap-4">
					<Button className="group !text-lg flex items-center space-x-2">
						<span>Book a demo</span>{" "}
						<HiArrowRight className="mt-0.5 h-3 w-3 stroke-[1px] text-black transition-transform duration-200 group-hover:translate-x-1" />
					</Button>
				</div>
			</Container>
			<div className="md:-mt-20 relative flex cursor-pointer items-center justify-center p-2 md:p-20">
				<div
					className="relative w-full"
					style={{
						perspective: "1000px",
					}}
				>
					<Card rotate={rotate} scale={scale} translate={translate}>
						<Image
							alt="hero"
							className="mx-auto h-full rounded-md object-cover object-left-top grayscale transition duration-200 group-hover:grayscale-0 md:object-left-top"
							draggable={false}
							height={720}
							src={"/dashboard.png"}
							width={1400}
						/>
					</Card>
				</div>
			</div>
		</div>
	);
};

export const Card = ({
	rotate,
	scale,
	translate,
	children,
}: {
	rotate: MotionValue<number>;
	scale: MotionValue<number>;
	translate: MotionValue<number>;
	children: React.ReactNode;
}) => {
	return (
		<motion.div
			className="group -mt-12 group relative isolate z-40 mx-auto h-[20rem] w-full max-w-6xl rounded-[30px] border-4 border-neutral-900 bg-charcoal p-2 shadow-2xl md:h-[50rem] md:p-2"
			style={{
				rotateX: rotate,
				translateY: translate,
				// scale,
				boxShadow:
					"0 0 #0000004d, 0 9px 20px #0000004a, 0 37px 37px #00000042, 0 84px 50px #00000026, 0 149px 60px #0000000a, 0 233px 65px #00000003",
			}}
		>
			<Beam className="-top-1 block" showBeam />
			<div className="md:-bottom-10 pointer-events-none absolute inset-x-0 bottom-0 z-20 h-40 w-full scale-[1.2] bg-charcoal [mask-image:linear-gradient(to_top,white_30%,transparent)]" />
			<div className="absolute inset-0 z-20 flex items-center justify-center bg-transparent transition-all duration-200 group-hover:bg-black/0">
				<VideoModal />
			</div>
			<div className="h-full w-full overflow-hidden rounded-2xl bg-transparent md:rounded-2xl md:p-4">
				{children}
			</div>
		</motion.div>
	);
};
