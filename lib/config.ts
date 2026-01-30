export const BASE_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "fairlend.ca";

export const getPortalUrl = (subdomain: string) =>
	`https://${subdomain}.${BASE_DOMAIN}`;
