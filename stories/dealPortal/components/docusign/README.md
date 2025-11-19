# Documenso SignPortal Component

This component allows you to embed Documenso document signing directly into your application.

## Setup

1. **Environment Variables**: Make sure you have your Documenso API key in your `.env` file:

   ```
   DOCUMENSO_API_KEY=your_documenso_api_key_here
   ```

2. **CORS Configuration**: The CORS headers are already configured in your tRPC handler to allow requests from `https://app.documenso.com`.

## Usage

### Basic Usage

```tsx
import SignPortal from "./signPortal"

import SignPortal from "./signPortal"

function MyComponent() {
  return (
    <SignPortal
      signingToken="your-signing-token-here"
      signerName="John Doe"
      onDocumentCompleted={() => console.log("Document signed!")}
      onDocumentReady={() => console.log("Document ready")}
      onDocumentError={(error) => console.error("Error:", error)}
    />
  )
}
```

### Getting the Signing Token

There are two ways to get the signing token:

#### Option 1: From a Documenso URL

If you have a Documenso signing URL like `https://app.documenso.com/sign/lm7Tp2_yhvFfzdeJQzYQF`, the token is the part after `/sign/`:

```tsx
function extractSigningToken(url: string): string {
  const match = url.match(/\/sign\/([^\/\?]+)/)
  if (!match || !match[1]) {
    throw new Error("Invalid Documenso signing URL")
  }
  return match[1]
}

// Usage
const token = extractSigningToken("https://app.documenso.com/sign/lm7Tp2_yhvFfzdeJQzYQF")
// token = "lm7Tp2_yhvFfzdeJQzYQF"
```

#### Option 2: Create Document Programmatically

You can create documents using the Documenso SDK in your API routes:

```typescript
// In your API route (server-side only)
import { Documenso } from "@documenso/sdk-typescript"

import { Documenso } from "@documenso/sdk-typescript"

const documenso = new Documenso({
  apiKey: process.env.DOCUMENSO_API_KEY!,
})

// Create document
const createResponse = await documenso.documents.createV0({
  title: "My Document",
  recipients: [
    {
      email: "signer@example.com",
      name: "John Doe",
      role: "SIGNER",
      fields: [
        {
          type: "SIGNATURE",
          pageNumber: 1,
          pageX: 100,
          pageY: 200,
          width: 150,
          height: 50,
        },
      ],
    },
  ],
})

// Upload PDF and distribute
// ... (see Documenso documentation for complete example)
```

## Component Props

| Prop                  | Type                 | Required | Description                                         |
| --------------------- | -------------------- | -------- | --------------------------------------------------- |
| `signingToken`        | string               | Yes      | The signing token extracted from Documenso URL      |
| `signerName`          | string               | No       | Name of the person signing (for display)            |
| `onDocumentCompleted` | () => void           | No       | Callback when document is successfully signed       |
| `onDocumentReady`     | () => void           | No       | Callback when document is loaded and ready          |
| `onDocumentError`     | (error: any) => void | No       | Callback when there's an error loading the document |

## Example Implementation

See `example-usage.tsx` for a complete example that includes:

- URL input handling
- Token extraction
- Error handling
- Loading states
- Event callbacks

## Troubleshooting

1. **CORS Errors**: Make sure your `/api/auth/session-json` endpoint is working and returns session data.

2. **Invalid Token**: Ensure the signing token is valid and the document exists in Documenso.

3. **API Key**: Verify your `DOCUMENSO_API_KEY` is set correctly in your environment variables.

4. **Session Issues**: The component requires a valid user session to access the document.
