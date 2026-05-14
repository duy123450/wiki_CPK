const { z } = require('zod');

const ROLES = ['All', 'Protagonist', 'Supporting', 'Antagonist', 'Cameo'];

const characterQuerySchema = z.object({
    query: z.object({
        movieId: z.string().optional(),
        role: z.enum(ROLES).optional().or(z.literal('')),
        search: z.string().optional(),
        page: z.string().regex(/^\d+$/, 'Page must be a number').optional(),
        limit: z.string().regex(/^\d+$/, 'Limit must be a number').optional(),
    }),
});

module.exports = {
    characterQuerySchema,
};
