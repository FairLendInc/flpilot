import type { Meta, StoryObj } from "@storybook/react";
import { PaymentHistory } from "@/components/listing-detail/payment-history";
import { generatePayments } from "@/lib/mock-data/listings";

const meta: Meta<typeof PaymentHistory> = {
	title: "Listing Detail/PaymentHistory",
	component: PaymentHistory,
	parameters: {
		layout: "centered",
		docs: {
			description: {
				component:
					"Interactive payment history table showing payment status, amounts, dates, and types. Perfect for tracking loan payments and investment performance.",
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

export const Default: Story = {
	args: {
		payments: generatePayments("default-loan", 12),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Standard payment history showing mix of paid, pending, and late payments over 12 months.",
			},
		},
	},
};

export const MixedStatuses: Story = {
	args: {
		payments: generatePayments("mixed-status-loan", 18),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Extended payment history showing various payment statuses including on-time, late, and pending payments.",
			},
		},
	},
};

export const AllPaid: Story = {
	render: () => {
		const payments = generatePayments("perfect-loan", 24);
		// Ensure all payments are marked as paid
		const allPaidPayments = payments.map((payment) => ({
			...payment,
			status: "paid" as const,
		}));

		return <PaymentHistory payments={allPaidPayments} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Perfect payment history with all payments made on time - shows ideal borrower behavior.",
			},
		},
	},
};

export const WithLatePayments: Story = {
	render: () => {
		const payments = generatePayments("late-loan", 15);
		// Ensure some payments are marked as late
		const paymentsWithLate = payments.map((payment, index) => {
			if (index === 3 || index === 7 || index === 11) {
				return { ...payment, status: "late" as const };
			}
			return payment;
		});

		return <PaymentHistory payments={paymentsWithLate} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Payment history with late payments - shows realistic scenario with occasional payment delays.",
			},
		},
	},
};

export const EmptyHistory: Story = {
	args: {
		payments: [],
	},
	parameters: {
		docs: {
			description: {
				story:
					"Empty payment history for new loans or properties with no payment history yet.",
			},
		},
	},
};

export const SinglePayment: Story = {
	args: {
		payments: generatePayments("single-payment", 1),
	},
	parameters: {
		docs: {
			description: {
				story:
					"New loan with only first payment made - shows beginning of payment history.",
			},
		},
	},
};

export const HighValuePayments: Story = {
	render: () => {
		const payments = generatePayments("high-value-loan", 12);
		// Increase payment amounts for high-value property
		const highValuePayments = payments.map((payment) => ({
			...payment,
			amount:
				payment.type === "principal"
					? payment.amount * 3
					: payment.type === "interest"
						? payment.amount * 2.5
						: payment.amount * 2,
		}));

		return <PaymentHistory payments={highValuePayments} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Payment history for high-value property with larger payment amounts reflecting luxury real estate financing.",
			},
		},
	},
};

export const RecentPayments: Story = {
	args: {
		payments: generatePayments("recent-loan", 6),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Recent payment history showing last 6 months of payment activity.",
			},
		},
	},
};

export const LongHistory: Story = {
	args: {
		payments: generatePayments("long-history-loan", 36),
	},
	parameters: {
		docs: {
			description: {
				story:
					"Extended payment history showing 3 years of payment patterns and trends. Automatically paginated with 5 items per page.",
			},
		},
	},
};

export const LongHistoryCustomPagination: Story = {
	args: {
		payments: generatePayments("custom-pagination-loan", 50),
		itemsPerPage: 10,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Large payment history with custom pagination showing 10 items per page. Demonstrates pagination controls with many pages.",
			},
		},
	},
};

export const PaginationEdgeCase: Story = {
	args: {
		payments: generatePayments("edge-case-loan", 6),
		itemsPerPage: 5,
	},
	parameters: {
		docs: {
			description: {
				story:
					"Payment history with exactly 6 payments (requires 2 pages with 5 items per page). Tests pagination with minimal pages.",
			},
		},
	},
};

export const WithPendingPayments: Story = {
	render: () => {
		const payments = generatePayments("pending-loan", 12);
		// Set recent payments to pending
		const paymentsWithPending = payments.map((payment, index) => {
			if (index < 3) {
				return { ...payment, status: "pending" as const };
			}
			return payment;
		});

		return <PaymentHistory payments={paymentsWithPending} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Payment history with recent pending payments - shows current payment processing status.",
			},
		},
	},
};

export const DifferentPaymentTypes: Story = {
	render: () => {
		const payments = generatePayments("typed-loan", 9);
		// Ensure good distribution of payment types
		const typedPayments = payments.map((payment, index) => ({
			...payment,
			type: (["principal", "interest", "escrow"] as const)[index % 3],
		}));

		return <PaymentHistory payments={typedPayments} />;
	},
	parameters: {
		docs: {
			description: {
				story:
					"Payment history showing clear distribution of principal, interest, and escrow payments.",
			},
		},
	},
};
