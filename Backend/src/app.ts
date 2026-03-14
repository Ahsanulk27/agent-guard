import Fastify from "fastify";
import { analyzeRequest } from "./middleware/firewall.js";
import { processPayment } from "./services/wallet.js";
import { createClient } from "redis";
import { logTransaction } from "./services/audit.js";
import type { Agent } from "./types/Agent.js";
import fastifyCors from "@fastify/cors";
import dotenv from "dotenv";
dotenv.config();

function generateApiKey() {
  const chars = "abcdefghijklmnopqrstuvwxyz0123456789";
  return `sk-ag-${Array.from(
    { length: 32 },
    () => chars[Math.floor(Math.random() * chars.length)],
  ).join("")}`;
}

export const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient.on("ready", () => console.log("Connected to Redis successfully!"));

await redisClient.connect();

const app = Fastify();

app.register(fastifyCors, {
  origin: process.env.FRONTEND_URL || true,
  methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
});

app.addHook("preHandler", async (request, reply) => {
  if (request.url.startsWith("/admin")) {
    return;
  }
  const decision = await analyzeRequest(request);
  if (!decision.allowed) {
    await logTransaction({
      type: "BLOCKED",
      url: request.url,
      agent_id: (request.headers["x-agent-id"] as string) ?? "unknown",
      success: false,
      message: decision.reason ?? "Unknown block reason",
    });
    return reply.code(403).send({
      error: "AgentGuard_Blocked",
      reason: decision.reason,
    });
  }
});

app.get("/admin/audit", async (request, reply) => {
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
});

app.post("/admin/top-up", async (request, reply) => {
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
});

app.patch("/admin/agent/:id/toggle-freeze", async (request, reply) => {
  const { id } = request.params as {id: string};
  const { status } = request.body as {status: 'active' | 'frozen'};
  const key = `agent:${id}`;
  const rawData = await redisClient.get(key);
  if (!rawData){
    return reply.code(404).send({error: "Agent not found"});
  }
  const agent: Agent = JSON.parse(rawData);
  agent.status = status;
  await redisClient.set(key, JSON.stringify(agent));
  await logTransaction({
    type: "INFO",
    url: "INTERNAL",
    agent_id: id,
    success: true,
    message: `Agent status updated to ${status}`
  })
  return reply.send(agent);

})

app.post("/admin/agent/:id/regenerate-key", async (request, reply) => {
  const { id } = request.params as { id: string };
  const key = `agent:${id}`;
  const rawData = await redisClient.get(key);
  if (!rawData) {
    return reply.code(404).send({error: "Agent not found"});
  }
  const agent: Agent = JSON.parse(rawData);
  agent.apiKey = generateApiKey();
  await redisClient.set(key, JSON.stringify(agent));
  await logTransaction({
    type: "INFO",
    url: "INTERNAL",
    agent_id: id,
    success: true,
    message: `API Key rotated`
  }
  )
  return reply.send(agent);
})

app.get("/admin/stats", async (request, reply) => {
  const keys = await redisClient.keys("agent:*");
  const agents = await Promise.all(
    keys.map(async (key) => JSON.parse((await redisClient.get(key)) || "{}")),
  );
  return reply.send(agents);
});

app.post("/admin/register", async (request, reply) => {
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

  await logTransaction({
    type: "SYSTEM_REGISTRATION",
    url: "INTERNAL",
    agent_id: id,
    amount: initialBudget || 0,
    success: true,
  });

  await redisClient.set(key, JSON.stringify(newAgent));
  return reply.code(201).send(newAgent);
});

app.route({
  method: ["GET", "POST", "PUT", "PATCH", "DELETE"],
  url: "/*",
  handler: async (request, reply) => {
    const MOCK_UPSTREAM = "http://localhost:4000";
    const targetUrl = `${MOCK_UPSTREAM}${request.url}`;

    const performRequest = async (useToken = false) => {
      const headers: any = {
        "Content-Type": "application/json",
      };

      if (useToken) {
        headers["x-agentguard-pay-token"] = "paid";
      }

      return await fetch(targetUrl, {
        method: request.method,
        headers: headers,
        body: ["POST", "PUT", "PATCH"].includes(request.method)
          ? JSON.stringify(request.body)
          : null,
      });
    };

    let response = await performRequest();
    let data = await response.json();

    if (response.status === 402) {
      const agent_id = request.headers["x-agent-id"] as string;
      const invoice = data.invoice;
      const payment = await processPayment(agent_id, invoice);
      if (!payment.success) {
        const isLimitExceeded =
          payment.reason === "AMOUNT_EXCEEDS_LIMIT";
        const errorCode = isLimitExceeded
          ? "AgentGuard_Limit_Exceeded"
          : "AgentGuard_Insufficient_Budget";
        const errorMessage = isLimitExceeded
          ? `Request of ${invoice.amount_due} exceeds your safety cap.`
          : `Agent ${agent_id} has insufficient funds.`;

        await logTransaction({
          type: "BLOCKED",
          url: request.url,
          agent_id: agent_id,
          amount: invoice.amount_due,
          success: false,
          message: errorMessage,
        });
        return reply.code(403).send({
          error: errorCode,
          message: errorMessage,
          invoice: invoice,
        });
      }
      await logTransaction({
        type: "PAYMENT",
        url: request.url,
        agent_id: agent_id,
        amount: invoice.amount_due,
        success: true,
        message: `Auto-negotiated x402 payment for ${invoice.amount_due} ${invoice.currency}`,
      });

      response = await performRequest(true);
      data = await response.json();
    }

    return reply.code(response.status).send(data);
  },
});

app.listen({ port: 3000 }, () => {
  console.log("AgentGuard running on http://localhost:3000");
});
