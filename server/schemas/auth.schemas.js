const { z } = require('zod');

const registerSchema = z.object({
    body: z.object({
        username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters'),
        email: z.string().trim().toLowerCase().email('Please provide a valid email'),
        password: z.string().min(6, 'Password must be at least 6 characters'),
    }),
});

const loginSchema = z.object({
    body: z.object({
        identifier: z.string().trim().min(1, 'Email/username is required'),
        password: z.string().min(1, 'Password is required'),
    }),
});

const updateProfileSchema = z.object({
    body: z.object({
        username: z.string().trim().min(3, 'Username must be at least 3 characters').max(20, 'Username cannot exceed 20 characters').optional(),
        email: z.string().trim().toLowerCase().email('Please provide a valid email').optional(),
        currentPassword: z.string().optional(),
        newPassword: z.string().min(6, 'New password must be at least 6 characters').optional(),
    }).refine(data => {
        if (data.newPassword && !data.currentPassword) {
            return false;
        }
        return true;
    }, {
        message: 'Current password is required to set a new one',
        path: ['currentPassword']
    })
});

module.exports = {
    registerSchema,
    loginSchema,
    updateProfileSchema,
};
