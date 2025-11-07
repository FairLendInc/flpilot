import { beforeEach, describe, expect, test } from "vitest";
import {
	useListingCreationStore,
	validateListingForm,
} from "@/app/dashboard/admin/listings/new/useListingCreationStore";

describe("listing creation store", () => {
	beforeEach(() => {
		useListingCreationStore.getState().reset();
	});

	test("updates borrower field and clears validation error", () => {
		const store = useListingCreationStore.getState();
		store.setErrors({ "borrower.name": "Name required" });
		useListingCreationStore.getState().setBorrowerField("name", "Taylor");
		const nextState = useListingCreationStore.getState();
		expect(nextState.borrower.name).toBe("Taylor");
		expect(nextState.errors["borrower.name"]).toBeUndefined();
	});

	test("removes image and normalizes order", () => {
		const store = useListingCreationStore.getState();
		store.addImage({ storageId: "img-1", alt: "", order: 0 });
		store.addImage({ storageId: "img-2", alt: "", order: 1 });
		useListingCreationStore.getState().removeImage(0);
		const { images } = useListingCreationStore.getState();
		expect(images).toHaveLength(1);
		expect(images[0]?.storageId).toBe("img-2");
		expect(images[0]?.order).toBe(0);
	});

	test("validateListingForm flags missing required fields", () => {
		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors["borrower.name"]).toBeDefined();
		expect(errors["mortgage.loanAmount"]).toBeDefined();
		expect(errors["mortgage.externalMortgageId"]).toBeDefined();
	});
});
