import type { Meta, StoryObj } from "@storybook/react";
import { AirbnbListingCard } from "@/components/ui/airbnb-card";

const meta: Meta<typeof AirbnbListingCard> = {
	title: "UI/AirbnbListingCard",
	component: AirbnbListingCard,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Airbnb-style property card with image carousel, rating, location, host info, and pricing. Features touch/swipe navigation and favorite functionality.",
			},
		},
	},
	decorators: [
		(Story) => (
			<div className="w-full max-w-md p-4">
				<Story />
			</div>
		),
	],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
	args: {
		title: "Cozy Beachside Cottage",
		location: "Malibu, California",
		host: "Sarah",
		images: [
			"https://picsum.photos/seed/airbnb1/400/400",
			"https://picsum.photos/seed/airbnb2/400/400",
			"https://picsum.photos/seed/airbnb3/400/400",
		],
		rating: 4.8,
		reviewCount: 127,
		price: 185,
		perNight: true,
		dates: "Mar 15-20",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Standard Airbnb-style card with image carousel, rating, location, and pricing.",
			},
		},
	},
};

export const DifferentRatings: Story = {
	render: () => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-2 font-medium text-sm">Excellent (5.0)</h3>
				<AirbnbListingCard
					dates="Apr 1-5"
					host="Michael"
					id="1"
					images={["https://picsum.photos/seed/perfect1/400/400"]}
					location="Miami Beach, Florida"
					perNight={true}
					price={450}
					rating={5.0}
					reviewCount={89}
					title="Luxury Penthouse Suite"
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Very Good (4.2)</h3>
				<AirbnbListingCard
					dates="May 10-15"
					host="Jennifer"
					id="2"
					images={["https://picsum.photos/seed/good2/400/400"]}
					location="Austin, Texas"
					perNight={true}
					price={220}
					rating={4.2}
					reviewCount={34}
					title="Modern Downtown Loft"
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Fair (3.5)</h3>
				<AirbnbListingCard
					dates="Jun 20-25"
					host="David"
					id="3"
					images={["https://picsum.photos/seed/fair3/400/400"]}
					location="Seattle, Washington"
					perNight={true}
					price={95}
					rating={3.5}
					reviewCount={12}
					title="Budget Studio Apartment"
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Cards showing different rating levels from excellent to fair with corresponding review counts.",
			},
		},
	},
};

export const VariousPrices: Story = {
	render: () => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-2 font-medium text-sm">Budget ($75/night)</h3>
				<AirbnbListingCard
					dates="Jul 1-7"
					host="Lisa"
					id="4"
					images={["https://picsum.photos/seed/budget1/400/400"]}
					location="Portland, Oregon"
					perNight={true}
					price={75}
					rating={4.1}
					reviewCount={23}
					title="Shared Room in Cozy House"
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Mid-Range ($175/night)</h3>
				<AirbnbListingCard
					dates="Aug 12-18"
					host="Robert"
					id="5"
					images={["https://picsum.photos/seed/mid2/400/400"]}
					location="Denver, Colorado"
					perNight={true}
					price={175}
					rating={4.6}
					reviewCount={156}
					title="Entire Apartment"
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Luxury ($550/night)</h3>
				<AirbnbListingCard
					dates="Sep 5-10"
					host="Patricia"
					id="6"
					images={["https://picsum.photos/seed/luxury3/400/400"]}
					location="Laguna Beach, California"
					perNight={true}
					price={550}
					rating={4.9}
					reviewCount={203}
					title="Oceanfront Villa"
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Properties across different price ranges from budget shared rooms to luxury villas.",
			},
		},
	},
};

export const NoReviews: Story = {
	args: {
		title: "Brand New Listing",
		location: "Nashville, Tennessee",
		host: "Tom",
		images: ["https://picsum.photos/seed/new1/400/400"],
		rating: 0,
		reviewCount: 0,
		price: 140,
		perNight: true,
		dates: "Oct 15-20",
		isNew: true,
	},
	parameters: {
		docs: {
			description: {
				story: "New property listing without any ratings or reviews yet.",
			},
		},
	},
};

export const Superhost: Story = {
	args: {
		title: "Designer Downtown Apartment",
		location: "New York, New York",
		host: "Emma",
		images: [
			"https://picsum.photos/seed/super1/400/400",
			"https://picsum.photos/seed/super2/400/400",
			"https://picsum.photos/seed/super3/400/400",
			"https://picsum.photos/seed/super4/400/400",
		],
		rating: 4.9,
		reviewCount: 284,
		price: 325,
		perNight: true,
		dates: "Nov 1-6",
		isSuperhost: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Superhost property with excellent ratings and verified host status.",
			},
		},
	},
};

export const MultipleImages: Story = {
	args: {
		title: "Stunning Mountain Retreat",
		location: "Aspen, Colorado",
		host: "William",
		images: [
			"https://picsum.photos/seed/mountain1/400/400",
			"https://picsum.photos/seed/mountain2/400/400",
			"https://picsum.photos/seed/mountain3/400/400",
			"https://picsum.photos/seed/mountain4/400/400",
			"https://picsum.photos/seed/mountain5/400/400",
			"https://picsum.photos/seed/mountain6/400/400",
		],
		rating: 4.7,
		reviewCount: 156,
		price: 425,
		perNight: true,
		dates: "Dec 20-27",
		isSuperhost: true,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property with many images showing full carousel functionality with navigation indicators.",
			},
		},
	},
};

export const WithCategory: Story = {
	args: {
		title: "Beachfront Bungalow",
		location: "San Diego, California",
		host: "Maria",
		images: [
			"https://picsum.photos/seed/beach1/400/400",
			"https://picsum.photos/seed/beach2/400/400",
		],
		rating: 4.6,
		reviewCount: 89,
		price: 275,
		perNight: true,
		dates: "Jan 10-15",
		category: "Beachfront",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property with category classification showing type of accommodation.",
			},
		},
	},
};

export const MonthlyStay: Story = {
	args: {
		title: "Extended Stay Apartment",
		location: "Phoenix, Arizona",
		host: "James",
		images: ["https://picsum.photos/seed/monthly1/400/400"],
		rating: 4.4,
		reviewCount: 45,
		price: 2800,
		perNight: false,
		dates: "Feb 1 - Feb 28",
		category: "Monthly stay",
	},
	parameters: {
		docs: {
			description: {
				story:
					"Property offered for monthly stay with different pricing structure.",
			},
		},
	},
};

export const DifferentCategories: Story = {
	render: () => (
		<div className="space-y-6">
			<div>
				<h3 className="mb-2 font-medium text-sm">Cabin</h3>
				<AirbnbListingCard
					category="Cabin"
					dates="Mar 1-5"
					host="Chris"
					id="7"
					images={["https://picsum.photos/seed/cabin1/400/400"]}
					location="Lake Tahoe, California"
					perNight={true}
					price={195}
					rating={4.5}
					reviewCount={67}
					title="Rustic Mountain Cabin"
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Treehouse</h3>
				<AirbnbListingCard
					category="Treehouse"
					dates="Apr 10-12"
					host="Alex"
					id="8"
					images={["https://picsum.photos/seed/tree1/400/400"]}
					location="Portland, Oregon"
					perNight={true}
					price={225}
					rating={4.9}
					reviewCount={34}
					title="Luxury Treehouse Retreat"
				/>
			</div>
			<div>
				<h3 className="mb-2 font-medium text-sm">Farm stay</h3>
				<AirbnbListingCard
					category="Farm stay"
					dates="May 15-18"
					host="Sophie"
					id="9"
					images={["https://picsum.photos/seed/farm1/400/400"]}
					location="Napa Valley, California"
					perNight={true}
					price={180}
					rating={4.7}
					reviewCount={28}
					title="Organic Farm Experience"
				/>
			</div>
		</div>
	),
	parameters: {
		docs: {
			description: {
				story:
					"Various property categories showing different types of unique accommodations.",
			},
		},
	},
};
