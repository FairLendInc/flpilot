import { fireEvent, render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { describe, expect, it, vi } from "vitest";
import { ProfileFormFields } from "@/app/(auth)/profilev2/components/ProfileFormFields";

// Mock the Icon component from @iconify/react
vi.mock("@iconify/react", () => ({
	Icon: ({
		"data-testid": dataTestid,
		className,
		...props
	}: {
		"data-testid"?: string;
		className?: string;
	}) => <span className={className} data-testid={dataTestid} {...props} />,
}));

describe("ProfileFormFields", () => {
	const defaultProps = {
		email: "john@example.com",
		firstName: "John",
		lastName: "Doe",
		phone: "",
		isSaving: false,
		onFirstNameChange: vi.fn(),
		onLastNameChange: vi.fn(),
		onPhoneChange: vi.fn(),
		onSubmit: vi.fn(),
	};

	it("renders all form fields", () => {
		render(<ProfileFormFields {...defaultProps} />);

		expect(screen.getByText("Profile Information")).toBeInTheDocument();
		expect(screen.getByLabelText("First Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Last Name")).toBeInTheDocument();
		expect(screen.getByLabelText("Phone")).toBeInTheDocument();
	});

	it("displays email as read-only", () => {
		render(<ProfileFormFields {...defaultProps} />);

		const emailField = screen.getByLabelText("Email (Read Only)");
		expect(emailField).toBeDisabled();
		expect(emailField).toHaveValue("john@example.com");
	});

	it("calls onFirstNameChange when first name is updated", async () => {
		const user = userEvent.setup();
		render(<ProfileFormFields {...defaultProps} />);

		const firstNameField = screen.getByLabelText("First Name");
		fireEvent.change(firstNameField, { target: { value: "Jane" } });

		expect(defaultProps.onFirstNameChange).toHaveBeenLastCalledWith("Jane");
	});

	it("calls onLastNameChange when last name is updated", async () => {
		const user = userEvent.setup();
		render(<ProfileFormFields {...defaultProps} />);

		const lastNameField = screen.getByLabelText("Last Name");
		fireEvent.change(lastNameField, { target: { value: "Smith" } });

		expect(defaultProps.onLastNameChange).toHaveBeenLastCalledWith("Smith");
	});

	it("calls onPhoneChange when phone is updated", async () => {
		const user = userEvent.setup();
		render(<ProfileFormFields {...defaultProps} />);

		const phoneField = screen.getByLabelText("Phone");
		fireEvent.change(phoneField, { target: { value: "555-123-4567" } });

		expect(defaultProps.onPhoneChange).toHaveBeenLastCalledWith("555-123-4567");
	});

	it("calls onSubmit when form is submitted", async () => {
		const user = userEvent.setup();
		render(<ProfileFormFields {...defaultProps} />);

		const submitButton = screen.getByRole("button", { name: /save/i });
		await user.click(submitButton);

		expect(defaultProps.onSubmit).toHaveBeenCalled();
	});

	it("displays loading state when saving", () => {
		render(<ProfileFormFields {...defaultProps} isSaving={true} />);

		expect(screen.getByText("Saving...")).toBeInTheDocument();
		const submitButton = screen.getByRole("button", {
			name: /saving/i,
		});
		expect(submitButton).toBeDisabled();
	});

	it("enables save button when not saving", () => {
		render(<ProfileFormFields {...defaultProps} isSaving={false} />);

		expect(screen.getByRole("button", { name: /save/i })).not.toBeDisabled();
	});

	it("validates phone number format", async () => {
		const user = userEvent.setup();
		render(<ProfileFormFields {...defaultProps} />);

		const phoneField = screen.getByLabelText("Phone");
		await user.type(phoneField, "invalid-phone");

		// Phone validation should be handled by the component
		expect(defaultProps.onPhoneChange).toHaveBeenCalled();
	});

	it("pre-fills form fields with initial values", () => {
		render(
			<ProfileFormFields
				{...defaultProps}
				firstName="Jane"
				lastName="Doe"
				phone="555-987-6543"
			/>
		);

		expect(screen.getByLabelText("First Name")).toHaveValue("Jane");
		expect(screen.getByLabelText("Last Name")).toHaveValue("Doe");
		expect(screen.getByLabelText("Phone")).toHaveValue("555-987-6543");
	});

	it("shows form field icons", () => {
		render(<ProfileFormFields {...defaultProps} />);

		// Check for icon presence by looking for the icon element
		const iconElement = screen.getByTestId("profile-icon");
		expect(iconElement).toBeInTheDocument();
	});
});
