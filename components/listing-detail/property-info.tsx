import { Card, CardContent, Chip } from "@heroui/react";
import { Icon } from "@iconify/react";

type PropertyInfoProps = {
	title: string;
	address: {
		street: string;
		city: string;
		state: string;
		zip: string;
		country: string;
	};
	investorBrief?: string;
	status: string;
};

const statusConfig: Record<
	string,
	{ label: string; color: "success" | "warning" | "default"; icon: string }
> = {
	active: {
		label: "Active",
		color: "success",
		icon: "lucide:circle-check",
	},
	funded: {
		label: "Funded",
		color: "warning",
		icon: "lucide:circle-dollar-sign",
	},
	closed: {
		label: "Closed",
		color: "default",
		icon: "lucide:circle-x",
	},
};

export function PropertyInfo({
	title,
	address,
	investorBrief,
	status,
}: PropertyInfoProps) {
	const statusInfo = statusConfig[status] || statusConfig.active;

	return (
		<div className="space-y-6">
			{/* Header with title and status */}
			<div>
				<div className="mb-3 flex items-start justify-between gap-4">
					<h1 className="font-bold text-3xl text-gray-900 tracking-tight md:text-4xl dark:text-white">
						{title}
					</h1>
					<Chip
						className="flex flex-shrink-0 items-center gap-1"
						color={statusInfo.color}
					>
						<Icon
							aria-hidden="true"
							className="h-4 w-4"
							icon={statusInfo.icon}
						/>
						<span>{statusInfo.label}</span>
					</Chip>
				</div>

				{/* Address */}
				<div className="flex items-start gap-2 text-gray-600 text-lg dark:text-gray-400">
					<Icon
						className="mt-0.5 h-5 w-5 flex-shrink-0"
						icon="lucide:map-pin"
					/>
					<address className="not-italic">
						{address.street}, {address.city}, {address.state} {address.zip}
					</address>
				</div>
			</div>

			{/* Investor Brief */}
			{investorBrief && (
				<Card.Root>
					<CardContent>
						<div className="space-y-3">
							<div className="flex items-center gap-2">
								<Icon
									className="h-5 w-5 text-primary"
									icon="lucide:file-text"
								/>
								<h2 className="font-semibold text-lg">Investor Brief</h2>
							</div>
							<div className="prose prose-sm dark:prose-invert max-w-none">
								<p className="whitespace-pre-wrap text-gray-700 dark:text-gray-300">
									{investorBrief}
								</p>
							</div>
						</div>
					</CardContent>
				</Card.Root>
			)}
		</div>
	);
}
