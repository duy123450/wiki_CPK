const mongoose = require('mongoose');
const { MongoMemoryServer } = require('mongodb-memory-server');

let mongoServer;

const connect = async () => {
    process.env.NODE_ENV = 'test';

    if (mongoose.connection.readyState === 1) return;

    if (mongoose.connection.readyState !== 0) {
        await mongoose.disconnect();
    }

    mongoServer = await MongoMemoryServer.create();
    const uri = mongoServer.getUri();
    process.env.MONGO_URI = uri;

    await mongoose.connect(uri);

    for (const name of mongoose.modelNames()) {
        await mongoose.model(name).ensureIndexes();
    }
};

const clearDatabase = async () => {
    if (mongoose.connection.readyState !== 1) return;
    const collections = mongoose.connection.collections;
    for (const key in collections) {
        await collections[key].deleteMany({});
    }
};

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
