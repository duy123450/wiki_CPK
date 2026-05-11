const request = require('supertest');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';
process.env.X_LOCAL_CLIENT_ID = 'test-twitter-client-id';
process.env.X_LOCAL_CLIENT_SECRET = 'test-twitter-client-secret';
process.env.X_LOCAL_CALLBACK_URL = 'http://127.0.0.1:3000/api/v1/wiki/auth/twitter/callback';
process.env.FRONTEND_URL = 'http://localhost:5173';

let app;

beforeAll(async () => {
    app = require('../../server');
});

describe('Twitter OAuth Routes', () => {
    describe('GET /auth/x', () => {
        it('should redirect to Twitter OAuth when credentials are configured', async () => {
            const res = await request(app).get('/api/v1/wiki/auth/x');

            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('twitter.com');
        });

        it('should return 500 when Twitter credentials are missing', async () => {
            // Temporarily remove env vars
            const savedId = process.env.X_LOCAL_CLIENT_ID;
            const savedSecret = process.env.X_LOCAL_CLIENT_SECRET;
            delete process.env.X_LOCAL_CLIENT_ID;
            delete process.env.X_LOCAL_CLIENT_SECRET;

            try {
                const res = await request(app).get('/api/v1/wiki/auth/x');
                expect(res.status).toBe(500);
                expect(res.body.msg).toContain('Twitter OAuth is not configured');
            } finally {
                // Restore env vars
                process.env.X_LOCAL_CLIENT_ID = savedId;
                process.env.X_LOCAL_CLIENT_SECRET = savedSecret;
            }
        });
    });

    describe('GET /auth/x/callback', () => {
        it('should return 500 when Twitter credentials are missing', async () => {
            const savedId = process.env.X_LOCAL_CLIENT_ID;
            const savedSecret = process.env.X_LOCAL_CLIENT_SECRET;
            delete process.env.X_LOCAL_CLIENT_ID;
            delete process.env.X_LOCAL_CLIENT_SECRET;

            try {
                const res = await request(app)
                    .get('/api/v1/wiki/auth/x/callback')
                    .query({ code: 'test-code', state: 'test-state' });

                expect(res.status).toBe(500);
                expect(res.body.msg).toContain('Twitter OAuth is not configured');
            } finally {
                process.env.X_LOCAL_CLIENT_ID = savedId;
                process.env.X_LOCAL_CLIENT_SECRET = savedSecret;
            }
        });
    });
});
