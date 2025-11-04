export type MockOrganization = {
	id: string;
	name: string;
	domains: string[];
	created_at: string;
	isMock?: true;
};

export const MOCK_ORGS: MockOrganization[] = [
	{
		id: "org_verdant",
		name: "Verdant Capital",
		domains: ["verdant.capital"],
		created_at: "2024-01-09T12:00:00Z",
		isMock: true,
	},
	{
		id: "org_northwind",
		name: "Northwind Partners",
		domains: ["northwind.io"],
		created_at: "2024-02-15T09:30:00Z",
		isMock: true,
	},
	{
		id: "org_aurora",
		name: "Aurora Ventures",
		domains: ["aurora.vc"],
		created_at: "2024-03-21T14:45:00Z",
		isMock: true,
	},
];

export const MOCK_MEMBERSHIPS = (userId: string) => [
	{
		id: "mem_1",
		user_id: userId,
		organization_id: "org_verdant",
		status: "active",
		role: { slug: "member" },
		isMock: true as const,
	},
	{
		id: "mem_2",
		user_id: userId,
		organization_id: "org_aurora",
		status: "active",
		role: { slug: "admin" },
		isMock: true as const,
	},
];
