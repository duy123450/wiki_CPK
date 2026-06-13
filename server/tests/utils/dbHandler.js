const mongoose = require('mongoose')

let indexesEnsured = false

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

  // Ensure each Jest worker gets its own database name so they can run in parallel without collisions
  const workerId = process.env.JEST_WORKER_ID || '1'
  const workerUri = uri.replace(/\/?$/, '') + `/testdb_${workerId}`

  await mongoose.connect(workerUri)

  // Ensure indexes only once per test session
  if (!indexesEnsured) {
    for (const name of mongoose.modelNames()) {
      try {
        await mongoose.model(name).ensureIndexes()
      } catch (error) {
        console.warn(`Warning: Could not ensure indexes for model ${name}:`, error.message)
      }
    }
    indexesEnsured = true
  }
}

const clearDatabase = async () => {
  if (mongoose.connection.readyState !== 1) return

  const modelNames = mongoose.modelNames()
  const deleteOps = []

  // Clear only model collections in parallel for speed
  for (const modelName of modelNames) {
    try {
      const model = mongoose.model(modelName)
      deleteOps.push(
        model.collection.deleteMany({}).catch(() => {
          // Silently ignore errors
        })
      )
    } catch (error) {
      // Ignore model errors
    }
  }

  // Execute all deletes in parallel
  if (deleteOps.length > 0) {
    await Promise.all(deleteOps)
  }
}

const disconnect = async () => {
  if (mongoose.connection.readyState !== 0) {
    await mongoose.connection.dropDatabase()
    await mongoose.disconnect()
  }
}

module.exports = { connect, clearDatabase, disconnect }
