import type { FastifyRequest } from "fastify";
import { generateHash } from "../utils/utils.js";
import { redisClient } from "../app.js";

export const analyzeRequest = async (request: FastifyRequest) => {
  const { method, url, body } = request;
  console.log(`[INCOMING], ${method}, ${url}`);

  if (method === "POST" && !body) {
    return { allowed: false, reason: "Empty payload detected" };
  }

  const hash = generateHash({ body });

  const key = `loop:${hash}`;
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, 60);
  }
  if (count > 3) {
    return {
      allowed: false,
      reason: "Repeated request detected, possible loop",
    };
  }

  return { allowed: true, key };
};
