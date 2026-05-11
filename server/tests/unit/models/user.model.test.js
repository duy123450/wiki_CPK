const mongoose = require('mongoose');

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';

const User = require('../../../modules/auth/user.model');

const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'secure123',
};

describe('User Model', () => {
    // ── Schema Validations ────────────────────────────────────────────────────
    describe('Validations', () => {
        it('should create a valid user', async () => {
            const user = await User.create(validUser);
            expect(user._id).toBeDefined();
            expect(user.username).toBe('testuser');
            expect(user.email).toBe('test@example.com');
            expect(user.role).toBe('user'); // default
        });

        it('should require username', async () => {
            await expect(
                User.create({ email: 'a@b.com', password: '123456' })
            ).rejects.toThrow(/username/i);
        });

        it('should require email', async () => {
            await expect(
                User.create({ username: 'user1', password: '123456' })
            ).rejects.toThrow(/email/i);
        });

        it('should require password', async () => {
            await expect(
                User.create({ username: 'user1', email: 'a@b.com' })
            ).rejects.toThrow(/password/i);
        });

        it('should reject invalid email format', async () => {
            await expect(
                User.create({ ...validUser, email: 'not-an-email' })
            ).rejects.toThrow(/email/i);
        });

        it('should reject username shorter than 3 chars', async () => {
            await expect(
                User.create({ ...validUser, username: 'ab' })
            ).rejects.toThrow();
        });

        it('should reject username longer than 20 chars', async () => {
            await expect(
                User.create({ ...validUser, username: 'a'.repeat(21) })
            ).rejects.toThrow();
        });

        it('should reject password shorter than 6 chars', async () => {
            await expect(
                User.create({ ...validUser, password: '12345' })
            ).rejects.toThrow();
        });

        it('should only allow valid roles', async () => {
            const user = await User.create({ ...validUser, role: 'admin' });
            expect(user.role).toBe('admin');

            await expect(
                User.create({ ...validUser, username: 'u2', email: 'u2@b.com', role: 'superadmin' })
            ).rejects.toThrow();
        });

        it('should enforce unique username', async () => {
            await User.create(validUser);
            await expect(
                User.create({ ...validUser, email: 'other@b.com' })
            ).rejects.toThrow();
        });

        it('should enforce unique email', async () => {
            await User.create(validUser);
            await expect(
                User.create({ ...validUser, username: 'other' })
            ).rejects.toThrow();
        });

        it('should set default avatar', async () => {
            const user = await User.create(validUser);
            expect(user.avatar).toBeDefined();
            expect(user.avatar.url).toContain('cloudinary');
            expect(user.avatar.public_id).toBeDefined();
        });

        it('should trim username', async () => {
            const user = await User.create({ ...validUser, username: '  testuser  ' });
            expect(user.username).toBe('testuser');
        });
    });

    // ── Pre-save Password Hashing ─────────────────────────────────────────────
    describe('Password Hashing (pre-save)', () => {
        it('should hash the password before saving', async () => {
            const user = await User.create(validUser);
            expect(user.password).not.toBe('secure123');
            expect(user.password).toMatch(/^\$argon2/); // argon2 hash prefix
        });

        it('should NOT re-hash if password is not modified', async () => {
            const user = await User.create(validUser);
            const originalHash = user.password;

            user.username = 'newname';
            await user.save();

            expect(user.password).toBe(originalHash);
        });

        it('should re-hash when password is changed', async () => {
            const user = await User.create(validUser);
            const originalHash = user.password;

            user.password = 'newsecure456';
            await user.save();

            expect(user.password).not.toBe(originalHash);
            expect(user.password).not.toBe('newsecure456');
            expect(user.password).toMatch(/^\$argon2/);
        });
    });

    // ── comparePassword ───────────────────────────────────────────────────────
    describe('comparePassword()', () => {
        it('should return true for correct password', async () => {
            const user = await User.create(validUser);
            const isMatch = await user.comparePassword('secure123');
            expect(isMatch).toBe(true);
        });

        it('should return false for wrong password', async () => {
            const user = await User.create(validUser);
            const isMatch = await user.comparePassword('wrongpassword');
            expect(isMatch).toBe(false);
        });

        it('should return false for empty string', async () => {
            const user = await User.create(validUser);
            const isMatch = await user.comparePassword('');
            expect(isMatch).toBe(false);
        });
    });

    // ── createJWT ─────────────────────────────────────────────────────────────
    describe('createAccessToken()', () => {
        it('should return a JWT string', async () => {
            const user = await User.create(validUser);
            const token = user.createAccessToken();

            expect(typeof token).toBe('string');
            // JWT format: header.payload.signature
            expect(token.split('.')).toHaveLength(3);
        });

        it('should contain userId, name, and role in the payload', async () => {
            const user = await User.create(validUser);
            const token = user.createAccessToken();

            // Decode the payload (base64)
            const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64').toString()
            );

            expect(payload.userId).toBe(user._id.toString());
            expect(payload.name).toBe('testuser');
            expect(payload.role).toBe('user');
        });

        it('should include an expiration claim', async () => {
            const user = await User.create(validUser);
            const token = user.createAccessToken();

            const payload = JSON.parse(
                Buffer.from(token.split('.')[1], 'base64').toString()
            );

            expect(payload.exp).toBeDefined();
            expect(payload.iat).toBeDefined();
            expect(payload.exp).toBeGreaterThan(payload.iat);
        });
    });

    // ── Timestamps ────────────────────────────────────────────────────────────
    describe('Timestamps', () => {
        it('should auto-generate createdAt and updatedAt', async () => {
            const user = await User.create(validUser);
            expect(user.createdAt).toBeInstanceOf(Date);
            expect(user.updatedAt).toBeInstanceOf(Date);
        });
    });
});
