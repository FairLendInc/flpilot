import { defineSchema, defineTable } from "convex/server";
import { v } from "convex/values";

// The schema is entirely optional.
// You can delete this file (schema.ts) and the
// app will continue to work.
// The schema provides more precise TypeScript types.
export default defineSchema({
	numbers: defineTable({
		value: v.number(),
	}),
	users: defineTable({
		// WorkOS user ID - primary identifier for webhooks
		idp_id: v.string(),
		// Basic user information
		email: v.string(),
		email_verified: v.boolean(),
		first_name: v.optional(v.string()),
		last_name: v.optional(v.string()),
		profile_picture_url: v.optional(v.string()),
		profile_picture: v.optional(v.string()), // Handle both field names for compatibility
		// Optional user phone number
		phone: v.optional(v.string()),
		// Active organization selection (WorkOS organization id)
		active_organization_id: v.optional(v.string()),
		// Timestamps from WorkOS
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
		last_sign_in_at: v.optional(v.string()),
		// External system integration
		external_id: v.optional(v.string()),
		// Flexible metadata storage
		metadata: v.optional(v.any()),
	})
		.index("by_idp_id", ["idp_id"])
		.index("by_email", ["email"]),
	roles: defineTable({
		// WorkOS role slug - primary identifier
		slug: v.string(),
		// Role display name or description (optional)
		name: v.optional(v.string()),
		// Array of permissions this role grants
		permissions: v.optional(v.array(v.string())),
		// Timestamps from WorkOS
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	}).index("by_slug", ["slug"]),
	organizations: defineTable({
		// WorkOS organization ID - primary identifier
		id: v.string(),
		// Organization display name
		name: v.string(),
		// Optional external system identifier
		external_id: v.optional(v.string()),
		// Flexible metadata storage
		metadata: v.optional(v.any()),
		// Timestamps from WorkOS
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	})
		.index("byWorkosId", ["id"])
		.index("byExternalId", ["external_id"])
		.index("byName", ["name"]),
	organization_domains: defineTable({
		// WorkOS domain ID - primary identifier
		id: v.string(),
		// Domain name
		domain: v.string(),
		// Reference to organization
		organization_id: v.string(),
		// WorkOS object type (e.g., "organization_domain")
		object: v.optional(v.string()),
		// Timestamps from WorkOS
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	})
		.index("byDomainId", ["id"])
		.index("byOrganizationId", ["organization_id"])
		.index("byDomainName", ["domain"]),
	organization_memberships: defineTable({
		// WorkOS membership ID - primary identifier
		id: v.string(),
		// Reference to user (WorkOS user ID)
		user_id: v.string(),
		// Reference to organization (WorkOS organization ID)
		organization_id: v.string(),
		// Membership status
		status: v.optional(v.string()),
		// Primary role information
		role: v.optional(
			v.object({
				slug: v.string(),
			})
		),
		// Multiple roles support
		roles: v.optional(
			v.array(
				v.object({
					slug: v.string(),
				})
			)
		),
		// WorkOS object type
		object: v.optional(v.string()),
		// Timestamps from WorkOS
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
	})
		.index("byMembershipId", ["id"])
		.index("byUserId", ["user_id"])
		.index("byOrganizationId", ["organization_id"])
		.index("byUserOrganization", ["user_id", "organization_id"]),
});
