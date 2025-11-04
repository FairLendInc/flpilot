import { v } from "convex/values";
import { query } from "./_generated/server";

export const listNumbers = query({
	args: { count: v.number() },
	handler: async (ctx, args) => {
		// Generate an array of numbers from 1 to count
		const numbers = Array.from({ length: args.count }, (_, i) => i + 1);

		// Get the current user if authenticated
		const user = await ctx.auth.getUserIdentity();

		// Debug: Log the full user object to see what properties are available
		console.log("Full user object:", JSON.stringify(user, null, 2));

		// Try different ways to get the user's identifier
		let viewer = "Anonymous";
		if (user) {
			// Try common JWT claim names for email (convert to string safely)
			viewer = String(
				user.email ||
					user.sub ||
					user.name ||
					user.first_name ||
					user.last_name ||
					"Authenticated User"
			);
		}

		return {
			numbers,
			viewer,
			userObject: user, // Return the full user object for debugging
		};
	},
});
