const request = require('supertest');
const { connect, clearDatabase, disconnect } = require('../setup');

// Must set env before requiring app
process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';

let app;

beforeAll(async () => {
    await connect();
    app = require('../../server');
});

afterEach(async () => {
    await clearDatabase();
});

afterAll(async () => {
    await disconnect();
});

const BASE = '/api/v1/wiki/auth';

const validUser = {
    username: 'testuser',
    email: 'test@example.com',
    password: 'password123',
};

// ─── Helper: register & get token ────────────────────────────────────────────
const registerAndGetToken = async (user = validUser) => {
    const res = await request(app).post(`${BASE}/register`).send(user);
    return res.body.token;
};

describe('Auth API Integration Tests', () => {
    // ── REGISTER ──────────────────────────────────────────────────────────────
    describe('POST /register', () => {
        it('should register a new user, return an access token, and set refresh cookie', async () => {
            const res = await request(app)
                .post(`${BASE}/register`)
                .send(validUser);

            expect(res.status).toBe(201);
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('token', res.body.accessToken);
            expect(res.body).not.toHaveProperty('refreshToken');
            expect(res.headers['set-cookie']?.join(';')).toContain('refreshToken=');
            expect(res.body.user.username).toBe('testuser');
            expect(res.body.user.email).toBe('test@example.com');
            expect(res.body.user.role).toBe('user');
            expect(res.body.user).not.toHaveProperty('password');
        });

        it('should reject duplicate email', async () => {
            await request(app).post(`${BASE}/register`).send(validUser);

            const res = await request(app)
                .post(`${BASE}/register`)
                .send({ ...validUser, username: 'different' });

            expect(res.status).toBe(400);
        });

        it('should reject duplicate username', async () => {
            await request(app).post(`${BASE}/register`).send(validUser);

            const res = await request(app)
                .post(`${BASE}/register`)
                .send({ ...validUser, email: 'different@email.com' });

            expect(res.status).toBe(400);
        });

        it('should reject when username is missing', async () => {
            const res = await request(app)
                .post(`${BASE}/register`)
                .send({ email: 'a@b.com', password: '123456' });

            expect(res.status).toBe(400);
        });

        it('should reject when email is missing', async () => {
            const res = await request(app)
                .post(`${BASE}/register`)
                .send({ username: 'user1', password: '123456' });

            expect(res.status).toBe(400);
        });

        it('should reject when password is missing', async () => {
            const res = await request(app)
                .post(`${BASE}/register`)
                .send({ username: 'user1', email: 'a@b.com' });

            expect(res.status).toBe(400);
        });
    });

    // ── LOGIN ─────────────────────────────────────────────────────────────────
    describe('POST /login', () => {
        beforeEach(async () => {
            await request(app).post(`${BASE}/register`).send(validUser);
        });

        it('should login with email', async () => {
            const res = await request(app)
                .post(`${BASE}/login`)
                .send({ identifier: validUser.email, password: validUser.password });

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('token', res.body.accessToken);
            expect(res.body).not.toHaveProperty('refreshToken');
            expect(res.headers['set-cookie']?.join(';')).toContain('refreshToken=');
            expect(res.body.user.email).toBe(validUser.email);
        });

        it('should login with username', async () => {
            const res = await request(app)
                .post(`${BASE}/login`)
                .send({ identifier: validUser.username, password: validUser.password });

            expect(res.status).toBe(200);
            expect(res.body.user.username).toBe(validUser.username);
        });

        it('should reject wrong password', async () => {
            const res = await request(app)
                .post(`${BASE}/login`)
                .send({ identifier: validUser.email, password: 'wrongpassword' });

            expect(res.status).toBe(401);
        });

        it('should reject non-existent user', async () => {
            const res = await request(app)
                .post(`${BASE}/login`)
                .send({ identifier: 'nobody@nowhere.com', password: 'anything' });

            expect(res.status).toBe(401);
        });

        it('should reject when identifier is missing', async () => {
            const res = await request(app)
                .post(`${BASE}/login`)
                .send({ password: validUser.password });

            expect(res.status).toBe(400);
        });
    });

    // ── GET /me ───────────────────────────────────────────────────────────────
    describe('POST /refresh', () => {
        it('should issue a new access token from a valid refresh cookie', async () => {
            const registerRes = await request(app)
                .post(`${BASE}/register`)
                .send(validUser);
            const refreshCookie = registerRes.headers['set-cookie'].find((cookie) =>
                cookie.startsWith('refreshToken=')
            );

            const res = await request(app)
                .post(`${BASE}/refresh`)
                .set('Cookie', refreshCookie);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).toHaveProperty('token', res.body.accessToken);
            expect(res.body).not.toHaveProperty('refreshToken');
            expect(res.body.user.email).toBe(validUser.email);
        });

        it('should reject when refresh cookie is missing', async () => {
            const res = await request(app).post(`${BASE}/refresh`);

            expect(res.status).toBe(401);
        });
    });

    describe('GET /me', () => {
        it('should return the current user when authenticated', async () => {
            const token = await registerAndGetToken();

            const res = await request(app)
                .get(`${BASE}/me`)
                .set('Authorization', `Bearer ${token}`);

            expect(res.status).toBe(200);
            expect(res.body).toHaveProperty('user');
            expect(res.body.user.username).toBe(validUser.username);
            expect(res.body.user.email).toBe(validUser.email);
        });

        it('should return 401 without a token', async () => {
            const res = await request(app).get(`${BASE}/me`);

            expect(res.status).toBe(401);
        });

        it('should return 401 with an invalid token', async () => {
            const res = await request(app)
                .get(`${BASE}/me`)
                .set('Authorization', 'Bearer invalid.token.here');

            expect(res.status).toBe(401);
        });
    });

    // ── PUT /profile ──────────────────────────────────────────────────────────
    describe('PUT /profile', () => {
        let token;

        beforeEach(async () => {
            token = await registerAndGetToken();
        });

        it('should update username', async () => {
            const res = await request(app)
                .put(`${BASE}/profile`)
                .set('Authorization', `Bearer ${token}`)
                .send({ username: 'newusername' });

            expect(res.status).toBe(200);
            expect(res.body.user.username).toBe('newusername');
            expect(res.body).toHaveProperty('accessToken');
            expect(res.body).not.toHaveProperty('refreshToken');
        });

        it('should update email', async () => {
            const res = await request(app)
                .put(`${BASE}/profile`)
                .set('Authorization', `Bearer ${token}`)
                .send({ email: 'new@email.com' });

            expect(res.status).toBe(200);
            expect(res.body.user.email).toBe('new@email.com');
        });

        it('should change password when currentPassword is correct', async () => {
            const res = await request(app)
                .put(`${BASE}/profile`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: validUser.password,
                    newPassword: 'newsecure123',
                });

            expect(res.status).toBe(200);

            // Verify new password works
            const loginRes = await request(app)
                .post(`${BASE}/login`)
                .send({ identifier: validUser.email, password: 'newsecure123' });

            expect(loginRes.status).toBe(200);
        });

        it('should reject password change with wrong current password', async () => {
            const res = await request(app)
                .put(`${BASE}/profile`)
                .set('Authorization', `Bearer ${token}`)
                .send({
                    currentPassword: 'wrongcurrent',
                    newPassword: 'newsecure123',
                });

            expect(res.status).toBe(401);
        });

        it('should reject password change without providing current password', async () => {
            const res = await request(app)
                .put(`${BASE}/profile`)
                .set('Authorization', `Bearer ${token}`)
                .send({ newPassword: 'newsecure123' });

            expect(res.status).toBe(400);
        });

        it('should reject duplicate username on profile update', async () => {
            // Register a second user
            await request(app).post(`${BASE}/register`).send({
                username: 'otheruser',
                email: 'other@example.com',
                password: 'password123',
            });

            const res = await request(app)
                .put(`${BASE}/profile`)
                .set('Authorization', `Bearer ${token}`)
                .send({ username: 'otheruser' });

            expect(res.status).toBe(400);
        });

        it('should return 401 without authentication', async () => {
            const res = await request(app)
                .put(`${BASE}/profile`)
                .send({ username: 'hacker' });

            expect(res.status).toBe(401);
        });
    });
});
