//Use loading spinner

import { Spinner } from "@/components/ui/spinner";

export default function Loading() {
	return (
		<div className="flex h-full min-h-[calc(100vh-6rem)] w-full items-center justify-center">
			<Spinner className="size-8" />
		</div>
	);
}
