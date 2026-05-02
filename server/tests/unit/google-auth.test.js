/**
 * Unit tests for googleLoginUser() in auth.service.js
 *
 * Google's verifyIdToken and Mongoose are mocked to test the
 * find-or-create logic, account linking, and error handling
 * in complete isolation.
 */
const { connect, clearDatabase, disconnect } = require('../setup');
const User = require('../../models/user.model');

// We need to mock google-auth-library BEFORE requiring the service
jest.mock('google-auth-library', () => {
    const mockVerifyIdToken = jest.fn();
    return {
        OAuth2Client: jest.fn().mockImplementation(() => ({
            verifyIdToken: mockVerifyIdToken,
        })),
        __mockVerifyIdToken: mockVerifyIdToken,
    };
});

const { __mockVerifyIdToken: mockVerifyIdToken } = require('google-auth-library');

// Set env before requiring the service
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.JWT_LIFETIME = '1h';
process.env.NODE_ENV = 'test';

const { googleLoginUser } = require('../../services/auth.service');

// ── Helper: build a mock Google ticket ────────────────────────────────────────
const buildMockTicket = (overrides = {}) => ({
    getPayload: () => ({
        sub: 'google-uid-123456',
        email: 'googleuser@gmail.com',
        name: 'Google User',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        ...overrides,
    }),
});

beforeAll(async () => {
    await connect();
});

afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
});

afterAll(async () => {
    await disconnect();
});

describe('googleLoginUser()', () => {
    // ── Validation ────────────────────────────────────────────────────────────
    describe('input validation', () => {
        it('should throw 400 when credential is missing', async () => {
            await expect(googleLoginUser(undefined))
                .rejects
                .toThrow('Google credential is required');
        });

        it('should throw 400 when credential is empty string', async () => {
            await expect(googleLoginUser(''))
                .rejects
                .toThrow('Google credential is required');
        });
    });

    // ── New user creation ─────────────────────────────────────────────────────
    describe('new user (no existing account)', () => {
        it('should create a new user and return { user, token }', async () => {
            mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

            const result = await googleLoginUser('valid-google-jwt');

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('token');
            expect(result.user.email).toBe('googleuser@gmail.com');
            expect(result.user).toHaveProperty('id');
            expect(result.user.role).toBe('user');
        });

        it('should auto-generate a username from Google name', async () => {
            mockVerifyIdToken.mockResolvedValueOnce(
                buildMockTicket({ name: 'John Doe' })
            );

            const result = await googleLoginUser('valid-google-jwt');

            // Username should be "John_Doe_XXXX" pattern (name + last 4 of googleId)
            expect(result.user.username).toMatch(/^John_Doe_/);
        });

        it('should set avatar from Google profile picture', async () => {
            mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

            const result = await googleLoginUser('valid-google-jwt');

            expect(result.user.avatar.url).toBe('https://lh3.googleusercontent.com/photo.jpg');
            expect(result.user.avatar.public_id).toBe('google-avatar');
        });

        it('should store googleId on the new user', async () => {
            mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

            await googleLoginUser('valid-google-jwt');

            const dbUser = await User.findOne({ email: 'googleuser@gmail.com' });
            expect(dbUser.googleId).toBe('google-uid-123456');
            expect(dbUser.password).toBeUndefined();
        });

        it('should call verifyIdToken with correct params', async () => {
            mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

            await googleLoginUser('my-credential-jwt');

            expect(mockVerifyIdToken).toHaveBeenCalledWith({
                idToken: 'my-credential-jwt',
                audience: 'test-google-client-id',
            });
        });
    });

    // ── Existing user by googleId ─────────────────────────────────────────────
    describe('existing user (matched by googleId)', () => {
        it('should return the existing user without creating a duplicate', async () => {
            // Pre-create a Google user
            await User.create({
                username: 'existing_google_3456',
                email: 'googleuser@gmail.com',
                googleId: 'google-uid-123456',
                avatar: { url: 'https://old-avatar.jpg', public_id: 'old' },
            });

            mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

            const result = await googleLoginUser('valid-google-jwt');

            expect(result.user.email).toBe('googleuser@gmail.com');
            expect(result.user.username).toBe('existing_google_3456');

            // Should NOT have created a second user
            const count = await User.countDocuments({ email: 'googleuser@gmail.com' });
            expect(count).toBe(1);
        });
    });

    // ── Account linking (existing email, no googleId) ─────────────────────────
    describe('account linking (existing email user)', () => {
        it('should link googleId to an existing email/password user', async () => {
            // Pre-create an email/password user
            await User.create({
                username: 'emailuser',
                email: 'googleuser@gmail.com',
                password: 'password123',
            });

            mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

            const result = await googleLoginUser('valid-google-jwt');

            expect(result.user.email).toBe('googleuser@gmail.com');
            expect(result.user.username).toBe('emailuser'); // keeps original username

            // googleId should now be linked
            const dbUser = await User.findOne({ email: 'googleuser@gmail.com' });
            expect(dbUser.googleId).toBe('google-uid-123456');

            // Only one user in the DB
            const count = await User.countDocuments({ email: 'googleuser@gmail.com' });
            expect(count).toBe(1);
        });
    });

    // ── Token verification failure ────────────────────────────────────────────
    describe('Google token verification failure', () => {
        it('should throw when Google rejects the token', async () => {
            mockVerifyIdToken.mockRejectedValueOnce(new Error('Token used too late'));

            await expect(googleLoginUser('expired-token'))
                .rejects
                .toThrow('Token used too late');
        });
    });
});
