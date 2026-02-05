export const useRouter = () => ({
	push: (_path: string) => {},
	replace: (_path: string) => {},
	refresh: () => {},
	back: () => {},
	forward: () => {},
	prefetch: async (_path: string) => {},
});

export const useSearchParams = () => new URLSearchParams();

export const usePathname = () => "/";

export const useParams = () => ({});
