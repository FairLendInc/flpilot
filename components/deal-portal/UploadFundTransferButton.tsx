"use client";

import { useAction, useMutation } from "convex/react";
import { AlertCircle, FileCheck, Loader2, Upload } from "lucide-react";
import { useState } from "react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";
import {
	Dialog,
	DialogContent,
	DialogDescription,
	DialogFooter,
	DialogHeader,
	DialogTitle,
	DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

type UploadFundTransferButtonProps = {
	dealId: Id<"deals">;
	currentUpload?: {
		storageId: Id<"_storage">;
		fileName: string;
		fileType: string;
		uploadedAt: number;
	};
	disabled?: boolean;
};

export function UploadFundTransferButton({
	dealId,
	currentUpload,
	disabled = false,
}: UploadFundTransferButtonProps) {
	const INVALID_FILE_MESSAGE = "Invalid file type. Please upload a PDF, PNG, or JPEG.";
	const FILE_TOO_LARGE_MESSAGE = "File is too large. Maximum size is 10MB.";

	const [isOpen, setIsOpen] = useState(false);
	const [file, setFile] = useState<File | null>(null);
	const [isUploading, setIsUploading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const generateUploadUrl = useAction(api.deals.generateFundTransferUploadUrl);
	const recordUpload = useMutation(api.deals.recordFundTransferUpload);

	const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const selectedFile = e.target.files?.[0];
		if (selectedFile) {
			// Client-side validation
			const allowedTypes = [
				"application/pdf",
				"image/png",
				"image/jpeg",
				"image/jpg",
			];
			if (!allowedTypes.includes(selectedFile.type)) {
				setError(INVALID_FILE_MESSAGE);
				setFile(null);
				return;
			}
			// Size limit (e.g., 10MB)
			if (selectedFile.size > 10 * 1024 * 1024) {
				setError(FILE_TOO_LARGE_MESSAGE);
				setFile(null);
				return;
			}
			setFile(selectedFile);
			setError(null);
		}
	};

	const handleUpload = async () => {
		if (!file) return;

		setIsUploading(true);
		setError(null);

		try {
			// 1. Get upload URL
			const postUrl = await generateUploadUrl({ dealId });

			// 2. Upload file
			const result = await fetch(postUrl, {
				method: "POST",
				headers: { "Content-Type": file.type },
				body: file,
			});

			if (!result.ok) {
				throw new Error(`Upload failed: ${result.statusText}`);
			}

			const { storageId } = await result.json();

			// 3. Record upload
			await recordUpload({
				dealId,
				storageId,
				fileName: file.name,
				fileType: file.type,
			});

			setIsOpen(false);
			setFile(null);
		} catch (err) {
			console.error("Upload error:", err);
			setError("Failed to upload file. Please try again.");
		} finally {
			setIsUploading(false);
		}
	};

	return (
		<Dialog onOpenChange={setIsOpen} open={isOpen}>
			<DialogTrigger asChild>
				<Button disabled={disabled} variant="outline">
					{currentUpload ? (
						<>
							<FileCheck className="mr-2 h-4 w-4 text-green-600" />
							Replace Proof
						</>
					) : (
						<>
							<Upload className="mr-2 h-4 w-4" />
							Upload Proof
						</>
					)}
				</Button>
			</DialogTrigger>
			<DialogContent className="sm:max-w-[425px]">
				<DialogHeader>
					<DialogTitle>Upload Fund Transfer Proof</DialogTitle>
					<DialogDescription>
						Upload a PDF or image of your wire transfer confirmation or bank
						draft.
					</DialogDescription>
				</DialogHeader>

				<div className="grid gap-4 py-4">
					{currentUpload && (
						<Alert className="border-blue-200 bg-blue-50 text-blue-800">
							<FileCheck className="h-4 w-4" />
							<AlertDescription>
								Current file: <strong>{currentUpload.fileName}</strong>
								<br />
								Uploaded:{" "}
								{new Date(currentUpload.uploadedAt).toLocaleDateString()}
							</AlertDescription>
						</Alert>
					)}

					<div className="grid w-full max-w-sm items-center gap-1.5">
						<Label htmlFor="proof-file">File</Label>
						<Input
							accept=".pdf,.png,.jpg,.jpeg"
							disabled={isUploading}
							id="proof-file"
							onChange={handleFileChange}
							type="file"
						/>
					</div>

					{error && (
						<Alert variant="destructive">
							<AlertCircle className="h-4 w-4" />
							<AlertDescription>{error}</AlertDescription>
						</Alert>
					)}
				</div>

				<DialogFooter>
					<Button
						disabled={isUploading}
						onClick={() => setIsOpen(false)}
						variant="outline"
					>
						Cancel
					</Button>
					<Button disabled={!file || isUploading} onClick={handleUpload}>
						{isUploading ? (
							<>
								<Loader2 className="mr-2 h-4 w-4 animate-spin" />
								Uploading...
							</>
						) : (
							"Upload"
						)}
					</Button>
				</DialogFooter>
			</DialogContent>
		</Dialog>
	);
}
