import type { Meta, StoryObj } from "@storybook/nextjs-vite";
import { fn } from "storybook/test";
import {
	MortgageManagementTable,
	type MortgageData,
} from "@/components/admin/mortgages/MortgageManagementTable";
import type { Id } from "@/convex/_generated/dataModel";

const meta = {
	title: "Dashboard/Admin/Mortgages/Management Table",
	component: MortgageManagementTable,
	parameters: {
		layout: "padded",
		docs: {
			description: {
				component:
					"Table component for managing mortgages. Provides inline edit/delete actions with status indicators. Only accessible to users with admin role. This component is used in the admin mortgages management page.",
			},
		},
	},
	tags: ["autodocs"],
	argTypes: {
		mortgages: {
			control: "object",
			description: "Array of mortgages to display",
		},
		onEdit: {
			action: "onEdit",
			description: "Callback when edit button is clicked (receives mortgage object)",
		},
		onDelete: {
			action: "onDelete",
			description:
				"Callback when delete button is clicked (receives mortgage ID and address)",
		},
	},
	args: {
		onEdit: fn(),
		onDelete: fn(),
	},
} satisfies Meta<typeof MortgageManagementTable>;

export default meta;
type Story = StoryObj<typeof meta>;

const mockMortgages: MortgageData[] = [
	{
		_id: "k17mortgage001" as Id<"mortgages">,
		borrowerId: "k17borrower001" as Id<"borrowers">,
		borrower: { name: "John Doe", email: "john.doe@example.com" },
		loanAmount: 475000,
		interestRate: 5.5,
		status: "active",
		address: {
			street: "789 Integration Ave",
			city: "Ottawa",
			state: "ON",
			zip: "K1A0B1",
			country: "Canada",
		},
		maturityDate: "2034-01-15",
	},
	{
		_id: "k17mortgage002" as Id<"mortgages">,
		borrowerId: "k17borrower002" as Id<"borrowers">,
		borrower: { name: "Jane Smith", email: "jane.smith@example.com" },
		loanAmount: 650000,
		interestRate: 6.25,
		status: "active",
		address: {
			street: "123 Admin St",
			city: "Toronto",
			state: "ON",
			zip: "M5J 2N1",
			country: "Canada",
		},
		maturityDate: "2033-06-20",
	},
	{
		_id: "k17mortgage003" as Id<"mortgages">,
		borrowerId: "k17borrower003" as Id<"borrowers">,
		borrower: { name: "Bob Johnson", email: "bob.johnson@example.com" },
		loanAmount: 820000,
		interestRate: 4.75,
		status: "closed",
		address: {
			street: "456 Test Blvd",
			city: "Vancouver",
			state: "BC",
			zip: "V6B 1A1",
			country: "Canada",
		},
		maturityDate: "2025-03-10",
	},
	{
		_id: "k17mortgage004" as Id<"mortgages">,
		borrowerId: "k17borrower004" as Id<"borrowers">,
		borrower: { name: "Alice Williams", email: "alice.williams@example.com" },
		loanAmount: 550000,
		interestRate: 7.0,
		status: "defaulted",
		address: {
			street: "999 Default Lane",
			city: "Montreal",
			state: "QC",
			zip: "H2X 1Y2",
			country: "Canada",
		},
		maturityDate: "2032-09-15",
	},
];

/**
 * Default state with multiple mortgages in various statuses.
 * Shows typical admin view with active, closed, and defaulted mortgages.
 */
export const Default: Story = {
	args: {
		mortgages: mockMortgages,
	},
};

/**
 * Empty state when no mortgages exist.
 * Shows helpful message to admin user.
 */
export const EmptyState: Story = {
	args: {
		mortgages: [],
	},
};

/**
 * All active mortgages.
 * Simplest scenario for admin operations.
 */
export const AllActive: Story = {
	args: {
		mortgages: [
			{
				_id: "k17mortgage001" as Id<"mortgages">,
				borrowerId: "k17borrower001" as Id<"borrowers">,
				borrower: { name: "John Doe", email: "john.doe@example.com" },
				loanAmount: 500000,
				interestRate: 5.25,
				status: "active",
				address: {
					street: "100 Main St",
					city: "City",
					state: "ST",
					zip: "12345",
					country: "USA",
				},
				maturityDate: "2034-01-01",
			},
			{
				_id: "k17mortgage002" as Id<"mortgages">,
				borrowerId: "k17borrower002" as Id<"borrowers">,
				borrower: { name: "Jane Smith", email: "jane.smith@example.com" },
				loanAmount: 600000,
				interestRate: 5.5,
				status: "active",
				address: {
					street: "200 Oak Ave",
					city: "Town",
					state: "ST",
					zip: "23456",
					country: "USA",
				},
				maturityDate: "2033-06-15",
			},
		],
	},
};

/**
 * Mixed status mortgages.
 * Shows how different status badges appear.
 */
export const MixedStatuses: Story = {
	args: {
		mortgages: [
			{
				_id: "k17mortgage001" as Id<"mortgages">,
				borrowerId: "k17borrower001" as Id<"borrowers">,
				borrower: { name: "John Doe", email: "john.doe@example.com" },
				loanAmount: 500000,
				interestRate: 5.0,
				status: "active",
				address: {
					street: "100 Active St",
					city: "City",
					state: "ST",
					zip: "12345",
					country: "USA",
				},
				maturityDate: "2034-01-01",
			},
			{
				_id: "k17mortgage002" as Id<"mortgages">,
				borrowerId: "k17borrower002" as Id<"borrowers">,
				borrower: { name: "Jane Smith", email: "jane.smith@example.com" },
				loanAmount: 450000,
				interestRate: 5.5,
				status: "renewed",
				address: {
					street: "200 Renewed Ave",
					city: "Town",
					state: "ST",
					zip: "23456",
					country: "USA",
				},
				maturityDate: "2035-03-15",
			},
			{
				_id: "k17mortgage003" as Id<"mortgages">,
				borrowerId: "k17borrower003" as Id<"borrowers">,
				borrower: { name: "Bob Johnson", email: "bob.johnson@example.com" },
				loanAmount: 400000,
				interestRate: 6.0,
				status: "closed",
				address: {
					street: "300 Closed Blvd",
					city: "Village",
					state: "ST",
					zip: "34567",
					country: "USA",
				},
				maturityDate: "2024-12-31",
			},
			{
				_id: "k17mortgage004" as Id<"mortgages">,
				borrowerId: "k17borrower004" as Id<"borrowers">,
				borrower: { name: "Alice Williams", email: "alice.williams@example.com" },
				loanAmount: 550000,
				interestRate: 7.5,
				status: "defaulted",
				address: {
					street: "400 Defaulted Way",
					city: "Borough",
					state: "ST",
					zip: "45678",
					country: "USA",
				},
				maturityDate: "2032-06-30",
			},
		],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Shows all four possible mortgage statuses: active (blue), renewed (purple), closed (gray), and defaulted (red).",
			},
		},
	},
};

/**
 * Many mortgages scenario.
 * Shows how the table handles larger datasets.
 */
export const ManyMortgages: Story = {
	args: {
		mortgages: Array.from({ length: 10 }, (_, i) => ({
			_id: `k17mortgage${String(i).padStart(3, "0")}` as Id<"mortgages">,
			borrowerId: `k17borrower${String(i).padStart(3, "0")}` as Id<"borrowers">,
			borrower: {
				name: `Borrower ${i + 1}`,
				email: `borrower${i + 1}@example.com`,
			},
			loanAmount: 400000 + i * 50000,
			interestRate: 4.5 + i * 0.25,
			status: (["active", "renewed", "closed", "defaulted"] as const)[i % 4],
			address: {
				street: `${100 + i * 100} Sample St`,
				city: `City ${i}`,
				state: "ST",
				zip: String(i).padStart(5, "0"),
				country: "USA",
			},
			maturityDate: `${2030 + i}-01-${String(i + 1).padStart(2, "0")}`,
		})),
	},
};

/**
 * Single mortgage.
 * Minimal example showing key features.
 */
export const SingleMortgage: Story = {
	args: {
		mortgages: [mockMortgages[0]],
	},
};

/**
 * Authorization example - only admin users should see this table.
 * Non-admin users should see an access denied message.
 */
export const AdminOnly: Story = {
	args: {
		mortgages: mockMortgages,
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
