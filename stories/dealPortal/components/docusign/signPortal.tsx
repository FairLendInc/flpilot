import { EmbedSignDocument } from "@documenso/embed-react"

interface SignPortalProps {
  signingToken: string | null
  signerName?: string
  onDocumentCompleted?: () => void
  onDocumentReady?: () => void
  onDocumentError?: (error: any) => void
  handleESign?: () => void
  userRole: string
  handleApprove?: () => void
}

export default function SignPortal({
  userRole,
  signingToken,
  signerName = "User",
  onDocumentCompleted,
  onDocumentReady,
  onDocumentError,
  handleESign,
  handleApprove,
}: SignPortalProps) {
  // Extract token from URL if a full URL is provided
  const extractToken = (tokenOrUrl: string | null): string => {
    if (!tokenOrUrl) return ""
    const match = tokenOrUrl.match(/\/sign\/([^\/\?]+)/)
    return match && match[1] ? match[1] : tokenOrUrl
  }

  const actualToken = extractToken(signingToken)

  // Debug logging
  console.log("SignPortal props:", {
    signingToken,
    actualToken,
    signerName,
  })

  // For testing purposes, use the working token from existing implementation
  const testToken = "g23SSsbqSBhIubRicNRDs"
  const finalToken = actualToken || testToken

  // Validate token
  if (!finalToken || finalToken.trim() === "") {
    console.error("Invalid or empty signing token")
    return (
      <div className="p-4 text-red-500">
        <p>Error: Invalid or empty signing token</p>
      </div>
    )
  }

  try {
    return (
      <div className="h-full min-h-[600px] w-full">
        <EmbedSignDocument
          className="h-full w-full"
          token={finalToken}
          name={signerName}
          onDocumentCompleted={() => {
            console.log("Document completed")
            // onDocumentCompleted?.()
            //ToDo: Change this, encapsulate the role logic into a single function.
            if (userRole.toLowerCase() === "lawyer" || userRole.toLowerCase() === "broker") {
              handleApprove?.()
            } else {
              handleESign?.()
            }
          }}
          onDocumentReady={() => {
            console.log("Document ready")
            onDocumentReady?.()
          }}
          onDocumentError={(error) => {
            console.error("Document error:", error)
            onDocumentError?.(error)
          }}
        />
      </div>
    )
  } catch (error) {
    console.error("Error rendering EmbedSignDocument:", error)
    return (
      <div className="p-4 text-red-500">
        <p>Error loading document signing interface</p>
        <p className="text-sm">{error instanceof Error ? error.message : "Unknown error"}</p>
      </div>
    )
  }
}
