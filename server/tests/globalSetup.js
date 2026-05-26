const { MongoMemoryServer } = require('mongodb-memory-server')

module.exports = async () => {
  // Start shared MongoDB memory server
  const mongoServer = await MongoMemoryServer.create()
  globalThis.__MONGOD__ = mongoServer
  process.env.MONGO_URI = mongoServer.getUri()
}
