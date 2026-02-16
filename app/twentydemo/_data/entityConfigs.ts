import {
  IconBuildingSkyscraper,
  IconUser,
  IconCurrencyDollar,
  IconMail,
  IconPhone,
  IconBriefcase,
  IconFlag,
} from '@tabler/icons-react';

import {
  type Company,
  type Person,
  type Opportunity,
  type EntityType,
} from './types';
import { getCompanyFields } from './companyFields';
import { addressSchema } from './fieldSchemas';
import { type FieldDefinition } from '@/ui/twentycomponents/field/types';
import { type IconComponent } from '@/ui/twentycomponents/display/icon/types/IconComponent';

type FieldWithValue = FieldDefinition & { value: unknown };

type RelationConfig<T> = {
  title: string;
  targetEntityType: EntityType;
  getRecords: (entity: T) => Array<{
    id: string;
    name: string;
    avatarUrl?: string | null;
    avatarType: 'rounded' | 'squared';
  }>;
};

type ModalConfig<T> = {
  fieldId: string;
  title: string;
  schema: typeof addressSchema;
  getValues: (entity: T) => Record<string, unknown>;
};

type EntityConfig<T = Company | Person | Opportunity> = {
  label: string;
  icon: IconComponent;
  avatarType: 'rounded' | 'squared';
  tabs: readonly string[];

  getName: (entity: T) => string;
  getAvatarUrl: (entity: T) => string | null | undefined;
  getCreatedAt?: (entity: T) => string;
  getFields: (entity: T) => FieldWithValue[];

  relations: RelationConfig<T>[];

  edit?: {
    editableFields: Set<string>;
    modalFields?: Set<string>;
    clickableFields?: Map<string, (entity: T) => string>;
  };
  modals?: ModalConfig<T>[];

  lookupFn: 'getCompany' | 'getPerson' | 'getOpportunity';
  getAllFn: 'companies' | 'getAllPeople' | 'getAllOpportunities';
};

const companyConfig: EntityConfig<Company> = {
  label: 'Companies',
  icon: IconBuildingSkyscraper,
  avatarType: 'squared',
  tabs: ['Timeline', 'Tasks', 'Notes', 'Emails', 'Calendar'],

  getName: (c) => c.name,
  getAvatarUrl: () => null,
  getCreatedAt: (c) => c.createdAt,
  getFields: (c) => getCompanyFields(c),

  relations: [
    {
      title: 'Account Owner',
      targetEntityType: 'person',
      getRecords: (c) => [
        {
          id: c.accountOwner.id,
          name: c.accountOwner.name,
          avatarUrl: c.accountOwner.avatarUrl,
          avatarType: 'rounded',
        },
      ],
    },
    {
      title: 'Opportunities',
      targetEntityType: 'opportunity',
      getRecords: (c) =>
        c.opportunities.map((opp) => ({
          id: opp.id,
          name: `${opp.name} — $${(opp.amount / 1000).toFixed(0)}k`,
          avatarType: 'squared' as const,
        })),
    },
    {
      title: 'People',
      targetEntityType: 'person',
      getRecords: (c) =>
        c.people.map((p) => ({
          id: p.id,
          name: `${p.name} — ${p.jobTitle}`,
          avatarUrl: p.avatarUrl,
          avatarType: 'rounded' as const,
        })),
    },
  ],

  edit: {
    editableFields: new Set([
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
    ]),
    modalFields: new Set(['address']),
    clickableFields: new Map([
      ['accountOwner', (c) => `/twentydemo/person/${c.accountOwner.id}`],
    ]),
  },

  modals: [
    {
      fieldId: 'address',
      title: 'Address',
      schema: addressSchema,
      getValues: (c) => c.address as unknown as Record<string, unknown>,
    },
  ],

  lookupFn: 'getCompany',
  getAllFn: 'companies',
};

const personConfig: EntityConfig<Person> = {
  label: 'People',
  icon: IconUser,
  avatarType: 'rounded',
  tabs: ['Timeline', 'Tasks', 'Notes', 'Emails'],

  getName: (p) => p.name,
  getAvatarUrl: (p) => p.avatarUrl,
  getFields: (p) => [
    { fieldId: 'email', label: 'Email', type: 'TEXT', Icon: IconMail, value: p.email || '—' },
    { fieldId: 'phone', label: 'Phone', type: 'TEXT', Icon: IconPhone, value: p.phone || '—' },
    { fieldId: 'jobTitle', label: 'Job Title', type: 'TEXT', Icon: IconBriefcase, value: p.jobTitle },
  ],

  relations: [
    {
      title: 'Company',
      targetEntityType: 'company',
      getRecords: (p) => [
        {
          id: p.companyId,
          name: p.companyName,
          avatarType: 'squared' as const,
        },
      ],
    },
  ],

  lookupFn: 'getPerson',
  getAllFn: 'getAllPeople',
};

const opportunityConfig: EntityConfig<Opportunity> = {
  label: 'Opportunities',
  icon: IconCurrencyDollar,
  avatarType: 'squared',
  tabs: ['Timeline', 'Tasks', 'Notes', 'Emails'],

  getName: (o) => o.name,
  getAvatarUrl: () => null,
  getFields: (o) => [
    { fieldId: 'amount', label: 'Amount', type: 'MONEY', Icon: IconCurrencyDollar, value: o.amount },
    { fieldId: 'stage', label: 'Stage', type: 'TEXT', Icon: IconFlag, value: o.stage },
  ],

  relations: [
    {
      title: 'Company',
      targetEntityType: 'company',
      getRecords: (o) => [
        {
          id: o.companyId,
          name: o.companyName,
          avatarType: 'squared' as const,
        },
      ],
    },
  ],

  lookupFn: 'getOpportunity',
  getAllFn: 'getAllOpportunities',
};

// Use `any` in the record type to avoid complex conditional generics —
// the generic is only used inside each config's own functions, so
// consumers always pass the correctly-typed entity at call sites.
// eslint-disable-next-line @typescript-eslint/no-explicit-any
export const ENTITY_CONFIGS: Record<EntityType, EntityConfig<any>> = {
  company: companyConfig,
  person: personConfig,
  opportunity: opportunityConfig,
};

export const VALID_ENTITY_TYPES = new Set<string>([
  'company',
  'person',
  'opportunity',
]);

export type { EntityConfig, FieldWithValue };
