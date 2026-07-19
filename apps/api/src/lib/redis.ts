import { createClient } from "redis";
import redisConfig from "../config/redis.js";

const redis = createClient({
  socket: {
    host: redisConfig.host,
    port: Number(redisConfig.port),
    connectTimeout: 20000,
    reconnectStrategy: (retries) => {
      if (retries > 10) {
        return new Error('Retry time exhausted');
      }
      return Math.min(retries * 200, 3000);
    },
  },
});

redis.on("error", (err) => {
  console.error("Redis error:", err);
});

redis.connect().catch(err => console.error('Redis connection failed:', err));

export default redis;
