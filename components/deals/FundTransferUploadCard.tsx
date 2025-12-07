import { useAction, useMutation } from "convex/react";
import { formatDistanceToNow } from "date-fns";
import { Clock, FileText, History, UploadCloud } from "lucide-react";
import { useState } from "react";
import { toast } from "sonner";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type UploadMeta = {
	storageId: Id<"_storage">;
	uploadedBy: string;
	uploadedAt: number;
	fileName: string;
	fileType: string;
};

type FundTransferUploadCardProps = {
	dealId: Id<"deals">;
	currentState?: string | null;
	currentUpload?: UploadMeta | null;
	uploadHistory?: UploadMeta[] | null;
};

const ACCEPTED_TYPES = [
	"application/pdf",
	"image/png",
	"image/jpeg",
	"image/jpg",
] as const;

export function FundTransferUploadCard({
	dealId,
	currentState,
	currentUpload,
	uploadHistory,
}: FundTransferUploadCardProps) {
	const generateUploadUrl = useAction(api.deals.generateFundTransferUploadUrl);
	const recordUpload = useMutation(api.deals.recordFundTransferUpload);
	const [isUploading, setIsUploading] = useState(false);

	if (currentState !== "pending_transfer") {
		return null;
	}

	const handleFileChange = async (
		event: React.ChangeEvent<HTMLInputElement>
	) => {
		const file = event.target.files?.[0];
		if (!file) return;

		if (
			!ACCEPTED_TYPES.includes(file.type as (typeof ACCEPTED_TYPES)[number])
		) {
			toast.error("Invalid file type", {
				description: "Only PDF, PNG, and JPEG files are allowed.",
			});
			event.target.value = "";
			return;
		}

		setIsUploading(true);
		try {
			const uploadUrl = await generateUploadUrl({ dealId });
			const response = await fetch(uploadUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!response.ok) {
				throw new Error("Upload failed");
			}

			const { storageId } = (await response.json()) as {
				storageId: Id<"_storage">;
			};

			await recordUpload({
				dealId,
				storageId,
				fileName: file.name,
				fileType: file.type,
			});

			toast.success("Upload successful", {
				description: "Fund transfer proof has been recorded.",
			});
		} catch (error) {
			const message =
				error instanceof Error ? error.message : "Unable to upload file.";
			toast.error("Upload failed", { description: message });
		} finally {
			setIsUploading(false);
			event.target.value = "";
		}
	};

	const renderUploadMeta = (label: string, upload?: UploadMeta | null) => {
		if (!upload) return null;

		return (
			<div className="rounded-lg border p-3">
				<div className="flex items-center gap-2 font-medium text-sm">
					<FileText className="h-4 w-4 text-muted-foreground" />
					<span>{label}</span>
				</div>
				<p className="mt-2 text-sm">{upload.fileName}</p>
				<div className="mt-2 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
					<span className="flex items-center gap-1">
						<Clock className="h-3 w-3" />
						{formatDistanceToNow(upload.uploadedAt, { addSuffix: true })}
					</span>
					<span>{upload.fileType}</span>
				</div>
			</div>
		);
	};

	return (
		<Card>
			<CardHeader>
				<CardTitle className="flex items-center gap-2">
					<UploadCloud className="h-5 w-5" />
					Fund Transfer Upload
				</CardTitle>
			</CardHeader>
			<CardContent className="space-y-4">
				<div className="space-y-2">
					<Label htmlFor="upload-proof">Upload PDF or image</Label>
					<Input
						accept={ACCEPTED_TYPES.join(",")}
						disabled={isUploading}
						id="upload-proof"
						onChange={handleFileChange}
						type="file"
					/>
					<p className="text-muted-foreground text-xs">
						Accepted types: PDF, PNG, JPEG. One active upload at a time;
						previous uploads are kept in history.
					</p>
				</div>

				{currentUpload && renderUploadMeta("Current upload", currentUpload)}

				{uploadHistory && uploadHistory.length > 0 && (
					<div className="space-y-2">
						<div className="flex items-center gap-2 font-medium text-sm">
							<History className="h-4 w-4 text-muted-foreground" />
							<span>Upload history</span>
						</div>
						<Separator />
						<div className="space-y-3">
							{uploadHistory.map((upload) => (
								<div
									className="rounded-lg border p-3"
									key={`${upload.storageId}-${upload.uploadedAt}`}
								>
									<div className="flex items-center gap-2 font-medium text-sm">
										<FileText className="h-4 w-4 text-muted-foreground" />
										<span>{upload.fileName}</span>
									</div>
									<div className="mt-1 flex flex-wrap items-center gap-3 text-muted-foreground text-xs">
										<span className="flex items-center gap-1">
											<Clock className="h-3 w-3" />
											{formatDistanceToNow(upload.uploadedAt, {
												addSuffix: true,
											})}
										</span>
										<span>{upload.fileType}</span>
									</div>
								</div>
							))}
						</div>
					</div>
				)}
			</CardContent>
		</Card>
	);
}
