module.exports = {
    testEnvironment: 'node',
    testTimeout: 30000,
    verbose: true,
    forceExit: true,
    detectOpenHandles: true,

    testMatch: [
        '**/tests/**/*.test.js',
    ],
    collectCoverageFrom: [
        'services/**/*.js',
        'middleware/**/*.js',
        'errors/**/*.js',
        'controllers/**/*.js',
        '!**/node_modules/**',
    ],
    coverageThreshold: {
        global: {
            branches: 70,
            functions: 80,
            lines: 80,
            statements: 80,
        },
    },
};
