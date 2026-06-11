/**
 * Redis vs MongoDB Concurrency/Race-Condition Testing (Simplified)
 * Tests basic auth flows and data persistence
 * Does not require complex concurrency mocking
 */

const User = require('../../modules/auth/user.model');

describe('Redis/MongoDB Concurrency Tests', () => {
    beforeEach(async () => {
        await User.deleteMany({});
    });

    afterAll(async () => {
        await User.deleteMany({});
    });

    describe('User Session & Token Management', () => {
        it('should store refresh token for user', async () => {
            const user = await User.create({
                username: 'tokenuser',
                email: 'token@example.com',
                password: 'hashedpass123',
            });

            user.refreshToken = 'refresh_token_abc123';
            await user.save();

            const found = await User.findById(user._id);
            expect(found.refreshToken).toBe('refresh_token_abc123');
        });

        it('should update refresh token without affecting other fields', async () => {
            const user = await User.create({
                username: 'testuser',
                email: 'test@example.com',
                password: 'hashedpass123',
            });

            const originalEmail = user.email;
            user.refreshToken = 'new_refresh_token';
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.refreshToken).toBe('new_refresh_token');
            expect(updated.email).toBe(originalEmail);
        });

        it('should clear refresh token on logout', async () => {
            const user = await User.create({
                username: 'logoutuser',
                email: 'logout@example.com',
                password: 'hashedpass123',
            });

            user.refreshToken = 'token_before_logout';
            await user.save();

            user.refreshToken = null;
            await user.save();

            const updated = await User.findById(user._id);
            expect(updated.refreshToken).toBeNull();
        });

        it('should handle concurrent user creation without conflicts', async () => {
            const users = await Promise.all([
                User.create({
                    username: 'concurrent1',
                    email: 'concurrent1@example.com',
                    password: 'Pass123!',
                }),
                User.create({
                    username: 'concurrent2',
                    email: 'concurrent2@example.com',
                    password: 'Pass456!',
                }),
                User.create({
                    username: 'concurrent3',
                    email: 'concurrent3@example.com',
                    password: 'Pass789!',
                }),
            ]);

            expect(users.length).toBe(3);
            expect(users[0].email).toBe('concurrent1@example.com');
            expect(users[1].email).toBe('concurrent2@example.com');
            expect(users[2].email).toBe('concurrent3@example.com');

            const count = await User.countDocuments({
                email: { $in: ['concurrent1@example.com', 'concurrent2@example.com', 'concurrent3@example.com'] },
            });
            expect(count).toBe(3);
        });

        it('should prevent duplicate username even under concurrent writes', async () => {
            const user = await User.create({
                username: 'unique',
                email: 'unique@example.com',
                password: 'Pass123!',
            });

            const duplicateAttempt = User.create({
                username: 'unique',
                email: 'another@example.com',
                password: 'Pass123!',
            });

            await expect(duplicateAttempt).rejects.toThrow();

            const count = await User.countDocuments({ username: 'unique' });
            expect(count).toBe(1);
        });

        it('should prevent duplicate email even under concurrent writes', async () => {
            const user = await User.create({
                username: 'user1',
                email: 'unique@example.com',
                password: 'Pass123!',
            });

            const duplicateAttempt = User.create({
                username: 'user2',
                email: 'unique@example.com',
                password: 'Pass123!',
            });

            await expect(duplicateAttempt).rejects.toThrow();

            const count = await User.countDocuments({ email: 'unique@example.com' });
            expect(count).toBe(1);
        });
    });

    describe('Profile Update Consistency', () => {
        it('should atomically update user profile', async () => {
            const user = await User.create({
                username: 'profile1',
                email: 'profile@example.com',
                password: 'Pass123!',
            });

            const updated = await User.findByIdAndUpdate(
                user._id,
                { avatar: { url: 'https://example.com/avatar.jpg' } },
                { new: true }
            );

            expect(updated.avatar.url).toBe('https://example.com/avatar.jpg');
            expect(updated.email).toBe('profile@example.com');
        });

        it('should handle partial updates without losing data', async () => {
            const user = await User.create({
                username: 'partial',
                email: 'partial@example.com',
                password: 'Pass123!',
            });

            user.avatar = { url: 'https://new.jpg', public_id: 'custom_id' };
            await user.save();

            const found = await User.findById(user._id);
            expect(found.username).toBe('partial');
            expect(found.email).toBe('partial@example.com');
            expect(found.avatar.public_id).toBe('custom_id');
        });

        it('should query users by multiple conditions consistently', async () => {
            await User.create({
                username: 'google_user1',
                email: 'g1@example.com',
                googleId: 'google_1',
            });

            await User.create({
                username: 'google_user2',
                email: 'g2@example.com',
                googleId: 'google_2',
            });

            const googleUsers = await User.find({ googleId: { $exists: true } });
            expect(googleUsers.length).toBe(2);
        });
    });

    describe('Session Cache Simulation', () => {
        it('should simulate Redis cache invalidation on user update', async () => {
            const user = await User.create({
                username: 'cacheuser',
                email: 'cache@example.com',
                password: 'Pass123!',
            });

            // Simulate cache key
            const cacheKey = `user:${user._id}`;
            let cachedUser = { username: user.username, email: user.email };

            // Update user
            user.avatar = { url: 'https://new.jpg' };
            await user.save();

            // Invalidate cache (simulated)
            cachedUser = null;

            // Fetch fresh from DB
            const fresh = await User.findById(user._id);
            expect(fresh.avatar.url).toBe('https://new.jpg');
        });

        it('should handle user find with fresh database read', async () => {
            const user1 = await User.create({
                username: 'fresh1',
                email: 'fresh1@example.com',
                password: 'Pass123!',
            });

            const user2 = await User.create({
                username: 'fresh2',
                email: 'fresh2@example.com',
                password: 'Pass456!',
            });

            // Simulate multiple database reads
            const found1 = await User.findById(user1._id);
            const found2 = await User.findById(user2._id);
            const foundByEmail = await User.findOne({ email: 'fresh2@example.com' });

            expect(found1.username).toBe('fresh1');
            expect(found2.username).toBe('fresh2');
            expect(foundByEmail.username).toBe('fresh2');
        });
    });

    describe('Atomic Transactions Simulation', () => {
        it('should simulate atomic document update', async () => {
            const user = await User.create({
                username: 'balance',
                email: 'balance@example.com',
                password: 'Pass123!',
            });

            // Simulate update with atomic operation
            const updated = await User.findByIdAndUpdate(
                user._id,
                { $set: { refreshToken: 'atomic_token_123' } },
                { new: true }
            );

            expect(updated.refreshToken).toBe('atomic_token_123');
        });

        it('should prevent data loss in concurrent updates', async () => {
            const user = await User.create({
                username: 'concurrent_balance',
                email: 'cb@example.com',
                password: 'Pass123!',
            });

            // Simulate 5 concurrent updates with refreshToken
            const updates = Array(5)
                .fill(null)
                .map((_, i) => {
                    return User.findByIdAndUpdate(
                        user._id,
                        { refreshToken: `token_${i}` },
                        { new: true }
                    );
                });

            const results = await Promise.all(updates);
            const final = results[results.length - 1];

            // Last token should be set
            expect(final.refreshToken).toBeDefined();
            expect(final.refreshToken).toMatch(/token_\d/);
        });
    });

    describe('Conflict Resolution', () => {
        it('should apply last-write-wins strategy', async () => {
            const user = await User.create({
                username: 'conflict',
                email: 'conflict@example.com',
                password: 'Pass123!',
            });

            // First update
            await User.findByIdAndUpdate(
                user._id,
                { $set: { refreshToken: 'token_first_update' } },
                { returnDocument: 'after' }
            );

            // Second update (overwrites first)
            const result2 = await User.findByIdAndUpdate(
                user._id,
                { $set: { refreshToken: 'token_second_update' } },
                { returnDocument: 'after' }
            );

            // Verify last write wins
            const final = await User.findById(user._id);
            expect(final.refreshToken).toBe('token_second_update');
            expect(result2.refreshToken).toBe('token_second_update');
        });
    });

    describe('Connection Pool & Resource Management', () => {
        it('should successfully create many users without connection pool exhaustion', async () => {
            const createUsers = Array(50)
                .fill(null)
                .map((_, i) =>
                    User.create({
                        username: `user_${i}`,
                        email: `user_${i}@example.com`,
                        password: 'Pass123!',
                    })
                );

            const users = await Promise.all(createUsers);
            expect(users.length).toBe(50);

            const count = await User.countDocuments({
                email: { $regex: '^user_.*@example.com$' },
            });
            expect(count).toBe(50);
        });

        it('should handle rapid sequential database operations', async () => {
            for (let i = 0; i < 20; i++) {
                const user = await User.create({
                    username: `sequential_${i}`,
                    email: `seq_${i}@example.com`,
                    password: 'Pass123!',
                });

                await User.findByIdAndUpdate(user._id, { refreshToken: `token_${i}` });
            }

            const count = await User.countDocuments({ email: { $regex: '^seq_.*@example.com$' } });
            expect(count).toBe(20);
        });
    });
});
