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

	// ============================================================================
	// Mortgage Marketplace Tables
	// ============================================================================

	borrowers: defineTable({
		// Borrower profile information
		name: v.string(),
		email: v.string(),
		// Rotessa payment processor customer ID
		rotessaCustomerId: v.string(),
	})
		.index("by_rotessa_customer_id", ["rotessaCustomerId"])
		.index("by_email", ["email"]),

	mortgages: defineTable({
		// Borrower reference
		borrowerId: v.id("borrowers"),
		// Core loan details
		loanAmount: v.number(),
		interestRate: v.number(), // Annual percentage rate
		originationDate: v.string(), // ISO date string
		maturityDate: v.string(), // ISO date string
		status: v.union(
			v.literal("active"),
			v.literal("renewed"),
			v.literal("closed"),
			v.literal("defaulted")
		),
		// Mortgage type classification
		mortgageType: v.union(
			v.literal("1st"),
			v.literal("2nd"),
			v.literal("other")
		),
		// Renewal tracking - links to previous mortgage if this is a renewal
		previousMortgageId: v.optional(v.id("mortgages")),
		// Embedded property information
		address: v.object({
			street: v.string(),
			city: v.string(),
			state: v.string(),
			zip: v.string(),
			country: v.string(),
		}),
		location: v.object({
			lat: v.number(),
			lng: v.number(),
		}),
		propertyType: v.string(),
		// Appraisal data - flattened structure for querying
		appraisalMarketValue: v.number(), // Current market value of property
		appraisalMethod: v.string(), // Method used for appraisal
		appraisalCompany: v.string(), // Company that performed appraisal
		appraisalDate: v.string(), // ISO date string of appraisal
		// Loan-to-Value ratio (persisted for filtering)
		ltv: v.number(), // Percentage (0-100)
		// Property images (stored in Convex file storage)
		images: v.array(
			v.object({
				storageId: v.id("_storage"), // Convex storage ID
				alt: v.optional(v.string()), // Image description
				order: v.number(), // Display order (0-indexed)
			})
		),
		// Document references (stored in Convex file storage)
		documents: v.array(
			v.object({
				name: v.string(),
				type: v.union(
					v.literal("appraisal"),
					v.literal("title"),
					v.literal("inspection"),
					v.literal("loan_agreement"),
					v.literal("insurance")
				),
				storageId: v.id("_storage"), // Convex storage ID
				uploadDate: v.string(), // ISO date string
				fileSize: v.optional(v.number()), // bytes
			})
		),
	})
		.index("by_borrower", ["borrowerId"])
		.index("by_status", ["status"])
		.index("by_maturity_date", ["maturityDate"]),

	mortgage_ownership: defineTable({
	// Reference to mortgage
	mortgageId: v.id("mortgages"),
	// Owner reference - union type: userId from users table OR "fairlend" literal
	// Convex validates: either valid userId or "fairlend" string
	ownerId: v.union(v.literal("fairlend"), v.id("users")),
	// Ownership percentage (0-100, typically 100 for single owner)
	// Application validates sum of percentages per mortgage = 100
	ownershipPercentage: v.number(),
	})
		.index("by_mortgage", ["mortgageId"])
		.index("by_owner", ["ownerId"])
		.index("by_mortgage_owner", ["mortgageId", "ownerId"]),

	listings: defineTable({
		// Reference to mortgage being listed
		mortgageId: v.id("mortgages"),
		// Marketplace visibility
		visible: v.boolean(),
		// Lock state for purchase workflow
		locked: v.boolean(),
		lockedBy: v.optional(v.id("users")), // User who locked the listing
		lockedAt: v.optional(v.number()), // Timestamp when locked
	})
		.index("by_mortgage", ["mortgageId"]) // Unique constraint via application logic
		.index("by_locked_status", ["locked"])
		.index("by_locked_user", ["lockedBy"]),

	appraisal_comparables: defineTable({
		// Reference to mortgage
		mortgageId: v.id("mortgages"),
		// Comparable property address
		address: v.object({
			street: v.string(),
			city: v.string(),
			state: v.string(),
			zip: v.string(),
		}),
		// Sale information
		saleAmount: v.number(),
		saleDate: v.string(), // ISO date string
		distance: v.number(), // Miles from subject property
		// Optional property characteristics
		squareFeet: v.optional(v.number()),
		bedrooms: v.optional(v.number()),
		bathrooms: v.optional(v.number()),
		propertyType: v.optional(v.string()),
		// Property image (stored in Convex file storage)
		imageStorageId: v.optional(v.id("_storage")),
	})
		.index("by_mortgage", ["mortgageId"])
		.index("by_sale_date", ["saleDate"]),

	payments: defineTable({
		// Reference to mortgage
		mortgageId: v.id("mortgages"),
		// Payment details (interest-only payments)
		amount: v.number(),
		processDate: v.string(), // ISO date string
		status: v.union(
			v.literal("pending"),
			v.literal("cleared"),
			v.literal("failed")
		),
		// Rotessa payment processor identifiers
		paymentId: v.string(), // Rotessa payment ID
		customerId: v.string(), // Rotessa customer ID
		transactionScheduleId: v.string(), // Rotessa schedule reference
	})
		.index("by_mortgage", ["mortgageId"])
		.index("by_status", ["status"])
		.index("by_process_date", ["processDate"])
		.index("by_payment_id", ["paymentId"]),
});
