import { Separator } from "@/components/ui/separator";
import { SidebarTrigger } from "@/components/ui/sidebar";
import ListingCreationForm from "./ListingCreationForm";

export default function AdminNewListingPage() {
	return (
		<>
			<header className="flex h-16 shrink-0 items-center gap-2 border-b px-4">
				<SidebarTrigger className="-ml-1" />
				<Separator className="mr-2 h-4" orientation="vertical" />
				<div>
					<h1 className="font-semibold text-lg">Create Listing</h1>
					<p className="text-muted-foreground text-sm">
						Draft a new marketplace listing and share it with webhook integrations.
					</p>
				</div>
			</header>
			<div className="flex flex-1 flex-col gap-6 p-6">
				<ListingCreationForm />
			</div>
		</>
	);
}
