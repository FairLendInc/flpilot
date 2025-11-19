import React from "react"

import { DocumentDetailDSM } from "./DocumentDetailDSM"
import { DocumentListDSM } from "./DocumentListDSM"
import { DocumentMappingDSM } from "./DocumentMappingDSM"
import { useDealStore } from "../store/dealStore"

export function DocumentOverview() {
  const { selectedDocument, activeDocumentGroup } = useDealStore()

  if (selectedDocument) {
    return <DocumentDetailDSM />
  }

  if (activeDocumentGroup) {
    return <DocumentListDSM />
  }

  return <DocumentMappingDSM />
}
