import type { Meta, StoryObj } from "@storybook/react";
import { FormErrorSummary } from "@/app/dashboard/admin/listings/new/FormErrorSummary";

const meta: Meta<typeof FormErrorSummary> = {
	title: "Dashboard/Admin/Listing Creation/FormErrorSummary",
	component: FormErrorSummary,
	args: {
		errors: {
			"borrower.name": "Borrower name is required",
			"mortgage.loanAmount": "Loan amount must be a positive number",
			"mortgage.externalMortgageId": "External mortgage ID is required for webhook idempotency",
		},
	},
};

export default meta;
type Story = StoryObj<typeof FormErrorSummary>;

export const Default: Story = {};

export const ManyErrors: Story = {
	args: {
		errors: {
			"borrower.name": "Borrower name is required",
			"borrower.email": "Borrower email must be valid",
			"mortgage.loanAmount": "Loan amount must be a positive number",
			"mortgage.appraisalDate": "Appraisal date cannot be in the future",
			"mortgage.address.street": "Street is required",
			"listing.visible": "Listing visibility must be specified",
		},
	},
};
