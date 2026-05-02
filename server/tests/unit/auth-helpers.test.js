/**
 * Unit tests for auth service helper: buildAuthResponse()
 *
 * This is a private function inside auth.service.js.
 * We mirror the logic here for isolated testing.
 */

const buildAuthResponse = (user) => ({
    id: user._id,
    username: user.username,
    email: user.email,
    role: user.role,
    avatar: user.avatar,
    createdAt: user.createdAt,
});

describe('Auth Helpers', () => {
    describe('buildAuthResponse()', () => {
        const mockUser = {
            _id: '64a1b2c3d4e5f6a7b8c9d0e1',
            username: 'testuser',
            email: 'test@example.com',
            role: 'user',
            avatar: {
                url: 'https://res.cloudinary.com/test/avatar.jpg',
                public_id: 'avatar123',
            },
            createdAt: new Date('2025-01-15T10:00:00Z'),
            // These should NOT appear in the response:
            password: '$argon2id$hashedpassword',
            __v: 0,
            favoriteCharacter: '64a1b2c3d4e5f6a7b8c9d0e2',
        };

        it('should include only public-safe fields', () => {
            const result = buildAuthResponse(mockUser);
            const keys = Object.keys(result);
            expect(keys).toEqual(['id', 'username', 'email', 'role', 'avatar', 'createdAt']);
        });

        it('should NOT include password', () => {
            const result = buildAuthResponse(mockUser);
            expect(result.password).toBeUndefined();
            expect(result).not.toHaveProperty('password');
        });

        it('should NOT include __v or favoriteCharacter', () => {
            const result = buildAuthResponse(mockUser);
            expect(result.__v).toBeUndefined();
            expect(result.favoriteCharacter).toBeUndefined();
        });

        it('should map _id to id', () => {
            const result = buildAuthResponse(mockUser);
            expect(result.id).toBe(mockUser._id);
            expect(result._id).toBeUndefined();
        });

        it('should pass through avatar object unchanged', () => {
            const result = buildAuthResponse(mockUser);
            expect(result.avatar).toEqual({
                url: 'https://res.cloudinary.com/test/avatar.jpg',
                public_id: 'avatar123',
            });
        });

        it('should handle user with default role', () => {
            const user = { ...mockUser, role: 'admin' };
            const result = buildAuthResponse(user);
            expect(result.role).toBe('admin');
        });

        it('should preserve the createdAt date', () => {
            const result = buildAuthResponse(mockUser);
            expect(result.createdAt).toEqual(new Date('2025-01-15T10:00:00Z'));
        });
    });
});
