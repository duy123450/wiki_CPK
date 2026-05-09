const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

/**
 * Spins up an in-memory MongoDB instance and connects Mongoose.
 * Reuses existing connection if already connected.
 * Call this in beforeAll().
 */
const connect = async () => {
    // Set env vars that the app needs
    process.env.JWT_ACCESS_SECRET = 'test-access-secret-key-for-jest';
    process.env.JWT_REFRESH_SECRET = 'test-refresh-secret-key-for-jest';
    process.env.JWT_ACCESS_LIFETIME = '15m';
    process.env.JWT_REFRESH_LIFETIME = '30d';
    process.env.NODE_ENV = 'test';

    // If already connected, just return
    if (mongoose.connection.readyState === 1) {
        return;
    }

    // Close any lingering connections first
    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    await mongoose.connect(uri);

    // Ensure all indexes are built before tests run
    const modelNames = mongoose.modelNames();
    for (const name of modelNames) {
        await mongoose.model(name).ensureIndexes();
    }
};

/**
 * Drops all collections between tests for isolation.
 * Call this in afterEach().
 */
const clearDatabase = async () => {
    if (mongoose.connection.readyState !== 1) return;

    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

/**
 * Disconnects Mongoose and stops the in-memory server.
 * Call this in afterAll().
 */
const disconnect = async () => {
    if (mongoose.connection.readyState !== 0) {
        await mongoose.connection.dropDatabase();
        await mongoose.disconnect();
    }
    if (mongoServer) {
        await mongoServer.stop();
        mongoServer = null;
    }
};

module.exports = { connect, clearDatabase, disconnect };
