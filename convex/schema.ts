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
	feature_flags: defineTable({
		key: v.string(),
		description: v.optional(v.string()),
		defaultValue: v.boolean(),
		rules: v.array(
			v.object({
				type: v.union(
					v.literal("global"),
					v.literal("user"),
					v.literal("role"),
					v.literal("percentage")
				),
				value: v.optional(v.union(v.string(), v.number())),
				enabled: v.boolean(),
			})
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	}).index("by_key", ["key"]),
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
		// User theme preference - validated at runtime in setUserTheme mutation
		theme: v.optional(v.string()),
		// Timestamps from WorkOS
		created_at: v.optional(v.string()),
		updated_at: v.optional(v.string()),
		last_sign_in_at: v.optional(v.string()),
		// External system integration
		external_id: v.optional(v.string()),
		// Flexible metadata storage
		metadata: v.optional(v.any()),
		// User preferences for document management
		preferences: v.optional(
			v.object({
				autoDocumentTypeAssignment: v.boolean(),
				autoAssignmentThreshold: v.number(),
				requireConfirmationForAutoAssignment: v.boolean(),
			})
		),
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

	onboarding_journeys: defineTable({
		userId: v.id("users"),
		persona: v.union(
			v.literal("unselected"),
			v.literal("broker"),
			v.literal("investor"),
			v.literal("lawyer"),
			v.literal("borrower")
		),
		stateValue: v.string(),
		context: v.object({
			investor: v.optional(
				v.object({
					// Broker selection step
					brokerSelection: v.optional(
						v.object({
							brokerId: v.optional(v.id("brokers")),
							brokerCode: v.optional(v.string()),
							selectedAt: v.string(), // ISO timestamp
						})
					),
					// Step configuration version for this journey
					configVersion: v.optional(v.number()),
					// Profile step
					profile: v.optional(
						v.object({
							firstName: v.optional(v.string()),
							middleName: v.optional(v.string()),
							lastName: v.optional(v.string()),
							entityType: v.union(
								v.literal("individual"),
								v.literal("corporation"),
								v.literal("trust"),
								v.literal("fund")
							),
							phone: v.optional(v.string()),
							// TODO: Remove these deprecated fields after migration
							// These are temporarily allowed to fix schema validation errors
							contactEmail: v.optional(v.string()),
							legalName: v.optional(v.string()),
						})
					),
					// Preferences step
					preferences: v.optional(
						v.object({
							minTicket: v.number(),
							maxTicket: v.number(),
							riskProfile: v.union(
								v.literal("conservative"),
								v.literal("balanced"),
								v.literal("growth")
							),
							liquidityHorizonMonths: v.number(),
							focusRegions: v.optional(v.array(v.string())),
						})
					),
					// KYC step (differentiated by broker type)
					kyc: v.optional(
						v.object({
							status: v.union(
								v.literal("not_started"),
								v.literal("in_progress"),
								v.literal("submitted"),
								v.literal("acknowledged") // For external broker stub
							),
							documents: v.optional(
								v.array(
									v.object({
										storageId: v.id("_storage"),
										documentType: v.string(), // e.g., "id_verification", "proof_of_address"
										uploadedAt: v.string(),
									})
								)
							),
							acknowledgedAt: v.optional(v.string()),
							notes: v.optional(v.string()),
						})
					),
					// Legacy KYC placeholder (for backward compatibility)
					kycPlaceholder: v.optional(
						v.object({
							status: v.union(
								v.literal("not_started"),
								v.literal("blocked"),
								v.literal("submitted")
							),
							notes: v.optional(v.string()),
						})
					),
					// Documents step (optional uploads)
					documents: v.optional(
						v.array(
							v.object({
								storageId: v.id("_storage"),
								label: v.string(),
							})
						)
					),
				})
			),
			broker: v.optional(
				v.object({
					// Company information
					companyInfo: v.optional(
						v.object({
							companyName: v.string(),
							entityType: v.union(
								v.literal("sole_proprietorship"),
								v.literal("partnership"),
								v.literal("corporation")
							),
							registrationNumber: v.string(),
							registeredAddress: v.object({
								street: v.string(),
								city: v.string(),
								state: v.string(),
								zip: v.string(),
								country: v.string(),
							}),
							businessPhone: v.string(),
							businessEmail: v.string(),
						})
					),
					// Licensing information
					licensing: v.optional(
						v.object({
							licenseType: v.union(
								v.literal("mortgage_broker"),
								v.literal("investment_broker"),
								v.literal("mortgage_dealer")
							),
							licenseNumber: v.string(),
							issuer: v.string(),
							issuedDate: v.string(), // ISO date
							expiryDate: v.string(), // ISO date
							jurisdictions: v.array(v.string()), // e.g., ["Ontario", "British Columbia"]
						})
					),
					// Representative information
					representatives: v.optional(
						v.array(
							v.object({
								firstName: v.string(),
								lastName: v.string(),
								role: v.string(),
								email: v.string(),
								phone: v.string(),
								hasAuthority: v.boolean(),
							})
						)
					),
					// Documents
					documents: v.optional(
						v.array(
							v.object({
								storageId: v.id("_storage"),
								label: v.string(),
								type: v.string(), // e.g., "license", "insurance", "agreement"
								uploadedAt: v.string(), // ISO timestamp
							})
						)
					),
					// Timeline of admin requests and broker responses
					adminRequestTimeline: v.optional(
						v.array(
							v.object({
								id: v.string(), // UUID
								type: v.union(
									v.literal("info_request"),
									v.literal("document_request"),
									v.literal("clarification")
								),
								requestedBy: v.id("users"),
								requestedAt: v.string(), // ISO timestamp
								message: v.string(),
								resolved: v.boolean(),
								resolvedAt: v.optional(v.string()), // ISO timestamp
								response: v.optional(v.string()),
								responseDocuments: v.optional(
									v.array(
										v.object({
											storageId: v.id("_storage"),
											label: v.string(),
										})
									)
								),
							})
						)
					),
					// Proposed subdomain (subject to availability check)
					proposedSubdomain: v.optional(v.string()),
				})
			),
			lawyer: v.optional(
				v.object({
					profile: v.optional(
						v.object({
							firstName: v.string(),
							middleName: v.optional(v.string()),
							lastName: v.string(),
							lsoNumber: v.string(),
							firmName: v.string(),
							email: v.string(),
							phone: v.string(),
							jurisdiction: v.string(),
						})
					),
					identityVerification: v.optional(
						v.object({
							status: v.union(
								v.literal("not_started"),
								v.literal("pending"),
								v.literal("verified"),
								v.literal("mismatch"),
								v.literal("failed")
							),
							provider: v.optional(v.string()),
							inquiryId: v.optional(v.string()),
							extractedName: v.optional(
								v.object({
									firstName: v.string(),
									middleName: v.optional(v.string()),
									lastName: v.string(),
								})
							),
							checkedAt: v.optional(v.string()),
						})
					),
					lsoVerification: v.optional(
						v.object({
							status: v.union(
								v.literal("not_started"),
								v.literal("verified"),
								v.literal("failed")
							),
							checkedAt: v.optional(v.string()),
							matchedRecord: v.optional(
								v.object({
									lsoNumber: v.string(),
									firstName: v.string(),
									lastName: v.string(),
									firmName: v.optional(v.string()),
									jurisdiction: v.optional(v.string()),
									status: v.optional(v.string()),
								})
							),
						})
					),
					documents: v.optional(
						v.array(
							v.object({
								storageId: v.id("_storage"),
								label: v.string(),
							})
						)
					),
				})
			),
			// Borrower onboarding context (broker/admin initiated or self-registration)
			borrower: v.optional(
				v.object({
					// Invitation context (if broker/admin-initiated)
					invitation: v.optional(
						v.object({
							invitedBy: v.id("users"),
							invitedByRole: v.union(v.literal("broker"), v.literal("admin")),
							invitedAt: v.string(), // ISO timestamp
							loanDetails: v.optional(
								v.object({
									requestedAmount: v.optional(v.number()),
									propertyAddress: v.optional(v.string()),
								})
							),
						})
					),
					// Step configuration version for this journey
					configVersion: v.optional(v.number()),
					// Profile step
					profile: v.optional(
						v.object({
							firstName: v.string(),
							middleName: v.optional(v.string()),
							lastName: v.string(),
							email: v.string(),
							phone: v.optional(v.string()),
							address: v.optional(
								v.object({
									street: v.string(),
									city: v.string(),
									province: v.string(),
									postalCode: v.string(),
									country: v.string(),
								})
							),
						})
					),
					// Identity verification (Plaid - future)
					idVerification: v.optional(
						v.object({
							provider: v.string(),
							status: v.union(
								v.literal("not_started"),
								v.literal("pending"),
								v.literal("verified"),
								v.literal("failed"),
								v.literal("mismatch"),
								v.literal("skipped")
							),
							inquiryId: v.optional(v.string()),
							checkedAt: v.optional(v.string()),
						})
					),
					// KYC/AML (future)
					kycAml: v.optional(
						v.object({
							provider: v.string(),
							status: v.union(
								v.literal("not_started"),
								v.literal("pending"),
								v.literal("passed"),
								v.literal("failed"),
								v.literal("requires_review"),
								v.literal("skipped")
							),
							checkId: v.optional(v.string()),
							checkedAt: v.optional(v.string()),
						})
					),
					// Rotessa setup
					rotessa: v.optional(
						v.object({
							status: v.union(
								v.literal("not_started"),
								v.literal("pending"),
								v.literal("linked"),
								v.literal("created"),
								v.literal("active"),
								v.literal("failed")
							),
							customerId: v.optional(v.number()),
							customIdentifier: v.optional(v.string()),
							linkedAt: v.optional(v.string()),
							// Banking info (collected in step)
							bankInfo: v.optional(
								v.object({
									institutionNumber: v.string(),
									transitNumber: v.string(),
									accountNumber: v.string(), // Encrypted/masked in context
									accountType: v.union(
										v.literal("checking"),
										v.literal("savings")
									),
								})
							),
						})
					),
					// Documents (optional uploads)
					documents: v.optional(
						v.array(
							v.object({
								storageId: v.id("_storage"),
								type: v.string(), // e.g., "id_verification", "proof_of_address"
								label: v.string(),
								uploadedAt: v.string(),
							})
						)
					),
				})
			),
		}),
		status: v.union(
			v.literal("draft"),
			v.literal("awaiting_admin"),
			v.literal("approved"),
			v.literal("rejected")
		),
		adminDecision: v.optional(
			v.object({
				decidedBy: v.id("users"),
				decidedAt: v.string(),
				notes: v.optional(v.string()),
				decisionSource: v.optional(
					v.union(v.literal("admin"), v.literal("system"))
				),
			})
		),
		lastTouchedAt: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_status", ["status"]),

	// ============================================================================
	// Broker Onboarding and Management Tables
	// ============================================================================

	/**
	 * Approved broker configurations
	 * Stores subdomain, branding, commission rates, and status for approved brokers
	 */
	brokers: defineTable({
		// References
		userId: v.id("users"), // Primary broker user
		workosOrgId: v.string(), // Broker's WorkOS organization
		// Subdomain configuration
		subdomain: v.string(), // e.g., "acmebrokers"
		customDomain: v.optional(v.string()), // e.g., "mortgages.acme.com"
		// Branding configuration
		branding: v.object({
			logoStorageId: v.optional(v.id("_storage")),
			primaryColor: v.optional(v.string()), // hex color
			secondaryColor: v.optional(v.string()), // hex color
			brandName: v.optional(v.string()), // override default company name
		}),
		// Commission configuration
		commission: v.object({
			ratePercentage: v.number(), // e.g., 2.5 for 2.5%
		}),
		// Status
		status: v.union(
			v.literal("active"),
			v.literal("suspended"),
			v.literal("revoked")
		),
		// Timestamps
		approvedAt: v.string(), // ISO timestamp
		createdAt: v.string(),
		updatedAt: v.string(),
	})
		.index("by_user", ["userId"])
		.index("by_subdomain", ["subdomain"])
		.index("by_workos_org", ["workosOrgId"])
		.index("by_status", ["status"]),

	/**
	 * Broker-client relationships
	 * Links clients to their managing brokers with filter configurations
	 */
	broker_clients: defineTable({
		// References
		brokerId: v.id("brokers"),
		clientId: v.id("users"), // The client user
		workosOrgId: v.string(), // Client's WorkOS organization
		// Listing filter configuration (set by broker)
		filters: v.object({
			// Broker-provided constraints (set by broker, read-only to client)
			constraints: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				allowedPropertyTypes: v.optional(v.array(v.string())),
				allowedLocations: v.optional(v.array(v.string())),
				allowedRiskProfiles: v.optional(
					v.array(
						v.union(
							v.literal("conservative"),
							v.literal("balanced"),
							v.literal("growth")
						)
					)
				),
			}),
			// Client-selected values (within constraints)
			values: v.object({
				minLTV: v.optional(v.number()),
				maxLTV: v.optional(v.number()),
				minLoanAmount: v.optional(v.number()),
				maxLoanAmount: v.optional(v.number()),
				minInterestRate: v.optional(v.number()),
				maxInterestRate: v.optional(v.number()),
				propertyTypes: v.array(v.string()),
				locations: v.array(v.string()),
				riskProfile: v.union(
					v.literal("conservative"),
					v.literal("balanced"),
					v.literal("growth")
				),
			}),
		}),
		// Onboarding workflow
		onboardingStatus: v.union(
			v.literal("invited"),
			v.literal("in_progress"),
			v.literal("pending_approval"),
			v.literal("approved"),
			v.literal("rejected")
		),
		// Timestamps
		invitedAt: v.string(),
		approvedAt: v.optional(v.string()),
		createdAt: v.string(),
		updatedAt: v.string(),
	})
		.index("by_broker", ["brokerId"])
		.index("by_client", ["clientId"])
		.index("by_status", ["onboardingStatus"])
		.index("by_broker_status", ["brokerId", "onboardingStatus"]),

	/**
	 * Broker rate history for historical commission/adjustment rates
	 * Tracks rate changes over time for accurate historical calculations
	 */
	broker_rate_history: defineTable({
		brokerId: v.id("brokers"),
		type: v.literal("commission"),
		oldRate: v.number(),
		newRate: v.number(),
		effectiveAt: v.string(), // ISO timestamp when new rate took effect
		changedBy: v.id("users"), // Admin who made the change
		createdAt: v.string(),
	})
		.index("by_broker", ["brokerId"])
		.index("by_broker_type", ["brokerId", "type"])
		.index("by_effective", ["effectiveAt"]),

	/**
	 * Broker-client communication timeline
	 * Tracks all communication between brokers and clients
	 */
	communication_timeline: defineTable({
		// References
		clientBrokerId: v.id("broker_clients"),
		sentBy: v.id("users"), // User ID of the sender (broker or client)
		// Communication type
		type: v.union(
			v.literal("info_request"),
			v.literal("document_request"),
			v.literal("clarification"),
			v.literal("announcement")
		),
		// Content
		message: v.string(),
		// Document attachments
		documents: v.optional(
			v.array(
				v.object({
					storageId: v.id("_storage"),
					label: v.string(),
				})
			)
		),
		// Resolution status (for requests that need responses)
		resolved: v.boolean(),
		resolvedAt: v.optional(v.string()), // ISO timestamp
		response: v.optional(v.string()), // Response message
		responseDocuments: v.optional(
			v.array(
				v.object({
					storageId: v.id("_storage"),
					label: v.string(),
				})
			)
		),
		respondedBy: v.optional(v.id("users")), // User ID of responder
		// Optional announcement ID for grouping bulk announcements
		announcementId: v.optional(v.string()), // UUID
		// Timestamps
		sentAt: v.string(), // ISO timestamp when message was sent
		createdAt: v.string(),
	})
		.index("by_client", ["clientBrokerId"])
		.index("by_client_status", ["clientBrokerId", "resolved"])
		.index("by_sent_by", ["sentBy"])
		.index("by_announcement", ["announcementId"]),

	// ============================================================================
	// Mortgage Marketplace Tables
	// ============================================================================

	borrowers: defineTable({
		// Link to platform user account (borrowers are platform users)
		userId: v.optional(v.id("users")), // Optional during migration, required for new borrowers

		// Borrower profile information
		name: v.string(),
		email: v.string(),
		phone: v.optional(v.string()),

		// Address
		address: v.optional(
			v.object({
				street: v.string(),
				city: v.string(),
				province: v.string(),
				postalCode: v.string(),
				country: v.string(),
			})
		),

		// Rotessa payment processor customer ID
		rotessaCustomerId: v.string(),
		rotessaCustomIdentifier: v.optional(v.string()),

		// Verification status (from journey)
		idVerificationStatus: v.optional(
			v.union(
				v.literal("not_started"),
				v.literal("pending"),
				v.literal("verified"),
				v.literal("failed"),
				v.literal("skipped")
			)
		),
		kycAmlStatus: v.optional(
			v.union(
				v.literal("not_started"),
				v.literal("pending"),
				v.literal("passed"),
				v.literal("failed"),
				v.literal("requires_review"),
				v.literal("skipped")
			)
		),

		// Onboarding metadata
		onboardingJourneyId: v.optional(v.id("onboarding_journeys")),
		onboardedBy: v.optional(
			v.union(v.literal("broker"), v.literal("admin"), v.literal("self"))
		),
		onboardedByUserId: v.optional(v.id("users")),
		onboardedAt: v.optional(v.string()), // ISO timestamp

		// Status (optional for backward compatibility, defaults to "active" in application logic)
		status: v.optional(
			v.union(
				v.literal("pending_approval"),
				v.literal("active"),
				v.literal("inactive"),
				v.literal("suspended")
			)
		),

		// Sync metadata
		rotessaLastSyncAt: v.optional(v.number()),
		rotessaSyncError: v.optional(v.string()),
	})
		.index("by_user", ["userId"])
		.index("by_rotessa_customer_id", ["rotessaCustomerId"])
		.index("by_email", ["email"])
		.index("by_status", ["status"])
		.index("by_onboarding_journey", ["onboardingJourneyId"]),

	mic_investors_demo: defineTable({
		name: v.string(),
	}),

	mortgages: defineTable({
		// Optional external identifier for integrations (used for idempotency)
		externalMortgageId: v.optional(v.string()),
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
		priorEncumbrance: v.optional(
			v.object({
				amount: v.number(),
				lender: v.string(),
			})
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
		asIfAppraisal: v.optional(
			v.object({
				marketValue: v.number(),
				method: v.string(),
				company: v.string(),
				date: v.string(),
				// New optional fields for renovation details
				description: v.optional(v.string()),
				imageStorageIds: v.optional(v.array(v.id("_storage"))),
				projectedCompletionDate: v.optional(v.string()),
				cost: v.optional(v.number()),
			})
		),
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
				// Flexible type field (supports backward compatibility)
				type: v.string(),
				// Optional explicit group assignment
				group: v.optional(v.string()),
				storageId: v.id("_storage"), // Convex storage ID
				uploadDate: v.string(), // ISO date string
				fileSize: v.optional(v.number()), // bytes
				// Metadata for custom properties and migration tracking
				metadata: v.optional(
					v.object({
						// User-defined custom properties
						customProperties: v.optional(v.record(v.string(), v.string())),
						// User-defined type for custom categorization
						userDefinedType: v.optional(v.string()),
						// Original hardcoded type for migration tracking
						originalHardcodedType: v.optional(v.string()),
					})
				),
			})
		),
		// Documenso template configurations
		documentTemplates: v.optional(
			v.array(
				v.object({
					documensoTemplateId: v.string(), // e.g.,
					name: v.string(), // Display name (e.g., "Purchase Agreement")
					signatoryRoles: v.array(v.string()), // e.g., ["Broker", "Investor"]
				})
			)
		),
		// Rotessa payment schedule linking (1:1 mortgage → schedule)
		rotessaScheduleId: v.optional(v.number()),
		rotessaScheduleStatus: v.optional(
			v.union(
				v.literal("active"),
				v.literal("paused"),
				v.literal("completed"),
				v.literal("cancelled")
			)
		),
		rotessaScheduleLastSyncAt: v.optional(v.number()),
	})
		.index("by_borrower", ["borrowerId"])
		.index("by_status", ["status"])
		.index("by_maturity_date", ["maturityDate"])
		.index("by_external_mortgage_id", ["externalMortgageId"])
		.index("by_rotessa_schedule", ["rotessaScheduleId"]),

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

	lock_requests: defineTable({
		// Reference to listing being requested
		listingId: v.id("listings"),
		// User who requested the lock (investor)
		requestedBy: v.id("users"),
		// Request status: pending, approved, rejected, expired
		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected"),
			v.literal("expired")
		),
		// Timestamp when request was created
		requestedAt: v.number(),
		// Timestamp when request was reviewed (approved/rejected)
		reviewedAt: v.optional(v.number()),
		// Admin user who reviewed the request
		reviewedBy: v.optional(v.id("users")),
		// Optional rejection reason from admin
		rejectionReason: v.optional(v.string()),
		// Optional notes from investor (max 1000 characters)
		requestNotes: v.optional(v.string()),
		// Lawyer information (required for listing requests)
		lawyerName: v.string(),
		lawyerLSONumber: v.string(),
		lawyerEmail: v.string(),
	})
		.index("by_listing", ["listingId"])
		.index("by_status", ["status"])
		.index("by_requested_by", ["requestedBy"])
		.index("by_status_requested_at", ["status", "requestedAt"])
		.index("by_listing_status", ["listingId", "status"]),

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
		asIf: v.optional(v.boolean()),
		// Property image (stored in Convex file storage)
		imageStorageId: v.optional(v.id("_storage")),
	})
		.index("by_mortgage", ["mortgageId"])
		.index("by_sale_date", ["saleDate"]),

	payments: defineTable({
		// Reference to mortgage
		mortgageId: v.id("mortgages"),
		// Reference to borrower (for query efficiency)
		borrowerId: v.optional(v.id("borrowers")),
		// Payment details (interest-only payments)
		amount: v.number(),
		currency: v.optional(v.string()), // CAD default
		paymentType: v.optional(
			v.union(
				v.literal("interest_only"),
				v.literal("principal"),
				v.literal("full")
			)
		),
		processDate: v.string(), // ISO date string (Rotessa scheduled date)
		dueDate: v.optional(v.string()), // Alias for processDate (for UI clarity)
		paidDate: v.optional(v.string()), // Actual payment date
		settlementDate: v.optional(v.string()), // Bank settlement date
		status: v.union(
			v.literal("pending"),
			v.literal("processing"),
			v.literal("cleared"),
			v.literal("failed"),
			v.literal("nsf") // Non-sufficient funds / chargeback
		),
		// Rotessa payment processor identifiers
		paymentId: v.string(), // Rotessa payment ID (legacy field name)
		rotessaTransactionId: v.optional(v.string()), // Explicit Rotessa transaction ID
		customerId: v.string(), // Rotessa customer ID
		transactionScheduleId: v.optional(v.string()), // Rotessa schedule reference (optional)
		transactionSchedule: v.optional(v.any()), // Optional schedule payload snapshot
		rotessaScheduleId: v.optional(v.number()), // Numeric schedule ID
		rotessaStatus: v.optional(v.string()), // Raw Rotessa status
		rotessaStatusReason: v.optional(v.string()), // Decline/chargeback reason
		paymentMetadata: v.optional(v.any()), // Raw payment metadata (Rotessa payload)
		// Formance Ledger integration
		ledgerTransactionId: v.optional(v.string()), // Reference to Formance ledger transaction
		// Timestamps
		createdAt: v.optional(v.string()),
		updatedAt: v.optional(v.string()),
	})
		.index("by_mortgage", ["mortgageId"])
		.index("by_borrower", ["borrowerId"])
		.index("by_status", ["status"])
		.index("by_process_date", ["processDate"])
		.index("by_payment_id", ["paymentId"])
		.index("by_rotessa_transaction", ["rotessaTransactionId"])
		.index("by_ledger_transaction", ["ledgerTransactionId"]),

	/**
	 * Backfill Log Table
	 *
	 * Tracks historical payment backfill operations from Rotessa to Formance.
	 * Created when linking a schedule with backfill enabled.
	 */
	backfill_log: defineTable({
		mortgageId: v.id("mortgages"),
		scheduleId: v.number(), // Rotessa schedule ID
		triggeredBy: v.optional(v.id("users")), // Admin who triggered
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("partial"), // Completed with some errors
			v.literal("failed")
		),
		// Metrics
		metrics: v.optional(
			v.object({
				transactionsFound: v.number(),
				paymentsCreated: v.number(),
				ledgerTransactionsCreated: v.number(),
				errors: v.number(),
			})
		),
		// Error details for failed payments
		errors: v.optional(
			v.array(
				v.object({
					transactionId: v.number(),
					error: v.string(),
				})
			)
		),
		// Timestamps
		startedAt: v.number(),
		completedAt: v.optional(v.number()),
	})
		.index("by_mortgage", ["mortgageId"])
		.index("by_schedule", ["scheduleId"])
		.index("by_status", ["status"]),

	// ============================================================================
	// Deal Management Tables (Pilot Program)
	// ============================================================================

	deals: defineTable({
		// References to related entities
		lockRequestId: v.optional(v.id("lock_requests")), // Made optional as we transition
		listingId: v.id("listings"),
		mortgageId: v.id("mortgages"),
		investorId: v.id("users"),

		// Status tracking
		// status: v.optional(
		// 	v.union(
		// 		v.literal("pending"),
		// 		v.literal("active"),
		// 		v.literal("completed"),
		// 		v.literal("cancelled"),
		// 		v.literal("archived")
		// 	)
		// ),

		// XState machine state (serialized JSON)
		stateMachineState: v.optional(v.string()),
		currentState: v.optional(
			v.union(
				v.literal("locked"),
				v.literal("pending_lawyer"),
				v.literal("pending_docs"),
				v.literal("pending_transfer"),
				v.literal("pending_verification"),
				v.literal("pending_ownership_review"),
				v.literal("completed"),
				v.literal("cancelled"),
				v.literal("archived")
			)
		),

		// Deal financial details
		purchasePercentage: v.optional(v.number()), // 100 for pilot, variable in future
		dealValue: v.optional(v.number()), // Calculated at creation

		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
		completedAt: v.optional(v.number()),
		archivedAt: v.optional(v.number()),
		cancelledAt: v.optional(v.number()),

		// Audit trail - tracks all state transitions
		stateHistory: v.optional(
			v.array(
				v.object({
					fromState: v.string(),
					toState: v.string(),
					timestamp: v.number(),
					triggeredBy: v.id("users"),
					notes: v.optional(v.string()),
				})
			)
		),

		// Future: validation tracking (stubbed for now)
		validationChecks: v.optional(
			v.object({
				lawyerConfirmed: v.boolean(),
				docsComplete: v.boolean(),
				fundsReceived: v.boolean(),
				fundsVerified: v.boolean(),
			})
		),

		// Broker and Lawyer details
		brokerId: v.optional(v.id("users")),
		brokerName: v.optional(v.string()),
		brokerEmail: v.optional(v.string()),
		lawyerName: v.optional(v.string()),
		lawyerEmail: v.optional(v.string()),
		lawyerLSONumber: v.optional(v.string()),

		// Fund Transfer Uploads
		currentUpload: v.optional(
			v.object({
				storageId: v.id("_storage"),
				uploadedBy: v.string(),
				uploadedAt: v.number(),
				fileName: v.string(),
				fileType: v.string(),
			})
		),
		uploadHistory: v.optional(
			v.array(
				v.object({
					storageId: v.id("_storage"),
					uploadedBy: v.string(),
					uploadedAt: v.number(),
					fileName: v.string(),
					fileType: v.string(),
				})
			)
		),
	})
		.index("by_lock_request", ["lockRequestId"])
		.index("by_listing", ["listingId"])
		.index("by_mortgage", ["mortgageId"])
		.index("by_investor", ["investorId"])
		// .index("by_status", ["status"])
		.index("by_current_state", ["currentState"])
		.index("by_created_at", ["createdAt"])
		.index("by_lawyer_email", ["lawyerEmail"]),

	deal_documents: defineTable({
		dealId: v.id("deals"),
		documensoDocumentId: v.string(), // Actual Documenso document ID
		templateId: v.string(), // Original template ID from mortgage config
		templateName: v.string(), // Display name for UI
		status: v.union(
			v.literal("draft"),
			v.literal("pending"),
			v.literal("signed"),
			v.literal("rejected")
		),
		signatories: v.array(
			v.object({
				role: v.string(),
				name: v.string(),
				email: v.string(),
			})
		),
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_deal", ["dealId"])
		.index("by_status", ["status"]),

	alerts: defineTable({
		// Who should see this alert
		userId: v.id("users"),

		// Alert type and severity
		type: v.union(
			v.literal("deal_created"),
			v.literal("deal_state_changed"),
			v.literal("deal_completed"),
			v.literal("deal_cancelled"),
			v.literal("deal_stuck"), // Future: for time-based alerts
			// Ownership transfer workflow alerts
			v.literal("ownership_review_required"),
			v.literal("ownership_transfer_rejected"),
			v.literal("manual_resolution_required")
		),
		severity: v.union(
			v.literal("info"),
			v.literal("warning"),
			v.literal("error")
		),

		// Alert content
		title: v.string(),
		message: v.string(),

		// Alert metadata - links to related entities
		relatedDealId: v.optional(v.id("deals")),
		relatedListingId: v.optional(v.id("listings")),
		relatedLockRequestId: v.optional(v.id("lock_requests")),

		// State tracking
		read: v.boolean(),
		createdAt: v.number(),
		readAt: v.optional(v.number()),
	})
		.index("by_user_read", ["userId", "read"])
		.index("by_user_created_at", ["userId", "createdAt"])
		.index("by_deal", ["relatedDealId"]),

	// Dynamic document groups for categorization
	document_groups: defineTable({
		// Machine-readable name (unique)
		name: v.string(),
		// Human-readable display name
		displayName: v.string(),
		// Optional description
		description: v.optional(v.string()),
		// Icon identifier (e.g., "lucide:home")
		icon: v.optional(v.string()),
		// Color for UI theming
		color: v.optional(v.string()),
		// System default flag
		isDefault: v.optional(v.boolean()),
		// Active status for soft delete
		isActive: v.boolean(),
		// Creator reference
		createdBy: v.id("users"),
		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_name", ["name"])
		.index("by_active", ["isActive"]),

	// Dynamic document types within groups
	document_types: defineTable({
		// Machine-readable name (unique within group)
		name: v.string(),
		// Human-readable display name
		displayName: v.string(),
		// Optional description
		description: v.optional(v.string()),
		// Reference to document group
		groupName: v.string(),
		// Icon identifier
		icon: v.optional(v.string()),
		// Validation rules for this type
		validationRules: v.optional(
			v.object({
				maxSize: v.optional(v.number()), // bytes
				allowedFormats: v.optional(v.array(v.string())),
				requiredFields: v.optional(v.array(v.string())),
			})
		),
		// Active status for soft delete
		isActive: v.boolean(),
		// Creator reference
		createdBy: v.id("users"),
		// Timestamps
		createdAt: v.number(),
		updatedAt: v.number(),
	})
		.index("by_group", ["groupName"])
		.index("by_name", ["name"])
		.index("by_group_name", ["groupName", "name"]),

	// ============================================================================
	// Ownership Transfer Workflow Tables
	// ============================================================================

	/**
	 * Pending ownership transfers - staged for admin review before execution
	 * Implements the Maker-Checker pattern for ownership transfers
	 */
	pending_ownership_transfers: defineTable({
		// References
		dealId: v.id("deals"),
		mortgageId: v.id("mortgages"),
		// Owner reference - union type: userId from users table OR "fairlend" literal
		fromOwnerId: v.union(v.literal("fairlend"), v.id("users")),
		toOwnerId: v.id("users"),
		// Transfer details
		percentage: v.number(), // Percentage being transferred (0-100)
		// Status tracking
		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected")
		),
		// Timestamps
		createdAt: v.number(),
		reviewedAt: v.optional(v.number()),
		// Review metadata
		reviewedBy: v.optional(v.id("users")),
		reviewNotes: v.optional(v.string()),
		// Rejection tracking for manual resolution escalation
		rejectionCount: v.optional(v.number()),
	})
		.index("by_deal", ["dealId"])
		.index("by_status", ["status"])
		.index("by_mortgage", ["mortgageId"]),

	// ============================================================================
	// Investor Onboarding Tables
	// ============================================================================

	/**
	 * Broker codes for investor onboarding
	 * Maps unique codes to brokers for self-directed investor onboarding
	 */
	broker_codes: defineTable({
		// The actual code (e.g., "ABC123") - stored uppercase for case-insensitive lookup
		code: v.string(),
		// Reference to the broker
		brokerId: v.id("brokers"),
		// Optional description (e.g., "Spring 2024 Campaign")
		description: v.optional(v.string()),
		// Expiration date (optional)
		expiresAt: v.optional(v.string()), // ISO timestamp
		// Usage tracking
		maxUses: v.optional(v.number()), // null = unlimited
		useCount: v.number(),
		// Status
		isActive: v.boolean(),
		// Timestamps
		createdAt: v.string(), // ISO timestamp
		createdBy: v.id("users"),
		updatedAt: v.string(),
	})
		.index("by_code", ["code"])
		.index("by_broker", ["brokerId"])
		.index("by_active_code", ["isActive", "code"]),

	/**
	 * Investor onboarding step configurations
	 * Defines step order and settings for different broker types
	 */
	investor_onboarding_configs: defineTable({
		// Configuration identifier: "fairlend", "external_broker", or specific brokerId
		configId: v.string(),
		// Step order (array of step IDs)
		stepOrder: v.array(v.string()),
		// Step-specific settings
		stepSettings: v.record(
			v.string(), // stepId
			v.object({
				isRequired: v.boolean(),
				allowSkip: v.boolean(),
				customFields: v.optional(v.record(v.string(), v.any())),
			})
		),
		// Configuration version for migration handling
		version: v.number(),
		// Timestamps
		createdAt: v.string(),
		updatedAt: v.string(),
	})
		.index("by_config_id", ["configId"])
		.index("by_version", ["configId", "version"]),

	/**
	 * Audit events - durable storage for events before external emission
	 * Write-ahead pattern ensures no events lost; supports at-least-once delivery
	 */
	audit_events: defineTable({
		// Event identification
		eventType: v.string(), // e.g., "ownership.transfer.created"
		entityType: v.string(), // e.g., "mortgage_ownership"
		entityId: v.string(), // ID of the affected entity
		// Actor
		userId: v.id("users"), // Who triggered the event
		// Timing
		timestamp: v.number(),
		// State snapshots (sanitized - no PII)
		beforeState: v.optional(v.any()),
		afterState: v.optional(v.any()),
		// Additional context
		metadata: v.optional(v.any()),
		// Emission tracking
		emittedAt: v.optional(v.number()), // null = not yet emitted
		emitFailures: v.optional(v.number()), // Retry counter
	})
		.index("by_entity", ["entityType", "entityId"])
		.index("by_type", ["eventType"])
		.index("by_emitted", ["emittedAt"]) // For cron job - find unemitted events
		.index("by_user", ["userId"])
		.index("by_timestamp", ["timestamp"]), // For 7-year retention cleanup

	// ============================================================================
	// Borrower & Rotessa Sync Tables
	// ============================================================================

	/**
	 * Rotessa sync log - tracks daily CRON and manual sync operations
	 * Used for admin dashboard and audit trail
	 */
	rotessa_sync_log: defineTable({
		// Sync type and scope
		syncType: v.union(v.literal("daily"), v.literal("manual")),
		scope: v.union(
			v.literal("all"),
			v.literal("borrower"),
			v.literal("mortgage")
		),
		entityId: v.optional(v.string()), // borrowerId or mortgageId when scoped

		// Status tracking
		status: v.union(
			v.literal("running"),
			v.literal("completed"),
			v.literal("partial"),
			v.literal("failed")
		),

		// Admin who triggered manual sync
		triggeredBy: v.optional(v.id("users")),

		// Timestamps
		startedAt: v.number(),
		completedAt: v.optional(v.number()),

		// Metrics
		metrics: v.optional(
			v.object({
				transactionsProcessed: v.number(),
				paymentsCreated: v.number(),
				paymentsUpdated: v.number(),
				ledgerTransactionsCreated: v.number(),
				errors: v.number(),
			})
		),

		// Error details for debugging
		errors: v.optional(
			v.array(
				v.object({
					transactionId: v.string(),
					error: v.string(),
					timestamp: v.number(),
				})
			)
		),

		// Date range for sync (custom range for manual sync)
		dateRange: v.optional(
			v.object({
				startDate: v.string(), // ISO date
				endDate: v.string(), // ISO date
			})
		),
	})
		.index("by_status", ["status"])
		.index("by_started_at", ["startedAt"])
		.index("by_sync_type", ["syncType"]),

	/**
	 * Deferral requests - borrower self-service payment deferral requests
	 * Admin reviews and approves/rejects requests
	 */
	deferral_requests: defineTable({
		// References
		borrowerId: v.id("borrowers"),
		mortgageId: v.id("mortgages"),

		// Request type
		requestType: v.union(v.literal("one_time"), v.literal("hardship")),

		// Request details
		requestedDeferralDate: v.string(), // ISO date
		reason: v.optional(v.string()),

		// Status
		status: v.union(
			v.literal("pending"),
			v.literal("approved"),
			v.literal("rejected")
		),

		// Admin decision
		adminDecision: v.optional(
			v.object({
				decidedBy: v.id("users"),
				decidedAt: v.string(), // ISO timestamp
				reason: v.optional(v.string()),
			})
		),

		// Rotessa adjustment reference (after approval)
		rotessaAdjustmentId: v.optional(v.string()),

		// Timestamps
		createdAt: v.string(), // ISO timestamp
	})
		.index("by_borrower", ["borrowerId"])
		.index("by_mortgage", ["mortgageId"])
		.index("by_status", ["status"]),

	// ============================================================================
	// Telemetry / OTel Tracing Tables
	// ============================================================================

	/**
	 * Trace runs — one record per top-level trace.
	 * Aggregates metadata across all spans in the trace.
	 */
	trace_runs: defineTable({
		traceId: v.string(),
		requestId: v.optional(v.string()),
		rootFunction: v.string(),
		status: v.union(
			v.literal("started"),
			v.literal("completed"),
			v.literal("error")
		),
		startedAt: v.number(),
		endedAt: v.optional(v.number()),
		durationMs: v.optional(v.number()),
		environment: v.optional(v.string()),
		spanCount: v.optional(v.number()),
		// OTLP export tracking
		exportedAt: v.optional(v.number()),
		exportError: v.optional(v.string()),
	})
		.index("by_traceId", ["traceId"])
		.index("by_status", ["status"])
		.index("by_startedAt", ["startedAt"])
		.index("by_exported", ["exportedAt"]),

	/**
	 * Individual spans within a trace.
	 * Each function invocation (query/mutation/action) produces one span.
	 */
	trace_spans: defineTable({
		traceId: v.string(),
		spanId: v.string(),
		parentSpanId: v.optional(v.string()),
		functionName: v.string(),
		kind: v.union(
			v.literal("query"),
			v.literal("mutation"),
			v.literal("action"),
			v.literal("internal")
		),
		status: v.union(
			v.literal("started"),
			v.literal("completed"),
			v.literal("error")
		),
		startedAt: v.number(),
		endedAt: v.optional(v.number()),
		durationMs: v.optional(v.number()),
		attributes: v.optional(v.any()),
		payloadRef: v.optional(v.string()),
		error: v.optional(
			v.object({
				message: v.string(),
				code: v.optional(v.string()),
				stack: v.optional(v.string()),
			})
		),
	})
		.index("by_traceId", ["traceId"])
		.index("by_traceId_startedAt", ["traceId", "startedAt"]),

	/**
	 * Captured payloads (args, results, errors) for dev-mode inspection.
	 * Linked to spans via payloadRef.
	 */
	trace_payloads: defineTable({
		payloadRef: v.string(),
		traceId: v.string(),
		spanId: v.string(),
		kind: v.union(
			v.literal("args"),
			v.literal("context"),
			v.literal("state"),
			v.literal("result"),
			v.literal("error")
		),
		content: v.string(),
		sizeBytes: v.number(),
		redacted: v.boolean(),
		createdAt: v.number(),
	})
		.index("by_payloadRef", ["payloadRef"])
		.index("by_traceId_spanId", ["traceId", "spanId"])
		.index("by_createdAt", ["createdAt"]),
});
