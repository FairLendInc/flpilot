export type BlogWithSlug = {
	slug: string;
	title: string;
	description: string;
	image?: string;
	date: string;
	author: {
		name: string;
		src: string;
	};
};
