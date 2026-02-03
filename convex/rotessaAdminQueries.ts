import { v } from "convex/values";
import type { Doc, Id } from "./_generated/dataModel";
import { internalQuery } from "./_generated/server";

/**
 * Internal query to get borrower platform integration details
 */
export const getBorrowerPlatformDetailsInternal = internalQuery({
	args: {
		borrowerId: v.id("borrowers"),
	},
	handler: async (ctx, args) => {
		const borrower = await ctx.db.get(args.borrowerId);
		if (!borrower) {
			return null;
		}

		const mortgages = await ctx.db
			.query("mortgages")
			.withIndex("by_borrower", (q) => q.eq("borrowerId", borrower._id))
			.collect();

		let user:
			| {
					_id: string;
					idp_id: string;
					email: string;
					first_name?: string;
					last_name?: string;
			  }
			| undefined;
		let workosMemberships:
			| Array<{
					organizationId: string;
					organizationName: string;
					organizationExternalId?: string;
					roles: Array<{ slug: string; name: string }>;
					primaryRoleSlug?: string;
			  }>
			| undefined;
		let brokerClient:
			| {
					clientBrokerId: string;
					brokerId: string;
					brokerName: string;
					brokerStatus?: string;
					workosOrgId?: string;
					onboardingStatus?: string;
			  }
			| undefined;

		if (borrower.userId) {
			const userId = borrower.userId; // Type narrowing helper
			const userDoc = await ctx.db.get(userId);
			if (userDoc) {
				user = {
					_id: userDoc._id,
					idp_id: userDoc.idp_id,
					email: userDoc.email,
					first_name: userDoc.first_name,
					last_name: userDoc.last_name,
				};

				const memberships = await ctx.db
					.query("organization_memberships")
					.withIndex("byUserId", (q) => q.eq("user_id", userDoc.idp_id))
					.collect();

				workosMemberships = await Promise.all(
					memberships.map(async (membership) => {
						const org = await ctx.db
							.query("organizations")
							.withIndex("byWorkosId", (q) =>
								q.eq("id", membership.organization_id)
							)
							.unique();

						const roleDetails = await Promise.all(
							(membership.roles || []).map(async (roleRef) => {
								const role = await ctx.db
									.query("roles")
									.withIndex("by_slug", (q) => q.eq("slug", roleRef.slug))
									.unique();
								return {
									slug: roleRef.slug,
									name: role?.name ?? roleRef.slug,
								};
							})
						);

						const primaryRoleSlug =
							membership.role?.slug ?? roleDetails[0]?.slug;

						return {
							organizationId: membership.organization_id,
							organizationName: org?.name ?? "",
							organizationExternalId: org?.external_id,
							roles: roleDetails,
							primaryRoleSlug,
						};
					})
				);
			}

			const brokerClients = await ctx.db
				.query("broker_clients")
				.withIndex("by_client", (q) => q.eq("clientId", userId))
				.collect();

			const currentBrokerClient = brokerClients.sort((a, b) => {
				const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
				const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
				return bTime - aTime;
			})[0];

			if (currentBrokerClient) {
				const broker = await ctx.db.get(currentBrokerClient.brokerId);
				let brokerName = broker?.branding?.brandName ?? "";
				if (broker) {
					const brokerUser = await ctx.db.get(broker.userId);
					if (!brokerName && brokerUser) {
						brokerName =
							`${brokerUser.first_name ?? ""} ${
								brokerUser.last_name ?? ""
							}`.trim() || brokerUser.email;
					}
				}

				if (broker) {
					brokerClient = {
						clientBrokerId: currentBrokerClient._id,
						brokerId: broker._id,
						brokerName: brokerName || broker.subdomain,
						brokerStatus: broker.status,
						workosOrgId: currentBrokerClient.workosOrgId,
						onboardingStatus: currentBrokerClient.onboardingStatus,
					};
				}
			}
		}

		return {
			borrower: {
				_id: borrower._id,
				name: borrower.name,
				email: borrower.email,
				phone: borrower.phone,
				userId: borrower.userId,
				status: borrower.status,
			},
			user,
			workosMemberships,
			brokerClient,
			mortgages: mortgages.map((mortgage: Doc<"mortgages">) => ({
				id: mortgage._id,
				propertyAddress: `${mortgage.address.street}, ${mortgage.address.city}`,
				status: mortgage.status,
				rotessaScheduleId: mortgage.rotessaScheduleId,
			})),
		};
	},
});

/**
 * Internal query to get all linked Rotessa schedule IDs
 * Used by getUnlinkedSchedules to filter out schedules already linked to mortgages
 */
export const getLinkedScheduleIdsInternal = internalQuery({
	args: {},
	handler: async (ctx): Promise<number[]> => {
		const mortgagesWithSchedules = await ctx.db
			.query("mortgages")
			.filter((q) => q.neq(q.field("rotessaScheduleId"), undefined))
			.collect();

		return mortgagesWithSchedules
			.map((m) => m.rotessaScheduleId)
			.filter((id): id is number => id !== undefined);
	},
});

/**
 * Internal query to get broker clients by client ID
 */
export const getBrokerClientsByClientIdInternal = internalQuery({
	args: {
		clientId: v.id("users"),
	},
	handler: async (ctx, args) => {
		const existing = await ctx.db
			.query("broker_clients")
			.withIndex("by_client", (q) => q.eq("clientId", args.clientId))
			.collect();

		return existing.sort((a, b) => {
			const aTime = new Date(a.updatedAt ?? a.createdAt).getTime();
			const bTime = new Date(b.updatedAt ?? b.createdAt).getTime();
			return bTime - aTime;
		});
	},
});
