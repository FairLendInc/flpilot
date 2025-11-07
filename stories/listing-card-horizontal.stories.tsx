import { Button, Card, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";
import type { Meta, StoryObj } from "@storybook/react";
import { PercentCircle } from "lucide-react";
import { Horizontal } from "@/components/listing-card-horizontal";
import { Badge } from "@/components/ui/badge";

const meta = {
	title: "Components/ListingCardHorizontal",
	component: Horizontal,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"A horizontal listing card featuring product image, title, description, pricing, availability, and action button. Perfect for e-commerce product displays, rental listings, or service offerings.",
			},
		},
	},

	decorators: [
		(Story) => (
			<div className="flex w-full max-w-4xl justify-center p-4">
				<Story />
			</div>
		),
	],
} satisfies Meta<typeof Horizontal>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: undefined as never,
	render: () => <Horizontal />,
	parameters: {
		docs: {
			description: {
				story:
					"Default horizontal listing card showing Porsche 911 Golden Edition with all standard features.",
			},
		},
	},
};

export const CustomProduct: Story = {
	args: undefined as never,
	render: () => (
		<Card.Root className="w-full items-stretch md:flex-row">
			<img
				alt="Malibu Beach Duplex thumbnail"
				className="pointer-events-none aspect-square w-full select-none rounded-panel object-cover md:max-w-[180px]"
				loading="lazy"
				src="/house.jpg"
			/>
			<div className="flex flex-1 flex-col gap-3">
				<Card.Header className="gap-1">
					<Card.Title>Malibu Beach Detached</Card.Title>
					<Card.Description className="text-foreground/70">
						Malibu, CA • Single Family Detached
					</Card.Description>
				</Card.Header>
				<Card.Content className="flex flex-col items-center justify-center align-middle text-muted-foreground text-sm">
					<div className="grid grid-cols-3 gap-1">
						<Chip className="flex text-foreground/70 text-xs md:text-md">
							<Icon className="h-4 w-4" icon="lucide:percent" />
							80 LTV
						</Chip>
						<Chip className="text-foreground/70 text-xs md:text-md">
							<Icon className="h-4 w-4" icon="lucide:percent" />
							9.5 APR
						</Chip>
						<Chip className="text-foreground/70 text-xs md:text-md">
							<Icon className="h-4 w-4" icon="lucide:dollar-sign" />
							350K Loan
						</Chip>
					</div>
				</Card.Content>
				<Card.Footer className="mt-auto flex w-full flex-row items-center justify-between">
					<div className="flex flex-col">
						<span
							aria-label="Principal loan: 350,000 US dollars"
							className="font-medium text-foreground text-sm"
						>
							Maturity
						</span>
						<span className="text-foreground/50 text-xs">01/01/2026</span>
					</div>
					<Button variant="secondary">View details</Button>
				</Card.Footer>
			</div>
		</Card.Root>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Custom product listing featuring a luxury watch with different pricing and availability.",
			},
		},
	},
};

export const HighPriceItem: Story = {
	args: undefined as never,
	render: () => (
		<Card.Root className="w-full items-stretch md:flex-row">
			<img
				alt="Malibu Beach Duplex thumbnail"
				className="pointer-events-none aspect-square w-full select-none rounded-panel object-cover md:max-w-[180px]"
				loading="lazy"
				src="/house.jpg"
			/>
			<div className="flex flex-1 flex-col gap-3">
				<Card.Header className="gap-1">
					<Card.Title>Malibu Beach Detached</Card.Title>
					<Card.Description className="text-foreground/70">
						Malibu, CA • Single Family Detached
					</Card.Description>
				</Card.Header>
				<Card.Content className="grid grid-cols-3 items-center justify-center gap-2 align-middle text-muted-foreground text-sm">
					<span>80% LTV</span>
					<span>9.5% IR</span>
					<span>$300k Loan</span>
				</Card.Content>
				<Card.Footer className="mt-auto flex w-full flex-row items-center justify-between">
					<div className="flex flex-col">
						<span
							aria-label="Principal loan: 350,000 US dollars"
							className="font-medium text-foreground text-sm"
						>
							Maturity
						</span>
						<span className="text-foreground/50 text-xs">01/01/2026</span>
					</div>
					<Button variant="secondary">View details</Button>
				</Card.Footer>
			</div>
		</Card.Root>
	),
	parameters: {
		docs: {
			description: {
				story: "High-value item with premium pricing and limited availability.",
			},
		},
	},
};

export const BlurredCard: Story = {
	args: undefined as never,
	render: () => (
		<Card.Root
			className="w-full items-stretch transition-all duration-300 hover:scale-105 hover:shadow-black/10 hover:shadow-lg md:flex-row"
		>
			<img
				alt="Malibu Beach Detached thumbnail"
				className="pointer-events-none aspect-square w-full select-none rounded-panel object-cover md:max-w-[180px]"
				loading="lazy"
				src="/house.jpg"
			/>
			<div className="flex flex-1 flex-col gap-3">
				<Card.Header className="gap-1">
					<Card.Title>Malibu Beach Detached</Card.Title>
					<Card.Description className="text-foreground/70">
						Malibu, CA • Single Family Detached
					</Card.Description>
				</Card.Header>
				<Card.Content className="grid grid-cols-3 items-center justify-center gap-2 align-middle text-muted-foreground text-sm">
					<span className="flex items-center">
						<Icon className="h-4 w-4" icon="lucide:percent-circle" />
						<span className="ml-2 flex flex-col justify-around py-1 align-middle">
							<p className="text-xs">LTV</p>
							<p className="font-bold text-sm">80</p>
						</span>
					</span>
					<span className="flex items-center">
						<Icon className="h-4 w-4" icon="lucide:percent-circle" />
						<span className="ml-2 flex flex-col justify-around py-1 align-middle">
							<p className="text-xs">APR</p>
							<p className="font-bold text-sm">9.5</p>
						</span>
					</span>
					<span className="flex items-center">
						<Icon className="h-4 w-4" icon="lucide:circle-dollar-sign" />
						<span className="ml-2 flex flex-col justify-around py-1 align-middle">
							<p className="text-xs">Principal</p>
							<p className="font-bold text-sm">350K</p>
						</span>
					</span>
				</Card.Content>
				<Card.Footer className="mt-auto flex w-full flex-row items-center justify-between">
					<div className="flex flex-col">
						<span
							aria-label="Principal loan: 350,000 US dollars"
							className="font-medium text-foreground text-sm"
						>
							Maturity
						</span>
						<span className="text-foreground/50 text-xs">01/01/2026</span>
					</div>
					<Button variant="secondary">View details</Button>
				</Card.Footer>
			</div>
		</Card.Root>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Vertical property listing card with blurred header and footer overlays, displaying location, title, and key financial metrics.",
			},
		},
	},
};

export const MobileGlassCard: Story = {
	args: undefined as never,
	render: () => (
		<Card.Root
			className="relative h-96 min-h-[384px] w-80 min-w-[320px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10 md:h-[450px] md:w-96"
		>
			{/* Background Image */}
			<img
				alt="Malibu Beach Detached thumbnail"
				className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
				loading="lazy"
				src="/house.jpg"
			/>

			{/* Frosted Glass Header - Title & Location */}
			<Card.Header className="absolute top-0 right-0 left-0 z-10 gap-1 border-white/10 border-b bg-black/30 p-4 shadow-lg backdrop-blur-xl dark:bg-black/30">
				<div className="relative w-full">
					{/* Inner glow effect */}
					<div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent" />

					<div className="relative z-10">
						<Card.Title className="line-clamp-1 font-semibold text-white text-xl tracking-tight drop-shadow-lg">
							Malibu Beach Detached
						</Card.Title>
						<Card.Description className="line-clamp-1 flex items-center gap-1 text-sm text-white/85 drop-shadow-md">
							<Icon className="h-3.5 w-3.5" icon="lucide:map-pin" />
							Malibu, CA • Single Family Detached
						</Card.Description>
					</div>
				</div>
			</Card.Header>

			{/* Content area with gradient overlay */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20" />

			{/* Frosted Glass Footer - Maturity & Button */}
			<Card.Footer className="absolute right-0 bottom-0 left-0 z-10 flex-row items-center justify-between border-white/10 border-t bg-black/30 p-4 shadow-lg backdrop-blur-xl dark:bg-black/30">
				<div className="relative w-full">
					{/* Inner glow effect */}
					<div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-white/10 to-transparent" />

					<div className="relative z-10 flex w-full items-center justify-between">
						<div className="flex flex-col">
							<span className="font-medium text-sm text-white drop-shadow-md">
								Maturity
							</span>
							<span className="text-white/85 text-xs drop-shadow-sm">
								01/01/2026
							</span>
						</div>

						<Button
							className="h-8 rounded-lg border border-white/30 bg-white/25 px-3 font-semibold text-white text-xs shadow-lg backdrop-blur-md transition hover:bg-white/35 active:scale-[0.98] dark:bg-white/20"
							variant="secondary"
						>
							View details
						</Button>
					</div>
				</div>
			</Card.Footer>
		</Card.Root>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Mobile-optimized card with frosted glass nu-morphic design. Closer-to-square aspect ratio, absolute header/footer overlays, refined typography and spacing, and improved readability using gradients and glass effects on HeroUI Card components.",
			},
		},
	},
};

export const MobileGlassCardSmall: Story = {
	args: undefined as never,
	render: () => (
		<Card.Root
			className="relative h-80 min-h-[320px] w-64 min-w-[256px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10"
		>
			{/* Background Image */}
			<img
				alt="Malibu Beach Detached thumbnail"
				className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
				loading="lazy"
				src="/house.jpg"
			/>

			{/* Frosted Glass Header - Title & Location */}
			<Card.Header className="z-10 gap-1 rounded-2xl bg-black/20 p-3 shadow-lg backdrop-blur">
				<div className="relative w-full">
					{/* Inner glow effect */}
					<div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b/30 from-white/10 to-transparent" />

					<div className="relative z-10">
						<Card.Title className="line-clamp-1 font-semibold text-lg text-white tracking-tight drop-shadow-lg">
							Malibu Beach Detached
						</Card.Title>
						<Card.Description className="flex items-center justify-start text-white/85 text-xs drop-shadow-md">
							<Icon className="h-3 w-3" icon="lucide:map-pin" />
							Malibu, CA • Single Family
						</Card.Description>
					</div>
				</div>
			</Card.Header>

			{/* Content area with gradient overlay */}
			{/*<div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-black/20 pointer-events-none" />*/}

			{/* Frosted Glass Footer - Maturity & Button */}
			<Card.Footer className="absolute right-0 bottom-0 left-0 z-10 flex-row items-center justify-between p-3">
				<div className="relative w-full">
					{/* Inner glow effect */}
					<div className="-inset-2 pointer-events-none absolute rounded-full bg-black/20 backdrop-blur" />

					<div className="relative z-10 flex w-full items-center justify-between">
						<div className="flex flex-col">
							<span className="font-medium text-white text-xs drop-shadow-md">
								Maturity
							</span>
							<span className="text-white/85 text-xs drop-shadow-sm">
								01/01/2026
							</span>
						</div>

						<Button
							className="h-8 rounded-lg border border-white/30 bg-white/25 px-3 font-semibold text-white text-xs shadow-lg backdrop-blur-md transition hover:bg-white/35 active:scale-[0.98] dark:bg-white/20"
							variant="secondary"
						>
							View details
						</Button>
					</div>
				</div>
			</Card.Footer>
			<div className="grid grid-cols-3 items-center justify-center gap-2 align-middle text-muted-foreground text-sm">
				<span className="flex items-center">
					<Icon className="h-4 w-4" icon="lucide:percent-circle" />
					<span className="ml-2 flex flex-col justify-around py-1 align-middle">
						<p className="text-xs">LTV</p>
						<p className="font-bold text-sm">80</p>
					</span>
				</span>
				<span className="flex items-center">
					<Icon className="h-4 w-4" icon="lucide:percent-circle" />
					<span className="ml-2 flex flex-col justify-around py-1 align-middle">
						<p className="text-xs">APR</p>
						<p className="font-bold text-sm">9.5</p>
					</span>
				</span>
				<span className="flex items-center">
					<Icon className="h-4 w-4" icon="lucide:circle-dollar-sign" />
					<span className="ml-2 flex flex-col justify-around py-1 align-middle">
						<p className="text-xs">Principal</p>
						<p className="font-bold text-sm">350K</p>
					</span>
				</span>
			</div>
		</Card.Root>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Smaller mobile glass card variant for compact spaces, maintaining all styling but with reduced dimensions and typography.",
			},
		},
	},
};

export const MobileGlassCardLarge: Story = {
	args: undefined as never,
	render: () => (
		<Card.Root
			className="relative h-[500px] min-h-[500px] w-[400px] min-w-[400px] overflow-hidden rounded-2xl shadow-xl ring-1 ring-white/10"
		>
			{/* Background Image */}
			<img
				alt="Malibu Beach Detached thumbnail"
				className="pointer-events-none absolute inset-0 h-full w-full select-none object-cover"
				loading="lazy"
				src="/house.jpg"
			/>

			{/* Frosted Glass Header - Title & Location */}
			<Card.Header className="absolute top-0 right-0 left-0 z-10 gap-1 border-white/10 border-b bg-black/30 p-5 shadow-lg backdrop-blur-xl dark:bg-black/30">
				<div className="relative w-full">
					{/* Inner glow effect */}
					<div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-b from-white/10 to-transparent" />

					<div className="relative z-10">
						<Card.Title className="line-clamp-1 font-semibold text-2xl text-white tracking-tight drop-shadow-lg">
							Malibu Beach Detached
						</Card.Title>
						<Card.Description className="line-clamp-1 flex items-center gap-1 text-base text-white/85 drop-shadow-md">
							<Icon className="h-4 w-4" icon="lucide:map-pin" />
							Malibu, CA • Single Family Detached
						</Card.Description>
					</div>
				</div>
			</Card.Header>

			{/* Content area with financial metrics */}
			<div className="absolute inset-x-4 top-32 z-10">
				<div className="rounded-xl border border-white/20 bg-white/15 p-4 shadow-lg backdrop-blur-md dark:bg-white/10">
					<div className="grid grid-cols-3 gap-3">
						<div className="text-center">
							<Icon
								className="mx-auto mb-1 h-5 w-5 text-white/90"
								icon="lucide:percent-circle"
							/>
							<p className="text-white/70 text-xs">LTV</p>
							<p className="font-bold text-lg text-white drop-shadow-md">80</p>
						</div>
						<div className="text-center">
							<Icon
								className="mx-auto mb-1 h-5 w-5 text-white/90"
								icon="lucide:percent-circle"
							/>
							<p className="text-white/70 text-xs">APR</p>
							<p className="font-bold text-lg text-white drop-shadow-md">9.5</p>
						</div>
						<div className="text-center">
							<Icon
								className="mx-auto mb-1 h-5 w-5 text-white/90"
								icon="lucide:circle-dollar-sign"
							/>
							<p className="text-white/70 text-xs">Principal</p>
							<p className="font-bold text-lg text-white drop-shadow-md">
								350K
							</p>
						</div>
					</div>
				</div>
			</div>

			{/* Gradient overlay for depth */}
			<div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/60 via-transparent to-transparent" />

			{/* Frosted Glass Footer - Maturity & Button */}
			<Card.Footer className="absolute right-0 bottom-0 left-0 z-10 flex-row items-center justify-between border-white/10 border-t bg-black/30 p-5 shadow-lg backdrop-blur-xl dark:bg-black/30">
				<div className="relative w-full">
					{/* Inner glow effect */}
					<div className="pointer-events-none absolute inset-0 rounded-lg bg-gradient-to-t from-white/10 to-transparent" />

					<div className="relative z-10 flex w-full items-center justify-between">
						<div className="flex flex-col">
							<span className="font-medium text-base text-white drop-shadow-md">
								Maturity
							</span>
							<span className="text-sm text-white/85 drop-shadow-sm">
								01/01/2026
							</span>
						</div>

						<Button
							className="h-10 rounded-xl border border-white/30 bg-white/25 px-6 font-semibold text-white shadow-lg backdrop-blur-md transition hover:bg-white/35 active:scale-[0.98] dark:bg-white/20"
							variant="secondary"
						>
							View details
						</Button>
					</div>
				</div>
			</Card.Footer>
		</Card.Root>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Large mobile glass card variant with expanded content area, financial metrics display, and enhanced typography for premium devices and tablets.",
			},
		},
	},
};
