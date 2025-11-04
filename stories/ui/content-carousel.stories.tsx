import type { Meta, StoryObj } from "@storybook/react";
import { ContentCarousel } from "@/components/ui/content-carousel";

const meta: Meta<typeof ContentCarousel> = {
	title: "UI/ContentCarousel",
	component: ContentCarousel,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Flexible content carousel component for displaying images, cards, or any custom content with navigation controls.",
			},
		},
	},
	argTypes: {
		items: {
			description: "Array of items to display in carousel",
		},
		className: {
			control: { type: "text" },
			description: "Additional CSS classes",
		},
		onItemChange: {
			action: "changed",
			description: "Callback when item changes",
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-4xl p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample items for testing
const sampleItems = [
	{
		name: "Mountain Vista",
		description: "Breathtaking mountain views with pristine landscapes",
		image: "https://picsum.photos/seed/mountain1/400/300",
	},
	{
		name: "Ocean Paradise",
		description: "Crystal clear waters and sandy beaches",
		image: "https://picsum.photos/seed/ocean2/400/300",
	},
	{
		name: "Forest Retreat",
		description: "Peaceful forest escape surrounded by nature",
		image: "https://picsum.photos/seed/forest3/400/300",
	},
	{
		name: "Desert Oasis",
		description: "Hidden paradise in the heart of the desert",
		image: "https://picsum.photos/seed/desert4/400/300",
	},
	{
		name: "City Lights",
		description: "Urban skyline with vibrant city lights",
		image: "https://picsum.photos/seed/city5/400/300",
	},
];

export const Default: Story = {
	args: {
		items: sampleItems,
	},
	parameters: {
		docs: {
			description: {
				story: "Default carousel with sample content items.",
			},
		},
	},
};

export const CustomContent: Story = {
	args: {
		items: [
			{
				name: "Feature One",
				description: "Amazing feature with gradient background",
				content: (
					<div className="rounded-lg bg-gradient-to-r from-blue-500 to-purple-600 p-8 text-center text-white">
						<h3 className="mb-2 font-bold text-2xl">Feature One</h3>
						<p className="opacity-90">
							Amazing feature with gradient background
						</p>
					</div>
				),
			},
			{
				name: "Feature Two",
				description: "Another great feature with green theme",
				content: (
					<div className="rounded-lg bg-gradient-to-r from-green-500 to-teal-600 p-8 text-center text-white">
						<h3 className="mb-2 font-bold text-2xl">Feature Two</h3>
						<p className="opacity-90">Another great feature with green theme</p>
					</div>
				),
			},
			{
				name: "Feature Three",
				description: "Third feature with warm colors",
				content: (
					<div className="rounded-lg bg-gradient-to-r from-orange-500 to-red-600 p-8 text-center text-white">
						<h3 className="mb-2 font-bold text-2xl">Feature Three</h3>
						<p className="opacity-90">Third feature with warm colors</p>
					</div>
				),
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story: "Carousel with custom content components instead of images.",
			},
		},
	},
};

export const TestimonialCarousel: Story = {
	args: {
		items: [
			{
				name: "John Doe",
				description: "CEO, Tech Corp",
				content: (
					<div className="rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100">
							<span className="font-bold text-blue-600 text-xl">JD</span>
						</div>
						<p className="mb-4 text-gray-600 italic dark:text-gray-400">
							"This product completely transformed our workflow. Highly
							recommended!"
						</p>
						<p className="font-semibold">John Doe</p>
						<p className="text-gray-500 text-sm">CEO, Tech Corp</p>
					</div>
				),
			},
			{
				name: "Sarah Miller",
				description: "Designer, Creative Studio",
				content: (
					<div className="rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100">
							<span className="font-bold text-green-600 text-xl">SM</span>
						</div>
						<p className="mb-4 text-gray-600 italic dark:text-gray-400">
							"Outstanding quality and exceptional customer service. A game
							changer!"
						</p>
						<p className="font-semibold">Sarah Miller</p>
						<p className="text-gray-500 text-sm">Designer, Creative Studio</p>
					</div>
				),
			},
			{
				name: "Robert Johnson",
				description: "Manager, Startup Inc",
				content: (
					<div className="rounded-lg bg-white p-6 text-center shadow-lg dark:bg-gray-800">
						<div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-purple-100">
							<span className="font-bold text-purple-600 text-xl">RJ</span>
						</div>
						<p className="mb-4 text-gray-600 italic dark:text-gray-400">
							"Innovative solution that solved our biggest challenges.
							Absolutely love it!"
						</p>
						<p className="font-semibold">Robert Johnson</p>
						<p className="text-gray-500 text-sm">Manager, Startup Inc</p>
					</div>
				),
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Testimonial carousel with customer reviews and profile information.",
			},
		},
	},
};

export const ProductShowcase: Story = {
	args: {
		items: [
			{
				name: "Premium Laptop",
				description: "High-performance laptop for professionals",
				price: "$1,299",
				badge: "Best Seller",
				image: "https://picsum.photos/seed/laptop1/400/300",
			},
			{
				name: "Wireless Headphones",
				description: "Premium noise-cancelling headphones",
				price: "$299",
				badge: "New",
				image: "https://picsum.photos/seed/headphones2/400/300",
			},
			{
				name: "Smart Watch",
				description: "Advanced fitness and health tracking",
				price: "$399",
				badge: "Popular",
				image: "https://picsum.photos/seed/watch3/400/300",
			},
			{
				name: "Tablet Pro",
				description: "Professional tablet for creative work",
				price: "$799",
				badge: "Premium",
				image: "https://picsum.photos/seed/tablet4/400/300",
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story: "Product showcase carousel with pricing and badges.",
			},
		},
	},
};

export const ImageGallery: Story = {
	args: {
		items: [
			{
				name: "Landscape Photography",
				description: "Stunning mountain landscape at sunset",
				image: "https://picsum.photos/seed/gallery1/600/400",
			},
			{
				name: "Architecture",
				description: "Modern building with glass facade",
				image: "https://picsum.photos/seed/gallery2/600/400",
			},
			{
				name: "Nature Close-up",
				description: "Detailed macro photography of flowers",
				image: "https://picsum.photos/seed/gallery3/600/400",
			},
			{
				name: "Urban Scene",
				description: "Busy city street with vibrant life",
				image: "https://picsum.photos/seed/gallery4/600/400",
			},
			{
				name: "Abstract Art",
				description: "Colorful abstract composition",
				image: "https://picsum.photos/seed/gallery5/600/400",
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story: "Image gallery carousel with beautiful photography.",
			},
		},
	},
};

export const MinimalItems: Story = {
	args: {
		items: sampleItems.slice(0, 3),
	},
	parameters: {
		docs: {
			description: {
				story: "Carousel with minimal number of items for compact display.",
			},
		},
	},
};
