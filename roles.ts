// examples: role seeds (global)
export const roles = [
	{ name: "PAdmin", inherits: [] },
	{ name: "Admin", inherits: [] },
	{ name: "Broker", inherits: [] },
	{ name: "Investor", inherits: [] },
	{ name: "Lawyer", inherits: [] },
	{ name: "Member", inherits: [] },
];

export const rolePerms: Record<string, string[]> = {
	PAdmin: [
		"mortgage.read",
		"mortgage.list",
		"mortgage.create",
		"mortgage.update",
		"mortgage.delete",
		"mortgage.buylock",
		"mortgage.*",
		"deal.*",
		"deal.create",
		"deal.update",
		"deal.delete",
		"org.invite",
		"org.member.update",
		"org.billing",
		"widgets:users-table:manage",
		"profile.*",
		"org.*",
	],
	Admin: [
		"mortgage.*",
		"profile.*",
		"org.*",
		"deal.*",
		"widgets:users-table:manage",
	],
	Broker: ["mortgage.create", "mortgage.read"],
	Investor: ["mortgage.read", "mortgage.list", "deal.read", "mortgage.buylock"],
	Lawyer: ["mortgage.read", "mortgage.list", "deal.read"],
};
