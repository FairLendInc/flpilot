import type { NextRequest } from "next/server";

/**
 * Proxy route for Convex storage URLs to prevent expiration issues
 * This allows images to load even when signed URLs expire
 */
export async function GET(
	req: NextRequest,
	{ params }: { params: Promise<{ storageId: string }> }
) {
	try {
		const { storageId } = await params;

		if (!storageId) {
			return new Response("Storage ID is required", { status: 400 });
		}

		// Get Convex URL from environment
		const convexUrl = process.env.NEXT_PUBLIC_CONVEX_URL;
		if (!convexUrl) {
			return new Response("Convex URL not configured", { status: 500 });
		}

		// Get auth token from request headers (forwarded by ConvexClientProvider)
		const authHeader = req.headers.get("authorization");
		if (!authHeader) {
			return new Response("Unauthorized", { status: 401 });
		}

		// Call the Convex getFile query using REST API
		const response = await fetch(
			`${convexUrl}/api/query/storage/getFile?storageId=${encodeURIComponent(storageId)}`,
			{
				headers: {
					Authorization: authHeader,
				},
			}
		);

		if (!response.ok) {
			if (response.status === 401) {
				return new Response("Unauthorized", { status: 401 });
			}
			return new Response("File not found", { status: 404 });
		}

		const { signedUrl } = await response.json();

		if (!signedUrl) {
			return new Response("File not found", { status: 404 });
		}

		// Fetch the actual file from Convex's signed URL
		const fileResponse = await fetch(signedUrl);

		if (!fileResponse.ok) {
			return new Response("Failed to fetch file from storage", {
				status: 500,
			});
		}

		// Get the file data as array buffer
		const arrayBuffer = await fileResponse.arrayBuffer();
		const bytes = new Uint8Array(arrayBuffer);

		// Get content type from response or default
		const contentType =
			fileResponse.headers.get("content-type") || "application/octet-stream";

		// Return the file with appropriate headers
		return new Response(bytes, {
			status: 200,
			headers: {
				"Content-Type": contentType,
				"Content-Length": bytes.length.toString(),
				"Cache-Control": "public, max-age=3600", // Cache for 1 hour
				"Access-Control-Allow-Origin": "*",
			},
		});
	} catch (error) {
		console.error("Storage proxy error:", error);
		return new Response("Internal server error", { status: 500 });
	}
}
