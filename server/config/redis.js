const { createClient } = require('redis')
const envConfig = require('./env.config')

const redisClient = createClient({
  url: envConfig.REDIS_URL,
})

redisClient.on('error', (err) => {
  console.error('Redis Client Error:', err.message)
  // We log the error but don't exit the process to allow graceful fallback/degradation
})

redisClient.on('connect', () => {
  console.log('Connected to Redis successfully')
})

const connectRedis = async () => {
  try {
    await redisClient.connect()
  } catch (err) {
    console.error('Could not connect to Redis:', err.message)
  }
}

// Call connect immediately
connectRedis()

module.exports = redisClient
