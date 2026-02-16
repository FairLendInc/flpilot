import {
  IconLink,
  IconUser,
  IconUsers,
  IconMapPin,
  IconCurrencyDollar,
  IconCheck,
  IconCalendar,
} from '@tabler/icons-react';

import { type Company } from './types';
import { type FieldDefinition } from '@/ui/twentycomponents/field/types';
import { type RecordData } from '@/ui/twentycomponents/record-table/types';

export function companyToRecord(company: Company): RecordData {
  return {
    id: company.id,
    name: company.name,
    domainName: { url: company.domainName, label: company.domainName },
    employees: company.employees,
    annualRecurringRevenue: company.annualRecurringRevenue,
    idealCustomerProfile: company.idealCustomerProfile,
    createdBy: {
      name: company.createdBy.name,
      avatarUrl: null,
      source: company.createdBy.source,
    },
    accountOwner: {
      name: company.accountOwner.name,
      avatarUrl: company.accountOwner.avatarUrl,
      source: 'MANUAL',
    },
    createdAt: company.createdAt,
  };
}

export function getCompanyFields(
  company: Company,
): (FieldDefinition & { value: unknown })[] {
  return [
    {
      fieldId: 'domainName',
      label: 'Domain Name',
      type: 'LINK',
      Icon: IconLink,
      value: { url: company.domainName, label: company.domainName },
    },
    {
      fieldId: 'accountOwner',
      label: 'Account Owner',
      type: 'ACTOR',
      Icon: IconUser,
      value: {
        name: company.accountOwner.name,
        avatarUrl: company.accountOwner.avatarUrl,
      },
    },
    {
      fieldId: 'employees',
      label: 'Employees',
      type: 'NUMBER',
      Icon: IconUsers,
      value: company.employees,
    },
    {
      fieldId: 'address',
      label: 'Address',
      type: 'ADDRESS',
      Icon: IconMapPin,
      value: company.address,
    },
    {
      fieldId: 'annualRecurringRevenue',
      label: 'ARR',
      type: 'MONEY',
      Icon: IconCurrencyDollar,
      value: company.annualRecurringRevenue,
    },
    {
      fieldId: 'linkedinUrl',
      label: 'LinkedIn',
      type: 'LINK',
      Icon: IconLink,
      value: { url: company.linkedinUrl, label: 'LinkedIn' },
    },
    {
      fieldId: 'idealCustomerProfile',
      label: 'ICP',
      type: 'BOOLEAN',
      Icon: IconCheck,
      value: company.idealCustomerProfile,
    },
    {
      fieldId: 'createdAt',
      label: 'Created',
      type: 'DATE',
      Icon: IconCalendar,
      value: company.createdAt,
    },
    {
      fieldId: 'createdBy',
      label: 'Created By',
      type: 'ACTOR',
      Icon: IconUser,
      value: { name: company.createdBy.name, source: company.createdBy.source },
    },
  ];
}
