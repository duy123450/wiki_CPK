const request = require('supertest');
const passport = require('../../config/passport');
const User = require('../../modules/auth/user.model');

process.env.NODE_ENV = 'test';
process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';
process.env.DISCORD_CLIENT_ID = 'test-discord-id';
process.env.DISCORD_CLIENT_SECRET = 'test-discord-secret';
process.env.FRONTEND_URL = 'http://localhost:5173';

let app;
let mockPassportError = null;
let mockPassportUser = null;

beforeAll(async () => {
    // Spy on passport.authenticate
    jest.spyOn(passport, 'authenticate').mockImplementation((strategy, callback) => {
      if (typeof callback === 'function') {
        return (req, res, next) => {
          if (mockPassportError) return callback(mockPassportError, null);
          if (mockPassportUser) return callback(null, mockPassportUser);
          return callback(null, { _id: 'mock-id', username: 'mock-user' });
        };
      }
      return (req, res, next) => {
        if (strategy === 'discord') {
          return res.redirect('https://discord.com/oauth2/authorize');
        }
        next();
      };
    });
    
    app = require('../../server');
});

afterEach(async () => {
    mockPassportError = null;
    mockPassportUser = null;
});

afterAll(async () => {
    jest.restoreAllMocks();
});

describe('Discord OAuth Integration', () => {
    describe('GET /auth/discord', () => {
        it('redirects to Discord authorization page', async () => {
            const res = await request(app).get('/api/v1/wiki/auth/discord');
            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('discord.com');
        });
    });

    describe('GET /auth/discord/callback', () => {
        it('redirects to frontend with tokens on success', async () => {
            mockPassportUser = await User.create({
              username: 'discord_user_1234',
              email: 'discord@example.com',
              discordId: '12345'
            });

            const res = await request(app)
                .get('/api/v1/wiki/auth/discord/callback');

            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('accessToken=');
            expect(res.headers.location).toContain('user=');
        });

        it('redirects with social_conflict if email conflict occurs', async () => {
            mockPassportError = new Error('email_taken_other_method');

            const res = await request(app)
                .get('/api/v1/wiki/auth/discord/callback');

            expect(res.status).toBe(302);
            expect(res.headers.location).toBe('http://localhost:5173/auth?error=social_conflict');
        });

        it('redirects with generic error on other failures', async () => {
            mockPassportError = new Error('Some random error');

            const res = await request(app)
                .get('/api/v1/wiki/auth/discord/callback');

            expect(res.status).toBe(302);
            expect(res.headers.location).toContain('discordError=1');
            expect(res.headers.location).toContain('msg=Some%20random%20error');
        });
    });
});
