"use client"

import React from "react"

import SupportCard from "./support-card"
import VerticalCollapsibleSteps from "./vertical-collapsible-steps"
import { useDealStore } from "../../../store/dealStore"
import { calculateGroupStatus } from "../../../utils/dealLogic"
import { Button } from "@heroui/react"
import { Progress, Spacer } from "../../../mocks/HeroUIMocks";
import { Icon } from "@iconify/react"
import { format } from "date-fns"

interface StepData {
  title: string
  description: string
  details: string[]
  completedAt?: Date | null
  startedAt?: Date | null
}

export default function Component() {
  const { documents, deal, isLawyerConfirmed } = useDealStore()
  const dealStatus = deal?.status
  const dealData = deal

  // Check if all documents are completed by looking at DSM state
  const areAllDocumentsCompleted = React.useMemo(() => {
    if (!documents) return false

    // Get all unique groups
    const groups = Array.from(new Set(documents.map((d) => d.group))) as string[]

    // Check if all document groups have completed all their requirements
    let allCompleted = true
    groups.forEach((group) => {
      const status = calculateGroupStatus(documents, group)
      const allDocsInGroupCompleted = status.percent === 100
      if (!allDocsInGroupCompleted) {
        allCompleted = false
      }
    })

    return allCompleted
  }, [documents])

  // Map deal status to step progression, but override with document completion state
  const getStepFromDealStatus = (dealStatus: string): number => {
    // If all documents are completed, we should be at funds transfer step
    if (areAllDocumentsCompleted) {
      console.log("Timeline: All documents completed, advancing to funds transfer step")
      return 3 // Funds transfer step
    }

    switch (dealStatus) {
      case "pending_lawyer_confirmation":
        return 1 // Lawyer approval step
      case "pending_doc_signing":
        return 2 // Document signing step
      case "pending_funds_transfer":
        return 3 // Funds transfer step
      case "completed":
        return 4 // All steps completed
      default:
        return 0 // Initial step
    }
  }

  const currentStepFromDeal = dealStatus ? getStepFromDealStatus(dealStatus) : 1
  const [currentStep, setCurrentStep] = React.useState(currentStepFromDeal)

  // Update current step when deal status or document completion changes
  React.useEffect(() => {
    if (dealStatus) {
      const newStep = getStepFromDealStatus(dealStatus)
      setCurrentStep(newStep)
    }
  }, [dealStatus, areAllDocumentsCompleted])

  // Create steps based on deal progression - using useMemo to update when deal status changes
  const steps = React.useMemo<StepData[]>(
    () => [
      {
        title: "Broker Uploads and signs documents",
        description: "The broker must upload and electronically sign all required transaction documents.",
        details: [
          "Upload property documentation including title, deed, and inspection reports",
          "Electronically sign all brokerage agreements and disclosure forms",
          "Verify all document details before submission",
        ],
        completedAt: new Date(Date.now() - 240000), // Always completed for demo
        startedAt: new Date(Date.now() - 3600000),
      },
      {
        title: "Buyer's Lawyer Confirms Representation",
        description: "Legal representative confirms participation and reviews transaction requirements",
        details: [
          "Lawyer confirms legal representation of the buyer",
          "Email verification completed for secure communications",
          "Initial review of transaction requirements and documentation",
        ],
        startedAt: dealStatus ? new Date() : null,
        completedAt: isLawyerConfirmed && dealData?.lawyerVerifiedEmail ? new Date() : null,
      },
      {
        title: "Document Signing Process",
        description: "All parties review and electronically sign transaction documents",
        details: [
          "Legal representative reviews all contract terms and conditions",
          "Buyer reviews and provides digital signatures on purchase agreements",
          "Verify all signatures are properly completed before proceeding",
        ],
        startedAt:
          dealStatus === "pending_doc_signing" || dealStatus === "pending_funds_transfer" || dealStatus === "completed"
            ? new Date()
            : null,
        completedAt:
          areAllDocumentsCompleted || dealStatus === "pending_funds_transfer" || dealStatus === "completed"
            ? new Date()
            : null,
      },
      {
        title: "Funds Transfer",
        description: "Transfer the agreed payment amount and provide confirmation of the transaction",
        details: [
          "Wire transfer funds to the specified escrow account",
          "Keep your wire transfer receipt for your records",
          "Upload proof of payment to the transaction management system",
        ],
        startedAt:
          (areAllDocumentsCompleted && dealStatus === "pending_doc_signing") ||
          dealStatus === "pending_funds_transfer" ||
          dealStatus === "completed"
            ? new Date()
            : null,
        completedAt: dealStatus === "completed" ? new Date() : null,
      },
      {
        title: "Transaction Complete",
        description: "Final verification of fund receipt and document completion",
        details: [
          "Broker verifies that all funds have been properly received",
          "Final review of all transaction documentation",
          "Official confirmation of successful transaction completion",
        ],
        startedAt: dealStatus === "completed" ? new Date() : null,
        completedAt: dealStatus === "completed" ? new Date() : null,
      },
    ],
    [dealStatus, isLawyerConfirmed, dealData?.lawyerVerifiedEmail, areAllDocumentsCompleted]
  )

  // Steps are now read-only based on deal status
  // No manual completion since it's driven by database state

  return (
    <section className="mx-auto max-w-md">
      <h1 className="mb-2 text-center text-xl font-medium" id="transaction-progress">
        Transaction Progress
      </h1>
      <p className="text-small text-default-500 mb-5">
        Follow the transaction process. The current step requires action before proceeding.
      </p>
      <Progress
        className="px-0.5 mb-5"
        label="Step"
        value={currentStep}
      />
      <VerticalCollapsibleSteps
        currentStep={currentStep}
        steps={steps}
        // Step change is now externally controlled
      />
      <Spacer y={4} />
      <div className="text-center">
        <p className="text-small text-default-500">Timeline updates automatically based on transaction progress</p>
      </div>
      <Spacer y={4} />
      <SupportCard className="border-default-200 !bg-default-50 dark:border-default-100 dark:!bg-default-50/50 !m-0 border px-2 shadow-none" />
    </section>
  )
}
