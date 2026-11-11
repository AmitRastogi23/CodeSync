import Redis from "ioredis";

const redis = new Redis(process.env.REDIS_URL, {
  tls: {
    rejectUnauthorized: false,
  },
});

redis.on("connect", () => console.log("✅ Redis Connected"));
redis.on("error", (err) => console.log("❌ Redis Error", err));

export default redis;
