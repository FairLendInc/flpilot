import React, { Suspense } from "react"

import { DocumentDetailDSM } from "./DocumentDetailDSM"
import { DocumentListDSM } from "./DocumentListDSM"
import { DocumentMappingDSM } from "./DocumentMappingDSM"
import { useDealStore } from "../store/dealStore"
import { DocumentCardSkeleton, DocumentListSkeleton, DocumentDetailSkeleton } from "@/components/deal-portal/DealPortalLoading"

function DocumentMappingSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 animate-in fade-in duration-200">
      {Array.from({ length: 3 }).map((_, i) => (
        <DocumentCardSkeleton key={`mapping-skel-${i}`} />
      ))}
    </div>
  )
}

export function DocumentOverview() {
  const selectedDocument = useDealStore((state) => state.selectedDocument)
  const activeDocumentGroup = useDealStore((state) => state.activeDocumentGroup)

  return (
    <div className="view-transition-container">
      <Suspense fallback={selectedDocument ? <DocumentDetailSkeleton /> : activeDocumentGroup ? <DocumentListSkeleton /> : <DocumentMappingSkeleton />}>
        {selectedDocument ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <DocumentDetailDSM />
          </div>
        ) : activeDocumentGroup ? (
          <div className="animate-in fade-in slide-in-from-right-4 duration-200">
            <DocumentListDSM />
          </div>
        ) : (
          <div className="animate-in fade-in slide-in-from-left-4 duration-200">
            <DocumentMappingDSM />
          </div>
        )}
      </Suspense>
    </div>
  )
}
