import { beforeEach, describe, expect, test } from "vitest";
import {
	useListingCreationStore,
	validateListingForm,
} from "@/app/(auth)/dashboard/admin/listings/new/useListingCreationStore";

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

	// Comparable tests
	test("adds comparable to store", () => {
		const store = useListingCreationStore.getState();
		store.addComparable({
			address: {
				street: "123 Main St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
			saleAmount: "500000",
			saleDate: "2023-12-15",
			distance: "0.5",
		});
		const { comparables } = useListingCreationStore.getState();
		expect(comparables).toHaveLength(1);
		expect(comparables[0]?.address.street).toBe("123 Main St");
	});

	test("updates comparable in store", () => {
		useListingCreationStore.getState().addComparable({
			address: {
				street: "123 Main St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
			saleAmount: "500000",
			saleDate: "2023-12-15",
			distance: "0.5",
		});
		const stateBeforeUpdate = useListingCreationStore.getState();
		useListingCreationStore.getState().updateComparable(0, {
			saleAmount: "550000",
			address: { ...stateBeforeUpdate.comparables[0].address, city: "Ottawa" },
		});
		const { comparables } = useListingCreationStore.getState();
		expect(comparables[0]?.saleAmount).toBe("550000");
		expect(comparables[0]?.address.city).toBe("Ottawa");
	});

	test("removes comparable from store", () => {
		const store = useListingCreationStore.getState();
		store.addComparable({
			address: {
				street: "123 Main St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
			saleAmount: "500000",
			saleDate: "2023-12-15",
			distance: "0.5",
		});
		store.addComparable({
			address: {
				street: "456 Oak Ave",
				city: "Toronto",
				state: "ON",
				zip: "M5K 1L9",
			},
			saleAmount: "520000",
			saleDate: "2023-11-20",
			distance: "0.8",
		});
		store.removeComparable(0);
		const { comparables } = useListingCreationStore.getState();
		expect(comparables).toHaveLength(1);
		expect(comparables[0]?.address.street).toBe("456 Oak Ave");
	});

	test("validateListingForm requires at least one comparable", () => {
		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors.comparables).toBe("At least one comparable is required");
	});

	test("validateListingForm validates comparable required fields", () => {
		const store = useListingCreationStore.getState();
		store.addComparable({
			address: { street: "", city: "", state: "", zip: "" },
			saleAmount: "",
			saleDate: "",
			distance: "",
		});
		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors["comparables.0.address.street"]).toBe("Street is required");
		expect(errors["comparables.0.address.city"]).toBe("City is required");
		expect(errors["comparables.0.saleAmount"]).toBe(
			"Sale amount must be a positive number"
		);
	});

	test("validateListingForm validates comparable numeric constraints", () => {
		const store = useListingCreationStore.getState();
		store.addComparable({
			address: {
				street: "123 Main St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
			saleAmount: "-100000",
			saleDate: "2030-01-01",
			distance: "-1",
			squareFeet: "-100",
			bedrooms: "-2",
			bathrooms: "-1",
		});
		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors["comparables.0.saleAmount"]).toBe(
			"Sale amount must be a positive number"
		);
		expect(errors["comparables.0.saleDate"]).toBe(
			"Sale date cannot be in the future"
		);
		expect(errors["comparables.0.distance"]).toBe(
			"Distance must be 0 or greater"
		);
		expect(errors["comparables.0.squareFeet"]).toBe(
			"Square feet must be positive"
		);
		expect(errors["comparables.0.bedrooms"]).toBe(
			"Bedrooms must be 0 or greater"
		);
		expect(errors["comparables.0.bathrooms"]).toBe(
			"Bathrooms must be 0 or greater"
		);
	});

	test("validateListingForm passes with valid comparables", () => {
		const store = useListingCreationStore.getState();
		store.addComparable({
			address: {
				street: "123 Main St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
			saleAmount: "500000",
			saleDate: "2023-12-15",
			distance: "0.5",
			squareFeet: "1800",
			bedrooms: "3",
			bathrooms: "2",
			propertyType: "Townhouse",
		});
		// Add other required fields
		store.setBorrowerField("name", "Taylor Fairlend");
		store.setBorrowerField("email", "taylor@example.com");
		store.setBorrowerField("rotessaCustomerId", "rotessa_123");
		store.setMortgageField("loanAmount", "450000");
		store.setMortgageField("interestRate", "5.25");
		store.setMortgageField("ltv", "75");
		store.setMortgageField("status", "active");
		store.setMortgageField("mortgageType", "1st");
		store.setMortgageField("externalMortgageId", "ext-123");
		store.setMortgageField("propertyType", "Townhouse");
		store.setMortgageField("appraisalMarketValue", "540000");
		store.setMortgageField("appraisalMethod", "Sales Comparison");
		store.setMortgageField("appraisalCompany", "WebHook Appraisals");
		store.setMortgageField("originationDate", "2024-01-01");
		store.setMortgageField("maturityDate", "2034-01-01");
		store.setMortgageField("appraisalDate", "2024-01-01");
		store.setMortgageAddressField("street", "123 Property St");
		store.setMortgageAddressField("city", "Toronto");
		store.setMortgageAddressField("state", "ON");
		store.setMortgageAddressField("zip", "M5J 2N1");
		store.setMortgageAddressField("country", "Canada");
		store.setMortgageLocationField("lat", "45.4215");
		store.setMortgageLocationField("lng", "-75.6972");

		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors.comparables).toBeUndefined();
	});

	test("validateListingForm limits comparable count to 10", () => {
		const store = useListingCreationStore.getState();
		// Add 11 comparables (exceeds limit)
		for (let i = 0; i < 11; i += 1) {
			store.addComparable({
				address: {
					street: `123 ${i} St`,
					city: "Toronto",
					state: "ON",
					zip: "M5J 2N1",
				},
				saleAmount: "500000",
				saleDate: "2023-12-15",
				distance: "0.5",
			});
		}
		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors.comparables).toBe("Maximum 10 comparables allowed");
	});

	test("validateListingForm accepts up to 10 comparables", () => {
		const store = useListingCreationStore.getState();
		// Add exactly 10 comparables (at the limit)
		for (let i = 0; i < 10; i += 1) {
			store.addComparable({
				address: {
					street: `123 ${i} St`,
					city: "Toronto",
					state: "ON",
					zip: "M5J 2N1",
				},
				saleAmount: "500000",
				saleDate: "2023-12-15",
				distance: "0.5",
			});
		}
		const state = useListingCreationStore.getState();
		const errors = validateListingForm(state);
		expect(errors.comparables).toBeUndefined();
	});

	test("reset clears all comparables", () => {
		const store = useListingCreationStore.getState();
		store.addComparable({
			address: {
				street: "123 Main St",
				city: "Toronto",
				state: "ON",
				zip: "M5J 2N1",
			},
			saleAmount: "500000",
			saleDate: "2023-12-15",
			distance: "0.5",
		});
		store.reset();
		const { comparables } = useListingCreationStore.getState();
		expect(comparables).toHaveLength(0);
	});
});
