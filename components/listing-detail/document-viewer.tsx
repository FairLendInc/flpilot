"use client";

/**
 * DocumentViewer - Adobe PDF Embed API integration for viewing property documents
 *
 * IMPORTANT: Production Integration with Convex Storage
 * -------------------------------------------------------
 * This component currently uses mock data with placeholder URLs. To integrate with
 * real Convex file storage:
 *
 * 1. Store file IDs (Id<"_storage">) in your documents table
 * 2. Create a Convex query to fetch signed URLs:
 *
 *    export const getDocumentUrl = query({
 *      args: { storageId: v.id("_storage") },
 *      returns: v.union(v.string(), v.null()),
 *      handler: async (ctx, args) => {
 *        return await ctx.storage.getUrl(args.storageId);
 *      },
 *    });
 *
 * 3. In your parent component, fetch the signed URLs and pass them to this component
 * 4. Signed URLs expire, so fetch them fresh when the component mounts
 *
 * Adobe PDF Embed API Requirements:
 * - Requires NEXT_PUBLIC_ADOBE_PDF_VIEWER_KEY environment variable
 * - URLs must be CORS-enabled and publicly accessible
 * - Convex signed URLs work well with Adobe PDF Embed API
 */

import { Card, CardContent } from "@heroui/react";
import { Icon } from "@iconify/react";
import Script from "next/script";
import { useEffect, useRef, useState } from "react";
import {
	Select,
	SelectContent,
	SelectItem,
	SelectTrigger,
	SelectValue,
} from "@/components/ui/select";
import type { MockDocument } from "@/lib/mock-data/listings";

type DocumentViewerProps = {
	documents: MockDocument[];
};

// Declare Adobe DC View types
declare global {
	// biome-ignore lint/style/useConsistentTypeDefinitions: DONT CARE
	interface Window {
		AdobeDC?: {
			View: new (config: {
				clientId: string;
				divId: string;
			}) => {
				previewFile: (
					config: {
						content: { location: { url: string } };
						metaData: { fileName: string };
					},
					options: {
						embedMode: string;
						defaultViewMode?: string;
						showDownloadPDF?: boolean;
						showPrintPDF?: boolean;
					}
				) => Promise<void>;
			};
		};
		adobe_dc_view_sdk?: {
			ready: () => void;
		};
	}
}

export function DocumentViewer({ documents }: DocumentViewerProps) {
	const [selectedDocId, setSelectedDocId] = useState<string>(
		documents[0]?._id || ""
	);
	const [isLoading, setIsLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [sdkReady, setSdkReady] = useState(false);
	const viewerRef = useRef<HTMLDivElement>(null);
	const adobeViewRef = useRef<InstanceType<
		NonNullable<typeof window.AdobeDC>["View"]
	> | null>(null);

	const selectedDocument = documents.find((doc) => doc._id === selectedDocId);
	const apiKey = process.env.NEXT_PUBLIC_ADOBE_PDF_VIEWER_KEY;

	// Listen for Adobe DC View SDK ready event
	useEffect(() => {
		if (!apiKey) {
			setError(
				"Adobe PDF Viewer API key is not configured. Please set NEXT_PUBLIC_ADOBE_PDF_VIEWER_KEY environment variable."
			);
			setIsLoading(false);
			return;
		}

		const handleSDKReady = () => {
			console.log("Adobe DC View SDK is ready");
			setSdkReady(true);
		};

		// Check if SDK is already loaded
		if (window.AdobeDC) {
			handleSDKReady();
		} else {
			// Listen for SDK ready event
			document.addEventListener("adobe_dc_view_sdk.ready", handleSDKReady);
		}

		return () => {
			document.removeEventListener("adobe_dc_view_sdk.ready", handleSDKReady);
		};
	}, [apiKey]);

	// Initialize viewer when document changes or SDK becomes ready
	useEffect(() => {
		if (!(sdkReady && selectedDocument && apiKey)) {
			return;
		}

		const initViewer = async () => {
			try {
				console.log(
					"Initializing PDF viewer for document:",
					selectedDocument.name
				);
				setIsLoading(true);
				setError(null);

				// Clear previous viewer instance
				if (viewerRef.current) {
					viewerRef.current.innerHTML = "";
				}

				if (!window.AdobeDC) {
					console.error("window.AdobeDC is not available");
					throw new Error("Adobe DC View SDK not loaded");
				}

				// Create viewer div
				const viewerDiv = document.createElement("div");
				viewerDiv.id = `adobe-dc-view-${selectedDocument._id}`;
				console.log("Created viewer div with ID:", viewerDiv.id);

				if (!viewerRef.current) {
					console.error("viewerRef.current is null");
					throw new Error("Viewer container not found");
				}

				viewerRef.current.appendChild(viewerDiv);

				// Wait for DOM to update after appending
				await new Promise((resolve) => setTimeout(resolve, 150));

				// Verify div is in DOM
				const divInDom = document.getElementById(viewerDiv.id);
				if (!divInDom) {
					console.error("Viewer div not found in DOM after appending");
					throw new Error("Failed to attach viewer to DOM");
				}

				console.log("Initializing Adobe DC View with client ID");
				// Initialize Adobe DC View
				const adobeDCView = new window.AdobeDC.View({
					clientId: apiKey,
					divId: viewerDiv.id,
				});

				adobeViewRef.current = adobeDCView;

				console.log("Previewing file:", selectedDocument.url);
				console.log("Full document details:", {
					name: selectedDocument.name,
					type: selectedDocument.type,
					url: selectedDocument.url,
					fileSize: selectedDocument.fileSize,
				});

				// Preview file in Sized Container mode
				await adobeDCView.previewFile(
					{
						content: { location: { url: selectedDocument.url } },
						metaData: { fileName: selectedDocument.name },
					},
					{
						embedMode: "SIZED_CONTAINER",
						defaultViewMode: "FIT_WIDTH",
						showDownloadPDF: true,
						showPrintPDF: true,
					}
				);

				console.log("PDF viewer initialized successfully");
				setIsLoading(false);
			} catch (err) {
				console.error("Error initializing PDF viewer:", err);
				console.error("Error type:", typeof err);
				console.error("Error details:", JSON.stringify(err, null, 2));

				let errorMessage = "Failed to load PDF viewer. Please try again.";
				if (err instanceof Error) {
					errorMessage = err.message;
				} else if (typeof err === "string") {
					errorMessage = err;
				} else if (err && typeof err === "object") {
					// Try to extract any useful info from the error object
					errorMessage = JSON.stringify(err);
				}

				setError(errorMessage);
				setIsLoading(false);
			}
		};

		initViewer();

		// Cleanup
		return () => {
			if (viewerRef.current) {
				viewerRef.current.innerHTML = "";
			}
			adobeViewRef.current = null;
		};
	}, [selectedDocument, sdkReady, apiKey]);

	if (documents.length === 0) {
		return null;
	}

	const formatFileSize = (bytes?: number) => {
		if (!bytes) return "Unknown size";
		const mb = bytes / (1024 * 1024);
		return `${mb.toFixed(2)} MB`;
	};

	const formatDate = (isoDate: string) =>
		new Date(isoDate).toLocaleDateString("en-US", {
			year: "numeric",
			month: "long",
			day: "numeric",
		});

	const getDocumentIcon = (type: string) => {
		switch (type) {
			case "appraisal":
				return "lucide:file-text";
			case "title":
				return "lucide:file-check";
			case "inspection":
				return "lucide:clipboard-list";
			case "loan":
				return "lucide:file-signature";
			default:
				return "lucide:file";
		}
	};

	return (
		<>
			<Script
				onError={() => {
					setError("Failed to load Adobe PDF Embed API");
					setIsLoading(false);
				}}
				src="https://acrobatservices.adobe.com/view-sdk/viewer.js"
				strategy="lazyOnload"
			/>

			<div className="space-y-4">
				<div className="flex items-center gap-2">
					<Icon className="h-6 w-6 text-primary" icon="lucide:file-text" />
					<h2 className="font-bold text-2xl">Documents</h2>
				</div>

				<p className="text-foreground/60 text-sm">
					View important property documents including appraisals, title reports,
					and loan agreements
				</p>

				{/* Document Selector */}
				<Card.Root>
					<CardContent className="p-4">
						<div className="space-y-4">
							<div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
								<div className="flex-1">
									<label
										className="mb-2 block font-medium text-sm"
										htmlFor="document-selector"
									>
										Select Document
									</label>
									<Select
										onValueChange={(value) => setSelectedDocId(value)}
										value={selectedDocId}
									>
										<SelectTrigger className="max-w-md">
											<SelectValue placeholder="Choose a document" />
										</SelectTrigger>
										<SelectContent>
											{documents.map((doc) => (
												<SelectItem key={doc._id} value={doc._id}>
													<div className="flex items-center gap-2">
														<Icon
															className="h-4 w-4"
															icon={getDocumentIcon(doc.type)}
														/>
														<span>{doc.name}</span>
													</div>
												</SelectItem>
											))}
										</SelectContent>
									</Select>
								</div>

								{selectedDocument && (
									<div className="flex flex-col gap-1 text-foreground/60 text-sm">
										<div className="flex items-center gap-1.5">
											<Icon className="h-4 w-4" icon="lucide:calendar" />
											<span>
												Uploaded: {formatDate(selectedDocument.uploadDate)}
											</span>
										</div>
										<div className="flex items-center gap-1.5">
											<Icon className="h-4 w-4" icon="lucide:hard-drive" />
											<span>{formatFileSize(selectedDocument.fileSize)}</span>
										</div>
									</div>
								)}
							</div>
						</div>
					</CardContent>
				</Card.Root>

				{/* PDF Viewer Container */}
				<Card.Root className="overflow-hidden">
					<CardContent className="p-0">
						<div className="relative">
							{error && (
								<div className="absolute inset-0 z-10 flex min-h-[600px] flex-col items-center justify-center gap-4 bg-white p-8 text-center dark:bg-gray-900">
									<Icon
										className="h-16 w-16 text-red-500"
										icon="lucide:alert-circle"
									/>
									<div className="space-y-2">
										<h3 className="font-semibold text-lg text-red-600 dark:text-red-400">
											Unable to Load PDF Viewer
										</h3>
										<p className="max-w-md text-foreground/60 text-sm">
											{error}
										</p>
									</div>
								</div>
							)}
							{isLoading && (
								<div className="absolute inset-0 z-10 flex min-h-[600px] flex-col items-center justify-center gap-4 bg-white p-8 dark:bg-gray-900">
									<Icon
										className="h-12 w-12 animate-spin text-primary"
										icon="lucide:loader-2"
									/>
									<p className="text-foreground/60 text-sm">
										Loading PDF viewer...
									</p>
								</div>
							)}
							<div
								className="min-h-[600px] w-full"
								ref={viewerRef}
								style={{ height: "700px" }}
							/>
						</div>
					</CardContent>
				</Card.Root>
			</div>
		</>
	);
}
