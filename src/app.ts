import Fastify from "fastify";
import { analyzeRequest } from "./middleware/firewall.js";
import { processPayment } from "./services/wallet.js";
import { createClient } from "redis";
import { logTransaction } from "./services/audit.js";

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

  if (!agent_id || !amount) {
    return reply.code(400).send({ error: "Missing agent_id or amount" });
  }

  const key = `budget:${agent_id}`;

  const newBalance = await redisClient.incrByFloat(key, amount);

  return reply.send({
    message: "Budget updated",
    agent_id,
    new_balance: newBalance,
  });
});

app.get("/admin/stats", async (request, reply) => {
  const keys = await redisClient.keys("budget:*");

  const stats = await Promise.all(
    keys.map(async (key) => {
      const balance = await redisClient.get(key);
      return {
        agent_id: key.replace("budget:", ""),
        balance: parseFloat(balance || "0"),
      };
    }),
  );

  return reply.send(stats);
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
