import { FaBolt } from "react-icons/fa";
import { Container } from "../container";
import { GradientContainer } from "../gradient-container";
import { Heading } from "../heading";
import { Subheading } from "../subheading";
import {
	Card,
	CardDescription,
	CardSkeletonContainer,
	CardTitle,
} from "./card";
import { FeatureIconContainer } from "./feature-icon-container";
import { SkeletonFive } from "./skeletons/fifth";
import { SkeletonOne } from "./skeletons/first";
import { SkeletonFour } from "./skeletons/fourth";
import { SkeletonTwo } from "./skeletons/second";
import { SkeletonThree } from "./skeletons/third";

export const Features = () => (
	<GradientContainer className="md:my-20">
		<Container className="relative z-40 mx-auto max-w-5xl py-20">
			<FeatureIconContainer className="flex items-center justify-center overflow-hidden">
				<FaBolt className="h-6 w-6 text-cyan-500" />
			</FeatureIconContainer>
			<Heading className="pt-4">Automate your social media</Heading>
			<Subheading>
				Proactiv houses a rich set of features to automate your marketing
				efforts across all social medias
			</Subheading>

			<div className="grid grid-cols-1 gap-2 py-10 lg:grid-cols-3">
				<Card className="lg:col-span-2">
					<CardTitle>Post to multiple platforms at once</CardTitle>
					<CardDescription>
						With our AI-powered platform, you can post to multiple platforms at
						once, saving you time and effort.
					</CardDescription>
					<CardSkeletonContainer>
						<SkeletonOne />
					</CardSkeletonContainer>
				</Card>
				<Card>
					<CardSkeletonContainer className="mx-auto max-w-[16rem]">
						<SkeletonTwo />
					</CardSkeletonContainer>
					<CardTitle>Analytics for everything</CardTitle>
					<CardDescription>
						Check analytics, track your posts, and get insights into your
						audience.
					</CardDescription>
				</Card>
				<Card>
					<CardSkeletonContainer>
						<SkeletonThree />
					</CardSkeletonContainer>
					<CardTitle>Integrated AI</CardTitle>
					<CardDescription>
						Proactiv uses AI to help you create engaging content.
					</CardDescription>
				</Card>
				<Card>
					<CardSkeletonContainer
						className="mx-auto max-w-[16rem]"
						showGradient={false}
					>
						<SkeletonFour />
					</CardSkeletonContainer>
					<CardTitle>Easy Collaboration</CardTitle>
					<CardDescription>
						Proactive can integrate with Zapier, Slack and every other popular
						integration tools.
					</CardDescription>
				</Card>
				<Card>
					<CardSkeletonContainer>
						<SkeletonFive />
					</CardSkeletonContainer>
					<CardTitle>Know your audience</CardTitle>
					<CardDescription>
						Based on your audience, create funnels and drive more traffic.
					</CardDescription>
				</Card>
			</div>
		</Container>
	</GradientContainer>
);
