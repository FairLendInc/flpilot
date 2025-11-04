import type { Meta, StoryObj } from "@storybook/react";
import { ProfileFormFields } from "../components/ProfileFormFields";

const meta: Meta<typeof ProfileFormFields> = {
	title: "Profile/ProfileFormFields",
	component: ProfileFormFields,
};

export default meta;
type Story = StoryObj<typeof ProfileFormFields>;

export const Default: Story = {
	args: {
		firstName: "John",
		lastName: "Doe",
		email: "john.doe@example.com",
		phone: "+1 (555) 123-4567",
		isSaving: false,
		onFirstNameChange: (value: string) => console.log("First name:", value),
		onLastNameChange: (value: string) => console.log("Last name:", value),
		onPhoneChange: (value: string) => console.log("Phone:", value),
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			console.log("Submit form");
		},
	},
};

export const Saving: Story = {
	args: {
		firstName: "John",
		lastName: "Doe",
		email: "john.doe@example.com",
		phone: "+1 (555) 123-4567",
		isSaving: true,
		onFirstNameChange: (value: string) => console.log("First name:", value),
		onLastNameChange: (value: string) => console.log("Last name:", value),
		onPhoneChange: (value: string) => console.log("Phone:", value),
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			console.log("Submit form");
		},
	},
};

export const EmptyFields: Story = {
	args: {
		firstName: "",
		lastName: "",
		email: "user@example.com",
		phone: "",
		isSaving: false,
		onFirstNameChange: (value: string) => console.log("First name:", value),
		onLastNameChange: (value: string) => console.log("Last name:", value),
		onPhoneChange: (value: string) => console.log("Phone:", value),
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			console.log("Submit form");
		},
	},
};

export const WithLongValues: Story = {
	args: {
		firstName: "Christopher",
		lastName: "Johnson-Smith",
		email: "christopher.johnson-smith.verylongemail@example.com",
		phone: "+1 (555) 123-4567 ext. 1234",
		isSaving: false,
		onFirstNameChange: (value: string) => console.log("First name:", value),
		onLastNameChange: (value: string) => console.log("Last name:", value),
		onPhoneChange: (value: string) => console.log("Phone:", value),
		onSubmit: (e: React.FormEvent<HTMLFormElement>) => {
			e.preventDefault();
			console.log("Submit form");
		},
	},
};
