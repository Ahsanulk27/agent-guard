import type { FastifyRequest } from "fastify";
import { generateHash } from "../utils/utils.js";
import { redisClient } from "../app.js";

export const analyzeRequest = async (request: FastifyRequest) => {
  const { method, url, body } = request;
  const authHeaders = request.headers["authorization"];
  const apiKey = authHeaders?.replace("Bearer ", "");
  console.log(`[INCOMING], ${method}, ${url}`);

  if (!apiKey) {
    return { allowed: false, reason: "Missing API key" };
  }

  const agentId = await redisClient.get(`apiKey:${apiKey}`);
  if (!agentId) {
    return { allowed: false, reason: "Invalid API key" };
  }

  const agentRawData = await redisClient.get(`agent:${agentId}`);
  const agent = JSON.parse(agentRawData || "{}");
  (request as any).agent = agent;

  if (agent.status === "frozen") {
    return { allowed: false, reason: "Agent is frozen", agentId };
  }

  if (method === "POST" && !body) {
    return { allowed: false, reason: "Empty payload detected", agentId };
  }

  const hash = generateHash({ body });
  const key = `loop:${agentId}:${hash}`;
  const count = await redisClient.incr(key);
  if (count === 1) {
    await redisClient.expire(key, agent.loopDetectionWindow ?? 60);
  }

  if (count > (agent.maxIdenticalRequests ?? 3)) {
    return {
      allowed: false,
      reason: "Repeated request detected, possible loop",
      agentId,
    };
  }

  return { allowed: true, key };
};
