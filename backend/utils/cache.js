const Redis = require('ioredis');

const CACHE_TTL_SECONDS = 60 * 60; // 1 hour

// Initialize Redis if URL is provided in .env
let redis = null;
if (process.env.REDIS_URL) {
  try {
    redis = new Redis(process.env.REDIS_URL);
    redis.on('error', (err) => console.error('Redis Client Error', err));
    console.log('Redis cache initialized successfully.');
  } catch (err) {
    console.error('Failed to initialize Redis:', err);
  }
} else {
  console.log('No REDIS_URL found. Falling back to in-memory cache.');
}

// Fallback in-memory store
const memoryStore = new Map();

const get = async (key) => {
  if (redis) {
    try {
      const data = await redis.get(key);
      if (data) return JSON.parse(data);
      return null;
    } catch (err) {
      console.error('Redis GET error:', err);
      // Fail gracefully and check memory
    }
  }

  // Fallback
  const entry = memoryStore.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    memoryStore.delete(key);
    return null;
  }
  return entry.data;
};

const set = async (key, data) => {
  if (redis) {
    try {
      await redis.set(key, JSON.stringify(data), 'EX', CACHE_TTL_SECONDS);
      return;
    } catch (err) {
      console.error('Redis SET error:', err);
    }
  }

  // Fallback
  memoryStore.set(key, { data, expiresAt: Date.now() + (CACHE_TTL_SECONDS * 1000) });
};

const clear = async () => {
  if (redis) {
    try {
      await redis.flushdb();
    } catch (err) {
      console.error('Redis FLUSHDB error:', err);
    }
  }
  memoryStore.clear();
};

module.exports = { get, set, clear };
