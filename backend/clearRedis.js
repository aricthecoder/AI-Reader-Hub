const Redis = require('ioredis');
require('dotenv').config({ path: __dirname + '/.env' });

async function clear() {
  const redis = new Redis(process.env.REDIS_URL);
  try {
    await redis.flushall();
    console.log("Redis cache cleared successfully!");
  } catch (err) {
    console.error("Error clearing Redis:", err);
  } finally {
    redis.quit();
  }
}

clear();
