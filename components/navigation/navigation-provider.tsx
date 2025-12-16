"use client";
import { usePathname } from "next/navigation";
import { Suspense, useEffect } from "react";
import { usePathNameStore } from "../contexts/pathNameContext";
import { TwoLevelNav } from "./two-level-nav";
export type BreadcrumbItem = {
	label: string;
	href?: string;
};

export default function NavigationProvider({
	children,
}: {
	children: React.ReactNode;
}) {
	const currentPathname = usePathname();
	const { setPathname, breadcrumbs, pathname } = usePathNameStore();
	useEffect(() => {
		setPathname(currentPathname);
	}, [currentPathname, setPathname]);

	return (
		<>
			<Suspense fallback={null}>
				<TwoLevelNav breadcrumbs={breadcrumbs} pathname={pathname} />
			</Suspense>
			{children}
		</>
	);
}
