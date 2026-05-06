const { connect, clearDatabase, disconnect } = require('../setup');
const User = require('../../models/user.model');

process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
process.env.JWT_ACCESS_LIFETIME = '15m';
process.env.JWT_REFRESH_LIFETIME = '30d';
process.env.NODE_ENV = 'test';

const { twitterLoginUser } = require('../../services/auth.service');

const buildMockTwitterProfile = (overrides = {}) => ({
    id: 'twitter-uid-987654',
    displayName: 'Twitter User',
    username: 'twitteruser',
    photos: [{ value: 'https://pbs.twimg.com/profile_images/photo.jpg' }],
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

describe('twitterLoginUser()', () => {
    describe('input validation', () => {
        it('should throw 400 when profile is missing', async () => {
            await expect(twitterLoginUser(undefined))
                .rejects
                .toThrow('Twitter profile is required');
        });

        it('should throw 400 when profile id is missing', async () => {
            await expect(twitterLoginUser({ displayName: 'User', username: 'user' }))
                .rejects
                .toThrow('Twitter profile is required');
        });
    });

    describe('new user (no existing account)', () => {
        it('should create a new user and return auth tokens', async () => {
            const result = await twitterLoginUser(buildMockTwitterProfile());

            expect(result).toHaveProperty('user');
            expect(result).toHaveProperty('accessToken');
            expect(result).toHaveProperty('token');
            expect(result).toHaveProperty('refreshToken');
            expect(result.user).toHaveProperty('id');
            expect(result.user.role).toBe('user');
        });

        it('should auto-generate a username from Twitter displayName', async () => {
            const result = await twitterLoginUser(buildMockTwitterProfile({ displayName: 'John Doe' }));

            expect(result.user.username).toMatch(/^John_Doe_/);
        });

        it('should normalize diacritics in displayName to generate username', async () => {
            const result = await twitterLoginUser(buildMockTwitterProfile({ displayName: 'Phạm Đăng' }));

            expect(result.user.username).toMatch(/^Pham_Dang_/);
        });

        it('should use Twitter username if displayName not provided', async () => {
            const result = await twitterLoginUser(buildMockTwitterProfile({ displayName: undefined, username: 'xuser123' }));

            expect(result.user.username).toMatch(/^xuser123_/);
        });

        it('should set avatar from Twitter profile photo', async () => {
            const result = await twitterLoginUser(buildMockTwitterProfile());

            expect(result.user.avatar.url).toBe('https://pbs.twimg.com/profile_images/photo.jpg');
            expect(result.user.avatar.public_id).toBe('twitter-avatar');
        });

        it('should generate email from username and xId', async () => {
            const profile = buildMockTwitterProfile({ displayName: 'Jane', id: '12345' });
            const result = await twitterLoginUser(profile);

            expect(result.user.email).toBe('jane_12345@twitter.local');
        });

        it('should store xId on the new user', async () => {
            await twitterLoginUser(buildMockTwitterProfile());

            const dbUser = await User.findOne({ xId: 'twitter-uid-987654' });
            expect(dbUser).toBeDefined();
            expect(dbUser.xId).toBe('twitter-uid-987654');
            expect(dbUser.password).toBeUndefined();
        });

        it('should not require password for Twitter-only users', async () => {
            await twitterLoginUser(buildMockTwitterProfile());

            const dbUser = await User.findOne({ xId: 'twitter-uid-987654' });
            expect(dbUser.password).toBeUndefined();
        });
    });

    describe('existing user (matched by xId)', () => {
        it('should return the existing user without creating a duplicate', async () => {
            await User.create({
                username: 'existing_twitter',
                email: 'existing@twitter.local',
                xId: 'twitter-uid-987654',
                avatar: { url: 'https://old-avatar.jpg', public_id: 'old' },
            });

            const result = await twitterLoginUser(buildMockTwitterProfile());

            expect(result.user.username).toBe('existing_twitter');

            const count = await User.countDocuments({ xId: 'twitter-uid-987654' });
            expect(count).toBe(1);
        });

        it('should preserve existing user data on re-login', async () => {
            const user = await User.create({
                username: 'existing_twitter',
                email: 'existing@twitter.local',
                xId: 'twitter-uid-987654',
            });

            const result = await twitterLoginUser(buildMockTwitterProfile());

            expect(result.user.id.toString()).toBe(user._id.toString());
            expect(result.user.username).toBe('existing_twitter');
        });
    });

    describe('avatar handling', () => {
        it('should use default avatar if profile photo is missing', async () => {
            const result = await twitterLoginUser(buildMockTwitterProfile({ photos: [] }));

            expect(result.user.avatar.public_id).toBe('twitter-avatar');
        });

        it('should truncate long display names in username', async () => {
            const longName = 'Very Long Display Name That Should Be Truncated';
            const result = await twitterLoginUser(buildMockTwitterProfile({ displayName: longName }));

            expect(result.user.username.length).toBeLessThanOrEqual(20);
        });
    });

    describe('email generation', () => {
        it('should generate unique email per xId', async () => {
            const result1 = await twitterLoginUser(buildMockTwitterProfile({ id: 'id-1', username: 'user1' }));
            const result2 = await twitterLoginUser(buildMockTwitterProfile({ id: 'id-2', username: 'user2' }));

            expect(result1.user.email).not.toBe(result2.user.email);
        });
    });
});
