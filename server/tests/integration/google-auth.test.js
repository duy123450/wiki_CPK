const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';
process.env.GOOGLE_CLIENT_ID = 'test-google-client-id';
process.env.GOOGLE_CLIENT_SECRET = 'test-google-client-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

let app;

beforeAll(async () => {
    app = require('../../server');
});

describe('GET /auth/google', () => {
    it('redirects to Google OAuth through Passport', async () => {
        const res = await request(app).get('/api/v1/wiki/auth/google');

        expect(res.status).toBe(302);
        expect(res.headers.location).toContain('accounts.google.com');
        expect(res.headers.location).toContain('test-google-client-id');
    });
});
