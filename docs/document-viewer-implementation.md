# Document Viewer Implementation Guide

## Overview
The Document Viewer component uses Adobe PDF Embed API to display property documents (appraisals, title reports, inspection reports, and loan documents) directly in the browser.

## Current Status
✅ Component created and integrated
✅ Adobe PDF Embed API properly integrated
✅ Dropdown selector for multiple documents
✅ Sized Container mode with fixed height
✅ Comprehensive error handling and logging
✅ Storybook stories created
✅ Convex storage integration implemented
✅ Wrapper component for real file URLs

## Component Location
- Core Component: `components/listing-detail/document-viewer.tsx`
- Convex Wrapper: `components/listing-detail/document-viewer-wrapper.tsx`
- Convex Queries: `convex/storage.ts`
- Stories: `stories/listing-detail/document-viewer*.stories.tsx`
- Used in: `app/(auth)/listings/[id]/page.tsx`

## Current Implementation

### Testing with Convex Storage
The application now uses the `DocumentViewerWrapper` which fetches real signed URLs from Convex:

```typescript
// In the page component
import { DocumentViewerWrapper } from "@/components/listing-detail";

<DocumentViewerWrapper documents={listing.documents} />
```

The wrapper:
1. Receives mock documents with placeholder URLs
2. Fetches signed URLs from Convex storage via `api.storage.getTestDocumentUrl`
3. Injects real URLs into the documents
4. Passes updated documents to the DocumentViewer

### Mock Data Fallback
The mock data generator provides a test PDF URL as fallback:
```typescript
const pdfUrl = "https://documentservices.adobe.com/view-sdk-demo/PDFs/Bodea Brochure.pdf";
```

This allows the component to work immediately if Convex is unavailable.

## Production Integration with Convex Storage

To integrate with real Convex file storage, follow these steps:

### 1. Store File IDs in Database

Add a documents field to your listings table in `convex/schema.ts`:

```typescript
listings: defineTable({
  // ... other fields
  documents: v.optional(v.array(v.object({
    _id: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("appraisal"),
      v.literal("title"),
      v.literal("inspection"),
      v.literal("loan")
    ),
    storageId: v.id("_storage"), // Convex file storage ID
    uploadDate: v.string(),
    fileSize: v.optional(v.number()),
  }))),
})
```

### 2. Create a Convex Query to Fetch Signed URLs

Create `convex/documents.ts`:

```typescript
import { query } from "./_generated/server";
import { v } from "convex/values";
import { Id } from "./_generated/dataModel";

export const getDocumentWithUrl = query({
  args: { 
    listingId: v.id("listings"),
  },
  returns: v.array(v.object({
    _id: v.string(),
    name: v.string(),
    type: v.union(
      v.literal("appraisal"),
      v.literal("title"),
      v.literal("inspection"),
      v.literal("loan")
    ),
    url: v.union(v.string(), v.null()),
    uploadDate: v.string(),
    fileSize: v.optional(v.number()),
  })),
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing?.documents) return [];
    
    // Fetch signed URLs for each document
    const documentsWithUrls = await Promise.all(
      listing.documents.map(async (doc) => {
        const url = await ctx.storage.getUrl(doc.storageId);
        return {
          _id: doc._id,
          name: doc.name,
          type: doc.type,
          url,
          uploadDate: doc.uploadDate,
          fileSize: doc.fileSize,
        };
      })
    );
    
    return documentsWithUrls.filter(doc => doc.url !== null);
  },
});
```

### 3. Update the Listing Page Component

In `app/(auth)/listings/[id]/page.tsx`:

```typescript
import { useQuery } from "convex/react";
import { api } from "@/convex/_generated/api";

export default function ListingPage({ params }: { params: { id: string } }) {
  // Fetch listing with documents
  const listing = useQuery(api.listings.get, { id: params.id });
  
  // Fetch signed URLs for documents
  const documents = useQuery(api.documents.getDocumentWithUrl, { 
    listingId: params.id as Id<"listings">
  });
  
  // ... rest of component
  
  return (
    <div>
      {/* ... other sections ... */}
      
      {documents && documents.length > 0 && (
        <div className="mb-12">
          <DocumentViewer documents={documents} />
        </div>
      )}
    </div>
  );
}
```

### 4. Uploading Documents to Convex Storage

To upload documents, create a mutation:

```typescript
import { mutation } from "./_generated/server";
import { v } from "convex/values";

export const addDocument = mutation({
  args: {
    listingId: v.id("listings"),
    storageId: v.id("_storage"),
    name: v.string(),
    type: v.union(
      v.literal("appraisal"),
      v.literal("title"),
      v.literal("inspection"),
      v.literal("loan")
    ),
    fileSize: v.optional(v.number()),
  },
  returns: v.null(),
  handler: async (ctx, args) => {
    const listing = await ctx.db.get(args.listingId);
    if (!listing) throw new Error("Listing not found");
    
    const newDocument = {
      _id: crypto.randomUUID(),
      name: args.name,
      type: args.type,
      storageId: args.storageId,
      uploadDate: new Date().toISOString(),
      fileSize: args.fileSize,
    };
    
    await ctx.db.patch(args.listingId, {
      documents: [...(listing.documents || []), newDocument],
    });
    
    return null;
  },
});
```

## Environment Variables

Required environment variable:

```env
NEXT_PUBLIC_ADOBE_PDF_VIEWER_KEY=your_adobe_client_id_here
```

Get your API key from: https://developer.adobe.com/document-services/apis/pdf-embed-api/

## Adobe PDF Embed API Setup

1. Go to https://developer.adobe.com/document-services/apis/pdf-embed-api/
2. Click "Get credentials"
3. Create a new project or use an existing one
4. Copy the Client ID
5. Add it to your `.env.local` file

## Features

- ✅ Dropdown selector for multiple documents
- ✅ Document metadata display (type icon, upload date, file size)
- ✅ Sized Container mode (700px height)
- ✅ Download and print buttons
- ✅ Fit-to-width default view
- ✅ Loading states
- ✅ Error handling with user-friendly messages
- ✅ Detailed console logging for debugging

## Troubleshooting

### Adobe SDK Not Loading
- Check browser console for "Adobe DC View SDK is ready" message
- Verify the script is loading from `https://acrobatservices.adobe.com/view-sdk/viewer.js`
- Check for network errors in the browser's Network tab

### PDF Not Displaying
- Check console logs for detailed error messages
- Verify the PDF URL is publicly accessible and CORS-enabled
- Test the URL directly in a browser to ensure it downloads
- Convex signed URLs work well with Adobe PDF Embed API

### Invalid URL Errors
- Ensure you're using `ctx.storage.getUrl()` to get signed URLs
- Don't construct URLs manually (e.g., `/api/storage/${fileId}` is invalid)
- Signed URLs expire, so fetch them fresh when the component mounts

## Browser Compatibility

Adobe PDF Embed API supports:
- Chrome 90+
- Firefox 88+
- Safari 14+
- Edge 90+

## Performance Notes

- Signed URLs from Convex expire after a period of time
- Fetch fresh URLs when the component mounts or when documents change
- The Adobe SDK is loaded lazily via `next/script` with `strategy="lazyOnload"`
- Each document switch creates a new viewer instance (cleaned up on unmount)

## Testing in Storybook

Run Storybook to test the component:

```bash
pnpm run storybook
```

Navigate to "Listing Detail/Document Viewer" to see all stories including:
- Default (4 documents)
- Single Document
- Many Documents
- Specific document types
- Recent uploads
- Large files

## Next Steps

1. Set up Adobe PDF Embed API credentials
2. Create Convex schema for documents
3. Implement file upload functionality
4. Create Convex queries/mutations for document management
5. Update listing page to fetch real documents
6. Test with real PDF files from Convex storage

