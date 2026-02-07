"use client";

import {
	type CommandProps,
	type Editor as CoreEditor,
	Extension,
	type Range,
} from "@tiptap/core";
import type { Node as PMNode } from "@tiptap/pm/model";
import {
	type EditorState,
	Plugin,
	PluginKey,
	type Transaction,
} from "@tiptap/pm/state";
import { Decoration, DecorationSet, type EditorView } from "@tiptap/pm/view";

declare module "@tiptap/core" {
	interface Commands<ReturnType> {
		/**
		 * @description Set search term in extension.
		 */
		setSearchTerm: (searchTerm: string) => ReturnType;
		/**
		 * @description Set replace term in extension.
		 */
		setReplaceTerm: (replaceTerm: string) => ReturnType;
		/**
		 * @description Replace first instance of search result with given replace term.
		 */
		replace: () => ReturnType;
		/**
		 * @description Replace all instances of search result with given replace term.
		 */
		replaceAll: () => ReturnType;
		/**
		 * @description Select the next search result.
		 */
		selectNextResult: () => ReturnType;
		/**
		 * @description Select the previous search result.
		 */
		selectPreviousResult: () => ReturnType;
		/**
		 * @description Set case sensitivity in extension.
		 */
		setCaseSensitive: (caseSensitive: boolean) => ReturnType;
	}

	type EditorStorage = {
		searchAndReplace: SearchAndReplaceStorage;
	};
}

type SearchAndReplaceEditorStorage = {
	searchAndReplace: SearchAndReplaceStorage;
};

function getSearchStorage(editor: CoreEditor): SearchAndReplaceStorage {
	return (editor.storage as unknown as SearchAndReplaceEditorStorage)
		.searchAndReplace;
}

type TextNodeWithPosition = {
	text: string;
	pos: number;
};

const getRegex = (
	searchString: string,
	disableRegex: boolean,
	caseSensitive: boolean
): RegExp => {
	const escapedString = disableRegex
		? searchString.replace(/[-/\\^$*+?.()|[\]{}]/g, "\\$&")
		: searchString;
	return new RegExp(escapedString, caseSensitive ? "gu" : "gui");
};

type ProcessedSearches = {
	decorationsToReturn: DecorationSet;
	results: Range[];
};

function processSearches(
	doc: PMNode,
	searchTerm: RegExp,
	selectedResultIndex: number,
	searchResultClass: string,
	selectedResultClass: string
): ProcessedSearches {
	const decorations: Decoration[] = [];
	const results: Range[] = [];
	const textNodesWithPosition: TextNodeWithPosition[] = [];

	doc.descendants((node, pos) => {
		if (node.isText) {
			textNodesWithPosition.push({ text: node.text || "", pos });
		}
	});

	for (const { text, pos } of textNodesWithPosition) {
		const matches = Array.from(text.matchAll(searchTerm)).filter(
			([matchText]) => matchText.trim()
		);

		for (const match of matches) {
			if (match.index !== undefined) {
				results.push({
					from: pos + match.index,
					to: pos + match.index + match[0].length,
				});
			}
		}
	}

	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		if (!result) continue;
		const { from, to } = result;
		decorations.push(
			Decoration.inline(from, to, {
				class:
					selectedResultIndex === i ? selectedResultClass : searchResultClass,
			})
		);
	}

	return {
		decorationsToReturn: DecorationSet.create(doc, decorations),
		results,
	};
}

const replace = (
	replaceTerm: string,
	results: Range[],
	{
		state,
		dispatch,
	}: { state: EditorState; dispatch?: (tr: Transaction) => void }
) => {
	const firstResult = results[0];

	if (!firstResult) {
		return;
	}

	const { from, to } = firstResult;

	if (dispatch) {
		dispatch(state.tr.insertText(replaceTerm, from, to));
	}
};

const rebaseNextResult = (
	replaceTerm: string,
	index: number,
	lastOffset: number,
	results: Range[]
): [number, Range[]] | null => {
	const nextIndex = index + 1;

	if (!results[nextIndex]) {
		return null;
	}

	const currentResult = results[index];
	if (!currentResult) {
		return null;
	}

	const { from: currentFrom, to: currentTo } = currentResult;

	const offset = currentTo - currentFrom - replaceTerm.length + lastOffset;

	const { from, to } = results[nextIndex];

	results[nextIndex] = {
		to: to - offset,
		from: from - offset,
	};

	return [offset, results];
};

const replaceAll = (
	replaceTerm: string,
	results: Range[],
	{ tr, dispatch }: { tr: Transaction; dispatch: (tr: Transaction) => void }
) => {
	if (!results.length) {
		return;
	}

	let offset = 0;

	for (let i = 0; i < results.length; i++) {
		const result = results[i];
		if (!result) continue;
		const { from, to } = result;
		tr.insertText(replaceTerm, from, to);
		const rebaseResponse = rebaseNextResult(replaceTerm, i, offset, results);

		if (rebaseResponse) {
			offset = rebaseResponse[0];
		}
	}

	dispatch(tr);
};

const selectNext = (editor: CoreEditor) => {
	const storage = (
		editor.storage as unknown as { searchAndReplace?: SearchAndReplaceStorage }
	).searchAndReplace;
	if (!storage) return;

	const { results } = storage;

	if (!results.length) {
		return;
	}

	const { selectedResult } = storage;

	if (selectedResult >= results.length - 1) {
		storage.selectedResult = 0;
	} else {
		storage.selectedResult += 1;
	}

	const result = results[storage.selectedResult];
	if (!result) return;

	const { from } = result;

	const view: EditorView | undefined = editor.view;

	if (view) {
		const node = view.domAtPos(from).node;
		if (node instanceof Element) {
			node.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}
};

const selectPrevious = (editor: CoreEditor) => {
	const storage = (
		editor.storage as unknown as { searchAndReplace?: SearchAndReplaceStorage }
	).searchAndReplace;
	if (!storage) return;

	const { results } = storage;

	if (!results.length) {
		return;
	}

	const { selectedResult } = storage;

	if (selectedResult <= 0) {
		storage.selectedResult = results.length - 1;
	} else {
		storage.selectedResult -= 1;
	}

	const result = results[storage.selectedResult];
	if (!result) return;
	const { from } = result;

	const view: EditorView | undefined = editor.view;

	if (view) {
		const node = view.domAtPos(from).node;
		if (node instanceof Element) {
			node.scrollIntoView({ behavior: "smooth", block: "center" });
		}
	}
};

export const searchAndReplacePluginKey = new PluginKey(
	"searchAndReplacePlugin"
);

export type SearchAndReplaceOptions = {
	searchResultClass: string;
	selectedResultClass: string;
	disableRegex: boolean;
};

export type SearchAndReplaceStorage = {
	searchTerm: string;
	replaceTerm: string;
	results: Range[];
	lastSearchTerm: string;
	selectedResult: number;
	lastSelectedResult: number;
	caseSensitive: boolean;
	lastCaseSensitiveState: boolean;
};

export const SearchAndReplace = Extension.create<
	SearchAndReplaceOptions,
	SearchAndReplaceStorage
>({
	name: "searchAndReplace",

	addOptions() {
		return {
			searchResultClass: "bg-yellow-200",
			selectedResultClass: "bg-yellow-500",
			disableRegex: true,
		};
	},

	addStorage() {
		return {
			searchTerm: "",
			replaceTerm: "",
			results: [],
			lastSearchTerm: "",
			selectedResult: 0,
			lastSelectedResult: 0,
			caseSensitive: false,
			lastCaseSensitiveState: false,
		};
	},

	addCommands() {
		return {
			setSearchTerm:
				(searchTerm: string) =>
				({ editor }: CommandProps) => {
					const storage = getSearchStorage(editor);
					storage.searchTerm = searchTerm;

					return false;
				},
			setReplaceTerm:
				(replaceTerm: string) =>
				({ editor }: CommandProps) => {
					const storage = getSearchStorage(editor);
					storage.replaceTerm = replaceTerm;

					return false;
				},
			replace:
				() =>
				({ editor, state, dispatch }: CommandProps) => {
					const { replaceTerm, results } = getSearchStorage(editor);

					replace(replaceTerm, results, { state, dispatch });

					return false;
				},
			replaceAll:
				() =>
				({ editor, tr, dispatch }: CommandProps) => {
					const { replaceTerm, results } = getSearchStorage(editor);

					if (!dispatch) {
						return false;
					}

					replaceAll(replaceTerm, results, { tr, dispatch });

					return false;
				},
			selectNextResult:
				() =>
				({ editor }: CommandProps) => {
					selectNext(editor);

					return false;
				},
			selectPreviousResult:
				() =>
				({ editor }: CommandProps) => {
					selectPrevious(editor);

					return false;
				},
			setCaseSensitive:
				(caseSensitive: boolean) =>
				({ editor }: CommandProps) => {
					const storage = getSearchStorage(editor);
					storage.caseSensitive = caseSensitive;

					return false;
				},
		};
	},

	addProseMirrorPlugins() {
		const editor = this.editor;
		const { searchResultClass, selectedResultClass, disableRegex } =
			this.options;

		const setLastSearchTerm = (t: string) => {
			(
				(editor.storage as any).searchAndReplace as SearchAndReplaceStorage
			).lastSearchTerm = t;
		};

		const setLastSelectedResult = (r: number) => {
			(
				(editor.storage as any).searchAndReplace as SearchAndReplaceStorage
			).lastSelectedResult = r;
		};

		const setLastCaseSensitiveState = (s: boolean) => {
			(
				(editor.storage as any).searchAndReplace as SearchAndReplaceStorage
			).lastCaseSensitiveState = s;
		};

		return [
			new Plugin({
				key: searchAndReplacePluginKey,
				state: {
					init: () => DecorationSet.empty,
					apply({ doc, docChanged }, oldState) {
						const {
							searchTerm,
							selectedResult,
							lastSearchTerm,
							lastSelectedResult,
							caseSensitive,
							lastCaseSensitiveState,
						} = (editor.storage as any)
							.searchAndReplace as SearchAndReplaceStorage;

						if (
							!docChanged &&
							lastSearchTerm === searchTerm &&
							selectedResult === lastSelectedResult &&
							lastCaseSensitiveState === caseSensitive
						) {
							return oldState;
						}

						setLastSearchTerm(searchTerm);
						setLastSelectedResult(selectedResult);
						setLastCaseSensitiveState(caseSensitive);

						if (!searchTerm) {
							(
								(editor.storage as any)
									.searchAndReplace as SearchAndReplaceStorage
							).selectedResult = 0;
							(
								(editor.storage as any)
									.searchAndReplace as SearchAndReplaceStorage
							).results = [];
							return DecorationSet.empty;
						}

						const { decorationsToReturn, results } = processSearches(
							doc,
							getRegex(searchTerm, disableRegex, caseSensitive),
							selectedResult,
							searchResultClass,
							selectedResultClass
						);

						(
							(editor.storage as any)
								.searchAndReplace as SearchAndReplaceStorage
						).results = results;

						if (selectedResult >= results.length) {
							(
								(editor.storage as any)
									.searchAndReplace as SearchAndReplaceStorage
							).selectedResult = Math.max(results.length - 1, 0);
						}

						return decorationsToReturn;
					},
				},
				props: {
					decorations(state) {
						return this.getState(state);
					},
				},
			}),
		];
	},
});

export default SearchAndReplace;
