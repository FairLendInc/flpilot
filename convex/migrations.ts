/**
 * Migration to add PDF documents to all mortgages
 * Adds the appraisal document (kg222733sz1pg4gp3qpy9ca5fd7tneqg) to all existing mortgages
 */

import { mutation } from "./_generated/server";
import { Id } from "./_generated/dataModel";

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
			const updatedDocuments = [
				...(mortgage.documents || []),
				documentData,
			];

			await ctx.db.patch(mortgage._id, {
				documents: updatedDocuments,
			});

			updatedCount++;
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
