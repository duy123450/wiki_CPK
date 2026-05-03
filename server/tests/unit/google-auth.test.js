const { connect, clearDatabase, disconnect } = require('../setup');
const User = require('../../models/user.model');

process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.JWT_LIFETIME = '1h';
process.env.NODE_ENV = 'test';

const { googleLoginUser } = require('../../services/auth.service');

const buildMockProfile = (overrides = {}) => ({
    id: 'google-uid-123456',
    displayName: 'Google User',
    emails: [{ value: 'googleuser@gmail.com' }],
    photos: [{ value: 'https://lh3.googleusercontent.com/photo.jpg' }],
    ...overrides,
});

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await disconnect();
});

describe('googleLoginUser()', () => {
    describe('input validation', () => {
        it('should throw 400 when profile is missing', async () => {
            await expect(googleLoginUser(undefined))
                .rejects
                .toThrow('Google profile is required');
        });

        it('should throw 400 when profile email is missing', async () => {
            await expect(googleLoginUser(buildMockProfile({ emails: [] })))
                .rejects
                .toThrow('Google account email is required');
        });
    });

    describe('new user (no existing account)', () => {
        it('should create a new user and return { user, token }', async () => {
            const result = await googleLoginUser(buildMockProfile());

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe('googleuser@gmail.com');
            expect(result.user).toHaveProperty('id');
            expect(result.user.role).toBe('user');
        });

        it('should auto-generate a username from Google displayName', async () => {
            const result = await googleLoginUser(buildMockProfile({ displayName: 'John Doe' }));

            expect(result.user.username).toMatch(/^John_Doe_/);
        });

        it('should set avatar from Google profile photo', async () => {
            const result = await googleLoginUser(buildMockProfile());

            expect(result.user.avatar.url).toBe('https://lh3.googleusercontent.com/photo.jpg');
            expect(result.user.avatar.public_id).toBe('google-avatar');
        });

        it('should store googleId on the new user', async () => {
            await googleLoginUser(buildMockProfile());

            const dbUser = await User.findOne({ email: 'googleuser@gmail.com' });
            expect(dbUser.googleId).toBe('google-uid-123456');
            expect(dbUser.password).toBeUndefined();
        });
    });

    describe('existing user (matched by googleId)', () => {
        it('should return the existing user without creating a duplicate', async () => {
            await User.create({
                username: 'existing_google_3456',
                email: 'googleuser@gmail.com',
                googleId: 'google-uid-123456',
                avatar: { url: 'https://old-avatar.jpg', public_id: 'old' },
            });

            const result = await googleLoginUser(buildMockProfile());

            expect(result.user.email).toBe('googleuser@gmail.com');
            expect(result.user.username).toBe('existing_google_3456');

            const count = await User.countDocuments({ email: 'googleuser@gmail.com' });
            expect(count).toBe(1);
        });
    });

    describe('account linking (existing email user)', () => {
        it('should link googleId to an existing email/password user', async () => {
            await User.create({
                username: 'emailuser',
                email: 'googleuser@gmail.com',
                password: 'password123',
            });

            const result = await googleLoginUser(buildMockProfile());

            expect(result.user.email).toBe('googleuser@gmail.com');
            expect(result.user.username).toBe('emailuser');

            const dbUser = await User.findOne({ email: 'googleuser@gmail.com' });
            expect(dbUser.googleId).toBe('google-uid-123456');

            const count = await User.countDocuments({ email: 'googleuser@gmail.com' });
            expect(count).toBe(1);
        });
    });
});
