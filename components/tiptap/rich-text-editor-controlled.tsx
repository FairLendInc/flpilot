"use client";

import "./tiptap.css";
import { Color } from "@tiptap/extension-color";
import Highlight from "@tiptap/extension-highlight";
import Link from "@tiptap/extension-link";
import Placeholder from "@tiptap/extension-placeholder";
import Subscript from "@tiptap/extension-subscript";
import Superscript from "@tiptap/extension-superscript";
import TextAlign from "@tiptap/extension-text-align";
import { TextStyle } from "@tiptap/extension-text-style";
import Typography from "@tiptap/extension-typography";
import Underline from "@tiptap/extension-underline";
import {
	EditorContent,
	type Extension,
	type JSONContent,
	useEditor,
} from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import { useEffect } from "react";
import { FloatingToolbar } from "@/components/tiptap/extensions/floating-toolbar";
import { ImageExtension } from "@/components/tiptap/extensions/image";
import { ImagePlaceholder } from "@/components/tiptap/extensions/image-placeholder";
import SearchAndReplace from "@/components/tiptap/extensions/search-and-replace";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { EditorToolbar } from "./toolbars/editor-toolbar";

const extensions = [
	StarterKit.configure({
		orderedList: {
			HTMLAttributes: {
				class: "list-decimal",
			},
		},
		bulletList: {
			HTMLAttributes: {
				class: "list-disc",
			},
		},
		heading: {
			levels: [1, 2, 3, 4],
		},
	}),
	Placeholder.configure({
		emptyNodeClass: "is-editor-empty",
		placeholder: ({ node }) => {
			switch (node.type.name) {
				case "heading":
					return `Heading ${node.attrs.level}`;
				case "detailsSummary":
					return "Section title";
				case "codeBlock":
					return "";
				default:
					return "Write something...";
			}
		},
		includeChildren: false,
	}),
	TextAlign.configure({
		types: ["heading", "paragraph"],
	}),
	TextStyle,
	Subscript,
	Superscript,
	Underline,
	Link,
	Color,
	Highlight.configure({
		multicolor: true,
	}),
	ImageExtension,
	ImagePlaceholder,
	SearchAndReplace,
	Typography,
];

export type RichTextEditorProps = {
	value?: JSONContent;
	onChange?: (value: JSONContent) => void;
	placeholder?: string;
	disabled?: boolean;
	className?: string;
};

export function RichTextEditor({
	value,
	onChange,
	disabled = false,
	className,
}: RichTextEditorProps) {
	const editor = useEditor({
		immediatelyRender: false,
		extensions: extensions as Extension[],
		content: value,
		editable: !disabled,
		editorProps: {
			attributes: {
				class: "max-w-full focus:outline-none",
			},
		},
		onUpdate: ({ editor }) => {
			onChange?.(editor.getJSON());
		},
	});

	// Sync external value changes to editor
	useEffect(() => {
		if (editor && value !== undefined) {
			const currentJson = JSON.stringify(editor.getJSON());
			const newJson = JSON.stringify(value);

			// Only update if content actually changed to avoid cursor jumping
			if (currentJson !== newJson) {
				editor.commands.setContent(value);
			}
		}
	}, [editor, value]);

	// Update editable state when disabled prop changes
	useEffect(() => {
		if (editor) {
			editor.setEditable(!disabled);
		}
	}, [editor, disabled]);

	if (!editor) {
		return <Skeleton className="h-[300px] w-full rounded-lg" />;
	}

	return (
		<div
			className={cn(
				"relative max-h-[calc(100dvh-6rem)] w-full overflow-hidden overflow-y-scroll rounded-lg border bg-card pb-[60px] sm:pb-0",
				disabled && "cursor-not-allowed opacity-60",
				className
			)}
		>
			<EditorToolbar editor={editor} />
			<FloatingToolbar editor={editor} />
			<EditorContent
				className="min-h-[200px] w-full min-w-full cursor-text p-4 sm:p-6"
				editor={editor}
			/>
		</div>
	);
}
