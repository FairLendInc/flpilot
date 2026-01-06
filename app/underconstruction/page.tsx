import { ArrowLeft, Construction } from "lucide-react";
import Link from "next/link";
import { UserAuthStatus } from "@/app/underconstruction/components/UserAuthStatus";

export default function UnderConstructionPage() {
	return (
		<main className="flex min-h-screen flex-col items-center justify-center bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 px-4">
			<div className="w-full max-w-md text-center">
				{/* Icon */}
				<div className="mb-8 flex justify-center">
					<div className="rounded-full border border-amber-500/20 bg-amber-500/10 p-4">
						<Construction className="h-16 w-16 text-amber-500" />
					</div>
				</div>

				{/* Title */}
				<h1 className="mb-4 font-bold text-4xl text-white">
					Under Construction
				</h1>

				{/* Description */}
				<p className="mb-8 text-lg text-slate-400">
					We&apos;re building something great. This area of the platform is
					currently under development and will be available soon.
				</p>

				{/* Divider */}
				<div className="mx-auto mb-8 h-1 w-16 rounded-full bg-gradient-to-r from-amber-500 to-orange-500" />

				{/* Actions */}
				<div className="flex flex-col items-center gap-8">
					<UserAuthStatus />

					<Link
						className="inline-flex items-center gap-2 text-slate-500 transition-colors hover:text-white"
						href="/"
					>
						<ArrowLeft className="h-4 w-4" />
						<span className="font-medium text-sm">Back to Home</span>
					</Link>
				</div>
			</div>

			{/* Background decoration */}
			<div className="pointer-events-none absolute inset-0 overflow-hidden">
				<div className="-left-64 absolute top-1/4 h-96 w-96 rounded-full bg-amber-500/5 blur-3xl" />
				<div className="-right-64 absolute bottom-1/4 h-96 w-96 rounded-full bg-orange-500/5 blur-3xl" />
			</div>
		</main>
	);
}
