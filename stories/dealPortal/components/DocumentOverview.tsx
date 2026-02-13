import React, { Suspense } from "react"

import { DocumentDetailDSM } from "./DocumentDetailDSM"
import { DocumentListDSM } from "./DocumentListDSM"
import { useDealStore } from "../store/dealStore"
import { DocumentListSkeleton, DocumentDetailSkeleton } from "@/components/deal-portal/DealPortalLoading"

export function DocumentOverview() {
  const selectedDocument = useDealStore((state) => state.selectedDocument)

  return (
    <div className="view-transition-container">
      <Suspense fallback={selectedDocument ? <DocumentDetailSkeleton /> : <DocumentListSkeleton />}>
        {selectedDocument ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <DocumentDetailDSM />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-200">
            <DocumentListDSM />
          </div>
        )}
      </Suspense>
    </div>
  )
}
