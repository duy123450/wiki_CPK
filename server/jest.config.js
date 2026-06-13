const os = require('os')

module.exports = {
  testEnvironment: 'node',
  testTimeout: 30000,
  verbose: false,
  // Run half the CPU cores — safe for DB-heavy integration tests with per-worker DBs
  maxWorkers: Math.max(2, Math.floor(os.cpus().length / 2)),
  setupFilesAfterEnv: ['./tests/setup.js'],
  globalSetup: './tests/globalSetup.js',
  globalTeardown: './tests/globalTeardown.js',

  testMatch: ['**/tests/**/*.test.js'],
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
}
