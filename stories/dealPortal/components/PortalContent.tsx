import { useEffect } from "react"

import ChatWindow from "../mocks/ChatWindow";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { ClipboardList, Clock, FileText, Mail, MessageCircle, Share } from "lucide-react"
import { useDealStore } from "../store/dealStore"
import { ActivityContent } from "./ActivityContent"
import { DashboardHeader } from "./DashboardHeader"
import { DocumentActionsList } from "./DocumentMappingDSM"
import { DocumentOverview } from "./DocumentOverview"
import { FundsTransferVerification } from "./FundsTransferVerification"
import { LawyerInvitesPanel } from "./invites/LawyerInvitesPanel"
import { LawyerConfirmation } from "./LawyerConfirmation"
import SharedDocumentsPanel from "./SharedDocumentsPanel"
import TimelineContent from "./steps/Steps"

export function PortalContent({
  dealId,
  user,
  profile,
  role,
}: {
  dealId: string
  user: any
  profile: any
  role: string
}) {
  const {
    // dsm:dsm2,

    // Deal context
    dealId:dealId2,
    setDealId:setDealId2,

    // Loading and error states
    isLoadingDocuments:isLoadingDocuments2,
    documentsError:documentsError2,
    refreshDocuments:refreshDocuments2,

    // User state
    currentUser:currentUser2,
    setCurrentUser:setCurrentUser2,
    availableUsers:availableUsers2,
    userRole:userRole2,
    setUserRole,

    // Lawyer confirmation state
    isLawyerConfirmed:isLawyerConfirmed2,
    setLawyerConfirmed:setLawyerConfirmed2,

    // Deal status
    dealStatus:dealStatus2,
    dealData:dealData2,

    // UI navigation state
    activeTab:activeTab2,
    setActiveTab:setActiveTab2,
    activeDocumentGroup:activeDocumentGroup2,
    setActiveDocumentGroup:setActiveDocumentGroup2,
    selectedDocument:selectedDocument2,
    setSelectedDocument:setSelectedDocument2,

    // UI modals state
    showNotePanel:showNotePanel2,
    setShowNotePanel:setShowNotePanel2,
    showApproveModal:showApproveModal2,
    setShowApproveModal:setShowApproveModal2,
    showDisputeModal:showDisputeModal2,
    setShowDisputeModal:setShowDisputeModal2,
    showUploadModal:showUploadModal2,
    setShowUploadModal:setShowUploadModal2,
    showConfirmModal:showConfirmModal2,
    setShowConfirmModal:setShowConfirmModal2,

    // Form data
    note:note2,
    setNote:setNote2,
    chatInput:chatInput2,
    setChatInput:setChatInput2,
    confirmAmount:confirmAmount2,
    setConfirmAmount:setConfirmAmount2,
    mfaCode:mfaCode2,
    setMfaCode:setMfaCode2,

    // Chat and events
    messages:messages2,
    events:events2,

    // File upload
    uploadState:uploadState2,

    // Document Actions
    getCurrentAssignments:getCurrentAssignments2,
    getRoleAssignments:getRoleAssignments2,
    getAllDocuments:getAllDocuments2,
    handleFileSelect:handleFileSelect2,
    getDocState:getDocState2,
    getDocStatusForUser:getDocStatusForUser2,

    // Helper functions
    sendMessage:sendMessage2,
    uploadDocument:uploadDocument2,
    getDocumentGroupName:getDocumentGroupName2,
    calculateGroupStatus:calculateGroupStatus2,
    hasPendingActions:hasPendingActions2,
    getActionStatusText:getActionStatusText2,
    getActionStatusColor:getActionStatusColor2,
    requiresSignature:requiresSignature2,
    logEvent:logEvent2,
    getGroupActionSteps:getGroupActionSteps2,
  } = useDealStore()

  // Log portal view on initial render
  useEffect(() => {
    logEvent2({
      type: "view",
      viewType: "portal",
      description: `Viewed ${activeTab2} tab`,
    })
  }, [activeTab2, logEvent2])

  // Log document group view when activeDocumentGroup changes
  useEffect(() => {
    if (activeDocumentGroup2) {
      logEvent2({
        type: "view",
        viewType: "document_group",
        description: `Viewed ${activeDocumentGroup2} group`,
      })
    }
  }, [activeDocumentGroup2, logEvent2])

  // Log document view when selectedDocument changes
  useEffect(() => {
    if (selectedDocument2 && selectedDocument2.id) {
      logEvent2({
        type: "view",
        viewType: "document",
        description: `Viewed ${selectedDocument2.id} document`,
      })
    }
  }, [selectedDocument2, logEvent2])

  // Log tab changes
  const handleTabChange = (value: string) => {
    setActiveTab2(value)
    // Log a view event for the tab change
    if (value !== activeTab2) {
      logEvent2({
        type: "view",
        viewType: "portal",
        description: `Viewed ${value} tab`,
      })
    }
  }

  // Check if current authenticated user is assigned as the lawyer for this deal
  // and needs to confirm representation
  const isAssignedLawyer = user?.id && dealData2?.lawyerUserId === user.id
  const needsConfirmation = isAssignedLawyer && !isLawyerConfirmed2

  if (needsConfirmation) {
    return <LawyerConfirmation />
  }

  return (
    <div className="container mx-auto px-2 py-6 sm:px-4">
      <DashboardHeader userRole={role} />

      {/* Show loading/error states */}
      {isLoadingDocuments2 && (
        <Card className="mb-6">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5 animate-spin" />
              Loading Documents
            </CardTitle>
            <CardDescription>Fetching document data from Documenso...</CardDescription>
          </CardHeader>
        </Card>
      )}

      {documentsError2 && (
        <Card className="border-destructive mb-6">
          <CardHeader>
            <CardTitle className="text-destructive flex items-center gap-2">
              <ClipboardList className="h-5 w-5" />
              Error Loading Documents
            </CardTitle>
            <CardDescription className="text-destructive">{documentsError2}</CardDescription>
            <button onClick={refreshDocuments2} className="text-primary mt-2 text-sm underline">
              Try again
            </button>
          </CardHeader>
        </Card>
      )}

      {/* Mobile Action Items - visible only on smaller screens */}
      <div className="mb-6 block space-y-4 lg:hidden">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-lg">Action Items</CardTitle>
            <CardDescription>Documents that require your attention</CardDescription>
          </CardHeader>
          <CardContent>
            <DocumentActionsList />
          </CardContent>
        </Card>

        {/* Funds Transfer Verification Component for mobile */}
        <FundsTransferVerification />
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        <div className="lg:col-span-2">
          <Tabs defaultValue="documents" value={activeTab2} onValueChange={handleTabChange} className="w-full">
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="documents">
                <FileText className=" h-4 w-4 hidden md:block" />
                Docs
              </TabsTrigger>
              <TabsTrigger value="chat">
                <MessageCircle className=" h-4 w-4 hidden md:block" />
                Chat
              </TabsTrigger>
              <TabsTrigger value="activity">
                <ClipboardList className=" h-4 w-4 hidden md:block" />
                Activity
              </TabsTrigger>
              <TabsTrigger value="timeline">
                <Clock className=" h-4 w-4 hidden md:block" />
                Timeline
              </TabsTrigger>
              <TabsTrigger value="shared">
                <Share className=" h-4 w-4 hidden md:block" />
                Shared
              </TabsTrigger>
              <TabsTrigger value="invites">
                <Mail className="h-4 w-4 hidden md:block" />
                Invites
              </TabsTrigger>
            </TabsList>

            <div className="min-h-[300px]">
              <TabsContent value="documents">
                <DocumentOverview />
              </TabsContent>

              <TabsContent value="chat">
                {/* <ChatContent /> */}
                <ChatWindow title="Chat" currentUserId="123" />
              </TabsContent>

              <TabsContent value="activity">
                <ActivityContent />
              </TabsContent>
              <TabsContent value="timeline">
                <TimelineContent />
              </TabsContent>
              <TabsContent value="shared">
                <SharedDocumentsPanel />
              </TabsContent>
              <TabsContent value="invites">
                <LawyerInvitesPanel />
              </TabsContent>
            </div>
          </Tabs>
        </div>

        {/* Desktop Action Items - visible only on larger screens */}
        <div className="hidden lg:block">
          <Card>
            <CardHeader className="pb-2">
              <CardTitle className="text-lg">Action Items</CardTitle>
              <CardDescription>Documents that require your attention</CardDescription>
            </CardHeader>
            <CardContent>
              <DocumentActionsList />
            </CardContent>
          </Card>

          {/* Funds Transfer Verification Component */}
          <FundsTransferVerification />

        </div>
      </div>

    </div>
  )
}
