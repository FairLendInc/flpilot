/**
 * Unit tests for mortgage transformation utilities
 */

import { describe, expect, it } from "vitest";
import {
	transformComparables,
	transformMortgageToAppraisal,
	transformMortgageToDocuments,
	transformMortgageToFinancials,
	transformMortgageToImages,
	transformPayments,
} from "@/lib/transforms/mortgage";
import type {
	AppraisalComparableWithUrl,
	MortgageWithUrls,
	Payment,
} from "@/lib/types/convex";

describe("mortgage transformations", () => {
	const mockMortgage: MortgageWithUrls = {
		_id: "test-mortgage-id" as any,
		_creationTime: Date.now(),
		address: {
			street: "123 Test St",
			city: "Test City",
			state: "TS",
			zip: "12345",
			country: "USA",
		},
		location: { lat: 0, lng: 0 },
		borrowerId: "test-borrower" as any,
		loanAmount: 500000,
		interestRate: 5.5,
		originationDate: "2024-01-01",
		maturityDate: "2030-01-01",
		propertyType: "Residential - Condo",
		status: "active",
		mortgageType: "1st",
		ltv: 75,
		appraisalMarketValue: 650000,
		appraisalMethod: "comparative",
		appraisalCompany: "Test Appraisals Inc",
		appraisalDate: "2024-01-01",
		priorEncumbrance: undefined,
		asIfAppraisal: undefined,
		images: [
			{
				storageId: "storage-1" as any,
				url: "https://example.com/image1.jpg",
				alt: "Front view",
				order: 0,
			},
			{
				storageId: "storage-2" as any,
				url: null,
				alt: undefined,
				order: 1,
			},
		],
		documents: [
			{
				storageId: "doc-1" as any,
				url: "https://example.com/doc1.pdf",
				name: "Appraisal Report",
				type: "appraisal",
				uploadDate: "2024-01-01",
				fileSize: 1024000,
			},
		],
	};

	describe("transformMortgageToImages", () => {
		it("should transform mortgage images with URLs", () => {
			const result = transformMortgageToImages(mockMortgage);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				url: "https://example.com/image1.jpg",
				alt: "Front view",
				order: 0,
			});
		});

		it("should generate storage URL when URL is null", () => {
			const result = transformMortgageToImages(mockMortgage);

			expect(result[1].url).toBe("/api/storage/storage-2");
		});

		it("should generate alt text when alt is null", () => {
			const result = transformMortgageToImages(mockMortgage);

			expect(result[1].alt).toBe("Property view 2");
		});
	});

	describe("transformMortgageToFinancials", () => {
		it("should transform mortgage to financial metrics", () => {
			const result = transformMortgageToFinancials(mockMortgage);

			expect(result).toEqual({
				purchasePrice: 650000,
				currentValue: 650000,
				monthlyPayment: 2292, // (500000 * 0.055) / 12 rounded
				interestRate: 5.5,
				loanTerm: 12,
				maturityDate: "2030-01-01",
				principalLoanAmount: 500000,
				propertyType: "Residential - Condo",
				ltv: 75,
				mortgageType: "1st Position",
				priorEncumbrance: null,
				asIfAppraisal: null,
			});
		});

		it("should format mortgage type correctly", () => {
			const mortgage1st = { ...mockMortgage, mortgageType: "1st" as const };
			const mortgage2nd = { ...mockMortgage, mortgageType: "2nd" as const };
			const mortgageOther = {
				...mockMortgage,
				mortgageType: "3rd" as any,
			};

			expect(transformMortgageToFinancials(mortgage1st).mortgageType).toBe(
				"1st Position"
			);
			expect(transformMortgageToFinancials(mortgage2nd).mortgageType).toBe(
				"2nd Position"
			);
			expect(transformMortgageToFinancials(mortgageOther).mortgageType).toBe(
				"Other Position"
			);
		});
	});

	describe("transformMortgageToDocuments", () => {
		it("should transform mortgage documents", () => {
			const result = transformMortgageToDocuments(mockMortgage);

			expect(result).toHaveLength(1);
			expect(result[0]).toEqual({
				_id: "test-mortgage-id-appraisal",
				name: "Appraisal Report",
				type: "appraisal",
				url: "https://example.com/doc1.pdf",
				uploadDate: "2024-01-01",
				fileSize: 1024000,
			});
		});

		it("should map insurance type to loan type", () => {
			const mortgageWithInsurance = {
				...mockMortgage,
				documents: [
					{
						storageId: "doc-ins" as any,
						url: "https://example.com/insurance.pdf",
						name: "Insurance Document",
						type: "insurance" as any,
						uploadDate: "2024-01-01",
						fileSize: 500000,
					},
				],
			};

			const result = transformMortgageToDocuments(mortgageWithInsurance);

			expect(result[0].type).toBe("loan");
		});

		it("should generate storage URL when URL is null", () => {
			const mortgageWithNullUrl = {
				...mockMortgage,
				documents: [
					{
						...mockMortgage.documents[0],
						url: null,
					},
				],
			};

			const result = transformMortgageToDocuments(mortgageWithNullUrl);

			expect(result[0].url).toBe("/api/storage/doc-1");
		});

		it("should handle empty documents array", () => {
			const mortgageNoDocuments = {
				...mockMortgage,
				documents: [],
			};

			const result = transformMortgageToDocuments(mortgageNoDocuments);

			expect(result).toEqual([]);
		});
	});

	describe("transformMortgageToAppraisal", () => {
		it("should transform mortgage appraisal data", () => {
			const result = transformMortgageToAppraisal(mockMortgage);

			expect(result).toEqual({
				marketValue: 650000,
				method: "comparative",
				company: "Test Appraisals Inc",
				date: "2024-01-01",
			});
		});
	});

	describe("transformComparables", () => {
		const mockComparables: AppraisalComparableWithUrl[] = [
			{
				_id: "comp-1" as any,
				_creationTime: Date.now(),
				mortgageId: "mortgage-1" as any,
				address: {
					street: "456 Compare St",
					city: "Test City",
					state: "TS",
					zip: "12345",
				},
				saleAmount: 600000,
				saleDate: "2024-01-01",
				distance: 0.5,
				squareFeet: 2000,
				bedrooms: 3,
				bathrooms: 2,
				propertyType: "Residential",
				imageUrl: "https://example.com/comp1.jpg",
				imageStorageId: undefined,
			},
			{
				_id: "comp-2" as any,
				_creationTime: Date.now(),
				mortgageId: "mortgage-1" as any,
				address: {
					street: "789 Similar Ave",
					city: "Test City",
					state: "TS",
					zip: "12345",
				},
				saleAmount: 620000,
				saleDate: "2024-02-01",
				distance: 1.2,
				squareFeet: 2100,
				bedrooms: 3,
				bathrooms: 2.5,
				propertyType: "Residential",
				imageUrl: null,
				imageStorageId: "comp-storage-2" as any,
			},
		];

		it("should transform comparables array", () => {
			const result = transformComparables(mockComparables);

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				_id: "comp-1",
				address: {
					street: "456 Compare St",
					city: "Test City",
					state: "TS",
					zip: "12345",
				},
				saleAmount: 600000,
				saleDate: "2024-01-01",
				distance: 0.5,
				squareFeet: 2000,
				bedrooms: 3,
				bathrooms: 2,
				propertyType: "Residential",
				imageUrl: "https://example.com/comp1.jpg",
			});
		});

		it("should use imageStorageId when imageUrl is null", () => {
			const result = transformComparables(mockComparables);

			expect(result[1].imageUrl).toBe("/api/storage/comp-storage-2");
		});

		it("should use fallback image when both imageUrl and imageStorageId are null", () => {
			const comparablesNoImage: AppraisalComparableWithUrl[] = [
				{
					...mockComparables[0],
					imageUrl: null,
					imageStorageId: undefined,
				},
			];

			const result = transformComparables(comparablesNoImage);

			expect(result[0].imageUrl).toBe("/house.jpg");
		});
	});

	describe("transformPayments", () => {
		const mockPayments: Payment[] = [
			{
				_id: "payment-1" as any,
				_creationTime: Date.now(),
				mortgageId: "mortgage-1" as any,
				customerId: "customer-1",
				paymentId: "payment-1",
				transactionScheduleId: "schedule-1",
				processDate: "2024-01-01",
				amount: 2500,
				status: "cleared",
			},
			{
				_id: "payment-2" as any,
				_creationTime: Date.now(),
				mortgageId: "mortgage-1" as any,
				customerId: "customer-1",
				paymentId: "payment-2",
				transactionScheduleId: "schedule-1",
				processDate: "2024-02-01",
				amount: 2500,
				status: "cleared",
			},
		];

		it("should transform payments array", () => {
			const result = transformPayments(mockPayments, "listing-123");

			expect(result).toHaveLength(2);
			expect(result[0]).toEqual({
				_id: "payment-1",
				_creationTime: expect.any(Number),
				mortgageId: "mortgage-1",
				customerId: "customer-1",
				paymentId: "payment-1",
				transactionScheduleId: "schedule-1",
				processDate: "2024-01-01",
				amount: 2500,
				status: "cleared",
				listingId: "listing-123",
				date: "2024-01-01",
				type: "interest",
			});
		});

		it("should set type to interest for all payments", () => {
			const result = transformPayments(mockPayments, "listing-123");

			for (const payment of result) {
				expect(payment.type).toBe("interest");
			}
		});
	});
});
