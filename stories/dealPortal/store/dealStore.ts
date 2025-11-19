import { create } from 'zustand'
import { mockDeal } from '../models/mockData'
import { 
  User, 
  FairLendRole, 
  Document, 
  ActionAssignment, 
  initialDocuments, 
  calculateGroupStatus, 
  getQuickActionsForUser, 
  getDocState, 
  getGroupActionSteps, 
  getActionStatusText, 
  getActionStatusColor, 
  requiresSignature,
  ActionTypeEnum
} from '../utils/dealLogic'

interface DealStoreState {
  // Deal context
  dealId: string
  setDealId: (id: string) => void
  documents: Document[]
  
  // Loading and error states
  isLoadingDocuments: boolean
  documentsError: string | null
  refreshDocuments: () => void

  // User state
  currentUser: User | null
  setCurrentUser: (user: User | null) => void
  availableUsers: User[]
  userRole: FairLendRole
  setUserRole: (role: FairLendRole) => void

  // Lawyer confirmation state
  isLawyerConfirmed: boolean
  setLawyerConfirmed: (confirmed: boolean) => void

  // Deal status
  dealStatus: string
  dealData: any

  // UI navigation state
  activeTab: string
  setActiveTab: (tab: string) => void
  activeDocumentGroup: string | null
  setActiveDocumentGroup: (group: string | null) => void
  selectedDocument: Document | null
  setSelectedDocument: (doc: Document | null) => void

  // UI modals state
  showNotePanel: boolean
  setShowNotePanel: (show: boolean) => void
  showApproveModal: boolean
  setShowApproveModal: (show: boolean) => void
  showDisputeModal: boolean
  setShowDisputeModal: (show: boolean) => void
  showUploadModal: boolean
  setShowUploadModal: (show: boolean) => void
  showConfirmModal: boolean
  setShowConfirmModal: (show: boolean) => void

  // Form data
  note: string
  setNote: (note: string) => void
  chatInput: string
  setChatInput: (input: string) => void
  confirmAmount: string
  setConfirmAmount: (amount: string) => void
  mfaCode: string
  setMfaCode: (code: string) => void

  // Chat and events
  messages: any[]
  events: any[]

  // File upload
  uploadState: any

  // Actions & Helpers
  getCurrentAssignments: () => ActionAssignment[]
  getRoleAssignments: () => ActionAssignment[]
  getAllDocuments: () => Document[]
  handleFileSelect: (file: any) => void
  getDocState: (docId: string) => any
  getDocStatusForUser: (docId: string, userId: string) => any
  getGroupStatusForUser: (groupId: string) => any
  sendMessage: (message: string) => void
  uploadDocument: (file: any) => void
  getDocumentGroupName: (groupId: string) => string
  calculateGroupStatus: (groupId: string) => any
  hasPendingActions: (groupId: string) => boolean
  getActionStatusText: (doc: Document) => string
  getActionStatusColor: (status: any) => string
  requiresSignature: (doc: Document) => boolean
  logEvent: (event: any) => void
  getGroupActionSteps: (groupId: string) => any[]
  
  // New action to replace trpc
  confirmLawyerRepresentation: (dealId: string) => Promise<void>
  completeDocumentAction: (docId: string, action: string, role: string) => void
  getDocumentVersions: (docId: string) => any[]

  // Document Viewer Helpers
  documentViewMode: string
  setDocumentViewMode: (mode: string) => void
  getSelectedDocumentWithFileData: () => any
  logDocumentView: (docId: string) => void
  
  // Legacy dsm property for compatibility (optional, can be removed if we update all components)
  dsm: any
}

export const useDealStore = create<DealStoreState>((set, get) => ({
  // Initial State
  dealId: mockDeal.id,
  setDealId: (id) => set({ dealId: id }),
  documents: initialDocuments,
  
  isLoadingDocuments: false,
  documentsError: null,
  refreshDocuments: () => {
    set({ isLoadingDocuments: true, documentsError: null })
    setTimeout(() => set({ isLoadingDocuments: false }), 1000)
  },

  currentUser: { 
    id: 'user-1', 
    email: 'user@example.com', 
    name: 'John Doe', 
    role: FairLendRole.BUYER 
  },
  setCurrentUser: (user) => set({ currentUser: user }),
  availableUsers: [
    { id: 'user-1', email: 'user@example.com', name: 'John Doe', role: FairLendRole.BUYER },
    { id: 'lawyer-1', email: 'lawyer@example.com', name: 'Jane Lawyer', role: FairLendRole.LAWYER }
  ],
  userRole: FairLendRole.BUYER,
  setUserRole: (role) => set({ userRole: role }),

  isLawyerConfirmed: false,
  setLawyerConfirmed: (confirmed) => set({ isLawyerConfirmed: confirmed }),

  dealStatus: mockDeal.status,
  dealData: { ...mockDeal, lawyerUserId: 'user-1' },

  activeTab: 'documents',
  setActiveTab: (tab) => set({ activeTab: tab }),
  activeDocumentGroup: null,
  setActiveDocumentGroup: (group) => set({ activeDocumentGroup: group }),
  selectedDocument: null,
  setSelectedDocument: (doc) => set({ selectedDocument: doc }),

  showNotePanel: false,
  setShowNotePanel: (show) => set({ showNotePanel: show }),
  showApproveModal: false,
  setShowApproveModal: (show) => set({ showApproveModal: show }),
  showDisputeModal: false,
  setShowDisputeModal: (show) => set({ showDisputeModal: show }),
  showUploadModal: false,
  setShowUploadModal: (show) => set({ showUploadModal: show }),
  showConfirmModal: false,
  setShowConfirmModal: (show) => set({ showConfirmModal: show }),

  note: '',
  setNote: (note) => set({ note }),
  chatInput: '',
  setChatInput: (input) => set({ chatInput: input }),
  confirmAmount: '',
  setConfirmAmount: (amount) => set({ confirmAmount: amount }),
  mfaCode: '',
  setMfaCode: (code) => set({ mfaCode: code }),

  messages: [
    {
      id: 1,
      sender: "Admin",
      message: "Hello, I've uploaded the initial documents for review.",
      timestamp: "10:30 AM",
    },
  ],
  events: [],
  uploadState: {},

  // Helpers
  getCurrentAssignments: () => {
    const { documents, currentUser } = get()
    if (!currentUser) return []
    return getQuickActionsForUser(documents, currentUser.email)
  },
  getRoleAssignments: () => {
    // Simplified: just return current assignments for now
    return get().getCurrentAssignments()
  },
  getAllDocuments: () => get().documents,
  handleFileSelect: (file) => console.log('File selected', file),
  getDocState: (docId) => {
    const doc = get().documents.find(d => d.id === docId)
    return doc ? getDocState(doc) : null
  },
  getDocStatusForUser: (docId, userId) => {
     const doc = get().documents.find(d => d.id === docId)
     if (!doc) return null
     return {
       docComplete: doc.isComplete,
       statusText: doc.status,
       blocked: doc.blocked,
       actionRequired: doc.requiredAction !== ActionTypeEnum.NONE,
       action: doc.requiredAction
     }
  },
  getGroupStatusForUser: (groupId) => {
    const { documents, currentUser } = get()
    if (!currentUser) return null
    
    const groupDocs = documents.filter(d => d.group === groupId)
    if (groupDocs.length === 0) return { percentComplete: 0, actionsNotAssignedToUser: [], actionsAssignedToUser: [], groupSteps: [], groupStepIndex: 0 }

    const completed = groupDocs.filter(d => d.isComplete).length
    const percentComplete = Math.round((completed / groupDocs.length) * 100)

    // Actions assigned to current user
    const actionsAssignedToUser = getQuickActionsForUser(documents, currentUser.email)
      .filter(a => a.docGroup === groupId)

    // Actions assigned to others (blocking)
    const actionsNotAssignedToUser = groupDocs
      .filter(d => !d.isComplete && d.assignedTo !== currentUser.email)
      .map(d => ({
        action: {
          action: d.requiredAction,
          assignedToName: d.assignedTo || "Unknown",
          doc: d
        },
        docName: d.name
      }))

    // Group steps for visualization
    const groupSteps = groupDocs.map(d => ({
      action: d.requiredAction,
      assignedTo: {
        email: d.assignedTo || "",
        name: d.assignedTo || "Unknown"
      },
      assignedToRole: d.assignedToRole
    }))
    
    // Find first incomplete step index
    const firstIncompleteIndex = groupSteps.findIndex(s => 
      groupDocs.find(d => d.requiredAction === s.action && d.assignedTo === s.assignedTo.email && !d.isComplete)
    )
    const groupStepIndex = firstIncompleteIndex === -1 ? groupSteps.length : firstIncompleteIndex

    return {
      percentComplete,
      actionsNotAssignedToUser,
      actionsAssignedToUser,
      groupSteps,
      groupStepIndex
    }
  },
  sendMessage: (message) => {
    const newMessage = { 
      id: Date.now(), 
      text: message, 
      sender: get().currentUser?.name || 'Unknown',
      timestamp: new Date().toLocaleTimeString()
    }
    set((state) => ({ messages: [...state.messages, newMessage], chatInput: '' }))
  },
  uploadDocument: (file) => {
    console.log('Upload document', file)
    set({ showUploadModal: false })
  },
  getDocumentGroupName: (groupId) => {
    const names: Record<string, string> = {
      mortgage: "Mortgage Commitment",
      closing: "Closing Package"
    }
    return names[groupId] || groupId
  },
  calculateGroupStatus: (groupId) => calculateGroupStatus(get().documents, groupId),
  hasPendingActions: (groupId) => {
    const { documents, currentUser } = get()
    if (!currentUser) return false
    return documents.some(d => d.group === groupId && !d.isComplete && d.assignedTo === currentUser.email)
  },
  getActionStatusText: (doc) => {
    const { currentUser } = get()
    if (!currentUser) return ''
    return getActionStatusText(doc, currentUser.email)
  },
  getActionStatusColor: (status) => getActionStatusColor(status),
  requiresSignature: (doc) => {
    const { currentUser } = get()
    if (!currentUser) return false
    return requiresSignature(doc, currentUser.email)
  },
  logEvent: (event) => {
    console.log('Event logged:', event)
    set((state) => ({ events: [...state.events, event] }))
  },
  getGroupActionSteps: (groupId) => getGroupActionSteps(get().documents, groupId),

  confirmLawyerRepresentation: async (dealId) => {
    console.log('Confirming lawyer representation for deal:', dealId)
    await new Promise(resolve => setTimeout(resolve, 1000))
    set({ isLawyerConfirmed: true })
  },

  completeDocumentAction: (docId, action, role) => {
    console.log('Completing document action:', { docId, action, role })
    // Mock implementation: update document status
    set((state) => ({
      documents: state.documents.map(d => 
        d.id === docId ? { ...d, isComplete: true, status: 'completed' } : d
      )
    }))
  },

  getDocumentVersions: (docId) => {
    // Mock implementation
    return [
      { id: 'v1', label: 'Version 1', signedBy: 'John Doe', timestamp: new Date().toISOString() }
    ]
  },

  // Document Viewer Helpers
  documentViewMode: 'preview',
  setDocumentViewMode: (mode) => set({ documentViewMode: mode }),
  
  getSelectedDocumentWithFileData: () => {
    const { selectedDocument } = get()
    if (!selectedDocument) return null
    // Mock file data if missing
    return {
      ...selectedDocument,
      fileData: selectedDocument.fileData || 'https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf',
      fileName: selectedDocument.name + '.pdf',
      fileType: 'application/pdf',
      fileSize: 1024 * 1024
    }
  },

  logDocumentView: (docId) => {
    console.log('Document viewed:', docId)
    get().logEvent({ type: 'VIEW', description: `Viewed document ${docId}` })
  },
  
  dsm: {
    documents: initialDocuments, // Expose documents for components that access dsm.documents directly
    getDoc: (id: string) => initialDocuments.find(d => d.id === id), // Mock getDoc
    getDocState: (id: string) => getDocState(initialDocuments.find(d => d.id === id)!), // Mock getDocState
    listGroups: () => Array.from(new Set(initialDocuments.map(d => d.group))), // Mock listGroups
    getGroup: (groupId: string) => initialDocuments.filter(d => d.group === groupId), // Mock getGroup
  } // Mock DSM object
}))
