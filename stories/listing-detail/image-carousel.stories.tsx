import type { Meta, StoryObj } from "@storybook/react";
import { ImageCarousel } from "@/components/listing-detail/image-carousel";

const meta: Meta<typeof ImageCarousel> = {
	title: "Listing Detail/ImageCarousel",
	component: ImageCarousel,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"An interactive image carousel with navigation arrows, thumbnail navigation, and keyboard support. Perfect for property listings with multiple photos.",
			},
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

// Sample images for testing
const sampleImages = [
	{
		url: "https://picsum.photos/seed/property1/800/600",
		alt: "Modern kitchen with island",
		order: 0,
	},
	{
		url: "https://picsum.photos/seed/property2/800/600",
		alt: "Spacious living room with natural light",
		order: 1,
	},
	{
		url: "https://picsum.photos/seed/property3/800/600",
		alt: "Master bedroom with walk-in closet",
		order: 2,
	},
	{
		url: "https://picsum.photos/seed/property4/800/600",
		alt: "Luxury bathroom with modern fixtures",
		order: 3,
	},
	{
		url: "https://picsum.photos/seed/property5/800/600",
		alt: "Outdoor patio with garden view",
		order: 4,
	},
];

export const Default: Story = {
	args: {
		images: sampleImages,
		propertyTitle: "Luxury Oceanfront Villa",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Default image carousel with multiple property photos, navigation arrows, and thumbnail strip.",
			},
		},
	},
};

export const MultipleImages: Story = {
	args: {
		images: [
			...sampleImages,
			{
				url: "https://picsum.photos/seed/property6/800/600",
				alt: "Home office with built-in shelves",
				order: 5,
			},
			{
				url: "https://picsum.photos/seed/property7/800/600",
				alt: "Two-car garage with storage",
				order: 6,
			},
		],
		propertyTitle: "Modern Downtown Loft",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Carousel with many images showing full navigation functionality with counter and thumbnails.",
			},
		},
	},
};

export const SingleImage: Story = {
	args: {
		images: [
			{
				url: "https://picsum.photos/seed/single-property/800/600",
				alt: "Stunning ocean view from balcony",
				order: 0,
			},
		],
		propertyTitle: "Beachside Bungalow",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Single image property - navigation arrows and thumbnails are hidden when only one image is available.",
			},
		},
	},
};

export const NoImages: Story = {
	args: {
		images: [],
		propertyTitle: "Mountain View Estate",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Empty state when no images are available - shows placeholder with icon and message.",
			},
		},
	},
};

export const WithKeyboardNavigation: Story = {
	args: {
		images: sampleImages,
		propertyTitle: "Historic Victorian Mansion",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Use arrow keys (← →) to navigate through images. Fully accessible with keyboard support.",
			},
		},
	},
};

export const MinimalImages: Story = {
	args: {
		images: [
			{
				url: "https://picsum.photos/seed/minimal1/800/600",
				alt: "Cozy living space",
				order: 0,
			},
			{
				url: "https://picsum.photos/seed/minimal2/800/600",
				alt: "Compact kitchen",
				order: 1,
			},
		],
		propertyTitle: "Urban Penthouse Suite",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property with just two images - still shows full navigation functionality.",
			},
		},
	},
};

export const LargePropertyTitle: Story = {
	args: {
		images: sampleImages,
		propertyTitle:
			"Extraordinary Luxury Mediterranean Villa with Panoramic Ocean Views and Private Beach Access in Malibu Colony",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Testing accessibility with very long property titles for proper screen reader announcements.",
			},
		},
	},
};
