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
import { LawyerRepresentationConfirmation } from "./LawyerRepresentationConfirmation"
import SharedDocumentsPanel from "./SharedDocumentsPanel"
import TimelineContent from "./steps/Steps"
import { Id } from "@/convex/_generated/dataModel"
import { withAuth } from "@workos-inc/authkit-nextjs";

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
  // Use selectors to avoid unnecessary re-renders
  const activeTab2 = useDealStore((state) => state.activeTab)
  const setActiveTab2 = useDealStore((state) => state.setActiveTab)
  const selectedDocument2 = useDealStore((state) => state.selectedDocument)
  const isLoadingDocuments2 = useDealStore((state) => state.isLoadingDocuments)
  const documentsError2 = useDealStore((state) => state.documentsError)
  const refreshDocuments2 = useDealStore((state) => state.refreshDocuments)
  const dealData2 = useDealStore((state) => state.dealData)
  const isLawyerConfirmed2 = useDealStore((state) => state.isLawyerConfirmed)
  const logEvent2 = useDealStore((state) => state.logEvent)

  // Log portal view on initial render
  useEffect(() => {
    logEvent2({
      type: "view",
      viewType: "portal",
      description: `Viewed ${activeTab2} tab`,
    })
  }, [activeTab2, logEvent2])

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
    return <LawyerRepresentationConfirmation dealId={dealId as Id<"deals">} />
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

            <div className="min-h-[300px] relative">
              <TabsContent value="documents" className="mt-0">
                <DocumentOverview />
              </TabsContent>

              <TabsContent value="chat" className="mt-0">
                {/* <ChatContent /> */}
                <ChatWindow title="Chat" />
              </TabsContent>

              <TabsContent value="activity" className="mt-0">
                <ActivityContent />
              </TabsContent>
              <TabsContent value="timeline" className="mt-0">
                <TimelineContent />
              </TabsContent>
              <TabsContent value="shared" className="mt-0">
                <SharedDocumentsPanel />
              </TabsContent>
              <TabsContent value="invites" className="mt-0">
                <LawyerInvitesPanel user={user}/>
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
