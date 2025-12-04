/**
 * Migration to add PDF documents to all mortgages
 * Adds the appraisal document (kg222733sz1pg4gp3qpy9ca5fd7tneqg) to all existing mortgages
 */

import type { Id } from "./_generated/dataModel";
import { mutation } from "./_generated/server";

const WHITESPACE_SPLIT_REGEX = /\s+/;

export const addDocumentsToAllMortgages = mutation({
	args: {},
	handler: async (ctx) => {
		console.log("[MIGRATION] Starting: Add documents to all mortgages");

		// Get all mortgages
		const mortgages = await ctx.db.query("mortgages").collect();

		console.log(`[MIGRATION] Found ${mortgages.length} mortgages to update`);

		// Document details for the PDF
		const documentData = {
			name: "Mortgage Agreement.pdf",
			type: "appraisal" as const,
			storageId: "kg222733sz1pg4gp3qpy9ca5fd7tneqg" as Id<"_storage">,
			uploadDate: new Date().toISOString(),
			fileSize: 250000, // Approximate file size in bytes
		};

		let updatedCount = 0;

		// Update each mortgage to include the document
		for (const mortgage of mortgages) {
			// Check if document already exists to avoid duplicates
			const hasDocument = mortgage.documents?.some(
				(doc) => doc.storageId === documentData.storageId
			);

			if (hasDocument) {
				console.log(
					`[MIGRATION] Mortgage ${mortgage._id} already has the document, skipping`
				);
				continue;
			}

			// Add document to the documents array
			const updatedDocuments = [...(mortgage.documents || []), documentData];

			await ctx.db.patch(mortgage._id, {
				documents: updatedDocuments,
			});

			updatedCount += 1;
			console.log(`[MIGRATION] Updated mortgage ${mortgage._id}`);
		}

		console.log(
			`[MIGRATION] Completed. Updated ${updatedCount} mortgages with documents.`
		);

		return {
			success: true,
			totalMortgages: mortgages.length,
			updatedCount,
		};
	},
});

/**
 * Migration to clean up old onboarding profile fields
 * Removes deprecated `contactEmail` and `legalName` fields from onboarding_journeys
 * These fields were replaced with firstName/middleName/lastName structure
 */
export const cleanupOnboardingProfileFields = mutation({
	args: {},
	handler: async (ctx) => {
		console.log("[MIGRATION] Starting: Clean up old onboarding profile fields");

		// Get all onboarding journeys
		const journeys = await ctx.db.query("onboarding_journeys").collect();

		console.log(`[MIGRATION] Found ${journeys.length} journeys to check`);

		let updatedCount = 0;

		for (const journey of journeys) {
			const profile = journey.context?.investor?.profile;
			if (!profile) {
				continue;
			}

			// Check if profile has old fields
			const hasOldFields = "contactEmail" in profile || "legalName" in profile;

			if (!hasOldFields) {
				continue;
			}

			// Create new profile object with only valid fields
			const cleanedProfile: {
				firstName?: string;
				middleName?: string;
				lastName?: string;
				entityType: "individual" | "corporation" | "trust" | "fund";
				phone?: string;
			} = {
				entityType: profile.entityType,
			};

			// Preserve existing valid fields
			if ("firstName" in profile && typeof profile.firstName === "string") {
				cleanedProfile.firstName = profile.firstName;
			}
			if ("middleName" in profile && typeof profile.middleName === "string") {
				cleanedProfile.middleName = profile.middleName;
			}
			if ("lastName" in profile && typeof profile.lastName === "string") {
				cleanedProfile.lastName = profile.lastName;
			}
			if ("phone" in profile && typeof profile.phone === "string") {
				cleanedProfile.phone = profile.phone;
			}

			// Optionally try to parse legalName if firstName/lastName are missing
			if (
				"legalName" in profile &&
				typeof profile.legalName === "string" &&
				!cleanedProfile.firstName &&
				!cleanedProfile.lastName
			) {
				const nameParts = profile.legalName
					.trim()
					.split(WHITESPACE_SPLIT_REGEX);
				if (nameParts.length > 0) {
					cleanedProfile.firstName = nameParts[0];
					if (nameParts.length > 1) {
						cleanedProfile.lastName = nameParts.at(-1);
						if (nameParts.length > 2) {
							cleanedProfile.middleName = nameParts.slice(1, -1).join(" ");
						}
					}
				}
			}

			// Update the journey with cleaned profile
			await ctx.db.patch(journey._id, {
				context: {
					...journey.context,
					investor: {
						...journey.context?.investor,
						profile: cleanedProfile,
					},
				},
			});

			updatedCount += 1;
			console.log(`[MIGRATION] Cleaned up profile for journey ${journey._id}`);
		}

		console.log(
			`[MIGRATION] Completed. Updated ${updatedCount} journeys with cleaned profiles.`
		);

		return {
			success: true,
			totalJourneys: journeys.length,
			updatedCount,
		};
	},
});
