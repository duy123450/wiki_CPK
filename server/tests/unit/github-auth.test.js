const User = require('../../modules/auth/user.model');

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';
process.env.NODE_ENV = 'test';

const { githubLoginUser } = require('../../modules/auth/auth.service');

const buildMockProfile = (overrides = {}) => ({
    id: 'github-uid-123456',
    displayName: 'GitHub User',
    username: 'githubuser',
    emails: [{ value: 'githubuser@example.com' }],
    photos: [{ value: 'https://avatars.githubusercontent.com/u/123456' }],
    ...overrides,
});

describe('githubLoginUser()', () => {
    describe('input validation', () => {
        it('should throw 400 when profile is missing', async () => {
            await expect(githubLoginUser(undefined))
                .rejects
                .toThrow('GitHub profile is required');
        });
    });

    describe('new user (no existing account)', () => {
        it('should create a new user and return auth tokens', async () => {
            const result = await githubLoginUser(buildMockProfile());

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user.email).toBe('githubuser@example.com');
            expect(result.user).toHaveProperty('id');
            expect(result.user.role).toBe('user');
        });

        it('should auto-generate a username from GitHub username', async () => {
            const result = await githubLoginUser(buildMockProfile({ username: 'johndoe', displayName: null }));

            expect(result.user.username).toMatch(/^johndoe_/);
        });

        it('should set avatar from GitHub profile photo', async () => {
            const result = await githubLoginUser(buildMockProfile());

            expect(result.user.avatar.url).toBe('https://avatars.githubusercontent.com/u/123456');
            expect(result.user.avatar.public_id).toBe('github-avatar');
        });

        it('should store githubId on the new user', async () => {
            await githubLoginUser(buildMockProfile());

            const dbUser = await User.findOne({ email: 'githubuser@example.com' });
            expect(dbUser.githubId).toBe('github-uid-123456');
            expect(dbUser.password).toBeUndefined();
        });

        it('should fallback to generated email if profile has no email', async () => {
            const result = await githubLoginUser(buildMockProfile({ emails: [] }));

            expect(result.user.email).toBe('githubuser_github-uid-123456@github.local');
        });
    });

    describe('existing user (matched by githubId)', () => {
        it('should return the existing user without creating a duplicate', async () => {
            await User.create({
                username: 'existing_github_3456',
                email: 'githubuser@example.com',
                githubId: 'github-uid-123456',
                avatar: { url: 'https://old-avatar.jpg', public_id: 'old' },
            });

            const result = await githubLoginUser(buildMockProfile());

            expect(result.user.email).toBe('githubuser@example.com');
            expect(result.user.username).toBe('existing_github_3456');

            const count = await User.countDocuments({ email: 'githubuser@example.com' });
            expect(count).toBe(1);
        });
    });

    describe('account linking (existing email user)', () => {
        it('should throw 409 if email is already taken by another method', async () => {
            await User.create({
                username: 'emailuser',
                email: 'githubuser@example.com',
                password: 'password123',
            });

            await expect(githubLoginUser(buildMockProfile()))
                .rejects
                .toHaveProperty('message', 'email_taken_other_method');
        });
    });
});
