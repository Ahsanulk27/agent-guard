import type {
  FastifyRequest,
  FastifyReply,
  FastifyTypeProvider,
} from "fastify";
import { redisClient } from "../services/redis.js";
import { logTransaction } from "../services/audit.js";
import type { Agent } from "../types/Agent.js";
import { generateApiKey } from "../utils/utils.js";

export async function getAllAuditEntries(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const entries = await redisClient.lRange("agent_audit_log", 0, -1);

  const parsed = entries.map((e) => JSON.parse(e));

  const normalized = parsed.map((entry: any) => {
    const eventType =
      entry.type === "BLOCKED"
        ? "BLOCK"
        : entry.type === "PAYMENT"
          ? "PAYMENT"
          : "INFO";

    return {
      id:
        entry.id ??
        `audit_${new Date(entry.timestamp || Date.now()).getTime()}_${Math.random().toString(36).slice(2, 6)}`,
      timestamp: entry.timestamp,
      agentId: entry.agent_id ?? "system",
      eventType,
      message: entry.message ?? `${entry.type} · ${entry.url}`,
      amount: entry.amount ?? 0,
      type: entry.type,
      agent_id: entry.agent_id,
      url: entry.url,
      success: entry.success,
    };
  });

  return reply.send(normalized);
}

export async function getStats(request: FastifyRequest, reply: FastifyReply) {
  const keys = await redisClient.keys("agent:*");
  const agents = await Promise.all(
    keys.map(async (key) => {
      const rawData = await redisClient.get(key);
      const agent = JSON.parse(rawData || "{}");
      return {
        ...agent,
        // apiKey: `sk-ag-****${agent.apiKey.slice(-4)}`,
      };
    }),
  );

  return reply.send(agents);
}

export async function registerAgent(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const {
    id,
    name,
    initialBudget,
    maxPerRequest,
    loopDetectionWindow,
    maxIdenticalRequests,
  } = request.body as any;

  const key = `agent:${id}`;
  if (await redisClient.exists(key)) {
    return reply.code(409).send({ error: "Agent already exists" });
  }
  const newAgent: Agent = {
    id,
    name: name || id,
    status: "active",
    totalBudget: initialBudget || 0,
    spentBudget: 0,
    maxPerRequest: maxPerRequest || 0.5, // Default safety cap
    apiKey: generateApiKey(),
    loopDetectionWindow: loopDetectionWindow || 60,
    maxIdenticalRequests: maxIdenticalRequests || 3,
    createdAt: new Date().toISOString(),
  };

  const apiKeyLookupKey = `apiKey:${newAgent.apiKey}`;

  await logTransaction({
    type: "SYSTEM_REGISTRATION",
    url: "INTERNAL",
    agent_id: id,
    amount: initialBudget || 0,
    success: true,
  });

  await redisClient.set(key, JSON.stringify(newAgent));
  await redisClient.set(apiKeyLookupKey, id);
  return reply.code(201).send(newAgent);
}

export async function topUpAgent(request: FastifyRequest, reply: FastifyReply) {
  const { agent_id, amount } = request.body as {
    agent_id: string;
    amount: number;
  };

  if (!agent_id || amount === undefined) {
    return reply.code(400).send({ error: "Missing agent_id or amount" });
  }

  const key = `agent:${agent_id}`;
  const rawData = await redisClient.get(key);

  if (!rawData) {
    return reply.code(404).send({ error: "Agent not found" });
  }

  const agent: Agent = JSON.parse(rawData);
  agent.totalBudget += amount;

  await redisClient.set(key, JSON.stringify(agent));
  await logTransaction({
    type: "TOP_UP",
    url: "INTERNAL",
    agent_id: agent_id,
    amount: amount,
    success: true,
  });

  return reply.send({ message: "Budget updated", agent });
}

export async function toggleFreezeAgent(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const { status } = request.body as { status: "active" | "frozen" };
  const key = `agent:${id}`;
  const rawData = await redisClient.get(key);
  if (!rawData) {
    return reply.code(404).send({ error: "Agent not found" });
  }
  const agent: Agent = JSON.parse(rawData);
  agent.status = status;
  await redisClient.set(key, JSON.stringify(agent));
  await logTransaction({
    type: "INFO",
    url: "INTERNAL",
    agent_id: id,
    success: true,
    message: `Agent status updated to ${status}`,
  });
  return reply.send(agent);
}

export async function regenerateKey(
  request: FastifyRequest,
  reply: FastifyReply,
) {
  const { id } = request.params as { id: string };
  const key = `agent:${id}`;
  const rawData = await redisClient.get(key);
  if (!rawData) {
    return reply.code(404).send({ error: "Agent not found" });
  }
  const agent: Agent = JSON.parse(rawData);
  const oldApiKey = agent.apiKey;
  const newApiKey = generateApiKey();
  await redisClient.del(`apiKey:${oldApiKey}`);
  agent.apiKey = newApiKey;
  await redisClient.set(key, JSON.stringify(agent));
  await redisClient.set(`apiKey:${newApiKey}`, id);
  await logTransaction({
    type: "INFO",
    url: "INTERNAL",
    agent_id: id,
    success: true,
    message: `API Key rotated`,
  });
  return reply.send(agent);
}
