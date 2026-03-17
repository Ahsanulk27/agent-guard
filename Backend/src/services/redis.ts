import { createClient } from "redis";

export const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient.on("ready", () => console.log("Connected to Redis successfully!"));

export async function connectRedis() {
  if (!redisClient.isOpen) {
    await redisClient.connect();
  }
}
