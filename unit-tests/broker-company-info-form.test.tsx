import { describe, expect, it, vi } from "vitest";

// ============================================
// Top-level regex patterns for performance
// ============================================

const CONTINUE_BUTTON_REGEX = /continue/i;
const COMPANY_NAME_REGEX = /company name/i;
const REG_NUMBER_REGEX = /registration number/i;
const STREET_ADDRESS_REGEX = /street address/i;
const CITY_REGEX = /^city/i;
const STATE_REGEX = /state\/province/i;
const POSTAL_REGEX = /postal\/zip code/i;
const PHONE_REGEX = /business phone/i;
const EMAIL_REGEX = /business email/i;

import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { BrokerCompanyInfoForm } from "@/components/onboarding/flows/broker/BrokerFlow";

describe("BrokerCompanyInfoForm", () => {
	it("shows required errors when submitting empty form", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		render(<BrokerCompanyInfoForm busy={false} onSubmit={onSubmit} />);

		await user.click(
			screen.getByRole("button", { name: CONTINUE_BUTTON_REGEX })
		);

		expect(
			await screen.findByText("Company name is required")
		).toBeInTheDocument();
		expect(
			screen.getByText("Registration number is required")
		).toBeInTheDocument();
		expect(screen.getByText("Street address is required")).toBeInTheDocument();
		expect(screen.getByText("City is required")).toBeInTheDocument();
		expect(screen.getByText("State/Province is required")).toBeInTheDocument();
		expect(screen.getByText("Postal/ZIP code is required")).toBeInTheDocument();
		expect(screen.getByText("Business phone is required")).toBeInTheDocument();
		expect(screen.getByText("Business email is required")).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits when required fields are valid", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		render(<BrokerCompanyInfoForm busy={false} onSubmit={onSubmit} />);

		await user.type(
			screen.getByLabelText(COMPANY_NAME_REGEX),
			"Northwind Brokers"
		);
		await user.type(screen.getByLabelText(REG_NUMBER_REGEX), "REG-99881");
		await user.type(screen.getByLabelText(STREET_ADDRESS_REGEX), "123 King St");
		await user.type(screen.getByLabelText(CITY_REGEX), "Toronto");
		await user.type(screen.getByLabelText(STATE_REGEX), "ON");
		await user.type(screen.getByLabelText(POSTAL_REGEX), "M5V 2T6");
		await user.type(screen.getByLabelText(PHONE_REGEX), "416-555-0100");
		await user.type(
			screen.getByLabelText(EMAIL_REGEX),
			"ops@northwind.example"
		);

		await waitFor(() => {
			expect(
				screen.getByRole("button", { name: CONTINUE_BUTTON_REGEX })
			).toBeEnabled();
		});

		await user.click(
			screen.getByRole("button", { name: CONTINUE_BUTTON_REGEX })
		);

		await waitFor(() => {
			expect(onSubmit).toHaveBeenCalledWith(
				expect.objectContaining({
					companyName: "Northwind Brokers",
					registrationNumber: "REG-99881",
					businessPhone: "416-555-0100",
					businessEmail: "ops@northwind.example",
				})
			);
		});
	});
});
