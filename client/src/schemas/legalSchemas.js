import { z } from 'zod';

export const legalDocumentResponseSchema = z.object({
  type: z.string(),
  version: z.string(),
  effectiveDate: z.string(),
  summary: z.string().optional().nullable(),
  content: z.string().optional().nullable(),
});
