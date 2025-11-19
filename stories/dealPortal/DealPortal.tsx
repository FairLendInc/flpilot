"use client"

import React, { Suspense, useEffect, useState, Component, ErrorInfo, ReactNode } from "react"

import { PortalContent } from "./components/PortalContent"
import { Button } from "@heroui/react";
import { Icon } from "@iconify/react"
import { useSearchParams } from "next/navigation"
import { createLogger } from "./mocks/logger"
import { useDealStore } from "./store/dealStore"

const logger = createLogger("app:portalPage")
// import { User } from '@/server/db/schema';
// import { Profile } from '@/server/db/schema';

// Error Boundary Component
interface ErrorBoundaryState {
  hasError: boolean
  error?: Error
  errorInfo?: ErrorInfo
}

class ErrorBoundary extends Component<{ children: ReactNode }, ErrorBoundaryState> {
  constructor(props: { children: ReactNode }) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): ErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    logger.error("Portal Error Boundary caught error:", { error: error.message, stack: error.stack, errorInfo })
    this.setState({ error, errorInfo })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
          <Icon icon="lucide:alert-circle" className="w-12 h-12 text-destructive" />
          <div className="text-center">
            <h3 className="text-lg font-semibold text-foreground">Something went wrong</h3>
            <p className="text-sm text-muted-foreground mt-1 max-w-md">
              We encountered an unexpected error. Please refresh the page to try again.
            </p>
            {process.env.NODE_ENV === 'development' && this.state.error && (
              <div className="mt-4 p-4 bg-destructive/10 border border-destructive/20 rounded-md text-left max-w-2xl">
                <p className="text-sm font-mono text-destructive">{this.state.error.message}</p>
              </div>
            )}
            <div className="mt-4">
              <Button 
                variant="bordered" 
                onPress={() => window.location.reload()}
              >
                <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
                Refresh Page
              </Button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}

// Loading component for DSM initialization
function DSMLoadingFallback({ error, retry }: { error?: string | null; retry?: () => void }) {
  return (
    <div className="flex min-h-[400px] flex-col items-center justify-center space-y-4">
      <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
      <div className="text-center">
        <h3 className="text-lg font-semibold text-foreground">Loading Documents...</h3>
        <p className="text-sm text-muted-foreground mt-1">
          {error ? "Retrying connection..." : "Please wait while we prepare your documents."}
        </p>
        {error && (
          <div className="mt-4 space-y-2">
            <p className="text-sm text-destructive">{error}</p>
            {retry && (
              <Button size="sm" variant="bordered" onPress={retry}>
                <Icon icon="lucide:refresh-cw" className="w-4 h-4 mr-2" />
                Retry
              </Button>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

// Create a client component to use the search params
export function DSMPortalContent({
  dealId,
  user,
  profile,
  role,
  testData,
  deal,
  paymentSuccess,
  sessionId,
}: {
  dealId: string
  user: any
  profile: any
  role: string
  testData?: any
  deal?: any
  paymentSuccess?: string | null
  sessionId?: string | null
}) {
  const [showPaymentSuccess, setShowPaymentSuccess] = useState(false)

  // Use DealStore to check loading states
  const { isLoadingDocuments, documentsError, refreshDocuments, dsm } = useDealStore()

  logger.info("DSMPortalContent", { dealId, user, profile, role, testData, deal, isLoadingDocuments, hasError: !!documentsError })

  useEffect(() => {
    if (paymentSuccess === "true" && sessionId) {
      setShowPaymentSuccess(true)

      // Hide the success message after 5 seconds
      const timer = setTimeout(() => {
        setShowPaymentSuccess(false)
      }, 5000)

      return () => clearTimeout(timer)
    }
  }, [paymentSuccess, sessionId])

  // Show loading state while DSM is initializing
  if (isLoadingDocuments) {
    return <DSMLoadingFallback error={documentsError} retry={refreshDocuments} />
  }

  return (
    <PortalContent dealId={dealId} user={user} profile={profile} role={role} />
  )
}

// Main page component with suspense boundary
export default function DSMPortalPage({
  dealId,
  user,
  profile,
  role,
  testData,
  deal,
}: {
  dealId: string
  user: any
  profile: any
  role: string
  testData?: any
  deal?: any
}) {
  const searchParams = useSearchParams()
  const paymentSuccess = searchParams.get("payment_success")
  const sessionId = searchParams.get("session_id")

  logger.info("DSMPortalPage", { dealId, user, profile, role, testData, deal })
  
  // Initialize store with props if needed (optional, can be done inside useEffect in content)
  // For now, we rely on the default mock data in the store
  
  return (
    <ErrorBoundary>
      <Suspense fallback={<DSMLoadingFallback />}>
        <DSMPortalContent 
          dealId={dealId} 
          user={user} 
          profile={profile} 
          role={role} 
          testData={testData} 
          deal={deal}
          paymentSuccess={paymentSuccess}
          sessionId={sessionId}
        />
      </Suspense>
    </ErrorBoundary>
  )
}
