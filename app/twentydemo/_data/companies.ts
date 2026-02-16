import { type Company } from './types';

const now = new Date();
const oneHourAgo = new Date(now.getTime() - 60 * 60 * 1000).toISOString();
const twoDaysAgo = new Date(now.getTime() - 2 * 24 * 60 * 60 * 1000).toISOString();
const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
const twoWeeksAgo = new Date(now.getTime() - 14 * 24 * 60 * 60 * 1000).toISOString();
const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

export const MOCK_COMPANIES: Company[] = [
  {
    id: 'company-airbnb',
    name: 'Airbnb',
    domainName: 'airbnb.com',
    createdAt: oneHourAgo,
    employees: 6907,
    annualRecurringRevenue: 8400000000,
    address: {
      street: '888 Brannan St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94103',
      country: 'United States',
    },
    linkedinUrl: 'https://linkedin.com/company/airbnb',
    idealCustomerProfile: true,
    createdBy: { name: 'Tim Cook', source: 'MANUAL' },
    accountOwner: {
      id: 'person-jeanpierre',
      name: 'Jean-Pierre Delahaye',
      avatarUrl: null,
    },
    people: [
      {
        id: 'person-brian',
        name: 'Brian Chesky',
        jobTitle: 'CEO',
        email: 'brian@airbnb.com',
        phone: '+1 415-555-0100',
        avatarUrl: null,
      },
      {
        id: 'person-joe',
        name: 'Joe Gebbia',
        jobTitle: 'Co-Founder',
        email: 'joe@airbnb.com',
        phone: '+1 415-555-0101',
        avatarUrl: null,
      },
    ],
    opportunities: [
      {
        id: 'opp-airbnb-1',
        name: 'Enterprise Plan',
        amount: 250000,
        stage: 'Negotiating',
      },
    ],
  },
  {
    id: 'company-anthropic',
    name: 'Anthropic',
    domainName: 'anthropic.com',
    createdAt: twoDaysAgo,
    employees: 1500,
    annualRecurringRevenue: 900000000,
    address: {
      street: '427 N Tatnall St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94107',
      country: 'United States',
    },
    linkedinUrl: 'https://linkedin.com/company/anthropic',
    idealCustomerProfile: true,
    createdBy: { name: 'System', source: 'SYSTEM' },
    accountOwner: {
      id: 'person-sylvie',
      name: 'Sylvie Palmer',
      avatarUrl: null,
    },
    people: [
      {
        id: 'person-dario',
        name: 'Dario Amodei',
        jobTitle: 'CEO',
        email: 'dario@anthropic.com',
        phone: '+1 415-555-0200',
        avatarUrl: null,
      },
    ],
    opportunities: [
      {
        id: 'opp-anthropic-1',
        name: 'API Contract',
        amount: 500000,
        stage: 'Proposal',
      },
      {
        id: 'opp-anthropic-2',
        name: 'Consulting',
        amount: 75000,
        stage: 'Meeting',
      },
    ],
  },
  {
    id: 'company-stripe',
    name: 'Stripe',
    domainName: 'stripe.com',
    createdAt: oneWeekAgo,
    employees: 8000,
    annualRecurringRevenue: 14000000000,
    address: {
      street: '354 Oyster Point Blvd',
      city: 'South San Francisco',
      state: 'CA',
      zip: '94080',
      country: 'United States',
    },
    linkedinUrl: 'https://linkedin.com/company/stripe',
    idealCustomerProfile: false,
    createdBy: { name: 'API Import', source: 'API' },
    accountOwner: {
      id: 'person-jeanpierre',
      name: 'Jean-Pierre Delahaye',
      avatarUrl: null,
    },
    people: [
      {
        id: 'person-patrick',
        name: 'Patrick Collison',
        jobTitle: 'CEO',
        email: 'patrick@stripe.com',
        phone: '+1 650-555-0300',
        avatarUrl: null,
      },
      {
        id: 'person-john',
        name: 'John Collison',
        jobTitle: 'President',
        email: 'john@stripe.com',
        phone: '+1 650-555-0301',
        avatarUrl: null,
      },
    ],
    opportunities: [],
  },
  {
    id: 'company-figma',
    name: 'Figma',
    domainName: 'figma.com',
    createdAt: twoWeeksAgo,
    employees: 1400,
    annualRecurringRevenue: 600000000,
    address: {
      street: '760 Market St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94102',
      country: 'United States',
    },
    linkedinUrl: 'https://linkedin.com/company/figma',
    idealCustomerProfile: true,
    createdBy: { name: 'Sylvie Palmer', source: 'MANUAL' },
    accountOwner: {
      id: 'person-sylvie',
      name: 'Sylvie Palmer',
      avatarUrl: null,
    },
    people: [
      {
        id: 'person-dylan',
        name: 'Dylan Field',
        jobTitle: 'CEO',
        email: 'dylan@figma.com',
        phone: '+1 415-555-0400',
        avatarUrl: null,
      },
    ],
    opportunities: [
      {
        id: 'opp-figma-1',
        name: 'Design Platform License',
        amount: 120000,
        stage: 'Won',
      },
    ],
  },
  {
    id: 'company-notion',
    name: 'Notion',
    domainName: 'notion.so',
    createdAt: oneMonthAgo,
    employees: 800,
    annualRecurringRevenue: 250000000,
    address: {
      street: '2300 Harrison St',
      city: 'San Francisco',
      state: 'CA',
      zip: '94110',
      country: 'United States',
    },
    linkedinUrl: 'https://linkedin.com/company/notion',
    idealCustomerProfile: false,
    createdBy: { name: 'CSV Import', source: 'IMPORT' },
    accountOwner: {
      id: 'person-jeanpierre',
      name: 'Jean-Pierre Delahaye',
      avatarUrl: null,
    },
    people: [
      {
        id: 'person-ivan',
        name: 'Ivan Zhao',
        jobTitle: 'CEO',
        email: 'ivan@notion.so',
        phone: '+1 415-555-0500',
        avatarUrl: null,
      },
    ],
    opportunities: [],
  },
];
