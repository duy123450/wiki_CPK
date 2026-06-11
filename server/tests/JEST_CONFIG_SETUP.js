/**
 * Jest Configuration Snippet for Advanced Tests
 * Add to jest.config.js or package.json
 */

// jest.config.js (or add to existing config)
module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000, // Increase for concurrency tests
    setupFilesAfterEnv: ['./tests/setup.js'],
    collectCoverageFrom: [
        'modules/**/*.{js}',
        'middleware/**/*.{js}',
        '!**/*.test.js',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 70,
            lines: 70,
            statements: 70,
        },
    },
    testPathIgnorePatterns: ['/node_modules/'],
    testMatch: [
        '**/tests/unit/**/*.test.js',
        '**/tests/integration/**/*.test.js',
        '**/tests/security/**/*.test.js',
    ],
    moduleNameMapper: {
        '^@/(.*)$': '<rootDir>/$1',
    },
    transform: {
        '^.+\\.js$': ['babel-jest', { rootMode: 'upward' }],
    },
    verbose: true,
};

// package.json scripts
const scripts = {
    "scripts": {
        "test": "jest",
        "test:watch": "jest --watch",
        "test:unit": "jest tests/unit",
        "test:integration": "jest tests/integration",
        "test:security": "jest tests/security",
        "test:oauth": "jest oauth-contract.test.js",
        "test:concurrency": "jest redis-mongodb-concurrency.test.js",
        "test:lyric": "jest lyric-schema-boundary.test.js",
        "test:fuzzing": "jest redos-nosql-fuzzing.test.js",
        "test:coverage": "jest --coverage",
        "test:coverage:report": "jest --coverage && open coverage/lcov-report/index.html",
        "test:debug": "node --inspect-brk node_modules/.bin/jest --runInBand",
        "test:bail": "jest --bail",
        "test:verbose": "jest --verbose"
    }
}
