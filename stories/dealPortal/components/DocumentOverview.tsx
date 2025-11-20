import React from "react"

import { DocumentDetailDSM } from "./DocumentDetailDSM"
import { DocumentListDSM } from "./DocumentListDSM"
import { DocumentMappingDSM } from "./DocumentMappingDSM"
import { useDealStore } from "../store/dealStore"

export function DocumentOverview() {
  const selectedDocument = useDealStore((state) => state.selectedDocument)
  const activeDocumentGroup = useDealStore((state) => state.activeDocumentGroup)

  // Determine which view to show
  const getView = () => {
    if (selectedDocument) return "detail"
    if (activeDocumentGroup) return "list"
    return "mapping"
  }

  return (
    <div className="view-transition-container">
      {selectedDocument ? (
        <DocumentDetailDSM />
      ) : activeDocumentGroup ? (
        <DocumentListDSM />
      ) : (
        <DocumentMappingDSM />
      )}
    </div>
  )
}
