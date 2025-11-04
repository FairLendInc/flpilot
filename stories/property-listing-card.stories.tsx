import type { Meta, StoryObj } from "@storybook/react";

// Mock function for callbacks
const fn = () => () => {};

import { AirbnbListingCard } from "@/components/property-listing-card";

const meta: Meta<typeof AirbnbListingCard> = {
	title: "Components/PropertyListingCard",
	component: AirbnbListingCard,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"An Airbnb-style property listing card with image carousel, ratings, pricing, and interactive features.",
			},
		},
	},
	argTypes: {
		id: {
			control: "text",
			description: "Unique identifier for the listing",
		},
		title: {
			control: "text",
			description: "Title of the property listing",
		},
		location: {
			control: "text",
			description: "Location of the property",
		},
		host: {
			control: "text",
			description: "Name of the host",
		},
		images: {
			control: { type: "object" },
			description: "Array of image URLs for the carousel",
		},
		rating: {
			control: { type: "range", min: 0, max: 5, step: 0.1 },
			description: "Rating of the property (0-5)",
		},
		reviewCount: {
			control: { type: "range", min: 0, max: 1000, step: 1 },
			description: "Number of reviews",
		},
		price: {
			control: { type: "number", min: 0, step: 10 },
			description: "Price of the listing",
		},
		perNight: {
			control: "boolean",
			description: "Whether price is per night",
		},
		dates: {
			control: "text",
			description: "Available dates string",
		},
		isSuperhost: {
			control: "boolean",
			description: "Whether the host is a superhost",
		},
		isNew: {
			control: "boolean",
			description: "Whether this is a new listing",
		},
		category: {
			control: "text",
			description: "Category of the property",
		},
	},
};

export default meta;
type Story = StoryObj<typeof meta>;

// Sample image URLs for stories
const sampleImages = [
	"https://images.unsplash.com/photo-1560448204-e02f11c3d0e2?w=400&h=400&fit=crop",
	"https://images.unsplash.com/photo-1520250497591-112f2f40a3f4?w=400&h=400&fit=crop",
	"https://images.unsplash.com/photo-1566073771259-6a8506099945?w=400&h=400&fit=crop",
	"https://images.unsplash.com/photo-1570129477492-45c003edd2be?w=400&h=400&fit=crop",
];

// Default story
export const Default: Story = {
	args: {
		id: "1",
		title: "Cozy Beach House",
		location: "Malibu, California",
		host: "Sarah Johnson",
		images: [sampleImages[0]],
		rating: 4.8,
		reviewCount: 127,
		price: 250,
		perNight: true,
		dates: "Nov 15-20",
		category: "Beach house",
	},
};

// Multi-image carousel
export const MultiImageCarousel: Story = {
	args: {
		id: "2",
		title: "Modern Downtown Apartment",
		location: "New York, New York",
		host: "Michael Chen",
		images: sampleImages,
		rating: 4.9,
		reviewCount: 342,
		price: 450,
		perNight: true,
		dates: "Dec 1-5",
		category: "Apartment",
	},
};

// Superhost listing
export const Superhost: Story = {
	args: {
		id: "3",
		title: "Luxury Mountain Retreat",
		location: "Aspen, Colorado",
		host: "Emily Rodriguez",
		images: [sampleImages[1]],
		rating: 5.0,
		reviewCount: 89,
		price: 650,
		perNight: true,
		dates: "Jan 10-15",
		isSuperhost: true,
		category: "Mountain cabin",
	},
};

// New listing
export const NewListing: Story = {
	args: {
		id: "4",
		title: "Charming Cottage",
		location: "Portland, Oregon",
		host: "David Kim",
		images: [sampleImages[2]],
		rating: 4.6,
		reviewCount: 12,
		price: 180,
		perNight: true,
		dates: "Feb 20-25",
		isNew: true,
		category: "Cottage",
	},
};

// Superhost + New listing
export const SuperhostAndNew: Story = {
	args: {
		id: "5",
		title: "Urban Loft",
		location: "San Francisco, California",
		host: "Lisa Wang",
		images: [sampleImages[3]],
		rating: 4.9,
		reviewCount: 28,
		price: 380,
		perNight: true,
		dates: "Mar 5-10",
		isSuperhost: true,
		isNew: true,
		category: "Loft",
	},
};

// Budget-friendly option
export const BudgetFriendly: Story = {
	args: {
		id: "6",
		title: "Simple Room",
		location: "Austin, Texas",
		host: "James Miller",
		images: [sampleImages[0]],
		rating: 4.2,
		reviewCount: 45,
		price: 65,
		perNight: true,
		dates: "Apr 1-7",
		category: "Private room",
	},
};

// Premium luxury listing
export const PremiumLuxury: Story = {
	args: {
		id: "7",
		title: "Villa Paradise",
		location: "Miami Beach, Florida",
		host: "Roberto Silva",
		images: sampleImages,
		rating: 4.95,
		reviewCount: 567,
		price: 1250,
		perNight: true,
		dates: "May 15-22",
		isSuperhost: true,
		category: "Villa",
	},
};

// Monthly rental (not per night)
export const MonthlyRental: Story = {
	args: {
		id: "8",
		title: "Cozy Studio",
		location: "Seattle, Washington",
		host: "Anna Thompson",
		images: [sampleImages[2]],
		rating: 4.7,
		reviewCount: 203,
		price: 2800,
		perNight: false,
		dates: "Jun 1 - Jul 31",
		category: "Studio apartment",
	},
};

// No reviews yet
export const NoReviews: Story = {
	args: {
		id: "9",
		title: "Hidden Gem",
		location: "Nashville, Tennessee",
		host: "Tom Wilson",
		images: [sampleImages[1]],
		rating: 0,
		reviewCount: 0,
		price: 195,
		perNight: true,
		dates: "Jul 10-15",
		isNew: true,
		category: "House",
	},
};

// Responsive design showcase
export const ResponsiveDesign: Story = {
	args: {
		id: "19",
		title: "Responsive Test Property",
		location: "Test City, Test State",
		host: "Test Host",
		images: [sampleImages[0]],
		rating: 4.8,
		reviewCount: 123,
		price: 350,
		dates: "Nov 1-7",
		isSuperhost: true,
		category: "Test property",
	},
};
