'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  IconBuildingSkyscraper,
  IconLink,
  IconUser,
  IconCalendar,
  IconUsers,
  IconCurrencyDollar,
  IconCheck,
} from '@tabler/icons-react';

import { TwentyDemoShell } from './_components/TwentyDemoShell';
import { companyToRecord, getCompanyFields } from './_data/companyFields';
import { addressSchema } from './_data/fieldSchemas';
import {
  MockRecordDataProvider,
  useRecordData,
} from './_providers/RecordDataProvider';

import ThemeProvider from '@/ui/twentycomponents/theme/provider/ThemeProvider';
import { THEME_DARK } from '@/ui/twentycomponents/theme/constants/ThemeDark';
import { RecordTable } from '@/ui/twentycomponents/record-table';
import { type ColumnDefinition } from '@/ui/twentycomponents/record-table/types';
import { RecordShowContainer } from '@/ui/twentycomponents/record-show/RecordShowContainer';
import { FieldsCard } from '@/ui/twentycomponents/record-show/FieldsCard';
import { RecordDetailRelationSection } from '@/ui/twentycomponents/record-show/RecordDetailRelationSection';
import { FieldEditModal } from '@/ui/twentycomponents/record-show/FieldEditModal';

// Column definitions for the Companies table
const COLUMNS: ColumnDefinition[] = [
  {
    id: 'name',
    label: 'Name',
    Icon: IconBuildingSkyscraper,
    width: 180,
    fieldType: 'TEXT',
  },
  {
    id: 'domainName',
    label: 'Domain Name',
    Icon: IconLink,
    width: 160,
    fieldType: 'LINK',
  },
  {
    id: 'employees',
    label: 'Employees',
    Icon: IconUsers,
    width: 120,
    fieldType: 'NUMBER',
  },
  {
    id: 'annualRecurringRevenue',
    label: 'ARR',
    Icon: IconCurrencyDollar,
    width: 140,
    fieldType: 'MONEY',
  },
  {
    id: 'idealCustomerProfile',
    label: 'ICP',
    Icon: IconCheck,
    width: 80,
    fieldType: 'BOOLEAN',
  },
  {
    id: 'createdBy',
    label: 'Created By',
    Icon: IconUser,
    width: 160,
    fieldType: 'ACTOR',
  },
  {
    id: 'accountOwner',
    label: 'Account Owner',
    Icon: IconUser,
    width: 180,
    fieldType: 'ACTOR',
  },
  {
    id: 'createdAt',
    label: 'Creation Date',
    Icon: IconCalendar,
    width: 140,
    fieldType: 'DATE',
  },
];

// All sidebar fields are editable
const EDITABLE_FIELDS = new Set([
  'domainName',
  'accountOwner',
  'employees',
  'address',
  'annualRecurringRevenue',
  'linkedinUrl',
  'idealCustomerProfile',
  'createdAt',
  'createdBy',
  'name',
]);

function TwentyDemoPageInner() {
  const router = useRouter();
  const { companies, getCompany, updateCompanyField } = useRecordData();
  const [selectedCompanyId, setSelectedCompanyId] = useState<string>(
    companies[0].id,
  );
  const [isPanelOpen, setIsPanelOpen] = useState(true);
  const [addressModalCompanyId, setAddressModalCompanyId] = useState<
    string | null
  >(null);

  const records = companies.map(companyToRecord);
  const selectedCompany =
    companies.find((c) => c.id === selectedCompanyId) ?? companies[0];

  const handleRowClick = (recordId: string) => {
    setSelectedCompanyId(recordId);
    setIsPanelOpen(true);
  };

  const handleCellEdit = (
    recordId: string,
    columnId: string,
    value: unknown,
  ) => {
    // LINK columns store { url, label } in the table but the Company model
    // uses plain strings for domainName/linkedinUrl — extract the URL string.
    if (
      (columnId === 'domainName' || columnId === 'linkedinUrl') &&
      typeof value === 'object' &&
      value !== null &&
      'url' in value
    ) {
      updateCompanyField(recordId, columnId, (value as { url: string }).url);
      return;
    }
    // ACTOR columns: merge edited name back into the original Company object
    // to preserve fields like `id` that aren't in the table record.
    if (
      (columnId === 'accountOwner' || columnId === 'createdBy') &&
      typeof value === 'object' &&
      value !== null &&
      'name' in value
    ) {
      const company = getCompany(recordId);
      if (company) {
        const original = company[columnId] as Record<string, unknown>;
        updateCompanyField(recordId, columnId, {
          ...original,
          name: (value as { name: string }).name,
        });
        return;
      }
    }
    updateCompanyField(recordId, columnId, value);
  };

  function handleFieldEdit(fieldId: string, value: unknown) {
    updateCompanyField(selectedCompany.id, fieldId, value);
  }

  function handleModalEdit(fieldId: string) {
    if (fieldId === 'address') {
      setAddressModalCompanyId(selectedCompany.id);
    }
  }

  const addressModalCompany = addressModalCompanyId
    ? companies.find((c) => c.id === addressModalCompanyId)
    : null;

  const detailPanel = (
    <RecordShowContainer
      title={selectedCompany.name}
      avatarUrl={null}
      avatarType="squared"
      avatarPlaceholder={selectedCompany.name}
      createdAt={selectedCompany.createdAt}
      onClose={() => setIsPanelOpen(false)}
      onOpen={() => router.push(`/twentydemo/company/${selectedCompany.id}`)}
      tabs={[
        {
          id: 'home',
          label: 'Home',
          content: (
            <div>
              <FieldsCard
                fields={getCompanyFields(selectedCompany)}
                editableFields={EDITABLE_FIELDS}
                onFieldEdit={handleFieldEdit}
                onModalEdit={handleModalEdit}
                onValueClick={(fieldId) => {
                  if (fieldId === 'accountOwner') {
                    router.push(`/twentydemo/person/${selectedCompany.accountOwner.id}`);
                  }
                }}
              />
              <RecordDetailRelationSection
                title="Account Owner"
                records={[
                  {
                    id: selectedCompany.accountOwner.id,
                    name: selectedCompany.accountOwner.name,
                    avatarUrl: selectedCompany.accountOwner.avatarUrl,
                    avatarType: 'rounded',
                  },
                ]}
                onRecordClick={(id) => router.push(`/twentydemo/person/${id}`)}
              />
              {selectedCompany.opportunities.length > 0 && (
                <RecordDetailRelationSection
                  title="Opportunities"
                  records={selectedCompany.opportunities.map((opp) => ({
                    id: opp.id,
                    name: `${opp.name} — $${(opp.amount / 1000).toFixed(0)}k`,
                    avatarType: 'squared' as const,
                  }))}
                  onRecordClick={(id) => router.push(`/twentydemo/opportunity/${id}`)}
                />
              )}
              {selectedCompany.people.length > 0 && (
                <RecordDetailRelationSection
                  title="People"
                  records={selectedCompany.people.map((person) => ({
                    id: person.id,
                    name: `${person.name} — ${person.jobTitle}`,
                    avatarUrl: person.avatarUrl,
                    avatarType: 'rounded' as const,
                  }))}
                  onRecordClick={(id) => router.push(`/twentydemo/person/${id}`)}
                />
              )}
            </div>
          ),
        },
        {
          id: 'timeline',
          label: 'Timeline',
          content: (
            <div className="flex items-center justify-center p-8 text-sm text-[#666666]">
              No timeline events yet
            </div>
          ),
        },
        {
          id: 'tasks',
          label: 'Tasks',
          content: (
            <div className="flex items-center justify-center p-8 text-sm text-[#666666]">
              No tasks yet
            </div>
          ),
        },
        {
          id: 'emails',
          label: 'Emails',
          content: (
            <div className="flex items-center justify-center p-8 text-sm text-[#666666]">
              No emails yet
            </div>
          ),
        },
      ]}
    />
  );

  return (
    <>
      <TwentyDemoShell rightPanel={detailPanel} rightPanelOpen={isPanelOpen}>
        <div className="flex flex-col">
          {/* Page header */}
          <div className="flex items-center gap-2 border-b border-[#222222] px-4 py-3">
            <IconBuildingSkyscraper size={16} className="text-[#818181]" />
            <h1 className="text-sm font-medium text-[#ebebeb]">Companies</h1>
            <span className="text-xs text-[#666666]">{companies.length}</span>
          </div>

          {/* Table */}
          <RecordTable
            columns={COLUMNS}
            records={records}
            onRowClick={handleRowClick}
            onCellEdit={handleCellEdit}
          />
        </div>
      </TwentyDemoShell>

      {/* Address edit modal */}
      <FieldEditModal
        open={!!addressModalCompany}
        onOpenChange={(open) => {
          if (!open) setAddressModalCompanyId(null);
        }}
        title="Address"
        schema={addressSchema}
        values={addressModalCompany?.address ?? {}}
        onSave={(data) => {
          if (addressModalCompanyId) {
            updateCompanyField(addressModalCompanyId, 'address', data);
          }
        }}
      />
    </>
  );
}

export default function TwentyDemoPage() {
  return (
    <ThemeProvider theme={THEME_DARK}>
      <MockRecordDataProvider>
        <TwentyDemoPageInner />
      </MockRecordDataProvider>
    </ThemeProvider>
  );
}
