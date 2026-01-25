import { render, screen } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { MICCashHealthCard } from "@/components/admin/mic/widgets/MICCashHealthCard";
import { InvestorTransactionTable } from "@/components/admin/mic/InvestorTransactionTable";

describe("MIC widgets", () => {
	it("shows N/A when cash target is unconfigured", () => {
		render(<MICCashHealthCard balance={1000} target={0} />);
		expect(screen.getByText("N/A")).toBeInTheDocument();
	});

	it("renders invalid date fallback in transaction table", () => {
		render(
			<InvestorTransactionTable
				data={[
					{
						id: "tx-1",
						type: "subscription",
						description: "Test",
						timestamp: "invalid-date",
						amount: 10,
						balanceAfter: 0,
					},
				]}
			/>
		);

		expect(screen.getByText("Invalid date")).toBeInTheDocument();
	});
});
