'use client';

import { createContext, useContext, useState } from 'react';
import { MOCK_COMPANIES } from '../_data/companies';
import { type Company, type Person, type Opportunity } from '../_data/types';

type RecordDataContextValue = {
  companies: Company[];
  getCompany: (id: string) => Company | undefined;
  updateCompanyField: (
    companyId: string,
    fieldId: string,
    value: unknown,
  ) => void;
  updateCompany: (companyId: string, updates: Partial<Company>) => void;
  getPerson: (id: string) => Person | undefined;
  getOpportunity: (id: string) => Opportunity | undefined;
  getAllPeople: () => Person[];
  getAllOpportunities: () => Opportunity[];
};

const RecordDataContext = createContext<RecordDataContextValue | null>(null);

export function useRecordData() {
  const ctx = useContext(RecordDataContext);
  if (!ctx) throw new Error('useRecordData must be inside RecordDataProvider');
  return ctx;
}

export function MockRecordDataProvider({
  children,
}: { children: React.ReactNode }) {
  const [companies, setCompanies] = useState<Company[]>(MOCK_COMPANIES);

  function getCompany(id: string) {
    return companies.find((c) => c.id === id);
  }

  function updateCompanyField(
    companyId: string,
    fieldId: string,
    value: unknown,
  ) {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== companyId) return c;
        return { ...c, [fieldId]: value };
      }),
    );
  }

  function updateCompany(companyId: string, updates: Partial<Company>) {
    setCompanies((prev) =>
      prev.map((c) => {
        if (c.id !== companyId) return c;
        return { ...c, ...updates };
      }),
    );
  }

  function derivePeople(): Person[] {
    const seen = new Set<string>();
    const result: Person[] = [];
    for (const company of companies) {
      for (const p of company.people) {
        if (!seen.has(p.id)) {
          seen.add(p.id);
          result.push({ ...p, companyId: company.id, companyName: company.name });
        }
      }
      // Account owners who aren't already in a people array
      if (!seen.has(company.accountOwner.id)) {
        seen.add(company.accountOwner.id);
        result.push({
          id: company.accountOwner.id,
          name: company.accountOwner.name,
          avatarUrl: company.accountOwner.avatarUrl,
          jobTitle: 'Account Owner',
          email: '',
          phone: '',
          companyId: company.id,
          companyName: company.name,
        });
      }
    }
    return result;
  }

  function getPerson(id: string): Person | undefined {
    for (const company of companies) {
      const found = company.people.find((p) => p.id === id);
      if (found) return { ...found, companyId: company.id, companyName: company.name };
      if (company.accountOwner.id === id) {
        return {
          id: company.accountOwner.id,
          name: company.accountOwner.name,
          avatarUrl: company.accountOwner.avatarUrl,
          jobTitle: 'Account Owner',
          email: '',
          phone: '',
          companyId: company.id,
          companyName: company.name,
        };
      }
    }
    return undefined;
  }

  function getOpportunity(id: string): Opportunity | undefined {
    for (const company of companies) {
      const found = company.opportunities.find((o) => o.id === id);
      if (found) return { ...found, companyId: company.id, companyName: company.name };
    }
    return undefined;
  }

  function getAllPeople(): Person[] {
    return derivePeople();
  }

  function getAllOpportunities(): Opportunity[] {
    const result: Opportunity[] = [];
    for (const company of companies) {
      for (const opp of company.opportunities) {
        result.push({ ...opp, companyId: company.id, companyName: company.name });
      }
    }
    return result;
  }

  return (
    <RecordDataContext.Provider
      value={{
        companies,
        getCompany,
        updateCompanyField,
        updateCompany,
        getPerson,
        getOpportunity,
        getAllPeople,
        getAllOpportunities,
      }}
    >
      {children}
    </RecordDataContext.Provider>
  );
}
