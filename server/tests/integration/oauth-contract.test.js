/**
 * OAuth Data Model Tests
 * Focuses on User model validation with OAuth IDs
 * Does not test actual OAuth flows (covered by E2E tests)
 */

const User = require('../../modules/auth/user.model');

describe('OAuth Contract Tests', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
    });

    describe('OAuth User Creation', () => {
        it('should create Google OAuth user without password', async () => {
            const user = await User.create({
                username: 'googleuser',
                email: 'google@example.com',
                googleId: 'google_123',
            });

            expect(user._id).toBeDefined();
            expect(user.googleId).toBe('google_123');
            expect(user.username).toBe('googleuser');
        });

        it('should create Discord OAuth user without password', async () => {
            const user = await User.create({
                username: 'discorduser',
                email: 'discord@example.com',
                discordId: 'discord_456',
            });

            expect(user._id).toBeDefined();
            expect(user.discordId).toBe('discord_456');
        });

        it('should create X/Twitter OAuth user without password', async () => {
            const user = await User.create({
                username: 'xuser',
                email: 'x@example.com',
                xId: 'x_789',
            });

            expect(user._id).toBeDefined();
            expect(user.xId).toBe('x_789');
        });

        it('should create GitHub OAuth user without password', async () => {
            const user = await User.create({
                username: 'githubuser',
                email: 'github@example.com',
                githubId: 'github_999',
            });

            expect(user._id).toBeDefined();
            expect(user.githubId).toBe('github_999');
        });

        it('should fail if OAuth user missing username/email', async () => {
            await expect(
                User.create({ googleId: 'google_123' })
            ).rejects.toThrow();
        });

        it('should prevent duplicate OAuth IDs', async () => {
            await User.create({
                username: 'user1',
                email: 'user1@example.com',
                googleId: 'google_123',
            });

            await expect(
                User.create({
                    username: 'user2',
                    email: 'user2@example.com',
                    googleId: 'google_123',
                })
            ).rejects.toThrow();
        });

        it('should enforce unique emails', async () => {
            await User.create({
                username: 'user1',
                email: 'shared@example.com',
                googleId: 'google_123',
            });

            await expect(
                User.create({
                    username: 'user2',
                    email: 'shared@example.com',
                    discordId: 'discord_456',
                })
            ).rejects.toThrow();
        });

        it('should enforce unique usernames', async () => {
            await User.create({
                username: 'sameuser',
                email: 'email1@example.com',
                googleId: 'google_123',
            });

            await expect(
                User.create({
                    username: 'sameuser',
                    email: 'email2@example.com',
                    discordId: 'discord_456',
                })
            ).rejects.toThrow();
        });
    });

    describe('OAuth User Properties', () => {
        it('should support multiple OAuth providers (linking)', async () => {
            const user = await User.create({
                username: 'linkeduser',
                email: 'linked@example.com',
                googleId: 'google_123',
            });

            user.discordId = 'discord_456';
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.googleId).toBe('google_123');
            expect(updated.discordId).toBe('discord_456');
        });

        it('should support custom avatar for OAuth users', async () => {
            const user = await User.create({
                username: 'avataruser',
                email: 'avatar@example.com',
                googleId: 'google_123',
                avatar: {
                    url: 'https://example.com/avatar.jpg',
                    public_id: 'custom_avatar',
                },
            });

            expect(user.avatar.url).toBe('https://example.com/avatar.jpg');
        });

        it('should update refresh token for OAuth users', async () => {
            const user = await User.create({
                username: 'tokenuser',
                email: 'token@example.com',
                googleId: 'google_123',
            });

            user.refreshToken = 'refresh_token_xyz';
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.refreshToken).toBe('refresh_token_xyz');
        });

        it('should have default avatar if not specified', async () => {
            const user = await User.create({
                username: 'defaultavatar',
                email: 'default@example.com',
                googleId: 'google_123',
            });

            expect(user.avatar).toBeDefined();
            expect(user.avatar.url).toContain('placeholder');
        });
    });

    describe('OAuth User Validation', () => {
        it('should reject invalid email format', async () => {
            await expect(
                User.create({
                    username: 'baduser',
                    email: 'invalid-email',
                    googleId: 'google_123',
                })
            ).rejects.toThrow();
        });

        it('should reject username too short', async () => {
            await expect(
                User.create({
                    username: 'ab',
                    email: 'short@example.com',
                    googleId: 'google_123',
                })
            ).rejects.toThrow();
        });

        it('should reject username too long', async () => {
            await expect(
                User.create({
                    username: 'a'.repeat(25),
                    email: 'long@example.com',
                    googleId: 'google_123',
                })
            ).rejects.toThrow();
        });

        it('should reject OAuth user with password requirement error', async () => {
            // Explicitly try to create OAuth user without any OAuth ID
            await expect(
                User.create({
                    username: 'noauth',
                    email: 'noauth@example.com',
                    // No OAuth ID and no password
                })
            ).rejects.toThrow();
        });
    });

    describe('OAuth User Queries', () => {
        it('should find user by OAuth ID', async () => {
            await User.create({
                username: 'searchuser',
                email: 'search@example.com',
                googleId: 'google_search_123',
            });

            const found = await User.findOne({ googleId: 'google_search_123' });
            expect(found).toBeDefined();
            expect(found.username).toBe('searchuser');
        });

        it('should find user by email', async () => {
            await User.create({
                username: 'emailsearch',
                email: 'specific@example.com',
                discordId: 'discord_123',
            });

            const found = await User.findOne({ email: 'specific@example.com' });
            expect(found).toBeDefined();
            expect(found.discordId).toBe('discord_123');
        });

        it('should count total OAuth users by provider', async () => {
            await User.create({
                username: 'google1',
                email: 'g1@example.com',
                googleId: 'g1',
            });
            await User.create({
                username: 'google2',
                email: 'g2@example.com',
                googleId: 'g2',
            });
            await User.create({
                username: 'discord1',
                email: 'd1@example.com',
                discordId: 'd1',
            });

            const googleCount = await User.countDocuments({ googleId: { $exists: true, $ne: null } });
            const discordCount = await User.countDocuments({ discordId: { $exists: true, $ne: null } });

            expect(googleCount).toBe(2);
            expect(discordCount).toBe(1);
        });
    });
});

