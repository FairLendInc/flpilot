/**
 * Migration to fix mortgage_ownership records
 * Creates placeholder users for string owner IDs and updates references to proper user IDs
 */

import { mutation } from "../_generated/server";
import { Id } from "../_generated/dataModel";

export const fixOwnershipUserReferences = mutation({
	args: {},
	handler: async (ctx) => {
		console.log(
			"[MIGRATION] Starting: Fix mortgage_ownership user references"
		);

		// Get all mortgage_ownership records
		const allOwnership = await ctx.db.query("mortgage_ownership").collect();

		console.log(`[MIGRATION] Found ${allOwnership.length} ownership records`);

		let updatedCount = 0;
		let createdUsersCount = 0;
		const createdUserIds = new Map<string, Id<"users">>();

		for (const ownership of allOwnership) {
			const ownerId = ownership.ownerId as string;

			// Skip if already "fairlend" literal
			if (ownerId === "fairlend") {
				console.log(
					`[MIGRATION] Skipping ownership ${ownership._id} - already fairlend`
				);
				continue;
			}

			// Check if it's a valid user ID by trying to get it
			try {
				const existingUser = await ctx.db.get(ownerId as Id<"users">);
				if (existingUser) {
					console.log(
						`[MIGRATION] Ownership ${ownership._id} already has valid user reference`
					);
					continue;
				}
			} catch (e) {
				// Not a valid ID, need to create user
			}

			// Check if we already created a user for this string identifier
			let userId: Id<"users">;
			if (createdUserIds.has(ownerId)) {
				userId = createdUserIds.get(ownerId)!;
				console.log(
					`[MIGRATION] Reusing created user ${userId} for identifier ${ownerId}`
				);
			} else {
				// Create a placeholder user
				userId = await ctx.db.insert("users", {
					idp_id: `placeholder_${ownerId}`,
					email: `${ownerId}@placeholder.fairlend.local`,
					email_verified: false,
					first_name: "Placeholder",
					last_name: ownerId,
					created_at: new Date().toISOString(),
					updated_at: new Date().toISOString(),
					metadata: {
						migrated: true,
						originalIdentifier: ownerId,
						createdByMigration: "fix_ownership_user_references",
					},
				});

				createdUserIds.set(ownerId, userId);
				createdUsersCount++;
				console.log(
					`[MIGRATION] Created placeholder user ${userId} for identifier ${ownerId}`
				);
			}

			// Update the ownership record to reference the proper user ID
			await ctx.db.patch(ownership._id, {
				ownerId: userId,
			});

			updatedCount++;
			console.log(
				`[MIGRATION] Updated ownership ${ownership._id} to reference user ${userId}`
			);
		}

		console.log(
			`[MIGRATION] Completed. Created ${createdUsersCount} placeholder users, updated ${updatedCount} ownership records.`
		);

		return {
			success: true,
			totalOwnershipRecords: allOwnership.length,
			createdUsers: createdUsersCount,
			updatedRecords: updatedCount,
			createdUserIdentifiers: Array.from(createdUserIds.keys()),
		};
	},
});
