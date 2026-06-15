const { z } = require('zod');

exports.getLegalDocumentSchema = z.object({
  params: z.object({
    type: z.string().min(1).max(50).describe('Legal document type (e.g., TERMS_OF_USE)'),
  }),
  query: z.object({
    lang: z.string().min(2).max(10).optional().describe('Language code (e.g., en, vi)'),
  }).optional(),
});
