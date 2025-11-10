import { IconMailFilled } from "@tabler/icons-react";
import { Button } from "./button";
import { Container } from "./container";
import { FeatureIconContainer } from "./features/feature-icon-container";
import { Grid } from "./features/grid";
import { Heading } from "./heading";
import { Subheading } from "./subheading";

export const ContactForm = () => (
	<Container className="grid grid-cols-1 gap-10 px-6 py-40 md:grid-cols-2 md:py-60">
		<div>
			<div className="flex">
				<FeatureIconContainer className="flex items-center justify-center overflow-hidden">
					<IconMailFilled className="h-6 w-6 text-cyan-500" />
				</FeatureIconContainer>
			</div>
			<Heading className="text-left">Contact us</Heading>
			<Subheading className="text-left text-neutral-400">
				We are always looking for ways to improve our products and services.
				Contact us and let us know how we can help you.
			</Subheading>

			<div className="mt-10 text-sm">
				<p className="text-neutral-200 text-sm">Email</p>
				<p className="text-neutral-400 text-sm">contact@proactiv.ai</p>
			</div>
			<div className="mt-4 text-sm">
				<p className="text-neutral-200 text-sm">Phone</p>
				<p className="text-neutral-400 text-sm">+1 (800) 123 XX21</p>
			</div>
			<div className="mt-4 text-sm">
				<p className="text-neutral-200 text-sm">Support</p>
				<p className="text-neutral-400 text-sm">support@proactiv.ai</p>
			</div>
		</div>
		<div className="relative mx-auto flex w-full max-w-2xl flex-col items-start gap-4 overflow-hidden rounded-3xl bg-gradient-to-b from-neutral-900 to-neutral-950 p-10">
			<Grid size={20} />
			<div className="relative z-20 mb-4 w-full">
				<label
					className="mb-2 inline-block font-medium text-neutral-300 text-sm"
					htmlFor="name"
				>
					Full name
				</label>
				<input
					className="h-10 w-full rounded-md border border-neutral-800 bg-charcoal pl-4 text-sm text-white placeholder-neutral-500 outline-none focus:outline-none focus:ring-2 focus:ring-neutral-800 active:outline-none"
					id="name"
					placeholder="Manu Arora"
					type="text"
				/>
			</div>
			<div className="relative z-20 mb-4 w-full">
				<label
					className="mb-2 inline-block font-medium text-neutral-300 text-sm"
					htmlFor="email"
				>
					Email Address
				</label>
				<input
					className="h-10 w-full rounded-md border border-neutral-800 bg-charcoal pl-4 text-sm text-white placeholder-neutral-500 outline-none focus:outline-none focus:ring-2 focus:ring-neutral-800 active:outline-none"
					id="email"
					placeholder="contact@aceternity.com"
					type="email"
				/>
			</div>
			<div className="relative z-20 mb-4 w-full">
				<label
					className="mb-2 inline-block font-medium text-neutral-300 text-sm"
					htmlFor="company"
				>
					Company
				</label>
				<input
					className="h-10 w-full rounded-md border border-neutral-800 bg-charcoal pl-4 text-sm text-white placeholder-neutral-500 outline-none focus:outline-none focus:ring-2 focus:ring-neutral-800 active:outline-none"
					id="company"
					placeholder="contact@aceternity.com"
					type="text"
				/>
			</div>
			<div className="relative z-20 mb-4 w-full">
				<label
					className="mb-2 inline-block font-medium text-neutral-300 text-sm"
					htmlFor="message"
				>
					Message
				</label>
				<textarea
					className="w-full rounded-md border border-neutral-800 bg-charcoal pt-4 pl-4 text-sm text-white placeholder-neutral-500 outline-none focus:outline-none focus:ring-2 focus:ring-neutral-800 active:outline-none"
					id="message"
					placeholder="Type your message here"
					rows={5}
				/>
			</div>
			<Button variant="muted">Submit</Button>
		</div>
	</Container>
);
