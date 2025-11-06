import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
	ListingManagementTable,
	type ListingWithMortgage,
} from "@/components/admin/listings/ListingManagementTable";
import type { Id } from "@/convex/_generated/dataModel";

const meta = {
	title: "Dashboard/Admin/Listings/Management Table",
	component: ListingManagementTable,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Table component for managing marketplace listings. Provides inline edit/delete actions with visual status indicators. Only accessible to users with admin role. This component is used in the admin listings management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		listings: {
			control: "object",
			description: "Array of listings with mortgage data to display",
		},
		onEdit: {
			action: "onEdit",
			description:
				"Callback when edit button is clicked (receives listing ID, visible state, locked state)",
		},
		onDelete: {
			action: "onDelete",
			description:
				"Callback when delete button is clicked (receives listing ID, address, locked state)",
		},
	},
	args: {
		onEdit: fn(),
		onDelete: fn(),
	},
} satisfies Meta<typeof ListingManagementTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockListings: ListingWithMortgage[] = [
	{
		listing: {
			_id: "k17abc123def456" as Id<"listings">,
			mortgageId: "k17mortgage001" as Id<"mortgages">,
			visible: true,
			locked: false,
			_creationTime: Date.parse("2024-01-15"),
		},
		mortgage: {
			_id: "k17mortgage001" as Id<"mortgages">,
			loanAmount: 475000,
			status: "active",
			address: {
				street: "789 Integration Ave",
				city: "Ottawa",
				state: "ON",
				zip: "K1A0B1",
			},
		},
	},
	{
		listing: {
			_id: "k17def456ghi789" as Id<"listings">,
			mortgageId: "k17mortgage002" as Id<"mortgages">,
			visible: true,
			locked: true,
			_creationTime: Date.parse("2024-02-20"),
		},
		mortgage: {
			_id: "k17mortgage002" as Id<"mortgages">,
			loanAmount: 650000,
			status: "active",
			address: {
				street: "123 Admin St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
		},
	},
	{
		listing: {
			_id: "k17ghi789jkl012" as Id<"listings">,
			mortgageId: "k17mortgage003" as Id<"mortgages">,
			visible: false,
			locked: false,
			_creationTime: Date.parse("2024-03-10"),
		},
		mortgage: {
			_id: "k17mortgage003" as Id<"mortgages">,
			loanAmount: 820000,
			status: "active",
			address: {
				street: "456 Test Blvd",
				city: "Vancouver",
				state: "BC",
				zip: "V6B 1A1",
			},
		},
	},
];

/**
 * Default state with multiple listings in various states.
 * Shows typical admin view with visible, hidden, locked, and unlocked listings.
 */
export const Default: Story = {
	args: {
		listings: mockListings,
	},
};

/**
 * Empty state when no listings exist.
 * Shows helpful message to admin user.
 */
export const EmptyState: Story = {
	args: {
		listings: [],
	},
};

/**
 * All listings visible and unlocked.
 * Simplest scenario for admin operations.
 */
export const AllVisibleUnlocked: Story = {
	args: {
		listings: [
			{
				listing: {
					_id: "k17abc001" as Id<"listings">,
					mortgageId: "k17mortgage001" as Id<"mortgages">,
					visible: true,
					locked: false,
					_creationTime: Date.parse("2024-01-01"),
				},
				mortgage: {
					_id: "k17mortgage001" as Id<"mortgages">,
					loanAmount: 500000,
					status: "active",
					address: {
						street: "100 Main St",
						city: "City",
						state: "ST",
						zip: "12345",
					},
				},
			},
			{
				listing: {
					_id: "k17abc002" as Id<"listings">,
					mortgageId: "k17mortgage002" as Id<"mortgages">,
					visible: true,
					locked: false,
					_creationTime: Date.parse("2024-01-02"),
				},
				mortgage: {
					_id: "k17mortgage002" as Id<"mortgages">,
					loanAmount: 600000,
					status: "active",
					address: {
						street: "200 Oak Ave",
						city: "Town",
						state: "ST",
						zip: "23456",
					},
				},
			},
		],
	},
};

/**
 * All listings locked.
 * Shows warning indicators for all locked entries.
 */
export const AllLocked: Story = {
	args: {
		listings: [
			{
				listing: {
					_id: "k17abc001" as Id<"listings">,
					mortgageId: "k17mortgage001" as Id<"mortgages">,
					visible: true,
					locked: true,
					_creationTime: Date.parse("2024-01-01"),
				},
				mortgage: {
					_id: "k17mortgage001" as Id<"mortgages">,
					loanAmount: 500000,
					status: "active",
					address: {
						street: "100 Main St",
						city: "City",
						state: "ST",
						zip: "12345",
					},
				},
			},
			{
				listing: {
					_id: "k17abc002" as Id<"listings">,
					mortgageId: "k17mortgage002" as Id<"mortgages">,
					visible: false,
					locked: true,
					_creationTime: Date.parse("2024-01-02"),
				},
				mortgage: {
					_id: "k17mortgage002" as Id<"mortgages">,
					loanAmount: 600000,
					status: "active",
					address: {
						street: "200 Oak Ave",
						city: "Town",
						state: "ST",
						zip: "23456",
					},
				},
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Locked listings require the force flag to delete. Edit operations work normally, but deletion requires explicit force confirmation.",
			},
		},
	},
};

/**
 * Mixed state with many listings.
 * Shows how the table handles larger datasets.
 */
export const ManyListings: Story = {
	args: {
		listings: Array.from({ length: 10 }, (_, i) => ({
			listing: {
				_id: `k17listing${String(i).padStart(3, "0")}` as Id<"listings">,
				mortgageId: `k17mortgage${String(i).padStart(3, "0")}` as Id<"mortgages">,
				visible: i % 3 !== 0,
				locked: i % 4 === 0,
				_creationTime: Date.parse(`2024-01-${String(i + 1).padStart(2, "0")}`),
			},
			mortgage: {
				_id: `k17mortgage${String(i).padStart(3, "0")}` as Id<"mortgages">,
				loanAmount: 400000 + i * 50000,
				status: "active",
				address: {
					street: `${100 + i * 100} Sample St`,
					city: `City ${i}`,
					state: "ST",
					zip: String(i).padStart(5, "0"),
				},
			},
		})),
	},
};

/**
 * Single listing with all details visible.
 * Minimal example showing key features.
 */
export const SingleListing: Story = {
	args: {
		listings: [mockListings[0]],
	},
};

/**
 * Authorization example - only admin users should see this table.
 * Non-admin users should see an access denied message.
 */
export const AdminOnly: Story = {
	args: {
		listings: mockListings,
	},
	parameters: {
		docs: {
			description: {
				story:
					"This table is only accessible to users with admin role. All mutations validate admin privileges using hasRbacAccess.",
			},
		},
	},
};
