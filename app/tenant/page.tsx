import { fetchQuery } from "convex/nextjs";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { BrokerLandingPage } from "@/components/broker/BrokerLandingPage";
import { api } from "@/convex/_generated/api";

export default async function TenantPage() {
	const headerList = await headers();
	const subdomain = headerList.get("x-subdomain");

	if (!subdomain) {
		notFound();
	}

	// Fetch broker data for this subdomain
	const brokerData = await fetchQuery(
		api.brokers.codes.getBrokerLandingPageData,
		{ subdomain }
	);

	if (!brokerData) {
		notFound();
	}

	return (
		<BrokerLandingPage
			broker={brokerData.broker}
			brokerCode={brokerData.brokerCode}
		/>
	);
}
