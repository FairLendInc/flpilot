"use client";

import Link from "next/link";
import { useBranding } from "@/contexts/BrandingContext";
import type { Id } from "@/convex/_generated/dataModel";

type EntityType = "broker" | "client" | "deal" | "listing" | "mortgage";

type EntityLinkProps = {
	type: EntityType;
	id: string | Id<"brokers" | "users" | "deals" | "listings" | "mortgages">;
	children: React.ReactNode;
	className?: string;
};

export function EntityLink({ type, id, children, className }: EntityLinkProps) {
	const { isBranded } = useBranding();

	const getPath = () => {
		const basePath = isBranded ? "" : "/dashboard";

		switch (type) {
			case "broker":
				return `${basePath}/admin/brokers/${id}`;
			case "client":
				return `${basePath}/broker/clients/${id}`;
			case "deal":
				return `${basePath}/deals/${id}`;
			case "listing":
				return `${basePath}/listings/${id}`;
			case "mortgage":
				return `${basePath}/mortgages/${id}`;
			default:
				return `${basePath}/${type}s/${id}`;
		}
	};

	return (
		<Link className={className} href={getPath()}>
			{children}
		</Link>
	);
}

type BrokerPortalLinkProps = {
	path: string;
	children: React.ReactNode;
	className?: string;
};

export function BrokerPortalLink({
	path,
	children,
	className,
}: BrokerPortalLinkProps) {
	const { subdomain, isBranded } = useBranding();

	if (isBranded && subdomain) {
		return (
			<Link
				className={className}
				href={`https://${subdomain}.flpilot.com${path}`}
			>
				{children}
			</Link>
		);
	}

	return (
		<Link className={className} href={`/dashboard/broker${path}`}>
			{children}
		</Link>
	);
}

export function AdminLink({
	path,
	children,
	className,
}: {
	path: string;
	children: React.ReactNode;
	className?: string;
}) {
	return (
		<Link className={className} href={`/dashboard/admin${path}`}>
			{children}
		</Link>
	);
}
