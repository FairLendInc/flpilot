import { z } from 'zod';

export const addressSchema = z.object({
  street: z.string().describe('Address 1'),
  street2: z.string().optional().describe('Address 2'),
  city: z.string().describe('City'),
  state: z.string().describe('State'),
  zip: z.string().describe('Post Code'),
  country: z.string().default('United States').describe('Country'),
});

export const linkSchema = z.object({
  url: z.string().url().optional().describe('URL'),
  label: z.string().optional().describe('Label'),
});
