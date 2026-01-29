import { render, screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { BrokerCompanyInfoForm } from "@/components/onboarding/OnboardingExperience";

describe("BrokerCompanyInfoForm", () => {
	it("shows required errors when submitting empty form", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		render(<BrokerCompanyInfoForm busy={false} onSubmit={onSubmit} />);

		await user.click(screen.getByRole("button", { name: /continue/i }));

		expect(
			await screen.findByText("Company name is required")
		).toBeInTheDocument();
		expect(
			screen.getByText("Registration number is required")
		).toBeInTheDocument();
		expect(
			screen.getByText("Street address is required")
		).toBeInTheDocument();
		expect(screen.getByText("City is required")).toBeInTheDocument();
		expect(
			screen.getByText("State/Province is required")
		).toBeInTheDocument();
		expect(
			screen.getByText("Postal/ZIP code is required")
		).toBeInTheDocument();
		expect(
			screen.getByText("Business phone is required")
		).toBeInTheDocument();
		expect(
			screen.getByText("Business email is required")
		).toBeInTheDocument();
		expect(onSubmit).not.toHaveBeenCalled();
	});

	it("submits when required fields are valid", async () => {
		const onSubmit = vi.fn().mockResolvedValue(undefined);
		const user = userEvent.setup();

		render(<BrokerCompanyInfoForm busy={false} onSubmit={onSubmit} />);

		await user.type(
			screen.getByLabelText(/company name/i),
			"Northwind Brokers"
		);
		await user.type(
			screen.getByLabelText(/registration number/i),
			"REG-99881"
		);
		await user.type(screen.getByLabelText(/street address/i), "123 King St");
		await user.type(screen.getByLabelText(/^city/i), "Toronto");
		await user.type(screen.getByLabelText(/state\/province/i), "ON");
		await user.type(screen.getByLabelText(/postal\/zip code/i), "M5V 2T6");
		await user.type(
			screen.getByLabelText(/business phone/i),
			"416-555-0100"
		);
		await user.type(
			screen.getByLabelText(/business email/i),
			"ops@northwind.example"
		);

		await waitFor(() => {
			expect(screen.getByRole("button", { name: /continue/i })).toBeEnabled();
		});

		await user.click(screen.getByRole("button", { name: /continue/i }));

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
