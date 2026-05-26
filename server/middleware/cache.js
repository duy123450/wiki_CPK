const redisClient = require('../config/redis')

/**
 * Reusable middleware to cache GET responses.
 * @param {string} prefix - The group of the cache (e.g., 'characters', 'soundtracks')
 * @param {number} ttlSeconds - Time to live in seconds (default: 3600)
 */
const cacheData = (prefix, ttlSeconds = 3600) => {
  return async (req, res, next) => {
    if (process.env.NODE_ENV === 'test') {
      return next()
    }

    // Only cache GET requests
    if (req.method !== 'GET') {
      return next()
    }

    // Ensure Redis is connected before trying to use it
    if (!redisClient.isReady) {
      return next()
    }

    const key = `cache:${prefix}:${req.originalUrl}`

    try {
      const cachedResponse = await redisClient.get(key)
      if (cachedResponse) {
        return res.status(200).json(JSON.parse(cachedResponse))
      }

      // Overwrite res.json to capture the response and save it to Redis
      const originalJson = res.json.bind(res)
      res.json = (body) => {
        // Asynchronously save to Redis, then call original json
        if (res.statusCode >= 200 && res.statusCode < 300) {
          redisClient.setEx(key, ttlSeconds, JSON.stringify(body)).catch((err) => {
            console.error(`Redis setEx error for key ${key}:`, err.message)
          })
        }
        originalJson(body)
      }
      next()
    } catch (error) {
      console.error(`Redis GET error for key ${key}:`, error.message)
      next()
    }
  }
}

/**
 * Middleware to invalidate a specific cache group whenever a mutation occurs.
 * @param {string} prefix - The group of the cache to invalidate (e.g., 'characters')
 */
const invalidateCache = (prefix) => {
  return async (req, res, next) => {
    // We execute next() immediately so we don't block the actual mutation
    next()

    if (process.env.NODE_ENV === 'test') {
      return
    }

    if (!redisClient.isReady) {
      return
    }

    try {
      const pattern = `cache:${prefix}:*`
      let cursor = 0
      let deletedCount = 0

      do {
        const result = await redisClient.scan(cursor, {
          MATCH: pattern,
          COUNT: 100
        })
        cursor = result.cursor

        if (result.keys.length > 0) {
          await redisClient.del(result.keys)
          deletedCount += result.keys.length
        }
      } while (cursor !== 0)

      if (deletedCount > 0) {
        console.log(`Invalidated ${deletedCount} cache keys for prefix: ${prefix}`)
      }
    } catch (error) {
      console.error(`Redis invalidate error for prefix ${prefix}:`, error.message)
    }
  }
}

module.exports = {
  cacheData,
  invalidateCache,
}
