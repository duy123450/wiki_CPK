const { connect, clearDatabase, disconnect } = require('./utils/dbHandler')
const redisClient = require('../config/redis')

beforeAll(async () => {
  await connect()
})

afterEach(async () => {
  await clearDatabase()
  try {
    if (redisClient.isOpen) {
      await redisClient.flushAll()
    }
  } catch (err) {
    // Ignore redis connection issues during tests
  }
})

afterAll(async () => {
  await disconnect()
  try {
    if (redisClient.isOpen) {
      await redisClient.quit()
    }
  } catch (err) {
    // Ignore
  }
})
