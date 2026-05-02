/**
 * Integration tests for POST /api/v1/wiki/auth/google
 *
 * Uses supertest against the real Express app + in-memory MongoDB.
 * Google's verifyIdToken is mocked at the module level so we can
 * test the full request lifecycle without hitting Google's servers.
 */
const request = require('supertest');
const { connect, clearDatabase, disconnect } = require('../setup');
const User = require('../../models/user.model');

// Must set env before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key-for-jest';
process.env.JWT_LIFETIME = '1h';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';

// Mock google-auth-library
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

let app;

beforeAll(async () => {
    await connect();
    app = require('../../server');
});

afterEach(async () => {
    await clearDatabase();
    jest.clearAllMocks();
});

afterAll(async () => {
    await disconnect();
});

const BASE = '/api/v1/wiki/auth';

// ── Helper: build a mock Google ticket ────────────────────────────────────────
const buildMockTicket = (overrides = {}) => ({
    getPayload: () => ({
        sub: 'google-uid-999',
        email: 'integration@gmail.com',
        name: 'Integration User',
        picture: 'https://lh3.googleusercontent.com/photo.jpg',
        ...overrides,
    }),
});

describe('POST /auth/google — Integration', () => {
    // ── Success: new user ─────────────────────────────────────────────────────
    it('should create a new user and return 200 with { user, token }', async () => {
        mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

        const res = await request(app)
            .post(`${BASE}/google`)
            .send({ credential: 'valid-google-jwt' });

        expect(res.status).toBe(200);
        expect(res.body).toHaveProperty('user');
        expect(res.body).toHaveProperty('token');
        expect(res.body.user.email).toBe('integration@gmail.com');
        expect(res.body.user.role).toBe('user');
        expect(res.body.user).not.toHaveProperty('password');
    });

    // ── Success: returning user ───────────────────────────────────────────────
    it('should return existing user on second Google login', async () => {
        mockVerifyIdToken.mockResolvedValue(buildMockTicket());

        // First login — creates user
        await request(app)
            .post(`${BASE}/google`)
            .send({ credential: 'valid-google-jwt' });

        // Second login — same user
        const res = await request(app)
            .post(`${BASE}/google`)
            .send({ credential: 'valid-google-jwt' });

        expect(res.status).toBe(200);
        expect(res.body.user.email).toBe('integration@gmail.com');

        // Only one user should exist
        const count = await User.countDocuments({ email: 'integration@gmail.com' });
        expect(count).toBe(1);
    });

    // ── Success: account linking ──────────────────────────────────────────────
    it('should link Google ID to existing email/password account', async () => {
        // Pre-create an email/password user
        await request(app)
            .post(`${BASE}/register`)
            .send({
                username: 'existinguser',
                email: 'integration@gmail.com',
                password: 'password123',
            });

        mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

        const res = await request(app)
            .post(`${BASE}/google`)
            .send({ credential: 'valid-google-jwt' });

        expect(res.status).toBe(200);
        expect(res.body.user.username).toBe('existinguser'); // keeps original name
        expect(res.body.user.email).toBe('integration@gmail.com');

        // Verify googleId was linked in DB
        const dbUser = await User.findOne({ email: 'integration@gmail.com' });
        expect(dbUser.googleId).toBe('google-uid-999');
    });

    // ── Failure: missing credential ───────────────────────────────────────────
    it('should return 400 when credential is missing', async () => {
        const res = await request(app)
            .post(`${BASE}/google`)
            .send({});

        expect(res.status).toBe(400);
        expect(res.body.msg).toMatch(/credential/i);
    });

    // ── Failure: invalid/expired token ────────────────────────────────────────
    it('should return 500 when Google rejects the token', async () => {
        mockVerifyIdToken.mockRejectedValueOnce(new Error('Token used too late'));

        const res = await request(app)
            .post(`${BASE}/google`)
            .send({ credential: 'expired-token' });

        expect(res.status).toBe(500);
    });

    // ── Authenticated flow: token from Google login works with /me ─────────
    it('should return a valid JWT that works with GET /me', async () => {
        mockVerifyIdToken.mockResolvedValueOnce(buildMockTicket());

        const loginRes = await request(app)
            .post(`${BASE}/google`)
            .send({ credential: 'valid-google-jwt' });

        const token = loginRes.body.token;
        expect(token).toBeDefined();

        const meRes = await request(app)
            .get(`${BASE}/me`)
            .set('Authorization', `Bearer ${token}`);

        expect(meRes.status).toBe(200);
        expect(meRes.body.user.email).toBe('integration@gmail.com');
    });
});
