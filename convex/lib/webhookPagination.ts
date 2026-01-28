export type CursorPayload = {
	time: number;
	id: string;
};

export const decodeCursor = (
	cursor?: string | null
): CursorPayload | undefined => {
	if (!cursor) return;
	try {
		const parsed = JSON.parse(cursor) as CursorPayload;
		if (
			typeof parsed.time === "number" &&
			typeof parsed.id === "string" &&
			parsed.id.length > 0
		) {
			return parsed;
		}
	} catch {
		return;
	}
	return;
};

export const encodeCursor = (cursor: CursorPayload) => JSON.stringify(cursor);

export const paginateByCreation = <
	T extends { _id: string; _creationTime: number },
>(
	items: T[],
	limit: number,
	cursor?: string | null
) => {
	const sorted = [...items].sort((a, b) => {
		if (a._creationTime !== b._creationTime) {
			return b._creationTime - a._creationTime;
		}
		return a._id < b._id ? 1 : -1;
	});

	const decoded = decodeCursor(cursor);
	const startIndex = decoded
		? sorted.findIndex(
				(item) => item._creationTime === decoded.time && item._id === decoded.id
			) + 1
		: 0;

	const pageItems = sorted.slice(startIndex, startIndex + limit);
	const hasMore = startIndex + limit < sorted.length;
	const nextCursor =
		hasMore && pageItems.length > 0
			? encodeCursor({
					time: pageItems.at(-1)?._creationTime,
					id: pageItems.at(-1)?._id,
				})
			: undefined;

	return {
		items: pageItems,
		nextCursor,
		hasMore,
		total: sorted.length,
	};
};
