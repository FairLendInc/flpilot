"use client";
import {
	type CommandProps,
	mergeAttributes,
	Node,
	type NodeViewProps,
	NodeViewWrapper,
	ReactNodeViewRenderer,
} from "@tiptap/react";
import { Image, Link, Loader2, Upload, X } from "lucide-react";
import { type FormEvent, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { useImageUpload } from "@/hooks/use-image-upload";
import {
	isValidUrl,
	NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
} from "@/lib/tiptap-utils";
import { cn } from "@/lib/utils";

export type ImagePlaceholderOptions = {
	HTMLAttributes: Record<string, string>;
	onUpload?: (url: string) => void;
	onError?: (error: string) => void;
};

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		imagePlaceholder: {
			/**
			 * Inserts an image placeholder
			 */
			insertImagePlaceholder: () => ReturnType;
		};
	}
}

export const ImagePlaceholder = Node.create<ImagePlaceholderOptions>({
	name: "image-placeholder",

	addOptions() {
		return {
			HTMLAttributes: {},
			onUpload: () => {
				// Default no-op handler
			},
			onError: () => {
				// Default no-op handler
			},
		};
	},

	group: "block",

	parseHTML() {
		return [{ tag: `div[data-type="${this.name}"]` }];
	},

	renderHTML({ HTMLAttributes }) {
		return ["div", mergeAttributes(HTMLAttributes)];
	},

	addNodeView() {
		return ReactNodeViewRenderer(ImagePlaceholderComponent, {
			className: NODE_HANDLES_SELECTED_STYLE_CLASSNAME,
		});
	},

	addCommands() {
		return {
			insertImagePlaceholder: () => (props: CommandProps) =>
				props.commands.insertContent({
					type: "image-placeholder",
				}),
		};
	},
});

function ImagePlaceholderComponent(props: NodeViewProps) {
	const { editor, selected } = props;
	const [isExpanded, setIsExpanded] = useState(false);
	const [activeTab, setActiveTab] = useState<"upload" | "url">("upload");
	const [url, setUrl] = useState("");
	const [altText, setAltText] = useState("");
	const [urlError, setUrlError] = useState(false);
	const [isDragActive, setIsDragActive] = useState(false);

	const {
		previewUrl,
		fileInputRef,
		handleFileChange,
		handleRemove,
		uploading,
		error,
	} = useImageUpload({
		onUpload: (imageUrl) => {
			editor
				.chain()
				.focus()
				.setImage({
					src: imageUrl,
					alt: altText || fileInputRef.current?.files?.[0]?.name,
				})
				.run();
			handleRemove();
			setIsExpanded(false);
		},
	});

	const handleDragEnter = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(true);
	};

	const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);
	};

	const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
	};

	const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
		e.preventDefault();
		e.stopPropagation();
		setIsDragActive(false);

		const file = e.dataTransfer.files[0];
		if (file) {
			const input = fileInputRef.current;
			if (input) {
				const dataTransfer = new DataTransfer();
				dataTransfer.items.add(file);
				input.files = dataTransfer.files;
				const changeEvent = {
					target: input,
				} as React.ChangeEvent<HTMLInputElement>;
				handleFileChange(changeEvent);
			}
		}
	};

	const handleInsertEmbed = (e: FormEvent) => {
		e.preventDefault();
		const valid = isValidUrl(url);
		if (!valid) {
			setUrlError(true);
			return;
		}
		if (url) {
			editor.chain().focus().setImage({ src: url, alt: altText }).run();
			setIsExpanded(false);
			setUrl("");
			setAltText("");
		}
	};

	return (
		<NodeViewWrapper className="w-full">
			<div className="relative">
				{isExpanded ? (
					<div className="rounded-lg border bg-card p-4 shadow-sm">
						<div className="mb-4 flex items-center justify-between">
							<h3 className="font-semibold text-lg">Add Image</h3>
							<Button
								onClick={() => setIsExpanded(false)}
								size="icon"
								variant="ghost"
							>
								<X className="h-4 w-4" />
							</Button>
						</div>

						<Tabs
							className="w-full"
							onValueChange={(value) =>
								setActiveTab(value === "url" ? "url" : "upload")
							}
							value={activeTab}
						>
							<TabsList className="grid w-full grid-cols-2">
								<TabsTrigger value="upload">
									<Upload className="mr-2 h-4 w-4" />
									Upload
								</TabsTrigger>
								<TabsTrigger value="url">
									<Link className="mr-2 h-4 w-4" />
									URL
								</TabsTrigger>
							</TabsList>

							<TabsContent value="upload">
								<div
									className={cn(
										"my-4 rounded-lg border-2 border-dashed p-8 text-center transition-colors",
										isDragActive && "border-primary bg-primary/10",
										error && "border-destructive bg-destructive/10"
									)}
									onDragEnter={handleDragEnter}
									onDragLeave={handleDragLeave}
									onDragOver={handleDragOver}
									onDrop={handleDrop}
								>
									{previewUrl ? (
										<div className="space-y-4">
											<img
												alt="Preview"
												className="mx-auto max-h-[200px] rounded-lg object-cover"
												height={200}
												src={previewUrl}
												width={320}
											/>
											<div className="space-y-2">
												<Input
													onChange={(e) => setAltText(e.target.value)}
													placeholder="Alt text (optional)"
													value={altText}
												/>
												<div className="flex justify-end gap-2">
													<Button
														disabled={uploading}
														onClick={handleRemove}
														variant="outline"
													>
														Remove
													</Button>
													<Button disabled={uploading}>
														{uploading && (
															<Loader2 className="mr-2 h-4 w-4 animate-spin" />
														)}
														Upload
													</Button>
												</div>
											</div>
										</div>
									) : (
										<>
											<input
												accept="image/*"
												className="hidden"
												id="image-upload"
												onChange={handleFileChange}
												ref={fileInputRef}
												type="file"
											/>
											<label
												className="flex cursor-pointer flex-col items-center gap-4"
												htmlFor="image-upload"
											>
												<Upload className="h-8 w-8 text-muted-foreground" />
												<div>
													<p className="font-medium text-sm">
														Click to upload or drag and drop
													</p>
													<p className="text-muted-foreground text-xs">
														SVG, PNG, JPG or GIF
													</p>
												</div>
											</label>
										</>
									)}
									{error && (
										<p className="mt-2 text-destructive text-sm">{error}</p>
									)}
								</div>
							</TabsContent>

							<TabsContent value="url">
								<div className="space-y-4 py-4">
									<div className="space-y-2">
										<Input
											onChange={(e) => {
												setUrl(e.target.value);
												if (urlError) setUrlError(false);
											}}
											placeholder="Enter image URL..."
											value={url}
										/>
										{urlError && (
											<p className="text-destructive text-xs">
												Please enter a valid URL
											</p>
										)}
									</div>
									<div className="space-y-2">
										<Input
											onChange={(e) => setAltText(e.target.value)}
											placeholder="Alt text (optional)"
											value={altText}
										/>
									</div>
									<Button
										className="w-full"
										disabled={!url}
										onClick={handleInsertEmbed}
									>
										Add Image
									</Button>
								</div>
							</TabsContent>
						</Tabs>
					</div>
				) : (
					<div
						aria-expanded={isExpanded}
						className={cn(
							"group relative flex cursor-pointer flex-col items-center gap-4 rounded-lg border-2 border-dashed p-8 transition-all hover:bg-accent",
							selected && "border-primary bg-primary/5",
							isDragActive && "border-primary bg-primary/5",
							error && "border-destructive bg-destructive/5"
						)}
						onClick={() => setIsExpanded(true)}
						onKeyDown={(event) => {
							if (event.key === "Enter") {
								setIsExpanded(true);
							}
							if (event.key === " ") {
								event.preventDefault();
								setIsExpanded(true);
							}
						}}
						role="button"
						tabIndex={0}
					>
						<div className="rounded-full bg-background p-4 shadow-sm transition-colors group-hover:bg-accent">
							<Image className="h-6 w-6" />
						</div>
						<div className="text-center">
							<p className="font-medium text-sm">
								Click to upload or drag and drop
							</p>
							<p className="text-muted-foreground text-xs">
								SVG, PNG, JPG or GIF
							</p>
						</div>
					</div>
				)}
			</div>
		</NodeViewWrapper>
	);
}
