const mongoose = require('mongoose')

const connect = async () => {
  process.env.NODE_ENV = 'test'

  if (mongoose.connection.readyState === 1) return

  if (mongoose.connection.readyState !== 0) {
    await mongoose.disconnect()
  }

  const uri = process.env.MONGO_URI
  if (!uri) {
    throw new Error('Global MONGO_URI is not defined. Ensure globalSetup is configured.')
  }

  await mongoose.connect(uri)

  for (const name of mongoose.modelNames()) {
    await mongoose.model(name).ensureIndexes()
  }
}

const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) return
  const collections = mongoose.connection.collections
  for (const key in collections) {
    await collections[key].deleteMany({})
  }
}

const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
}

module.exports = { connect, clearDatabase, disconnect }
