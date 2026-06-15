const { createClient } = require('redis')
const envConfig = require('./env.config')

const redisClient = createClient({
  url: envConfig.REDIS_URL,
  pingInterval: 10000,
  socket: {
    family: 4,
    tls: envConfig.REDIS_URL.startsWith('rediss://')
  }
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

if (envConfig.NODE_ENV !== 'test') {
  connectRedis()
} else {
  // Mock redis for tests
  redisClient.get = async () => null
  redisClient.setEx = async () => 'OK'
  redisClient.eval = async () => 1
  redisClient.isOpen = true
}

module.exports = redisClient
