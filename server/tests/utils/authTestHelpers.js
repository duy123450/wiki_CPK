/**
 * OAuth & Auth Test Helpers
 * Shared mock profile builders for all OAuth providers
 */

const { randomUUID } = require('crypto');

/**
 * Helper to generate random email
 */
const randomEmail = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789';
    let email = '';
    for (let i = 0; i < 8; i++) {
        email += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return `${email}@test.example.com`;
};

/**
 * Helper to generate random username
 */
const randomUsername = () => {
    const chars = 'abcdefghijklmnopqrstuvwxyz0123456789_';
    let username = '';
    for (let i = 0; i < 10; i++) {
        username += chars.charAt(Math.floor(Math.random() * chars.length));
    }
    return username;
};

/**
 * Mock Google OAuth profile
 */
function buildGoogleProfile(overrides = {}) {
    return {
        id: `google_${randomUUID()}`,
        displayName: `Test User ${Math.random().toString(36).substr(2, 5)}`,
        emails: [{ value: randomEmail() }],
        photos: [{ value: 'https://example.com/photo.jpg' }],
        ...overrides,
    };
}

/**
 * Mock Discord OAuth profile
 */
function buildDiscordProfile(overrides = {}) {
    return {
        id: `discord_${randomUUID()}`,
        username: randomUsername(),
        email: randomEmail(),
        avatar: randomUUID(),
        verified: true,
        ...overrides,
    };
}

/**
 * Mock GitHub OAuth profile
 */
function buildGitHubProfile(overrides = {}) {
    return {
        id: randomUUID(),
        username: randomUsername(),
        emails: [{ value: randomEmail() }],
        photos: [{ value: 'https://avatars.githubusercontent.com/u/123456' }],
        displayName: `Test User ${Math.random().toString(36).substr(2, 5)}`,
        ...overrides,
    };
}

/**
 * Mock Twitter/X OAuth profile
 */
function buildTwitterProfile(overrides = {}) {
    // Handle nested data structure from some callers
    if (overrides.data) {
        // If caller passes nested data, flatten it to top-level profile properties
        const { data, ...rest } = overrides;
        const { name, ...dataRest } = data;
        return {
            id: `twitter_${randomUUID()}`,
            displayName: name || `Test User ${Math.random().toString(36).substr(2, 5)}`,
            username: randomUsername(),
            photos: [{ value: 'https://pbs.twimg.com/profile_images/photo.jpg' }],
            ...dataRest,
            ...rest,
        };
    }

    // Standard flat structure
    return {
        id: `twitter_${randomUUID()}`,
        displayName: `Test User ${Math.random().toString(36).substr(2, 5)}`,
        username: randomUsername(),
        photos: [{ value: 'https://pbs.twimg.com/profile_images/photo.jpg' }],
        ...overrides,
    };
}

/**
 * Create a mock JWT payload
 */
function buildJWTPayload(user = {}, overrides = {}) {
    const defaultUser = {
        _id: randomUUID(),
        email: randomEmail(),
        username: randomUsername(),
        roles: ['user'],
        ...user,
    };

    return {
        userId: defaultUser._id,
        email: defaultUser.email,
        roles: defaultUser.roles,
        iat: Math.floor(Date.now() / 1000),
        exp: Math.floor(Date.now() / 1000) + 900, // 15 minutes
        ...overrides,
    };
}

/**
 * Create mock user session
 */
function buildSessionData(userId = randomUUID(), overrides = {}) {
    return {
        userId,
        loggedIn: true,
        lastActivity: Date.now(),
        ip: `192.168.1.${Math.floor(Math.random() * 255)}`,
        userAgent: 'Mozilla/5.0 (Test)',
        ...overrides,
    };
}

module.exports = {
    buildGoogleProfile,
    buildDiscordProfile,
    buildGitHubProfile,
    buildTwitterProfile,
    buildJWTPayload,
    buildSessionData,
};
