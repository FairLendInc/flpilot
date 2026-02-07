import type { NameFields } from "./types";

export type NameMatchStrategy = {
	matches: (left: NameFields, right: NameFields) => boolean;
};

function normalizeNamePart(value: string | undefined) {
	return (value ?? "").trim().toLowerCase().replace(/\s+/g, " ");
}

export class StrictNameMatchStrategy implements NameMatchStrategy {
	matches(left: NameFields, right: NameFields) {
		return (
			normalizeNamePart(left.firstName) ===
				normalizeNamePart(right.firstName) &&
			normalizeNamePart(left.lastName) === normalizeNamePart(right.lastName)
		);
	}
}

let nameMatchStrategy: NameMatchStrategy | null = null;

export function getNameMatchStrategy(): NameMatchStrategy {
	if (!nameMatchStrategy) {
		nameMatchStrategy = new StrictNameMatchStrategy();
	}
	return nameMatchStrategy;
}

export function resetNameMatchStrategy() {
	nameMatchStrategy = null;
}
