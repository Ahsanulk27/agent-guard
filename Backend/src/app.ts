import Fastify from "fastify";
import { analyzeRequest } from "./middleware/firewall.js";
import { processPayment } from "./services/wallet.js";
import { createClient } from "redis";
import { logTransaction } from "./services/audit.js";
import type { Agent } from "./types/Agent.js";

export const redisClient = createClient();

redisClient.on("error", (err) => console.log("Redis Client Error", err));

redisClient.on("ready", () => console.log("Connected to Redis successfully!"));

await redisClient.connect();

const app = Fastify();

app.addHook("preHandler", async (request, reply) => {
  const decision = await analyzeRequest(request);
  if (!decision.allowed) {
    await logTransaction({
      type: "BLOCKED",
      url: request.url,
      success: false,
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

  return reply.send(parsed);
});

app.post("/admin/budget", async (request, reply) => {
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

app.get("/admin/stats", async (request, reply) => {
  const keys = await redisClient.keys("agent:*");
  const agents = await Promise.all(
    keys.map(async (key) => JSON.parse((await redisClient.get(key)) || "{}")),
  );
  return reply.send(agents);
});

app.post("/admin/register", async (request, reply) => {
  const { id, name, initialBudget, maxPerRequest } = request.body as any;

  const key = `agent:${id}`;
  if (await redisClient.exists(key)) {
    return reply.code(409).send({ error: "Agent already exists" });
  }
  const newAgent: Agent = {
    id,
    name: name || id,
    status: "active",
    totalBudget: initialBudget || 0,
    maxPerRequest: maxPerRequest || 0.5, // Default safety cap
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

app.all("/*", async (request, reply) => {
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
    const paymentSuccess = await processPayment(agent_id, invoice);
    if (!paymentSuccess) {
      return reply.code(403).send({
        error: "AgentGuard_Insufficient_Budget",
        message: `Agent ${agent_id} has insufficient funds to cover this ${invoice.amount_due} request.`,
        invoice: invoice,
      });
    }
    await logTransaction({
      type: "PAYMENT",
      url: request.url,
      amount: invoice.amount_due,
      success: paymentSuccess,
    });

    if (paymentSuccess) {
      console.log(`[RETRY] Payment approved. Re-executing: ${request.url}`);

      response = await performRequest(true);
      data = await response.json();
    }
  }

  return reply.code(response.status).send(data);
});

app.listen({ port: 3000 }, () => {
  console.log("AgentGuard running on http://localhost:3000");
});
