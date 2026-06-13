const LEAKY_BUCKET_SCRIPT = `
  local key = KEYS[1]
  local capacity = tonumber(ARGV[1])
  local leakRate = tonumber(ARGV[2])
  local now = tonumber(ARGV[3])
  
  local bucket = redis.call('HMGET', key, 'water', 'last_update')
  local water = tonumber(bucket[1]) or 0
  local last_update = tonumber(bucket[2]) or now
  
  local elapsedTime = math.max(0, now - last_update)
  local leaked = elapsedTime * leakRate
  water = math.max(0, water - leaked)
  
  if water + 1 <= capacity then
    redis.call('HMSET', key, 'water', water + 1, 'last_update', now)
    redis.call('EXPIRE', key, math.ceil(capacity / leakRate) + 2)
    return 1
  else
    return 0
  end
`;

const leakyBucketLimiter = (redisClient, { capacity, leakRate }) => {
  return async (req, res, next) => {
    try {
      const key = `ratelimit:leaky:${req.ip || req.connection.remoteAddress}`;
      const now = Date.now() / 1000;

      const allowed = await redisClient.eval(LEAKY_BUCKET_SCRIPT, {
        keys: [key],
        arguments: [capacity.toString(), leakRate.toString(), now.toString()]
      });

      if (allowed === 1) return next();
      
      return res.status(429).json({ error: 'Too Many Requests' });
    } catch (error) {
      console.error('[RateLimiter Error]', error);
      next(); 
    }
  };
};

module.exports = { leakyBucketLimiter };
