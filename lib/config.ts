export const BASE_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN || "fairlend.ca";

export const getPortalUrl = (subdomain: string) => {
	return `https://${subdomain}.${BASE_DOMAIN}`;
};
