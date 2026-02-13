import type { DealStoreState } from "../store/dealStore"
import { ActionTypeEnum, FairLendRole } from "../utils/dealLogic"

export const createMockDealStoreState = (): Partial<DealStoreState> => ({
  dealId: "DEAL-123",
  currentUser: { 
    id: 'user-1', 
    email: 'user@example.com', 
    name: 'John Doe', 
    role: FairLendRole.BUYER 
  },
  availableUsers: [],
  userRole: FairLendRole.BUYER,
  isLawyerConfirmed: false,
  dealStatus: "In Progress",
  dealData: { lawyerUserId: 'user-1' },
  activeTab: 'documents',
  selectedDocument: null,
  showNotePanel: false,
  showApproveModal: false,
  showDisputeModal: false,
  showUploadModal: false,
  showConfirmModal: false,
  note: '',
  chatInput: '',
  confirmAmount: '',
  mfaCode: '',
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
  documents: [],
  
  // Mock implementations for actions that might be called in stories
  // These will be overridden by the real store actions but good to have as backup in state
})
