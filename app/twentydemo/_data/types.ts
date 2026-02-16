export type CompanyAddress = {
  street: string;
  street2?: string;
  city: string;
  state: string;
  zip: string;
  country: string;
};

export type Person = {
  id: string;
  name: string;
  avatarUrl?: string | null;
  jobTitle: string;
  email: string;
  phone: string;
  companyId: string;
  companyName: string;
};

export type Opportunity = {
  id: string;
  name: string;
  amount: number;
  stage: string;
  companyId: string;
  companyName: string;
};

export type EntityType = 'company' | 'person' | 'opportunity';

export type Company = {
  id: string;
  name: string;
  domainName: string;
  createdAt: string;
  employees: number;
  annualRecurringRevenue: number;
  address: CompanyAddress;
  linkedinUrl: string;
  idealCustomerProfile: boolean;
  createdBy: { name: string; avatarUrl?: string | null; source: string };
  accountOwner: {
    id: string;
    name: string;
    avatarUrl?: string | null;
  };
  people: Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
    jobTitle: string;
    email: string;
    phone: string;
  }>;
  opportunities: Array<{
    id: string;
    name: string;
    amount: number;
    stage: string;
  }>;
};
