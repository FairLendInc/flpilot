import { RichTextEditorDemo } from "@/components/tiptap/rich-text-editor";

export default function Page() {
	return (
		<div className="container mx-auto flex w-full flex-col items-center justify-center py-5">
			<RichTextEditorDemo className="w-full rounded-xl" />
		</div>
	);
}
