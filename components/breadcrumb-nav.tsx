"use client";

import { Home } from "lucide-react";
import Link from "next/link";
import { useEffect, useState, ViewTransition } from "react";
import {
	Breadcrumb,
	BreadcrumbItem,
	BreadcrumbLink,
	BreadcrumbList,
	BreadcrumbPage,
	BreadcrumbSeparator,
} from "@/components/ui/breadcrumb";

export type BreadcrumbItemProps = {
	label: string;
	href?: string;
};

type BreadcrumbNavProps = {
	items: BreadcrumbItemProps[];
	className?: string;
};

/**
 * Professional breadcrumb navigation component
 * Shows navigational hierarchy with clickable links
 *
 * @example
 * <BreadcrumbNav items={[
 *   { label: "Listings", href: "/listings" },
 *   { label: "Property Details" }
 * ]} />
 */
export function BreadcrumbNav({ className, items }: BreadcrumbNavProps) {
	const [localItems, setLocalItems] = useState<BreadcrumbItemProps[]>(items);
	useEffect(() => {
		setLocalItems(items);
	}, [items]);
	return (
		<ViewTransition>
			<div className={className}>
				<Breadcrumb>
					<BreadcrumbList>
						{/* Home link */}
						{/* <BreadcrumbItem>
							<BreadcrumbLink asChild>
								<Link
									href="/"
									className="flex items-center gap-1.5"
									aria-label="Go to home"
								>
									<Home className="h-4 w-4" />
									<span className="sr-only md:not-sr-only md:inline">Home</span>
								</Link>
							</BreadcrumbLink>
						</BreadcrumbItem> */}

						{localItems.map((item, index) => {
							const isLast = index === localItems.length - 1;
							if (index === 0) {
								return (
									<div className="contents" key={item.label}>
										<BreadcrumbItem key={item.label}>
											<BreadcrumbLink asChild>
												<Link
													aria-label="Go to home"
													className="flex items-center gap-1.5"
													href="/"
												>
													<Home className="h-4 w-4" />
													<span className="sr-only md:not-sr-only md:inline">
														Home
													</span>
												</Link>
											</BreadcrumbLink>
										</BreadcrumbItem>
										<BreadcrumbSeparator />
									</div>
								);
							}
							return (
								<div className="contents" key={item.label}>
									<BreadcrumbItem>
										{isLast || !item.href ? (
											<BreadcrumbPage>{item.label}</BreadcrumbPage>
										) : (
											<BreadcrumbLink asChild>
												<Link href={item.href}>{item.label}</Link>
											</BreadcrumbLink>
										)}
									</BreadcrumbItem>
									{!isLast && <BreadcrumbSeparator />}
								</div>
							);
						})}
					</BreadcrumbList>
				</Breadcrumb>
			</div>
		</ViewTransition>
	);
}
