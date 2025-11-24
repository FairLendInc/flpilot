// @vitest-environment node
import { convexTest } from "convex-test";
import { describe, expect, test } from "vitest";
import { api } from "../_generated/api";
import type { Doc } from "../_generated/dataModel";
import schema from "../schema";

// Lazy import for all modules so convexTest can load handlers
// @ts-ignore
const modules = import.meta.glob("../**/*.{ts,tsx,js,jsx}", { eager: false });
const createTest = () => convexTest(schema, modules);

async function createUser(t: ReturnType<typeof createTest>, subject: string) {
	return await t.run(async (ctx) =>
		ctx.db.insert("users", {
			idp_id: subject,
			email: `${subject}@example.com`,
			email_verified: true,
			first_name: "Test",
			last_name: "User",
			created_at: new Date().toISOString(),
			updated_at: new Date().toISOString(),
		})
	);
}

function withIdentity(
	t: ReturnType<typeof createTest>,
	subject: string,
	role: string
) {
	return t.withIdentity({
		subject,
		role,
	});
}

describe("Onboarding journeys", () => {
	test("creates default journey on ensure", async () => {
		const t = createTest();
		const subject = "member-default";
		await createUser(t, subject);
		const member = withIdentity(t, subject, "member");

		await member.mutation(api.onboarding.ensureJourney, {});
		const journey = await member.query(api.onboarding.getJourney, {});

		expect(journey).not.toBeNull();
		expect(journey?.persona).toBe("unselected");
		expect(journey?.stateValue).toBe("personaSelection");
		expect(journey?.status).toBe("draft");
	});

	test("investor flow persists steps and submits", async () => {
		const t = createTest();
		const subject = "member-investor";
		await createUser(t, subject);
		const member = withIdentity(t, subject, "member");

		await member.mutation(api.onboarding.ensureJourney, {});
		await member.mutation(api.onboarding.startJourney, { persona: "investor" });

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.profile",
			investor: {
				profile: {
					firstName: "Investor",
					lastName: "One",
					entityType: "individual",
					phone: "555-1212",
				},
			},
		});

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.preferences",
			investor: {
				preferences: {
					minTicket: 100000,
					maxTicket: 500000,
					riskProfile: "balanced",
					liquidityHorizonMonths: 24,
					focusRegions: ["ON", "BC"],
				},
			},
		});

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.kycStub",
			investor: {
				kycPlaceholder: {
					status: "submitted",
				},
			},
		});

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.documentsStub",
			investor: {
				documents: [],
			},
		});

		const submitted = await member.mutation(
			api.onboarding.submitInvestorJourney,
			{ finalNotes: "ready" }
		);

		expect(submitted?.status).toBe("awaiting_admin");
		expect(submitted?.stateValue).toBe("pendingAdmin");

		// Ensure persistence survived round-trip
		const journey = await member.query(api.onboarding.getJourney, {});
		expect(journey?.context?.investor?.preferences?.focusRegions).toEqual([
			"ON",
			"BC",
		]);
	});

	test("min ticket validation triggers error", async () => {
		const t = createTest();
		const subject = "investor-validation";
		await createUser(t, subject);
		const member = withIdentity(t, subject, "member");

		await member.mutation(api.onboarding.ensureJourney, {});
		await member.mutation(api.onboarding.startJourney, { persona: "investor" });

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.profile",
			investor: {
				profile: {
					firstName: "Validation",
					lastName: "Investor",
					entityType: "individual",
				},
			},
		});

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.preferences",
			investor: {
				preferences: {
					minTicket: 600000,
					maxTicket: 500000,
					riskProfile: "growth",
					liquidityHorizonMonths: 18,
				},
			},
		});

		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.kycStub",
			investor: {
				kycPlaceholder: { status: "submitted" },
			},
		});

		await expect(
			member.mutation(api.onboarding.submitInvestorJourney, {})
		).rejects.toThrow("Minimum ticket cannot exceed maximum ticket");
	});

	test("admins can approve and rejection locks persona", async () => {
		const t = createTest();
		const applicantSubject = "member-approval";
		await createUser(t, applicantSubject);
		const member = withIdentity(t, applicantSubject, "member");

		await member.mutation(api.onboarding.ensureJourney, {});
		await member.mutation(api.onboarding.startJourney, { persona: "investor" });
		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.profile",
			investor: {
				profile: {
					firstName: "Approval",
					lastName: "Investor",
					entityType: "individual",
				},
			},
		});
		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.preferences",
			investor: {
				preferences: {
					minTicket: 100000,
					maxTicket: 300000,
					riskProfile: "conservative",
					liquidityHorizonMonths: 12,
				},
			},
		});
		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.kycStub",
			investor: { kycPlaceholder: { status: "submitted" } },
		});
		await member.mutation(api.onboarding.submitInvestorJourney, {});

		const adminSubject = "admin-approver";
		await createUser(t, adminSubject);
		const admin = withIdentity(t, adminSubject, "admin");

		const pending = await admin.query(api.onboarding.listPending, {});
		expect(pending).not.toBeNull();
		expect(pending).toHaveLength(1);

		const approved = await admin.mutation(api.onboarding.approveJourney, {
			journeyId: pending?.[0]?.journey._id ?? ("" as Id<"onboarding_journeys">),
			notes: "looks good",
		});
		expect(approved?.status).toBe("approved");
		expect(approved?.adminDecision?.notes).toBe("looks good");

		const adminSubject2 = "admin-second";
		await createUser(t, adminSubject2);
		const admin2 = withIdentity(t, adminSubject2, "admin");
		await expect(
			admin2.mutation(api.onboarding.rejectJourney, {
				journeyId: pending?.[0]?.journey._id ?? ("" as Id<"onboarding_journeys">),
				reason: "needs more info",
			})
		).rejects.toThrow("Only pending journeys can be rejected");

		// Create a new applicant to validate rejection path
		const rejectionSubject = "member-reject";
		await createUser(t, rejectionSubject);
		const rejectionMember = withIdentity(t, rejectionSubject, "member");
		await rejectionMember.mutation(api.onboarding.ensureJourney, {});
		await rejectionMember.mutation(api.onboarding.startJourney, {
			persona: "investor",
		});
		await rejectionMember.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.profile",
			investor: {
				profile: {
					firstName: "Rejected",
					lastName: "Investor",
					entityType: "individual",
				},
			},
		});
		await rejectionMember.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.preferences",
			investor: {
				preferences: {
					minTicket: 25000,
					maxTicket: 75000,
					riskProfile: "conservative",
					liquidityHorizonMonths: 6,
				},
			},
		});
		await rejectionMember.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.kycStub",
			investor: { kycPlaceholder: { status: "submitted" } },
		});
		await rejectionMember.mutation(api.onboarding.submitInvestorJourney, {});

		const pendingReject = await admin.query(api.onboarding.listPending, {});
		expect(pendingReject).not.toBeNull();
		const rejectionJourney = pendingReject?.find(
			(entry: { journey: { userId: string } }) =>
				entry.journey.userId !== pending?.[0]?.journey.userId
		);
		expect(rejectionJourney).toBeDefined();

		const rejectionResult = await admin2.mutation(
			api.onboarding.rejectJourney,
			{
				journeyId:
					rejectionJourney?.journey._id ?? ("" as Id<"onboarding_journeys">),
				reason: "Need additional docs",
			}
		);
		expect(rejectionResult?.status).toBe("rejected");
	});

	test("double approval is prevented", async () => {
		const t = createTest();
		const subject = "member-race";
		await createUser(t, subject);
		const member = withIdentity(t, subject, "member");

		await member.mutation(api.onboarding.ensureJourney, {});
		await member.mutation(api.onboarding.startJourney, { persona: "investor" });
		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.profile",
			investor: {
				profile: {
					firstName: "Race",
					lastName: "Investor",
					entityType: "individual",
				},
			},
		});
		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.preferences",
			investor: {
				preferences: {
					minTicket: 50000,
					maxTicket: 200000,
					riskProfile: "balanced",
					liquidityHorizonMonths: 18,
				},
			},
		});
		await member.mutation(api.onboarding.saveInvestorStep, {
			stateValue: "investor.kycStub",
			investor: { kycPlaceholder: { status: "submitted" } },
		});
		await member.mutation(api.onboarding.submitInvestorJourney, {});

		const pending = await member.query(api.onboarding.getJourney, {});
		const journeyId = pending?._id ?? ("" as Id<"onboarding_journeys">);

		const adminSubjectA = "admin-a";
		const adminSubjectB = "admin-b";
		await createUser(t, adminSubjectA);
		await createUser(t, adminSubjectB);
		const adminA = withIdentity(t, adminSubjectA, "admin");
		const adminB = withIdentity(t, adminSubjectB, "admin");

		const [first, second] = await Promise.allSettled([
			adminA.mutation(api.onboarding.approveJourney, {
				journeyId,
			}),
			adminB.mutation(api.onboarding.approveJourney, {
				journeyId,
			}),
		]);

		const fulfilled = [first, second].filter(
			(
				result
			): result is PromiseFulfilledResult<Doc<"onboarding_journeys"> | null> =>
				result.status === "fulfilled"
		);
		const rejected = [first, second].filter(
			(result): result is PromiseRejectedResult => result.status === "rejected"
		);

		expect(fulfilled).toHaveLength(1);
		expect(rejected).toHaveLength(1);
	});
});
