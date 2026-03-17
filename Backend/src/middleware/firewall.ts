import type { FastifyRequest, FastifyReply } from "fastify";
import { generateHash } from "../utils/utils.js";
import { redisClient } from "../services/redis.js";
import { logTransaction } from "../services/audit.js";

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

export const firewallHook = async (request: FastifyRequest, reply: FastifyReply) => {
  if (request.url.startsWith("/admin")) {
    return;
  }
  const decision = await analyzeRequest(request);
  if (!decision.allowed) {
    const resolvedAgentId =
      (request as any).agent?.id ?? (decision as any).agentId ?? "unknown";

    await logTransaction({
      type: "BLOCKED",
      url: request.url,
      agent_id: resolvedAgentId,
      success: false,
      message: decision.reason ?? "Unknown block reason",
    });
    return reply.code(403).send({
      error: "AgentGuard_Blocked",
      reason: decision.reason,
    });
  }
};
