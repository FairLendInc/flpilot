import { create } from "zustand";
import { SITE_URL } from "../../lib/siteurl";

type State = {
	pathname: string;
	breadcrumbs: { label: string; href?: string }[];
};

type Actions = {
	setPathname: (pathname: string) => void;
	setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => void;
};

export const usePathNameStore = create<State & Actions>((set) => ({
	pathname: "",
	setPathname: (pathname: string) => {
		set({ pathname });
		const pathParts = pathname.split("/") ?? [];
		const breadcrumbs = pathParts.map((part, index) => ({
			label: part.charAt(0).toUpperCase() + part.slice(1),
			href: `${SITE_URL}${pathParts.slice(0, index + 1).join("/")}`,
		}));
		set({ breadcrumbs });
	},
	breadcrumbs: [],
	setBreadcrumbs: (breadcrumbs: { label: string; href?: string }[]) => {
		set({ breadcrumbs });
	},
}));
