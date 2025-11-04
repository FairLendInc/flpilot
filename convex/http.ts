import { httpRouter } from "convex/server";
import { logger } from "../lib/logger";
import { internal } from "./_generated/api";
import { httpAction } from "./_generated/server";

const http = httpRouter();

const normalizeNullToUndefined = <T extends Record<string, unknown>>(
	obj: T
): T =>
	Object.fromEntries(
		Object.entries(obj).map(([key, value]) => [
			key,
			value === null ? undefined : value,
		])
	) as T;

// Health check endpoint for webhook testing
http.route({
	path: "/workos-webhook/health",
	method: "GET",
	handler: httpAction(
		async () =>
			new Response(
				JSON.stringify({
					status: "healthy",
					message: "WorkOS webhook endpoint is active",
					timestamp: new Date().toISOString(),
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } }
			)
	),
});

http.route({
	path: "/create-test-user",
	method: "OPTIONS",
	handler: httpAction(
		async (ctx, request) =>
			new Response(null, {
				status: 204,
				headers: {
					"Access-Control-Allow-Origin": "https://glad-lime-rabbit.twenty.com",
					"Access-Control-Allow-Methods": "POST, OPTIONS",
					"Access-Control-Allow-Headers": "Content-Type, X-Webhook-Signature",
					"Access-Control-Max-Age": "86400",
				},
			})
	),
});

http.route({
	path: "/create-test-user",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		logger.info("Creating test user");
		const body = await request.formData();
		const ltv = body.get("ltv");
		logger.info("Request body: ", { body, ltv });
		return new Response(JSON.stringify({ message: "Test user created" }), {
			status: 200,
			headers: { "Content-Type": "application/json" },
		});
	}),
});

http.route({
	path: "/workos-webhook",
	method: "POST",
	handler: httpAction(async (ctx, request) => {
		// Read body as ArrayBuffer first to preserve exact bytes
		const bodyBuffer = await request.arrayBuffer();
		const bodyText = new TextDecoder("utf-8").decode(bodyBuffer);

		const sigHeaderRaw = request.headers.get("workos-signature");
		if (!sigHeaderRaw) {
			return new Response(
				JSON.stringify({
					status: "error",
					message: "Missing workos-signature header",
				}),
				{ status: 400, headers: { "Content-Type": "application/json" } }
			);
		}
		const sigHeader = String(sigHeaderRaw);

		// Add additional debugging info
		logger.debug("HTTP Request debug:", {
			bodyLength: bodyBuffer.byteLength,
			contentType: request.headers.get("content-type"),
			userAgent: request.headers.get("user-agent"),
		});

		try {
			// Verify webhook signature
			const event = await ctx.runAction(internal.workos.verifyWebhook, {
				payload: bodyText,
				signature: sigHeader,
			});

			const { data, event: eventType } = JSON.parse(bodyText);

			// Normalize null values to undefined for Convex compatibility
			const normalizedData = normalizeNullToUndefined(data);

			logger.info("Processing WorkOS webhook event:", {
				eventId: event.id,
				eventType,
				userId: data.id,
				email: data.email,
			});

			// Handle different webhook events
			switch (eventType) {
				case "user.created": {
					logger.info("Processing user.created event");
					const res = await ctx.runMutation(internal.users.create, {
						idp_id: data.id,
						email: data.email,
						email_verified: data.email_verified,
						first_name: data.first_name ?? undefined,
						last_name: data.last_name ?? undefined,
						profile_picture:
							data.profile_picture_url ?? data.profile_picture ?? undefined,
						created_at: data.created_at ?? data.createdAt,
						updated_at: data.updated_at ?? data.updatedAt ?? undefined,
						last_sign_in_at: data.last_sign_in_at ?? undefined,
						external_id: data.external_id ?? data.externalId ?? undefined,
						metadata: data.metadata,
					});

					if (!res) {
						logger.error("Failed to upsert user:", {
							userId: data.id,
							email: data.email,
						});
						throw new Error(
							`Failed to upsert user: ${data.idp_id} RES: ${res}`
						);
					}

					logger.info("Successfully processed user.created event:", {
						userId: res._id,
						workosId: data.id,
						email: data.email,
					});

					break;
				}
				case "user.updated": {
					logger.info("Processing user.updated event");
					const res = await ctx.runMutation(internal.users.updateFromWorkOS, {
						idp_id: data.id,
						email: data.email,
						email_verified: data.email_verified,
						first_name: data.first_name ?? undefined,
						last_name: data.last_name ?? undefined,
						profile_picture:
							data.profile_picture_url ?? data.profile_picture ?? undefined,
						created_at: data.created_at ?? data.createdAt ?? undefined,
						updated_at: data.updated_at ?? data.updatedAt ?? undefined,
						last_sign_in_at: data.last_sign_in_at ?? undefined,
						external_id: data.external_id ?? data.externalId ?? undefined,
						metadata: data.metadata,
					});

					break;
				}
				case "user.deleted": {
					logger.info("Processing user.deleted event");
					const res = await ctx.runMutation(internal.users.destroy, {
						id: data.id,
					});

					if (!res) {
						logger.error("Failed to delete user:", {
							userId: data.id,
							email: data.email,
						});
						throw new Error(
							`Failed to delete user: ${data.idp_id} RES: ${res}`
						);
					}

					logger.info("Successfully processed user.deleted event:", {
						userId: res._id,
						workosId: data.id,
						email: data.email,
					});

					return new Response(
						JSON.stringify({ message: "Test user deleted" }),
						{ status: 200, headers: { "Content-Type": "application/json" } }
					);
					break;
				}

				case "role.created": {
					logger.info("Processing role.created event");
					const res = await ctx.runMutation(internal.roles.createOrUpdateRole, {
						slug: data.slug,
						name: data.name || data.slug, // Use slug as name if not provided
						permissions: data.permissions || [],
						created_at: data.created_at,
						updated_at: data.updated_at,
					});
				}
				case "role.updated": {
					logger.info("Processing role.updated event");
					const res = await ctx.runMutation(internal.roles.createOrUpdateRole, {
						slug: data.slug,
						name: data.name || data.slug, // Use slug as name if not provided
						permissions: data.permissions || [],
						created_at: data.created_at,
						updated_at: data.updated_at,
					});

					logger.info("Successfully processed role.updated event:", {
						roleId: res,
						slug: data.slug,
						permissions: data.permissions,
					});

					break;
				}

				case "role.deleted": {
					logger.info("Processing role.deleted event");
					const res = await ctx.runMutation(internal.roles.deleteRole, {
						slug: data.slug,
					});

					if (res.success) {
						logger.info("Successfully processed role.deleted event:", {
							slug: data.slug,
						});
					} else {
						logger.error("Failed to process role.deleted event:", {
							slug: data.slug,
							error: res.message,
						});
					}

					break;
				}

				case "organization.created": {
					logger.info("Processing organization.created event");
					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateOrganization,
						{
							id: normalizedData.id,
							name: normalizedData.name,
							external_id: normalizedData.external_id,
							metadata: normalizedData.metadata,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
							domains: normalizedData.domains,
						}
					);

					logger.info("Successfully processed organization.created event:", {
						organizationId: res,
						workosId: normalizedData.id,
						name: normalizedData.name,
						domainsCount: normalizedData.domains?.length || 0,
					});

					break;
				}

				case "organization.updated": {
					logger.info("Processing organization.updated event");
					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateOrganization,
						{
							id: normalizedData.id,
							name: normalizedData.name,
							external_id: normalizedData.external_id,
							metadata: normalizedData.metadata,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
							domains: normalizedData.domains,
						}
					);

					logger.info("Successfully processed organization.updated event:", {
						organizationId: res,
						workosId: normalizedData.id,
						name: normalizedData.name,
						domainsCount: normalizedData.domains?.length || 0,
					});

					break;
				}

				case "organization.deleted": {
					logger.info("Processing organization.deleted event");
					const res = await ctx.runMutation(
						internal.organizations.deleteOrganization,
						{
							id: normalizedData.id,
						}
					);

					if (res.success) {
						logger.info("Successfully processed organization.deleted event:", {
							workosId: normalizedData.id,
							name: normalizedData.name,
						});
					} else {
						logger.error("Failed to process organization.deleted event:", {
							workosId: normalizedData.id,
							name: normalizedData.name,
							error: res.message,
						});
					}

					break;
				}

				case "organization_membership.created": {
					logger.info("Processing organization_membership.created event");
					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateMembership,
						{
							id: normalizedData.id,
							user_id: normalizedData.user_id,
							organization_id: normalizedData.organization_id,
							status: normalizedData.status,
							role: normalizedData.role,
							roles: normalizedData.roles,
							object: normalizedData.object,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
						}
					);

					logger.info(
						"Successfully processed organization_membership.created event:",
						{
							membershipId: res,
							workosId: normalizedData.id,
							userId: normalizedData.user_id,
							organizationId: normalizedData.organization_id,
							status: normalizedData.status,
						}
					);

					break;
				}

				case "organization_membership.updated": {
					logger.info("Processing organization_membership.updated event");
					const res = await ctx.runMutation(
						internal.organizations.createOrUpdateMembership,
						{
							id: normalizedData.id,
							user_id: normalizedData.user_id,
							organization_id: normalizedData.organization_id,
							status: normalizedData.status,
							role: normalizedData.role,
							roles: normalizedData.roles,
							object: normalizedData.object,
							created_at: normalizedData.created_at,
							updated_at: normalizedData.updated_at,
						}
					);

					logger.info(
						"Successfully processed organization_membership.updated event:",
						{
							membershipId: res,
							workosId: normalizedData.id,
							userId: normalizedData.user_id,
							organizationId: normalizedData.organization_id,
							status: normalizedData.status,
						}
					);

					break;
				}

				case "organization_membership.deleted": {
					logger.info("Processing organization_membership.deleted event");
					const res = await ctx.runMutation(
						internal.organizations.deleteMembership,
						{
							id: normalizedData.id,
						}
					);

					if (res.success) {
						logger.info(
							"Successfully processed organization_membership.deleted event:",
							{
								workosId: normalizedData.id,
								membershipId: normalizedData.id,
							}
						);
					} else {
						logger.error(
							"Failed to process organization_membership.deleted event:",
							{
								workosId: normalizedData.id,
								error: res.message,
							}
						);
					}

					break;
				}

				default: {
					logger.info("Received unhandled webhook event:", {
						eventType,
						eventId: event.id,
					});

					// Return success for unhandled events to avoid WorkOS retrying
					return new Response(
						JSON.stringify({
							status: "success",
							message: `Event type ${eventType} received but not handled`,
							eventId: event.id,
						}),
						{ status: 200, headers: { "Content-Type": "application/json" } }
					);
				}
			}

			// Return success response for processed events
			return new Response(
				JSON.stringify({
					status: "success",
					message: `Successfully processed ${eventType} event`,
					eventId: event.id,
					timestamp: new Date().toISOString(),
				}),
				{ status: 200, headers: { "Content-Type": "application/json" } }
			);
		} catch (error) {
			logger.error("Webhook processing failed:", {
				error: error instanceof Error ? error.message : String(error),
				stack: error instanceof Error ? error.stack : undefined,
				bodyLength: bodyBuffer.byteLength,
				signaturePresent: !!sigHeader,
			});

			// Return error response
			return new Response(
				JSON.stringify({
					status: "error",
					message: "Webhook processing failed",
					error: error instanceof Error ? error.message : String(error),
					timestamp: new Date().toISOString(),
				}),
				{
					status: 500,
					headers: { "Content-Type": "application/json" },
				}
			);
		}
	}),
});

export default http;
