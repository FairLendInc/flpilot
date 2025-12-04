type DashboardRole =
	| "org-admin"
	| "admin"
	| "broker"
	| "lawyer"
	| "investor"
	| "member";

type DashboardAccessConfig = {
	home: string;
	allowedPrefixes: string[];
};

const ROLE_ALIASES: Record<string, DashboardRole> = {
	"org-admin": "org-admin",
	admin: "admin",
	broker: "broker",
	lawyer: "lawyer",
	investor: "investor",
	member: "member",
};

const DASHBOARD_ACCESS: Record<DashboardRole, DashboardAccessConfig> = {
	"org-admin": {
		home: "/dashboard/admin",
		allowedPrefixes: ["/dashboard"],
	},
	admin: {
		home: "/dashboard/admin",
		allowedPrefixes: ["/dashboard"],
	},
	broker: {
		home: "/dashboard/broker",
		allowedPrefixes: ["/dashboard/broker"],
	},
	lawyer: {
		home: "/dashboard/lawyer",
		allowedPrefixes: ["/dashboard/lawyer"],
	},
	investor: {
		home: "/dashboard/investor",
		allowedPrefixes: ["/dashboard/investor"],
	},
	member: {
		home: "/profile",
		allowedPrefixes: ["/profile"],
	},
};

const normalizeRole = (
	role: string | DashboardRole | null | undefined
): DashboardRole | null => {
	if (!role) {
		return null;
	}

	const key = role.toLowerCase();
	return ROLE_ALIASES[key] ?? null;
};

export const dashboardHome = (role: string | null | undefined): string => {
	const normalized = normalizeRole(role);
	if (!normalized) {
		return "/profile";
	}

	return DASHBOARD_ACCESS[normalized].home;
};

export const hasDashboardAccess = (
	role: string | DashboardRole | null | undefined,
	pathname: string
): boolean => {
	const normalized = normalizeRole(role);
	if (!normalized) {
		return false;
	}

	const { allowedPrefixes } = DASHBOARD_ACCESS[normalized];

	if (allowedPrefixes.includes("/dashboard")) {
		return true;
	}

	return allowedPrefixes.some((prefix) => pathname.startsWith(prefix));
};

export const dashboardRedirectForPath = (
	pathname: string,
	role: string | null | undefined
): string | null => {
	if (!pathname.startsWith("/dashboard")) {
		return null;
	}

	const normalized = normalizeRole(role);
	if (!normalized) {
		return "/sign-in";
	}

	const access = DASHBOARD_ACCESS[normalized];

	if (pathname === "/dashboard") {
		return access.home;
	}

	if (!hasDashboardAccess(normalized, pathname)) {
		return access.home;
	}

	return null;
};

export const isDashboardAdmin = (role: string | null | undefined): boolean => {
	const normalized = normalizeRole(role);
	return normalized === "admin" || normalized === "org-admin";
};
