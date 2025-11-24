export const SITE_URL =
	process.env.NEXT_PUBLIC_SITE_URL ||
	(process.env.VERCEL_URL && `https://${process.env.VERCEL_URL}`) ||
	"http://localhost:3000";

export const ROOT_DOMAIN =
	process.env.NEXT_PUBLIC_ROOT_DOMAIN || "fairlend.com";
